'use client';

import React from 'react';

interface JobCardSkeletonProps {
  count?: number;
}

const JobCardSkeleton: React.FC<JobCardSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="bg-bg-card rounded-xl shadow-lg p-6 border border-border animate-pulse"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {/* Job title */}
              <div className="h-6 bg-gray-700 rounded loading-skeleton w-3/4 mb-3"></div>
              
              {/* Company and location info */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gray-700 rounded loading-skeleton mr-3"></div>
                  <div className="h-4 bg-gray-700 rounded loading-skeleton w-32"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gray-700 rounded loading-skeleton mr-3"></div>
                  <div className="h-4 bg-gray-700 rounded loading-skeleton w-24"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-gray-700 rounded loading-skeleton mr-3"></div>
                  <div className="h-4 bg-gray-700 rounded loading-skeleton w-20"></div>
                </div>
              </div>
              
              {/* Tags/badges */}
              <div className="flex items-center gap-2 mt-3">
                <div className="h-6 bg-gray-700 rounded-lg loading-skeleton w-16"></div>
                <div className="h-6 bg-gray-700 rounded-full loading-skeleton w-20"></div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col items-end gap-3 ml-4">
              <div className="flex flex-col gap-2">
                <div className="h-9 bg-gray-700 rounded-lg loading-skeleton w-20"></div>
                <div className="h-9 bg-gray-700 rounded-lg loading-skeleton w-16"></div>
              </div>
              <div className="h-9 bg-gray-700 rounded-lg loading-skeleton w-16"></div>
            </div>
          </div>
          
          {/* Description */}
          <div className="mt-4 p-4 bg-bg-light/50 rounded-lg">
            <div className="h-4 bg-gray-700 rounded loading-skeleton w-20 mb-2"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-700 rounded loading-skeleton w-full"></div>
              <div className="h-3 bg-gray-700 rounded loading-skeleton w-5/6"></div>
              <div className="h-3 bg-gray-700 rounded loading-skeleton w-4/6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobCardSkeleton;