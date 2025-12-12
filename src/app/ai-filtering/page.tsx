'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Building, ExternalLink, Search, Sparkles, Filter, RotateCcw, MapPin, Calendar, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { FormInput, FormInputNumber, FormDateInput } from '@/components/ui/FormInput';
import JobCardSkeleton from '@/components/ui/JobCardSkeleton';
import SearchSkeleton from '@/components/ui/SearchSkeleton';

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
    if (job.userAction === 'track') return 'border-[var(--success)]/30 bg-[var(--success)]/5 shadow-sm';
    if (job.userAction === 'skip') return 'border-[var(--danger)]/30 bg-[var(--danger)]/5 opacity-60';
    return 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--primary)]/50 hover:shadow-md';
  };

  const getAIAnalysisColor = () => {
    if (!job.aiAnalysis) return 'bg-[var(--bg-light)] text-[var(--text-muted)] border border-[var(--border)]';
    if (job.aiAnalysis.isHiringPost) return 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20';
    return 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20';
  };

  return (
    <div className={`rounded-xl p-6 border transition-all duration-300 ${getCardBorderClass()}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[var(--text-main)] mb-2 leading-tight">{job.title}</h3>
          <div className="space-y-2">
            <div className="flex items-center text-[var(--text-muted)] text-sm">
              <div className="p-1 bg-[var(--primary)]/10 rounded mr-3">
                <Building size={14} className="text-[var(--primary)]" />
              </div>
              <span className="font-medium">{job.company || 'N/A'}</span>
            </div>
            {job.location && (
              <div className="flex items-center text-[var(--text-muted)] text-sm">
                <div className="p-1 bg-[var(--secondary)]/10 rounded mr-3">
                  <MapPin size={14} className="text-[var(--secondary)]" />
                </div>
                <span>{job.location}</span>
              </div>
            )}
            {job.publishedDate && (
              <div className="flex items-center text-[var(--text-muted)] text-sm">
                <div className="p-1 bg-[var(--warning)]/10 rounded mr-3">
                  <Calendar size={14} className="text-[var(--warning)]" />
                </div>
                <span>{new Date(job.publishedDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {job.aiAnalysis && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${getAIAnalysisColor()}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${job.aiAnalysis.isHiringPost ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}></div>
                  <span className="font-semibold">
                    AI: {job.aiAnalysis.isHiringPost ? '✓ Hiring Post' : '✗ Not Hiring'}
                  </span>
                  <span className="px-2 py-1 bg-[var(--bg-surface)] rounded text-xs font-bold border border-[var(--border)]">
                    {job.aiAnalysis.confidence}%
                  </span>
                </div>
                <span className="text-xs opacity-75 bg-[var(--bg-surface)] px-2 py-1 rounded border border-[var(--border)]">
                  {job.aiAnalysis.category}
                </span>
              </div>
              {job.aiAnalysis.reasons && job.aiAnalysis.reasons.length > 0 && (
                <div className="text-xs opacity-80 leading-relaxed">
                  <strong>Reasons:</strong> {job.aiAnalysis.reasons.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          )}
          {job.userAction && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-semibold border ${job.userAction === 'track'
              ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
              : 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
              }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${job.userAction === 'track' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}></div>
                {job.userAction === 'track' ? '✓ Marked to Track' : '✗ Marked to Skip'}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3 ml-4">
          {!job.userAction && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onTrack(job)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] hover:bg-[var(--success)]/90 text-black text-sm font-bold rounded-lg transition-all duration-200 shadow-sm"
                title="Mark to Track (will be saved when you click Save Changes)"
              >
                <Save size={16} />
                Track
              </button>
              <button
                onClick={() => onSkip(job)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--text-muted)] text-sm font-medium rounded-lg transition-all duration-200"
                title="Mark to Skip (won't appear in future searches)"
              >
                ✗ Skip
              </button>
            </div>
          )}
          {job.userAction === 'track' && (
            <button
              onClick={() => onSkip(job)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--danger)] hover:text-[var(--danger)] text-[var(--text-muted)] text-sm font-medium rounded-lg transition-all duration-200"
            >
              ✗ Skip Instead
            </button>
          )}
          {job.userAction === 'skip' && (
            <button
              onClick={() => onTrack(job)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] hover:bg-[var(--success)]/90 text-black text-sm font-bold rounded-lg transition-all duration-200 shadow-sm"
            >
              <Save size={16} />
              Track Instead
            </button>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/20 rounded-lg transition-all duration-200"
            title="Open Job URL"
          >
            <ExternalLink size={16} />
            <span className="text-sm font-medium">View</span>
          </a>
        </div>
      </div>
      {job.content && (
        <div className="mt-4 p-4 bg-[var(--bg-deep)] rounded-lg border border-[var(--border)]">
          <h4 className="text-sm font-semibold text-[var(--text-main)] mb-2">Job Description</h4>
          <div className="text-[var(--text-muted)] text-sm leading-relaxed line-clamp-3">
            {job.content.substring(0, 300)}...
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Loading Components
const ChunkLoadingSpinner = () => (
  <div className="flex items-center justify-center py-6">
    <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg">
      <div className="w-5 h-5 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
      <span className="text-[var(--text-main)] text-sm font-medium">AI Filtering in progress...</span>
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
  <div className={`flex items-center justify-between p-6 mb-6 rounded-xl backdrop-blur-sm border transition-all duration-300 ${isFiltered ? 'bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/30 shadow-green-500/20' :
    isLoading ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 shadow-primary/20' :
      error ? 'bg-gradient-to-r from-red-500/10 to-red-600/5 border-red-500/30 shadow-red-500/20' :
        'bg-gradient-to-r from-bg-light to-bg-card border-border shadow-lg'
    }`}>
    <div className="flex items-center">
      <div className="flex items-center gap-3">
        <div className="px-3 py-1 bg-primary/20 rounded-lg border border-primary/30">
          <span className="text-primary font-bold text-sm">Chunk {chunkId}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-white font-medium">
            {isFiltered ? `${filteredJobs} visible jobs` : `${totalJobs} jobs`}
          </span>
          {isFiltered && (
            <span className="text-text-muted text-sm">
              ({totalJobs} total)
            </span>
          )}
        </div>
      </div>
      {error && (
        <div className="ml-4 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg">
          <span className="text-red-400 text-sm font-medium">⚠ {error}</span>
        </div>
      )}
    </div>
    <div className="flex gap-3 flex-wrap">
      {!isFiltered && !isLoading && (
        <button
          onClick={onFilter}
          disabled={isLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Sparkles size={18} />
          AI Filter
        </button>
      )}
      {isFiltered && !isLoading && (
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            onClick={onTrackAll}
            disabled={filteredJobs === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-500 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <Save size={16} />
            Track All ({filteredJobs})
          </button>
          <button
            onClick={onSkipAll}
            disabled={filteredJobs === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:from-gray-500 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            ✗ Skip All ({filteredJobs})
          </button>
        </div>
      )}
      {isLoading && <ChunkLoadingSpinner />}
    </div>
  </div>
);

// Initial prompt for the user to start a search
const InitialPrompt = () => (
  <div className="text-center py-20">
    <div className="relative mb-8">
      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/30">
        <Search size={48} className="text-primary" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-ping"></div>
    </div>
    <h3 className="text-2xl font-bold text-white mb-4">Find Your Next Opportunity</h3>
    <p className="text-text-muted text-lg max-w-md mx-auto leading-relaxed">
      Use the search bar above to discover jobs with AI-powered filtering and date-based search capabilities.
    </p>
    <div className="mt-8 flex items-center justify-center gap-4 text-sm text-text-muted">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-primary rounded-full"></div>
        <span>AI Analysis</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Smart Filtering</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
    <div className="bg-[var(--bg-surface)] rounded-xl p-6 mb-8 border border-[var(--border)]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--primary)]/10 rounded-lg">
            <Filter className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-main)]">Advanced Filters</h3>
        </div>
        <button
          onClick={() => setShowFilters(false)}
          className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-light)] rounded-lg transition-colors"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Date Filters - Your Core Feature */}
        <FormDateInput
          label="Posted After"
          value={filters.postedAfter}
          onChange={(e) => handleFilterChange('postedAfter', e.target.value)}
        />
        <FormDateInput
          label="Posted Before"
          value={filters.postedBefore}
          onChange={(e) => handleFilterChange('postedBefore', e.target.value)}
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
          onChange={(e) => handleFilterChange('maxPages', e.target.value)}
          min={1}
          max={20}
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
          <div className="flex items-center gap-3 p-4 bg-[var(--bg-light)]/50 rounded-lg border border-[var(--border)]/50">
            <input
              type="checkbox"
              id="onlyHiringPosts"
              checked={filters.onlyHiringPosts}
              onChange={(e) => handleFilterChange('onlyHiringPosts', e.target.checked)}
              className="w-5 h-5 text-[var(--primary)] bg-[var(--bg-surface)] border-[var(--border)] rounded focus:ring-[var(--primary)] focus:ring-2"
            />
            <label htmlFor="onlyHiringPosts" className="text-sm text-[var(--text-main)] font-medium cursor-pointer">
              <span className="flex items-center gap-2">
                <span>Only Hiring Posts</span>
                <span className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded font-bold">AI POWERED</span>
              </span>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                AI detects: job titles, &quot;hiring&quot;, &quot;apply&quot;, salary mentions, and other hiring indicators
              </div>
            </label>
          </div>
        </div>

        {/* Date Filter */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-3 p-4 bg-[var(--bg-light)]/50 rounded-lg border border-[var(--border)]/50">
            <input
              type="checkbox"
              id="hasDate"
              checked={hasDate === true}
              onChange={(e) => setHasDate(e.target.checked ? true : undefined)}
              className="w-5 h-5 text-[var(--primary)] bg-[var(--bg-surface)] border-[var(--border)] rounded focus:ring-[var(--primary)] focus:ring-2"
            />
            <label htmlFor="hasDate" className="text-sm text-[var(--text-main)] font-medium cursor-pointer">
              <span className="flex items-center gap-2">
                <span>Show jobs with dates only</span>
                <span className="px-2 py-1 bg-[var(--secondary)]/10 text-[var(--secondary)] text-xs rounded font-bold">FILTER</span>
              </span>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                When checked, only shows jobs that have valid publication dates. Unchecked shows all jobs.
              </div>
            </label>
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
      <Toaster />
      <div className="p-6">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-4 mb-6 px-6 py-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl">
            <div className="p-2 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-[var(--text-main)]">
              AI-Powered Job Search
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto leading-relaxed">
            Discover opportunities with intelligent filtering, AI analysis, and advanced search capabilities.
            Find jobs that match your criteria with precision and speed.
          </p>
        </div>
        <div className="max-w-6xl mx-auto">
          {/* Search Bar and Controls */}
          <div className="mb-10 space-y-6">
            <form id="searchForm" onSubmit={handleSearch} className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
              <div className="flex gap-4">
                <div className="flex-grow">
                  <FormInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., React Developer, MERN Stack, Full Stack Engineer"
                    icon={<Search className="w-5 h-5" />}
                    className="text-lg py-4"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-dim)] text-black font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center"
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
                </button>
              </div>
            </form>

            {/* Filter and Save Controls */}
            <div className="flex gap-3 flex-wrap items-center justify-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 font-medium py-3 px-6 rounded-xl transition-all duration-200 ${showFilters
                  ? 'bg-[var(--primary)] text-black shadow-sm'
                  : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-light)] text-[var(--text-main)] border border-[var(--border)]'
                  }`}
              >
                <Filter size={18} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* AI Config Panel */}
          {/* Removed AIProviderConfig from AI Filtering page as per user request */}
          {/* {showAIConfig && (
            <AIProviderConfig
              aiProvider={aiProvider}
              setAiProvider={setAiProvider}
              apiKey={apiKey}
              setApiKey={setApiKey}
              apiUrl={apiUrl}
              setApiUrl={setApiUrl}
              model={model}
              setModel={setModel}
              setShowConfig={setShowAIConfig}
            />
          )}
          */}

          {/* Removed AI Config toggle button as per user request */}
          {/*
          <button
            onClick={() => setShowAIConfig(!showAIConfig)}
            className={`flex items-center gap-2 font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 ${
              showAIConfig
                ? 'bg-primary text-white shadow-lg'
                : 'bg-bg-card hover:bg-bg-light text-text border border-border'
            }`}
          >
            <Cog size={18} />
            <div className="flex flex-col items-start">
              <span>{showAIConfig ? 'Hide AI Config' : 'AI Config'}</span>
              <span className="text-xs opacity-75 capitalize">
                {aiProvider.replace('-', ' ')} {apiKey || apiUrl ? '✓' : '⚠'}
              </span>
            </div>
          </button>
          */}

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
