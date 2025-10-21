import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminAPI.getUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Calculate stats from users data
  const stats = {
    totalUsers: users.length,
    totalConsumers: users.filter(u => u.role === 'CONSUMER').length,
    totalDistributors: users.filter(u => u.role === 'DISTRIBUTOR').length,
    totalOrders: 0 // Temporary until orderAPI is implemented
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p className="mb-8">Welcome back, {user?.name}!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" />
        <StatCard title="Consumers" value={stats.totalConsumers} icon="👤" />
        <StatCard title="Distributors" value={stats.totalDistributors} icon="🏪" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon="📦" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
