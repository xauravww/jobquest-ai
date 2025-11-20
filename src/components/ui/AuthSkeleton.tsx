'use client';

import React from 'react';

const AuthSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700/50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-indigo-600 mx-auto mb-4"></div>
            <div className="animate-ping absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-indigo-600 rounded-full opacity-75"></div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-700 rounded loading-skeleton w-24 mx-auto"></div>
            <div className="h-4 bg-gray-700 rounded loading-skeleton w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSkeleton;