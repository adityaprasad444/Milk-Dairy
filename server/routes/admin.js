const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

// Get all users with filtering
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.query;
    // If role is 'all' or not provided, return all users
    const filter = (role && role !== 'all') ? { role } : {};
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Assign consumer to distributor
router.post('/assign-consumer', auth, isAdmin, async (req, res) => {
  try {
    const { consumerId, distributorId } = req.body;

    // Validate input
    if (!consumerId || !distributorId) {
      return res.status(400).json({ message: 'Consumer ID and Distributor ID are required' });
    }

    // Check if both users exist and have correct roles
    const [consumer, distributor] = await Promise.all([
      User.findById(consumerId),
      User.findById(distributorId)
    ]);

    if (!consumer) {
      return res.status(404).json({ message: 'Consumer not found' });
    }
    if (!distributor) {
      return res.status(404).json({ message: 'Distributor not found' });
    }
    if (consumer.role !== 'CONSUMER') {
      return res.status(400).json({ message: 'Specified user is not a consumer' });
    }
    if (distributor.role !== 'DISTRIBUTOR') {
      return res.status(400).json({ message: 'Specified user is not a distributor' });
    }

    // Update consumer's assigned distributor
    consumer.assignedDistributor = distributorId;
    await consumer.save();

    res.json({
      success: true,
      message: 'Consumer assigned to distributor successfully',
      data: {
        consumer: {
          id: consumer._id,
          name: consumer.name,
          email: consumer.email
        },
        distributor: {
          id: distributor._id,
          name: distributor.name,
          email: distributor.email
        }
      }
    });
  } catch (error) {
    console.error('Error assigning consumer to distributor:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to assign consumer to distributor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get consumers by distributor
router.get('/distributor/:id/consumers', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const consumers = await User.find({ 
      role: 'CONSUMER',
      assignedDistributor: id 
    }).select('-password');
    
    res.json(consumers);
  } catch (error) {
    console.error('Error fetching consumers by distributor:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, isActive } = req.body;

    // Basic validation
    if (!name || !email || !role) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, and role are required' 
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is already in use by another user' 
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:id/status', auth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ 
        success: false,
        message: 'isActive must be a boolean value' 
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
