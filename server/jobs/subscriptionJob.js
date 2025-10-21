const SubscriptionOrderService = require('../services/subscriptionOrderService');
const logger = require('../utils/logger');

class SubscriptionJob {
  constructor() {
    this.isRunning = false;
  }

  async processSubscriptions() {
    if (this.isRunning) {
      logger.info('Subscription job is already running, skipping this run');
      return;
    }

    this.isRunning = true;
    
    try {
      logger.info('Starting subscription processing job');
      
      // Process subscription orders using the subscription order service
      const result = await SubscriptionOrderService.processSubscriptionOrders();
      
      logger.info(`Subscription job completed. ${result.ordersCreated} orders created.`);
      
    } catch (error) {
      logger.error('Error in subscription job:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = new SubscriptionJob();
