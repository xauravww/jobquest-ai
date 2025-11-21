'use client';

import React from 'react';

const SearchSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] rounded-xl p-6 animate-pulse">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-[var(--bg-glass)] rounded-lg w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-[var(--bg-glass)] rounded w-1/3"></div>
                <div className="h-4 bg-[var(--bg-glass)] rounded w-1/4"></div>
              </div>
              <div className="flex gap-2 mt-3">
                <div className="h-6 bg-[var(--bg-glass)] rounded-full w-20"></div>
                <div className="h-6 bg-[var(--bg-glass)] rounded-full w-24"></div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-10 bg-[var(--bg-glass)] rounded-lg w-24"></div>
              <div className="h-10 bg-[var(--bg-glass)] rounded-lg w-24"></div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-[var(--bg-glass)] rounded w-full"></div>
            <div className="h-4 bg-[var(--bg-glass)] rounded w-5/6"></div>
            <div className="h-4 bg-[var(--bg-glass)] rounded w-4/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchSkeleton;