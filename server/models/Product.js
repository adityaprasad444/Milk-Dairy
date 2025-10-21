const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: String,
  category: {
    type: String,
    enum: ['MILK', 'CURD', 'BUTTER', 'CHEESE', 'GHEE', 'PANEER', 'OTHER'],
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    set: v => parseFloat(v).toFixed(2) // Ensure 2 decimal places
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Product creator is required']
  },
  unit: {
    type: String,
    enum: ['liters', 'kg', 'grams', 'packets', 'pieces'],
    required: true
  },
  minQuantity: {
    type: Number,
    default: 1
  },
  maxQuantity: {
    type: Number,
    default: 100
  },
  image: String,
  isActive: {
    type: Boolean,
    default: true
  },
  nutritionalInfo: {
    fat: Number,
    protein: Number,
    carbs: Number,
    calories: Number
  },
  shelfLife: {
    type: Number, // in days
    default: 3
  },
  availableRegions: [{
    type: String,
    trim: true
  }],
  // Soft delete fields
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  // Enable virtuals in toJSON and toObject
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add query middleware to filter out soft-deleted products by default
productSchema.pre(/^find/, function(next) {
  // Only apply this to queries that don't explicitly request deleted items
  if (this.getOptions().withDeleted) {
    return next();
  }
  this.where({ deletedAt: null });
  next();
});

// Add a method to include deleted items in a query
productSchema.statics.withDeleted = function() {
  return this.find().setOptions({ withDeleted: true });
};

module.exports = mongoose.model('Product', productSchema);
