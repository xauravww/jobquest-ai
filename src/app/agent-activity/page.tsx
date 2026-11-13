'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Select } from 'antd';
import {
  Bot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Search,
  X,
  Filter,
  RefreshCw,
  ArrowDownWideNarrow,
  Briefcase,
  Activity,
  FlaskConical,
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import Button from '@/components/ui/Button';

interface QuestionnaireEntry {
  questionId: string;
  question: string;
  answer: string;
  source: 'ai' | 'fallback';
  model?: string;
  answeredAt: string;
}

interface RunDetailApplication {
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
  questionnaire: QuestionnaireEntry[];
  url?: string;
}

interface RunDetail {
  _id: string;
  startedAt: string;
  finishedAt?: string;
  status: string;
  dryRun: boolean;
  currentStep?: string;
  resumeUsed?: string;
  stats: Record<string, number>;
  queries: Array<{ keyword: string; location: string; page: number; jobsFound: number; newJobs: number; error?: string }>;
  applications: RunDetailApplication[];
  harvested?: Array<{ jobId: string; title: string; company: string; location: string; matchScore: number; url: string; status: string; reasons?: string[]; applicationType?: 'easy_apply' | 'external' | 'unknown'; externalApplyUrl?: string }>;
  errors: Array<{ at: string; context: string; message: string }>;
}

const OUTCOME_META: Record<string, { label: string; icon: 'check' | 'x' | 'warn'; cls: string }> = {
  applied: { label: 'Applied', icon: 'check', cls: 'text-emerald-400' },
  'already-applied-on-platform': { label: 'Already on Naukri', icon: 'warn', cls: 'text-amber-400' },
  external: { label: 'External', icon: 'warn', cls: 'text-sky-400' },
  failed: { label: 'Failed', icon: 'x', cls: 'text-red-400' },
  questionnaire: { label: 'Questionnaire', icon: 'warn', cls: 'text-amber-400' },
  'dry-run': { label: 'Dry-run', icon: 'check', cls: 'text-[var(--text-muted)]' },
  skipped: { label: 'Skipped', icon: 'warn', cls: 'text-[var(--text-muted)]' },
};

const PAGE_SIZE = 12;

export default function AgentActivityPage() {
  const [runs, setRuns] = useState<RunDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunDetail | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // Search / filter / sort
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dryRunFilter, setDryRunFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/runs?limit=200');
      if (!res.ok) return;
      const data = await res.json();
      setRuns(data.runs || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const openRun = useCallback(async (id: string) => {
    setSelectedId(id);
    try {
      const res = await fetch(`/api/agent/runs/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setSelectedRun(data.run);
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedId) openRun(selectedId);
  }, [selectedId, openRun]);

  const filteredSorted = useMemo(() => {
    let list = runs;

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    // Dry-run filter
    if (dryRunFilter !== 'all') {
      const wantDry = dryRunFilter === 'dry-run';
      list = list.filter((r) => r.dryRun === wantDry);
    }
    // Text search
    const q = searchText.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const haystack = [
          String(r._id),
          new Date(r.startedAt).toLocaleString(),
          ...(r.queries || []).map((x) => `${x.keyword} ${x.location}`),
          ...(r.applications || []).map((a) => `${a.title} ${a.company}`),
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      });
    }
    // Sort
    const sorted = [...list];
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
        break;
      case 'applied':
        sorted.sort((a, b) => (b.stats?.applied ?? 0) - (a.stats?.applied ?? 0));
        break;
      case 'new':
        sorted.sort((a, b) => (b.stats?.newJobs ?? 0) - (a.stats?.newJobs ?? 0));
        break;
      default: // newest
        sorted.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }
    return sorted;
  }, [runs, searchText, statusFilter, dryRunFilter, sortBy]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, filteredSorted.length));
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredSorted.length]);

  const visibleRuns = filteredSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSorted.length;

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setDryRunFilter('all');
    setSortBy('newest');
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen space-y-4 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/job-search"
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                <Bot className="w-5 h-5 text-[var(--primary)]" />
                Agent Activity
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                What the Naukri Auto-Pilot did — every run, application, and answer.
              </p>
            </div>
          </div>
        </div>

        {/* Search + Filters bar */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]">
          <div className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 flex items-center bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg transition-colors">
                <Search className="ml-3 w-4 h-4 text-[var(--text-muted)] flex-shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setVisibleCount(PAGE_SIZE); }}
                  placeholder="Search runs, keywords, companies, jobs..."
                  className="w-full h-8 pl-2 pr-8 bg-transparent border-none outline-none text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                />
                {searchText && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setSearchText(''); setVisibleCount(PAGE_SIZE); }}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 w-7 h-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="shrink-0 h-8 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? 'Hide filters' : 'Filters'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={resetFilters}
                className="shrink-0 h-8 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset</span>
              </Button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[var(--border)] overflow-hidden"
              >
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Select
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v ?? 'all'); setVisibleCount(PAGE_SIZE); }}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'success', label: 'Success' },
                      { value: 'partial', label: 'Partial' },
                      { value: 'failed', label: 'Failed' },
                      { value: 'running', label: 'Running' },
                    ]}
                    allowClear
                    className="w-full"
                  />
                </div>

                <div className="relative">
                  <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Select
                    value={dryRunFilter}
                    onChange={(v) => { setDryRunFilter(v ?? 'all'); setVisibleCount(PAGE_SIZE); }}
                    options={[
                      { value: 'all', label: 'All Modes' },
                      { value: 'dry-run', label: 'Dry-run only' },
                      { value: 'live', label: 'Live only' },
                    ]}
                    allowClear
                    className="w-full"
                  />
                </div>

                <div className="relative">
                  <ArrowDownWideNarrow className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Select
                    value={sortBy}
                    onChange={(v) => { setSortBy(v ?? 'newest'); setVisibleCount(PAGE_SIZE); }}
                    options={[
                      { value: 'newest', label: 'Newest first' },
                      { value: 'oldest', label: 'Oldest first' },
                      { value: 'applied', label: 'Most applied' },
                      { value: 'new', label: 'Most new jobs' },
                    ]}
                    className="w-full"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)]">Loading…</div>
        ) : filteredSorted.length === 0 ? (
          <div className="py-16 text-center">
            <Bot className="w-8 h-8 text-[var(--text-dim)] mx-auto mb-3" />
            <p className="text-sm text-[var(--text-muted)]">No runs match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 text-[11px] text-[var(--text-muted)]">
                <span>{filteredSorted.length} run{filteredSorted.length !== 1 ? 's' : ''}</span>
                <span className="font-mono uppercase tracking-wide">{statusFilter !== 'all' ? statusFilter : 'all'} · {dryRunFilter !== 'all' ? dryRunFilter : 'all modes'}</span>
              </div>
              {visibleRuns.map((run) => (
                <RunCard key={String(run._id)} run={run} active={selectedId === String(run._id)} onClick={() => setSelectedId(String(run._id))} />
              ))}
              <div ref={sentinelRef} className="flex items-center justify-center py-4">
                {hasMore ? (
                  <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    Loading more…
                  </span>
                ) : filteredSorted.length > PAGE_SIZE ? (
                  <span className="text-xs text-[var(--text-dim)]">— End of runs —</span>
                ) : null}
              </div>
            </div>

            <div>
              {!selectedRun && selectedId ? (
                <div className="py-10 text-center text-xs text-[var(--text-muted)]">Loading run…</div>
              ) : !selectedRun ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] py-16 text-center text-xs text-[var(--text-muted)]">
                  Select a run to see details
                </div>
              ) : (
                <RunDetailView run={selectedRun} expandedJob={expandedJob} onToggleJob={setExpandedJob} />
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function RunCard({ run, active, onClick }: { run: RunDetail; active: boolean; onClick: () => void }) {
  const statusCls =
    run.status === 'running'
      ? 'text-amber-400'
      : run.status === 'failed'
        ? 'text-red-400'
        : run.status === 'partial'
          ? 'text-amber-400'
          : 'text-emerald-400';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
        active
          ? 'border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-sm'
          : 'border-[var(--border)] bg-[var(--bg-surface)]/50 hover:bg-[var(--bg-surface)]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`font-mono uppercase text-[11px] ${statusCls}`}>
          {run.status === 'running' ? '● Running' : run.status === 'partial' ? '◐ Partial' : run.status === 'failed' ? '✕ Failed' : '✓ Success'}
        </span>
        <span className="text-[11px] text-[var(--text-muted)]">
          {new Date(run.startedAt).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      <div className="mt-1.5 text-xs text-[var(--text-muted)] flex flex-wrap gap-x-3 gap-y-0.5">
        <span>new {run.stats?.newJobs ?? 0}</span>
        <span>applied {run.stats?.applied ?? 0}</span>
        <span>failed {run.stats?.applyFailed ?? 0}</span>
        <span>dupes {run.stats?.duplicateJobs ?? 0}</span>
        {run.stats?.questionnairesAnswered ? <span>Q&A {run.stats.questionnairesAnswered}</span> : null}
        {run.dryRun ? <span className="text-[var(--text-dim)]">dry-run</span> : null}
      </div>
    </button>
  );
}

function RunDetailView({
  run,
  expandedJob,
  onToggleJob,
}: {
  run: RunDetail;
  expandedJob: string | null;
  onToggleJob: (id: string | null) => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-main)]">Run {new Date(run.startedAt).toLocaleString()}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {run.dryRun ? 'dry-run' : 'live'} · resume: {run.resumeUsed || 'unknown'}
          </p>
        </div>
        <span className={`font-mono uppercase text-[11px] ${
          run.status === 'running' ? 'text-amber-400' : run.status === 'failed' ? 'text-red-400' : run.status === 'partial' ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {run.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="New" value={run.stats?.newJobs ?? 0} />
        <Stat label="Applied" value={run.stats?.applied ?? 0} good />
        <Stat label="Failed" value={run.stats?.applyFailed ?? 0} bad />
        <Stat label="Dupes skipped" value={run.stats?.duplicateJobs ?? 0} />
        <Stat label="Already on Naukri" value={run.stats?.skippedAppliedOnPlatform ?? 0} />
        <Stat label="External" value={run.stats?.skippedExternal ?? 0} />
      </div>

      {run.errors && run.errors.length > 0 && (
        <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 space-y-1">
          <p className="text-[11px] font-mono uppercase text-red-400">Errors</p>
          {run.errors.slice(0, 6).map((e, i) => (
            <p key={i} className="text-[11px] text-[var(--text-muted)] font-mono break-words">
              [{e.context}] {e.message}
            </p>
          ))}
        </div>
      )}

      {/* Jobs this run harvested */}
      {(run.harvested || []).length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase text-[var(--text-dim)] mb-2">
            Harvested ({run.harvested!.length})
          </p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {run.harvested!.slice(0, 100).map((h) => (
              <div key={h.jobId} className="rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-main)] truncate">{h.title}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {h.company} · {h.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {h.applicationType === 'external' ? (
                      <a
                        href={h.externalApplyUrl || h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                      >
                        External ↗
                      </a>
                    ) : h.applicationType === 'easy_apply' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        Easy Apply
                      </span>
                    ) : null}
                    <span className="text-[11px] font-mono text-emerald-400">{h.matchScore}%</span>
                    {h.url && (
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[var(--text-muted)] hover:text-white"
                      >
                        Open ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(run.applications || []).length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">No application attempts this run.</p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase text-[var(--text-dim)]">Applications</p>
          {run.applications.map((a, i) => {
            const id = `${a.jobId}-${i}`;
            const meta = OUTCOME_META[a.outcome] || OUTCOME_META.skipped;
            const open = expandedJob === id;
            return (
              <div key={id} className="rounded-lg border border-[var(--border)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => onToggleJob(open ? null : id)}
                  className="w-full px-3 py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg-deep)] transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[var(--text-main)] truncate">{a.title}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {a.company} · {a.matchScore}% match
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {a.httpStatus ? <span className="text-[10px] font-mono text-[var(--text-dim)]">HTTP {a.httpStatus}</span> : null}
                    <span className={`flex items-center gap-1 text-[11px] font-mono uppercase ${meta.cls}`}>
                      {meta.icon === 'check' ? <CheckCircle2 className="w-3 h-3" /> : meta.icon === 'x' ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {meta.label}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-[var(--border)] px-3 py-3 bg-[var(--bg-deep)]/50 space-y-3">
                    {a.errorSnippet && (
                      <p className="text-[10px] font-mono text-red-400/80 break-words">{a.errorSnippet}</p>
                    )}
                    <div>
                      <p className="text-[10px] font-mono uppercase text-[var(--text-dim)] mb-1.5">
                        Questionnaire audit ({a.questionnaire?.length || 0})
                      </p>
                      {(a.questionnaire || []).length === 0 ? (
                        <p className="text-[11px] text-[var(--text-muted)]">No questionnaire for this job.</p>
                      ) : (
                        <div className="space-y-2">
                          {a.questionnaire.map((q, qi) => (
                            <div key={qi} className="rounded-md bg-[var(--bg-surface)] border border-[var(--border)] px-2.5 py-2">
                              <p className="text-[11px] text-[var(--text-muted)]">{q.question}</p>
                              <p className="text-xs text-[var(--text-main)] mt-0.5">{q.answer}</p>
                              <p className={`text-[10px] font-mono mt-0.5 ${q.source === 'ai' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {q.source === 'ai' ? 'AI' : 'FALLBACK'}{q.model ? ` · ${q.model}` : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-[11px] text-[var(--text-muted)] hover:text-white underline underline-offset-2"
                      >
                        Open on Naukri →
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, good, bad }: { label: string; value: number; good?: boolean; bad?: boolean }) {
  return (
    <div className="rounded-lg bg-[var(--bg-deep)] border border-[var(--border)] px-3 py-2">
      <p className="text-lg font-semibold text-[var(--text-main)]">{value}</p>
      <p className={`text-[10px] font-mono uppercase tracking-wide ${bad ? 'text-red-400' : good ? 'text-emerald-400' : 'text-[var(--text-dim)]'}`}>
        {label}
      </p>
    </div>
  );
}
