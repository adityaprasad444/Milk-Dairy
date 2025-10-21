import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-indigo-700 text-white w-64 p-4">
        <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link to="/admin" className="block p-2 hover:bg-indigo-600 rounded">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/users" className="block p-2 hover:bg-indigo-600 rounded">
                Manage Users
              </Link>
            </li>
            <li>
              <Link to="/admin/assignments" className="block p-2 hover:bg-indigo-600 rounded">
                Assign Consumers
              </Link>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                className="w-full text-left p-2 hover:bg-indigo-600 rounded"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
