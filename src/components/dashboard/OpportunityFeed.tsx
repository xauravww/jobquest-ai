'use client';

import React from 'react';
import { Building, MapPin, ExternalLink, Save, X, Sparkles, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';

export interface FeedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  postedDate: string;
  aiScore: number;
  matchReason: string;
  url: string;
}

interface OpportunityFeedProps {
  jobs?: FeedJob[];
  onAction?: (id: string, action: 'track' | 'skip') => void;
}

const OpportunityFeed: React.FC<OpportunityFeedProps> = ({ jobs = [], onAction }) => {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--accent)]" />
            Live Opportunities
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            High-confidence matches from your agent
          </p>
        </div>
        <Link
          href="/ai-filtering"
          className="text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-dim)] flex items-center gap-1 group"
        >
          View All <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {jobs.length > 0 ? (
          jobs.map(job => (
            <div key={job.id} className="group bg-[var(--bg-deep)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)]/30 transition-all duration-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-[var(--text-main)] text-lg leading-tight group-hover:text-[var(--accent)] transition-colors">
                    {job.title}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mt-1">
                    <span className="flex items-center gap-1"><Building size={12} /> {job.company}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-1 bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold rounded border border-[var(--accent)]/20">
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
                  onClick={() => onAction?.(job.id, 'track')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-black text-sm font-bold rounded-lg transition-colors"
                >
                  <Save size={14} /> Track
                </button>
                <button
                  onClick={() => onAction?.(job.id, 'skip')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--text-muted)] text-sm font-medium rounded-lg transition-colors"
                >
                  <X size={14} /> Skip
                </button>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[var(--accent-soft)] text-[var(--accent)] rounded-lg hover:bg-[var(--accent)]/20 transition-colors"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--bg-raised)] flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-[var(--text-dim)]" />
            </div>
            <p className="text-[var(--text-muted)] font-medium mb-1">No matches yet</p>
            <p className="text-sm text-[var(--text-dim)]">Run a scan to find opportunities that fit your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityFeed;
