const subscriptionJob = require('./subscriptionJob');
const logger = require('../utils/logger');

class Scheduler {
  constructor() {
    this.jobs = [];
    this.intervals = {};
  }

  start() {
    logger.info('Starting scheduler...');
    
    // Schedule subscription job to run every 5 minutes
    this.scheduleJob('subscriptionJob', () => {
      subscriptionJob.processSubscriptions();
    }, 100000 * 60 * 1000); // 5 minutes in milliseconds
    
    logger.info('Scheduler started');
  }

  scheduleJob(name, job, interval) {
    // Clear existing job with the same name if it exists
    this.stopJob(name);
    
    // Run the job immediately on startup
    job();
    
    // Then schedule it to run at the specified interval
    this.intervals[name] = setInterval(job, interval);
    this.jobs.push(name);
    
    logger.info(`Scheduled job '${name}' to run every ${interval / 1000} seconds`);
  }

  stopJob(name) {
    if (this.intervals[name]) {
      clearInterval(this.intervals[name]);
      delete this.intervals[name];
      this.jobs = this.jobs.filter(job => job !== name);
      logger.info(`Stopped job '${name}'`);
    }
  }

  stopAll() {
    this.jobs.forEach(job => this.stopJob(job));
    logger.info('All scheduled jobs stopped');
  }
}

// Create and export a singleton instance
const scheduler = new Scheduler();

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Shutting down scheduler...');
  scheduler.stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down scheduler...');
  scheduler.stopAll();
  process.exit(0);
});

module.exports = scheduler;
