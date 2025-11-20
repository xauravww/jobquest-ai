'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Building, ExternalLink, Filter, RotateCcw, Save, Eye, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import SearchSkeleton from '@/components/ui/SearchSkeleton';

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
  const getCardBorderClass = () => {
    if (job.userAction === 'track') return 'border-green-500/50 bg-green-500/5';
    if (job.userAction === 'skip') return 'border-red-500/50 bg-red-500/5';
    return 'border-border hover:border-primary/50';
  };

  return (
    <div className={`bg-bg-card rounded-xl shadow-lg p-6 border transition-all duration-300 hover:shadow-xl ${getCardBorderClass()}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
          <div className="space-y-2">
            <div className="flex items-center text-text-muted text-sm">
              <Building size={14} className="mr-2 text-primary" />
              <span>{job.company}</span>
            </div>
            <div className="flex items-center text-text-muted text-sm">
              <MapPin size={14} className="mr-2 text-blue-400" />
              <span>{job.location}</span>
            </div>
            {job.publishedDate && (
              <div className="flex items-center text-text-muted text-sm">
                <Calendar size={14} className="mr-2 text-yellow-400" />
                <span>{new Date(job.publishedDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3">
            {job.salary && (
              <div className="p-2 bg-green-500/20 rounded-lg text-green-300 text-sm">
                💰 {job.salary}
              </div>
            )}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              job.source === 'findwork' 
                ? 'bg-blue-500/20 text-blue-300' 
                : job.source === 'jooble'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-green-500/20 text-green-300'
            }`}>
              {job.source === 'findwork' ? 'FindWork' : 
               job.source === 'jooble' ? 'Jooble' : 'USAJOBS'}
            </div>
          </div>
          {job.userAction && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-semibold ${
              job.userAction === 'track' 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {job.userAction === 'track' ? '✓ Marked to Track' : '✗ Marked to Skip'}
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-3 ml-4">
          {!job.userAction && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onTrack(job)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-all duration-200"
              >
                <Save size={16} />
                Track
              </button>
              <button
                onClick={() => onSkip(job)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-all duration-200"
              >
                ✗ Skip
              </button>
            </div>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary hover:text-white border border-primary/30 rounded-lg transition-all duration-200"
          >
            <ExternalLink size={16} />
            View
          </a>
        </div>
      </div>
      {job.description && (
        <div className="mt-4 p-4 bg-bg-light/50 rounded-lg">
          <p className="text-text-muted text-sm line-clamp-3">{job.description}</p>
        </div>
      )}
    </div>
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
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Job Search</h1>
              <p className="text-text-muted text-lg">Search jobs from multiple sources</p>
            </div>

          </div>

          {/* Search Form */}
          <div className="bg-bg-card rounded-xl p-6 border border-border">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Search Keywords</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="e.g. React Developer, Python, MERN"
                    className="w-full px-4 py-3 bg-bg-light border border-border rounded-lg text-white placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Location</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. London, New York, Remote"
                    className="w-full px-4 py-3 bg-bg-light border border-border rounded-lg text-white placeholder-text-muted focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Job Source</label>
                  <select
                    value={filters.source}
                    onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value as 'all' | 'findwork' | 'jooble' | 'usajobs' }))}
                    className="w-full px-4 py-3 bg-bg-light border border-border rounded-lg text-white focus:border-primary focus:outline-none"
                  >
                    <option value="all">All Sources</option>
                    <option value="findwork">FindWork</option>
                    <option value="jooble">Jooble</option>
                    <option value="usajobs">USAJOBS</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={filters.remote}
                    onChange={(e) => setFilters(prev => ({ ...prev, remote: e.target.checked }))}
                    className="rounded border-border bg-bg-light text-primary focus:ring-primary"
                  />
                  Remote Only
                </label>
                <button
                  type="submit"
                  disabled={loading || !filters.search.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search size={20} />
                  {loading ? 'Searching...' : 'Search Jobs'}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          {loading && <SearchSkeleton />}

          {jobs.length > 0 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-white">
                  Found {jobs.length} jobs
                </h2>
                <div className="text-sm text-text-muted">
                  {filters.source === 'all' ? 'FindWork + Jooble + USAJOBS APIs' : 
                   filters.source === 'findwork' ? 'FindWork API' : 
                   filters.source === 'jooble' ? 'Jooble API' : 'USAJOBS API'}
                </div>
              </div>
              <div className="grid gap-6">
                {jobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onTrack={handleTrackJob}
                    onSkip={handleSkipJob}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && jobs.length === 0 && filters.search && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No jobs found</h3>
              <p className="text-text-muted">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default JobSearchPage;