'use client';

import React from 'react';

interface FormPageSkeletonProps {
  rows?: number;
}

const FormPageSkeleton: React.FC<FormPageSkeletonProps> = ({ rows = 3 }) => {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-[var(--bg-glass)] rounded w-1/3 animate-pulse"></div>

      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="bg-[var(--bg-surface)]/50 border border-[var(--border-glass)] rounded-xl p-6 animate-pulse"
        >
          <div className="h-4 bg-[var(--bg-glass)] rounded w-24 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-[var(--bg-glass)] rounded-lg w-full"></div>
            <div className="h-8 bg-[var(--bg-glass)] rounded-lg w-2/3"></div>
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-2">
        <div className="h-9 bg-[var(--bg-glass)] rounded-full w-24"></div>
        <div className="h-9 bg-[var(--bg-glass)] rounded-full w-28"></div>
      </div>
    </div>
  );
};

export default FormPageSkeleton;
