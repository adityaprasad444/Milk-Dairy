import axios from 'axios';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
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

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle common errors (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || 'Something went wrong');
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Admin API
export const adminAPI = {
  // Users
  getUsers: (role) => api.get('/admin/users', { params: { role } }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  updateUserStatus: (id, isActive) => 
    api.patch(`/admin/users/${id}/status`, { isActive }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Assignments
  assignConsumer: (data) => api.post('/admin/assign-consumer', data),
  getConsumersByDistributor: (distributorId) => 
    api.get(`/admin/distributor/${distributorId}/consumers`),
};

// Consumer API
export const consumerAPI = {
  getDashboard: () => api.get('/consumer/dashboard'),
  placeOrder: (orderData) => api.post('/consumer/orders', orderData),
  getOrders: () => api.get('/consumer/orders'),
  getDeliveries: () => api.get('/consumer/deliveries'),
  updateProfile: (data) => api.put('/consumer/profile', data),
};

// Distributor API
export const distributorAPI = {
  getDashboard: () => api.get('/distributor/dashboard'),
  getOrders: () => api.get('/distributor/orders'),
  updateOrderStatus: (orderId, status) => 
    api.put(`/distributor/orders/${orderId}/status`, { status }),
  getConsumers: () => api.get('/distributor/consumers'),
};

// Delivery API
export const deliveryAPI = {
  getDeliveries: () => api.get('/delivery-boy/deliveries'),
  updateDeliveryStatus: (deliveryId, status) => 
    api.put(`/delivery-boy/deliveries/${deliveryId}/status`, { status }),
};

export default api;
