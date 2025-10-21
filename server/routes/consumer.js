const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Delivery = require('../models/Delivery');
const User = require('../models/User');
const Product = require('../models/Product');

// Get consumer dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's orders
    const orders = await Order.find({ customer: userId })
      .populate('distributor', 'name email phone')
      .sort({ createdAt: -1 });

    // Get user's deliveries
    const deliveries = await Delivery.find({ customer: userId })
      .populate('distributor', 'name email phone')
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        orders: orders.slice(0, 5), // Last 5 orders
        deliveries: deliveries.slice(0, 5), // Last 5 deliveries
        totalOrders: orders.length,
        totalDeliveries: deliveries.length
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get consumer's orders
router.get('/orders', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's orders (non-subscription orders)
    const orders = await Order.find({
      customer: userId,
      isSubscription: { $ne: true }
    })
      .populate('distributor', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get consumer's deliveries
router.get('/deliveries', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's deliveries
    const deliveries = await Delivery.find({ customer: userId })
      .populate('distributor', 'name email phone')
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: deliveries
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deliveries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available products from assigned distributor
router.get('/products', auth, async (req, res) => {
  try {
    // Get the consumer with assigned distributor
    const consumer = await User.findById(req.user._id).populate('assignedDistributor');

    if (!consumer) {
      return res.status(404).json({
        success: false,
        message: 'Consumer not found'
      });
    }

    if (!consumer.assignedDistributor) {
      return res.status(400).json({
        success: false,
        message: 'No distributor assigned to your account. Please contact support.'
      });
    }

    // Get products from assigned distributor
    const products = await Product.find({
      createdBy: consumer.assignedDistributor._id,
      isActive: true
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Place new order
router.post('/orders', auth, async (req, res) => {
  try {
    const {
      products,
      deliveryDate,
      deliveryTime = 'morning',
      deliveryAddress,
      specialInstructions = '',
      isSubscription = false,
      subscriptionDetails = {}
    } = req.body;

    // Input validation
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required and cannot be empty'
      });
    }

    // Get the consumer with assigned distributor
    const consumer = await User.findById(req.user._id).populate('assignedDistributor');

    if (!consumer) {
      return res.status(404).json({
        success: false,
        message: 'Consumer not found'
      });
    }

    if (!consumer.assignedDistributor) {
      return res.status(400).json({
        success: false,
        message: 'No distributor assigned to your account. Please contact support.'
      });
    }

    // Get the assigned distributor's products
    const distributorProducts = await Product.find({
      _id: { $in: products.map(p => p.productId) },
      createdBy: consumer.assignedDistributor._id,
      isActive: true
    });

    // Check if all requested products exist and belong to the distributor
    if (distributorProducts.length !== products.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products are not available from your assigned distributor'
      });
    }

    // Create a map of product IDs to their details for quick lookup
    const productMap = distributorProducts.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});

    // Validate quantities and calculate order items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of products) {
      const product = productMap[item.productId];
      if (!product) continue;

      const quantity = parseInt(item.quantity) || 1;

      // Validate quantity against product limits
      if (quantity < (product.minQuantity || 1)) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for ${product.name} is ${product.minQuantity}`
        });
      }

      if (product.maxQuantity && quantity > product.maxQuantity) {
        return res.status(400).json({
          success: false,
          message: `Maximum order quantity for ${product.name} is ${product.maxQuantity}`
        });
      }

      const itemTotal = product.price * quantity;

      orderItems.push({
        name: product.name,
        quantity,
        price: product.price,
        unit: product.unit,
        totalPrice: itemTotal
      });

      totalAmount += itemTotal;
    }

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid products in the order'
      });
    }

    // Get user with populated addresses
    const user = await User.findById(req.user._id)
      .populate({
        path: 'addresses',
        match: { isDefault: true }
      })
      .exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please log in again.'
      });
    }

    // Handle delivery address
    let finalDeliveryAddress = deliveryAddress;
    if (!finalDeliveryAddress && user.addresses && user.addresses.length > 0) {
      const defaultAddress = user.addresses[0];
      finalDeliveryAddress = {
        street: defaultAddress.street || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        pincode: defaultAddress.pincode || '',
        landmark: defaultAddress.landmark || ''
      };
    } else if (!finalDeliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }

    // Basic validation for required fields
    if (!deliveryDate) {
      return res.status(400).json({
        success: false,
        message: 'Delivery date is required'
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create the order
    const order = new Order({
      orderNumber,
      customer: user._id,
      distributor: consumer.assignedDistributor._id,
      products: orderItems,
      totalAmount,
      deliveryAddress: finalDeliveryAddress,
      deliveryDate,
      deliveryTime,
      specialInstructions,
      status: 'PENDING',
      isSubscription,
      subscriptionDetails: isSubscription ? subscriptionDetails : undefined
    });

    // Save the order
    await order.save();

    // Populate the distributor and customer details
    await order.populate('distributor', 'name email phone');
    await order.populate('customer', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all subscriptions
router.get('/subscriptions', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const Subscription = require('../models/Subscription');
    const subscriptions = await Subscription.find({
      customer: userId
    })
      .populate('distributor', 'name email phone')
      .populate('products.product', 'name price image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new subscription
router.post('/subscriptions', auth, async (req, res) => {
  try {
    const {
      products,
      frequency,
      startDate,
      endDate,
      deliveryTime = 'morning',
      deliveryAddress,
      specialInstructions = '',
      deliveryDays
    } = req.body;

    // Input validation
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Products array is required and cannot be empty'
      });
    }

    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Valid frequency is required (daily, weekly, or monthly)'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get the consumer with assigned distributor
    const consumer = await User.findById(req.user._id).populate('assignedDistributor');

    if (!consumer || !consumer.assignedDistributor) {
      return res.status(400).json({
        success: false,
        message: 'No distributor assigned to your account. Please contact support.'
      });
    }

    // Get the assigned distributor's products
    const distributorProducts = await Product.find({
      _id: { $in: products.map(p => p.productId) },
      createdBy: consumer.assignedDistributor._id,
      isActive: true
    });

    if (distributorProducts.length !== products.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products are not available from your assigned distributor'
      });
    }

    // Create product map
    const productMap = distributorProducts.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});

    // Prepare subscription products
    const subscriptionProducts = [];
    let totalAmount = 0;

    for (const item of products) {
      const product = productMap[item.productId];
      if (!product) continue;

      const quantity = parseInt(item.quantity) || 1;
      const itemTotal = product.price * quantity;

      subscriptionProducts.push({
        product: product._id,
        quantity,
        price: product.price,
        unit: product.unit || 'piece'
      });

      totalAmount += itemTotal;
    }

    // Get user with populated addresses
    const user = await User.findById(req.user._id)
      .populate({
        path: 'addresses',
        match: { isDefault: true }
      })
      .exec();

    // Handle delivery address
    let finalDeliveryAddress = deliveryAddress;
    if (!finalDeliveryAddress && user.addresses && user.addresses.length > 0) {
      const defaultAddress = user.addresses[0];
      finalDeliveryAddress = {
        street: defaultAddress.street || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        pincode: defaultAddress.pincode || '',
        landmark: defaultAddress.landmark || ''
      };
    } else if (!finalDeliveryAddress) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }

    // Create the subscription in the Subscription collection
    const Subscription = require('../models/Subscription');
    const subscription = new Subscription({
      customer: user._id,
      distributor: consumer.assignedDistributor._id,
      products: subscriptionProducts,
      frequency,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      nextDeliveryDate: new Date(startDate),
      deliveryTime,
      deliveryAddress: finalDeliveryAddress,
      specialInstructions,
      status: 'active',
      ...(deliveryDays && { deliveryDays })
    });

    await subscription.save();

    // Populate the distributor and customer details
    await subscription.populate('distributor', 'name email phone');
    await subscription.populate('customer', 'name email phone');
    await subscription.populate('products.product', 'name price image');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a subscription
router.put('/subscriptions/:subscriptionId', auth, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { deliveryTime, products, frequency, startDate, endDate, specialInstructions } = req.body;

    const Subscription = require('../models/Subscription');
    // Find the subscription and verify ownership
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Verify ownership
    if (subscription.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this subscription' });
    }

    // Update allowed fields
    if (deliveryTime) subscription.deliveryTime = deliveryTime;
    if (frequency) subscription.frequency = frequency;
    if (startDate) subscription.startDate = new Date(startDate);
    if (endDate) subscription.endDate = new Date(endDate);
    if (specialInstructions !== undefined) subscription.specialInstructions = specialInstructions;

    if (Array.isArray(products)) {
      const subscriptionProducts = products.map(p => ({
        product: p.productId || p.product,
        quantity: parseInt(p.quantity) || 1,
        price: parseFloat(p.price) || 0,
        unit: p.unit || 'piece'
      }));
      subscription.products = subscriptionProducts;
    }

    await subscription.save();

    // Populate before sending response
    await subscription.populate('products.product', 'name price image');
    await subscription.populate('distributor', 'name email phone');

    res.json({ success: true, data: subscription, message: 'Subscription updated successfully' });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
