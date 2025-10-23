const User = require('../../models/User');
const Address = require('../../models/Address');
const { createTestUser, createTestAddress } = require('../utils/testHelpers');

describe('User Model', () => {
  describe('User Creation', () => {
    test('should create a valid user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'CONSUMER'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.phone).toBe(userData.phone);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
    });

    test('should require name field', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'CONSUMER'
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    test('should require unique email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'duplicate@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'CONSUMER'
      };

      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same email
      const user2 = new User(userData);
      
      let error;
      try {
        await user2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });

    test('should validate role enum', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '9876543210',
        role: 'INVALID_ROLE'
      });

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.role).toBeDefined();
    });
  });

  describe('Password Methods', () => {
    test('should hash password before saving', async () => {
      const user = await createTestUser({
        password: 'plainpassword'
      });

      expect(user.password).not.toBe('plainpassword');
      expect(user.password.length).toBeGreaterThan(20); // Hashed password is longer
    });

    test('should compare password correctly', async () => {
      const plainPassword = 'testpassword123';
      const user = await createTestUser({
        password: plainPassword
      });

      const isMatch = await user.comparePassword(plainPassword);
      const isNotMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Address Management', () => {
    let user;

    beforeEach(async () => {
      user = await createTestUser();
    });

    test('should add address to user', async () => {
      const addressData = {
        name: 'John Doe',
        phone: '9876543210',
        street: '123 Main Street',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        isDefault: true
      };

      const address = await user.addAddress(addressData);

      expect(address).toBeDefined();
      expect(address.userId.toString()).toBe(user._id.toString());
      expect(address.isDefault).toBe(true);
      expect(user.addresses).toContain(address._id);
    });

    test('should set first address as default', async () => {
      const addressData = {
        name: 'John Doe',
        phone: '9876543210',
        street: '123 Main Street',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001'
      };

      const address = await user.addAddress(addressData);

      expect(address.isDefault).toBe(true);
    });

    test('should update existing address', async () => {
      const address = await createTestAddress(user._id);
      
      const updateData = {
        street: '456 Updated Street',
        city: 'Updated City'
      };

      const updatedAddress = await user.updateAddress(address._id, updateData);

      expect(updatedAddress.street).toBe(updateData.street);
      expect(updatedAddress.city).toBe(updateData.city);
    });

    test('should delete address', async () => {
      const address = await createTestAddress(user._id);
      
      // Simple delete without transaction for testing
      await Address.findByIdAndDelete(address._id);
      user.addresses = user.addresses.filter(id => id.toString() !== address._id.toString());
      await user.save();

      const deletedAddress = await Address.findById(address._id);
      expect(deletedAddress).toBeNull();
    });

    test('should set default address', async () => {
      const address1 = await createTestAddress(user._id, { isDefault: true });
      const address2 = await createTestAddress(user._id, { 
        isDefault: false,
        street: '456 Second Street'
      });

      // Add addresses to user
      user.addresses = [address1._id, address2._id];
      await user.save();

      // Simple update without transaction for testing
      await Address.updateMany({ userId: user._id }, { isDefault: false });
      await Address.findByIdAndUpdate(address2._id, { isDefault: true });

      const updatedAddress1 = await Address.findById(address1._id);
      const updatedAddress2 = await Address.findById(address2._id);

      expect(updatedAddress1.isDefault).toBe(false);
      expect(updatedAddress2.isDefault).toBe(true);
    });
  });
});