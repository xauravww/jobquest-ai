import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import Job from '@/models/Job';
import connectDB from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { jobId, action, jobData } = await request.json();
    
    if (!jobId || !action) {
      return NextResponse.json({ error: 'Job ID and action are required' }, { status: 400 });
    }

    // Find existing job or create new one
    let job = await Job.findOne({ jobId, userId: session.user.id });
    
    if (!job && jobData) {
      // Create new job record
      job = new Job({
        jobId,
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        description: jobData.description || '',
        salary: jobData.salary,
        source: jobData.source,
        url: jobData.url,
        datePosted: jobData.publishedDate ? new Date(jobData.publishedDate) : new Date(),
        userId: session.user.id
      });
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found and insufficient data to create' }, { status: 404 });
    }

    // Update job based on action
    switch (action) {
      case 'track':
        job.isBookmarked = true;
        job.isSkipped = false;
        job.status = 'saved';
        break;
      case 'skip':
        job.isSkipped = true;
        job.isBookmarked = false;
        job.skippedBy = session.user.email;
        job.skippedAt = new Date();
        break;
      case 'untrack':
        job.isBookmarked = false;
        job.status = 'saved';
        break;
      case 'unskip':
        job.isSkipped = false;
        job.skippedBy = undefined;
        job.skippedAt = undefined;
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    job.lastUpdated = new Date();
    await job.save();

    return NextResponse.json({
      success: true,
      job: {
        id: job.jobId,
        isBookmarked: job.isBookmarked,
        isSkipped: job.isSkipped,
        status: job.status
      }
    });

  } catch (error) {
    console.error('Job tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track job action' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const jobIds = searchParams.get('jobIds')?.split(',') || [];
    
    if (jobIds.length === 0) {
      return NextResponse.json({ trackedJobs: {} });
    }

    const jobs = await Job.find({ 
      jobId: { $in: jobIds }, 
      userId: session.user.id 
    }).select('jobId isBookmarked isSkipped status');

    const trackedJobs = jobs.reduce((acc, job) => {
      acc[job.jobId] = {
        isBookmarked: job.isBookmarked,
        isSkipped: job.isSkipped,
        status: job.status
      };
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({ trackedJobs });

  } catch (error) {
    console.error('Get tracked jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to get tracked jobs' },
      { status: 500 })
    }

  }