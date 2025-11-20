'use client';

import React from 'react';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-8 bg-bg min-h-screen">
      {/* Header Skeleton */}
      <div className="animate-pulse flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 mt-8">
        <div className="flex-1">
          <div className="h-6 md:h-8 bg-bg-light rounded loading-skeleton w-48 md:w-64 mb-2"></div>
          <div className="h-4 md:h-5 bg-bg-light rounded loading-skeleton w-64 md:w-96"></div>
        </div>
        <div className="h-10 md:h-12 bg-bg-light rounded loading-skeleton w-32 md:w-40"></div>
      </div>
      
      {/* Grid Skeleton */}
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 md:h-40 bg-bg-card rounded-xl animate-pulse">
              <div className="p-4 md:p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-bg-light rounded-lg loading-skeleton"></div>
                  <div className="h-4 bg-bg-light rounded loading-skeleton w-20"></div>
                </div>
                <div className="h-8 bg-bg-light rounded loading-skeleton w-16"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-bg-light rounded loading-skeleton w-full"></div>
                  <div className="h-3 bg-bg-light rounded loading-skeleton w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 h-64 md:h-80 bg-bg-card rounded-xl animate-pulse loading-skeleton"></div>
          <div className="h-64 md:h-80 bg-bg-card rounded-xl animate-pulse loading-skeleton"></div>
        </div>
        
        {/* Skills Row */}
        <div className="h-32 bg-bg-card rounded-xl animate-pulse loading-skeleton"></div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;