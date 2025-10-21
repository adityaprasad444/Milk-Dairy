const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Address = require('./Address');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'DISTRIBUTOR', 'DELIVERY_BOY', 'CONSUMER'],
    required: true
  },
  addresses: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address'
    }],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedDistributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  region: String, // For distributors
  profileImage: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for getting the default address
userSchema.virtual('defaultAddress', {
  ref: 'Address', // Reference the Address model
  localField: '_id', // User's _id
  foreignField: 'userId', // Matches the userId field in Address
  justOne: true, // Only return one address
  match: { isDefault: true } // Only return the default address
});

// Method to add a new address
userSchema.methods.addAddress = async function(addressData) {
  try {
    // Ensure addresses array exists
    if (!this.addresses) {
      this.addresses = [];
    }
    
    // Check if this is the first address
    const isFirstAddress = this.addresses.length === 0;
    
    // Create new address
    const address = new Address({
      ...addressData,
      userId: this._id,
      isDefault: isFirstAddress || addressData.isDefault || false
    });
    
    // If setting as default, update other addresses
    if (address.isDefault) {
      await Address.updateMany(
        { userId: this._id },
        { $set: { isDefault: false } }
      );
    }
    
    // Save the address
    await address.save();
    
    // Add to user's addresses array if not already present
    if (!this.addresses.includes(address._id)) {
      this.addresses.push(address._id);
      await this.save();
    }
    
    return address;
  } catch (error) {
    console.error('Error in addAddress:', error);
    throw error;
  }
};

// Method to get all user addresses with full details
userSchema.methods.getAddresses = async function() {
  await this.populate('addresses');
  return this.addresses;
};

// Method to get default address
userSchema.methods.getDefaultAddress = async function() {
  return await Address.findOne({ userId: this._id, isDefault: true });
};

// Method to update an address
userSchema.methods.updateAddress = async function(addressId, updateData) {
  const address = await Address.findOne({ _id: addressId, userId: this._id });
  
  if (!address) {
    throw new Error('Address not found or access denied');
  }
  
  // Update address fields
  Object.assign(address, updateData);
  
  // If setting as default, update other addresses
  if (updateData.isDefault) {
    await Address.updateMany(
      { userId: this._id, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    );
  }
  
  return await address.save();
};

// Method to delete an address
userSchema.methods.deleteAddress = async function(addressId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find the address
    const address = await Address.findOne({ _id: addressId, userId: this._id }).session(session);
    if (!address) {
      throw new Error('Address not found or access denied');
    }
    
    const wasDefault = address.isDefault;
    
    // Delete the address
    await Address.deleteOne({ _id: addressId }).session(session);
    
    // Remove from user's addresses array
    this.addresses = this.addresses.filter(addrId => addrId.toString() !== addressId);
    await this.save({ session });
    
    // If the deleted address was default and there are other addresses, set the first one as default
    if (wasDefault && this.addresses.length > 0) {
      const newDefault = await Address.findOne({ _id: this.addresses[0] }).session(session);
      if (newDefault) {
        newDefault.isDefault = true;
        await newDefault.save({ session });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    return true;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Method to set an address as default
userSchema.methods.setDefaultAddress = async function(addressId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check if the address belongs to the user
    if (!this.addresses.some(addrId => addrId.toString() === addressId)) {
      throw new Error('Address not found or access denied');
    }
    
    // Reset all addresses to non-default
    await Address.updateMany(
      { userId: this._id },
      { $set: { isDefault: false } },
      { session }
    );
    
    // Set the specified address as default
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId: this._id },
      { $set: { isDefault: true } },
      { new: true, session }
    );
    
    if (!updatedAddress) {
      throw new Error('Address not found');
    }
    
    await session.commitTransaction();
    session.endSession();
    
    return updatedAddress;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
