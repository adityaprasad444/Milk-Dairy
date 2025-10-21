const SubscriptionOrder = require('../models/SubscriptionOrder');

// @desc    Get all subscription orders for a user or admin
// @route   GET /api/subscription-orders
// @access  Private
exports.getSubscriptionOrders = async (req, res) => {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const query = {};

    // Role-based access control
    if (req.user.role === 'consumer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'distributor') {
      query.distributor = req.user.id;
    }

    // Filtering logic
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.deliveryDate = {};
      if (dateFrom) query.deliveryDate.$gte = new Date(dateFrom);
      if (dateTo) query.deliveryDate.$lte = new Date(dateTo);
    }

    const orders = await SubscriptionOrder.find(query)
      .populate('customer', 'name email')
      .populate('distributor', 'name email')
      .populate('subscription', 'frequency')
      .populate('products.product', 'name price image')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get a single subscription order by ID
// @route   GET /api/subscription-orders/:id
// @access  Private
exports.getSubscriptionOrder = async (req, res) => {
  try {
    const order = await SubscriptionOrder.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('distributor', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: `Subscription order not found with id of ${req.params.id}` });
    }

    // Authorization check
    if (order.customer.toString() !== req.user.id && req.user.role !== 'admin' && order.distributor.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to access this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update subscription order status
// @route   PATCH /api/subscription-orders/:id/status
// @access  Private (Admin, Distributor)
exports.updateSubscriptionOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await SubscriptionOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: `Subscription order not found with id of ${req.params.id}` });
    }

    // Authorization check
    if (req.user.role !== 'admin' && order.distributor.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
