/**
 * SERP API Integration for Job Search
 * Replaces the separate follow-up-utils server
 */

interface SerpApiConfig {
  apiKey: string;
  baseUrl: string;
}

interface JobSearchParams {
  query: string;
  location?: string;
  datePosted?: 'day' | 'week' | 'month' | 'any';
  jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  limit?: number;
}

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  datePosted: string;
  jobType: string;
  experienceLevel?: string;
  applyUrl: string;
  source: string;
  skills?: string[];
}

interface SerpApiResponse {
  jobs: JobResult[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  searchParams: JobSearchParams;
}

interface SerpJobResult {
  job_id?: string;
  title?: string;
  company_name?: string;
  location?: string;
  description?: string;
  snippet?: string;
  salary?: string;
  detected_extensions?: {
    posted_at?: string;
    schedule_type?: string;
  };
  apply_options?: Array<{ link?: string }>;
  share_link?: string;
  source?: string;
  via?: string;
}

interface SerpApiRawData {
  jobs_results?: SerpJobResult[];
  search_information?: {
    total_results?: number;
  };
}

class SerpApiClient {
  private config: SerpApiConfig;

  constructor() {
    this.config = {
      apiKey: process.env.SERP_API_KEY || '',
      baseUrl: 'https://serpapi.com/search.json'
    };
  }

  /**
   * Search for jobs using SERP API
   */
  async searchJobs(params: JobSearchParams): Promise<SerpApiResponse> {
    try {
      const searchParams = new URLSearchParams({
        engine: 'google_jobs',
        q: params.query,
        api_key: this.config.apiKey,
        ...(params.location && { location: params.location }),
        ...(params.datePosted && { date_posted: params.datePosted }),
        ...(params.jobType && { job_type: params.jobType }),
        ...(params.page && { start: ((params.page - 1) * (params.limit || 10)).toString() }),
        num: (params.limit || 10).toString()
      });

      const response = await fetch(`${this.config.baseUrl}?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`SERP API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.transformSerpResponse(data, params);
    } catch (error) {
      console.error('SERP API search error:', error);
      throw new Error('Failed to search jobs');
    }
  }

  /**
   * Search jobs on specific platforms
   */
  async searchNaukriJobs(params: JobSearchParams): Promise<SerpApiResponse> {
    const naukriParams = {
      ...params,
      query: `${params.query} site:naukri.com`
    };
    return this.searchJobs(naukriParams);
  }

  async searchLinkedInJobs(params: JobSearchParams): Promise<SerpApiResponse> {
    const linkedinParams = {
      ...params,
      query: `${params.query} site:linkedin.com/jobs`
    };
    return this.searchJobs(linkedinParams);
  }

  async searchIndeedJobs(params: JobSearchParams): Promise<SerpApiResponse> {
    const indeedParams = {
      ...params,
      query: `${params.query} site:indeed.com`
    };
    return this.searchJobs(indeedParams);
  }

  /**
   * Transform SERP API response to our format
   */
  private transformSerpResponse(data: SerpApiRawData, params: JobSearchParams): SerpApiResponse {
    const jobs: JobResult[] = (data.jobs_results || []).map((job: SerpJobResult, index: number) => ({
      id: job.job_id || `job_${Date.now()}_${index}`,
      title: job.title || 'Unknown Title',
      company: job.company_name || 'Unknown Company',
      location: job.location || params.location || 'Remote',
      description: job.description || job.snippet || '',
      salary: job.salary || undefined,
      datePosted: job.detected_extensions?.posted_at || new Date().toISOString(),
      jobType: job.detected_extensions?.schedule_type || 'full-time',
      experienceLevel: this.extractExperienceLevel(job.description || ''),
      applyUrl: job.apply_options?.[0]?.link || job.share_link || '',
      source: this.extractSource(job.source || job.via || 'Unknown'),
      skills: this.extractSkills(job.description || '')
    }));

    return {
      jobs,
      totalResults: data.search_information?.total_results || jobs.length,
      currentPage: params.page || 1,
      totalPages: Math.ceil((data.search_information?.total_results || jobs.length) / (params.limit || 10)),
      searchParams: params
    };
  }

  /**
   * Extract experience level from job description
   */
  private extractExperienceLevel(description: string): string {
    const text = description.toLowerCase();
    if (text.includes('entry level') || text.includes('fresher') || text.includes('0-1 year')) {
      return 'entry';
    } else if (text.includes('senior') || text.includes('lead') || text.includes('5+ year')) {
      return 'senior';
    } else if (text.includes('mid level') || text.includes('2-4 year')) {
      return 'mid';
    } else if (text.includes('executive') || text.includes('director') || text.includes('manager')) {
      return 'executive';
    }
    return 'mid';
  }

  /**
   * Extract skills from job description
   */
  private extractSkills(description: string): string[] {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
      'Git', 'REST API', 'GraphQL', 'Redux', 'Next.js', 'Vue.js', 'Angular',
      'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'PHP'
    ];

    const foundSkills: string[] = [];
    const text = description.toLowerCase();

    commonSkills.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  /**
   * Extract source platform from job data
   */
  private extractSource(source: string): string {
    const text = source.toLowerCase();
    if (text.includes('naukri')) return 'Naukri';
    if (text.includes('linkedin')) return 'LinkedIn';
    if (text.includes('indeed')) return 'Indeed';
    if (text.includes('glassdoor')) return 'Glassdoor';
    if (text.includes('monster')) return 'Monster';
    return 'Other';
  }
}

// Export singleton instance
export const serpApi = new SerpApiClient();

// Export types
export type {
  JobSearchParams,
  JobResult,
  SerpApiResponse
};