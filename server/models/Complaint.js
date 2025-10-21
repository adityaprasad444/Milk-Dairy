const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  category: {
    type: String,
    enum: ['QUALITY', 'DELIVERY', 'BILLING', 'SERVICE', 'OTHER'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'],
    default: 'OPEN'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: String,
  attachments: [String],
  customerSatisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  }
}, {
  timestamps: true
});

// Generate ticket number before saving
complaintSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments();
    this.ticketNumber = `TKT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
