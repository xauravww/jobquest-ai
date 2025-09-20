'use client';

import React from 'react';

const SearchSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/40 rounded-full animate-spin animation-delay-150"></div>
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-5 bg-gray-700 rounded loading-skeleton w-48 mx-auto"></div>
        <div className="h-4 bg-gray-700 rounded loading-skeleton w-32 mx-auto"></div>
      </div>
      <div className="mt-4 flex items-center gap-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-100"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200"></div>
      </div>
    </div>
  );
};

export default SearchSkeleton;