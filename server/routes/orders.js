const express = require('express');
const router = express.Router();

// Orders routes will be implemented here
router.get('/', (req, res) => {
  res.json({ message: 'Orders routes' });
});

module.exports = router;
