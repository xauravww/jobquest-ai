import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mongodbService } from '@/lib/mongodb-service';
import connectDB from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to DB before querying
    await connectDB();

    // Find user first to get userId - use lean() for better performance
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email }).lean();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const platform = searchParams.get('platform');
    const search = searchParams.get('search');
    const page = searchParams.get('page') || '1';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap limit at 50
    
    // If date range is provided, get jobs by date range
    if (dateFrom || dateTo) {
      const jobs = await mongodbService.getJobsByDateRange(
        dateFrom || '', 
        dateTo || '', 
        { status, priority, platform, search }
      );
      return NextResponse.json(jobs);
    }

    // Get applications for this user with optional filtering and pagination
    const { applications, totalCount } = await mongodbService.getApplicationsWithFilters(user._id, {
      status,
      priority,
      platform,
      search,
      dateFrom,
      dateTo,
      page: page.toString(),
      limit: limit.toString()
    });
    
    // Add cache headers for better performance
    const response = NextResponse.json({ applications, totalCount });
    response.headers.set('Cache-Control', 'private, max-age=60'); // Cache for 1 minute
    
    return response;
    
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to DB before querying
    await connectDB();

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('POST /api/applications - Received body:', JSON.stringify(body, null, 2));
    
    const { jobs } = body;
    
    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: 'Jobs array is required' },
        { status: 400 }
      );
    }

    // Validate and normalize platform values
    const validPlatforms = ['naukri', 'linkedin', 'indeed', 'company_website', 'other'];
    const platformMap: Record<string, string> = {
      'linkedin': 'linkedin',
      'indeed': 'indeed', 
      'glassdoor': 'other',
      'company-website': 'company_website',
      'company_website': 'company_website',
      'referral': 'other',
      'other': 'other',
      'naukri': 'naukri'
    };

    // Validate and normalize status values
    const validStatuses = ['draft', 'applied', 'submitted', 'saved', 'under_review', 'phone_screening', 'technical_interview', 'final_interview', 'offer_received', 'accepted', 'rejected', 'withdrawn', 'expired'];
    const statusMap: Record<string, string> = {
      'applied': 'applied',
      'submitted': 'submitted', 
      'saved': 'saved',
      'draft': 'draft'
    };

    // Handle different data structures - from AI filtering vs direct application creation
    const applications = jobs.map((job, index) => {
      console.log(`Processing job ${index}:`, job);
      
      // If it's from AI filtering (has jobTitle, company, etc.)
      if (job.jobTitle && job.company) {
        const normalizedPlatform = platformMap[job.platform] || 'other';
        const normalizedStatus = statusMap[job.status] || 'draft';
        
        console.log(`Job ${index} - Platform: ${job.platform} -> ${normalizedPlatform}, Status: ${job.status} -> ${normalizedStatus}`);
        
        return {
          userId: user._id,
          jobTitle: job.jobTitle,
          company: job.company,
          location: job.location || 'Unknown Location',
          jobUrl: job.jobUrl || '',
          description: job.description || 'No description provided',
          status: normalizedStatus,
          applicationMethod: job.applicationMethod || 'manual',
          platform: normalizedPlatform,
          notes: job.notes || `Added on ${new Date().toLocaleDateString()}`,
          priority: job.priority || 'medium',
          resumeUsed: job.resumeUsed || null,
          datePosted: job.datePosted ? new Date(job.datePosted) : new Date()
        };
      } else {
        // Legacy format - transform to new format
        return {
          userId: user._id,
          jobId: job.id,
          status: statusMap[job.status] || 'draft',
          applicationMethod: 'manual',
          platform: 'other',
          notes: job.aiReason || '',
          priority: job.aiScore >= 80 ? 'high' : job.aiScore >= 60 ? 'medium' : 'low',
          aiScore: job.aiScore,
          aiReason: job.aiReason
        };
      }
    });

    console.log('Processed applications:', JSON.stringify(applications, null, 2));

    const savedApplications = await mongodbService.saveApplicationsFromAI(applications);

    console.log('Saved applications count:', savedApplications.length);

    return NextResponse.json({
      success: true,
      savedCount: savedApplications.length,
      applications: savedApplications
    });

  } catch (error) {
    console.error('Error creating applications:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to DB before querying
    await connectDB();

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const Application = (await import('@/models/Application')).default;
    const application = await Application.findOne({ _id: id, userId: user._id });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    console.log('Updating application with data:', updateData);

    // Handle job-related updates
    if (updateData.title || updateData.company || updateData.location || updateData.description) {
      // Find the associated job and update it
      const Job = (await import('@/models/Job')).default;
      const job = await Job.findById(application.jobId);

      if (job) {
        if (updateData.title) job.title = updateData.title;
        if (updateData.company) job.company = updateData.company;
        if (updateData.location) job.location = updateData.location;
        if (updateData.description) job.description = updateData.description;
        await job.save();
      }

      // Remove job fields from application update
      delete updateData.title;
      delete updateData.company;
      delete updateData.location;
      delete updateData.description;
    }

    // Map frontend fields to Application model fields
    if (updateData.datePosted) {
      updateData.appliedDate = new Date(updateData.datePosted);
      delete updateData.datePosted;
    }
    if (updateData.applicationId === undefined && updateData.jobId) {
      updateData.applicationId = updateData.jobId.toString();
    }
    if (updateData.platform) {
      // Map platform values to model enum
      const platformMap: Record<string, string> = {
        linkedin: 'linkedin',
        indeed: 'indeed',
        glassdoor: 'other',
        'company-website': 'company_website',
        referral: 'other',
        other: 'other'
      };
      updateData.platform = platformMap[updateData.platform] || 'other';
    }
      if (updateData.status) {
        // Map frontend status to backend status enum if needed
        const statusMap: Record<string, string> = {
          saved: 'draft',
          applied: 'applied',
          submitted: 'submitted',
          interviewing: 'phone_screening',
          offered: 'offer_received',
          rejected: 'rejected',
          // Add more mappings as needed
        };
        updateData.status = statusMap[updateData.status] || updateData.status;
      }
    // Notes and priority exist in model, keep as is

    // Update fields
    Object.keys(updateData).forEach(key => {
      application[key] = updateData[key];
    });

    await application.save();

    console.log('Application updated:', application);

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
