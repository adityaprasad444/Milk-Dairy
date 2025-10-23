const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('../routes/auth');
const addressRoutes = require('../routes/address');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/addresses', addressRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

module.exports = app;