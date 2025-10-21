import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { QueryProvider } from './providers/QueryProvider';

// Import components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AddressManagement from './pages/AddressManagement';

// Import dashboards
import AdminDashboard from './pages/AdminDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import DeliveryBoyDashboard from './pages/DeliveryBoyDashboard';
import ConsumerDashboard from './pages/ConsumerDashboard';
import DebugPage from './pages/DebugPage';

function App() {
  return (
    <QueryProvider>
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
            
            <Route path="/debug" element={
              <ProtectedRoute allowedRoles={['CONSUMER']}>
                <DebugPage />
              </ProtectedRoute>
            } />
            <Route path="/consumer/addresses" element={
              <ProtectedRoute allowedRoles={['CONSUMER']}>
                <AddressManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<Login />} />
          </Routes>
          
          <Toaster position="top-right" />
        </div>
      </Router>
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
