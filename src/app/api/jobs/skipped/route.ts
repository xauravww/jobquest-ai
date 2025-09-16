import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { Job } from '@/models/Job';

export async function GET(request: NextRequest) {
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

    // Get skipped jobs for this user
    const skippedJobs = await Job.find({
      isSkipped: true,
      // Note: We don't filter by userId since jobs are global, but we could add user tracking if needed
    }).sort({ skippedAt: -1 });

    return NextResponse.json({
      jobs: skippedJobs,
      count: skippedJobs.length
    });

  } catch (error) {
    console.error('Error fetching skipped jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
