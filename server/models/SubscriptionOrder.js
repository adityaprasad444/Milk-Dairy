const mongoose = require('mongoose');

const subscriptionOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: Number,
    price: Number,
    unit: String,
    total: Number
  }],
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    default: 'morning'
  },
  deliveryAddress: mongoose.Schema.Types.Mixed,
  paymentMethod: {
    type: String,
    default: 'cash'
  },
  totalAmount: {
    type: Number,
    required: true
  },
  notes: String
}, {
  timestamps: true
});

// Generate order number before saving
subscriptionOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `SUB-${Date.now()}-${count + 1}`;
  }
  next();
});

module.exports = mongoose.model('SubscriptionOrder', subscriptionOrderSchema);
