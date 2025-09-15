'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Building, ExternalLink, Search, Sparkles, Filter, RotateCcw, DollarSign, MapPin, Calendar, Building2, Save, Eye, Cog, Lock, Link } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';
import { FormInput, FormInputNumber, FormDateInput, FormSelect } from '@/components/ui/FormInput';

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

// Job Card Component
const JobCard = ({ job, onTrack, onSkip }: { 
  job: Job; 
  onTrack: (job: Job) => void;
  onSkip: (job: Job) => void;
}) => {
  const getCardBorderClass = () => {
    if (job.userAction === 'track') return 'border-green-500/50 bg-green-500/5 shadow-green-500/20';
    if (job.userAction === 'skip') return 'border-red-500/50 bg-red-500/5 shadow-red-500/20';
    return 'border-border hover:border-primary/50';
  };

  const getAIAnalysisColor = () => {
    if (!job.aiAnalysis) return 'bg-gray-500/20 text-gray-300 border border-gray-500/30';
    if (job.aiAnalysis.isHiringPost) return 'bg-green-500/20 text-green-300 border border-green-500/30';
    return 'bg-red-500/20 text-red-300 border border-red-500/30';
  };

  return (
    <div className={`bg-gradient-to-br from-bg-card to-bg-card/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${getCardBorderClass()}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 leading-tight">{job.title}</h3>
          <div className="space-y-2">
            <div className="flex items-center text-text-muted text-sm">
              <div className="p-1 bg-primary/20 rounded mr-3">
                <Building size={14} className="text-primary" />
              </div>
              <span className="font-medium">{job.company || 'N/A'}</span>
            </div>
            {job.location && (
              <div className="flex items-center text-text-muted text-sm">
                <div className="p-1 bg-blue-500/20 rounded mr-3">
                  <MapPin size={14} className="text-blue-400" />
                </div>
                <span>{job.location}</span>
              </div>
            )}
            {job.publishedDate && (
              <div className="flex items-center text-text-muted text-sm">
                <div className="p-1 bg-yellow-500/20 rounded mr-3">
                  <Calendar size={14} className="text-yellow-400" />
                </div>
                <span>{new Date(job.publishedDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {job.aiAnalysis && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${getAIAnalysisColor()}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${job.aiAnalysis.isHiringPost ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="font-semibold">
                    AI: {job.aiAnalysis.isHiringPost ? '✓ Hiring Post' : '✗ Not Hiring'} 
                  </span>
                  <span className="px-2 py-1 bg-white/10 rounded text-xs font-bold">
                    {job.aiAnalysis.confidence}%
                  </span>
                </div>
                <span className="text-xs opacity-75 bg-white/10 px-2 py-1 rounded">
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
            <div className={`mt-3 p-3 rounded-lg text-sm font-semibold border ${
              job.userAction === 'track' 
                ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${job.userAction === 'track' ? 'bg-green-400' : 'bg-red-400'}`}></div>
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                title="Mark to Track (will be saved when you click Save Changes)"
              >
                <Save size={16} />
                Track
              </button>
              <button
                onClick={() => onSkip(job)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                title="Mark to Skip (won't appear in future searches)"
              >
                ✗ Skip
              </button>
            </div>
          )}
          {job.userAction === 'track' && (
            <button
              onClick={() => onSkip(job)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
            >
              ✗ Skip Instead
            </button>
          )}
          {job.userAction === 'skip' && (
            <button
              onClick={() => onTrack(job)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Save size={16} />
              Track Instead
            </button>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary hover:text-white border border-primary/30 hover:border-primary rounded-lg transition-all duration-200 hover:scale-105"
            title="Open Job URL"
          >
            <ExternalLink size={16} />
            <span className="text-sm font-medium">View</span>
          </a>
        </div>
      </div>
      {job.content && (
        <div className="mt-4 p-4 bg-bg-light/50 rounded-lg border border-border/50">
          <h4 className="text-sm font-semibold text-white mb-2">Job Description</h4>
          <div className="text-text-muted text-sm leading-relaxed line-clamp-3">
            {job.content.substring(0, 300)}...
          </div>
        </div>
      )}
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center text-center py-20">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-primary/40 rounded-full animate-spin animation-delay-150"></div>
    </div>
    <p className="mt-6 text-text-muted text-lg">Searching for opportunities...</p>
    <div className="mt-2 flex items-center gap-1">
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-100"></div>
      <div className="w-2 h-2 bg-primary rounded-full animate-bounce animation-delay-200"></div>
    </div>
  </div>
);

// Chunk Loading Spinner
const ChunkLoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-3"></div>
    <span className="text-text-muted text-sm font-medium">AI Filtering in progress...</span>
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
  <div className={`flex items-center justify-between p-6 mb-6 rounded-xl backdrop-blur-sm border transition-all duration-300 ${
    isFiltered ? 'bg-gradient-to-r from-green-500/10 to-green-600/5 border-green-500/30 shadow-green-500/20' :
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

const AI_PROVIDERS = [
  { label: 'LM Studio', value: 'lm-studio' },
  { label: 'Ollama', value: 'ollama' },
  { label: 'Gemini', value: 'gemini' }
];

// AI Provider Configuration Component
const AIProviderConfig = ({
  aiProvider,
  setAiProvider,
  apiKey,
  setApiKey,
  apiUrl,
  setApiUrl,
  model,
  setModel,
  setShowConfig
}: {
  aiProvider: string;
  setAiProvider: (value: string) => void;
  apiKey: string;
  setApiKey: (value: string) => void;
  apiUrl: string;
  setApiUrl: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  setShowConfig: (value: boolean) => void;
}) => {
  const requiresApiKey = aiProvider === 'gemini';
  const requiresUrlAndModel = aiProvider === 'lm-studio' || aiProvider === 'ollama';

  return (
    <div className="ai-config-panel rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Cog className="w-5 h-5 text-primary" />
          </div>
          <div className="text-xl font-semibold text-white">AI Provider Configuration</div>
        </div>
        <div
          onClick={() => setShowConfig(false)}
          className="w-8 h-8 cursor-pointer"
        >
          ×
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Provider Selection */}
        <FormSelect
          label="AI Provider"
          value={aiProvider}
          onChange={setAiProvider}
          options={AI_PROVIDERS}
          required
        />

        {/* API Key (for Gemini) */}
        {requiresApiKey && (
          <FormInput
            label="API Key"
            value={apiKey}
            onChange={setApiKey}
            placeholder="Enter your Gemini API key"
            icon={<Lock className="w-4 h-4" />}
            type="password"
            required
          />
        )}

        {/* API URL (for LM Studio and Ollama) */}
        {requiresUrlAndModel && (
          <FormInput
            label="API URL"
            value={apiUrl}
            onChange={setApiUrl}
            placeholder="http://localhost:1234"
            icon={<Link className="w-4 h-4" />}
            required
          />
        )}

        {/* Model Name */}
        {requiresUrlAndModel && (
          <FormInput
            label="Model Name"
            value={model}
            onChange={setModel}
            placeholder="local-model"
            icon={<Bot className="w-4 h-4" />}
            required
          />
        )}

        {/* Gemini Model Selection */}
        {aiProvider === 'gemini' && (
          <FormSelect
            label="Gemini Model"
            value={model}
            onChange={setModel}
            options={[
              { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash-exp' },
              { label: 'Gemini Pro', value: 'gemini-pro' },
              { label: 'Gemini Pro Vision', value: 'gemini-pro-vision' }
            ]}
            required
          />
        )}

        {/* Info Section */}
        <div className="md:col-span-2">
          <div className="p-4 bg-bg-light/50 rounded-lg border border-border/50">
            <h4 className="text-sm font-semibold text-white mb-2">Provider Information</h4>
            <div className="text-xs text-text-muted space-y-1">
              {aiProvider === 'lm-studio' && (
                <>
                  <p>• LM Studio: Local AI server for running models like Llama, Mistral, etc.</p>
                  <p>• Default URL: http://localhost:1234</p>
                  <p>• No API key required - runs locally</p>
                </>
              )}
              {aiProvider === 'ollama' && (
                <>
                  <p>• Ollama: Local AI model runner</p>
                  <p>• Default URL: http://localhost:11434</p>
                  <p>• No API key required - runs locally</p>
                </>
              )}
              {aiProvider === 'gemini' && (
                <>
                  <p>• Google Gemini: Cloud AI service</p>
                  <p>• Requires API key from Google AI Studio</p>
                  <p>• Model will be set automatically (gemini-pro)</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={(e) => {
            const config = { provider: aiProvider, apiKey, apiUrl, model, enabled: true };
            localStorage.setItem('ai-provider-config', JSON.stringify(config));
            console.log('AI config manually saved to localStorage:', config);
            // Show temporary success message
            const button = e.target as HTMLButtonElement;
            if (button) {
              const originalText = button.textContent;
              button.textContent = '✓ Saved!';
              button.classList.add('bg-green-500');
              setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('bg-green-500');
              }, 2000);
            }
          }}
          className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};

const JobSearchPage = () => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('mern hiring');
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showHiddenJobs, setShowHiddenJobs] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    postedAfter: '',
    postedBefore: '',
    searchEngine: '',
    maxPages: '',
    onlyHiringPosts: true,
    minConfidence: '' as string | number
  });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    toTrack: Job[];
    toSkip: Job[];
  }>({ toTrack: [], toSkip: [] });

  // New filter state for hasDate
  const [hasDate, setHasDate] = useState<boolean | undefined>(undefined);

  // Ref to maintain focus on the input
  const maxPagesInputRef = useRef<HTMLInputElement | null>(null);

  // AI provider config state
  const [aiProvider, setAiProvider] = useState('lm-studio');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('http://localhost:1234');
  const [model, setModel] = useState('local-model');
  // Removed AI Config state and toggle as per user request
  // const [showAIConfig, setShowAIConfig] = useState(false);

  // Load saved AI config from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('ai-provider-config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          if (config.provider) setAiProvider(config.provider);
          if (config.apiKey) setApiKey(config.apiKey);
          if (config.apiUrl) setApiUrl(config.apiUrl);
          if (config.model) setModel(config.model);
          console.log('AI config loaded from localStorage:', config);
        } catch (e) {
          console.warn('Failed to parse saved AI config');
        }
      }
    }
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

      const chunkSize = 20;
      const newChunks: Chunk[] = [];

      for (let i = 0; i < processedJobs.length; i += chunkSize) {
        const chunkJobs = processedJobs.slice(i, i + chunkSize);
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
  const handleTrackJob = (job: Job) => {
    setPendingChanges(prev => ({
      ...prev,
      toTrack: [...prev.toTrack, job]
    }));

    // Update job userAction in chunks
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      jobs: chunk.jobs.map(j => j.id === job.id ? { ...j, userAction: 'track' } : j),
      filteredJobs: chunk.filteredJobs.map(j => j.id === job.id ? { ...j, userAction: 'track' } : j)
    })));
  };

  // Handle skip job
  const handleSkipJob = (job: Job) => {
    setPendingChanges(prev => ({
      ...prev,
      toSkip: [...prev.toSkip, job]
    }));

    // Update job userAction in chunks
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      jobs: chunk.jobs.map(j => j.id === job.id ? { ...j, userAction: 'skip' } : j),
      filteredJobs: chunk.filteredJobs.map(j => j.id === job.id ? { ...j, userAction: 'skip' } : j)
    })));
  };

  // Handle track all in chunk
  const handleTrackAllInChunk = (chunkId: number) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return;

    const jobsToTrack = chunk.filteredJobs.filter(job => !job.userAction);
    setPendingChanges(prev => ({
      ...prev,
      toTrack: [...prev.toTrack, ...jobsToTrack]
    }));

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
  };

  // Handle skip all in chunk
  const handleSkipAllInChunk = (chunkId: number) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return;

    const jobsToSkip = chunk.filteredJobs.filter(job => !job.userAction);
    setPendingChanges(prev => ({
      ...prev,
      toSkip: [...prev.toSkip, ...jobsToSkip]
    }));

    // Update all jobs in chunk
    setChunks(prev => prev.map(chunk =>
      chunk.id === chunkId
        ? {
            ...chunk,
            jobs: chunk.jobs.map(j => ({ ...j, userAction: 'skip' })),
            filteredJobs: chunk.filteredJobs.map(j => ({ ...j, userAction: 'skip' }))
          }
        : chunk
    ));
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
          filters: filterParams
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to filter jobs');
      }

      const filterData = await response.json();

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
      setChunks(prev => prev.map(chunk =>
        chunk.id === chunkId
          ? { ...chunk, isLoading: false, error: 'Filtering failed' }
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

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      let savedCount = 0;
      let skippedCount = 0;

      // Save tracked jobs to applications
      if (pendingChanges.toTrack.length > 0) {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobs: pendingChanges.toTrack.map(job => ({
              jobTitle: job.title,
              company: job.company || 'Unknown Company',
              location: job.location || 'Unknown Location',
              jobUrl: job.url,
              description: job.content || '',
              status: 'saved',
              notes: `Added from AI search on ${new Date().toLocaleDateString()}`
            }))
          }),
        });

        if (response.ok) {
          const data = await response.json();
          savedCount = data.savedCount || 0;
        }
      }

      // Skip jobs
      if (pendingChanges.toSkip.length > 0) {
        const response = await fetch('/api/jobs/skip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobIds: pendingChanges.toSkip.map(job => job.id || job.url)
          }),
        });

        if (response.ok) {
          const data = await response.json();
          skippedCount = data.skippedCount || 0;
        }
      }

      // Clear pending changes
      setPendingChanges({ toTrack: [], toSkip: [] });

      // Reset user actions in chunks
      setChunks(prev => prev.map(chunk => ({
        ...chunk,
        jobs: chunk.jobs.map(j => ({ ...j, userAction: null })),
        filteredJobs: chunk.filteredJobs.map(j => ({ ...j, userAction: null }))
      })));

      toast.success(`Changes saved successfully!\n- ${savedCount} jobs added to tracker\n- ${skippedCount} jobs permanently skipped`);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes. Please check the console for details.');
    } finally {
      setIsSaving(false);
    }
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
  setHasDate,
  maxPagesInputRef
}: {
  filters: FilterState;
  handleFilterChange: (key: keyof FilterState, value: string | number | boolean) => void;
  hasDate: boolean | undefined;
  setShowFilters: (value: boolean) => void;
  setHasDate: (value: boolean | undefined) => void;
  maxPagesInputRef: React.RefObject<HTMLInputElement | null>;
}) => (
  <div className="filter-panel rounded-xl p-6 mb-8">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Filter className="w-5 h-5 text-primary" />
        </div>
        <div className="text-xl font-semibold text-white">Advanced Filters</div>
      </div>
      <div
        onClick={() => setShowFilters(false)}
        className="w-8 h-8 cursor-pointer"
      >
        ×
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Date Filters - Your Core Feature */}
      <FormDateInput
        label="Posted After"
        value={filters.postedAfter}
        onChange={(value) => handleFilterChange('postedAfter', value)}
      />
      <FormDateInput
        label="Posted Before"
        value={filters.postedBefore}
        onChange={(value) => handleFilterChange('postedBefore', value)}
      />

      {/* Location Filter */}
      <FormInput
        label="Location"
        value={filters.location}
        onChange={(value) => handleFilterChange('location', value)}
        placeholder="e.g., Remote, New York"
        icon={<MapPin className="w-4 h-4" />}
      />

      {/* Confidence Filter */}
      <FormInputNumber
        label="Min Confidence (%)"
        value={filters.minConfidence}
        onChange={(value) => handleFilterChange('minConfidence', value !== null ? value : 60)}
        min={0}
        max={100}
        step={1}
      />

      {/* Max Pages Filter */}
      <div className="w-full">
        <label className="block text-sm font-medium text-white mb-2">
          Max Pages
        </label>
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => {
              if (maxPagesInputRef.current) {
                const currentValue = parseInt(maxPagesInputRef.current.value) || 3;
                const newValue = Math.max(1, currentValue - 1);
                maxPagesInputRef.current.value = newValue.toString();
                handleFilterChange('maxPages', newValue.toString());
              }
              // Start continuous decrement
              const interval = setInterval(() => {
                if (maxPagesInputRef.current) {
                  const currentValue = parseInt(maxPagesInputRef.current.value) || 3;
                  const newValue = Math.max(1, currentValue - 1);
                  maxPagesInputRef.current.value = newValue.toString();
                  handleFilterChange('maxPages', newValue.toString());
                }
              }, 150);
              // Clear interval on mouse up
              const clearIntervalOnUp = () => {
                clearInterval(interval);
                document.removeEventListener('mouseup', clearIntervalOnUp);
              };
              document.addEventListener('mouseup', clearIntervalOnUp);
            }}
            className="bg-bg-light hover:bg-bg-card border border-border rounded px-3 py-2 text-text hover:text-white transition-colors select-none"
            type="button"
          >
            -
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
            <input
              ref={maxPagesInputRef}
              type="number"
              defaultValue={filters.maxPages || 3}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 1;
                const finalValue = Math.max(1, value).toString();
                e.target.value = finalValue;
                handleFilterChange('maxPages', finalValue);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-full bg-bg-card border border-border rounded px-10 py-2 text-text focus:border-primary focus:outline-none"
              min="1"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </div>
          <button
            onMouseDown={() => {
              if (maxPagesInputRef.current) {
                const currentValue = parseInt(maxPagesInputRef.current.value) || 3;
                const newValue = currentValue + 1;
                maxPagesInputRef.current.value = newValue.toString();
                handleFilterChange('maxPages', newValue.toString());
              }
              // Start continuous increment
              const interval = setInterval(() => {
                if (maxPagesInputRef.current) {
                  const currentValue = parseInt(maxPagesInputRef.current.value) || 3;
                  const newValue = currentValue + 1;
                  maxPagesInputRef.current.value = newValue.toString();
                  handleFilterChange('maxPages', newValue.toString());
                }
              }, 150);
              // Clear interval on mouse up
              const clearIntervalOnUp = () => {
                clearInterval(interval);
                document.removeEventListener('mouseup', clearIntervalOnUp);
              };
              document.addEventListener('mouseup', clearIntervalOnUp);
            }}
            className="bg-bg-light hover:bg-bg-card border border-border rounded px-3 py-2 text-text hover:text-white transition-colors select-none"
            type="button"
          >
            +
          </button>
        </div>
      </div>

        {/* Hiring Posts Filter */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-3 p-4 bg-bg-light/50 rounded-lg border border-border/50">
            <input
              type="checkbox"
              id="onlyHiringPosts"
              checked={filters.onlyHiringPosts}
              onChange={(e) => handleFilterChange('onlyHiringPosts', e.target.checked)}
              className="w-5 h-5 text-primary bg-bg-card border-border rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="onlyHiringPosts" className="text-sm text-white font-medium cursor-pointer">
              <span className="flex items-center gap-2">
                <span>Only Hiring Posts</span>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded font-bold">AI POWERED</span>
              </span>
              <div className="text-xs text-text-muted mt-1">
                AI detects: job titles, &quot;hiring&quot;, &quot;apply&quot;, salary mentions, and other hiring indicators
              </div>
            </label>
          </div>
        </div>

        {/* Date Filter */}
        <div className="md:col-span-2 lg:col-span-3">
          <div className="flex items-center gap-3 p-4 bg-bg-light/50 rounded-lg border border-border/50">
            <input
              type="checkbox"
              id="hasDate"
              checked={hasDate === true}
              onChange={(e) => setHasDate(e.target.checked ? true : undefined)}
              className="w-5 h-5 text-primary bg-bg-card border-border rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="hasDate" className="text-sm text-white font-medium cursor-pointer">
              <span className="flex items-center gap-2">
                <span>Show jobs with dates only</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-bold">FILTER</span>
              </span>
              <div className="text-xs text-text-muted mt-1">
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
      return <LoadingSpinner />;
    }

    if (error) {
      return <div className="text-center py-20 text-error">{error}</div>;
    }

    if (chunks.length > 0) {
      return (
        <div className="space-y-8">
          {chunks.map((chunk) => (
            <div key={chunk.id} className="bg-gradient-to-br from-bg-card/50 to-bg-card/30 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-xl">
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
              <div className="space-y-4">
                {chunk.filteredJobs
                  .filter(job => showHiddenJobs || !job.userAction)
                  .map((job, index) => (
                    <JobCard
                      key={`${chunk.id}-${job.url || index}`}
                      job={job}
                      onTrack={handleTrackJob}
                      onSkip={handleSkipJob}
                    />
                  ))}
              </div>
              {/* Show summary of hidden jobs */}
              {chunk.filteredJobs.filter(job => job.userAction).length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-bg-light/50 to-bg-card/50 rounded-xl border border-border/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {chunk.filteredJobs.filter(job => job.userAction === 'track').length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-400 font-medium">
                            {chunk.filteredJobs.filter(job => job.userAction === 'track').length} to track
                          </span>
                        </div>
                      )}
                      {chunk.filteredJobs.filter(job => job.userAction === 'skip').length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-red-400 font-medium">
                            {chunk.filteredJobs.filter(job => job.userAction === 'skip').length} to skip
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowHiddenJobs(!showHiddenJobs)}
                      className="flex items-center gap-2 text-sm text-primary hover:text-white bg-primary/20 hover:bg-primary px-3 py-2 rounded-lg transition-all duration-200 font-medium"
                    >
                      <Eye size={14} />
                      {showHiddenJobs ? 'Hide Marked' : 'Show Marked'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-20">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-500/20 to-gray-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-500/30">
          <Bot size={48} className="text-gray-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">No Results Found</h3>
        <p className="text-text-muted text-lg max-w-md mx-auto leading-relaxed">
          Try adjusting your search terms or filters to discover new opportunities.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-text-muted">
          <span>💡 Tip: Try broader keywords like</span>
          <span className="px-2 py-1 bg-primary/20 text-primary rounded font-medium">&quot;developer&quot;</span>
          <span>or</span>
          <span className="px-2 py-1 bg-primary/20 text-primary rounded font-medium">&quot;engineer&quot;</span>
        </div>
      </div>
    );
  };

  return (
    <AppLayout showFooter={false}>
      <Toaster />
      <div className="p-6">
        <div className="mb-8 text-center">
          <div className="flex mt-4 items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/30">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <div className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              AI-Powered Job Search
            </div>
          </div>
          <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Discover opportunities with intelligent filtering, AI analysis, and advanced search capabilities. 
            Find jobs that match your criteria with precision and speed.
          </p>
        </div>
        <div className="max-w-6xl mx-auto">
          {/* Search Bar and Controls */}
          <div className="mb-8 space-y-6">
            <form id="searchForm" onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-grow">
                <FormInput
                  value={query}
                  onChange={(value: string) => setQuery(value)}
                  placeholder="e.g., React Developer, MERN Stack, Full Stack Engineer"
                  icon={<Search className="w-5 h-5" />}
                  className="text-lg py-4"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100 min-w-[140px]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Search
                  </div>
                )}
              </button>
            </form>

            {/* Filter and Save Controls */}
            <div className="flex gap-3 flex-wrap items-center">
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
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 ${
                  showFilters
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-bg-card hover:bg-bg-light text-text border border-border'
                }`}
              >
                <Filter size={18} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              
              {(pendingChanges.toTrack.length > 0 || pendingChanges.toSkip.length > 0) && (
                <>
                  <button
                    onClick={() => setShowHiddenJobs(!showHiddenJobs)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    <Eye size={18} />
                    {showHiddenJobs ? 'Hide Marked Jobs' : 'Show Marked Jobs'}
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-3 bg-gradient-to-r from-bg-card to-bg-light rounded-lg border border-border">
                      <div className="text-sm font-medium text-white">
                        Pending Changes
                      </div>
                      <div className="text-xs text-text-muted mt-1">
                        {pendingChanges.toTrack.length} to track • {pendingChanges.toSkip.length} to skip
                      </div>
                    </div>
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-500 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Save size={18} />
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </>
              )}
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
              maxPagesInputRef={maxPagesInputRef}
            />
          )}

          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );


};

export default JobSearchPage;
