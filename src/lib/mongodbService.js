/**
 * MongoDB Service - Handles database operations for job storage and retrieval
 * Integrates with the existing MongoDB models and connection
 */

const mongoose = require('mongoose');

class MongoDBService {
  constructor() {
    this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobquest-ai';
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(this.connectionString);
        console.log('Connected to MongoDB');
      }
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Health check for MongoDB connection
   */
  async healthCheck() {
    try {
      await this.connect();
      
      // Test the connection with a simple operation
      const adminDb = mongoose.connection.db.admin();
      await adminDb.ping();
      
      return {
        status: 'healthy',
        message: 'MongoDB connection is active',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Save job results to MongoDB
   */
  async saveJobResults(jobs, query, filters = {}) {
    try {
      await this.connect();
      
      // Import Job model dynamically to avoid circular dependencies
      const Job = require('../models/Job').Job || require('../models/Job').default;
      
      const savedJobs = [];
      
      for (const jobData of jobs) {
        try {
          // Check if job already exists
          const existingJob = await Job.findOne({
            $or: [
              { url: jobData.link || jobData.url },
              { 
                title: jobData.title,
                company: jobData.company,
                location: jobData.location
              }
            ]
          });

          if (!existingJob) {
            const job = new Job({
              jobId: jobData.id || `job-${Date.now()}-${Math.random()}`,
              title: jobData.title,
              company: jobData.company,
              location: jobData.location,
              description: jobData.description || jobData.content || jobData.snippet,
              salary: jobData.salary,
              jobType: jobData.jobType || 'full-time',
              experienceLevel: jobData.experienceLevel || 'mid',
              skills: jobData.skills || [],
              source: jobData.source || 'api-search',
              url: jobData.link || jobData.url,
              datePosted: this.parsePublishedDate(jobData),
              isActive: true,
              isBookmarked: false,
              isSkipped: false,
              // AI fields
              aiScore: jobData.aiScore,
              aiReasons: jobData.aiReason ? [jobData.aiReason] : [],
              matchingSkills: jobData.matchingSkills || []
            });

            await job.save();
            savedJobs.push(job);
          } else {
            // Update existing job with new AI data if available
            if (jobData.aiScore) {
              existingJob.aiScore = jobData.aiScore;
              existingJob.aiReasons = jobData.aiReason ? [jobData.aiReason] : existingJob.aiReasons;
              await existingJob.save();
            }
            savedJobs.push(existingJob);
          }
        } catch (jobError) {
          console.error('Error saving individual job:', jobError);
        }
      }

      console.log(`Saved ${savedJobs.length} jobs to database`);
      return savedJobs;
      
    } catch (error) {
      console.error('Error saving job results:', error);
      throw error;
    }
  }

  /**
   * Parse published date from job data
   */
  parsePublishedDate(jobData) {
    // Try different date fields
    if (jobData.publishedDate) {
      return new Date(jobData.publishedDate);
    }
    if (jobData.postedDate) {
      return new Date(jobData.postedDate);
    }
    if (jobData.date) {
      return new Date(jobData.date);
    }
    if (jobData.metadata && jobData.metadata.publishedDate) {
      return new Date(jobData.metadata.publishedDate);
    }

    // Try to parse from content
    const content = (jobData.title + ' ' + jobData.content + ' ' + jobData.description).toLowerCase();
    
    // Look for relative dates
    if (content.includes('today')) {
      return new Date();
    }
    if (content.includes('yesterday')) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }
    
    // Look for "X days ago" pattern
    const daysAgoMatch = content.match(/(\d+)\s+days?\s+ago/);
    if (daysAgoMatch) {
      const daysAgo = parseInt(daysAgoMatch[1]);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      return date;
    }

    // Look for "X weeks ago" pattern
    const weeksAgoMatch = content.match(/(\d+)\s+weeks?\s+ago/);
    if (weeksAgoMatch) {
      const weeksAgo = parseInt(weeksAgoMatch[1]);
      const date = new Date();
      date.setDate(date.getDate() - (weeksAgo * 7));
      return date;
    }

    // Default to current date
    return new Date();
  }

  /**
   * Get jobs by date range
   */
  async getJobsByDateRange(dateFrom, dateTo, filters = {}) {
    try {
      await this.connect();
      
      const Job = require('../models/Job').Job || require('../models/Job').default;
      
      const query = {
        isActive: true,
        isSkipped: false
      };

      // Date filtering
      if (dateFrom || dateTo) {
        query.datePosted = {};
        if (dateFrom) {
          query.datePosted.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.datePosted.$lte = new Date(dateTo);
        }
      }

      // Additional filters
      if (filters.location) {
        query.location = { $regex: filters.location, $options: 'i' };
      }
      
      if (filters.jobType && filters.jobType !== 'all') {
        query.jobType = filters.jobType;
      }

      if (filters.company) {
        query.company = { $regex: filters.company, $options: 'i' };
      }

      const jobs = await Job.find(query)
        .sort({ datePosted: -1 })
        .limit(100);

      return jobs;
      
    } catch (error) {
      console.error('Error fetching jobs by date range:', error);
      throw error;
    }
  }

  /**
   * Save filtered jobs (for the save-filtered endpoint)
   */
  async saveFilteredJobs(jobs, filters = {}) {
    try {
      await this.connect();
      
      const Application = require('../models/Application').Application || require('../models/Application').default;
      
      const savedApplications = [];
      
      for (const jobData of jobs) {
        try {
          // Find the corresponding job in the database
          const Job = require('../models/Job').Job || require('../models/Job').default;
          let job = await Job.findOne({
            $or: [
              { url: jobData.link || jobData.url },
              { 
                title: jobData.title,
                company: jobData.company,
                location: jobData.location
              }
            ]
          });

          // If job doesn't exist, create it first
          if (!job) {
            job = new Job({
              jobId: jobData.id || `job-${Date.now()}-${Math.random()}`,
              title: jobData.title,
              company: jobData.company,
              location: jobData.location,
              description: jobData.description || jobData.content,
              salary: jobData.salary,
              jobType: jobData.jobType || 'full-time',
              source: jobData.source || 'ai-filtered',
              url: jobData.link || jobData.url,
              datePosted: this.parsePublishedDate(jobData),
              isActive: true,
              aiScore: jobData.aiScore,
              aiReasons: jobData.aiReason ? [jobData.aiReason] : []
            });
            await job.save();
          }

          // Create application record
          const application = new Application({
            jobId: job._id,
            applicationId: `app-${Date.now()}-${Math.random()}`,
            status: 'interested',
            appliedDate: new Date(),
            lastStatusUpdate: new Date(),
            applicationMethod: 'ai-filtered',
            platform: jobData.source || 'direct',
            notes: `AI filtered job - Score: ${jobData.aiScore || 'N/A'}`,
            priority: jobData.aiScore > 80 ? 'high' : jobData.aiScore > 60 ? 'medium' : 'low',
            aiScore: jobData.aiScore,
            aiReasons: jobData.aiReason ? [jobData.aiReason] : []
          });

          await application.save();
          savedApplications.push(application);
          
        } catch (appError) {
          console.error('Error saving filtered job application:', appError);
        }
      }

      console.log(`Saved ${savedApplications.length} filtered job applications`);
      return savedApplications;
      
    } catch (error) {
      console.error('Error saving filtered jobs:', error);
      throw error;
    }
  }
}

module.exports = MongoDBService;