const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    enum: ['morning', 'evening'],
    required: true
  },
  actualDeliveryTime: Date,
  status: {
    type: String,
    enum: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'],
    default: 'ASSIGNED'
  },
  deliveryProof: {
    image: String,
    signature: String,
    customerSignature: String,
    gpsLocation: {
      lat: Number,
      lng: Number
    },
    deliveredAt: Date
  },
  failureReason: String,
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
  route: {
    startLocation: {
      lat: Number,
      lng: Number
    },
    endLocation: {
      lat: Number,
      lng: Number
    },
    distance: Number,
    estimatedTime: Number
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
