'use client';

import React from 'react';
import { CheckCircle, Filter, Mail, Search, AlertCircle } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'scan' | 'filter' | 'match' | 'email' | 'alert';
    message: string;
    timestamp: string;
    details?: string;
}

const mockActivities: ActivityItem[] = [
    {
        id: '1',
        type: 'email',
        message: 'Auto-Follow-up Sent',
        details: 'to Sarah at TechCorp',
        timestamp: '2 mins ago'
    },
    {
        id: '2',
        type: 'match',
        message: 'Found High Priority Match',
        details: 'Senior React Developer at Vercel',
        timestamp: '15 mins ago'
    },
    {
        id: '3',
        type: 'filter',
        message: 'Filtered 45 jobs',
        details: 'Low confidence score (<60%)',
        timestamp: '20 mins ago'
    },
    {
        id: '4',
        type: 'scan',
        message: 'Completed Scan Cycle',
        details: 'Analyzed 150 new listings',
        timestamp: '21 mins ago'
    },
    {
        id: '5',
        type: 'alert',
        message: 'Ghosting Alert',
        details: 'No response from Google for 5 days',
        timestamp: '1 hour ago'
    }
];

const ActivityLog = () => {
    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'scan': return <Search size={14} className="text-[var(--primary)]" />;
            case 'filter': return <Filter size={14} className="text-[var(--text-muted)]" />;
            case 'match': return <CheckCircle size={14} className="text-[var(--success)]" />;
            case 'email': return <Mail size={14} className="text-[var(--secondary)]" />;
            case 'alert': return <AlertCircle size={14} className="text-[var(--warning)]" />;
        }
    };

    return (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 h-full flex flex-col overflow-hidden">
            <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2 flex-shrink-0">
                <ActivityIcon /> Live Activity
            </h3>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative space-y-6 pl-10 before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-[var(--border)]">
                {mockActivities.map((item) => (
                    <div key={item.id} className="relative flex gap-3 items-start group">
                        <div className={`absolute -left-[33px] w-6 h-6 rounded-full border border-[var(--bg-surface)] flex items-center justify-center bg-[var(--bg-light)] z-10 group-hover:scale-110 transition-transform ${item.type === 'match' ? 'bg-[var(--success)]/10 border-[var(--success)]/30' :
                            item.type === 'email' ? 'bg-[var(--secondary)]/10 border-[var(--secondary)]/30' : ''
                            }`}>
                            {getIcon(item.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-main)] truncate">
                                {item.message}
                            </p>
                            {item.details && (
                                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                                    {item.details}
                                </p>
                            )}
                        </div>

                        <span className="text-[10px] text-[var(--text-dim)] whitespace-nowrap pt-0.5">
                            {item.timestamp}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ActivityIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--primary)]">
        <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default ActivityLog;
