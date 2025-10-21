import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import NewOrderModal from '../components/NewOrderModal';
import SubscriptionModal from '../components/SubscriptionModal';

const ConsumerDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({ 
    totalOrders: 0, 
    totalDeliveries: 0, 
    orders: [] 
  });
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [hasDistributor, setHasDistributor] = useState(null);
  const [distributorChecked, setDistributorChecked] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [editingSubscription, setEditingSubscription] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchOrders();
    fetchDeliveries();
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    const verifyDistributor = async () => {
      try {
        await api.get('/consumer/products');
        setHasDistributor(true);
      } catch (error) {
        const msg = error?.response?.data?.message || '';
        if (error?.response?.status === 400 && msg.includes('No distributor assigned')) {
          setHasDistributor(false);
        } else {
          setHasDistributor(null);
        }
      } finally {
        setDistributorChecked(true);
      }
    };
    verifyDistributor();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/consumer/dashboard');
      if (response.data.success) {
        setDashboardData(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/consumer/orders');
      if (response.data.success) {
        console.log('Fetched orders:', response.data.data);
        setOrders(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await api.get('/consumer/deliveries');
      if (response.data.success) {
        setDeliveries(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      setDeliveries([]);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get('/consumer/subscriptions');
      if (response.data.success) {
        setSubscriptions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptions([]);
    }
  };

  const handleNewOrderClick = () => {
    setShowNewOrderModal(true);
  };
  
  const handleOrderSuccess = () => {
    setShowNewOrderModal(false);
    fetchOrders();
    fetchDashboardData();
  };
  
  const handleOrderCancel = () => {
    setShowNewOrderModal(false);
  };

  const handleSubscriptionClick = () => {
    setShowSubscriptionModal(true);
  };

  const handleSubscriptionSuccess = () => {
    setShowSubscriptionModal(false);
    fetchSubscriptions();
    fetchDashboardData();
  };

  const handleSubscriptionCancel = () => {
    setShowSubscriptionModal(false);
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    
    try {
      const { _id } = editingOrder;
      
      // Calculate new total amount
      const totalAmount = editingOrder.products?.reduce((sum, p) => sum + (p.quantity * p.price), 0) || 0;
      
      // Send the fields that should be updated
      const updateData = {
        deliveryDate: editingOrder.deliveryDate,
        deliveryTime: editingOrder.deliveryTime,
        products: editingOrder.products,
        totalAmount: totalAmount
      };
      
      const response = await api.put(`/consumer/orders/${_id}`, updateData);
      
      if (response.data.success) {
        toast.success('Order updated successfully!');
        
        // Close the edit modal
        setEditingOrder(null);
        
        // Refresh both orders and dashboard data
        await Promise.all([
          fetchOrders(),
          fetchDashboardData()
        ]);
      } else {
        toast.error(response.data.message || 'Failed to update order');
      }
      
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await api.put(`/consumer/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      fetchOrders();
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleEditOrder = async (order) => {
    // Fetch available products when opening edit modal
    try {
      const response = await api.get('/consumer/products');
      if (response.data.success) {
        setAvailableProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
    
    setEditingOrder({
      ...order,
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : ''
    });
  };

  const handleRemoveProduct = (index) => {
    if (editingOrder.products.length <= 1) {
      toast.error('Order must have at least one product');
      return;
    }
    const updatedProducts = editingOrder.products.filter((_, i) => i !== index);
    setEditingOrder({...editingOrder, products: updatedProducts});
  };

  const handleAddProduct = () => {
    // Add a placeholder product that user can select
    const newProduct = {
      name: '',
      quantity: 1,
      price: 0,
      unit: '',
      totalPrice: 0,
      _isNew: true // Flag to identify new products
    };
    setEditingOrder({
      ...editingOrder,
      products: [...editingOrder.products, newProduct]
    });
  };

  const handleProductSelect = (index, productId) => {
    const selectedProduct = availableProducts.find(p => p._id === productId);
    if (selectedProduct) {
      const updatedProducts = [...editingOrder.products];
      updatedProducts[index] = {
        name: selectedProduct.name,
        quantity: 1,
        price: selectedProduct.price,
        unit: selectedProduct.unit,
        totalPrice: selectedProduct.price,
        _productId: productId
      };
      setEditingOrder({...editingOrder, products: updatedProducts});
    }
  };

  const handleEditSubscription = async (subscription) => {
    // Fetch available products when opening edit modal
    try {
      const response = await api.get('/consumer/products');
      if (response.data.success) {
        setAvailableProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }

    setEditingSubscription({
      ...subscription,
      startDate: subscription.startDate ? new Date(subscription.startDate).toISOString().split('T')[0] : '',
      endDate: subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : '',
      deliveryTime: subscription.deliveryTime || '',
      frequency: subscription.subscriptionDetails?.frequency || 'daily',
      pausedDates: subscription.subscriptionDetails?.pausedDates || []
    });
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) return;

    try {
      const response = await api.delete(`/consumer/subscriptions/${subscriptionId}`);

      if (response.data.success) {
        toast.success('Subscription cancelled successfully');
        fetchSubscriptions();
        fetchDashboardData();
      } else {
        toast.error(response.data.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Consumer Dashboard</h1>
            <div className="flex items-center space-x-4">
              <a 
                href="/debug" 
                className="text-sm text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/debug', '_blank');
                }}
              >
                Debug Distributor
              </a>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 gap-5 mt-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Orders
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {dashboardData.totalOrders}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Upcoming Deliveries
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {dashboardData.totalDeliveries}
              </dd>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={handleNewOrderClick}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Place New Order
          </button>
          <button
            onClick={handleSubscriptionClick}
            className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors"
          >
            Add Subscription
          </button>
          <Link
            to="/consumer/addresses"
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors inline-flex items-center"
          >
            Manage Addresses
          </Link>
        </div>

        {/* New Order Modal */}
        {showNewOrderModal && (
          <NewOrderModal 
            onSuccess={handleOrderSuccess} 
            onClose={handleOrderCancel} 
          />
        )}

        {/* Subscription Modal */}
        {showSubscriptionModal && (
          <SubscriptionModal 
            onSuccess={handleSubscriptionSuccess} 
            onClose={handleSubscriptionCancel} 
          />
        )}

        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Orders</h3>
            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Slot
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order created on
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.orderNumber || order._id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {order.products && order.products.length > 0 ? (
                              order.products.map((p, index) => (
                                <div key={index}>
                                  {p.quantity} x {p.name || 'Unknown Product'}
                                  {index < order.products.length - 1 && ', '}
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400">No products</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                              order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{order.totalAmount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="capitalize">
                            {order.deliveryTime || 'Not set'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleEditOrder(order)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="text-gray-400 text-sm">No actions available</span>
                          )}
                          {!['PENDING', 'CANCELLED'].includes(order.status) && (
                            <span className="text-gray-500 text-sm">Order {order.status.toLowerCase()}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No orders found.</p>
            )}
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Deliveries</h3>
            {deliveries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scheduled Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {deliveries.map((delivery) => (
                      <tr key={delivery._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {delivery.deliveryNumber || delivery._id.substring(0, 8)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {delivery.items?.map(item => `${item.quantity} x ${item.name}`).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 
                              delivery.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 
                              'bg-blue-100 text-blue-800'}`}>
                            {delivery.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(delivery.scheduledDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No upcoming deliveries.</p>
            )}
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Active Subscriptions</h3>
            {subscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Frequency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Slot
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription._id}>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {subscription.products && subscription.products.length > 0 ? (
                              subscription.products.map((p, index) => (
                                <div key={index}>
                                  {p.quantity} x {p.product?.name || 'Unknown Product'}
                                  {index < subscription.products.length - 1 && ', '}
                                </div>
                              ))
                            ) : (
                              <span className="text-gray-400">No products</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {subscription.frequency || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {subscription.deliveryTime || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subscription.startDate 
                            ? new Date(subscription.startDate).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subscription.endDate 
                            ? new Date(subscription.endDate).toLocaleDateString() 
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${subscription.status === 'active' ? 'bg-green-100 text-green-800' : 
                              subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {subscription.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditSubscription(subscription)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleCancelSubscription(subscription._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No active subscriptions. Click "Add Subscription" to create one.</p>
            )}
          </div>
        </div>
      </main>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Order</h3>
              <form onSubmit={handleUpdateOrder}>
                {/* Products Section */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Products</label>
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      + Add Product
                    </button>
                  </div>
                  <div className="space-y-2">
                    {editingOrder.products?.map((product, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                        {product._isNew ? (
                          // New product - show dropdown
                          <div className="flex-1">
                            <select
                              value={product._productId || ''}
                              onChange={(e) => handleProductSelect(index, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">Select a product</option>
                              {availableProducts.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} - ₹{p.price}/{p.unit}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          // Existing product - show name
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                            <span className="text-xs text-gray-500 ml-2">₹{product.price}/{product.unit}</span>
                          </div>
                        )}
                        
                        {!product._isNew && (
                          <>
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-600">Qty:</label>
                              <input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => {
                                  const updatedProducts = [...editingOrder.products];
                                  updatedProducts[index].quantity = parseInt(e.target.value) || 1;
                                  updatedProducts[index].totalPrice = updatedProducts[index].quantity * product.price;
                                  setEditingOrder({...editingOrder, products: updatedProducts});
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                              <span className="text-sm text-gray-600">{product.unit}</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 w-20 text-right">
                              ₹{(product.quantity * product.price).toFixed(2)}
                            </div>
                          </>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove product"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm font-medium text-gray-700">Total: </span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{editingOrder.products?.reduce((sum, p) => sum + (p.quantity * p.price), 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Delivery Date */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={editingOrder.deliveryDate}
                    onChange={(e) => setEditingOrder({...editingOrder, deliveryDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Delivery Time Slot */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Time Slot</label>
                  <select
                    value={editingOrder.deliveryTime || 'morning'}
                    onChange={(e) => setEditingOrder({...editingOrder, deliveryTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="morning">Morning (7 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 9 PM)</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingSubscription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Subscription</h2>
                <button
                  onClick={() => setEditingSubscription(null)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label="Close modal"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpdateSubscription} className="space-y-6">
                {/* Products Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Products</h3>

                  {editingSubscription.products?.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product {index + 1}
                        </label>
                        {item._isNew ? (
                          <select
                            value={item._productId || ''}
                            onChange={(e) => handleSubscriptionProductSelect(index, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            required
                          >
                            <option value="">Select a product</option>
                            {availableProducts.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} - ₹{product.price}/{product.unit}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-2 border border-gray-300 rounded-md bg-gray-50">
                            <span className="text-sm font-medium text-gray-900">{item.name}</span>
                            <span className="text-xs text-gray-500 ml-2">₹{item.price}/{item.unit}</span>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <div className="flex">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updatedProducts = [...editingSubscription.products];
                              updatedProducts[index].quantity = parseInt(e.target.value) || 1;
                              setEditingSubscription({...editingSubscription, products: updatedProducts});
                            }}
                            className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-purple-500 focus:border-purple-500"
                            required
                          />
                          <span className="inline-flex items-center px-3 rounded-r-md bg-gray-100 text-gray-700 text-sm">
                            {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        {editingSubscription.products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubscriptionProduct(index)}
                            className="w-full py-2 px-3 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div>
                    <button
                      type="button"
                      onClick={handleAddSubscriptionProduct}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      + Add another product
                    </button>
                  </div>
                </div>

                {/* Subscription Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Subscription Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        value={editingSubscription.frequency}
                        onChange={(e) => setEditingSubscription({...editingSubscription, frequency: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Time
                      </label>
                      <select
                        value={editingSubscription.deliveryTime || 'morning'}
                        onChange={(e) => setEditingSubscription({...editingSubscription, deliveryTime: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="morning">Morning (7 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                        <option value="evening">Evening (5 PM - 9 PM)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editingSubscription.startDate}
                        onChange={(e) => setEditingSubscription({...editingSubscription, startDate: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        min={editingSubscription.startDate}
                        value={editingSubscription.endDate}
                        onChange={(e) => setEditingSubscription({...editingSubscription, endDate: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={editingSubscription.specialInstructions || ''}
                      onChange={(e) => setEditingSubscription({...editingSubscription, specialInstructions: e.target.value})}
                      rows="3"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Any special delivery instructions..."
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditingSubscription(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Update Subscription
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerDashboard;