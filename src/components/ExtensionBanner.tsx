'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Chrome, ArrowUpRight, Terminal, ChevronDown } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

export const ExtensionBanner: React.FC = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [loggerEnabled, setLoggerEnabled] = useState<boolean>(false);
  const [naukriStatus, setNaukriStatus] = useState<{
    isLoggedIn: boolean;
    userEmail?: string;
    cookieCount?: number;
  }>({ isLoggedIn: false });
  const [checking, setChecking] = useState<boolean>(true);
  const [sessionsOpen, setSessionsOpen] = useState<boolean>(false);
  const sessionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let resolved = false;

    const readStored = (key: string) => {
      try {
        return localStorage.getItem(key) === 'true';
      } catch {
        return false;
      }
    };

    const handlePong = (event: MessageEvent) => {
      if (event.data?.type === 'JOBQUEST_EXTENSION_PONG') {
        resolved = true;
        if (event.data.payload?.connected !== undefined) {
          setConnected(event.data.payload.connected);
          try { localStorage.setItem('jobquest_extension_connected', String(event.data.payload.connected)); } catch {}
        }
        if (event.data.payload?.loggerEnabled !== undefined) {
          setLoggerEnabled(event.data.payload.loggerEnabled);
          try { localStorage.setItem('jobquest_extension_logger', String(event.data.payload.loggerEnabled)); } catch {}
        }
        if (event.data.payload?.naukri !== undefined) {
          setNaukriStatus({
            isLoggedIn: Boolean(event.data.payload.naukri.isLoggedIn),
            userEmail: event.data.payload.naukri.userEmail,
            cookieCount: event.data.payload.naukri.cookieCount,
          });
        }
        setChecking(false);
      }
      if (event.data?.type === 'JOBQUEST_NAUKRI_STATUS_RESULT') {
        if (event.data.payload?.isLoggedIn !== undefined) {
          setNaukriStatus((prev) => ({
            ...prev,
            isLoggedIn: event.data.payload.isLoggedIn,
            userEmail: event.data.payload.userEmail ?? prev.userEmail,
            cookieCount: event.data.payload.cookieCount ?? prev.cookieCount,
          }));
        }
      }
      if (event.data?.type === 'JOBQUEST_LOGGER_STATE_CHANGED') {
        setLoggerEnabled(event.data.payload?.loggerEnabled);
        try { localStorage.setItem('jobquest_extension_logger', String(event.data.payload?.loggerEnabled)); } catch {}
      }
      if (event.data?.type === 'JOBQUEST_CONNECTION_STATE_CHANGED') {
        setConnected(event.data.payload?.connected);
        try { localStorage.setItem('jobquest_extension_connected', String(event.data.payload?.connected)); } catch {}
      }
    };

    window.addEventListener('message', handlePong);

    // Ping now and keep retrying until the extension answers
    // (handles a content script that loads after the page).
    const ping = () => {
      if (!resolved) {
        try { window.postMessage({ type: 'JOBQUEST_EXTENSION_PING' }, '*'); } catch {}
      }
    };
    ping();
    const pingInterval = setInterval(ping, 1500);

    // Always resolve out of the "Checking" state quickly.
    const fallbackTimeout = setTimeout(() => {
      if (!resolved) {
        setConnected(readStored('jobquest_extension_connected'));
        setLoggerEnabled(readStored('jobquest_extension_logger'));
        setChecking(false);
      }
    }, 600);

    return () => {
      resolved = true;
      window.removeEventListener('message', handlePong);
      clearInterval(pingInterval);
      clearTimeout(fallbackTimeout);
    };
  }, []);

  useEffect(() => {
    if (!sessionsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sessionsRef.current && !sessionsRef.current.contains(e.target as Node)) {
        setSessionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sessionsOpen]);

  const handleToggleLogger = (enabled: boolean) => {
    setLoggerEnabled(enabled);
    localStorage.setItem('jobquest_extension_logger', String(enabled));
    window.postMessage({
      type: 'JOBQUEST_SET_LOGGER',
      payload: { enabled }
    }, '*');
  };

  const interactive = connected && !checking;

  const statusDot = checking
    ? 'bg-[var(--text-dim)] animate-pulse'
    : connected
      ? 'bg-[var(--live)]'
      : 'bg-[var(--danger)]';

  return (
    <div
      ref={sessionsRef}
      className={`relative flex items-center justify-between gap-4 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl ${interactive ? 'cursor-pointer' : ''}`}
      onClick={interactive ? () => setSessionsOpen((o) => !o) : undefined}
    >
      {/* Sessions dropdown */}
      {sessionsOpen && interactive && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-xl shadow-black/40">
          <div className="px-4 pt-3 pb-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)] mb-2">
              Portal Sessions
            </p>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${naukriStatus.isLoggedIn ? 'bg-[var(--live)]' : 'bg-[var(--danger)]'}`} />
              <div className="min-w-0 flex-1 flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-[var(--text-main)]">Naukri.com</span>
                <span className={`text-[11px] font-mono uppercase ${naukriStatus.isLoggedIn ? 'text-[var(--live)]' : 'text-[var(--danger)]'}`}>
                  {naukriStatus.isLoggedIn ? 'Active' : 'Not logged in'}
                </span>
              </div>
            </div>
            {naukriStatus.isLoggedIn && (naukriStatus.userEmail || typeof naukriStatus.cookieCount === 'number') && (
              <p className="mt-1 pl-5 text-[11px] text-[var(--text-muted)] truncate">
                {[naukriStatus.userEmail, typeof naukriStatus.cookieCount === 'number' ? `${naukriStatus.cookieCount} cookies` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
          <Link
            href="/settings?tab=extension"
            onClick={() => setSessionsOpen(false)}
            className="block px-4 py-2 text-[11px] font-medium text-[var(--text-muted)] hover:text-white border-t border-[var(--border)] transition-colors"
          >
            Manage in Settings →
          </Link>
        </div>
      )}

      {/* Left: identity + status + logger */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Chrome className="w-4 h-4 text-[var(--text-dim)] shrink-0" />
          <span className="text-sm font-semibold text-[var(--text-main)] whitespace-nowrap">
            Job Agent Extension
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide whitespace-nowrap">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          {checking ? 'Checking' : connected ? 'Connected' : 'Disconnected'}
          {connected && !checking && (
            <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${sessionsOpen ? 'rotate-180' : ''}`} />
          )}
        </span>

        <div
          className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-[var(--border)]"
          onClick={(e) => e.stopPropagation()}
        >
          <Terminal className="w-3.5 h-3.5 text-[var(--text-dim)]" />
          <span className="text-xs text-[var(--text-muted)]">cURL Logger</span>
          <Toggle
            checked={loggerEnabled}
            onChange={handleToggleLogger}
            size="sm"
            label="Toggle cURL Logger Mode"
          />
        </div>
      </div>

      {/* Right: links */}
      <div className="flex items-center gap-4 text-xs whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <Link
          href="/user-profile"
          className="text-[var(--text-muted)] hover:text-white transition-colors"
        >
          Configure Profile
        </Link>
        <Link
          href="/settings?tab=extension"
          className="inline-flex items-center gap-1 text-[var(--text-main)] hover:text-white font-medium group"
        >
          <span>Extension &amp; Logs</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default ExtensionBanner;
