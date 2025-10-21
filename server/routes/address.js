const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Address = require('../models/Address');

// Add new address
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please re-login and try again.'
      });
    }

    const { name, phone, street, city, state, pincode, landmark, isDefault } = req.body;

    // Create address using User model method
    const address = await user.addAddress({
      name,
      phone,
      street,
      city,
      state,
      pincode,
      landmark,
      isDefault: !!isDefault
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address
    });
  } catch (error) {
    console.error('Error adding address:', error.stack || error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Address already exists',
        field: Object.keys(error.keyPattern)[0]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all addresses for the current user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please re-login and try again.'
      });
    }

    // Get all addresses for the user
    const addresses = await Address.find({ userId: user._id });

    res.status(200).json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get a specific address
router.get('/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please re-login and try again.'
      });
    }
    
    // Check if the address belongs to the user
    if (!user.addresses.includes(req.params.addressId)) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or access denied'
      });
    }
    
    const address = await Address.findById(req.params.addressId);
    
    if (!address) {
      // Address ID exists in user's addresses but not in Address collection (inconsistent state)
      // Clean up the user's addresses array
      user.addresses = user.addresses.filter(id => id.toString() !== req.params.addressId);
      await user.save();
      
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error('Error fetching address:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch address',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update an address
router.put('/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please re-login and try again.'
      });
    }
    
    const { addressId } = req.params;
    const { name, phone, street, city, state, pincode, landmark, isDefault } = req.body;
    
    // Check if the address belongs to the user
    if (!user.addresses.includes(addressId)) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or access denied'
      });
    }
    
    // Prepare update data with only the fields that are provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (street !== undefined) updateData.street = street;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    
    // Update the address using User model method
    const updatedAddress = await user.updateAddress(addressId, updateData);
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Error updating address:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    // Handle not found or access denied
    if (error.message === 'Address not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete an address
router.delete('/:addressId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please re-login and try again.'
      });
    }
    
    const { addressId } = req.params;
    
    // Delete the address using User model method
    await user.deleteAddress(addressId);
    
    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    
    // Handle not found or access denied
    if (error.message === 'Address not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Set default address
router.patch('/:addressId/set-default', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please re-login and try again.'
      });
    }
    
    const { addressId } = req.params;
    
    // Check if the address belongs to the user
    if (!user.addresses.includes(addressId)) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or access denied'
      });
    }
    
    // Get the current default address
    const currentDefault = await Address.findOne({ userId: user._id, isDefault: true });
    
    // If already default, return success
    if (currentDefault && currentDefault._id.toString() === addressId) {
      return res.json({
        success: true,
        message: 'Address is already set as default',
        data: currentDefault
      });
    }
    
    // Update the address to be default using User model method
    const updatedAddress = await user.setDefaultAddress(addressId);
    
    res.json({
      success: true,
      message: 'Default address updated successfully',
      data: updatedAddress
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    
    // Handle not found or access denied
    if (error.message === 'Address not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to set default address',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
