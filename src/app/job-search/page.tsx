'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, Filter, MapPin, Building, Clock, DollarSign, Bookmark, ExternalLink } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  postedDate: string;
  description: string;
  url: string;
  isBookmarked?: boolean;
}

interface SearchFilters {
  query: string;
  location: string;
  jobType: string;
  salaryRange: string;
  datePosted: string;
}

const JobSearchPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    jobType: 'all',
    salaryRange: 'all',
    datePosted: 'all'
  });

  const jobTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'remote', label: 'Remote' }
  ];

  const salaryRanges = [
    { value: 'all', label: 'All Salaries' },
    { value: '0-50k', label: '$0 - $50k' },
    { value: '50k-100k', label: '$50k - $100k' },
    { value: '100k-150k', label: '$100k - $150k' },
    { value: '150k+', label: '$150k+' }
  ];

  const datePostedOptions = [
    { value: 'all', label: 'Any Time' },
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' }
  ];

  const searchJobs = async () => {
    if (!filters.query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: filters.query,
          location: filters.location,
          jobType: filters.jobType !== 'all' ? filters.jobType : undefined,
          salaryRange: filters.salaryRange !== 'all' ? filters.salaryRange : undefined,
          datePosted: filters.datePosted !== 'all' ? filters.datePosted : undefined,
          page: currentPage
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setFilteredJobs(data.jobs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error searching jobs:', err);
      setError('Failed to search jobs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookmark = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (response.ok) {
        setFilteredJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, isBookmarked: !job.isBookmarked } : job
        ));
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    searchJobs();
  };

  const formatSalary = (salary?: string) => {
    if (!salary) return 'Salary not specified';
    return salary;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <AppLayout showFooter={false}>
      <div className="p-8 bg-bg min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Job Search</h1>
            <p className="text-text-muted text-lg">Find your next opportunity with AI-powered job matching</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="bg-bg-card rounded-xl p-6 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormInput
                  placeholder="Job title, keywords, or company"
                  value={filters.query}
                  onChange={(value) => handleFilterChange('query', value)}
                  icon={<Search className="w-5 h-5" />}
                />

                <FormInput
                  placeholder="Location"
                  value={filters.location}
                  onChange={(value) => handleFilterChange('location', value)}
                  icon={<MapPin className="w-5 h-5" />}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-3 bg-bg-light border border-border rounded-lg text-text hover:bg-bg-card transition-colors"
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-success hover:from-success hover:to-primary text-white rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Searching...' : 'Search Jobs'}
                  </button>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                  <select
                    value={filters.jobType}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    className="px-4 py-3 bg-bg-light border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {jobTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>

                  <select
                    value={filters.salaryRange}
                    onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                    className="px-4 py-3 bg-bg-light border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {salaryRanges.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>

                  <select
                    value={filters.datePosted}
                    onChange={(e) => handleFilterChange('datePosted', e.target.value)}
                    className="px-4 py-3 bg-bg-light border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {datePostedOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Results */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-text-muted">Searching for jobs...</p>
              </div>
            ) : filteredJobs.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-text-muted">
                    Showing {filteredJobs.length} jobs {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
                  </p>
                </div>

                {filteredJobs.map((job) => (
                  <div key={job.id} className="bg-bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
                        <div className="flex items-center gap-4 text-text-muted mb-3">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span>{job.company}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(job.postedDate)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                            {job.type}
                          </span>
                          {job.salary && (
                            <div className="flex items-center gap-1 text-success">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">{formatSalary(job.salary)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-text-muted line-clamp-3">{job.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => toggleBookmark(job.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            job.isBookmarked 
                              ? 'bg-primary/20 text-primary' 
                              : 'bg-bg-light text-text-muted hover:text-primary'
                          }`}
                        >
                          <Bookmark className={`w-5 h-5 ${job.isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                        
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors font-medium"
                        >
                          Apply
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-bg-card border border-border rounded-lg text-text hover:bg-bg-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="px-4 py-2 text-text-muted">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-bg-card border border-border rounded-lg text-text hover:bg-bg-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : !isLoading && filters.query && (
              <div className="text-center py-12">
                <p className="text-text-muted text-lg mb-2">No jobs found</p>
                <p className="text-text-muted">Try adjusting your search criteria or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default JobSearchPage;