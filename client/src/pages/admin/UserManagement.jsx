import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import EditUser from './EditUser';

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch users with React Query
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users', filter],
    queryFn: () => {
      const role = filter === 'all' ? undefined : filter.toUpperCase();
      return adminAPI.getUsers(role);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) => 
      adminAPI.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (error) => {
      console.error('Error updating user status:', error);
      toast.error(error.message || 'Failed to update user status');
    },
  });

  const handleStatusToggle = (userId, currentStatus, userName) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} ${userName}?`)) {
      return;
    }
    
    updateStatusMutation.mutate(
      { userId, isActive: !currentStatus },
      {
        onSuccess: () => {
          toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        },
      }
    );
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = () => {
    setIsEditModalOpen(false);
    // Invalidate the users query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    toast.success('User updated successfully');
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.role === filter.toUpperCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && (searchTerm === '' || matchesSearch);
  });

  const getRoleBadge = (role) => {
    const roleColors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      DISTRIBUTOR: 'bg-blue-100 text-blue-800',
      CONSUMER: 'bg-green-100 text-green-800',
      DELIVERY_BOY: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${roleColors[role] || 'bg-gray-100'}`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading users...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link
          to="/admin/users/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add New User
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="ADMIN">Admins</option>
              <option value="DISTRIBUTOR">Distributors</option>
              <option value="CONSUMER">Consumers</option>
              <option value="DELIVERY_BOY">Delivery Boys</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleStatusToggle(user._id, user.isActive, user.name)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          user.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        disabled={user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN' && u.isActive).length <= 1}
                        title={user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN' && u.isActive).length <= 1 ? 'At least one active admin is required' : ''}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Edit User</h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <EditUser 
                user={editingUser} 
                onSuccess={handleUserUpdated}
                onCancel={() => setIsEditModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
