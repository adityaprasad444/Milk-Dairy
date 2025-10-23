const request = require('supertest');
const app = require('../testServer');
const Address = require('../../models/Address');
const { createTestUser, generateToken, createTestAddress } = require('../utils/testHelpers');

describe('Address Routes', () => {
  let testUser, token;

  beforeEach(async () => {
    testUser = await createTestUser();
    token = generateToken(testUser._id);
  });

  describe('POST /api/addresses', () => {
    test('should create a new address', async () => {
      const addressData = {
        name: 'John Doe',
        phone: '9876543210',
        street: '123 Main Street',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        landmark: 'Near Metro Station',
        isDefault: true
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address added successfully');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.street).toBe(addressData.street);
      expect(response.body.data.isDefault).toBe(true);

      // Verify in database
      const address = await Address.findById(response.body.data._id);
      expect(address).toBeDefined();
      expect(address.userId.toString()).toBe(testUser._id.toString());
    });

    test('should set first address as default automatically', async () => {
      const addressData = {
        name: 'John Doe',
        phone: '9876543210',
        street: '123 Main Street',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
        // isDefault not specified
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData)
        .expect(201);

      expect(response.body.data.isDefault).toBe(true);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'John Doe'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
    });

    test('should validate phone number format', async () => {
      const addressData = {
        name: 'John Doe',
        phone: '123', // Invalid phone
        street: '123 Main Street',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate pincode format', async () => {
      const addressData = {
        name: 'John Doe',
        phone: '9876543210',
        street: '123 Main Street',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '123' // Invalid pincode
      };

      const response = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .send(addressData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/addresses')
        .send({
          name: 'John Doe',
          phone: '9876543210',
          street: '123 Main Street',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001'
        })
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
    });
  });

  describe('GET /api/addresses', () => {
    test('should get all user addresses', async () => {
      // Create test addresses
      const address1 = await createTestAddress(testUser._id, { 
        street: '123 First Street',
        isDefault: true 
      });
      const address2 = await createTestAddress(testUser._id, { 
        street: '456 Second Street',
        isDefault: false 
      });

      const response = await request(app)
        .get('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.some(addr => addr.street === '123 First Street')).toBe(true);
      expect(response.body.data.some(addr => addr.street === '456 Second Street')).toBe(true);
    });

    test('should return empty array for user with no addresses', async () => {
      const response = await request(app)
        .get('/api/addresses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });

    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/addresses')
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
    });
  });

  describe('GET /api/addresses/:addressId', () => {
    let testAddress;

    beforeEach(async () => {
      testAddress = await createTestAddress(testUser._id);
    });

    test('should get specific address', async () => {
      const response = await request(app)
        .get(`/api/addresses/${testAddress._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(testAddress._id.toString());
      expect(response.body.data.street).toBe(testAddress.street);
    });

    test('should not get address of another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherAddress = await createTestAddress(otherUser._id);

      const response = await request(app)
        .get(`/api/addresses/${otherAddress._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Address not found or access denied');
    });

    test('should handle invalid address ID', async () => {
      const response = await request(app)
        .get('/api/addresses/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid address ID format');
    });
  });

  describe('PUT /api/addresses/:addressId', () => {
    let testAddress;

    beforeEach(async () => {
      testAddress = await createTestAddress(testUser._id);
    });

    test('should update address', async () => {
      const updateData = {
        street: '456 Updated Street',
        city: 'Updated City',
        landmark: 'Updated Landmark'
      };

      const response = await request(app)
        .put(`/api/addresses/${testAddress._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address updated successfully');
      expect(response.body.data.street).toBe(updateData.street);
      expect(response.body.data.city).toBe(updateData.city);
      expect(response.body.data.landmark).toBe(updateData.landmark);

      // Verify in database
      const updatedAddress = await Address.findById(testAddress._id);
      expect(updatedAddress.street).toBe(updateData.street);
    });

    test('should not update address of another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherAddress = await createTestAddress(otherUser._id);

      const response = await request(app)
        .put(`/api/addresses/${otherAddress._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ street: '456 Updated Street' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Address not found or access denied');
    });
  });

  describe('DELETE /api/addresses/:addressId', () => {
    let testAddress;

    beforeEach(async () => {
      testAddress = await createTestAddress(testUser._id);
    });

    test('should delete address', async () => {
      const response = await request(app)
        .delete(`/api/addresses/${testAddress._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address deleted successfully');

      // Verify deletion in database
      const deletedAddress = await Address.findById(testAddress._id);
      expect(deletedAddress).toBeNull();
    });

    test('should not delete address of another user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherAddress = await createTestAddress(otherUser._id);

      const response = await request(app)
        .delete(`/api/addresses/${otherAddress._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Address not found or access denied');
    });
  });

  describe('PATCH /api/addresses/:addressId/set-default', () => {
    let address1, address2;

    beforeEach(async () => {
      address1 = await createTestAddress(testUser._id, { 
        street: '123 First Street',
        isDefault: true 
      });
      address2 = await createTestAddress(testUser._id, { 
        street: '456 Second Street',
        isDefault: false 
      });
    });

    test('should set address as default', async () => {
      const response = await request(app)
        .patch(`/api/addresses/${address2._id}/set-default`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Default address updated successfully');
      expect(response.body.data.isDefault).toBe(true);

      // Verify in database
      const updatedAddress1 = await Address.findById(address1._id);
      const updatedAddress2 = await Address.findById(address2._id);
      
      expect(updatedAddress1.isDefault).toBe(false);
      expect(updatedAddress2.isDefault).toBe(true);
    });

    test('should handle already default address', async () => {
      const response = await request(app)
        .patch(`/api/addresses/${address1._id}/set-default`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Address is already set as default');
    });
  });
});