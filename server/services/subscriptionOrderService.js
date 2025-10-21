const SubscriptionOrder = require('../models/SubscriptionOrder');
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class SubscriptionOrderService {
  /**
   * Create a new subscription order from a subscription
   * @param {Object} subscription - The subscription document
   * @param {Date} deliveryDate - The delivery date for this order
   * @returns {Promise<Object>} The created subscription order
   */
  static async createSubscriptionOrder(subscription, deliveryDate) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderData = {
        subscription: subscription._id,
        customer: subscription.customer,
        distributor: subscription.distributor,
        products: subscription.products.map(item => ({
          product: item.product._id || item.product,
          name: item.product.name || 'N/A',
          quantity: item.quantity,
          price: item.price,
          unit: item.unit || 'piece',
          total: item.quantity * item.price
        })),
        status: 'PENDING',
        paymentStatus: 'PENDING',
        deliveryDate: deliveryDate,
        deliveryTime: subscription.deliveryTime || 'morning',
        deliveryAddress: subscription.deliveryAddress,
        paymentMethod: subscription.paymentMethod || 'cash',
        totalAmount: subscription.products.reduce(
          (sum, item) => sum + (item.quantity * item.price), 0
        ),
        notes: subscription.specialInstructions || ''
      };

      const order = new SubscriptionOrder(orderData);
      const savedOrder = await order.save({ session });

      // Link the new order to the subscription
      await Subscription.findByIdAndUpdate(
        subscription._id,
        { 
          $push: { orders: savedOrder._id },
          $set: { lastOrderDate: new Date() }
        },
        { session }
      );

      await session.commitTransaction();
      logger.info(`Created subscription order ${savedOrder.orderNumber} for subscription ${subscription._id}`);
      return savedOrder;

    } catch (error) {
      await session.abortTransaction();
      logger.error('Error in createSubscriptionOrder:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get all subscription orders, with optional filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} A list of subscription orders
   */
  static async getSubscriptionOrders(filters = {}) {
    try {
      return await SubscriptionOrder.find(filters)
        .populate('subscription', 'frequency status')
        .populate('customer', 'name email')
        .populate('distributor', 'name email')
        .sort({ deliveryDate: -1 });
    } catch (error) {
      logger.error('Error fetching subscription orders:', error);
      throw error;
    }
  }

  /**
   * Process all active subscriptions and create orders for due deliveries
   * @returns {Promise<Object>} Processing result with counts
   */
  static async processSubscriptionOrders() {
    const now = new Date();
    logger.info(`[${now.toISOString()}] Starting subscription order processing`);
    
    const result = {
      totalProcessed: 0,
      ordersCreated: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      // Find active subscriptions with next delivery due
      const subscriptions = await Subscription.find({
        status: 'active',
        nextDeliveryDate: { $lte: now },
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gt: now } }
        ]
      })
      .populate('products.product')
      .populate('customer', 'name email phone')
      .populate('distributor', 'name email phone');

      result.totalProcessed = subscriptions.length;
      logger.info(`Found ${result.totalProcessed} subscriptions to process`);
      
      // Process each subscription
      for (const subscription of subscriptions) {
        try {
          const deliveryDate = subscription.nextDeliveryDate || new Date();
          
          // Create order for current delivery
          await this.createSubscriptionOrder(subscription, deliveryDate);
          
          // Calculate next delivery date
          const nextDelivery = subscription.calculateNextDelivery();
          
          // Check if subscription has ended
          if (subscription.endDate && nextDelivery > subscription.endDate) {
            subscription.status = 'completed';
            subscription.nextDeliveryDate = null;
            logger.info(`Subscription ${subscription._id} completed`);
          } else {
            subscription.nextDeliveryDate = nextDelivery;
          }
          
          // Save subscription with updated dates
          await subscription.save();
          result.ordersCreated++;
          
          logger.info(`Processed subscription ${subscription._id}, next delivery: ${subscription.nextDeliveryDate}`);
        } catch (error) {
          result.errors++;
          result.errorDetails.push({
            subscriptionId: subscription?._id,
            error: error.message,
            timestamp: new Date()
          });
          logger.error(`Error processing subscription ${subscription?._id || 'unknown'}:`, error);
        }
      }
      
      logger.info(`Completed subscription processing. Orders created: ${result.ordersCreated}, Errors: ${result.errors}`);
      return result;
      
    } catch (error) {
      logger.error('Fatal error in subscription processing:', error);
      result.errors++;
      result.errorDetails.push({
        error: 'Fatal error: ' + error.message,
        timestamp: new Date()
      });
      return result;
    }
  }
}

module.exports = SubscriptionOrderService;
