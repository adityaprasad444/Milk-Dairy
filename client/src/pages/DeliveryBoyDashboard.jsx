import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DeliveryBoyDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Delivery Boy Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Delivery Boy Dashboard
              </h2>
              <p className="text-gray-600">
                Welcome to the Milk Dairy Management System Delivery Panel
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This dashboard will contain delivery-specific features like:
              </p>
              <ul className="text-sm text-gray-500 mt-2 list-disc list-inside">
                <li>Delivery Assignments</li>
                <li>Route Optimization</li>
                <li>Delivery Status Updates</li>
                <li>Customer Feedback</li>
                <li>Earnings Tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeliveryBoyDashboard;
