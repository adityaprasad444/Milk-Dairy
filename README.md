# Milk Dairy Management System

A comprehensive MERN stack application for managing milk dairy operations with role-based access control and real-time delivery tracking.

## Features

- **Role-based Access Control**: Admin, Distributor, Delivery Boy, and Consumer roles
- **Authentication System**: JWT-based authentication with secure password hashing
- **Order Management**: Complete order lifecycle from placement to delivery
- **Delivery Tracking**: Real-time delivery status updates with GPS tracking
- **Complaint Management**: Customer support ticket system
- **Product Management**: Inventory and product catalog management
- **Analytics Dashboard**: Performance metrics and reporting
- **Responsive Design**: Modern UI with Tailwind CSS

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hook Form** for form management
- **React Hot Toast** for notifications
- **React Big Calendar** for calendar integration

## Project Structure

```
milk-dairy-management-system/
├── server/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication & authorization
│   ├── controllers/     # Business logic
│   ├── config/          # Configuration files
│   └── server.js        # Main server file
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   └── utils/       # Utility functions
│   └── public/          # Static assets
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   MONGO_URI=your-mongodb-connection-string
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000
   CLIENT_URL=http://localhost:5173
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Role-based Routes
- `/api/admin/*` - Admin operations
- `/api/distributor/*` - Distributor operations
- `/api/deliveryboy/*` - Delivery boy operations
- `/api/consumer/*` - Consumer operations

## User Roles

### Admin
- User management
- System configuration
- Analytics and reporting
- Order oversight

### Distributor
- Order management
- Delivery assignment
- Customer management
- Inventory tracking

### Delivery Boy
- Delivery assignments
- Route optimization
- Status updates
- Customer feedback

### Consumer
- Place orders
- Track deliveries
- Manage subscriptions
- Raise complaints

## Development

### Running in Development
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### Building for Production
```bash
# Backend
cd server
npm run build

# Frontend
cd client
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.
