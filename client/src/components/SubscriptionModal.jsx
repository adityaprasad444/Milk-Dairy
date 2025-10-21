import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

// Helper function to calculate duration between two dates
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Less than a day';
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;
  
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  
  if (months === 1 && remainingDays === 0) return '1 month';
  if (months === 1) return `1 month and ${remainingDays} days`;
  if (remainingDays === 0) return `${months} months`;
  return `${months} months and ${remainingDays} days`;
};

const SubscriptionModal = ({ onSuccess, onClose }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    subscriptionType: 'one-time', // 'one-time', 'weekly', 'monthly', 'custom'
    products: [{ productId: '', quantity: 1 }],
    frequency: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    deliveryTime: 'morning',
    deliveryAddress: '',
    specialInstructions: '',
    subscriptionDetails: {
      weekly: {
        days: [],
        weeks: 4
      },
      monthly: {
        deliveryDay: 1,
        months: 1
      }
    }
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get('/consumer/products');
        if (response.data.success) {
          setProducts(response.data.data || []);
        } else {
          toast.error(response.data.message || 'Failed to load products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        const errorMsg = error.response?.data?.message || 'Error loading products';
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form data
      const hasEmptyProduct = formData.products.some(p => !p.productId || p.quantity < 1);
      if (hasEmptyProduct) {
        toast.error('Please select a product and quantity for all items');
        return;
      }

      if (formData.subscriptionType !== 'one-time' && !formData.endDate) {
        toast.error('Please select an end date for the subscription');
        return;
      }

      // Prepare subscription data based on subscription type
      // Prepare products data in the format expected by the backend
      const productsData = formData.products
        .filter(item => item.productId) // Only include products that have been selected
        .map(item => {
          const product = products.find(p => p._id === item.productId);
          return {
            productId: item.productId,
            quantity: parseInt(item.quantity) || 1,
            price: product ? product.price : 0,
            unit: product ? product.unit : 'piece'
          };
        });

      // Build subscription data based on subscription type
      let subscriptionData = {
        products: productsData,
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.subscriptionType !== 'one-time' ? formData.endDate : '',
        deliveryTime: formData.deliveryTime,
        deliveryAddress: formData.deliveryAddress,
        specialInstructions: formData.specialInstructions
      };

      // Add subscription type specific data
      if (formData.subscriptionType === 'weekly') {
        if (formData.subscriptionDetails.weekly.days.length === 0) {
          toast.error('Please select at least one delivery day for weekly subscription');
          return;
        }
        subscriptionData = {
          ...subscriptionData,
          frequency: 'weekly',
          deliveryDays: formData.subscriptionDetails.weekly.days,
          weeks: formData.subscriptionDetails.weekly.weeks
        };
      } else if (formData.subscriptionType === 'monthly') {
        subscriptionData = {
          ...subscriptionData,
          frequency: 'monthly',
          deliveryDay: formData.subscriptionDetails.monthly.deliveryDay,
          months: formData.subscriptionDetails.monthly.months
        };
      } else if (formData.subscriptionType === 'custom') {
        subscriptionData = {
          ...subscriptionData,
          frequency: formData.frequency,
          customSchedule: formData.customSchedule || {}
        };
      }

      // Submit subscription
      const response = await api.post('/consumer/subscriptions', subscriptionData);
      
      if (response.data.success) {
        toast.success('Subscription created successfully!');
        onSuccess();
      } else {
        throw new Error(response.data.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    }
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { productId: '', quantity: 1 }]
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length <= 1) return;
    const newProducts = [...formData.products];
    newProducts.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      products: newProducts
    }));
  };

  const updateProduct = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      products: newProducts
    }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Loading products...</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Create Subscription</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Products</h3>
              
              {formData.products.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product {index + 1}
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateProduct(index, 'productId', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} - ₹{product.price}/{product.unit}
                        </option>
                      ))}
                    </select>
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
                        onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                      <span className="inline-flex items-center px-3 rounded-r-md bg-gray-100 text-gray-700 text-sm">
                        {products.find(p => p._id === item.productId)?.unit || 'unit'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    {formData.products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
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
                  onClick={addProduct}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  + Add another product
                </button>
              </div>
            </div>

            {/* Subscription Type Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Subscription Type</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {['one-time', 'weekly', 'monthly', 'custom'].map((type) => (
                  <div 
                    key={type}
                    onClick={() => setFormData(prev => ({...prev, subscriptionType: type}))}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.subscriptionType === type 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                        formData.subscriptionType === type 
                          ? 'border-purple-600 bg-purple-100 flex items-center justify-center'
                          : 'border-gray-300'
                      }`}>
                        {formData.subscriptionType === type && (
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div>
                        )}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 capitalize">
                        {type.split('-').join(' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {type === 'one-time' && 'One time delivery'}
                      {type === 'weekly' && 'Weekly subscription'}
                      {type === 'monthly' && 'Monthly subscription'}
                      {type === 'custom' && 'Custom schedule'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Subscription Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Delivery Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.subscriptionType === 'weekly' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Delivery Days
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                          const dayLower = day.toLowerCase();
                          const isSelected = formData.subscriptionDetails.weekly.days.includes(dayLower);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const days = [...prev.subscriptionDetails.weekly.days];
                                  const dayIndex = days.indexOf(dayLower);
                                  if (dayIndex > -1) {
                                    days.splice(dayIndex, 1);
                                  } else {
                                    days.push(dayLower);
                                  }
                                  return {
                                    ...prev,
                                    subscriptionDetails: {
                                      ...prev.subscriptionDetails,
                                      weekly: {
                                        ...prev.subscriptionDetails.weekly,
                                        days
                                      }
                                    }
                                  };
                                });
                              }}
                              className={`px-3 py-1.5 text-sm rounded-full ${
                                isSelected
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {day.substring(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (weeks)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.subscriptionDetails.weekly.weeks}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            subscriptionDetails: {
                              ...prev.subscriptionDetails,
                              weekly: {
                                ...prev.subscriptionDetails.weekly,
                                weeks: Math.min(Math.max(1, parseInt(e.target.value) || 1), 12)
                              }
                            }
                          }))}
                          className="w-20 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.subscriptionDetails.weekly.weeks} week{formData.subscriptionDetails.weekly.weeks > 1 ? 's' : ''} 
                          ({formData.subscriptionDetails.weekly.days.length} days per week)
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.subscriptionType === 'monthly' && (
                    <div className="col-span-2 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Day of Month
                        </label>
                        <select
                          value={formData.subscriptionDetails.monthly.deliveryDay}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            subscriptionDetails: {
                              ...prev.subscriptionDetails,
                              monthly: {
                                ...prev.subscriptionDetails.monthly,
                                deliveryDay: parseInt(e.target.value)
                              }
                            }
                          }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        >
                          {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>
                              {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (months)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={formData.subscriptionDetails.monthly.months}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            subscriptionDetails: {
                              ...prev.subscriptionDetails,
                              monthly: {
                                ...prev.subscriptionDetails.monthly,
                                months: Math.min(Math.max(1, parseInt(e.target.value) || 1), 12)
                              }
                            }
                          }))}
                          className="w-20 p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.subscriptionDetails.monthly.months} month{formData.subscriptionDetails.monthly.months > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.subscriptionType === 'custom' && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Frequency
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => setFormData(prev => ({...prev, frequency: e.target.value}))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="daily">Every day</option>
                        <option value="weekly">Every week</option>
                        <option value="biweekly">Every 2 weeks</option>
                        <option value="monthly">Every month</option>
                        <option value="bimonthly">Every 2 months</option>
                        <option value="quarterly">Every 3 months</option>
                        <option value="semiannually">Every 6 months</option>
                        <option value="annually">Every year</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Time
                    </label>
                    <select
                      value={formData.deliveryTime}
                      onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="morning">Morning (7 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                      <option value="evening">Evening (5 PM - 9 PM)</option>
                      <option value="flexible">Flexible (Anytime)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.subscriptionType === 'one-time' ? 'Delivery Date' : 'Start Date'}
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  {formData.subscriptionType !== 'one-time' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        min={formData.startDate}
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.startDate && formData.endDate ? (
                          `Total duration: ${calculateDuration(formData.startDate, formData.endDate)}`
                        ) : 'Select end date to see duration'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Any special delivery instructions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                  rows="2"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter delivery address..."
                  required
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Create Subscription
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
