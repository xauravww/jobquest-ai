'use client';

import React from 'react';

interface ActivitySkeletonProps {
  count?: number;
}

const ActivitySkeleton: React.FC<ActivitySkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-lg loading-skeleton"></div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-5 bg-gray-700 rounded loading-skeleton w-48"></div>
                <div className="h-5 bg-gray-700 rounded loading-skeleton w-16"></div>
                <div className="h-5 bg-gray-700 rounded loading-skeleton w-20"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700 rounded loading-skeleton w-full"></div>
                <div className="h-4 bg-gray-700 rounded loading-skeleton w-3/4"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 bg-gray-700 rounded loading-skeleton w-24"></div>
                <div className="h-3 bg-gray-700 rounded loading-skeleton w-32"></div>
                <div className="h-3 bg-gray-700 rounded loading-skeleton w-20"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded loading-skeleton"></div>
              <div className="w-8 h-8 bg-gray-700 rounded loading-skeleton"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivitySkeleton;