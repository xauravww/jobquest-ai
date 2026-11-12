'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Chrome, CheckCircle2, AlertCircle, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export const ExtensionBanner: React.FC = () => {
  const [installed, setInstalled] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  const checkStatus = () => {
    setChecking(true);
    // 1. Check local storage preference
    const storedConnected = localStorage.getItem('jobquest_extension_connected') === 'true';

    // 2. Ping content script if installed
    let resolved = false;
    const handlePong = (event: MessageEvent) => {
      if (event.data?.type === 'JOBQUEST_EXTENSION_PONG') {
        resolved = true;
        setInstalled(true);
        setConnected(event.data.payload?.connected ?? storedConnected);
        setChecking(false);
        window.removeEventListener('message', handlePong);
      }
    };

    window.addEventListener('message', handlePong);
    window.postMessage({ type: 'JOBQUEST_EXTENSION_PING' }, '*');

    // Fallback if extension content script is not running on this domain yet
    setTimeout(() => {
      if (!resolved) {
        setConnected(storedConnected);
        setChecking(false);
        window.removeEventListener('message', handlePong);
      }
    }, 450);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--text-main)]">
          <Chrome className="w-4 h-4" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-semibold text-[var(--text-main)]">
            Job Agent Extension
          </span>
          {checking ? (
            <span className="text-[11px] font-mono text-[var(--text-dim)] uppercase tracking-wider">
              Checking...
            </span>
          ) : connected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wide uppercase bg-[rgba(34,197,94,0.1)] text-[var(--live)] border border-[rgba(34,197,94,0.3)]">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wide uppercase bg-[rgba(239,68,68,0.1)] text-[var(--danger)] border border-[rgba(239,68,68,0.3)]">
              <AlertCircle className="w-3 h-3" />
              Disconnected
            </span>
          )}
          <span className="text-xs text-[var(--text-muted)] hidden md:inline">
            {connected
              ? 'Autofill and single-click job syncing are enabled.'
              : 'Connect your extension to enable automated form filling.'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs self-end sm:self-auto">
        <Link
          href="/user-profile"
          className="text-[var(--text-muted)] hover:text-white underline underline-offset-4 decoration-[var(--border-strong)] hover:decoration-white transition-colors"
        >
          Configure Profile
        </Link>
        <Link
          href="/settings?tab=extension"
          className="inline-flex items-center gap-1 text-[var(--text-main)] hover:text-white font-medium group"
        >
          <span>Extension Settings</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default ExtensionBanner;
