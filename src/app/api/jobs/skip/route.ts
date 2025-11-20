import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import Job from '@/models/Job';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, url } = await request.json();

    await connectDB();

    // Create or update job as skipped
    const job = await Job.findOneAndUpdate(
      { 
        $or: [
          { _id: jobId },
          { url: url }
        ]
      },
      {
        isSkipped: true,
        skippedBy: session.user.email,
        skippedAt: new Date()
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Job marked as skipped',
      jobId: job._id
    });

  } catch (error) {
    console.error('Skip job error:', error);
    return NextResponse.json(
      { error: 'Failed to skip job' },
      { status: 500 }
    );
  }
}