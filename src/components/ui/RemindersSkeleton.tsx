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
          className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] rounded-xl p-6 animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-6 bg-[var(--bg-glass)] rounded w-3/4 mb-4"></div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[var(--bg-glass)] rounded-full"></div>
                  <div className="h-4 bg-[var(--bg-glass)] rounded w-28"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[var(--bg-glass)] rounded-full"></div>
                  <div className="h-4 bg-[var(--bg-glass)] rounded w-20"></div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="h-3 bg-[var(--bg-glass)] rounded w-full"></div>
                <div className="h-3 bg-[var(--bg-glass)] rounded w-3/4"></div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 ml-4">
              <div className="h-6 bg-[var(--bg-glass)] rounded w-20"></div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-[var(--bg-glass)] rounded-lg"></div>
                <div className="w-10 h-10 bg-[var(--bg-glass)] rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RemindersSkeleton;