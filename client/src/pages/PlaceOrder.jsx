import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PlaceOrderForm from '../components/PlaceOrderForm';

const PlaceOrder = () => {
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Place New Order</h1>
      <PlaceOrderForm />
    </div>
  );
};

export default PlaceOrder;
