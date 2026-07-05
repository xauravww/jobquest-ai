'use client';

import React from 'react';
import { CheckCircle, Filter, Mail, Search, AlertCircle, Inbox } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'scan' | 'filter' | 'match' | 'email' | 'alert';
  message: string;
  timestamp: string;
  details?: string;
}

interface ActivityLogProps {
  activities?: ActivityItem[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities = [] }) => {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'scan': return <Search size={14} className="text-[var(--accent)]" />;
      case 'filter': return <Filter size={14} className="text-[var(--text-muted)]" />;
      case 'match': return <CheckCircle size={14} className="text-[var(--live)]" />;
      case 'email': return <Mail size={14} className="text-[var(--text-muted)]" />;
      case 'alert': return <AlertCircle size={14} className="text-[var(--warning)]" />;
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 h-full flex flex-col overflow-hidden">
      <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2 flex-shrink-0">
        <ActivityIcon /> Activity
      </h3>

      {activities.length > 0 ? (
        <div className="flex-1 overflow-y-auto relative space-y-6 pl-10 before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-[var(--border)]">
          {activities.map((item) => (
            <div key={item.id} className="relative flex gap-3 items-start group">
              <div className="absolute -left-[33px] w-6 h-6 rounded-full border border-[var(--bg-surface)] flex items-center justify-center bg-[var(--bg-raised)] z-10">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-main)] truncate">{item.message}</p>
                {item.details && (
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{item.details}</p>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-dim)] whitespace-nowrap pt-0.5">
                {item.timestamp}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-raised)] flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-[var(--text-dim)]" />
          </div>
          <p className="text-[var(--text-muted)] font-medium mb-1">No activity yet</p>
          <p className="text-sm text-[var(--text-dim)]">Actions will show up here as your agent works.</p>
        </div>
      )}
    </div>
  );
};

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--accent)]">
    <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ActivityLog;
