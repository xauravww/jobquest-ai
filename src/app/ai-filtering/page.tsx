'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Building, ExternalLink, Search, Check, Filter, RotateCcw, MapPin, Calendar, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { FormInput, FormInputNumber, FormDateInput } from '@/components/ui/FormInput';

import SearchSkeleton from '@/components/ui/SearchSkeleton';
import Button from "@/components/ui/Button";

// Define types for Job and Props
interface AIAnalysis {
  isHiringPost: boolean;
  confidence: number;
  jobTitle: string | null;
  company: string | null;
  reasons: string[];
  category: string;
  error?: string;
}

interface Job {
  title: string;
  company?: string;
  url: string;
  content?: string;
  aiAnalysis?: AIAnalysis;
  location?: string;
  publishedDate?: string;
  engine?: string;
  category?: string;
  salary?: number | { min: number; max: number };
  metadata?: {
    engine?: string;
    category?: string;
    publishedDate?: string;
    thumbnail?: string;
    favicon?: string;
  };
  // New fields for manual control
  userAction?: 'track' | 'skip' | null;
  id?: string; // Unique identifier for the job
}

interface Chunk {
  id: number;
  jobs: Job[];
  isFiltered: boolean;
  isLoading: boolean;
  error: string | null;
  filteredJobs: Job[];
}

interface FilterParams {
  onlyHiringPosts?: boolean;
  minConfidence?: number;
  location?: string;
  company?: string;
  minSalary?: number;
  maxSalary?: number;
  postedAfter?: string;
  postedBefore?: string;
  searchEngine?: string;
}

interface FilterState {
  location: string;
  postedAfter: string;
  postedBefore: string;
  searchEngine: string;
  maxPages: string;
  onlyHiringPosts: boolean;
  minConfidence: string | number;
}

interface FilteredJob {
  title: string;
  company: string;
  aiScore: number;
  isHiring: boolean;
}

// Job Card Component
const JobCard = ({ job, onTrack, onSkip }: {
  job: Job;
  onTrack: (job: Job) => void;
  onSkip: (job: Job) => void;
}) => {
  const getCardBorderClass = () => {
    if (job.userAction === 'track') return 'border-[var(--success)]/30 bg-[var(--success)]/5';
    if (job.userAction === 'skip') return 'border-[var(--danger)]/20 bg-[var(--bg-surface)] opacity-60 grayscale-[0.5]';
    return 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50';
  };

  const getAIAnalysisColor = () => {
    if (!job.aiAnalysis) return 'bg-[var(--bg-light)] text-[var(--text-muted)] border border-[var(--border)]';
    if (job.aiAnalysis.isHiringPost) return 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20';
    return 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20';
  };

  return (
    <div className={`group relative rounded-xl p-6 border transition-all duration-300 ${getCardBorderClass()}`}>
      <div className="relative flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[var(--text-main)] mb-2 leading-tight group-hover:text-[var(--primary)] transition-colors">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-[var(--text-muted)] text-sm mb-4">
                <div className="flex items-center gap-1.5">
                  <Building size={14} className="text-[var(--primary)]" />
                  <span className="font-medium text-[var(--text-main)]">{job.company || 'N/A'}</span>
                </div>
                {job.location && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[var(--border-muted)]" />
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[var(--secondary)]" />
                      <span>{job.location}</span>
                    </div>
                  </>
                )}
                {job.publishedDate && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-[var(--border-muted)]" />
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-[var(--warning)]" />
                      <span>{new Date(job.publishedDate).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {job.aiAnalysis && (
            <div className={`mt-2 p-3 rounded-lg text-sm ${getAIAnalysisColor()}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${job.aiAnalysis.isHiringPost ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}></div>
                  <span className="font-semibold tracking-wide">
                    {job.aiAnalysis.isHiringPost ? 'HIRING SIGNAL DETECTED' : 'NO HIRING SIGNAL'}
                  </span>
                  <span className="px-2 py-0.5 bg-[var(--bg-deep)]/50 rounded text-xs font-mono border border-[var(--border)]/50">
                    {job.aiAnalysis.confidence}%
                  </span>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-[var(--bg-deep)]/50 border border-[var(--border)]/50">
                  {job.aiAnalysis.category}
                </span>
              </div>
              {job.aiAnalysis.reasons && job.aiAnalysis.reasons.length > 0 && (
                <div className="text-xs opacity-90 leading-relaxed pl-4 border-l-2 border-current/30">
                  {job.aiAnalysis.reasons.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          )}

          {job.userAction && (
            <div className={`mt-3 p-2.5 rounded-lg text-sm font-medium border inline-flex items-center gap-2 ${job.userAction === 'track'
              ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
              : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
              }`}>
              {job.userAction === 'track' ? <Save size={14} /> : <Filter size={14} />}
              {job.userAction === 'track' ? 'Marked to Track' : 'Marked to Skip'}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 ml-4">
          {!job.userAction && (
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onTrack(job)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--success)] hover:bg-[var(--success)]/90 text-black text-sm font-bold rounded-lg transition-all duration-200"
              >
                <Save size={16} />
                Track
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onSkip(job)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-light)] border border-[var(--border)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--text-muted)] text-sm font-medium rounded-lg transition-all duration-200 hover:bg-[var(--danger)]/5"
              >
                <span className="text-lg leading-none">×</span> Skip
              </Button>
            </div>
          )}
          {job.userAction === 'track' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onSkip(job)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--text-muted)] text-xs font-medium rounded-lg transition-all duration-200"
            >
              Undo & Skip
            </Button>
          )}
          {job.userAction === 'skip' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onTrack(job)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--success)]/10 border border-[var(--success)]/30 hover:bg-[var(--success)]/20 text-[var(--success)] text-xs font-bold rounded-lg transition-all duration-200"
            >
              Undo & Track
            </Button>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2 w-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg transition-all duration-200 group/link"
          >
            <span className="text-sm font-medium">Visit</span>
            <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {job.content && (
        <div className="mt-4 p-4 bg-[var(--bg-deep)] rounded-lg border border-[var(--border)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[var(--border)]" />
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            Job Description Snippet
          </h4>
          <div className="text-[var(--text-dim)] text-sm leading-relaxed line-clamp-3 font-light">
            {job.content.substring(0, 300)}...
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Loading Components
const ChunkLoadingSkeleton = () => (
  <div className="w-full py-4 space-y-4">
    <div className="flex items-center justify-between p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-2 h-2 rounded-full bg-[var(--live)] animate-ping" />
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
          AI Analysis in progress...
        </span>
      </div>
      <div className="h-4 w-28 bg-[var(--bg-raised)] rounded" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <JobCardSkeleton />
      <JobCardSkeleton />
      <JobCardSkeleton />
    </div>
  </div>
);

// Job Card Skeleton for individual loading states
const JobCardSkeleton = () => (
  <div className="rounded-xl p-6 border border-[var(--border)] bg-[var(--bg-surface)] animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-6 bg-[var(--bg-light)] rounded mb-2 w-3/4"></div>
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-[var(--bg-light)] rounded mr-3"></div>
            <div className="h-4 bg-[var(--bg-light)] rounded w-32"></div>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-[var(--bg-light)] rounded mr-3"></div>
            <div className="h-4 bg-[var(--bg-light)] rounded w-24"></div>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-[var(--bg-light)] rounded mr-3"></div>
            <div className="h-4 bg-[var(--bg-light)] rounded w-20"></div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-[var(--bg-light)] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[var(--bg-light)] rounded-full"></div>
              <div className="h-4 bg-[var(--bg-light)] rounded w-24"></div>
              <div className="h-4 bg-[var(--bg-light)] rounded w-12"></div>
            </div>
            <div className="h-4 bg-[var(--bg-light)] rounded w-16"></div>
          </div>
          <div className="h-3 bg-[var(--bg-light)] rounded w-full mb-1"></div>
          <div className="h-3 bg-[var(--bg-light)] rounded w-2/3"></div>
        </div>
      </div>
      <div className="flex flex-col gap-2 ml-4">
        <div className="w-20 h-8 bg-[var(--bg-light)] rounded-lg"></div>
        <div className="w-20 h-8 bg-[var(--bg-light)] rounded-lg"></div>
      </div>
    </div>
  </div>
);

// Chunk Header Component with Filter Controls
const ChunkHeader = ({
  chunkId,
  totalJobs,
  filteredJobs,
  isFiltered,
  isLoading,
  error,
  onFilter,
  onReset,
  onTrackAll,
  onSkipAll
}: {
  chunkId: number;
  totalJobs: number;
  filteredJobs: number;
  isFiltered: boolean;
  isLoading: boolean;
  error: string | null;
  onFilter: () => void;
  onReset: () => void;
  onTrackAll: () => void;
  onSkipAll: () => void;
}) => (
  <div className={`flex items-center justify-between p-6 mb-6 rounded-xl backdrop-blur-md border transition-all duration-300 ${isFiltered ? 'bg-[var(--success)]/5 border-[var(--success)]/20' :
    isLoading ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20' :
      error ? 'bg-[var(--danger)]/5 border-[var(--danger)]/20' :
        'bg-[var(--bg-card)]/80 border-[var(--border)] shadow-sm'
    }`}>
    <div className="flex items-center">
      <div className="flex items-center gap-4">
        <div className="px-3 py-1.5 bg-[var(--bg-deep)] rounded-lg border border-[var(--border)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <span className="text-[var(--text-main)] font-mono text-sm">Chunk {chunkId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${isFiltered ? 'text-[var(--success)]' : 'text-[var(--text-main)]'}`}>
            {isFiltered ? filteredJobs : totalJobs}
          </span>
          <span className="text-[var(--text-muted)] text-sm font-medium">
            {isFiltered ? `visible jobs (of ${totalJobs} total)` : 'jobs found'}
          </span>
        </div>
      </div>
      {error && (
        <div className="ml-4 px-3 py-1.5 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-lg flex items-center gap-2">
          <span className="text-[var(--danger)] text-sm font-medium">⚠ {error}</span>
        </div>
      )}
    </div>
    <div className="flex gap-3 flex-wrap">
      {!isFiltered && !isLoading && (
        <Button
          variant="primary"
          onClick={onFilter}
          disabled={isLoading}
          className="group flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dim)] text-black font-bold py-2.5 px-5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          AI Filter
        </Button>
      )}
      {isFiltered && !isLoading && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            className="flex items-center gap-2 bg-[var(--bg-light)] hover:bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-main)] font-medium py-2 px-4 rounded-lg transition-all duration-200"
          >
            <RotateCcw size={14} />
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onTrackAll}
            disabled={filteredJobs === 0}
            className="flex items-center gap-2 bg-[var(--success)] hover:bg-[var(--success)]/90 disabled:bg-[var(--bg-light)] disabled:text-[var(--text-muted)] text-black font-bold py-2 px-4 rounded-lg transition-all duration-200 shadow-sm disabled:shadow-none"
          >
            <Save size={14} />
            Track All
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onSkipAll}
            disabled={filteredJobs === 0}
            className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--text-muted)] font-medium py-2 px-4 rounded-lg transition-all duration-200"
          >
            Skip All
          </Button>
        </div>
      )}
      {isLoading && <ChunkLoadingSkeleton />}
    </div>
  </div>
);

// Initial prompt for the user to start a search
const InitialPrompt = () => (
  <div className="text-center py-24">
    <div className="relative mb-8 group">
      <div className="w-24 h-24 bg-[var(--bg-surface)] rounded-2xl flex items-center justify-center mx-auto border border-[var(--border)] transition-all duration-500">
        <Search size={48} className="text-[var(--primary)] group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--primary)] rounded-full animate-ping opacity-75"></div>
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--primary)] rounded-full"></div>
    </div>
    <h3 className="text-3xl font-bold text-[var(--text-main)] mb-4 tracking-tight">Find Your Next Opportunity</h3>
    <p className="text-[var(--text-muted)] text-lg max-w-lg mx-auto leading-relaxed mb-10">
      Use the search bar above to find matching roles.
    </p>
    <div className="flex items-center justify-center gap-8 text-sm text-[var(--text-dim)]">
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]">
        <div className="w-2 h-2 bg-[var(--primary)] rounded-full"></div>
        <span>AI Analysis</span>
      </div>
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]">
        <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
        <span>Smart Filtering</span>
      </div>
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]">
        <div className="w-2 h-2 bg-[var(--secondary)] rounded-full"></div>
        <span>Date Range Search</span>
      </div>
    </div>
  </div>
);


const JobSearchPage = () => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('mern hiring');
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    location: '',
    postedAfter: '',
    postedBefore: '',
    searchEngine: '',
    maxPages: '',
    onlyHiringPosts: true,
    minConfidence: '' as string | number
  });


  // New filter state for hasDate
  const [hasDate, setHasDate] = useState<boolean | undefined>(undefined);





  // AI provider config state
  const [aiProvider, setAiProvider] = useState('lm-studio');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('http://localhost:1234');
  const [model, setModel] = useState('local-model');
  // Removed AI Config state and toggle as per user request
  // const [showAIConfig, setShowAIConfig] = useState(false);

  // Load active AI config from backend on mount
  useEffect(() => {
    const fetchActiveAIConfig = async () => {
      try {
        const response = await fetch('/api/ai-config');
        if (response.ok) {
          const configs = await response.json();
          const activeConfig = configs.find((c: any) => c.isActive);
          if (activeConfig) {
            setAiProvider(activeConfig.provider);
            setApiKey(activeConfig.apiKey || '');
            setApiUrl(activeConfig.apiUrl || (activeConfig.provider === 'gemini' ? '' : 'http://localhost:1234'));
            setModel(activeConfig.aiModel);
            console.log('Active AI config loaded from backend:', activeConfig);
            // Sync to localStorage
            const config = {
              provider: activeConfig.provider,
              apiKey: activeConfig.apiKey || '',
              apiUrl: activeConfig.apiUrl || (activeConfig.provider === 'gemini' ? '' : 'http://localhost:1234'),
              model: activeConfig.aiModel,
              enabled: true
            };
            localStorage.setItem('ai-provider-config', JSON.stringify(config));
          } else {
            // Fallback to localStorage if no active config
            const savedConfig = localStorage.getItem('ai-provider-config');
            if (savedConfig) {
              try {
                const config = JSON.parse(savedConfig);
                if (config.provider) setAiProvider(config.provider);
                if (config.apiKey) setApiKey(config.apiKey);
                if (config.apiUrl) setApiUrl(config.apiUrl);
                if (config.model) setModel(config.model);
                console.log('AI config loaded from localStorage (fallback):', config);
              } catch (e) {
                console.warn('Failed to parse saved AI config', e);
              }
            }
          }
        } else {
          // Fallback to localStorage if API fails
          const savedConfig = localStorage.getItem('ai-provider-config');
          if (savedConfig) {
            try {
              const config = JSON.parse(savedConfig);
              if (config.provider) setAiProvider(config.provider);
              if (config.apiKey) setApiKey(config.apiKey);
              if (config.apiUrl) setApiUrl(config.apiUrl);
              if (config.model) setModel(config.model);
              console.log('AI config loaded from localStorage (API failed):', config);
            } catch (e) {
              console.warn('Failed to parse saved AI config', e);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch AI config from backend:', error);
        // Fallback to localStorage
        const savedConfig = localStorage.getItem('ai-provider-config');
        if (savedConfig) {
          try {
            const config = JSON.parse(savedConfig);
            if (config.provider) setAiProvider(config.provider);
            if (config.apiKey) setApiKey(config.apiKey);
            if (config.apiUrl) setApiUrl(config.apiUrl);
            if (config.model) setModel(config.model);
            console.log('AI config loaded from localStorage (error):', config);
          } catch (e) {
            console.warn('Failed to parse saved AI config', e);
          }
        }
      }
    };

    fetchActiveAIConfig();
  }, []);



  // Save AI config to localStorage on change (debounced)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const config = { provider: aiProvider, apiKey, apiUrl, model, enabled: true };
      localStorage.setItem('ai-provider-config', JSON.stringify(config));
      console.log('AI config saved to localStorage:', config);
    }
  }, [aiProvider, apiKey, apiUrl, model]);

  // Generate unique ID for job
  const generateJobId = (job: Job): string => {
    return `${job.url}-${job.title}-${job.company}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  };

  // Filter out tracked/skipped jobs
  const filterTrackedJobs = async (jobs: Job[]) => {
    try {
      const jobIds = jobs.map(job => job.id || generateJobId(job)).join(',');
      const response = await fetch(`/api/jobs/track?jobIds=${jobIds}`);
      if (!response.ok) return jobs;

      const { trackedJobs } = await response.json();

      // Filter out skipped jobs and mark tracked ones
      return jobs.filter(job => {
        const jobId = job.id || generateJobId(job);
        const tracked = trackedJobs[jobId];
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

  // Handle search function
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        // Removed maxPages limit, keep empty as per user request
        maxPages: filters.maxPages ? filters.maxPages.toString() : '',
        ...(hasDate !== undefined && { hasDate: hasDate.toString() }),
        ...(filters.postedAfter && { postedAfter: filters.postedAfter }),
        ...(filters.postedBefore && { postedBefore: filters.postedBefore }),
        ...(filters.location && { location: filters.location }),
        // Removed company filter as per user request
        // ...(filters.company && { company: filters.company }),
        // Removed minSalary filter as per user request
        // ...(filters.minSalary && { minSalary: filters.minSalary.toString() }),
        // Removed maxSalary filter as per user request
        // ...(filters.maxSalary && { maxSalary: filters.maxSalary.toString() }),
        ...(filters.searchEngine && { engine: filters.searchEngine }),
      });

      const response = await fetch(`/api/jobs/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      // Process jobs and create chunks
      const processedJobs = data.data.map((job: Job) => ({
        ...job,
        id: generateJobId(job)
      }));

      // Filter out tracked and skipped jobs using the new API
      const filteredJobs = await filterTrackedJobs(processedJobs);

      const chunkSize = 20;
      const newChunks: Chunk[] = [];

      for (let i = 0; i < filteredJobs.length; i += chunkSize) {
        const chunkJobs = filteredJobs.slice(i, i + chunkSize);
        newChunks.push({
          id: Math.floor(i / chunkSize) + 1,
          jobs: chunkJobs,
          isFiltered: false,
          isLoading: false,
          error: null,
          filteredJobs: chunkJobs
        });
      }

      setChunks(newChunks);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle track job
  const handleTrackJob = async (job: Job) => {
    try {
      const response = await fetch('/api/jobs/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id || generateJobId(job),
          action: 'track',
          jobData: {
            title: job.title,
            company: job.company,
            location: job.location,
            url: job.url,
            description: job.content,
            source: 'ai-search',
            publishedDate: job.publishedDate
          }
        })
      });

      if (response.ok) {
        // Update job userAction in chunks
        setChunks(prev => prev.map(chunk => ({
          ...chunk,
          jobs: chunk.jobs.map(j => j.id === job.id ? { ...j, userAction: 'track' } : j),
          filteredJobs: chunk.filteredJobs.map(j => j.id === job.id ? { ...j, userAction: 'track' } : j)
        })));
        toast.success('Job tracked successfully');
      } else {
        toast.error('Failed to track job');
      }
    } catch (error) {
      console.error('Error tracking job:', error);
      toast.error('Failed to track job');
    }
  };

  // Handle skip job
  const handleSkipJob = async (job: Job) => {
    try {
      const response = await fetch('/api/jobs/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id || generateJobId(job),
          action: 'skip',
          jobData: {
            title: job.title,
            company: job.company,
            location: job.location,
            url: job.url,
            description: job.content,
            source: 'ai-search',
            publishedDate: job.publishedDate
          }
        })
      });

      if (response.ok) {
        // Remove skipped job from chunks immediately
        setChunks(prev => prev.map(chunk => ({
          ...chunk,
          jobs: chunk.jobs.filter(j => j.id !== job.id),
          filteredJobs: chunk.filteredJobs.filter(j => j.id !== job.id)
        })));
        toast.success('Job skipped');
      } else {
        toast.error('Failed to skip job');
      }
    } catch (error) {
      console.error('Error skipping job:', error);
      toast.error('Failed to skip job');
    }
  };

  // Handle track all in chunk
  const handleTrackAllInChunk = async (chunkId: number) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return;

    const jobsToTrack = chunk.filteredJobs.filter(job => !job.userAction);

    try {
      // Track all jobs in parallel
      await Promise.all(jobsToTrack.map(job =>
        fetch('/api/jobs/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id || generateJobId(job),
            action: 'track',
            jobData: {
              title: job.title,
              company: job.company,
              location: job.location,
              url: job.url,
              description: job.content,
              source: 'ai-search',
              publishedDate: job.publishedDate
            }
          })
        })
      ));

      // Update all jobs in chunk
      setChunks(prev => prev.map(chunk =>
        chunk.id === chunkId
          ? {
            ...chunk,
            jobs: chunk.jobs.map(j => ({ ...j, userAction: 'track' })),
            filteredJobs: chunk.filteredJobs.map(j => ({ ...j, userAction: 'track' }))
          }
          : chunk
      ));

      toast.success(`Tracked ${jobsToTrack.length} jobs`);
    } catch (error) {
      console.error('Error tracking jobs:', error);
      toast.error('Failed to track some jobs');
    }
  };

  // Handle skip all in chunk
  const handleSkipAllInChunk = async (chunkId: number) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return;

    const jobsToSkip = chunk.filteredJobs.filter(job => !job.userAction);

    try {
      // Skip all jobs in parallel
      await Promise.all(jobsToSkip.map(job =>
        fetch('/api/jobs/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id || generateJobId(job),
            action: 'skip',
            jobData: {
              title: job.title,
              company: job.company,
              location: job.location,
              url: job.url,
              description: job.content,
              source: 'ai-search',
              publishedDate: job.publishedDate
            }
          })
        })
      ));

      // Remove all skipped jobs from chunk
      setChunks(prev => prev.map(chunk =>
        chunk.id === chunkId
          ? {
            ...chunk,
            jobs: chunk.jobs.filter(j => !jobsToSkip.some(skip => skip.id === j.id)),
            filteredJobs: chunk.filteredJobs.filter(j => !jobsToSkip.some(skip => skip.id === j.id))
          }
          : chunk
      ));

      toast.success(`Skipped ${jobsToSkip.length} jobs`);
    } catch (error) {
      console.error('Error skipping jobs:', error);
      toast.error('Failed to skip some jobs');
    }
  };

  const handleChunkFilter = async (chunkId: number) => {
    setChunks(prev => prev.map(chunk =>
      chunk.id === chunkId
        ? { ...chunk, isLoading: true, error: null }
        : chunk
    ));

    try {
      const chunk = chunks.find(c => c.id === chunkId);
      if (!chunk) return;

      // Prepare filter object with only non-empty values
      const filterParams: FilterParams = {
        onlyHiringPosts: filters.onlyHiringPosts,
        minConfidence: parseInt(filters.minConfidence.toString()) || 60
      };

      // Add additional filters if they have values
      if (filters.location) filterParams.location = filters.location;
      // Removed company filter as per user request
      // if (filters.company) filterParams.company = filters.company;
      // Removed minSalary filter as per user request
      // if (filters.minSalary) filterParams.minSalary = parseInt(filters.minSalary);
      // Removed maxSalary filter as per user request
      // if (filters.maxSalary) filterParams.maxSalary = parseInt(filters.maxSalary);
      if (filters.postedAfter) filterParams.postedAfter = filters.postedAfter;
      if (filters.postedBefore) filterParams.postedBefore = filters.postedBefore;
      if (filters.searchEngine) filterParams.searchEngine = filters.searchEngine;

      console.log('Applying filters:', filterParams);

      const response = await fetch('/api/jobs/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results: chunk.jobs,
          filters: filterParams,
          aiConfig: {
            provider: aiProvider,
            apiKey,
            apiUrl,
            model
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to filter jobs');
      }

      const filterData = await response.json();

      console.log(`AI Filter UI - Chunk ${chunkId} filtered: ${filterData.filteredCount} jobs out of ${filterData.originalCount} total`);
      console.log(`AI Filter UI - Filtered jobs:`, filterData.data.map((job: FilteredJob) => ({
        title: job.title,
        company: job.company,
        aiScore: job.aiScore,
        isHiring: job.isHiring
      })));

      setChunks(prev => prev.map(chunk =>
        chunk.id === chunkId
          ? {
            ...chunk,
            isLoading: false,
            isFiltered: true,
            filteredJobs: filterData.data,
            error: null
          }
          : chunk
      ));
    } catch (err) {
      console.error('Error filtering chunk:', err);
      const errorMessage = err instanceof Error ? err.message : 'AI filtering failed';
      setChunks(prev => prev.map(chunk =>
        chunk.id === chunkId
          ? { ...chunk, isLoading: false, error: errorMessage }
          : chunk
      ));
    }
  };

  const handleChunkReset = (chunkId: number) => {
    setChunks(prev => prev.map(chunk =>
      chunk.id === chunkId
        ? { ...chunk, isFiltered: false, filteredJobs: chunk.jobs, error: null }
        : chunk
    ));
  };



  const handleFilterChange = (key: keyof typeof filters, value: string | number | boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const FilterPanel = ({
    filters,
    handleFilterChange,
    hasDate,
    setShowFilters,
    setHasDate
  }: {
    filters: FilterState;
    handleFilterChange: (key: keyof FilterState, value: string | number | boolean) => void;
    hasDate: boolean | undefined;
    setShowFilters: (value: boolean) => void;
    setHasDate: (value: boolean | undefined) => void;
  }) => (
    <div className="bg-[var(--bg-surface)]/80 backdrop-blur-md rounded-2xl p-6 mb-8 border border-[var(--border)] shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)] opacity-40" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--primary)]/10 rounded-lg border border-[var(--primary)]/20">
            <Filter className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-main)]">Advanced Filters</h3>
        </div>
        <Button
          variant="ghost"
          onClick={() => setShowFilters(false)}
          className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-light)] rounded-lg transition-colors"
          aria-label="Close filters"
        >
          ×
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Date Filters - Your Core Feature */}
        <FormDateInput
          label="Posted After"
          value={filters.postedAfter}
          onChange={(v) => handleFilterChange('postedAfter', v)}
        />
        <FormDateInput
          label="Posted Before"
          value={filters.postedBefore}
          onChange={(v) => handleFilterChange('postedBefore', v)}
        />

        {/* Location Filter */}
        <FormInput
          label="Location"
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          placeholder="e.g., San Francisco, CA"
        />

        {/* Confidence Filter */}
        <FormInputNumber
          label="Min Confidence (%)"
          value={filters.minConfidence}
          onChange={(e) => handleFilterChange('minConfidence', parseInt(e.target.value) || 60)}
          min={0}
          max={100}
          step={1}
        />

        {/* Max Pages Filter */}
        <FormInputNumber
          label="Max Pages"
          value={filters.maxPages ? parseInt(filters.maxPages) : 3}
          onChange={(value) => handleFilterChange('maxPages', value?.toString() || '3')}
          min={1}
          max={20}
          step={1}
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
            color: 'var(--text-main)',
          }}
        />

        {/* Hiring Posts Filter */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="group flex items-center gap-4 p-4 bg-[var(--bg-light)]/30 hover:bg-[var(--bg-light)]/50 rounded-xl border border-[var(--border)] transition-colors cursor-pointer" onClick={() => handleFilterChange('onlyHiringPosts', !filters.onlyHiringPosts)}>
            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${filters.onlyHiringPosts ? 'bg-[var(--primary)] border-[var(--primary)]' : 'bg-[var(--bg-surface)] border-[var(--text-muted)]'}`}>
              {filters.onlyHiringPosts && <Check size={14} strokeWidth={3} className="text-black" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-[var(--text-main)]">Only Hiring Posts</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                AI detects: job titles, &quot;hiring&quot;, &quot;apply&quot;, salary mentions, and other hiring indicators
              </div>
            </div>
          </div>
        </div>

        {/* Date Filter */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="group flex items-center gap-4 p-4 bg-[var(--bg-light)]/30 hover:bg-[var(--bg-light)]/50 rounded-xl border border-[var(--border)] transition-colors cursor-pointer" onClick={() => setHasDate(hasDate === true ? undefined : true)}>
            <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${hasDate === true ? 'bg-[var(--secondary)] border-[var(--secondary)]' : 'bg-[var(--bg-surface)] border-[var(--text-muted)]'}`}>
              {hasDate === true && <Calendar size={14} className="text-white" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-[var(--text-main)]">Show jobs with dates only</span>
                <span className="px-2 py-0.5 bg-[var(--secondary)]/10 text-[var(--secondary)] text-[10px] uppercase tracking-wider rounded font-bold border border-[var(--secondary)]/20">Filter</span>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                When checked, only shows jobs that have valid publication dates. Unchecked shows all jobs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!hasSearched) {
      return <InitialPrompt />;
    }

    if (isLoading) {
      return <SearchSkeleton />;
    }

    if (error) {
      return <div className="text-center py-20 text-[var(--danger)]">{error}</div>;
    }

    if (chunks.length > 0) {
      return (
        <div className="space-y-8">
          {chunks.map((chunk) => (
            <div key={chunk.id} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
              <ChunkHeader
                chunkId={chunk.id}
                totalJobs={chunk.jobs.length}
                filteredJobs={chunk.filteredJobs.filter(job => !job.userAction).length}
                isFiltered={chunk.isFiltered}
                isLoading={chunk.isLoading}
                error={chunk.error}
                onFilter={() => handleChunkFilter(chunk.id)}
                onReset={() => handleChunkReset(chunk.id)}
                onTrackAll={() => handleTrackAllInChunk(chunk.id)}
                onSkipAll={() => handleSkipAllInChunk(chunk.id)}
              />
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {chunk.isLoading ? (
                    // Show skeletons while filtering
                    Array.from({ length: Math.min(chunk.filteredJobs.length, 5) }, (_, i) => (
                      <JobCardSkeleton key={`skeleton-${chunk.id}-${i}`} />
                    ))
                  ) : (
                    chunk.filteredJobs
                      .map((job, index) => (
                        <JobCard
                          key={`${chunk.id}-${job.url || index}`}
                          job={job}
                          onTrack={handleTrackJob}
                          onSkip={handleSkipJob}
                        />
                      ))
                  )}
                </div>
                {/* Show summary of hidden jobs */}
                {chunk.filteredJobs.filter(job => job.userAction).length > 0 && (
                  <div className="mt-6 p-4 bg-[var(--bg-light)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {chunk.filteredJobs.filter(job => job.userAction === 'track').length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[var(--success)] rounded-full"></div>
                            <span className="text-[var(--success)] font-medium">
                              {chunk.filteredJobs.filter(job => job.userAction === 'track').length} to track
                            </span>
                          </div>
                        )}
                        {chunk.filteredJobs.filter(job => job.userAction === 'skip').length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[var(--danger)] rounded-full"></div>
                            <span className="text-[var(--danger)] font-medium">
                              {chunk.filteredJobs.filter(job => job.userAction === 'skip').length} to skip
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-[var(--bg-light)] rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--border)]">
          <Bot size={48} className="text-[var(--text-muted)]" />
        </div>
        <h3 className="text-2xl font-bold text-[var(--text-main)] mb-4">No Results Found</h3>
        <p className="text-[var(--text-muted)] text-lg max-w-md mx-auto leading-relaxed">
          Try adjusting your search terms or filters to discover new opportunities.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
          <span>💡 Tip: Try broader keywords like</span>
          <span className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded font-medium">&quot;developer&quot;</span>
          <span>or</span>
          <span className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded font-medium">&quot;engineer&quot;</span>
        </div>
      </div>
    );
  };

  return (
    <AppLayout showFooter={false}>
      <Toaster
        toastOptions={{
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border)',
          },
        }}
      />
      <div className="p-6 min-h-screen">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6 px-8 py-4 bg-[var(--bg-surface)]/50 backdrop-blur-sm border border-[var(--border)] rounded-full shadow-lg">
            <div className="p-2.5 bg-[var(--primary)] rounded-xl">
              <Bot className="w-6 h-6 text-black" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-main)] tracking-tight">
              Job Search
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
            Search jobs and filter results to fit your preferences.
          </p>
        </div>
        <div className="max-w-6xl mx-auto">
          {/* Search Bar and Controls */}
          <div className="mb-10 space-y-6">
            <form id="searchForm" onSubmit={handleSearch} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-2 shadow-lg transition-shadow duration-300">
              <div className="flex gap-2">
                <div className="flex-grow relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors" />
                  </div>
                  <FormInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., React Developer, MERN Stack, Full Stack Engineer"
                    className="text-lg py-4 pl-12 bg-transparent border-none focus:ring-0 w-full h-full"
                  />
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={isLoading}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-dim)] text-black font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      <span>Search</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* Filter and Save Controls */}
            <div className="flex gap-3 flex-wrap items-center justify-center">
              <Button
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 font-medium py-2.5 px-6 rounded-xl transition-all duration-200 border ${showFilters
                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30'
                  : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-light)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-[var(--border)]'
                  }`}
              >
                <Filter size={16} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel
              filters={filters}
              handleFilterChange={handleFilterChange}
              hasDate={hasDate}
              setShowFilters={setShowFilters}
              setHasDate={setHasDate}
            />
          )}

          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );


};

export default JobSearchPage;
