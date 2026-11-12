'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import {
  Briefcase, Plus, Search, RefreshCw, Edit, Bell, FileText,
  MapPin, Calendar, Trash2, ExternalLink, Filter,
  X, Globe, Clock
} from 'lucide-react';
import dayjs from 'dayjs';
import { Select } from 'antd';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Button from "@/components/ui/Button";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { confirmAction } from '@/lib/confirm';

// --- Types ---
interface Job {
  _id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  status: string;
  datePosted: string;
  description: string;
  priority: string;
  platform: string;
  url: string;
  notes?: string;
  createdAt: string;
  appliedDate: string;
  resumeUsed?: string | { _id: string };
}

interface PopulatedJob {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  datePosted: string;
  url?: string;
}

interface ApiApplication {
  _id: string;
  jobId?: string | PopulatedJob;
  jobTitle?: string;
  title?: string;
  company?: string;
  location?: string;
  status?: string;
  createdAt?: string;
  appliedDate?: string;
  datePosted?: string;
  description?: string;
  priority?: string;
  platform?: string;
  notes?: string;
  resumeUsed?: string;
}

const ApplicationTrackingPage = () => {
  const router = useRouter();
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 10;
  const seqRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch jobs (infinite scroll)
  const fetchJobs = useCallback(async (pageToLoad: number, append: boolean) => {
    const mySeq = ++seqRef.current;
    const params = new URLSearchParams();
    params.append('page', String(pageToLoad));
    params.append('limit', String(LIMIT));
    if (searchText) params.append('search', searchText);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (priorityFilter !== 'all') params.append('priority', priorityFilter);
    if (platformFilter !== 'all') params.append('platform', platformFilter);

    if (append) setLoadingMore(true);
    else setInitialLoading(true);

    try {
      const response = await fetch(`/api/applications?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      if (mySeq !== seqRef.current) return;

      const transformedJobs: Job[] = data.applications.map((app: ApiApplication) => {
        const jobData = typeof app.jobId === 'object' ? app.jobId : {};
        return {
          _id: app._id,
          jobId: typeof app.jobId === 'object' ? app.jobId?._id || app._id : app.jobId || app._id,
          title: (jobData as PopulatedJob)?.title || app.jobTitle || app.title || 'Unknown Title',
          company: (jobData as PopulatedJob)?.company || app.company || 'Unknown Company',
          location: (jobData as PopulatedJob)?.location || app.location || 'Unknown Location',
          status: app.status || 'saved',
          datePosted: (jobData as PopulatedJob)?.datePosted || app.datePosted || app.createdAt || new Date().toISOString(),
          description: (jobData as PopulatedJob)?.description || app.description || '',
          priority: app.priority || 'medium',
          platform: app.platform || 'other',
          url: (jobData as PopulatedJob)?.url || '',
          notes: app.notes || '',
          createdAt: app.createdAt || new Date().toISOString(),
          appliedDate: app.appliedDate || new Date().toISOString(),
          resumeUsed: app.resumeUsed || undefined,
        };
      });

      setFilteredJobs((prev) => {
        if (!append) return transformedJobs;
        const seen = new Set(prev.map((j) => j._id));
        return [...prev, ...transformedJobs.filter((j) => !seen.has(j._id))];
      });
      setHasMore(transformedJobs.length >= LIMIT);
    } catch (error) {
      if (mySeq !== seqRef.current) return;
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      if (mySeq === seqRef.current) {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    }
  }, [searchText, statusFilter, priorityFilter, platformFilter]);

  // Reset + load first page when filters/search change
  useEffect(() => {
    setFilteredJobs([]);
    setPage(1);
    fetchJobs(1, false);
  }, [fetchJobs]);

  // Load the next page when the sentinel bumps `page`
  useEffect(() => {
    if (page > 1) fetchJobs(page, true);
  }, [page, fetchJobs]);

  // IntersectionObserver sentinel -> request next page near the bottom
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, initialLoading]);

  const handleDelete = (jobId: string) => {
    confirmAction({
      title: 'Delete this application?',
      onOk: async () => {
        try {
          const response = await fetch(`/api/applications/${jobId}`, { method: 'DELETE' });
          if (response.ok) {
            setFilteredJobs(prev => prev.filter(job => job._id !== jobId));
            toast.success('Application deleted');
          } else {
            toast.error('Failed to delete application');
          }
        } catch {
          toast.error('Failed to delete application');
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20';
      case 'interviewing': return 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/40';
      case 'offered': return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20';
      case 'rejected': return 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20';
      case 'submitted': return 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/40';
      case 'expired': return 'bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20';
      default: return 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border)]';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-[var(--danger)]';
      case 'medium': return 'text-[var(--warning)]';
      case 'low': return 'text-[var(--success)]';
      default: return 'text-[var(--text-muted)]';
    }
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen space-y-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-main)] flex items-center gap-3">
              <div className="p-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)]">
                <Briefcase className="w-8 h-8 text-[var(--primary)]" />
              </div>
              Application Tracking
            </h1>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/application-tracking/new')}
            className="px-6 py-3 bg-[var(--primary)] text-[var(--bg-deep)] font-bold rounded-xl hover:bg-[var(--primary-dim)] transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Application</span>
          </Button>
        </div>

        {/* Filters & Search (same UI as the Jobs Agent / job-search page) */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]">
          <div className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 flex items-center bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg transition-colors">
                <Search className="ml-3 w-4 h-4 text-[var(--text-muted)] flex-shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search jobs, companies..."
                  className="w-full h-8 pl-2 pr-8 bg-transparent border-none outline-none text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
                />
                {searchText && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSearchText('')}
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
                onClick={() => setShowFilters(v => !v)}
                className="shrink-0 h-8 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span>{showFilters ? 'Hide filters' : 'Filters'}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => { setSearchText(''); setStatusFilter('all'); setPriorityFilter('all'); setPlatformFilter('all'); }}
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
                    onChange={(v) => setStatusFilter(v ?? 'all')}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'saved', label: 'Saved' },
                      { value: 'applied', label: 'Applied' },
                      { value: 'interviewing', label: 'Interviewing' },
                      { value: 'offered', label: 'Offered' },
                      { value: 'rejected', label: 'Rejected' }
                    ]}
                    allowClear
                    className="w-full"
                  />
                </div>

                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Select
                    value={priorityFilter}
                    onChange={(v) => setPriorityFilter(v ?? 'all')}
                    options={[
                      { value: 'all', label: 'All Priorities' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' }
                    ]}
                    allowClear
                    className="w-full"
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Select
                    value={platformFilter}
                    onChange={(v) => setPlatformFilter(v ?? 'all')}
                    options={[
                      { value: 'all', label: 'All Platforms' },
                      { value: 'linkedin', label: 'LinkedIn' },
                      { value: 'naukri', label: 'Naukri' },
                      { value: 'company_website', label: 'Company Website' },
                      { value: 'other', label: 'Other' }
                    ]}
                    allowClear
                    className="w-full"
                  />
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Job List */}
        {initialLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-[var(--text-muted)]">Loading applications...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <motion.div
                    key={job._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--primary)]/50 rounded-xl p-5 transition-all hover:shadow-md group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-deep)] flex items-center justify-center border border-[var(--border)] text-[var(--primary)] font-bold text-xl">
                          {job.company.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors cursor-pointer" onClick={() => router.push(`/application-tracking/${job._id}/edit`)}>
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {job.company}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Posted: {dayjs(job.datePosted).format('MMM D')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className={`text-xs font-bold uppercase tracking-wider ${getPriorityColor(job.priority)}`}>
                          {job.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-2 lg:ml-auto">
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-deep)] rounded-lg transition-colors"
                            title="View Job Post"
                            aria-label="View Job Post"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => router.push(`/application-tracking/${job._id}/cover-letter`)}
                          className="p-2 text-[var(--accent)] hover:text-[var(--accent-dim)] hover:bg-[var(--bg-deep)] rounded-lg transition-colors"
            title="Generate Cover Letter"
                          aria-label="Generate Cover Letter"
                        >
                          <FileText className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => router.push(`/application-tracking/${job._id}/reminder`)}
                          className="p-2 text-[var(--warning)] hover:text-[var(--warning)]/80 hover:bg-[var(--bg-deep)] rounded-lg transition-colors"
                          title="Set Reminder"
                          aria-label="Set Reminder"
                        >
                          <Bell className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => router.push(`/application-tracking/${job._id}/edit`)}
                          className="p-2 text-[var(--primary)] hover:text-[var(--primary)]/80 hover:bg-[var(--bg-deep)] rounded-lg transition-colors"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDelete(job._id)}
                          className="p-2 text-[var(--danger)] hover:text-[var(--danger)]/80 hover:bg-[var(--bg-deep)] rounded-lg transition-colors"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-surface)]">
                  <div className="w-20 h-20 bg-[var(--bg-deep)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
                    <Briefcase className="w-10 h-10 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No applications found</h3>
                  <p className="text-[var(--text-muted)] mb-6">
                    {searchText || statusFilter !== 'all'
                      ? 'Try adjusting your filters to see more results.'
                      : 'Start tracking your job search by adding your first application.'}
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => router.push('/application-tracking/new')}
                    className="px-6 py-3 bg-[var(--primary)] text-[var(--bg-deep)] font-bold rounded-xl hover:bg-[var(--primary-dim)] transition-all"
                  >
                    Add Application
                  </Button>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Infinite scroll sentinel / end state */}
        {!initialLoading && filteredJobs.length > 0 && (
          <div>
            {hasMore ? (
              <div ref={sentinelRef} className="flex items-center justify-center py-6">
                {loadingMore ? (
                  <div className="w-full max-w-xs space-y-2">
                    <div className="h-4 bg-[var(--bg-glass)] rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-[var(--bg-glass)] rounded w-2/3 animate-pulse"></div>
                  </div>
                ) : (
                  <span className="text-[var(--text-muted)] text-sm">Scroll for more</span>
                )}
              </div>
            ) : (
              <p className="text-center text-sm text-[var(--text-muted)] py-6">
                You&apos;ve reached the end
              </p>
            )}
          </div>
        )}
      </div>

    </AppLayout>
  );
};

export default ApplicationTrackingPage;
