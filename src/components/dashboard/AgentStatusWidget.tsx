'use client';

import React from 'react';
import { Activity, Power, RefreshCw, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface AgentStatusWidgetProps {
  totalScanned?: number;
  isActive?: boolean;
}

const AgentStatusWidget: React.FC<AgentStatusWidgetProps> = ({ totalScanned = 0, isActive = false }) => {
  return (
    <div className="w-full bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto min-w-0">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
            isActive
              ? 'bg-[var(--accent-soft)] border-[var(--accent)]'
              : 'bg-[var(--bg-deep)] border-[var(--border)]'
          }`}>
            <Activity className={`w-7 h-7 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              AI Agent
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]'
                  : 'text-[var(--text-muted)] border-[var(--border)]'
              }`}>
                {isActive ? 'Active' : 'Standby'}
              </span>
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {isActive ? 'Scanning job boards for matches...' : 'Ready to scan when you are.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
          <div className="text-center md:text-right">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 justify-center md:justify-end">
              <CheckCircle size={12} /> Scanned
            </div>
            <div className="text-2xl font-mono font-bold text-[var(--text-main)]">
              {totalScanned.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="primary"
            leftIcon={<Power size={18} />}
            className="flex-1 md:flex-none whitespace-nowrap"
          >
            Run Now
          </Button>
          <Button
            variant="ghost"
            aria-label="Refresh"
            className="p-3 bg-[var(--bg-deep)] border border-[var(--border)]"
          >
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgentStatusWidget;
