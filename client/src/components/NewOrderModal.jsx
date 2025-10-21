import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const NewOrderModal = ({ onSuccess, onClose }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    products: [{ productId: '', quantity: 1 }],
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: 'morning',
    specialInstructions: ''
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Use the correct API endpoint and instance
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
  
      // Prepare order data
      const orderData = {
        products: formData.products.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity)
        })),
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        specialInstructions: formData.specialInstructions
      };
  
      // Submit order using the correct API instance
      const response = await api.post('/consumer/orders', orderData);
      
      if (response.data.success) {
        toast.success('Order placed successfully!');
        onSuccess();
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
            <h2 className="text-2xl font-bold text-gray-800">Place New Order</h2>
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
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
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
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  + Add another product
                </button>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Time
                  </label>
                  <select
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="morning">Morning (7 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 9 PM)</option>
                  </select>
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
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special delivery instructions..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Place Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewOrderModal;
