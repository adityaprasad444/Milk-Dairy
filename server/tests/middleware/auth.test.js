const { auth, authorize, adminOnly } = require('../../middleware/auth');
const { 
  createTestUser, 
  createTestAdmin, 
  generateToken, 
  mockRequest, 
  mockResponse, 
  mockNext 
} = require('../utils/testHelpers');

describe('Auth Middleware', () => {
  describe('auth middleware', () => {
    test('should authenticate valid token', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);
      
      const req = mockRequest();
      req.header = jest.fn().mockReturnValue(`Bearer ${token}`);
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(user._id.toString());
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without token', async () => {
      const req = mockRequest();
      req.header = jest.fn().mockReturnValue(null);
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(req.user).toBeFalsy();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'No token, authorization denied' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token', async () => {
      const req = mockRequest();
      req.header = jest.fn().mockReturnValue('Bearer invalid-token');
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(req.user).toBeFalsy();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Token is not valid' 
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token for non-existent user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);
      
      // Delete the user
      await user.deleteOne();
      
      const req = mockRequest();
      req.header = jest.fn().mockReturnValue(`Bearer ${token}`);
      const res = mockResponse();
      const next = mockNext;

      await auth(req, res, next);

      expect(req.user).toBeFalsy();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Token is not valid' 
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize middleware', () => {
    test('should allow user with correct role', async () => {
      const user = await createTestAdmin();
      
      const req = mockRequest({}, user);
      const res = mockResponse();
      const next = mockNext;

      const authorizeAdmin = authorize('ADMIN');
      authorizeAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should allow user with one of multiple roles', async () => {
      const user = await createTestUser({ role: 'DISTRIBUTOR' });
      
      const req = mockRequest({}, user);
      const res = mockResponse();
      const next = mockNext;

      const authorizeMultiple = authorize('ADMIN', 'DISTRIBUTOR');
      authorizeMultiple(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject user with incorrect role', async () => {
      const user = await createTestUser({ role: 'CONSUMER' });
      
      const req = mockRequest({}, user);
      const res = mockResponse();
      const next = mockNext;

      const authorizeAdmin = authorize('ADMIN');
      authorizeAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Required roles: ADMIN' 
      });
    });

    test('should reject request without user', async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext;

      const authorizeAdmin = authorize('ADMIN');
      authorizeAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied' 
      });
    });
  });

  describe('adminOnly middleware', () => {
    test('should allow admin user', async () => {
      const admin = await createTestAdmin();
      
      const req = mockRequest({}, admin);
      const res = mockResponse();
      const next = mockNext;

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject non-admin user', async () => {
      const user = await createTestUser({ role: 'CONSUMER' });
      
      const req = mockRequest({}, user);
      const res = mockResponse();
      const next = mockNext;

      adminOnly(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: 'Access denied. Required roles: ADMIN' 
      });
    });
  });
});