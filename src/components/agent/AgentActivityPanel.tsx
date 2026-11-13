'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Play,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  Globe,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Toggle from '@/components/ui/Toggle';

interface RunApplication {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  outcome: string;
  httpStatus?: number;
  errorSnippet?: string;
  questionnaireCount: number;
  aiAnswers: number;
  fallbackAnswers: number;
  resumeUsed?: string;
}

interface RunSummary {
  _id: string;
  startedAt: string;
  finishedAt?: string;
  status: string;
  dryRun: boolean;
  currentStep?: string;
  resumeUsed?: string;
  stats: {
    newJobs: number;
    duplicateJobs: number;
    applied: number;
    applyFailed: number;
    skippedAppliedOnPlatform: number;
    skippedExternal: number;
    questionnairesAnswered: number;
    aiAnswers: number;
    fallbackAnswers: number;
  };
  applications: RunApplication[];
  errors: Array<{ at: string; context: string; message: string }>;
}

const OUTCOME_META: Record<string, { label: string; cls: string }> = {
  applied: { label: 'Applied', cls: 'text-emerald-400' },
  'already-applied-on-platform': { label: 'Already on Naukri', cls: 'text-amber-400' },
  external: { label: 'External', cls: 'text-sky-400' },
  failed: { label: 'Failed', cls: 'text-red-400' },
  'dry-run': { label: 'Dry-run', cls: 'text-[var(--text-muted)]' },
  skipped: { label: 'Skipped', cls: 'text-[var(--text-muted)]' },
};

export function AgentActivityPanel() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [config, setConfig] = useState<{
    hasCreds: boolean;
    hasSession: boolean;
    autoApplyEnabled: boolean;
    applyThreshold: number;
    dailyApplyCap: number;
    maxSearchCallsPerRun: number;
    naukriEmail: string;
    naukriPassword: string;
  }>({
    hasCreds: false,
    hasSession: false,
    autoApplyEnabled: true,
    applyThreshold: 70,
    dailyApplyCap: 15,
    maxSearchCallsPerRun: 12,
    naukriEmail: '',
    naukriPassword: '',
  });
  const [showSetup, setShowSetup] = useState(false);
  const [savingSetup, setSavingSetup] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [capturingSession, setCapturingSession] = useState(false);
  const [captureMsg, setCaptureMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/runs?limit=5');
      if (!res.ok) throw new Error('failed to load runs');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/config');
      if (!res.ok) return;
      const data = await res.json();

      let hasSession = false;
      try {
        const sRes = await fetch('/api/agent/session');
        if (sRes.ok) {
          const sData = await sRes.json();
          hasSession = Boolean(sData?.hasSession);
        }
      } catch {}

      setConfig({
        hasCreds: Boolean(data.credentials?.naukriEmail),
        hasSession,
        autoApplyEnabled: Boolean(data.config?.autoApplyEnabled),
        applyThreshold: Number(data.config?.applyThreshold ?? 70),
        dailyApplyCap: Number(data.config?.dailyApplyCap ?? 15),
        maxSearchCallsPerRun: Number(data.config?.maxSearchCallsPerRun ?? 12),
        naukriEmail: data.credentials?.naukriEmail || '',
        naukriPassword: '',
      });
    } catch {}
  }, []);

  useEffect(() => {
    fetchRuns();
    fetchConfig();
  }, [fetchRuns, fetchConfig]);

  // Poll while any run is still 'running'
  useEffect(() => {
    const anyRunning = runs.some((r) => r.status === 'running');
    if (!anyRunning) return;
    const t = setInterval(fetchRuns, 2000);
    return () => clearInterval(t);
  }, [runs, fetchRuns]);

  const startRun = async () => {
    setError(null);
    setStarting(true);
    try {
      const res = await fetch('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to start run');
        return;
      }
      await fetchRuns();
    } catch (e: any) {
      setError(e?.message || 'Failed to start run');
    } finally {
      setStarting(false);
    }
  };

  const latestRunning = runs.find((r) => r.status === 'running');
  const latest = runs.find((r) => r.status !== 'running') || runs[0];

  const captureSession = () => {
    setCaptureMsg(null);
    setCapturingSession(true);
    setSetupError(null);

    const timeout = window.setTimeout(() => {
      window.removeEventListener('message', handleCaptureResult);
      setCapturingSession(false);
      setCaptureMsg({ ok: false, text: 'No response from extension. Is it installed and connected?' });
    }, 4000);

    const handleCaptureResult = async (event: MessageEvent) => {
      if (event.data?.type !== 'JOBQUEST_NAUKRI_COOKIES_RESULT') return;
      window.clearTimeout(timeout);
      window.removeEventListener('message', handleCaptureResult);

      const payload: any = event.data.payload || {};
      if (!payload.success || !payload.authorization || !payload.cookies) {
        setCapturingSession(false);
        setCaptureMsg({ ok: false, text: payload.error || 'Could not read session cookies from extension' });
        return;
      }

      try {
        const res = await fetch('/api/agent/session', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorization: payload.authorization, cookies: payload.cookies }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setCaptureMsg({ ok: false, text: data?.error || 'Failed to save session' });
        } else {
          setCaptureMsg({ ok: true, text: `Session captured (${payload.cookieCount} cookies). Agent can now run without a password.` });
          await fetchConfig();
        }
      } catch (e: any) {
        setCaptureMsg({ ok: false, text: e?.message || 'Failed to save session' });
      } finally {
        setCapturingSession(false);
      }
    };

    window.addEventListener('message', handleCaptureResult);
    window.postMessage({ type: 'JOBQUEST_GET_NAUKRI_COOKIES' }, '*');
  };

  const saveSetup = async () => {
    setSetupError(null);
    setSavingSetup(true);
    try {
      const body: any = {
        config: {
          autoApplyEnabled: config.autoApplyEnabled,
          applyThreshold: config.applyThreshold,
          dailyApplyCap: config.dailyApplyCap,
          maxSearchCallsPerRun: config.maxSearchCallsPerRun,
        },
      };
      if (config.naukriEmail && config.naukriPassword) {
        body.credentials = {
          naukriEmail: config.naukriEmail,
          naukriPassword: config.naukriPassword,
        };
      }
      const res = await fetch('/api/agent/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSetupError(data?.error || 'Failed to save settings');
        return;
      }
      await fetchConfig();
      setConfig((c) => ({ ...c, naukriPassword: '' }));
      setShowSetup(false);
    } catch (e: any) {
      setSetupError(e?.message || 'Failed to save settings');
    } finally {
      setSavingSetup(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--primary)]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-2">
              Naukri Auto-Pilot
              {latestRunning && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase text-amber-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  {latestRunning.currentStep || 'running'}
                </span>
              )}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Harvests, scores and auto-applies on Naukri with resume + duplicate guards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>Dry-run</span>
            <Toggle checked={dryRun} onChange={setDryRun} size="sm" label="Dry-run mode" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={startRun}
            disabled={starting || Boolean(latestRunning)}
            className="h-8 px-3 text-xs flex items-center gap-1.5"
          >
            {starting || latestRunning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{starting ? 'Starting…' : latestRunning ? 'Running…' : 'Run Agent'}</span>
          </Button>
        </div>
      </div>

      {/* Guard + credential notice */}
      <div className="px-4 pb-2 flex flex-wrap items-center gap-2 text-[11px]">
        {!config.hasCreds && !config.hasSession && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3 h-3" />
            Capture your Naukri session from the extension to run
          </span>
        )}
        {config.hasSession && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            Session captured — no password needed
          </span>
        )}
        {config.hasCreds && config.autoApplyEnabled && !config.hasSession && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            Auto-apply enabled · resume guard active
          </span>
        )}
        {config.hasCreds && !config.autoApplyEnabled && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-deep)] text-[var(--text-muted)] border border-[var(--border)]">
            <ShieldCheck className="w-3 h-3" />
            Auto-apply off — harvest only
          </span>
        )}
        {dryRun && (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--bg-deep)] text-[var(--text-muted)] border border-[var(--border)]">
            Dry-run: no real applications
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowSetup((s) => !s)}
          className={`text-xs font-medium ${showSetup ? 'text-white' : 'text-[var(--text-muted)] hover:text-white'} transition-colors`}
        >
          {showSetup ? 'Close' : 'Setup'}
        </button>
        <Link
          href="/agent-activity"
          className="inline-flex items-center gap-1 text-[var(--text-muted)] hover:text-white ml-auto transition-colors"
        >
          Full history
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {showSetup && (
        <div className="mx-4 mb-2 border border-[var(--border)] rounded-xl p-4 space-y-3">
          {/* Session capture (recommended, no password) */}
          <div className="rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[var(--text-main)]">Use your browser session (no password)</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {config.hasSession
                    ? 'A live Naukri session is captured from the extension. The agent reuses it.'
                    : 'Capture the session from your logged-in Naukri browser tab. Your password is never stored.'}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={captureSession}
                disabled={capturingSession}
                className="h-8 px-3 text-xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${capturingSession ? 'animate-spin' : ''}`} />
                <span>{capturingSession ? 'Capturing…' : config.hasSession ? 'Re-capture' : 'Capture session'}</span>
              </Button>
            </div>
            {captureMsg && (
              <p className={`mt-2 text-[11px] ${captureMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {captureMsg.text}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-dim)]">Naukri email</span>
              <input
                type="email"
                value={config.naukriEmail}
                onChange={(e) => setConfig((c) => ({ ...c, naukriEmail: e.target.value, hasCreds: Boolean(e.target.value) }))}
                placeholder={config.hasCreds ? 'Saved — update to change' : 'you@email.com'}
                className="mt-1 w-full h-8 px-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-dim)]">Naukri password</span>
              <input
                type="password"
                onChange={(e) => setConfig((c) => ({ ...c, naukriPassword: e.target.value }))}
                placeholder={config.hasCreds ? '•••••••• (saved)' : 'password'}
                className="mt-1 w-full h-8 px-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-dim)]">Apply threshold</span>
              <input
                type="number"
                min={0}
                max={100}
                value={config.applyThreshold}
                onChange={(e) => setConfig((c) => ({ ...c, applyThreshold: Number(e.target.value) }))}
                className="mt-1 w-full h-8 px-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-dim)]">Daily cap</span>
              <input
                type="number"
                min={1}
                value={config.dailyApplyCap}
                onChange={(e) => setConfig((c) => ({ ...c, dailyApplyCap: Number(e.target.value) }))}
                className="mt-1 w-full h-8 px-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-dim)]">Search calls/run</span>
              <input
                type="number"
                min={1}
                value={config.maxSearchCallsPerRun}
                onChange={(e) => setConfig((c) => ({ ...c, maxSearchCallsPerRun: Number(e.target.value) }))}
                className="mt-1 w-full h-8 px-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--border-strong)]"
              />
            </label>
            <div className="flex items-end">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>Auto-apply</span>
                <Toggle
                  checked={config.autoApplyEnabled}
                  onChange={(v) => setConfig((c) => ({ ...c, autoApplyEnabled: v }))}
                  size="sm"
                  label="Auto-apply enabled"
                />
              </div>
            </div>
          </div>

          {setupError && (
            <p className="text-[11px] text-red-400">{setupError}</p>
          )}

          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={saveSetup}
              disabled={savingSetup}
              className="h-8 px-3 text-xs"
            >
              {savingSetup ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs border border-red-500/30">
          {error}
        </div>
      )}

      {/* Latest run summary */}
      {loading ? (
        <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
          Loading agent activity…
        </div>
      ) : !latest ? (
        <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)]">
          No runs yet. Hit <span className="text-[var(--text-main)] font-medium">Run Agent</span> to start.
        </div>
      ) : (
        <div className="border-t border-[var(--border)]">
          <RunRow run={latest} expanded={expanded === latest._id} onToggle={() => setExpanded(expanded === latest._id ? null : latest._id)} />
        </div>
      )}
    </div>
  );
}

function RunRow({ run, expanded, onToggle }: { run: RunSummary; expanded: boolean; onToggle: () => void }) {
  const s = run.stats || {};
  const statusMeta =
    run.status === 'running'
      ? { label: 'Running', cls: 'text-amber-400' }
      : run.status === 'failed'
        ? { label: 'Failed', cls: 'text-red-400' }
        : run.status === 'partial'
          ? { label: 'Partial', cls: 'text-amber-400' }
          : { label: 'Success', cls: 'text-emerald-400' };

  return (
    <div>
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-deep)] transition-colors text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`font-mono uppercase text-[11px] tracking-wide ${statusMeta.cls}`}>
              {statusMeta.label}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(run.startedAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {run.dryRun && (
              <span className="text-[10px] font-mono uppercase text-[var(--text-dim)]">dry-run</span>
            )}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)] flex flex-wrap gap-x-3 gap-y-0.5">
            <span>Found {s.newJobs ?? 0} new</span>
            <span>{s.duplicateJobs ?? 0} dupes skipped</span>
            <span>Applied {s.applied ?? 0}</span>
            {s.applyFailed ? <span>Failed {s.applyFailed}</span> : null}
            {s.skippedAppliedOnPlatform ? <span>{s.skippedAppliedOnPlatform} already-on-Naukri</span> : null}
            {s.questionnairesAnswered ? <span>{s.questionnairesAnswered} Q&A</span> : null}
          </div>
          {run.resumeUsed && run.resumeUsed !== 'unknown' && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-dim)]">
              <Globe className="w-3 h-3" />
              resume: {run.resumeUsed}
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && <RunDetail run={run} />}
    </div>
  );
}

function RunDetail({ run }: { run: RunSummary }) {
  const apps = run.applications || [];
  const errs = run.errors || [];
  return (
    <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 space-y-3">
      {errs.length > 0 && (
        <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 space-y-1.5">
          <p className="text-[11px] font-mono uppercase text-red-400">Errors</p>
          {errs.slice(0, 5).map((e, i) => (
            <p key={i} className="text-[11px] text-[var(--text-muted)] font-mono break-words">
              [{e.context}] {e.message}
            </p>
          ))}
        </div>
      )}

      {apps.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No application attempts this run.</p>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[11px] font-mono uppercase text-[var(--text-dim)]">Applications</p>
          {apps.map((a, i) => {
            const meta = OUTCOME_META[a.outcome] || OUTCOME_META.skipped;
            return (
              <div key={i} className="rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-main)] truncate">{a.title}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{a.company}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.httpStatus ? (
                      <span className="text-[10px] font-mono text-[var(--text-dim)]">HTTP {a.httpStatus}</span>
                    ) : null}
                    <span className={`text-[11px] font-mono uppercase ${meta.cls}`}>{meta.label}</span>
                  </div>
                </div>
                {a.questionnaireCount > 0 && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span>{a.questionnaireCount} questions answered</span>
                    <span className="text-emerald-400">{a.aiAnswers} AI</span>
                    {a.fallbackAnswers > 0 && (
                      <span className="text-amber-400">{a.fallbackAnswers} fallback</span>
                    )}
                  </div>
                )}
                {a.errorSnippet && (
                  <p className="mt-1 text-[10px] font-mono text-red-400/80 break-words">{a.errorSnippet}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AgentActivityPanel;
