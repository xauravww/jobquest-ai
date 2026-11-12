import { NextRequest, NextResponse } from 'next/server';
import { getLatestNaukriJobs, getLatestNaukriProfile } from '@/lib/naukriService';
import { getTailoredJobs } from '@/lib/tailoredMatcher';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'jobs';

    if (action === 'tailored') {
      const data = getTailoredJobs();
      return NextResponse.json({
        success: true,
        count: data.jobs.length,
        profile: data.profile,
        jobs: data.jobs
      });
    }

    if (action === 'profile') {
      const profile = getLatestNaukriProfile();
      return NextResponse.json({
        success: true,
        profile
      });
    }

    // Default: return live recommended jobs
    const jobs = getLatestNaukriJobs();
    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error: any) {
    console.error('Error fetching Naukri agent data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch Naukri data' },
      { status: 500 }
    );
  }
}
