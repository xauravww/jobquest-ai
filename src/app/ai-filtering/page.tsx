'use client';

import React, { useState } from 'react';
import { Bot, Building, ExternalLink, LoaderCircle, Search, Sparkles, Filter, RotateCcw, DollarSign, MapPin, Calendar, Building2, Save, Eye } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { FormInput, FormInputNumber, FormDateInput } from '@/components/ui/FormInput';

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

// Job Card Component
const JobCard = ({ job, onTrack, onSkip }: { 
  job: Job; 
  onTrack: (job: Job) => void;
  onSkip: (job: Job) => void;
}) => {
  const getCardBorderClass = () => {
    if (job.userAction === 'track') return 'border-green-500/50 bg-green-500/5';
    if (job.userAction === 'skip') return 'border-red-500/50 bg-red-500/5';
    return 'border-white/20';
  };

  const getAIAnalysisColor = () => {
    if (!job.aiAnalysis) return 'bg-gray-500/10 text-gray-300';
    if (job.aiAnalysis.isHiringPost) return 'bg-green-500/10 text-green-300';
    return 'bg-red-500/10 text-red-300';
  };

  return (
    <div className={`bg-bg-card rounded-xl shadow-lg p-6 border transition-all duration-300 hover:border-primary/40 hover:shadow-2xl ${getCardBorderClass()}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{job.title}</h3>
          <div className="flex items-center text-text-muted mt-1 text-sm">
            <Building size={16} className="mr-2" />
            <span>{job.company || 'N/A'}</span>
          </div>
          {job.location && (
            <div className="flex items-center text-text-muted mt-1 text-sm">
              <MapPin size={16} className="mr-2" />
              <span>{job.location}</span>
            </div>
          )}
          {job.aiAnalysis && (
            <div className={`mt-2 p-2 rounded text-xs ${getAIAnalysisColor()}`}>
              <div className="flex items-center justify-between">
                <span>AI: {job.aiAnalysis.isHiringPost ? '✓ Hiring' : '✗ Not Hiring'} ({job.aiAnalysis.confidence}%)</span>
                <span className="text-xs opacity-75">{job.aiAnalysis.category}</span>
              </div>
              {job.aiAnalysis.reasons && job.aiAnalysis.reasons.length > 0 && (
                <div className="mt-1 text-xs opacity-75">
                  {job.aiAnalysis.reasons.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          )}
          {job.userAction && (
            <div className={`mt-2 p-2 rounded text-xs font-medium ${
              job.userAction === 'track' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {job.userAction === 'track' ? '✓ Marked to Track' : '✗ Marked to Skip'}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          {!job.userAction && (
            <>
              <button
                onClick={() => onTrack(job)}
                className="flex items-center gap-1 px-3 py-1 bg-success hover:bg-success/80 text-white text-xs rounded-lg transition-colors"
                title="Mark to Track (will be saved when you click Save Changes)"
              >
                <Save size={14} />
                Track
              </button>
              <button
                onClick={() => onSkip(job)}
                className="flex items-center gap-1 px-3 py-1 bg-error hover:bg-error/80 text-white text-xs rounded-lg transition-colors"
                title="Mark to Skip (won't appear in future searches)"
              >
                ✗ Skip
              </button>
            </>
          )}
          {job.userAction === 'track' && (
            <button
              onClick={() => onSkip(job)}
              className="flex items-center gap-1 px-3 py-1 bg-error hover:bg-error/80 text-white text-xs rounded-lg transition-colors"
            >
              ✗ Skip Instead
            </button>
          )}
          {job.userAction === 'skip' && (
            <button
              onClick={() => onTrack(job)}
              className="flex items-center gap-1 px-3 py-1 bg-success hover:bg-success/80 text-white text-xs rounded-lg transition-colors"
            >
              <Save size={14} />
              Track Instead
            </button>
          )}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-primary transition-colors"
            title="Open Job URL"
          >
            <ExternalLink size={20} />
          </a>
        </div>
      </div>
      {job.content && (
        <div className="text-text-muted text-sm line-clamp-3">
          {job.content.substring(0, 200)}...
        </div>
      )}
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center text-center py-20">
    <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
    <p className="mt-4 text-text-muted">Searching for opportunities...</p>
  </div>
);

// Chunk Loading Spinner
const ChunkLoadingSpinner = () => (
  <div className="flex items-center justify-center py-4">
    <LoaderCircle className="w-6 h-6 animate-spin text-primary mr-2" />
    <span className="text-text-muted text-sm">Filtering...</span>
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
  <div className={`flex items-center justify-between p-4 mb-4 rounded-lg ${
    isFiltered ? 'bg-success/10 border border-success/30' :
    isLoading ? 'bg-primary/10 border border-primary/30' :
    error ? 'bg-error/10 border border-error/30' :
    'bg-bg-light border border-border'
  }`}>
    <div className="flex items-center">
      <span className="text-white font-semibold mr-4">Chunk {chunkId}</span>
      <span className="text-text-muted text-sm">
        {isFiltered ? `${filteredJobs} visible jobs (${totalJobs} total)` : `${totalJobs} jobs`}
      </span>
      {error && (
        <span className="text-error text-sm ml-4">Error: {error}</span>
      )}
    </div>
    <div className="flex gap-2 flex-wrap">
      {!isFiltered && !isLoading && (
        <button
          onClick={onFilter}
          disabled={isLoading}
          className="flex items-center bg-primary hover:bg-primary/80 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed text-sm"
        >
          <Sparkles size={16} className="mr-2" />
          AI Filter
        </button>
      )}
      {isFiltered && !isLoading && (
        <>
          <button
            onClick={onReset}
            className="flex items-center bg-bg-light hover:bg-bg-card text-text font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <RotateCcw size={16} className="mr-2" />
            Reset
          </button>
          <button
            onClick={onTrackAll}
            disabled={filteredJobs === 0}
            className="flex items-center bg-success hover:bg-success/80 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium py-1 px-3 rounded text-xs"
          >
            Track All ({filteredJobs})
          </button>
          <button
            onClick={onSkipAll}
            disabled={filteredJobs === 0}
            className="flex items-center bg-error hover:bg-error/80 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium py-1 px-3 rounded text-xs"
          >
            Skip All ({filteredJobs})
          </button>
        </>
      )}
      {isLoading && <ChunkLoadingSpinner />}
    </div>
  </div>
);

// Initial prompt for the user to start a search
const InitialPrompt = () => (
  <div className="text-center py-20 text-text-muted">
    <Search size={48} className="mx-auto mb-4" />
    <h3 className="text-xl font-semibold">Find Your Next Job</h3>
    <p>Use the search bar above to get started with date-based filtering.</p>
  </div>
);

const JobSearchPage = () => {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('mern hiring');
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showHiddenJobs, setShowHiddenJobs] = useState(false);
  const [filters, setFilters] = useState({
    location: '',
    company: '',
    minSalary: '',
    maxSalary: '',
    postedAfter: '',
    postedBefore: '',
    searchEngine: '',
    maxPages: '3',
    onlyHiringPosts: true,
    minConfidence: 60
  });
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{
    toTrack: Job[];
    toSkip: Job[];
  }>({ toTrack: [], toSkip: [] });

  // Generate unique ID for job
  const generateJobId = (job: Job): string => {
    return `${job.url}-${job.title}-${job.company}`.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  };

  // Handle marking job to track
  const handleTrackJob = (job: Job) => {
    const jobId = generateJobId(job);
    
    // Update job in chunks
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      jobs: chunk.jobs.map(j => generateJobId(j) === jobId ? { ...j, userAction: 'track' as const } : j),
      filteredJobs: chunk.filteredJobs.map(j => generateJobId(j) === jobId ? { ...j, userAction: 'track' as const } : j)
    })));

    // Update pending changes
    setPendingChanges(prev => ({
      toTrack: [...prev.toTrack.filter(j => generateJobId(j) !== jobId), job],
      toSkip: prev.toSkip.filter(j => generateJobId(j) !== jobId)
    }));
  };

  // Handle marking job to skip
  const handleSkipJob = (job: Job) => {
    const jobId = generateJobId(job);
    
    // Update job in chunks
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      jobs: chunk.jobs.map(j => generateJobId(j) === jobId ? { ...j, userAction: 'skip' as const } : j),
      filteredJobs: chunk.filteredJobs.map(j => generateJobId(j) === jobId ? { ...j, userAction: 'skip' as const } : j)
    })));

    // Update pending changes
    setPendingChanges(prev => ({
      toTrack: prev.toTrack.filter(j => generateJobId(j) !== jobId),
      toSkip: [...prev.toSkip.filter(j => generateJobId(j) !== jobId), job]
    }));
  };

  // Handle bulk track all visible jobs in a chunk
  const handleTrackAllInChunk = (chunkId: number) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return;

    const visibleJobs = chunk.filteredJobs.filter(job => !job.userAction);
    if (visibleJobs.length === 0) {
      alert('No visible jobs to track in this chunk.');
      return;
    }

    visibleJobs.forEach(job => {
      handleTrackJob(job);
    });
  };

  // Handle bulk skip all visible jobs in a chunk
  const handleSkipAllInChunk = (chunkId: number) => {
    const chunk = chunks.find(c => c.id === chunkId);
    if (!chunk) return;

    const visibleJobs = chunk.filteredJobs.filter(job => !job.userAction);
    if (visibleJobs.length === 0) {
      alert('No visible jobs to skip in this chunk.');
      return;
    }

    visibleJobs.forEach(job => {
      handleSkipJob(job);
    });
  };

  // Function to chunk results into groups of 5
  const chunkResults = (results: Job[], chunkSize = 5): Chunk[] => {
    const chunks: Chunk[] = [];
    for (let i = 0; i < results.length; i += chunkSize) {
      const chunkJobs = results.slice(i, i + chunkSize);
      chunks.push({
        id: chunks.length + 1,
        jobs: chunkJobs,
        isFiltered: false,
        isLoading: false,
        error: null,
        filteredJobs: chunkJobs
      });
    }
    return chunks;
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      // Call your original server API exactly like in the reference
      const searchParams: Record<string, string | number> = {
        q: query,
        filter: 'none', // Get all results initially
        maxPages: parseInt(filters.maxPages) || 3,
        store: 'false' // Don't auto-store search results - we'll handle this manually
      };

      // Add advanced filters to search parameters
      if (filters.location) searchParams.location = filters.location;
      if (filters.company) searchParams.company = filters.company;
      if (filters.minSalary) searchParams.minSalary = filters.minSalary;
      if (filters.maxSalary) searchParams.maxSalary = filters.maxSalary;
      if (filters.postedAfter) searchParams.postedAfter = filters.postedAfter;
      if (filters.postedBefore) searchParams.postedBefore = filters.postedBefore;
      if (filters.searchEngine) searchParams.searchEngine = filters.searchEngine;

      console.log('Searching with params:', searchParams);

      // Build the URL with query parameters for the integrated API
      const searchUrl = new URL('/api/jobs/search', window.location.origin);
      Object.entries(searchParams).forEach(([key, value]) => {
        searchUrl.searchParams.append(key, value.toString());
      });

      console.log('Final search URL:', searchUrl.toString());

      const response = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search jobs');
      }

      const data = await response.json();
      console.log("Response data:", data);

      // Get jobs from response
      const allJobs = data.data || [];
      
      setChunks(chunkResults(allJobs));
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load job results. Please check your internet connection and ensure the search API is accessible.');
    } finally {
      setIsLoading(false);
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
      if (filters.company) filterParams.company = filters.company;
      if (filters.minSalary) filterParams.minSalary = parseInt(filters.minSalary);
      if (filters.maxSalary) filterParams.maxSalary = parseInt(filters.maxSalary);
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
              status: 'interested',
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

      alert(`Changes saved successfully!\n- ${savedCount} jobs added to tracker\n- ${skippedCount} jobs permanently skipped`);
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please check the console for details.');
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

  // Filter Panel Component
  const FilterPanel = () => (
    <div className="bg-bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
        <button
          onClick={() => setShowFilters(false)}
          className="text-text-muted hover:text-white"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          onChange={(e) => handleFilterChange('location', e.target.value)}
          placeholder="e.g., Remote, New York"
          icon={<MapPin className="w-4 h-4" />}
        />

        {/* Company Filter */}
        <FormInput
          label="Company"
          value={filters.company}
          onChange={(e) => handleFilterChange('company', e.target.value)}
          placeholder="e.g., Google, Microsoft"
          icon={<Building2 className="w-4 h-4" />}
        />

        {/* Salary Filters */}
        <FormInputNumber
          label="Min Salary ($)"
          value={filters.minSalary}
          onChange={(value) => handleFilterChange('minSalary', value)}
          placeholder="e.g., 80000"
          icon={<DollarSign className="w-4 h-4" />}
          min={0}
          step={1000}
        />
        <FormInputNumber
          label="Max Salary ($)"
          value={filters.maxSalary}
          onChange={(value) => handleFilterChange('maxSalary', value)}
          placeholder="e.g., 150000"
          icon={<DollarSign className="w-4 h-4" />}
          min={0}
          step={1000}
        />

        {/* Confidence Filter */}
        <FormInputNumber
          label="Min Confidence (%)"
          value={filters.minConfidence}
          onChange={(value) => handleFilterChange('minConfidence', value || 60)}
          min={0}
          max={100}
          step={1}
        />

        {/* Max Pages Filter */}
        <FormInputNumber
          label="Max Pages"
          value={filters.maxPages}
          onChange={(value) => handleFilterChange('maxPages', value)}
          placeholder="1-10"
          icon={<Search className="w-4 h-4" />}
          min={1}
          max={10}
          step={1}
        />

        {/* Hiring Posts Filter */}
        <div className="space-y-2 flex items-center">
          <input
            type="checkbox"
            id="onlyHiringPosts"
            checked={filters.onlyHiringPosts}
            onChange={(e) => handleFilterChange('onlyHiringPosts', e.target.checked)}
            className="w-4 h-4 text-primary bg-bg-light border-border rounded focus:ring-primary"
          />
          <label htmlFor="onlyHiringPosts" className="text-sm text-text-muted ml-2">
            Only Hiring Posts (AI detects: job titles, &quot;hiring&quot;, &quot;apply&quot;, salary mentions)
          </label>
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
        <div className="space-y-6">
          {chunks.map((chunk) => (
            <div key={chunk.id} className="border border-border rounded-xl p-4">
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
              <div className="space-y-3">
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
                <div className="mt-4 p-3 bg-bg-light rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-text-muted">
                      {chunk.filteredJobs.filter(job => job.userAction === 'track').length > 0 && (
                        <span className="text-success">
                          {chunk.filteredJobs.filter(job => job.userAction === 'track').length} job(s) marked to track
                        </span>
                      )}
                      {chunk.filteredJobs.filter(job => job.userAction === 'track').length > 0 && 
                       chunk.filteredJobs.filter(job => job.userAction === 'skip').length > 0 && (
                        <span className="text-text-muted"> • </span>
                      )}
                      {chunk.filteredJobs.filter(job => job.userAction === 'skip').length > 0 && (
                        <span className="text-error">
                          {chunk.filteredJobs.filter(job => job.userAction === 'skip').length} job(s) marked to skip
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowHiddenJobs(!showHiddenJobs)}
                      className="text-xs text-primary hover:text-primary/80 px-2 py-1 bg-primary/10 rounded"
                    >
                      {showHiddenJobs ? 'Hide Marked Jobs' : 'Show Marked Jobs'}
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
      <div className="text-center py-20 text-text-muted">
        <Bot size={48} className="mx-auto mb-4" />
        <h3 className="text-xl font-semibold">No job results found.</h3>
        <p>Try a different search query to discover new opportunities.</p>
      </div>
    );
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI-Powered Job Search</h1>
          <p className="text-text-muted">Search for jobs and filter them in chunks using AI analysis with date-based filtering.</p>
        </div>
        <div className="max-w-6xl mx-auto">
          {/* Search Bar and Controls */}
          <div className="mb-6 space-y-4">
            <form id="searchForm" onSubmit={handleSearch} className="flex gap-2">
              <FormInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., React Developer, MERN Stack"
                icon={<Search className="w-5 h-5" />}
                className="flex-grow"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary/80 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Filter and Save Controls */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center bg-bg-card hover:bg-bg-light text-text font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Filter size={16} className="mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              {(pendingChanges.toTrack.length > 0 || pendingChanges.toSkip.length > 0) && (
                <button
                  onClick={() => setShowHiddenJobs(!showHiddenJobs)}
                  className="flex items-center bg-primary hover:bg-primary/80 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <Eye size={16} className="mr-2" />
                  {showHiddenJobs ? 'Hide Marked Jobs' : 'Show Marked Jobs'}
                </button>
              )}
              {(pendingChanges.toTrack.length > 0 || pendingChanges.toSkip.length > 0) && (
                <div className="flex items-center gap-2">
                  <div className="text-sm text-text-muted px-3 py-2 bg-bg-card rounded-lg">
                    Pending: {pendingChanges.toTrack.length} to track, {pendingChanges.toSkip.length} to skip
                  </div>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="flex items-center bg-success hover:bg-success/80 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    <Save size={16} className="mr-2" />
                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && <FilterPanel />}

          {renderContent()}
        </div>
      </div>
    </AppLayout>
  );
};

export default JobSearchPage;