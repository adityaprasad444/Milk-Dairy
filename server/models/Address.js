const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number! Must be 10 digits.`
    }
  },
  street: {
    type: String,
    required: [true, 'Street address is required'],
    trim: true,
    minlength: [5, 'Street address must be at least 5 characters long'],
    maxlength: [200, 'Street address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [100, 'City name cannot exceed 100 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State name cannot exceed 50 characters']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid pincode! Must be 6 digits.`
    }
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [200, 'Landmark cannot exceed 200 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  coordinates: {
    lat: {
      type: Number,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      min: -180,
      max: 180
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ userId: 1 });

// Middleware to ensure only one default address per user
addressSchema.pre('save', async function(next) {
  // Only run this if isDefault is being set to true
  if (this.isModified('isDefault') && this.isDefault) {
    try {
      // Set all other addresses of this user to not default
      await this.constructor.updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { $set: { isDefault: false } }
      );
    } catch (error) {
      next(error);
    }
  }
  next();
});

// Instance method to get formatted address string
addressSchema.methods.getFormattedAddress = function() {
  return `${this.street}, ${this.landmark ? this.landmark + ', ' : ''}${this.city}, ${this.state} - ${this.pincode}`;
};

// Static method to get user's default address
addressSchema.statics.getDefaultAddress = async function(userId) {
  return this.findOne({ userId, isDefault: true });
};

// Update timestamps on update operations
addressSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
