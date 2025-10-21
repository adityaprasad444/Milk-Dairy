const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');

// Debug endpoint to check user's distributor and products
router.get('/user-distributor', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedDistributor');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let distributorProducts = [];
    if (user.assignedDistributor) {
      distributorProducts = await Product.find({
        createdBy: user.assignedDistributor._id,
        isActive: true
      }).select('-__v');
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        assignedDistributor: user.assignedDistributor
      },
      distributorProducts: {
        count: distributorProducts.length,
        products: distributorProducts
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
