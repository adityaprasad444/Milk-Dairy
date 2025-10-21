import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import UserManagement from './admin/UserManagement';
import AssignConsumers from './admin/AssignConsumers';

const AdminDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="assignments" element={<AssignConsumers />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminDashboard;
