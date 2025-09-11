import { NextRequest, NextResponse } from 'next/server';

// Import services dynamically to handle CommonJS modules
let ApiSearchService: any;
let AiFilterService: any;
let MongoDBService: any;

// Initialize services
const initServices = async () => {
  if (!ApiSearchService) {
    ApiSearchService = (await import('@/lib/apiSearchService')).default || require('@/lib/apiSearchService');
    AiFilterService = (await import('@/lib/aiFilterService')).default || require('@/lib/aiFilterService');
    MongoDBService = (await import('@/lib/mongodbService')).default || require('@/lib/mongodbService');
  }
};

interface FilterStats {
  applied: boolean;
  type: string;
  originalCount?: number;
  filteredCount?: number;
  additionalFilters?: Record<string, any>;
  additionalFilteredCount?: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  totalResults: number;
  pages: number;
  maxPages: number;
  filter: FilterStats;
  data: any[];
  storage?: {
    saved: number;
    total: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Initialize services
    await initServices();

    const searchService = new ApiSearchService();
    const aiFilterService = new AiFilterService();
    const mongoService = new MongoDBService();

    // Helper function to get job date
    // Enhanced date extraction to handle cases where date fields are overwritten with current date
    const getJobDate = (job: Record<string, any>) => {
      // Try to parse date fields first
      const dateCandidates = [
        job.publishedDate,
        job.postedDate,
        job.metadata?.publishedDate,
        job.date,
        job.postedDate
      ].filter(Boolean).map((d: string) => new Date(d));

      // Filter out invalid dates
      const validDates = dateCandidates.filter(d => !isNaN(d.getTime()));

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

    let results;

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
        const result = await searchService.searchAndStore(query, { pageno: page });
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
        const result = await searchService.search(query, { pageno: page });
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
    const extractFieldFromContent = (job: Record<string, any>, field: string) => {
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
    const additionalFilters: Record<string, any> = {};

    if (location) {
      filteredResults = filteredResults.filter((job: Record<string, any>) => {
        const jobLocation = job.location || extractFieldFromContent(job, 'location');
        return jobLocation && jobLocation.toLowerCase().includes(location.toLowerCase());
      });
      additionalFilters.location = location;
    }

    if (jobType) {
      filteredResults = filteredResults.filter((job: Record<string, any>) =>
        job.title && job.title.toLowerCase().includes(jobType.toLowerCase())
      );
      additionalFilters.jobType = jobType;
    }

    if (isRemote) {
      const remoteFilter = isRemote.toLowerCase() === 'true';
      filteredResults = filteredResults.filter((job: Record<string, any>) => {
        const content = (job.title + ' ' + job.content).toLowerCase();
        return content.includes('remote') === remoteFilter;
      });
      additionalFilters.remote = remoteFilter;
    }

    if (company) {
      filteredResults = filteredResults.filter((job: Record<string, any>) => {
        const jobCompany = job.company || extractFieldFromContent(job, 'company');
        return jobCompany && jobCompany.toLowerCase().includes(company.toLowerCase());
      });
      additionalFilters.company = company;
    }

    if (searchEngine) {
      filteredResults = filteredResults.filter((job: Record<string, any>) =>
        job.engine && job.engine.toLowerCase().includes(searchEngine!)
      );
      additionalFilters.searchEngine = searchEngine;
    }

    if (hasDate) {
      const hasDateFilter = hasDate.toLowerCase() === 'true';
      filteredResults = filteredResults.filter((job: Record<string, any>) => {
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
      filteredResults = filteredResults.filter((job: Record<string, any>) => {
        const jobSalary = job.salary || extractFieldFromContent(job, 'salary');
        return jobSalary && jobSalary.min >= minSalary!;
      });
      additionalFilters.minSalary = minSalary;
    }

    if (maxSalary !== null) {
      filteredResults = filteredResults.filter((job: Record<string, any>) => {
        const jobSalary = job.salary || extractFieldFromContent(job, 'salary');
        return jobSalary && jobSalary.max <= maxSalary!;
      });
      additionalFilters.maxSalary = maxSalary;
    }



    if (postedAfter) {
      filteredResults = filteredResults.filter((job: Record<string, any>) => {
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
      filteredResults = filteredResults.filter((job: Record<string, unknown>) => {
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
    if (results.storageStats) {
      response.storage = results.storageStats;
    }

    return NextResponse.json(response);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Search API error:', errorMessage);
    return NextResponse.json(
      { error: 'An error occurred while searching.', details: errorMessage },
      { status: 500 }
    );
  }
}