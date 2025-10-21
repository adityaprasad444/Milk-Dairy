const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Import Swagger configuration
const { swaggerDocument, swaggerOptions, swaggerUi } = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const distributorRoutes = require('./routes/distributor');
const deliveryBoyRoutes = require('./routes/deliveryboy');
const consumerRoutes = require('./routes/consumer');
const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/deliveries');
const addressRoutes = require('./routes/address');
const subscriptionRoutes = require('./routes/subscription');
const subscriptionOrderRoutes = require('./routes/subscriptionOrders'); // Correctly referenced
const debugRoutes = require('./routes/debug');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
  
  // Start the subscription scheduler after MongoDB is connected
  if (process.env.NODE_ENV !== 'test') {
    const subscriptionScheduler = require('./jobs/subscriptionScheduler');
    subscriptionScheduler.start();
    console.log('Subscription scheduler started');
  }
})
.catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/distributor', distributorRoutes);
app.use('/api/deliveryboy', deliveryBoyRoutes);
app.use('/api/consumer', consumerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/subscription-orders', subscriptionOrderRoutes); // Correctly used
app.use('/api/debug', debugRoutes);

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Redirect root to API documentation
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Milk Dairy Management API is running!' });
});

// Serve swagger.yaml file directly
app.get('/swagger.yaml', (req, res) => {
  res.sendFile(__dirname + '/swagger.yaml');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
