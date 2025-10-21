const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get the User model dynamically to avoid circular dependency
    const User = mongoose.model('User');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Admin only middleware
// Distributor and Admin middleware
const distributorOrAdmin = authorize('DISTRIBUTOR', 'ADMIN');

// Delivery Boy, Distributor and Admin middleware
const deliveryOrDistributorOrAdmin = authorize('DELIVERY_BOY', 'DISTRIBUTOR', 'ADMIN');

// Consumer only middleware
const consumerOnly = authorize('CONSUMER');

// Consumer and Admin middleware
const consumerOrAdmin = authorize('CONSUMER', 'ADMIN');

module.exports = {
  auth,
  authorize,
  adminOnly: authorize('ADMIN'),
  distributorOrAdmin: authorize('DISTRIBUTOR', 'ADMIN'),
  deliveryOrDistributorOrAdmin: authorize('DELIVERY_BOY', 'DISTRIBUTOR', 'ADMIN'),
  consumerOnly: authorize('CONSUMER'),
  consumerOrAdmin: authorize('CONSUMER', 'ADMIN')
};
