import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Job from '@/models/Job';
import Application from '@/models/Application';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { jobIds } = await request.json();

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: 'Job IDs array is required' },
        { status: 400 }
      );
    }

    // Get tracked jobs for this user
    const trackedJobs = await Job.find({
      jobId: { $in: jobIds },
      userId: user._id,
      isBookmarked: true
    });

    if (trackedJobs.length === 0) {
      return NextResponse.json(
        { error: 'No tracked jobs found with the provided IDs' },
        { status: 404 }
      );
    }

    // Convert tracked jobs to applications
    const applications = [];
    const savedApplications = [];

    for (const job of trackedJobs) {
      // Check if application already exists for this job
      const existingApplication = await Application.findOne({
        userId: user._id,
        jobId: job._id
      });

      if (existingApplication) {
        // Skip if application already exists
        continue;
      }

      // Create new application from tracked job
      const application = new Application({
        userId: user._id,
        jobId: job._id,
        applicationId: `${job.jobId}_${Date.now()}`, // Unique application ID
        status: 'saved', // Default status for newly saved applications
        appliedDate: new Date(),
        lastStatusUpdate: new Date(),
        applicationMethod: 'manual',
        platform: job.source === 'findwork' ? 'other' :
                 job.source === 'jooble' ? 'other' :
                 job.source === 'usajobs' ? 'other' : 'other',
        notes: `Saved from job search on ${new Date().toLocaleDateString()}`,
        priority: 'medium',
        tags: ['tracked-job']
      });

      applications.push(application);
      savedApplications.push(application);
    }

    // Save all applications
    if (savedApplications.length > 0) {
      await Application.insertMany(savedApplications);
    }

    return NextResponse.json({
      success: true,
      savedCount: savedApplications.length,
      totalRequested: jobIds.length,
      applications: savedApplications.map(app => ({
        id: app._id,
        title: trackedJobs.find(job => job._id.equals(app.jobId))?.title,
        company: trackedJobs.find(job => job._id.equals(app.jobId))?.company,
        status: app.status
      }))
    });

  } catch (error) {
    console.error('Error saving tracked jobs to applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
