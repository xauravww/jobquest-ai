'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Chrome, CheckCircle2, AlertCircle, ArrowUpRight, Terminal } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

export const ExtensionBanner: React.FC = () => {
  const [installed, setInstalled] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [loggerEnabled, setLoggerEnabled] = useState<boolean>(false);
  const [naukriLoggedIn, setNaukriLoggedIn] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  const checkStatus = () => {
    setChecking(true);
    const storedConnected = localStorage.getItem('jobquest_extension_connected') === 'true';
    const storedLogger = localStorage.getItem('jobquest_extension_logger') === 'true';

    let resolved = false;
    const handlePong = (event: MessageEvent) => {
      if (event.data?.type === 'JOBQUEST_EXTENSION_PONG') {
        resolved = true;
        setInstalled(true);
        if (event.data.payload?.connected !== undefined) {
          setConnected(event.data.payload.connected);
          localStorage.setItem('jobquest_extension_connected', String(event.data.payload.connected));
        }
        if (event.data.payload?.loggerEnabled !== undefined) {
          setLoggerEnabled(event.data.payload.loggerEnabled);
          localStorage.setItem('jobquest_extension_logger', String(event.data.payload.loggerEnabled));
        }
        if (event.data.payload?.naukri?.isLoggedIn !== undefined) {
          setNaukriLoggedIn(event.data.payload.naukri.isLoggedIn);
        }
        setChecking(false);
      }
      if (event.data?.type === 'JOBQUEST_NAUKRI_STATUS_RESULT') {
        if (event.data.payload?.isLoggedIn !== undefined) {
          setNaukriLoggedIn(event.data.payload.isLoggedIn);
        }
      }
      if (event.data?.type === 'JOBQUEST_LOGGER_STATE_CHANGED') {
        setLoggerEnabled(event.data.payload?.loggerEnabled);
        localStorage.setItem('jobquest_extension_logger', String(event.data.payload?.loggerEnabled));
      }
      if (event.data?.type === 'JOBQUEST_CONNECTION_STATE_CHANGED') {
        setConnected(event.data.payload?.connected);
        localStorage.setItem('jobquest_extension_connected', String(event.data.payload?.connected));
      }
    };

    window.addEventListener('message', handlePong);
    window.postMessage({ type: 'JOBQUEST_EXTENSION_PING' }, '*');

    setTimeout(() => {
      if (!resolved) {
        setConnected(storedConnected);
        setLoggerEnabled(storedLogger);
        setChecking(false);
      }
    }, 450);

    return () => {
      window.removeEventListener('message', handlePong);
    };
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleToggleLogger = (enabled: boolean) => {
    setLoggerEnabled(enabled);
    localStorage.setItem('jobquest_extension_logger', String(enabled));
    window.postMessage({
      type: 'JOBQUEST_SET_LOGGER',
      payload: { enabled }
    }, '*');
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--text-main)] shrink-0">
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

          {/* Naukri Session Pill */}
          {naukriLoggedIn && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono tracking-wide uppercase bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Naukri Active
            </span>
          )}

          {/* Quick cURL Logger Mode Indicator / Control */}
          <div className="hidden sm:flex items-center gap-2 pl-3 ml-2 border-l border-[var(--border)]">
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-mono">
              <Terminal className="w-3.5 h-3.5 text-[var(--text-dim)]" />
              cURL Logger
            </span>
            <Toggle
              checked={loggerEnabled}
              onChange={handleToggleLogger}
              size="sm"
              label="Toggle cURL Logger Mode"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs self-end lg:self-auto pt-1 lg:pt-0">
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
          <span>Extension & Logs</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default ExtensionBanner;
