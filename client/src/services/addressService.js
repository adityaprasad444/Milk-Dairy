import api from './api';

const addressService = {
  // Get all addresses for the current user
  getAddresses: async () => {
    try {
      const response = await api.get('/addresses');
      // Return the data directly if it's an array, otherwise return the data property
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    } catch (error) {
      console.error('Error in getAddresses:', error);
      throw error.response?.data?.message || error.message || 'Failed to fetch addresses';
    }
  },

  // Add a new address
  addAddress: async (addressData) => {
    try {
      const formattedData = {
        name: addressData.name,
        phone: addressData.phone,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        landmark: addressData.landmark || '',
        isDefault: addressData.isDefault || false
      };
      const response = await api.post('/addresses', formattedData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to add address';
    }
  },

  // Update an existing address
  updateAddress: async (addressId, addressData) => {
    try {
      const formattedData = {
        name: addressData.name,
        phone: addressData.phone,
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        landmark: addressData.landmark || '',
        isDefault: addressData.isDefault || false
      };
      const response = await api.put(`/addresses/${addressId}`, formattedData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || error.message || 'Failed to update address';
    }
  },

  // Delete an address
  deleteAddress: async (addressId) => {
    try {
      const response = await api.delete(`/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Set an address as default
  setDefaultAddress: async (addressId) => {
    try {
      const response = await api.patch(`/addresses/${addressId}/set-default`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default addressService;
