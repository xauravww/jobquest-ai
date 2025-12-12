'use client';

import React, { useState, useEffect } from 'react';
import { Building, MapPin, Calendar, ExternalLink, Save, X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Simplified Job Type for Feed
interface FeedJob {
    id: string;
    title: string;
    company: string;
    location: string;
    postedDate: string;
    aiScore: number;
    matchReason: string;
    url: string;
}

const mockJobs: FeedJob[] = [
    {
        id: '1',
        title: 'Senior Frontend Engineer',
        company: 'Vercel',
        location: 'Remote',
        postedDate: '2 hours ago',
        aiScore: 95,
        matchReason: 'Perfect match for React & Next.js skills',
        url: '#'
    },
    {
        id: '2',
        title: 'Full Stack Developer',
        company: 'Stripe',
        location: 'San Francisco, CA',
        postedDate: '5 hours ago',
        aiScore: 88,
        matchReason: 'Strong backend alignment (Node.js)',
        url: '#'
    },
    {
        id: '3',
        title: 'Software Engineer, AI',
        company: 'OpenAI',
        location: 'San Francisco, CA',
        postedDate: '1 day ago',
        aiScore: 92,
        matchReason: 'Matches interest in AI/ML integration',
        url: '#'
    }
];

const OpportunityFeed = () => {
    const [jobs, setJobs] = useState<FeedJob[]>(mockJobs);

    const handleAction = (id: string, action: 'track' | 'skip') => {
        // In real app, this would call API
        setJobs(prev => prev.filter(j => j.id !== id));
    };

    return (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                        Live Opportunities
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Top high-confidence matches found by your agent
                    </p>
                </div>
                <Link
                    href="/ai-filtering"
                    className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-dim)] flex items-center gap-1 group"
                >
                    View All <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {jobs.length > 0 ? (
                    jobs.map(job => (
                        <div key={job.id} className="group bg-[var(--bg-deep)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--primary)]/30 transition-all duration-200">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-[var(--text-main)] text-lg leading-tight group-hover:text-[var(--primary)] transition-colors">
                                        {job.title}
                                    </h4>
                                    <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mt-1">
                                        <span className="flex items-center gap-1"><Building size={12} /> {job.company}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="px-2 py-1 bg-[var(--success)]/10 text-[var(--success)] text-xs font-bold rounded border border-[var(--success)]/20">
                                        {job.aiScore}% Match
                                    </span>
                                    <span className="text-[10px] text-[var(--text-dim)]">{job.postedDate}</span>
                                </div>
                            </div>

                            <div className="bg-[var(--bg-surface)] rounded-lg p-2 mb-4 text-xs text-[var(--text-muted)] border border-[var(--border)]">
                                <span className="font-semibold text-[var(--text-main)]">AI Insight:</span> {job.matchReason}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAction(job.id, 'track')}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--success)] hover:bg-[var(--success)]/90 text-black text-sm font-bold rounded-lg transition-colors"
                                >
                                    <Save size={14} /> Track
                                </button>
                                <button
                                    onClick={() => handleAction(job.id, 'skip')}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--text-muted)] text-sm font-medium rounded-lg transition-colors"
                                >
                                    <X size={14} /> Skip
                                </button>
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/20 transition-colors"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-[var(--text-muted)]">
                        <p>No new matches right now.</p>
                        <button className="mt-2 text-[var(--primary)] text-sm font-medium hover:underline">
                            Run a new scan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpportunityFeed;
