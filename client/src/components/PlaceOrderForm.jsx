import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { consumerAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const PlaceOrderForm = () => {
  const [formData, setFormData] = useState({
    products: [
      { productId: '', quantity: 1 }
    ],
    deliveryDate: new Date().toISOString().split('T')[0], // Today's date as default
    deliveryTime: 'morning',
    deliveryAddress: {},
    specialInstructions: ''
  });
  
  const [availableProducts, setAvailableProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [hasDistributor, setHasDistributor] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user has an assigned distributor
  const checkDistributor = async () => {
    try {
      const response = await consumerAPI.get('/profile');
      if (!response.data.data?.assignedDistributor) {
        setHasDistributor(false);
        setLoading(false);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking distributor:', error);
      setHasDistributor(false);
      setLoading(false);
      return false;
    }
  };

  // Fetch available products and user addresses on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const hasDistributorAssigned = await checkDistributor();
        if (!hasDistributorAssigned) {
          setLoading(false);
          return;
        }
        setLoading(true);
        
        // Fetch available products from assigned distributor
       
        const productsResponse = await consumerAPI.get('/products');
        
        if (productsResponse.data.success) {
          if (productsResponse.data.message === 'No distributor assigned to your account. Please contact support.') {
            toast.error('No distributor assigned to your account. Please contact support.');
            return;
          }
          
          if (!productsResponse.data.data || productsResponse.data.data.length === 0) {
            toast.error('No products available from your distributor yet.');
            return;
          }
          
          // Transform products to include both ID and name for display
          const formattedProducts = productsResponse.data.data
            .filter(product => product.isActive !== false) // Ensure only active products
            .map(product => ({
              ...product,
              displayName: `${product.name} - ₹${product.price}/${product.unit}`
            }));
          
          if (formattedProducts.length === 0) {
            toast.error('No active products available from your distributor.');
            return;
          }
          
          setAvailableProducts(formattedProducts);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(formattedProducts.map(p => p.category))];
          setCategories(uniqueCategories);
          
          // If there's only one category, select it by default
          if (uniqueCategories.length === 1) {
            setSelectedCategory(uniqueCategories[0]);
            setFilteredProducts(formattedProducts.filter(p => p.category === uniqueCategories[0]));
          } else {
            setFilteredProducts(formattedProducts);
          }
        } else {
          const errorMessage = productsResponse.data.message || 'Failed to load products. Please try again.';
          toast.error(errorMessage);
        }
        
        // Fetch user addresses
        const addressesResponse = await consumerAPI.get('/addresses');
        if (addressesResponse.data.success) {
          setAddresses(addressesResponse.data.data);
          // Set default address if available
          const defaultAddress = addressesResponse.data.data.find(addr => addr.isDefault);
          if (defaultAddress) {
            setFormData(prev => ({
              ...prev,
              deliveryAddress: defaultAddress._id
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    
    // If changing the product, reset quantity to 1
    if (field === 'productId') {
      newProducts[index] = { 
        productId: value,
        quantity: 1
      };
    } else {
      newProducts[index] = { 
        ...newProducts[index], 
        [field]: field === 'quantity' ? parseInt(value) || 1 : value 
      };
    }
    
    setFormData(prev => ({
      ...prev,
      products: newProducts
    }));
  };

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, { productId: '', quantity: 1 }]
    }));
  };

  const removeProduct = (index) => {
    if (formData.products.length > 1) {
      const newProducts = formData.products.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        products: newProducts
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate products
    const hasEmptyProduct = formData.products.some(p => !p.productId);
    if (hasEmptyProduct) {
      toast.error('Please select a product for all items');
      setLoading(false);
      return;
    }

    // Validate quantities
    const hasInvalidQuantity = formData.products.some(p => {
      const product = availableProducts.find(ap => ap._id === p.productId);
      return p.quantity < (product?.minQuantity || 1) || 
             (product?.maxQuantity && p.quantity > product.maxQuantity);
    });

    if (hasInvalidQuantity) {
      toast.error('Please check the quantity for each product');
      setLoading(false);
      return;
    }

    // Validate delivery date
    if (!formData.deliveryDate) {
      toast.error('Please select a delivery date');
      setLoading(false);
      return;
    }

    try {
      // Get the selected address
      const selectedAddress = addresses.find(addr => addr._id === formData.deliveryAddress);
      
      if (!selectedAddress) {
        throw new Error('Please select a delivery address');
      }

      // Prepare order data
      const orderData = {
        products: formData.products.map(p => ({
          product: p.productId,
          quantity: p.quantity
        })),
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        deliveryAddress: selectedAddress._id,
        specialInstructions: formData.specialInstructions
      };

      const response = await consumerAPI.post('/orders', orderData);
      if (response.data.success) {
        toast.success('Order placed successfully!');
        navigate('/orders');
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get product details by ID
  const getProductDetails = (productId) => {
    return availableProducts.find(p => p._id === productId) || {};
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    
    if (category) {
      setFilteredProducts(availableProducts.filter(p => p.category === category));
    } else {
      setFilteredProducts(availableProducts);
    }
    
    // Reset product selection when category changes
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(p => ({
        ...p,
        productId: ''
      }))
    }));
  };

  // Calculate total price
  const calculateTotal = () => {
    return formData.products.reduce((total, item) => {
      const product = getProductDetails(item.productId);
      return total + (product?.price || 0) * (item.quantity || 0);
    }, 0);
  };

  if (!hasDistributor) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              No distributor has been assigned to your account yet. Please contact support to get assigned to a distributor before placing an order.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && formData.products.length === 1 && !formData.products[0].productId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Place New Order</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Products */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Products</h3>
            <button
              type="button"
              onClick={addProduct}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              disabled={loading}
            >
              + Add Product
            </button>
          </div>
          
          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <div className="flex space-x-2">
                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0) + category.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {formData.products.map((product, index) => {
            const productDetails = getProductDetails(product.productId);
            return (
              <div key={index} className="border p-4 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product
                    </label>
                    <div className="relative">
                      <select
                        value={product.productId}
                        onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8 appearance-none bg-white"
                        required
                        disabled={loading || filteredProducts.length === 0}
                      >
                        <option value="">Select a product</option>
                        {filteredProducts.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                    {loading ? (
                      <p className="mt-1 text-xs text-gray-500">Loading products from your distributor...</p>
                    ) : filteredProducts.length === 0 ? (
                      <div className="mt-2 p-2 bg-yellow-50 text-yellow-700 text-sm rounded">
                        {selectedCategory 
                          ? `No active products found in the ${selectedCategory.toLowerCase()} category.`
                          : 'No active products available from your distributor.'
                        }
                      </div>
                    ) : null}
                    {availableProducts.length > 0 && filteredProducts.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} from your distributor
                        {selectedCategory ? ` in ${selectedCategory}` : ''}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        min={productDetails?.minQuantity || 1}
                        max={productDetails?.maxQuantity || 100}
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                        className="w-full p-2 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <span className="bg-gray-100 px-3 flex items-center border-t border-b border-r rounded-r text-gray-700">
                        {productDetails?.unit || 'unit'}
                      </span>
                    </div>
                    {productDetails && (
                      <p className="text-xs text-gray-500 mt-1">
                        Min: {productDetails.minQuantity || 1} - Max: {productDetails.maxQuantity || 'No limit'}
                      </p>
                    )}
                  </div>
                </div>
                
                {productDetails && (
                  <div className="text-sm text-gray-600">
                    <p>Price: ₹{productDetails.price} per {productDetails.unit}</p>
                    <p className="font-medium">
                      Subtotal: ₹{(productDetails.price * product.quantity).toFixed(2)}
                    </p>
                  </div>
                )}
                
                {formData.products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="text-red-500 text-sm hover:text-red-700 mt-2 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Delivery Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Delivery Information</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Address
            </label>
            <select
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading || addresses.length === 0}
            >
              <option value="">Select a delivery address</option>
              {addresses.map(address => (
                <option key={address._id} value={address._id}>
                  {`${address.street}, ${address.city}, ${address.state} - ${address.pincode}`}
                  {address.isDefault && ' (Default)'}
                </option>
              ))}
            </select>
            {addresses.length === 0 && !loading && (
              <p className="mt-1 text-sm text-red-600">
                No addresses found. Please add an address before placing an order.
              </p>
            )}
          </div>
          
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
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Time
              </label>
              <select
                value={formData.deliveryTime}
                onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
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
              rows={3}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any special delivery instructions..."
              disabled={loading}
            />
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Order Summary</h3>
          
          <div className="space-y-2">
            {formData.products.map((product, index) => {
              const productDetails = getProductDetails(product.productId);
              if (!productDetails) return null;
              
              return (
                <div key={index} className="flex justify-between">
                  <span>
                    {productDetails.name} × {product.quantity} {productDetails.unit}
                  </span>
                  <span>₹{(productDetails.price * product.quantity).toFixed(2)}</span>
                </div>
              );
            })}
            
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaceOrderForm;
