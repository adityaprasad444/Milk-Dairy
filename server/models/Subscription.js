const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionOrder'
  }],
  subscriptionType: {
    type: String,
    required: true,
    enum: ['one-time', 'weekly', 'monthly', 'custom'],
    default: 'one-time'
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'piece'
    }
  }],
  frequency: {
    type: String,
    enum: ['daily', 'twice_week', 'alternate_days', 'weekly', 'fortnightly', 'monthly'],
    required: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  deliveryTime: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'flexible'],
    default: 'morning'
  },
  deliveryDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    validate: {
      validator: function(days) {
        // For weekly frequency, at least one day is required
        if (this.frequency === 'weekly' && (!days || days.length === 0)) {
          return false;
        }
        // For other frequencies, deliveryDays is optional
        return true;
      },
      message: 'At least one delivery day is required for weekly subscriptions'
    }
  }],
  deliveryDay: {
    type: Number,
    min: 1,
    max: 28
  },
  specialInstructions: String,
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active'
  },
  nextDeliveryDate: Date,
  lastDeliveryDate: Date,
  totalDeliveries: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate next delivery date based on subscription type and frequency
subscriptionSchema.methods.calculateNextDelivery = function() {
  const now = new Date();
  let nextDate = new Date(this.nextDeliveryDate || this.startDate);
  
  // If the next delivery is in the past, set it to now
  if (nextDate < now) {
    nextDate = new Date(now);
  }
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  switch(this.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
      
    case 'twice_week':
      // Deliver twice a week (e.g., Monday and Thursday)
      if (!this.deliveryDays || this.deliveryDays.length < 2) {
        // Default to Monday and Thursday if not specified
        this.deliveryDays = ['monday', 'thursday'];
      }
      // Fall through to weekly logic for day calculation
      
    case 'weekly':
      if (!this.deliveryDays || this.deliveryDays.length === 0) {
        // Default to Monday if not specified for weekly subscriptions
        this.deliveryDays = ['monday'];
      }
      
      const currentDay = nextDate.getDay();
      const currentDayName = days[currentDay].toLowerCase();
      
      // Find the next delivery day
      const nextDayIndex = this.deliveryDays
        .map(day => days.indexOf(day))
        .sort((a, b) => a - b)
        .find(dayIndex => dayIndex > currentDay);
      
      if (nextDayIndex !== undefined) {
        // Next delivery is later in the current week
        nextDate.setDate(nextDate.getDate() + (nextDayIndex - currentDay));
      } else {
        // Next delivery is in the next week
        const firstDayNextWeek = this.deliveryDays
          .map(day => days.indexOf(day))
          .sort((a, b) => a - b)[0];
        const daysUntilNextWeek = 7 - currentDay + firstDayNextWeek;
        nextDate.setDate(nextDate.getDate() + daysUntilNextWeek);
      }
      break;
      
    case 'alternate_days':
      nextDate.setDate(nextDate.getDate() + 2);
      break;
      
    case 'fortnightly':
      // Every 2 weeks
      nextDate.setDate(nextDate.getDate() + 14);
      
      // If we have specific delivery days, adjust to the next valid day
      if (this.deliveryDays && this.deliveryDays.length > 0) {
        const currentDay = nextDate.getDay();
        const currentDayName = days[currentDay].toLowerCase();
        
        if (!this.deliveryDays.includes(currentDayName)) {
          // Find the next valid delivery day
          const nextDayIndex = this.deliveryDays
            .map(day => days.indexOf(day))
            .sort((a, b) => a - b)
            .find(dayIndex => dayIndex > currentDay) || 
            days.indexOf(this.deliveryDays[0]) + 7;
          
          const daysToAdd = nextDayIndex - currentDay;
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        }
      }
      break;
      
    case 'monthly':
      // Default to the same day next month
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      // If we have specific delivery days, use the first one
      if (this.deliveryDays && this.deliveryDays.length > 0) {
        const dayOfMonth = new Date(nextDate).getDate();
        const targetDay = days.indexOf(this.deliveryDays[0]);
        const currentDay = new Date(nextDate).getDay();
        
        // Calculate days to add to reach the target day
        const daysToAdd = (targetDay - currentDay + 7) % 7;
        nextDate.setDate(dayOfMonth + daysToAdd);
        
        // If we've gone into the next month, adjust back to the last valid day
        const nextMonth = new Date(nextDate);
        if (nextMonth.getMonth() !== nextDate.getMonth()) {
          nextDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
        }
      }
      break;
  }
  
  return nextDate;
};

// Update next delivery date before saving
subscriptionSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('status') && this.status === 'active') {
    this.nextDeliveryDate = this.calculateNextDelivery();
  }
  this.updatedAt = Date.now();
  next();
});

// Add text index for search
subscriptionSchema.index({
  'products.product.name': 'text',
  status: 'text',
  specialInstructions: 'text'
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
