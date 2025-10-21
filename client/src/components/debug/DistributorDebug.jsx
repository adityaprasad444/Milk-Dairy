import React, { useState, useEffect } from 'react';
import { consumerAPI } from '../../services/api';
import { toast } from 'react-hot-toast';

const DistributorDebug = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      const response = await consumerAPI.get('/debug/user-distributor');
      if (response.data.success) {
        setDebugInfo(response.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch debug info');
      }
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Error fetching debug information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  if (loading) {
    return <div className="p-4">Loading debug information...</div>;
  }

  if (!debugInfo) {
    return <div className="p-4">No debug information available</div>;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h2 className="text-lg font-bold mb-4">Distributor Debug Information</h2>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-2">User Info</h3>
        <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
          {JSON.stringify(debugInfo.user, null, 2)}
        </pre>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Distributor Products</h3>
        {debugInfo.distributorProducts.count === 0 ? (
          <div className="bg-yellow-50 text-yellow-700 p-3 rounded">
            No products found for the assigned distributor.
          </div>
        ) : (
          <div>
            <p className="mb-2">
              Found {debugInfo.distributorProducts.count} products from distributor
            </p>
            <div className="bg-white p-3 rounded max-h-60 overflow-y-auto">
              <pre className="text-sm">
                {JSON.stringify(debugInfo.distributorProducts.products, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={fetchDebugInfo}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Debug Info
      </button>
    </div>
  );
};

export default DistributorDebug;
