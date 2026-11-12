'use client';

import React from 'react';
import { Briefcase, Clock, ArrowRight, FolderOpen } from 'lucide-react';
import Link from 'next/link';

export interface TrackedApplication {
  id: string;
  role: string;
  company: string;
  status: string;
  appliedDate: string;
}

interface ApplicationTrackerProps {
  applications?: TrackedApplication[];
}

const statusStyle = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('interview')) return 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20';
  if (s.includes('offer')) return 'bg-[var(--live)]/10 text-[var(--live)] border-[var(--live)]/20';
  if (s.includes('reject') || s.includes('declined')) return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20';
  return 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/20';
};

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ applications = [] }) => {
  const visibleApplications = applications.slice(0, 4);

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[var(--text-muted)]" />
            Active Applications
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Track status and follow-ups
          </p>
        </div>
        <Link
          href="/application-tracking"
          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-dim)] flex items-center gap-1 whitespace-nowrap"
        >
          View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        {applications.length > 0 ? (
          <div className="flex gap-4 pb-2 min-w-max">
            {visibleApplications.map(app => (
              <div key={app.id} className="w-[240px] sm:w-[260px] bg-[var(--bg-deep)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-[var(--text-main)] truncate w-[140px] sm:w-[160px]">{app.role}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{app.company}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${statusStyle(app.status)}`}>
                    {app.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
                  <Clock size={12} /> {app.appliedDate}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-raised)] flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-[var(--text-dim)]" />
            </div>
            <p className="text-[var(--text-muted)] font-medium mb-1">No applications tracked</p>
            <p className="text-sm text-[var(--text-dim)]">Applications will appear here as you start applying.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationTracker;
