import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import AgentRun from '@/models/AgentRun';
import JobCache from '@/models/JobCache';
import User from '@/models/User';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const run = await AgentRun.findOne({ _id: id, userId: user._id }).lean();
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Attach questionnaire audit + full apply info for each applied job
    const jobIds = (run.applications || []).map((a: any) => a.jobId);
    const caches = await JobCache.find({ jobId: { $in: jobIds } }).lean();
    const cacheByJobId = new Map(caches.map((c) => [c.jobId, c]));

    const applications = (run.applications || []).map((a: any) => ({
      ...a,
      questionnaire: cacheByJobId.get(a.jobId)?.questionnaire || [],
      url: cacheByJobId.get(a.jobId)?.url,
    }));

    // Jobs this run harvested (stored as new), for the per-run view.
    const harvested = await JobCache.find({ harvestRuns: run._id })
      .sort({ matchScore: -1 })
      .limit(200)
      .select('jobId title company location matchScore url status reasons')
      .lean();

    return NextResponse.json({ run: { ...run, applications, harvested } });
  } catch (error: any) {
    console.error('[Agent] run detail failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to load run' }, { status: 500 });
  }
}
