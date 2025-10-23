const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Address = require('../../models/Address');

// Generate JWT token for testing
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Create test user
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    phone: '9876543210',
    role: 'CONSUMER',
    isActive: true
  };

  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  return user;
};

// Create test admin user
const createTestAdmin = async () => {
  return createTestUser({
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN'
  });
};

// Create test distributor
const createTestDistributor = async () => {
  return createTestUser({
    name: 'Distributor User',
    email: 'distributor@example.com',
    role: 'DISTRIBUTOR',
    region: 'North Delhi'
  });
};

// Create test delivery boy
const createTestDeliveryBoy = async () => {
  return createTestUser({
    name: 'Delivery Boy',
    email: 'delivery@example.com',
    role: 'DELIVERY_BOY'
  });
};

// Create test product
const createTestProduct = async (createdBy, productData = {}) => {
  const defaultProduct = {
    name: 'Test Milk',
    description: 'Fresh cow milk',
    category: 'MILK',
    price: 50.00,
    unit: 'liters',
    minQuantity: 1,
    maxQuantity: 10,
    isActive: true,
    createdBy: createdBy
  };

  const product = new Product({ ...defaultProduct, ...productData });
  await product.save();
  return product;
};

// Create test address
const createTestAddress = async (userId, addressData = {}) => {
  const defaultAddress = {
    userId: userId,
    name: 'Test User',
    phone: '9876543210',
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    landmark: 'Near Test Landmark',
    isDefault: true
  };

  const address = new Address({ ...defaultAddress, ...addressData });
  await address.save();
  return address;
};

// Create authenticated request headers
const getAuthHeaders = (token) => {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Mock request object
const mockRequest = (body = {}, user = null, params = {}, query = {}) => {
  return {
    body,
    user,
    params,
    query,
    headers: {}
  };
};

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.sendFile = jest.fn().mockReturnValue(res);
  return res;
};

// Mock next function
const mockNext = jest.fn();

module.exports = {
  generateToken,
  createTestUser,
  createTestAdmin,
  createTestDistributor,
  createTestDeliveryBoy,
  createTestProduct,
  createTestAddress,
  getAuthHeaders,
  mockRequest,
  mockResponse,
  mockNext
};