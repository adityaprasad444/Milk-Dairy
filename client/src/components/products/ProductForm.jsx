import React, { useState, useEffect } from 'react';
import { XMarkIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

export const productCategories = [
  'MILK',
  'CURD',
  'BUTTER',
  'CHEESE',
  'GHEE',
  'PANEER',
  'OTHER'
];

export const unitOptions = [
  { value: 'liters', label: 'Liters' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'grams', label: 'Grams' },
  { value: 'packets', label: 'Packets' },
  { value: 'pieces', label: 'Pieces' }
];

const ProductForm = ({ product, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'MILK',
    description: '',
    price: '',
    unit: 'liters',
    minQuantity: 1,
    maxQuantity: 100,
    nutritionalInfo: {
      fat: 0,
      protein: 0,
      carbs: 0,
      calories: 0
    },
    shelfLife: 3,
    availableRegions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Shared styling for inputs/selects/textarea to beautify text boxes
  const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition';
    
  // Card container style
  const cardClass = 'bg-white shadow-sm rounded-lg p-4 border border-gray-100';
  // Section title style
  const sectionTitleClass = 'text-base font-medium text-gray-800 mb-3 pb-2 border-b border-gray-100';

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || 'MILK',
        description: product.description || '',
        price: product.price || '',
        unit: product.unit || 'liters',
        minQuantity: product.minQuantity || 1,
        maxQuantity: product.maxQuantity || 100,
        nutritionalInfo: {
          fat: product.nutritionalInfo?.fat || 0,
          protein: product.nutritionalInfo?.protein || 0,
          carbs: product.nutritionalInfo?.carbs || 0,
          calories: product.nutritionalInfo?.calories || 0
        },
        shelfLife: product.shelfLife || 3,
        availableRegions: product.availableRegions || []
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'minQuantity' || name === 'maxQuantity' || name === 'shelfLife' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleNutritionChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      nutritionalInfo: {
        ...prev.nutritionalInfo,
        [name]: parseFloat(value) || 0
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (product?._id) {
        // Update existing product
        await api.put(`/distributor/products/${product._id}`, formData);
      } else {
        // Create new product
        await api.post('/distributor/products', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
            <div className={cardClass}>
              <h3 className={sectionTitleClass}>Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition"
                  >
                    {productCategories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0) + category.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition"
                  />
                </div>

                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                    Unit *
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition"
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700">
                    Minimum Quantity
                  </label>
                  <input
                    type="number"
                    name="minQuantity"
                    id="minQuantity"
                    min="1"
                    value={formData.minQuantity}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition"
                  />
                </div>

                <div>
                  <label htmlFor="maxQuantity" className="block text-sm font-medium text-gray-700">
                    Maximum Quantity
                  </label>
                  <input
                    type="number"
                    name="maxQuantity"
                    id="maxQuantity"
                    min="1"
                    value={formData.maxQuantity}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition"
                  />
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className={cardClass}>
              <h3 className={sectionTitleClass}>Product Details</h3>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Nutritional Information Card */}
            <div className={cardClass}>
              <h3 className={sectionTitleClass}>Nutritional Information (per 100g)</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fat" className="block text-sm font-medium text-gray-700">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    name="fat"
                    id="fat"
                    min="0"
                    step="0.1"
                    value={formData.nutritionalInfo.fat}
                    onChange={handleNutritionChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    name="protein"
                    id="protein"
                    min="0"
                    step="0.1"
                    value={formData.nutritionalInfo.protein}
                    onChange={handleNutritionChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    name="carbs"
                    id="carbs"
                    min="0"
                    step="0.1"
                    value={formData.nutritionalInfo.carbs}
                    onChange={handleNutritionChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="calories" className="block text-sm font-medium text-gray-700">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    name="calories"
                    id="calories"
                    min="0"
                    value={formData.nutritionalInfo.calories}
                    onChange={handleNutritionChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error saving product</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
