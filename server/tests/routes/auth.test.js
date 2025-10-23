const request = require('supertest');
const app = require('../testServer');
const User = require('../../models/User');
const { createTestUser, generateToken } = require('../utils/testHelpers');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'CONSUMER'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);

      // Verify user was created in database
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeDefined();
      expect(user.name).toBe(userData.name);
    });

    test('should not register user with existing email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'CONSUMER'
      };

      // Create user first
      await createTestUser(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('User already exists');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test('should validate email format', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        phone: '9876543210',
        role: 'CONSUMER'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.msg.includes('valid email'))).toBe(true);
    });

    test('should validate password length', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123', // Too short
        phone: '9876543210',
        role: 'CONSUMER'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.msg.includes('6 or more characters'))).toBe(true);
    });

    test('should validate role enum', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'INVALID_ROLE'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(err => err.msg.includes('Invalid role'))).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'login@example.com',
        password: 'password123'
      });
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('login@example.com');
    });

    test('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should not login inactive user', async () => {
      // Deactivate user
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.message).toBe('Account is deactivated');
    });

    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser, token;

    beforeEach(async () => {
      testUser = await createTestUser();
      token = generateToken(testUser._id);
    });

    test('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUser._id.toString());
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Token is not valid');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser, token;

    beforeEach(async () => {
      testUser = await createTestUser();
      token = generateToken(testUser._id);
    });

    test('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '9999999999'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.name).toBe(updateData.name);
      expect(response.body.user.phone).toBe(updateData.phone);

      // Verify in database
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.phone).toBe(updateData.phone);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
    });
  });
});