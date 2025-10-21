const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const Product = require('../models/Product');

// @route   POST api/subscriptions
// @desc    Create a new subscription
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { products, subscriptionType, frequency, startDate, endDate, deliveryTime, specialInstructions, deliveryDays, deliveryDay } = req.body;

    // Validate products
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product is required' });
    }

    // Fetch product details and calculate total price
    let totalPrice = 0;
    const productDetails = [];
    
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}` 
        });
      }
      totalPrice += product.price * item.quantity;
      
      productDetails.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create subscription
    const subscription = new Subscription({
      user: userId,
      products: productDetails,
      subscriptionType,
      frequency: subscriptionType === 'custom' ? frequency : subscriptionType === 'monthly' ? 'monthly' : 'weekly',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      deliveryTime,
      specialInstructions,
      ...(deliveryDays && { deliveryDays }),
      ...(deliveryDay && { deliveryDay }),
      status: 'active',
      totalPrice
    });

    await subscription.save();

    // Update product quantities
    for (const item of products) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity } },
        { new: true }
      );
    }

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET api/subscriptions
// @desc    Get user's subscriptions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .populate('products.product', 'name price image')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET api/subscriptions/:id
// @desc    Get subscription by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('products.product', 'name price image');

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT api/subscriptions/:id
// @desc    Update a subscription
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      products, 
      subscriptionType, 
      frequency, 
      startDate, 
      endDate, 
      deliveryTime, 
      specialInstructions, 
      deliveryDays, 
      deliveryDay,
      status
    } = req.body;

    // Find the existing subscription
    let subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // If products are being updated, validate and calculate new total price
    if (products && Array.isArray(products)) {
      let totalPrice = 0;
      const productDetails = [];
      
      for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
        }
        
        // If quantity is being updated, check stock
        if (item.quantity) {
          const existingItem = subscription.products.find(p => p.product.toString() === item.productId);
          const quantityChange = existingItem ? (item.quantity - existingItem.quantity) : item.quantity;
          
          if (product.quantity < quantityChange) {
            return res.status(400).json({ 
              success: false, 
              message: `Insufficient stock for ${product.name}. Available: ${product.quantity}` 
            });
          }
          
          // Update product quantity
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { quantity: -quantityChange } },
            { new: true }
          );
        }
        
        totalPrice += product.price * (item.quantity || 1);
        productDetails.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price
        });
      }
      
      subscription.products = productDetails;
      subscription.totalPrice = totalPrice;
    }

    // Update other fields if provided
    if (subscriptionType) subscription.subscriptionType = subscriptionType;
    if (frequency) subscription.frequency = frequency;
    if (startDate) subscription.startDate = new Date(startDate);
    if (endDate) subscription.endDate = new Date(endDate);
    if (deliveryTime) subscription.deliveryTime = deliveryTime;
    if (specialInstructions !== undefined) subscription.specialInstructions = specialInstructions;
    if (deliveryDays) subscription.deliveryDays = deliveryDays;
    if (deliveryDay) subscription.deliveryDay = deliveryDay;
    if (status) subscription.status = status;
    
    // Recalculate next delivery date if needed
    if (['frequency', 'deliveryDays', 'deliveryDay', 'startDate', 'status'].some(field => req.body[field] !== undefined)) {
      if (subscription.status === 'active' && !subscription.nextDeliveryDate) {
        subscription.nextDeliveryDate = subscription.calculateNextDelivery();
      }
    }

    await subscription.save();
    
    // Populate product details for the response
    subscription = await subscription.populate('products.product', 'name price image').execPopulate();
    
    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT api/subscriptions/:id/resume
// @desc    Resume a paused subscription
// @access  Private
router.put('/:id/resume', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, status: 'paused' },
      { 
        status: 'active',
        nextDeliveryDate: new Date() // Set next delivery date to now or calculate next date
      },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found or not in paused state' 
      });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE api/subscriptions/:id
// @desc    Cancel a subscription
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // First find the subscription to check its current status
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subscription not found' 
      });
    }

    // Check if already cancelled
    if (subscription.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Subscription is already cancelled' 
      });
    }

    // Update the subscription status to cancelled
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        cancelledAt: new Date(),
        // Keep the next delivery date for reference, but it won't be used
        $unset: { nextDeliveryDate: 1 } 
      },
      { new: true }
    ).populate('products.product', 'name price');

    // Return the products to inventory if the subscription was active
    if (subscription.status === 'active') {
      for (const item of subscription.products) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: item.quantity } },
          { new: true }
        );
      }
    }

    res.json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      data: updatedSubscription 
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
