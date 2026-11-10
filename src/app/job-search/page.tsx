'use client';

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Building, ExternalLink, Filter, Save, X, CheckCircle, Globe, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import SearchSkeleton from '@/components/ui/SearchSkeleton';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { Select } from 'antd';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  publishedDate?: string;
  salary?: string;
  source: 'findwork' | 'jooble' | 'usajobs' | 'other';
  userAction?: 'track' | 'skip' | null;
}

interface SearchFilters {
  location: string;
  remote: boolean;
  sortBy: 'relevance' | 'date';
  search: string;
  source: 'all' | 'findwork' | 'jooble' | 'usajobs';
}

const JobCard = ({ job, onTrack, onSkip }: {
  job: Job;
  onTrack: (job: Job) => void;
  onSkip: (job: Job) => void;
}) => {
  const getCardStyle = () => {
    if (job.userAction === 'track') return 'border-[var(--success)]/30 bg-[var(--success)]/5';
    if (job.userAction === 'skip') return 'border-[var(--danger)]/30 bg-[var(--danger)]/5 opacity-50';
    return 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50 hover:shadow-md';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl p-4 border transition-all duration-300 ${getCardStyle()}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-deep)] flex items-center justify-center border border-[var(--border)] text-[var(--primary)] font-bold text-base flex-shrink-0">
              {job.company.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)] mb-0.5">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-[var(--primary)]" />
                  {job.company}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[var(--secondary)]" />
                  {job.location}
                </span>
                {job.publishedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--warning)]" />
                    {new Date(job.publishedDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {job.salary && (
              <div className="px-3 py-1 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-full text-[var(--success)] text-xs font-medium flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {job.salary}
              </div>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${job.source === 'findwork'
              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              : job.source === 'jooble'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
              {job.source === 'findwork' ? 'FindWork' :
                job.source === 'jooble' ? 'Jooble' : 'USAJOBS'}
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto ml-auto">
          {!job.userAction ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onTrack(job)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--success)] hover:bg-[var(--success)]/90 text-black font-bold rounded-lg transition-all shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Track</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSkip(job)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--bg-deep)] border border-[var(--border)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--text-muted)] rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
                <span>Skip</span>
              </Button>
            </>
          ) : (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-sm ${job.userAction === 'track'
              ? 'text-[var(--success)] bg-[var(--success)]/10 border border-[var(--success)]/20'
              : 'text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20'
              }`}>
              {job.userAction === 'track' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {job.userAction === 'track' ? 'Tracked' : 'Skipped'}
            </div>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View</span>
          </a>
        </div>
      </div>

      {job.description && (
        <div className="mt-3 p-3 bg-[var(--bg-deep)] rounded-lg border border-[var(--border)]">
          <p className="text-[var(--text-muted)] text-sm line-clamp-2 leading-relaxed">{job.description}</p>
        </div>
      )}
    </motion.div>
  );
};

const JobSearchPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    remote: false,
    sortBy: 'relevance',
    search: '',
    source: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  const filterTrackedJobs = async (jobs: Job[]) => {
    try {
      const jobIds = jobs.map(job => job.id).join(',');
      const response = await fetch(`/api/jobs/track?jobIds=${jobIds}`);
      if (!response.ok) return jobs;

      const { trackedJobs } = await response.json();

      // Filter out skipped jobs and mark tracked ones
      return jobs.filter(job => {
        const tracked = trackedJobs[job.id];
        if (tracked?.isSkipped) return false; // Hide skipped jobs

        if (tracked?.isBookmarked) {
          job.userAction = 'track';
        }
        return true;
      });
    } catch (error) {
      console.error('Error filtering tracked jobs:', error);
      return jobs;
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filters.search.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: filters.search,
        location: filters.location,
        source: filters.source,
        ...(filters.remote && { remote: 'true' })
      });

      const response = await fetch(`/api/jobs/search-all?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();

      const processedJobs: Job[] = (data.results || []).map((job: any) => ({
        id: job.id.toString(),
        title: job.title || job.role,
        company: job.company || job.company_name,
        location: job.location,
        url: job.url || job.link || '#',
        description: job.description || job.snippet,
        publishedDate: job.publishedDate || job.date_posted || job.updated,
        salary: job.salary || job.salary_range,
        source: job.source as 'findwork' | 'jooble' | 'usajobs',
        userAction: null
      }));

      // Filter out tracked/skipped jobs
      const filteredJobs = await filterTrackedJobs(processedJobs);
      setJobs(filteredJobs);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackJob = async (job: Job) => {
    try {
      const response = await fetch('/api/jobs/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          action: 'track',
          jobData: job
        })
      });

      if (response.ok) {
        setJobs(prev => prev.map(j => j.id === job.id ? { ...j, userAction: 'track' } : j));
        toast.success('Job tracked successfully');
      } else {
        toast.error('Failed to track job');
      }
    } catch (error) {
      console.error('Error tracking job:', error);
      toast.error('Failed to track job');
    }
  };

  const handleSkipJob = async (job: Job) => {
    try {
      const response = await fetch('/api/jobs/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          action: 'skip',
          jobData: job
        })
      });

      if (response.ok) {
        // Remove skipped job from the list immediately
        setJobs(prev => prev.filter(j => j.id !== job.id));
        toast.success('Job skipped');
      } else {
        toast.error('Failed to skip job');
      }
    } catch (error) {
      console.error('Error skipping job:', error);
      toast.error('Failed to skip job');
    }
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-6 lg:p-8 min-h-screen space-y-4 max-w-[1600px] mx-auto">
        <ProfileCompletionBanner />

        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2.5">
              <div className="p-1.5 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]">
                <Globe className="w-5 h-5 text-[var(--primary)]" />
              </div>
              Job Search
            </h1>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]">
          <form onSubmit={handleSearch} className="p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 flex items-center bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg transition-colors">
                <Search className="ml-3 w-4 h-4 text-[var(--text-muted)] flex-shrink-0 pointer-events-none" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Keywords (e.g. React Developer)"
                  className="w-full h-8 pl-2 pr-8 bg-transparent border-none outline-none text-[var(--text-main)] placeholder-[var(--text-dim)]"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
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
                variant="primary"
                size="sm"
                type="submit"
                disabled={loading || !filters.search.trim()}
                className="shrink-0 h-8 px-6 rounded-lg bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary-dim)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Searching...' : 'Search'}</span>
              </Button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-[var(--border)] overflow-hidden"
              >
                <div className="relative flex items-center bg-[var(--bg-deep)] border border-[var(--border)] rounded-lg transition-colors">
                  <MapPin className="ml-3 w-4 h-4 text-[var(--text-muted)] flex-shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Location (e.g. Remote)"
                    className="w-full h-8 pl-2 pr-8 bg-transparent border-none outline-none text-[var(--text-main)] placeholder-[var(--text-dim)]"
                  />
                  {filters.location && (
                    <button
                      type="button"
                      onClick={() => setFilters(prev => ({ ...prev, location: '' }))}
                      aria-label="Clear location"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Select
                    value={filters.source}
                    onChange={(v) => setFilters(prev => ({ ...prev, source: v as 'all' | 'findwork' | 'jooble' | 'usajobs' }))}
                    options={[
                      { value: 'all', label: 'All Sources' },
                      { value: 'findwork', label: 'FindWork' },
                      { value: 'jooble', label: 'Jooble' },
                      { value: 'usajobs', label: 'USAJOBS' }
                    ]}
                    allowClear
                    className="w-full"
                  />
                </div>

                <label className="flex items-center gap-3 text-[var(--text-main)] cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.remote ? 'bg-[var(--primary)] border-[var(--primary)]' : 'border-[var(--text-muted)] group-hover:border-[var(--primary)]'}`}>
                    {filters.remote && <CheckCircle className="w-3.5 h-3.5 text-black" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.remote}
                    onChange={(e) => setFilters(prev => ({ ...prev, remote: e.target.checked }))}
                    className="hidden"
                  />
                  <span className="group-hover:text-[var(--primary)] transition-colors">Remote Only</span>
                </label>
              </motion.div>
            )}
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <SearchSkeleton />
        ) : (
          <div className="space-y-6">
            {jobs.length > 0 && (
              <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-semibold text-[var(--text-main)] flex items-center gap-2">
                  <span className="w-2 h-8 bg-[var(--primary)] rounded-full"></span>
                  Found {jobs.length} jobs
                </h2>
                <div className="text-sm text-[var(--text-muted)] bg-[var(--bg-surface)] px-3 py-1 rounded-full border border-[var(--border)]">
                  {filters.source === 'all' ? 'Multiple Sources' :
                    filters.source === 'findwork' ? 'FindWork API' :
                      filters.source === 'jooble' ? 'Jooble API' : 'USAJOBS API'}
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {jobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onTrack={handleTrackJob}
                    onSkip={handleSkipJob}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {!loading && jobs.length === 0 && filters.search && (
          <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--bg-surface)]">
            <div className="w-20 h-20 bg-[var(--bg-deep)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
              <Search className="w-10 h-10 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">No jobs found</h3>
            <p className="text-[var(--text-muted)]">Try adjusting your search criteria or trying a different source.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default JobSearchPage;