import { NextRequest, NextResponse } from 'next/server';
import { mongodbService } from '@/lib/mongodb-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    
    // If date range is provided, get jobs by date range
    if (dateFrom || dateTo) {
      const jobs = await mongodbService.getJobsByDateRange(
        dateFrom || '', 
        dateTo || '', 
        { status }
      );
      return NextResponse.json(jobs);
    }

    // Otherwise get applications
    const applications = await mongodbService.getApplicationStats();
    return NextResponse.json(applications);
    
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
    const { jobs } = await request.json();
    
    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: 'Jobs array is required' },
        { status: 400 }
      );
    }

    // Transform jobs to applications format
    const applications = jobs.map(job => ({
      jobId: job.id,
      status: job.status || 'interested',
      applicationMethod: 'ai-filtered',
      platform: 'jobquest-ai',
      notes: job.aiReason || '',
      priority: job.aiScore >= 80 ? 'high' : job.aiScore >= 60 ? 'medium' : 'low',
      aiScore: job.aiScore,
      aiReason: job.aiReason
    }));

    const savedApplications = await mongodbService.saveApplications(applications);

    return NextResponse.json({
      success: true,
      savedCount: savedApplications.length,
      applications: savedApplications
    });

  } catch (error) {
    console.error('Error creating applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}