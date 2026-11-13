import { NextRequest, NextResponse } from 'next/server';
import { getLatestNaukriJobs, getLatestNaukriProfile } from '@/lib/naukriService';
import { getTailoredJobs } from '@/lib/tailoredMatcher';
import connectDB from '@/lib/db';
import JobCache from '@/models/JobCache';

function toJobShape(j: any) {
  return {
    id: `naukri-${j.jobId}`,
    jobId: j.jobId,
    title: j.title,
    company: j.company,
    location: j.location,
    experience: j.experience,
    salary: j.salary,
    skills: j.skills,
    url: j.url,
    postedAgo: j.postedAgo,
    description: j.description,
    source: 'naukri',
    applicationType: j.applicationType || 'unknown',
    externalApplyUrl: j.externalApplyUrl,
    matchScore: j.matchScore ?? 0,
    reasons: j.reasons || [],
    matchingSkills: j.matchingSkills || [],
    missingSkills: j.missingSkills || [],
    status: j.status,
    platformApplied: j.platformApplied,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'jobs';

    if (action === 'tailored') {
      // Prefer harvested jobs from JobCache (agent-scored), fall back to logs.
      try {
        await connectDB();
        const cached = await JobCache.find({ status: { $ne: 'skipped' } })
          .sort({ matchScore: -1 })
          .limit(250)
          .lean();
        if (cached.length > 0) {
          return NextResponse.json({
            success: true,
            count: cached.length,
            source: 'jobcache',
            profile: null,
            jobs: cached.map(toJobShape),
          });
        }
      } catch (e) {
        console.error('JobCache tailored read failed, falling back to logs:', e);
      }

      const data = getTailoredJobs();
      return NextResponse.json({
        success: true,
        count: data.jobs.length,
        source: 'logs',
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
