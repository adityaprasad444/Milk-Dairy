const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  getSubscriptionOrders,
  getSubscriptionOrder,
  updateSubscriptionOrderStatus
} = require('../controllers/subscriptionOrderController');

// All routes in this file are protected and use the 'auth' middleware
router.use(auth);

router.route('/')
  .get(authorize('admin', 'distributor', 'consumer'), getSubscriptionOrders);

router.route('/:id')
  .get(authorize('admin', 'distributor', 'consumer'), getSubscriptionOrder);

router.route('/:id/status')
  .patch(authorize('admin', 'distributor'), updateSubscriptionOrderStatus);

module.exports = router;
