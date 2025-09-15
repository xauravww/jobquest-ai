import connectDB from './db';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import mongoose from 'mongoose';


export class MongoDBService {

  // Helper method to normalize status values to valid enum values
  private normalizeStatus(status: unknown): string {
    const validStatuses = [
      'draft',
      'submitted',
      'under_review',
      'phone_screening',
      'technical_interview',
      'final_interview',
      'offer_received',
      'accepted',
      'rejected',
      'withdrawn'
    ];

    // Map common invalid statuses to valid ones
    const statusMapping: { [key: string]: string } = {
      'interested': 'submitted',
      'applied': 'submitted',
      'pending': 'submitted',
      'in_progress': 'under_review',
      'review': 'under_review',
      'interview': 'technical_interview',
      'offered': 'offer_received',
      'hired': 'accepted',
      'declined': 'rejected',
      'cancelled': 'withdrawn'
    };

    const normalized = (status as string)?.toLowerCase().replace(/\s+/g, '_');
    if (statusMapping[normalized]) {
      return statusMapping[normalized];
    }

    // If status is already valid, return it
    if (validStatuses.includes(status as string)) {
      return status as string;
    }

    // Default to 'submitted' for unknown statuses
    return 'submitted';
  }

  async saveJobResults(jobs: Record<string, unknown>[]) {
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
              jobId: (jobData.id as string) || `job-${Date.now()}-${Math.random()}`,
              title: jobData.title as string,
              company: jobData.company as string,
              location: jobData.location as string,
              description: (jobData.description as string) || (jobData.snippet as string),
              salary: jobData.salary,
              jobType: (jobData.jobType as string) || 'full-time',
              experienceLevel: (jobData.experienceLevel as string) || 'mid',
              skills: jobData.skills || [],
              source: (jobData.source as string) || 'api-search',
              url: (jobData.link as string) || (jobData.url as string),
              datePosted: jobData.date ? new Date(jobData.date as string | number | Date) : new Date(),
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

  async getJobsByDateRange(dateFrom: string, dateTo: string, filters: Record<string, unknown> = {}) {
    try {
      await connectDB();

      const query: Record<string, unknown> = {
        isActive: true,
        isSkipped: false
      };

      // Date filtering
      if (dateFrom || dateTo) {
        const dateQuery: { $gte?: Date; $lte?: Date } = {};
        if (dateFrom) {
          dateQuery.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          dateQuery.$lte = new Date(dateTo);
        }
        query.datePosted = dateQuery;
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

  async saveApplications(applications: Record<string, unknown>[]) {
    try {
      await connectDB();
      
      const savedApplications = [];
      
      for (const appData of applications) {
        try {
          // Find the corresponding job
          const job = await Job.findById(appData.jobId as string);
          if (!job) {
            console.warn('Job not found for application:', appData.jobId);
            continue;
          }

          const application = new Application({
            jobId: job._id,
            applicationId: `app-${Date.now()}-${Math.random()}`,
            status: this.normalizeStatus(appData.status as string) || 'submitted',
            appliedDate: new Date(),
            lastStatusUpdate: new Date(),
            applicationMethod: (appData.applicationMethod as string) || 'online',
            platform: (appData.platform as string) || 'direct',
            notes: (appData.notes as string) || '',
            priority: (appData.priority as string) || 'medium',
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

  async saveApplicationsFromAI(applications: Record<string, unknown>[]) {
    try {
      await connectDB();
      
      const savedApplications = [];
      
      for (const appData of applications) {
        try {
          // First, create or find the job
          let job = null;
          
          if (appData.jobUrl) {
            // Try to find existing job by URL
            job = await Job.findOne({ url: appData.jobUrl });
          }
          
          if (!job) {
            // Create a new job entry
            job = new Job({
              jobId: `job-${Date.now()}-${Math.random()}`,
              title: appData.jobTitle,
              company: appData.company,
              location: appData.location,
              description: appData.description || '',
              url: appData.jobUrl || '',
              datePosted: new Date(),
              isActive: true,
              isBookmarked: false,
              isSkipped: false,
              source: 'ai-filtered'
            });
            
            await job.save();
          }

          // Create the application
          const application = new Application({
            userId: appData.userId,
            jobId: job._id,
            applicationId: `app-${Date.now()}-${Math.random()}`,
            status: this.normalizeStatus(appData.status) || 'submitted',
            appliedDate: new Date(),
            lastStatusUpdate: new Date(),
            applicationMethod: appData.applicationMethod || 'manual',
            platform: appData.platform || 'other',
            notes: appData.notes || '',
            priority: appData.priority || 'medium',
            communications: [],
            interviews: []
          });

          await application.save();
          
          // Populate the jobId for the response
          await application.populate('jobId');
          savedApplications.push(application);
          
        } catch (appError) {
          console.error('Error saving individual application:', appError);
        }
      }

      console.log(`Saved ${savedApplications.length} applications from AI filtering to database`);
      return savedApplications;
      
    } catch (error) {
      console.error('Error saving applications from AI:', error);
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

  async getApplications(userId?: string) {
    try {
      await connectDB();
      
      const query = userId ? { userId } : {};
      const applications = await Application.find(query)
        .populate('jobId')
        .sort({ appliedDate: -1 });

      return applications;
      
    } catch (error) {
      console.error('Error getting applications:', error);
      return [];
    }
  }

  async getApplicationsWithFilters(userId: string, filters: Record<string, unknown> = {}) {
    try {
      await connectDB();

      const query: Record<string, unknown> = { userId };

      // Status filter
      if (filters.status) {
        query.status = this.normalizeStatus(filters.status);
      }

      // Priority filter
      if (filters.priority) {
        query.priority = filters.priority;
      }

      // Platform filter
      if (filters.platform) {
        query.platform = filters.platform;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const dateQuery: { $gte?: Date; $lte?: Date } = {};
        if (filters.dateFrom) {
          dateQuery.$gte = new Date(filters.dateFrom as string);
        }
        if (filters.dateTo) {
          dateQuery.$lte = new Date(filters.dateTo as string);
        }
        query.appliedDate = dateQuery;
      }

      // Pagination params
      const page = parseInt(String(filters.page), 10) || 1;
      const limit = parseInt(String(filters.limit), 10) || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalCount = await Application.countDocuments(query);

      // Fetch paginated results
      let applications = await Application.find(query)
        .populate('jobId')
        .sort({ appliedDate: -1 })
        .skip(skip)
        .limit(limit);

      // Text search filter (applied after population)
      if (filters.search) {
        const searchTerm = String(filters.search).toLowerCase();
        applications = applications.filter(app => {
          const job = app.jobId as Record<string, unknown>;
          return (
            (job?.title as string)?.toLowerCase().includes(searchTerm) ||
            (job?.company as string)?.toLowerCase().includes(searchTerm) ||
            (job?.location as string)?.toLowerCase().includes(searchTerm) ||
            (job?.description as string)?.toLowerCase().includes(searchTerm) ||
            app.notes?.toLowerCase().includes(searchTerm)
          );
        });
      }

      return { applications, totalCount };

    } catch (error) {
      console.error('Error getting applications with filters:', error);
      return { applications: [], totalCount: 0 };
    }
  }

  async getApplicationById(applicationId: string, userId?: string) {
    try {
      await connectDB();

      const query: Record<string, unknown> = { _id: applicationId };
      if (userId) {
        query.userId = userId;
      }

      const application = await Application.findOne(query).populate('jobId');
      return application;

    } catch (error) {
      console.error('Error getting application by ID:', error);
      return null;
    }
  }

  async updateApplication(applicationId: string, userId: string, updateData: Record<string, unknown>) {
    try {
      await connectDB();
      
      // Normalize status if provided
      if (updateData.status) {
        updateData.status = this.normalizeStatus(updateData.status);
        updateData.lastStatusUpdate = new Date();
      }
      
      const application = await Application.findOneAndUpdate(
        { _id: applicationId, userId },
        { $set: updateData },
        { new: true }
      ).populate('jobId');
      
      return application;
      
    } catch (error) {
      console.error('Error updating application:', error);
      return null;
    }
  }

  async deleteApplication(applicationId: string, userId: string) {
    try {
      await connectDB();
      
      const result = await Application.findOneAndDelete({
        _id: applicationId,
        userId
      });
      
      return result !== null;
      
    } catch (error) {
      console.error('Error deleting application:', error);
      return false;
    }
  }

  async getApplicationStats(userId: string) {
    try {
        await connectDB();

        const matchQuery = { userId: new mongoose.Types.ObjectId(userId) };

        const totalApplications = await Application.countDocuments(matchQuery);

        const activeStatuses = ['submitted', 'under_review', 'phone_screening', 'technical_interview', 'final_interview'];
        const activeApplications = await Application.countDocuments({ ...matchQuery, status: { $in: activeStatuses } });

        const interviewStatuses = ['phone_screening', 'technical_interview', 'final_interview'];
        const interviews = await Application.countDocuments({ ...matchQuery, status: { $in: interviewStatuses } });

        const offerStatuses = ['offer_received', 'accepted'];
        const offers = await Application.countDocuments({ ...matchQuery, status: { $in: offerStatuses } });

        const respondedStatuses = activeStatuses.filter(s => s !== 'submitted');
        const respondedCount = await Application.countDocuments({ ...matchQuery, status: { $in: respondedStatuses } });

        const responseRate = totalApplications > 0
            ? Math.round((respondedCount / totalApplications) * 100)
            : 0;
        
        const statusCountsData = await Application.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$status', value: { $sum: 1 } } },
            { $project: { name: '$_id', value: 1, _id: 0 } }
        ]);

        const statusColors: { [key: string]: string } = {
            submitted: '#3b82f6',
            under_review: '#f59e0b',
            phone_screening: '#8b5cf6',
            technical_interview: '#d946ef',
            final_interview: '#ec4899',
            offer_received: '#10b981',
            accepted: '#22c55e',
            rejected: '#ef4444',
            withdrawn: '#737373',
            draft: '#a3a3a3'
        };

        const statusCounts = statusCountsData.map(item => ({
            ...item,
            color: statusColors[item.name] || '#6b7280'
        }));

        return {
            stats: {
                totalApplications,
                activeApplications,
                interviews,
                offers,
                responseRate
            },
            statusCounts
        };

    } catch (error) {
        console.error('Error getting application stats:', error);
        return {
            stats: {
                totalApplications: 0,
                activeApplications: 0,
                interviews: 0,
                offers: 0,
                responseRate: 0
            },
            statusCounts: []
        };
    }
  }
  
  async getApplicationTrend(userId: string, startDate: Date, endDate: Date) {
        try {
            await connectDB();
            
            const results = await Application.aggregate([
                {
                    $match: {
                        userId: new mongoose.Types.ObjectId(userId),
                        appliedDate: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedDate" } },
                        applications: { $sum: 1 },
                        interviews: {
                            $sum: {
                                $cond: [{ $in: ['$status', ['phone_screening', 'technical_interview', 'final_interview']] }, 1, 0]
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } },
                { $project: { date: '$_id', applications: 1, interviews: 1, _id: 0 } }
            ]);

            return results;
        } catch (error) {
            console.error('Error fetching application trend data:', error);
            return [];
        }
    }

}

export const mongodbService = new MongoDBService();
