'use client';

import React from 'react';

interface ApplicationCardSkeletonProps {
  count?: number;
}

const ApplicationCardSkeleton: React.FC<ApplicationCardSkeletonProps> = ({ count = 5 }) => {
  return (
    <div className="grid grid-cols-1 gap-4 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Logo placeholder */}
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-deep)] border border-[var(--border)] shrink-0" />

              <div className="space-y-2 flex-1">
                {/* Title */}
                <div className="h-5 w-48 bg-[var(--bg-raised)] rounded" />

                {/* Company & Location */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-3.5 w-24 bg-[var(--bg-raised)]/70 rounded" />
                  <div className="h-3.5 w-20 bg-[var(--bg-raised)]/70 rounded" />
                  <div className="h-3.5 w-28 bg-[var(--bg-raised)]/70 rounded" />
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-5 w-16 bg-[var(--bg-deep)] border border-[var(--border)] rounded-full" />
                  <div className="h-5 w-20 bg-[var(--bg-deep)] border border-[var(--border)] rounded-full" />
                </div>
              </div>
            </div>

            {/* Actions placeholder */}
            <div className="flex items-center gap-2 self-end lg:self-center">
              <div className="h-8 w-8 bg-[var(--bg-raised)] rounded-lg" />
              <div className="h-8 w-8 bg-[var(--bg-raised)] rounded-lg" />
              <div className="h-8 w-8 bg-[var(--bg-raised)] rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ApplicationCardSkeleton;
