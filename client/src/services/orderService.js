import api from './api';

export const getOrders = async (filters = {}) => {
  const { data } = await api.get('/api/consumer/orders', { params: filters });
  return data;
};

export const getSubscriptionOrders = async (filters = {}) => {
  const { data } = await api.get('/api/subscription-orders', { params: filters });
  return data;
};

export const createOrder = async (orderData) => {
  const { data } = await api.post('/api/orders', orderData);
  return data;
};

export const updateOrderStatus = async (orderId, status) => {
  const { data } = await api.patch(`/api/orders/${orderId}/status`, { status });
  return data;
};
