'use client';

import React from 'react';
import { Building, MapPin, ExternalLink, Save, X, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

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
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6 flex-shrink-0">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
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
              <div className="flex justify-between items-start gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[var(--text-main)] text-lg leading-tight group-hover:text-[var(--accent)] transition-colors">
                    {job.title}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mt-1">
                    <span className="flex items-center gap-1"><Building size={12} /> {job.company}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="px-2 py-1 bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold rounded border border-[var(--accent)]/20">
                    {job.aiScore}% Match
                  </span>
                  <span className="text-[10px] text-[var(--text-dim)]">{job.postedDate}</span>
                </div>
              </div>

              <div className="bg-[var(--bg-surface)] rounded-lg p-2 mb-4 text-xs text-[var(--text-muted)] border border-[var(--border)]">
                <span className="font-semibold text-[var(--text-main)]">AI Insight:</span> {job.matchReason}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="primary"
                  onClick={() => onAction?.(job.id, 'track')}
                  leftIcon={<Save size={14} />}
                  className="flex-1 py-2 text-sm whitespace-nowrap"
                >
                  Track
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onAction?.(job.id, 'skip')}
                  leftIcon={<X size={14} />}
                  className="flex-1 py-2 text-sm whitespace-nowrap"
                >
                  Skip
                </Button>
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
