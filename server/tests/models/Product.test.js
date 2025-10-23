const Product = require('../../models/Product');
const { createTestUser, createTestDistributor } = require('../utils/testHelpers');

describe('Product Model', () => {
  let distributor;

  beforeEach(async () => {
    distributor = await createTestDistributor();
  });

  describe('Product Creation', () => {
    test('should create a valid product', async () => {
      const productData = {
        name: 'Fresh Milk',
        description: 'Pure cow milk',
        category: 'MILK',
        price: 45.50,
        unit: 'liters',
        createdBy: distributor._id,
        minQuantity: 1,
        maxQuantity: 20
      };

      const product = new Product(productData);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(productData.name);
      expect(savedProduct.category).toBe(productData.category);
      expect(savedProduct.price).toBe(45.5); // Price is stored as number
      expect(savedProduct.unit).toBe(productData.unit);
      expect(savedProduct.isActive).toBe(true);
      expect(savedProduct.createdBy.toString()).toBe(distributor._id.toString());
    });

    test('should require name field', async () => {
      const product = new Product({
        category: 'MILK',
        price: 45.50,
        unit: 'liters',
        createdBy: distributor._id
      });

      let error;
      try {
        await product.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    test('should require price field', async () => {
      const product = new Product({
        name: 'Test Product',
        category: 'MILK',
        unit: 'liters',
        createdBy: distributor._id
      });

      let error;
      try {
        await product.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.price).toBeDefined();
    });

    test('should validate category enum', async () => {
      const product = new Product({
        name: 'Test Product',
        category: 'INVALID_CATEGORY',
        price: 45.50,
        unit: 'liters',
        createdBy: distributor._id
      });

      let error;
      try {
        await product.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.category).toBeDefined();
    });

    test('should validate unit enum', async () => {
      const product = new Product({
        name: 'Test Product',
        category: 'MILK',
        price: 45.50,
        unit: 'invalid_unit',
        createdBy: distributor._id
      });

      let error;
      try {
        await product.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.unit).toBeDefined();
    });

    test('should not allow negative price', async () => {
      const product = new Product({
        name: 'Test Product',
        category: 'MILK',
        price: -10,
        unit: 'liters',
        createdBy: distributor._id
      });

      let error;
      try {
        await product.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.price).toBeDefined();
    });
  });

  describe('Product Queries', () => {
    test('should filter out soft-deleted products by default', async () => {
      // Create active product
      const activeProduct = new Product({
        name: 'Active Product',
        category: 'MILK',
        price: 45.50,
        unit: 'liters',
        createdBy: distributor._id
      });
      await activeProduct.save();

      // Create soft-deleted product
      const deletedProduct = new Product({
        name: 'Deleted Product',
        category: 'MILK',
        price: 45.50,
        unit: 'liters',
        createdBy: distributor._id,
        deletedAt: new Date()
      });
      await deletedProduct.save();

      const products = await Product.find();
      
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Active Product');
    });

    test('should include soft-deleted products with withDeleted option', async () => {
      // Create active product
      const activeProduct = new Product({
        name: 'Active Product',
        category: 'MILK',
        price: 45.50,
        unit: 'liters',
        createdBy: distributor._id
      });
      await activeProduct.save();

      // Create soft-deleted product
      const deletedProduct = new Product({
        name: 'Deleted Product',
        category: 'MILK',
        price: 45.50,
        unit: 'liters',
        createdBy: distributor._id,
        deletedAt: new Date()
      });
      await deletedProduct.save();

      const products = await Product.withDeleted();
      
      expect(products).toHaveLength(2);
    });
  });

  describe('Product Defaults', () => {
    test('should set default values', async () => {
      const product = new Product({
        name: 'Test Product',
        category: 'MILK',
        price: 45.50,
        unit: 'liters',
        createdBy: distributor._id
      });

      const savedProduct = await product.save();

      expect(savedProduct.minQuantity).toBe(1);
      expect(savedProduct.maxQuantity).toBe(100);
      expect(savedProduct.isActive).toBe(true);
      expect(savedProduct.shelfLife).toBe(3);
      expect(savedProduct.deletedAt).toBeNull();
    });
  });
});