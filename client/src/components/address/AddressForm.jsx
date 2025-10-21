import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { 
  FiUser, 
  FiPhone, 
  FiMapPin, 
  FiHome, 
  FiMap, 
  FiNavigation, 
  FiCheck, 
  FiX,
  FiSave
} from 'react-icons/fi';
import addressService from '../../services/addressService';

const AddressForm = ({ address, onSuccess, onCancel }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: address || {
      name: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (address) {
      reset(address);
    }
  }, [address, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Prepare address data
      const addressData = {
        ...data,
        isDefault: data.isDefault || false
      };
      
      if (address?._id) {
        // Update existing address
        await addressService.updateAddress(address._id, addressData);
        toast.success('Address updated successfully');
      } else {
        // Add new address
        await addressService.addAddress(addressData);
        toast.success('Address added successfully');
      }
      
      // Call the success handler and then reload the page
      onSuccess();
      window.location.reload();
    } catch (error) {
      console.error('Error saving address:', error);
      const errorMessage = typeof error === 'string' 
        ? error 
        : error.message || 'Failed to save address. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {address ? 'Edit Address' : 'Add New Address'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {address ? 'Update your delivery address details' : 'Add a new delivery address'}
        </p>
      </div>
      
      <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            <FiUser className="inline mr-1.5 text-gray-400" />
            Full Name
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-4 text-gray-900 placeholder-gray-400"
              placeholder="John Doe"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <FiX className="mr-1" /> {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            <FiPhone className="inline mr-1.5 text-gray-400" />
            Phone Number
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="tel"
              {...register('phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Please enter a valid 10-digit phone number'
                }
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-4 text-gray-900 placeholder-gray-400"
              placeholder="9876543210"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <FiX className="mr-1" /> {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          <FiMapPin className="inline mr-1.5 text-gray-400" />
          Street Address
        </label>
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            {...register('street', { required: 'Street address is required' })}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-4 text-gray-900 placeholder-gray-400"
            placeholder="123 Main St, Apartment 4B"
          />
        </div>
        {errors.street && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <FiX className="mr-1" /> {errors.street.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            <FiMap className="inline mr-1.5 text-gray-400" />
            City
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              {...register('city', { required: 'City is required' })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-4 text-gray-900 placeholder-gray-400"
              placeholder="Mumbai"
            />
          </div>
          {errors.city && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <FiX className="mr-1" /> {errors.city.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            <FiNavigation className="inline mr-1.5 text-gray-400" />
            State
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              {...register('state', { required: 'State is required' })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-4 text-gray-900 placeholder-gray-400"
              placeholder="Maharashtra"
            />
          </div>
          {errors.state && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <FiX className="mr-1" /> {errors.state.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            <FiMapPin className="inline mr-1.5 text-gray-400" />
            Pincode
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              {...register('pincode', { 
                required: 'Pincode is required',
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: 'Please enter a valid 6-digit pincode'
                }
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-4 text-gray-900 placeholder-gray-400"
              placeholder="400001"
            />
          </div>
          {errors.pincode && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <FiX className="mr-1" /> {errors.pincode.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          <FiMapPin className="inline mr-1.5 text-gray-400" />
          Landmark <span className="text-gray-400">(Optional)</span>
        </label>
        <div className="relative rounded-md shadow-sm">
          <input
            type="text"
            {...register('landmark')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 py-2.5 px-4 text-gray-900 placeholder-gray-400"
            placeholder="Near Central Park, Opposite Metro Station"
          />
        </div>
      </div>

      <div className="flex items-center pt-2">
        <div className="flex items-center h-5">
          <input
            id="isDefault"
            type="checkbox"
            {...register('isDefault')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <label htmlFor="isDefault" className="ml-3 text-sm">
          <span className="font-medium text-gray-700">Set as default address</span>
          <p className="text-gray-500 text-xs mt-0.5">Use this as your primary delivery address</p>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <FiX className="mr-2 h-4 w-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <FiSave className="mr-2 h-4 w-4" />
              {address ? 'Update Address' : 'Save Address'}
            </>
          )}
        </button>
      </div>
      </div>
    </form>
  );
};

export default AddressForm;
