'use client';

import React from 'react';

const CalendarSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]" />
          <div className="space-y-2">
            <div className="h-7 w-44 rounded-lg bg-[var(--bg-surface)]" />
            <div className="h-4 w-60 rounded bg-[var(--bg-surface)]/60" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]" />
          <div className="h-10 w-32 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
          <div className="flex gap-3">
            <div className="flex-1 h-9 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)]" />
            <div className="w-24 h-9 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)]" />
          </div>
        </div>
      </div>

      {/* 7-column calendar skeleton */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xl">
          {/* Header controls bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-deep)]/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-raised)]" />
              <div className="space-y-1.5">
                <div className="h-4 w-40 rounded bg-[var(--bg-raised)]" />
                <div className="h-3 w-28 rounded bg-[var(--bg-raised)]/60" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 rounded-md bg-[var(--bg-deep)]" />
              <div className="h-8 w-16 rounded-md bg-[var(--bg-deep)]" />
            </div>
          </div>

          {/* 7 columns grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)] min-h-[460px]">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="p-3.5 space-y-3 flex flex-col">
                <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-8 rounded bg-[var(--bg-raised)]" />
                    <div className="h-5 w-6 rounded bg-[var(--bg-raised)]" />
                  </div>
                  <div className="w-5 h-5 rounded-full bg-[var(--bg-deep)]" />
                </div>

                <div className="space-y-2 flex-1 pt-1">
                  {i % 2 === 0 ? (
                    <>
                      <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] space-y-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-[var(--bg-raised)]" />
                          <div className="h-2 w-12 rounded bg-[var(--bg-raised)]" />
                        </div>
                        <div className="h-3.5 w-5/6 rounded bg-[var(--bg-raised)]" />
                        <div className="h-2.5 w-1/2 rounded bg-[var(--bg-raised)]/70" />
                      </div>
                      {i % 4 === 0 && (
                        <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] space-y-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[var(--bg-raised)]" />
                            <div className="h-2 w-10 rounded bg-[var(--bg-raised)]" />
                          </div>
                          <div className="h-3.5 w-4/6 rounded bg-[var(--bg-raised)]" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-28 rounded-lg border border-dashed border-[var(--border)]/40 flex items-center justify-center" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarSkeleton;
