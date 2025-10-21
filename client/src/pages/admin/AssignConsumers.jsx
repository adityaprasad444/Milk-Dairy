import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../services/api';

export default function AssignConsumers() {
  const [consumers, setConsumers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [selectedConsumer, setSelectedConsumer] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [loading, setLoading] = useState({
    consumers: true,
    distributors: true,
    assigning: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consumersRes, distributorsRes] = await Promise.all([
          adminAPI.getUsers('CONSUMER'),
          adminAPI.getUsers('DISTRIBUTOR')
        ]);
        
        setConsumers(consumersRes);
        setDistributors(distributorsRes);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading({ consumers: false, distributors: false });
      }
    };

    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedConsumer || !selectedDistributor) {
      toast.error('Please select both a consumer and a distributor');
      return;
    }

    setLoading(prev => ({ ...prev, assigning: true }));

    try {
      await adminAPI.assignConsumer({
        consumerId: selectedConsumer,
        distributorId: selectedDistributor
      });

      // Update the consumer's assignedDistributor in local state
      setConsumers(consumers.map(consumer => 
        consumer._id === selectedConsumer 
          ? { ...consumer, assignedDistributor: selectedDistributor }
          : consumer
      ));

      toast.success('Consumer assigned successfully');
      setSelectedConsumer('');
    } catch (error) {
      console.error('Error assigning consumer:', error);
      toast.error(error.message || 'Failed to assign consumer');
    } finally {
      setLoading(prev => ({ ...prev, assigning: false }));
    }
  };

  const getDistributorName = (distributorId) => {
    const distributor = distributors.find(d => d._id === distributorId);
    return distributor ? distributor.name : 'Not assigned';
  };

  if (loading.consumers || loading.distributors) {
    return <div className="flex justify-center items-center h-64">Loading data...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Assign Consumers to Distributors</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">New Assignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Consumer
            </label>
            <select
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedConsumer}
              onChange={(e) => setSelectedConsumer(e.target.value)}
            >
              <option value="">Select a consumer</option>
              {consumers.map(consumer => (
                <option key={consumer._id} value={consumer._id}>
                  {consumer.name} ({consumer.email})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Distributor
            </label>
            <select
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedDistributor}
              onChange={(e) => setSelectedDistributor(e.target.value)}
            >
              <option value="">Select a distributor</option>
              {distributors.map(distributor => (
                <option key={distributor._id} value={distributor._id}>
                  {distributor.name} ({distributor.region || 'No region'})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={handleAssign}
          disabled={loading.assigning || !selectedConsumer || !selectedDistributor}
          className={`px-4 py-2 rounded-md text-white ${
            loading.assigning || !selectedConsumer || !selectedDistributor
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {loading.assigning ? 'Assigning...' : 'Assign Consumer'}
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <h2 className="text-lg font-medium p-6 border-b">Current Assignments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Distributor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consumers.map(consumer => (
                <tr key={consumer._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{consumer.name}</div>
                    <div className="text-sm text-gray-500">{consumer.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {consumer.assignedDistributor 
                        ? getDistributorName(consumer.assignedDistributor)
                        : 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      consumer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {consumer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
