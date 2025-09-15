import { NextRequest, NextResponse } from 'next/server';
import ApiSearchService from '@/lib/apiSearchService';
import AiFilterService from '@/lib/aiFilterService';
import MongoDBService from '@/lib/mongodbService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SearchJob extends Record<string, any> {
  title: string;
  content: string;
  url: string;
  publishedDate?: string;
  date?: string;
  postedDate?: string;
  metadata?: { publishedDate?: string };
  location?: string;
  company?: string;
  salary?: { min: number; max: number };
  engine?: string;
}

type SearchResults = MultiPageResult | {
  query: string;
  totalResults: number;
  pagesSearched: number;
  maxPages: number;
  results: SearchJob[];
  storageStats?: {
    saved: number;
    total: number;
  };
};

interface FilterStats {
  applied: boolean;
  type: string;
  originalCount?: number;
  filteredCount?: number;
  additionalFilters?: Record<string, string | number | boolean>;
  additionalFilteredCount?: number;
}

interface SearchResultData {
  number_of_results: number;
  results: SearchJob[];
}

interface R
 {
  success: boolean;
  data?: SearchResultData;
  error?: string;
  storageStats?: {
    saved: number;
    total: number;
  };
}

interface MultiPageResult {
  query: string;
  totalResults: number;
  pagesSearched: number;
  maxPages: number;
  results: SearchJob[];
  storageStats?: {
    saved: number;
    total: number;
  };
}

interface SearchResponse {
  success: boolean;
  query: string;
  totalResults: number;
  pages: number;
  maxPages: number;
  filter: FilterStats;
  data: SearchJob[];
  storage?: {
    saved: number;
    total: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchService = new ApiSearchService();
    const aiFilterService = new AiFilterService();
    const mongoService = new MongoDBService();

    // Helper function to get job date
    // Enhanced date extraction to handle cases where date fields are overwritten with current date
    const getJobDate = (job: SearchJob) => {
      // Try to parse date fields first
      const dateCandidates = [
        job.publishedDate,
        job.postedDate,
        job.metadata?.publishedDate,
        job.date,
        job.postedDate
      ].filter((d): d is string => Boolean(d));
      const dateObjects = dateCandidates.map(d => new Date(d));
 
      // Filter out invalid dates
      const validDates = dateObjects.filter(d => !isNaN(d.getTime()));

      // If multiple valid dates, pick the earliest (original post date)
      if (validDates.length > 0) {
        const earliestDate = validDates.reduce((a, b) => a < b ? a : b);

        // Heuristic: if earliestDate is very recent (e.g., within last 2 days) but content mentions older date, fallback to content parsing
        const now = new Date();
        const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
        if ((now.getTime() - earliestDate.getTime()) < twoDaysMs) {
          // Try to parse date from content
          const parsedDate = mongoService.parsePublishedDate(job);
          if (parsedDate && !isNaN(parsedDate.getTime()) && parsedDate < earliestDate) {
            return parsedDate;
          }
        }
        return earliestDate;
      }

      // If no valid date fields, parse from content
      return mongoService.parsePublishedDate(job);
    };
    
    const { searchParams } = new URL(request.url);
    
    // Extract parameters exactly like your original server.js
    const query = searchParams.get('q');
    const maxPages = searchParams.get('maxPages') ? parseInt(searchParams.get('maxPages')!, 10) : 1;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const filter = searchParams.get('filter') || 'none'; // none, hiring, ai
    const storeResults = searchParams.get('store') !== 'false'; // Default true, set to false to skip storage
    const location = searchParams.get('location');
    const jobType = searchParams.get('jobType');
    const experienceLevel = searchParams.get('experienceLevel');
    const isRemote = searchParams.get('remote');
    const minSalary = searchParams.get('minSalary') ? parseInt(searchParams.get('minSalary')!, 10) : null;
    const maxSalary = searchParams.get('maxSalary') ? parseInt(searchParams.get('maxSalary')!, 10) : null;
    const company = searchParams.get('company');
    const postedAfter = searchParams.get('postedAfter');
    const postedBefore = searchParams.get('postedBefore');
    const searchEngine = searchParams.get('engine'); // New: search engine filter
    const hasDate = searchParams.get('hasDate'); // New: filter for jobs with/without dates

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
    }

    console.log(`Received search request for: "${query}"`);
    console.log(`Filters: maxPages=${maxPages}, filter=${filter}, store=${storeResults}`);
    if (location) console.log(`  Location: ${location}`);
    if (jobType) console.log(`  Job Type: ${jobType}`);
    if (experienceLevel) console.log(`  Experience: ${experienceLevel}`);
    if (isRemote) console.log(`  Remote: ${isRemote}`);
    if (minSalary) console.log(`  Min Salary: ${minSalary}`);
    if (maxSalary) console.log(`  Max Salary: ${maxSalary}`);
    if (company) console.log(`  Company: ${company}`);
    if (searchEngine) console.log(`  Search Engine: ${searchEngine}`);

    let results: SearchResults;

    if (maxPages > 1) {
      // Multi-page search with optional storage
      if (storeResults) {
        results = await searchService.searchAllPagesAndStore(query, maxPages);
      } else {
        results = await searchService.searchAllPages(query, maxPages, false); // Pass false to disable storage
      }
    } else {
      // Single page search with optional storage
      if (storeResults) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await searchService.searchAndStore(query, { pageno: page }) as any;
        if (!result.success) {
          throw new Error(result.error);
        }
        results = {
          query: query,
          totalResults: result.data.number_of_results,
          pagesSearched: 1,
          maxPages: maxPages,
          results: result.data.results || [],
          storageStats: result.storageStats
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await searchService.search(query, { pageno: page }) as any;
        if (!result.success) {
          throw new Error(result.error);
        }
        results = {
          query: query,
          totalResults: result.data.number_of_results,
          pagesSearched: 1,
          maxPages: maxPages,
          results: result.data.results || []
        };
      }
    }

    // Apply filtering if requested
    let filteredResults = results.results;
    let filterStats: FilterStats = { applied: false, type: 'none' };

    if (filter === 'hiring') {
      filteredResults = aiFilterService.quickHiringFilter(results.results);
      filterStats = { 
        applied: true, 
        type: 'quick-hiring',
        originalCount: results.results.length,
        filteredCount: filteredResults.length
      };
    } else if (filter === 'ai') {
      const aiFiltered = await aiFilterService.filterResults(results.results, {
        onlyHiringPosts: true,
        minConfidence: 60
      });
      filteredResults = aiFiltered;
      filterStats = { 
        applied: true, 
        type: 'ai-hiring',
        originalCount: results.results.length,
        filteredCount: filteredResults.length
      };
    }

    // Helper function to extract field from job content
    const extractFieldFromContent = (job: SearchJob, field: string): string | { min: number; max: number } | null => {
      const content = (job.title + ' ' + job.content).toLowerCase();
      switch (field) {
        case 'location':
          // Look for location patterns in content
          const locationMatch = content.match(/(?:location|based in|in)\s*[:]?\s*([a-zA-Z\s,]+)(?:\s|$)/);
          return locationMatch ? locationMatch[1].trim() : null;
        case 'company':
          // Look for company names in content
          const companyMatch = content.match(/(?:company|at)\s*[:]?\s*([a-zA-Z\s&\.]+)(?:\s|$)/);
          return companyMatch ? companyMatch[1].trim() : null;
        case 'salary':
          // Look for salary information
          const salaryMatch = content.match(/\$(\d+(?:,\d+)?(?:\.\d{2})?)(?:\s*(?:-|to)\s*\$(\d+(?:,\d+)?(?:\.\d{2})?))?/);
          return salaryMatch ? {
            min: parseInt(salaryMatch[1].replace(',', '')),
            max: salaryMatch[2] ? parseInt(salaryMatch[2].replace(',', '')) : parseInt(salaryMatch[1].replace(',', ''))
          } : null;
        default:
          return null;
      }
    };

    // Apply additional filters
    const additionalFilters: Record<string, string | number | boolean> = {};

    if (location) {
      filteredResults = filteredResults.filter((job: SearchJob) => {
        const jobLocation = job.location || extractFieldFromContent(job, 'location');
        if (typeof jobLocation === 'string') {
          return jobLocation.toLowerCase().includes(location.toLowerCase());
        }
        return false;
      });
      additionalFilters.location = location;
    }

    if (jobType) {
      filteredResults = filteredResults.filter((job: SearchJob) =>
        job.title && job.title.toLowerCase().includes(jobType.toLowerCase())
      );
      additionalFilters.jobType = jobType;
    }

    if (isRemote) {
      const remoteFilter = isRemote.toLowerCase() === 'true';
      filteredResults = filteredResults.filter((job: SearchJob) => {
        const content = (job.title + ' ' + job.content).toLowerCase();
        return content.includes('remote') === remoteFilter;
      });
      additionalFilters.remote = remoteFilter;
    }

    if (company) {
      filteredResults = filteredResults.filter((job: SearchJob) => {
        const jobCompany = job.company || extractFieldFromContent(job, 'company');
        if (typeof jobCompany === 'string') {
          return jobCompany.toLowerCase().includes(company.toLowerCase());
        }
        return false;
      });
      additionalFilters.company = company;
    }

    if (searchEngine) {
      filteredResults = filteredResults.filter((job: SearchJob) =>
        job.engine && job.engine.toLowerCase().includes(searchEngine!)
      );
      additionalFilters.searchEngine = searchEngine;
    }

    if (hasDate) {
      const hasDateFilter = hasDate.toLowerCase() === 'true';
      filteredResults = filteredResults.filter((job: SearchJob) => {
        // Strictly check publishedDate field for null or invalid
        if (hasDateFilter) {
          if (!job.publishedDate) return false;
          const pubDate = new Date(job.publishedDate);
          if (isNaN(pubDate.getTime())) return false;
          return true;
        } else {
          return true; // If filter is false, show all jobs
        }
      });
      additionalFilters.hasDate = hasDateFilter;
    }

    if (minSalary !== null) {
      filteredResults = filteredResults.filter((job: SearchJob) => {
        const jobSalary = job.salary || extractFieldFromContent(job, 'salary');
        return jobSalary && typeof jobSalary === 'object' && 'min' in jobSalary && (jobSalary as { min: number; max: number }).min >= minSalary!;
      });
      additionalFilters.minSalary = minSalary;
    }

    if (maxSalary !== null) {
      filteredResults = filteredResults.filter((job: SearchJob) => {
        const jobSalary = job.salary || extractFieldFromContent(job, 'salary');
        return jobSalary && typeof jobSalary === 'object' && 'max' in jobSalary && (jobSalary as { min: number; max: number }).max <= maxSalary!;
      });
      additionalFilters.maxSalary = maxSalary;
    }



    if (postedAfter) {
      filteredResults = filteredResults.filter((job: SearchJob) => {
        const jobDate = getJobDate(job);
        if (!jobDate || isNaN(jobDate.getTime())) return false;
        const filterDate = new Date(postedAfter!);
        // Normalize both dates to midnight UTC for accurate comparison ignoring time
        const jobDateUTC = Date.UTC(jobDate.getUTCFullYear(), jobDate.getUTCMonth(), jobDate.getUTCDate());
        const filterDateUTC = Date.UTC(filterDate.getUTCFullYear(), filterDate.getUTCMonth(), filterDate.getUTCDate());
        return jobDateUTC > filterDateUTC;
      });
      additionalFilters.postedAfter = postedAfter;
    }

    if (postedBefore) {
      filteredResults = filteredResults.filter((job: SearchJob) => {
        const jobDate = getJobDate(job);
        if (!jobDate || isNaN(jobDate.getTime())) return false;
        const filterDate = new Date(postedBefore!);
        return jobDate <= filterDate;
      });
      additionalFilters.postedBefore = postedBefore;
    }

    if (Object.keys(additionalFilters).length > 0) {
      filterStats.additionalFilters = additionalFilters;
      filterStats.additionalFilteredCount = filteredResults.length;
    }

    const response: SearchResponse = {
      success: true,
      query: query,
      totalResults: results.totalResults,
      pages: results.pagesSearched,
      maxPages: results.maxPages,
      filter: filterStats,
      data: filteredResults
    };

    // Add storage stats if available
    if ('storageStats' in results && results.storageStats) {
      response.storage = results.storageStats;
    }

    return NextResponse.json(response);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Search API error:', errorMessage);

    // Provide user-friendly error messages based on error type
    let userFriendlyMessage = 'An error occurred while searching. Please try again later.';
    let statusCode = 500;

    if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
      userFriendlyMessage = 'Search timed out. The search service is currently slow. Please try again in a few minutes.';
      statusCode = 504; // Gateway Timeout
    } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      userFriendlyMessage = 'Unable to connect to search service. Please check your internet connection and try again.';
      statusCode = 503; // Service Unavailable
    } else if (errorMessage.includes('Search API error: 5')) {
      userFriendlyMessage = 'Search service is temporarily unavailable. Please try again later.';
      statusCode = 503;
    }

    return NextResponse.json(
      { error: userFriendlyMessage, details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: statusCode }
    );
  }
}