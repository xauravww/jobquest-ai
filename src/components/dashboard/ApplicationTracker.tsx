'use client';

import React from 'react';
import { Briefcase, Clock, Mail, MoreHorizontal, AlertTriangle, Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Application {
    id: string;
    role: string;
    company: string;
    status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
    appliedDate: string;
    daysSinceLastContact: number;
    followUpStatus: 'due' | 'sent' | 'none';
}

const mockApplications: Application[] = [
    {
        id: '1',
        role: 'Frontend Developer',
        company: 'Netflix',
        status: 'Applied',
        appliedDate: '3 days ago',
        daysSinceLastContact: 3,
        followUpStatus: 'due'
    },
    {
        id: '2',
        role: 'UX Engineer',
        company: 'Google',
        status: 'Interview',
        appliedDate: '1 week ago',
        daysSinceLastContact: 5,
        followUpStatus: 'none'
    },
    {
        id: '3',
        role: 'Product Designer',
        company: 'Airbnb',
        status: 'Applied',
        appliedDate: '5 days ago',
        daysSinceLastContact: 5,
        followUpStatus: 'due'
    }
];

const ApplicationTracker = () => {
    return (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[var(--secondary)]" />
                        Active Applications
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Track status and automate follow-ups
                    </p>
                </div>
                <Link
                    href="/application-tracking"
                    className="p-2 hover:bg-[var(--bg-light)] rounded-lg text-[var(--text-muted)] transition-colors"
                >
                    <MoreHorizontal size={20} />
                </Link>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar">
                <div className="flex gap-4 pb-2 min-w-max">
                    {mockApplications.map(app => (
                        <div key={app.id} className="w-[280px] bg-[var(--bg-deep)] border border-[var(--border)] rounded-xl p-4 flex flex-col">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-[var(--text-main)] truncate w-[180px]">{app.role}</h4>
                                    <p className="text-sm text-[var(--text-muted)]">{app.company}</p>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded border ${app.status === 'Applied' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    app.status === 'Interview' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                        'bg-[var(--bg-light)] text-[var(--text-muted)] border-[var(--border)]'
                                    }`}>
                                    {app.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-[var(--text-dim)] mb-4">
                                <Clock size={12} /> Applied {app.appliedDate}
                            </div>

                            {app.followUpStatus === 'due' ? (
                                <div className="mt-auto bg-[var(--warning)]/5 border border-[var(--warning)]/20 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-[var(--warning)] text-xs font-bold mb-2">
                                        <AlertTriangle size={12} /> Follow-up Recommended
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] mb-2">
                                        {app.daysSinceLastContact} days since last contact.
                                    </p>
                                    <button className="w-full flex items-center justify-center gap-2 py-1.5 bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-black text-xs font-bold rounded transition-colors">
                                        <Send size={12} /> Draft Email
                                    </button>
                                </div>
                            ) : (
                                <div className="mt-auto pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
                                    <span>On Track</span>
                                    <button className="hover:text-[var(--text-main)]">View Details</button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add New Card */}
                    <Link href="/application-tracking" className="w-[100px] flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] rounded-xl hover:border-[var(--primary)]/50 hover:bg-[var(--primary)]/5 transition-all group cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-[var(--bg-light)] flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors">
                            <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                        </div>
                        <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--primary)]">View All</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Helper for ArrowRight since it wasn't imported initially but used in the Add New Card
// import { ArrowRight as ArrowRightIcon } from 'lucide-react';

export default ApplicationTracker;
