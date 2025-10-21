const cron = require('node-cron');
const SubscriptionOrderService = require('../services/subscriptionOrderService');
const logger = require('../utils/logger');

class SubscriptionScheduler {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Start the subscription scheduler
   * @param {string} [schedule] - Cron schedule (defaults to every 5 minutes)
   */
  start(schedule = '*/5 * * * *') {
    if (this.job) {
      logger.warn('Subscription scheduler is already running');
      return;
    }

    logger.info(`Starting subscription scheduler with schedule: ${schedule}`);
    
    // Run immediately on startup
    this.processSubscriptions().catch(error => {
      logger.error('Error in initial subscription processing:', error);
    });

    // Schedule the job
    this.job = cron.schedule(schedule, async () => {
      await this.processSubscriptions();
    }, {
      timezone: 'Asia/Kolkata' // Adjust timezone as needed
    });
  }

  /**
   * Stop the subscription scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
      logger.info('Subscription scheduler stopped');
    }
  }

  /**
   * Process subscriptions (can be called manually)
   */
  async processSubscriptions() {
    if (this.isRunning) {
      logger.warn('Subscription processing is already running');
      return { status: 'already_running' };
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      logger.info('Starting subscription order processing');
      const result = await SubscriptionOrderService.processSubscriptionOrders();
      
      const duration = (Date.now() - startTime) / 1000;
      logger.info(`Completed subscription processing in ${duration.toFixed(2)}s. ` +
                 `Processed: ${result.totalProcessed}, ` +
                 `Orders created: ${result.ordersCreated}, ` +
                 `Errors: ${result.errors}`);
      
      return {
        status: 'completed',
        ...result,
        duration,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error in subscription processing:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date()
      };
    } finally {
      this.isRunning = false;
    }
  }
}

// Create a singleton instance
const subscriptionScheduler = new SubscriptionScheduler();

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Stopping subscription scheduler...');
  subscriptionScheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Stopping subscription scheduler...');
  subscriptionScheduler.stop();
  process.exit(0);
});

module.exports = subscriptionScheduler;
