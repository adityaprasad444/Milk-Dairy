import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  FiEdit, 
  FiTrash2, 
  FiMapPin, 
  FiUser, 
  FiPhone, 
  FiHome, 
  FiMap,
  FiPlus,
  FiCheck
} from 'react-icons/fi';
import addressService from '../../services/addressService';
import AddressForm from './AddressForm';

const AddressList = ({ onEditStart }) => {
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      
      const response = await addressService.getAddresses();
      
      // The addresses are directly in the response.data array
      setAddresses(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data
      });
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await addressService.deleteAddress(addressId);
        toast.success('Address deleted successfully');
        fetchAddresses();
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error(error.message || 'Failed to delete address');
      }
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      await addressService.setDefaultAddress(addressId);
      toast.success('Default address updated');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error(error.message || 'Failed to set default address');
    }
  };

  const handleSuccess = () => {
    setEditingAddress(null);
    fetchAddresses();
    if (onEditStart) onEditStart(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-gray-500">Loading your addresses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {editingAddress && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingAddress._id ? 'Edit Address' : 'Add New Address'}
            </h2>
          </div>
          <div className="p-6">
            <AddressForm 
              address={editingAddress} 
              onSuccess={handleSuccess} 
              onCancel={() => setEditingAddress(null)} 
            />
          </div>
        </div>
      )}

      {addresses.length === 0 && !editingAddress ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="mx-auto w-16 h-16 flex items-center justify-center bg-blue-50 rounded-full mb-4">
            <FiMapPin className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No saved addresses</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            You haven't added any delivery addresses yet. Add your first address to get started.
          </p>
          <button
            onClick={() => setEditingAddress({})}
            className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <FiPlus className="mr-2" /> Add Your First Address
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-md overflow-hidden ${
                  address.isDefault ? 'border-blue-500' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="p-6">
                  {address.isDefault && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
                      <FiCheck className="mr-1.5" size={14} /> Default Address
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <FiUser size={18} />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-base font-medium text-gray-900">{address.name}</h3>
                        <p className="text-sm text-gray-500">Full Name</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <FiPhone size={18} />
                      </div>
                      <div className="ml-4">
                        <p className="text-base text-gray-900">{address.phone}</p>
                        <p className="text-sm text-gray-500">Phone Number</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <FiHome size={18} />
                      </div>
                      <div className="ml-4">
                        <p className="text-base text-gray-900">{address.street}</p>
                        {address.landmark && (
                          <p className="text-sm text-gray-500">Landmark: {address.landmark}</p>
                        )}
                        <p className="text-sm text-gray-500">Street Address</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <FiMap size={18} />
                      </div>
                      <div className="ml-4">
                        <p className="text-base text-gray-900">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="text-sm text-gray-500">City, State, Pincode</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleSetDefault(address._id)}
                        disabled={address.isDefault}
                        className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full ${
                          address.isDefault
                            ? 'bg-green-100 text-green-800 cursor-default'
                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        {address.isDefault ? '✓ Default' : 'Set as Default'}
                      </button>
                      
                      <button
                        onClick={() => setEditingAddress(address)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white text-xs font-medium rounded-full text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FiEdit className="mr-1.5" size={14} /> Edit
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(address._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                      title="Delete address"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressList;