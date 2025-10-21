import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import AddressList from '../components/address/AddressList';
import { useCallback, useState } from 'react';
import AddressForm from '../components/address/AddressForm';

const AddressManagement = () => {
  const navigate = useNavigate();
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleSuccess = useCallback(() => {
    setIsAddingNew(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors duration-200"
        >
          <FiArrowLeft className="mr-2" /> Back to Dashboard
        </button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your delivery addresses for faster checkouts
            </p>
          </div>
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <FiPlus className="mr-2" /> Add New Address
            </button>
          )}
        </div>
      </div>

      {isAddingNew && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h2>
          <AddressForm 
            onSuccess={handleSuccess} 
            onCancel={() => setIsAddingNew(false)} 
          />
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Saved Addresses</h2>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <AddressList onEditStart={() => setIsAddingNew(false)} />
        </div>
      </div>
    </div>
  );
};

export default AddressManagement;
