const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// Get all products for the logged-in distributor
router.get('/products', auth, async (req, res) => {
  try {
    const products = await Product.find({ 
      createdBy: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching products',
      error: error.message 
    });
  }
});

// Helper: parse date range
function parseDateRange(query) {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  if (to) {
    // include the whole day for 'to'
    to.setHours(23, 59, 59, 999);
  }
  const createdAt = {};
  if (from) createdAt.$gte = from;
  if (to) createdAt.$lte = to;
  return Object.keys(createdAt).length ? { createdAt } : {};
}

// Reports: summary
router.get('/reports/summary', auth, async (req, res) => {
  try {
    const dateFilter = parseDateRange(req.query);
    const match = { distributor: req.user._id, ...dateFilter };

    const [agg] = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          ordersCount: { $sum: 1 },
          totalRevenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
          deliveredCount: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
        },
      },
    ]);

    const ordersCount = agg?.ordersCount || 0;
    const totalRevenue = agg?.totalRevenue || 0;
    const deliveredCount = agg?.deliveredCount || 0;
    const avgOrderValue = ordersCount ? totalRevenue / ordersCount : 0;
    res.json({ success: true, data: { ordersCount, totalRevenue, deliveredCount, avgOrderValue } });
  } catch (error) {
    console.error('Error building summary report:', error);
    res.status(500).json({ success: false, message: 'Error building summary report' });
  }
});

// Reports: top products
router.get('/reports/top-products', auth, async (req, res) => {
  try {
    const dateFilter = parseDateRange(req.query);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 10));
    const match = { distributor: req.user._id, ...dateFilter };

    const rows = await Order.aggregate([
      { $match: match },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.name',
          quantity: { $sum: { $ifNull: ['$products.quantity', 0] } },
          revenue: { $sum: { $ifNull: ['$products.totalPrice', { $multiply: ['$products.price', '$products.quantity'] }] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      { $project: { _id: 0, name: '$_id', quantity: 1, revenue: 1 } },
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error building top products report:', error);
    res.status(500).json({ success: false, message: 'Error building top products report' });
  }
});

// Reports: daily sales
router.get('/reports/daily-sales', auth, async (req, res) => {
  try {
    const dateFilter = parseDateRange(req.query);
    const match = { distributor: req.user._id, ...dateFilter };

    const rows = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', orders: 1, revenue: 1 } },
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error building daily sales report:', error);
    res.status(500).json({ success: false, message: 'Error building daily sales report' });
  }
});

// List delivery boys (assigned to this distributor or global by role)
router.get('/delivery-boys', auth, async (req, res) => {
  try {
    const deliveryBoys = await User.find({ role: 'DELIVERY_BOY' })
      .select('name email phone');
    res.json({ success: true, data: deliveryBoys });
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    res.status(500).json({ success: false, message: 'Error fetching delivery boys' });
  }
});

// Update order status (distributor scoped)
router.put('/orders/:orderId/status', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowed = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.distributor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }

    order.status = status;
    await order.save();
    res.json({ success: true, data: order, message: 'Order status updated' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
});

// Assign delivery boy to order (distributor scoped)
router.put('/orders/:orderId/assign', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryBoyId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.distributor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this order' });
    }

    const deliveryBoy = await User.findById(deliveryBoyId);
    if (!deliveryBoy || deliveryBoy.role !== 'DELIVERY_BOY') {
      return res.status(400).json({ success: false, message: 'Invalid delivery boy' });
    }

    order.deliveryBoy = deliveryBoy._id;
    order.status = order.status === 'PENDING' ? 'ASSIGNED' : order.status; // optional auto transition
    await order.save();
    res.json({ success: true, data: order, message: 'Delivery boy assigned' });
  } catch (error) {
    console.error('Error assigning delivery boy:', error);
    res.status(500).json({ success: false, message: 'Error assigning delivery boy' });
  }
});

// List consumers assigned to this distributor
router.get('/consumers', auth, async (req, res) => {
  try {
    const consumers = await User.find({
      role: 'CONSUMER',
      assignedDistributor: req.user._id,
    }).select('name email phone addresses createdAt');

    res.json({ success: true, data: consumers });
  } catch (error) {
    console.error('Error fetching consumers:', error);
    res.status(500).json({ success: false, message: 'Error fetching consumers' });
  }
});

// List orders for this distributor (optionally filtered by consumerId)
router.get('/orders', auth, async (req, res) => {
  try {
    const { consumerId } = req.query;
    const filter = { distributor: req.user._id };
    if (consumerId) filter.customer = consumerId;

    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders for distributor:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

// Get a single product
router.get('/products/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
});

// Create a new product
router.post('/products', auth, async (req, res) => {
  try {
    const { name, category, description, price, unit, minQuantity, maxQuantity, nutritionalInfo, shelfLife, availableRegions } = req.body;
    
    // Basic validation
    if (!name || !category || price === undefined || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, price, and unit are required fields'
      });
    }

    const product = new Product({
      name,
      category,
      description: description || '',
      price: parseFloat(price),
      unit,
      minQuantity: minQuantity || 1,
      maxQuantity: maxQuantity || 100,
      nutritionalInfo: {
        fat: nutritionalInfo?.fat || 0,
        protein: nutritionalInfo?.protein || 0,
        carbs: nutritionalInfo?.carbs || 0,
        calories: nutritionalInfo?.calories || 0
      },
      shelfLife: shelfLife || 3,
      availableRegions: Array.isArray(availableRegions) 
        ? availableRegions.map(region => region.trim()).filter(Boolean)
        : [],
      createdBy: req.user._id,
      isActive: true
    });

    await product.save();
    
    // Populate the createdBy field with user details
    await product.populate('createdBy', 'name email');
    
    res.status(201).json({ 
      success: true, 
      message: 'Product created successfully',
      data: product 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message.includes('validation failed') 
        ? Object.values(error.errors).map(e => e.message).join(', ')
        : 'Error creating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a product
router.put('/products/:id', auth, async (req, res) => {
  try {
    const { name, category, description, price, unit, minQuantity, maxQuantity, nutritionalInfo, shelfLife, availableRegions, isActive } = req.body;
    
    // Find the existing product and verify ownership
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to update it'
      });
    }

    // Prepare update object
    const updateData = {
      name: name || product.name,
      category: category || product.category,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      unit: unit || product.unit,
      minQuantity: minQuantity !== undefined ? minQuantity : product.minQuantity,
      maxQuantity: maxQuantity !== undefined ? maxQuantity : product.maxQuantity,
      shelfLife: shelfLife !== undefined ? shelfLife : product.shelfLife,
      isActive: isActive !== undefined ? isActive : product.isActive,
      nutritionalInfo: {
        fat: nutritionalInfo?.fat !== undefined ? nutritionalInfo.fat : product.nutritionalInfo?.fat || 0,
        protein: nutritionalInfo?.protein !== undefined ? nutritionalInfo.protein : product.nutritionalInfo?.protein || 0,
        carbs: nutritionalInfo?.carbs !== undefined ? nutritionalInfo.carbs : product.nutritionalInfo?.carbs || 0,
        calories: nutritionalInfo?.calories !== undefined ? nutritionalInfo.calories : product.nutritionalInfo?.calories || 0
      },
      availableRegions: Array.isArray(availableRegions)
        ? availableRegions.map(region => region.trim()).filter(Boolean)
        : product.availableRegions || []
    };

    // Update the product
    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Populate the createdBy field with user details
    await product.populate('createdBy', 'name email');

    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      data: product 
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message.includes('validation failed') 
        ? Object.values(error.errors).map(e => e.message).join(', ')
        : 'Error updating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a product (soft delete)
router.delete('/products/:id', auth, async (req, res) => {
  try {
    // Find the product first to check permissions
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check if the user is the creator of the product
    if (product.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Soft delete by setting isActive to false
    await Product.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          isActive: false,
          deletedAt: new Date()
        } 
      },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Product deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deactivating product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deactivating product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
