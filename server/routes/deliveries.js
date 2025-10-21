const express = require('express');
const router = express.Router();

// Deliveries routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Deliveries routes' });
});

module.exports = router;
