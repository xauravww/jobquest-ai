import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Job } from '@/models/Job';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Find the job and toggle bookmark status
    const job = await Job.findById(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    job.isBookmarked = !job.isBookmarked;
    await job.save();

    return NextResponse.json({
      success: true,
      isBookmarked: job.isBookmarked
    });

  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}