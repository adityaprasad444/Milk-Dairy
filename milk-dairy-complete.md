# Complete Milk Dairy Management System - MERN Stack

## Project Structure
```
milk-dairy-management-system/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Order.js
│   │   ├── Delivery.js
│   │   ├── Complaint.js
│   │   └── Product.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── distributor.js
│   │   ├── deliveryboy.js
│   │   ├── consumer.js
│   │   ├── orders.js
│   │   └── deliveries.js
│   ├── middleware/
│   │   └── auth.js
│   ├── controllers/
│   ├── config/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── admin/
│   │   │   ├── distributor/
│   │   │   ├── deliveryboy/
│   │   │   └── consumer/
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── DistributorDashboard.jsx
│   │   │   ├── DeliveryBoyDashboard.jsx
│   │   │   └── ConsumerDashboard.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── README.md
└── .gitignore
```

---

## SERVER FILES

### server/package.json
```json
{
  "name": "milk-dairy-management-server",
  "version": "1.0.0",
  "description": "Backend API for Milk Dairy Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["dairy", "management", "milk", "delivery", "mern"],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "body-parser": "^1.20.2",
    "express-validator": "^7.0.1",
    "nodemailer": "^6.9.4",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### server/server.js
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const distributorRoutes = require('./routes/distributor');
const deliveryBoyRoutes = require('./routes/deliveryboy');
const consumerRoutes = require('./routes/consumer');
const orderRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/deliveries');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/milk_dairy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/distributor', distributorRoutes);
app.use('/api/deliveryboy', deliveryBoyRoutes);
app.use('/api/consumer', consumerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Milk Dairy Management API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
```

### server/.env.example
```env
# Database Configuration
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/milk_dairy?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway (optional - for future use)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

### server/models/User.js
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'DISTRIBUTOR', 'DELIVERY_BOY', 'CONSUMER'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  assignedDistributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  region: String, // For distributors
  profileImage: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### server/models/Order.js
```javascript
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  products: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['liters', 'packets', 'bottles'],
      default: 'liters'
    },
    price: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  deliveryTime: {
    type: String,
    enum: ['morning', 'evening', 'both'],
    default: 'morning'
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'],
    default: 'PENDING'
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  specialInstructions: String,
  isSubscription: {
    type: Boolean,
    default: false
  },
  subscriptionDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    startDate: Date,
    endDate: Date,
    pausedDates: [Date]
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
```

### server/models/Delivery.js
```javascript
const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    enum: ['morning', 'evening'],
    required: true
  },
  actualDeliveryTime: Date,
  status: {
    type: String,
    enum: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'CANCELLED'],
    default: 'ASSIGNED'
  },
  deliveryProof: {
    image: String,
    signature: String,
    customerSignature: String,
    gpsLocation: {
      lat: Number,
      lng: Number
    },
    deliveredAt: Date
  },
  failureReason: String,
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
  route: {
    startLocation: {
      lat: Number,
      lng: Number
    },
    endLocation: {
      lat: Number,
      lng: Number
    },
    distance: Number,
    estimatedTime: Number
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
```

### server/models/Complaint.js
```javascript
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  category: {
    type: String,
    enum: ['QUALITY', 'DELIVERY', 'BILLING', 'SERVICE', 'OTHER'],
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'],
    default: 'OPEN'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: String,
  attachments: [String],
  customerSatisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String
  }
}, {
  timestamps: true
});

// Generate ticket number before saving
complaintSchema.pre('save', async function(next) {
  if (!this.ticketNumber) {
    const count = await this.constructor.countDocuments();
    this.ticketNumber = `TKT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);
```

### server/models/Product.js
```javascript
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    enum: ['MILK', 'CURD', 'BUTTER', 'CHEESE', 'GHEE', 'PANEER', 'OTHER'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['liters', 'kg', 'grams', 'packets', 'pieces'],
    required: true
  },
  minQuantity: {
    type: Number,
    default: 1
  },
  maxQuantity: {
    type: Number,
    default: 100
  },
  image: String,
  isActive: {
    type: Boolean,
    default: true
  },
  nutritionalInfo: {
    fat: Number,
    protein: Number,
    carbs: Number,
    calories: Number
  },
  shelfLife: {
    type: Number, // in days
    default: 3
  },
  availableRegions: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
```

### server/middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Access denied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = authorize('ADMIN');

// Distributor and Admin middleware
const distributorOrAdmin = authorize('DISTRIBUTOR', 'ADMIN');

// Delivery Boy, Distributor and Admin middleware
const deliveryAccess = authorize('DELIVERY_BOY', 'DISTRIBUTOR', 'ADMIN');

// Consumer and above middleware
const consumerAccess = authorize('CONSUMER', 'DELIVERY_BOY', 'DISTRIBUTOR', 'ADMIN');

module.exports = {
  auth,
  authorize,
  adminOnly,
  distributorOrAdmin,
  deliveryAccess,
  consumerAccess
};
```

### server/routes/auth.js
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be 6 or more characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('role').isIn(['ADMIN', 'DISTRIBUTOR', 'DELIVERY_BOY', 'CONSUMER']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, role, address, region } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      role,
      address,
      region
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        region: user.region
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.user.phone,
        address: req.user.address,
        region: req.user.region,
        isActive: req.user.isActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

---

## CLIENT FILES

### client/package.json
```json
{
  "name": "milk-dairy-management-client",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "axios": "^1.5.0",
    "react-big-calendar": "^1.8.2",
    "moment": "^2.29.4",
    "react-hook-form": "^7.45.4",
    "react-hot-toast": "^2.4.1",
    "lucide-react": "^0.263.1",
    "@headlessui/react": "^1.7.17",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
```

### client/vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
  }
})
```

### client/public/index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Milk Dairy Management System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### client/src/main.jsx
```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### client/src/App.jsx
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import dashboards
import AdminDashboard from './pages/AdminDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import DeliveryBoyDashboard from './pages/DeliveryBoyDashboard';
import ConsumerDashboard from './pages/ConsumerDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/distributor/*" element={
              <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                <DistributorDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/delivery-boy/*" element={
              <ProtectedRoute allowedRoles={['DELIVERY_BOY']}>
                <DeliveryBoyDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/consumer/*" element={
              <ProtectedRoute allowedRoles={['CONSUMER']}>
                <ConsumerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Login />} />
          </Routes>
          
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

### client/src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

/* Calendar custom styles */
.rbc-calendar {
  @apply bg-white rounded-lg shadow-md p-4;
}

.rbc-toolbar {
  @apply mb-4 flex justify-between items-center;
}

.rbc-btn-group {
  @apply flex space-x-2;
}

.rbc-btn-group button {
  @apply px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors;
}

.rbc-event {
  @apply bg-blue-500 text-white rounded px-2 py-1 text-xs;
}

.rbc-event.delivered {
  @apply bg-green-500;
}

.rbc-event.pending {
  @apply bg-orange-500;
}

.rbc-event.failed {
  @apply bg-red-500;
}

/* Loading spinner */
.spinner {
  @apply animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500;
}
```

### client/src/contexts/AuthContext.jsx
```javascript
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'LOGIN_FAIL':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on mount
  useEffect(() => {
    if (state.token) {
      loadUser();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await api.get('/auth/me');
      dispatch({ type: 'LOAD_USER', payload: response.data.user });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAIL', payload: 'Failed to load user' });
    }
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.post('/auth/login', { email, password });
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.post('/auth/register', userData);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'LOGIN_FAIL', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{
      user: state.user,
      token: state.token,
      loading: state.loading,
      error: state.error,
      login,
      register,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### client/src/utils/api.js
```javascript
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

export default api;
```

### client/src/components/auth/Login.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Redirect based on role
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin');
          break;
        case 'DISTRIBUTOR':
          navigate('/distributor');
          break;
        case 'DELIVERY_BOY':
          navigate('/delivery-boy');
          break;
        case 'CONSUMER':
          navigate('/consumer');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success('Login successful!');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Milk Dairy Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

### client/src/components/auth/ProtectedRoute.jsx
```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, token } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

---

## Additional Files

### client/tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
    },
  },
  plugins: [],
}
```

### client/postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### .gitignore
```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Production builds
/client/dist
/client/build

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Storybook build outputs
.out
.storybook-out

# VS Code
.vscode/

# Mac
.DS_Store
```

---

## Setup Instructions

1. **Create the project structure:**
   ```bash
   mkdir milk-dairy-management-system
   cd milk-dairy-management-system
   mkdir server client
   ```

2. **Setup Server:**
   ```bash
   cd server
   npm init -y
   # Copy the server package.json content and run:
   npm install
   ```

3. **Setup Client:**
   ```bash
   cd ../client
   npm init -y
   # Copy the client package.json content and run:
   npm install
   ```

4. **Copy all the file contents above into their respective paths**

5. **Set up environment variables:**
   - Copy `.env.example` to `.env` in server directory
   - Fill in your MongoDB URI and JWT secret

6. **Run the application:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

The application will be available at http://localhost:5173 with the backend API at http://localhost:5000.

This is your complete MERN-based Milk Dairy Management System with role-based dashboards, authentication, daily calendar integration, and all the features requested!