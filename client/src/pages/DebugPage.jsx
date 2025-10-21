import React from 'react';
import { useNavigate } from 'react-router-dom';
import DistributorDebug from '../components/debug/DistributorDebug';

const DebugPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Debug Information</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <DistributorDebug />
      </div>
    </div>
  );
};

export default DebugPage;
