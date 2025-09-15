/**
 * API Search Service - Integrates with Canine Search API for job searching
 * This replaces the original external server search functionality
 */

import MongoDBService from './mongodbService';

class ApiSearchService {
  constructor() {
    this.urls = JSON.parse(process.env.SEARCH_API_URLS || '["https://search.canine.tools"]');
    this.mongoService = new MongoDBService();
  }

  /**
   * Single page search without storage
   */
  async search(query, options = {}) {
    const MAX_RETRIES = 3;

    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        const searchParams = {
          q: query,
          format: 'json',
          pageno: options.pageno || 1,
          time_range: options.time_range || 'month',
          categories: 'it,news',
          engines: 'duckduckgo,bing',
          enabled_engines: 'duckduckgo,wikipedia',
          disabled_engines: '',
          language: 'en',
          safesearch: '1',
          autocomplete: 'duckduckgo',
          image_proxy: 'True',
          results_on_new_tab: '0',
          theme: 'simple',
          enabled_plugins: 'Hash_plugin,Self_Information,Tracker_URL_remover,Ahmia_blacklist',
          disabled_plugins: '',
          ...options
        };
        const queryString = new URLSearchParams(searchParams).toString();

        // Pick a random base URL from the list and append /search path
        const baseUrl = this.urls[Math.floor(Math.random() * this.urls.length)];
        const url = `${baseUrl}/search?${queryString}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log("response: ",response)
        const data = await response.json();
        console.log("data from search api:",data)
        return {
          success: true,
          data: {
            number_of_results: data.number_of_results || data.results?.length || 0,
            results: this.transformResults(data.results || [])
          }
        };
      } catch (error) {
        attempt++;
        console.error(`Search error on attempt ${attempt}:`, error);
        // Exponential backoff for retries
        const backoffTime = Math.min(1000 * 2 ** attempt, 10000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    // If all retries failed
    return {
      success: false,
      error: 'All search attempts failed'
    };
  }

  /**
   * Single page search without storage
   */
  async searchAndStore(query, options = {}) {
    return this.search(query, options);
  }

  /**
   * Multi-page search without storage
   */
  async searchAllPages(query, maxPages = 3, store = false) {
    try {
      let allResults = [];
      let totalResults = 0;
      let consecutiveFailures = 0;
      const MAX_CONSECUTIVE_FAILURES = 2;
      
      for (let page = 1; page <= maxPages; page++) {
        const searchResult = await this.search(query, { 
          pageno: page 
        });
        console.log("searchresult: ",searchResult)
        if (!searchResult.success) {
          console.error(`Page ${page} search failed:`, searchResult.error);
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.error('Too many consecutive failures, aborting multi-page search.');
            break;
          }
          continue;
        }
        consecutiveFailures = 0;

        allResults = allResults.concat(searchResult.data.results);
        totalResults = searchResult.data.number_of_results;
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const results = {
        query,
        totalResults,
        pagesSearched: maxPages,
        maxPages,
        results: allResults
      };
      if (store) {
        const storageStats = await this.mongoService.saveJobResults(
          allResults,
          query
        );
        results.storageStats = {
          saved: storageStats.length,
          total: allResults.length
        };
      }

      return results;
    } catch (error) {
      console.error('Multi-page search error:', error);
      throw error;
    }
  }

  /**
   * Multi-page search without storage
   */
  async searchAllPagesAndStore(query, maxPages = 3) {
    return this.searchAllPages(query, maxPages, false);
  }

  /**
   * Transform Canine Search API results to our format
   */
  transformResults(results) {
    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((result, index) => {
      const extractedDate = this.extractDate(result.content) || null; // [!code --] const extractedDate = this.extractDate(result.content) || new Date().toISOString();
      return {
        id: result.url ? this.generateIdFromUrl(result.url) : `job_${Date.now()}_${index}`,
        title: result.title || 'Unknown Title',
        company: this.extractCompany(result.title, result.content),
        location: this.extractLocation(result.content) || 'Remote',
        content: result.content || '',
        description: result.content || '',
        link: result.url || '',
        url: result.url || '',
        date: extractedDate,
        publishedDate: extractedDate,
        postedDate: extractedDate,
        salary: this.extractSalary(result.content),
        jobType: this.extractJobType(result.content) || 'full-time',
        source: this.extractSource(result.url || result.engine || 'Unknown'),
        engine: result.engine || 'google',
        snippet: result.content || '',
        metadata: {
          publishedDate: extractedDate,
          source: result.engine || 'Unknown',
          score: result.score || 0
        }
      }
    });
  }

  /**
   * Generate ID from URL
   */
  generateIdFromUrl(url) {
    return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50) + '_' + Date.now();
  }

  /**
   * Extract company name from title or content
   */
  extractCompany(title, content) {
    const titleCompanyMatch = title.match(/at\s+([A-Za-z\s&\.]+?)(?:\s|$|-|,)/i);
    if (titleCompanyMatch) {
      return titleCompanyMatch[1].trim();
    }
    const contentCompanyMatch = content.match(/(?:company|at|join)\s*[:]?\s*([A-Za-z\s&\.]+?)(?:\s|$|,|\.|!)/i);
    if (contentCompanyMatch) {
      return contentCompanyMatch[1].trim();
    }
    return 'Unknown Company';
  }

  /**
   * Extract location from content
   */
  extractLocation(content) {
    const locationPatterns = [
      /location[:\s]+([A-Za-z\s,]+?)(?:\s|$|,|\.|!)/i,
      /based\s+in\s+([A-Za-z\s,]+?)(?:\s|$|,|\.|!)/i,
      /(?:remote|hybrid|onsite|office)/i
    ];
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1] ? match[1].trim() : match[0];
      }
    }
    return null;
  }

  /**
   * Extract date from content
   */
  extractDate(content) {
    if (!content) return null;
    
    // Logic to parse relative dates like "X hours/days/weeks ago"
    const relativeMatch = content.match(/(\d+)\s+(hour|day|week|month)s?\s+ago/i);
    if (relativeMatch) {
      const value = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2].toLowerCase();
      const date = new Date();
      
      if (unit.startsWith('hour')) {
        date.setHours(date.getHours() - value);
      } else if (unit.startsWith('day')) {
        date.setDate(date.getDate() - value);
      } else if (unit.startsWith('week')) {
        date.setDate(date.getDate() - value * 7);
      } else if (unit.startsWith('month')) {
        date.setMonth(date.getMonth() - value);
      }
      return date.toISOString();
    }
    
    const absolutePatterns = [
      // "Sep 1, 2025"
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}/i,
      // "today" or "yesterday"
      /(today|yesterday)/i
    ];

    for (const pattern of absolutePatterns) {
      const match = content.match(pattern);
      if (match && match[0]) {
        try {
          // Handle "today" and "yesterday" specifically
          if (match[0].toLowerCase() === 'today') {
            return new Date().toISOString();
          }
          if (match[0].toLowerCase() === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString();
          }

          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (e) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Extract salary from content
   */
  extractSalary(content) {
    const salaryPatterns = [
      /\$(\d+(?:,\d+)?(?:\.\d{2})?)\s*(?:-|to)\s*\$(\d+(?:,\d+)?(?:\.\d{2})?)/,
      /\$(\d+(?:,\d+)?(?:\.\d{2})?)/,
      /(\d+(?:,\d+)?)\s*(?:LPA|per\s+annum|annually)/i,
      /(\d+(?:,\d+)?)\s*(?:k|thousand)\s*(?:per\s+month|monthly)/i
    ];
    for (const pattern of salaryPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }
    return null;
  }

  /**
   * Extract job type from content
   */
  extractJobType(content) {
    const text = content.toLowerCase();
    if (text.includes('full-time') || text.includes('full time')) return 'full-time';
    if (text.includes('part-time') || text.includes('part time')) return 'part-time';
    if (text.includes('contract') || text.includes('freelance')) return 'contract';
    if (text.includes('internship') || text.includes('intern')) return 'internship';
    
    return 'full-time';
  }

  /**
   * Extract source platform from job data
   */
  extractSource(source) {
    const text = source.toLowerCase();
    if (text.includes('naukri')) return 'Naukri';
    if (text.includes('linkedin')) return 'LinkedIn';
    if (text.includes('indeed')) return 'Indeed';
    if (text.includes('glassdoor')) return 'Glassdoor';
    if (text.includes('monster')) return 'Monster';
    return 'Other';
  }
}

export default ApiSearchService;