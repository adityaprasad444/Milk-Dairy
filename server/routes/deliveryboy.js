const express = require('express');
const router = express.Router();

// Delivery boy routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Delivery boy routes' });
});

module.exports = router;
