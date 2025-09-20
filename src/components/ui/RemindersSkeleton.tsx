'use client';

import React from 'react';

interface RemindersSkeletonProps {
  count?: number;
}

const RemindersSkeleton: React.FC<RemindersSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="bg-bg-card rounded-xl shadow-lg p-6 border border-border animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Reminder title */}
              <div className="h-6 bg-gray-700 rounded loading-skeleton w-3/4 mb-3"></div>
              
              {/* Reminder details */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-700 rounded loading-skeleton mr-2"></div>
                  <div className="h-4 bg-gray-700 rounded loading-skeleton w-28"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-700 rounded loading-skeleton mr-2"></div>
                  <div className="h-4 bg-gray-700 rounded loading-skeleton w-20"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-700 rounded loading-skeleton mr-2"></div>
                  <div className="h-4 bg-gray-700 rounded loading-skeleton w-24"></div>
                </div>
              </div>
              
              {/* Description */}
              <div className="mt-3 space-y-2">
                <div className="h-3 bg-gray-700 rounded loading-skeleton w-full"></div>
                <div className="h-3 bg-gray-700 rounded loading-skeleton w-3/4"></div>
              </div>
            </div>
            
            {/* Status and actions */}
            <div className="flex flex-col items-end gap-2 ml-4">
              <div className="h-6 bg-gray-700 rounded loading-skeleton w-20"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded loading-skeleton"></div>
                <div className="w-8 h-8 bg-gray-700 rounded loading-skeleton"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RemindersSkeleton;