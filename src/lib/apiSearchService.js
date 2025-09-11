/**
 * API Search Service - Integrates with Canine Search API for job searching
 * This replaces the original external server search functionality
 */

import MongoDBService from './mongodbService';

class ApiSearchService {
  constructor() {
    this.baseUrl = process.env.SEARCH_API_URL || 'https://search.canine.tools/search';
    this.mongoService = new MongoDBService();
  }

  /**
   * Single page search without storage
   */
  async search(query, options = {}) {
    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 10000; // 10 seconds

    const fetchWithTimeout = (url, fetchOptions, timeout) => {
      return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        fetchOptions.signal = controller.signal;

        fetch(url, fetchOptions)
          .then(response => {
            clearTimeout(id);
            resolve(response);
          })
          .catch(err => {
            clearTimeout(id);
            reject(err);
          });
      });
    };

    let attempt = 0;
    while (attempt <= MAX_RETRIES) {
      try {
        // Build search parameters based on your API structure
        const searchParams = {
          q: query,
          format: 'json',
          pageno: options.pageno || 1,
          time_range: options.time_range || 'month',
          categories: 'it,news',
          engines: 'duckduckgo,bing,google,wikipedia,brave',
          enabled_engines: 'google',
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

        // Use POST method with form data as per your curl example
        const formData = new URLSearchParams();
        Object.keys(searchParams).forEach(key => {
          formData.append(key, searchParams[key]);
        });

        const response = await fetchWithTimeout(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData
        }, TIMEOUT_MS);
        
        if (!response.ok) {
          throw new Error(`Search API error: ${response.status}`);
        }

        const data = await response.json();
        
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
        if (attempt > MAX_RETRIES) {
          return {
            success: false,
            error: error.message
          };
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Single page search with MongoDB storage
   */
  async searchAndStore(query, options = {}) {
    try {
      const searchResult = await this.search(query, options);
      
      if (!searchResult.success) {
        return searchResult;
      }

      // Store results in MongoDB
      const storageStats = await this.mongoService.saveJobResults(
        searchResult.data.results,
        query
      );

      return {
        ...searchResult,
        storageStats: {
          saved: storageStats.length,
          total: searchResult.data.results.length
        }
      };
    } catch (error) {
      console.error('Search and store error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Multi-page search without storage
   */
  async searchAllPages(query, maxPages = 3, store = false) {
    try {
      let allResults = [];
      let totalResults = 0;
      
      for (let page = 1; page <= maxPages; page++) {
        const searchResult = await this.search(query, { 
          pageno: page 
        });
        
        if (!searchResult.success) {
          console.error(`Page ${page} search failed:`, searchResult.error);
          continue;
        }

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
   * Multi-page search with MongoDB storage
   */
  async searchAllPagesAndStore(query, maxPages = 3) {
    return this.searchAllPages(query, maxPages, true);
  }

  /**
   * Transform Canine Search API results to our format
   */
  transformResults(results) {
    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((result, index) => ({
      id: result.url ? this.generateIdFromUrl(result.url) : `job_${Date.now()}_${index}`,
      title: result.title || 'Unknown Title',
      company: this.extractCompany(result.title, result.content),
      location: this.extractLocation(result.content) || 'Remote',
      content: result.content || '',
      description: result.content || '',
      link: result.url || '',
      url: result.url || '',
      date: this.extractDate(result.content) || new Date().toISOString(),
      publishedDate: this.extractDate(result.content) || new Date().toISOString(),
      postedDate: this.extractDate(result.content) || new Date().toISOString(),
      salary: this.extractSalary(result.content),
      jobType: this.extractJobType(result.content) || 'full-time',
      source: this.extractSource(result.url || result.engine || 'Unknown'),
      engine: result.engine || 'google',
      snippet: result.content || '',
      metadata: {
        publishedDate: this.extractDate(result.content) || new Date().toISOString(),
        source: result.engine || 'Unknown',
        score: result.score || 0
      }
    }));
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
    // Look for company patterns in title
    const titleCompanyMatch = title.match(/at\s+([A-Za-z\s&\.]+?)(?:\s|$|-|,)/i);
    if (titleCompanyMatch) {
      return titleCompanyMatch[1].trim();
    }

    // Look for company patterns in content
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
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2}\s+(?:days?|weeks?|months?)\s+ago)/i,
      /(today|yesterday)/i
    ];

    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        const dateStr = match[1];
        
        if (dateStr.toLowerCase() === 'today') {
          return new Date().toISOString();
        }
        if (dateStr.toLowerCase() === 'yesterday') {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return yesterday.toISOString();
        }
        
        const daysAgoMatch = dateStr.match(/(\d+)\s+days?\s+ago/i);
        if (daysAgoMatch) {
          const daysAgo = parseInt(daysAgoMatch[1]);
          const date = new Date();
          date.setDate(date.getDate() - daysAgo);
          return date.toISOString();
        }

        const weeksAgoMatch = dateStr.match(/(\d+)\s+weeks?\s+ago/i);
        if (weeksAgoMatch) {
          const weeksAgo = parseInt(weeksAgoMatch[1]);
          const date = new Date();
          date.setDate(date.getDate() - (weeksAgo * 7));
          return date.toISOString();
        }

        try {
          return new Date(dateStr).toISOString();
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