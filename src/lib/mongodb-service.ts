import { connectDB } from './db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';

export class MongoDBService {
  
  async saveJobResults(jobs: any[], query: string, filters: any = {}) {
    try {
      await connectDB();
      
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
              description: jobData.description || jobData.snippet,
              salary: jobData.salary,
              jobType: jobData.jobType || 'full-time',
              experienceLevel: jobData.experienceLevel || 'mid',
              skills: jobData.skills || [],
              source: jobData.source || 'api-search',
              url: jobData.link || jobData.url,
              datePosted: jobData.date ? new Date(jobData.date) : new Date(),
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

  async getJobsByDateRange(dateFrom: string, dateTo: string, filters: any = {}) {
    try {
      await connectDB();
      
      const query: any = {
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

  async saveApplications(applications: any[]) {
    try {
      await connectDB();
      
      const savedApplications = [];
      
      for (const appData of applications) {
        try {
          // Find the corresponding job
          const job = await Job.findById(appData.jobId);
          if (!job) {
            console.warn('Job not found for application:', appData.jobId);
            continue;
          }

          const application = new Application({
            jobId: job._id,
            applicationId: `app-${Date.now()}-${Math.random()}`,
            status: appData.status || 'interested',
            appliedDate: new Date(),
            lastStatusUpdate: new Date(),
            applicationMethod: appData.applicationMethod || 'online',
            platform: appData.platform || 'direct',
            notes: appData.notes || '',
            priority: appData.priority || 'medium',
            communications: [],
            interviews: [],
            // AI data
            aiScore: appData.aiScore,
            aiReasons: appData.aiReason ? [appData.aiReason] : []
          });

          await application.save();
          savedApplications.push(application);
          
        } catch (appError) {
          console.error('Error saving individual application:', appError);
        }
      }

      console.log(`Saved ${savedApplications.length} applications to database`);
      return savedApplications;
      
    } catch (error) {
      console.error('Error saving applications:', error);
      throw error;
    }
  }

  async skipJobs(jobIds: string[]) {
    try {
      await connectDB();
      
      const result = await Job.updateMany(
        { _id: { $in: jobIds } },
        { 
          $set: { 
            isSkipped: true,
            skippedAt: new Date()
          }
        }
      );

      console.log(`Skipped ${result.modifiedCount} jobs`);
      return result;
      
    } catch (error) {
      console.error('Error skipping jobs:', error);
      throw error;
    }
  }

  async getApplicationStats() {
    try {
      await connectDB();
      
      const totalApplications = await Application.countDocuments();
      const activeApplications = await Application.countDocuments({ 
        status: { $in: ['applied', 'interviewing', 'offered'] }
      });
      const interviews = await Application.countDocuments({ 
        status: 'interviewing'
      });
      const offers = await Application.countDocuments({ 
        status: 'offered'
      });

      const responseRate = totalApplications > 0 
        ? Math.round((activeApplications / totalApplications) * 100)
        : 0;

      return {
        totalApplications,
        activeApplications,
        interviews,
        offers,
        responseRate
      };
      
    } catch (error) {
      console.error('Error getting application stats:', error);
      return {
        totalApplications: 0,
        activeApplications: 0,
        interviews: 0,
        offers: 0,
        responseRate: 0
      };
    }
  }
}

export const mongodbService = new MongoDBService();