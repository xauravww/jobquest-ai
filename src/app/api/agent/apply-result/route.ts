import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import JobCache from '@/models/JobCache';
import Job from '@/models/Job';
import Application from '@/models/Application';
import User from '@/models/User';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { jobId, outcome, questionnaire } = body || {};

    if (!jobId || outcome !== 'applied') {
      return NextResponse.json({ error: 'jobId and outcome=applied are required' }, { status: 400 });
    }

    // 1. Update JobCache to applied
    await JobCache.updateOne(
      { jobId },
      {
        $set: {
          status: 'applied',
          platformApplied: true,
          lastPlatformCheckAt: new Date(),
          'apply.success': true,
          'apply.lastAttemptAt': new Date(),
        },
        ...(Array.isArray(questionnaire) && questionnaire.length
          ? { $push: { questionnaire: { $each: questionnaire } } }
          : {}),
      }
    );

    // 2. Ensure a Job doc exists (for the tracking table reference)
    const cached = await JobCache.findOne({ jobId }).lean();
    const fallbackDesc = cached?.description
      ? String(cached.description)
      : (Array.isArray(cached?.skills) && cached.skills.length
          ? `Key Skills: ${cached.skills.join(', ')}`
          : '');
    let jobDoc = await Job.findOne({ jobId, userId: user._id });
    if (!jobDoc && cached) {
      jobDoc = await Job.create({
        userId: user._id,
        jobId,
        title: cached.title,
        company: cached.company,
        location: cached.location,
        description: fallbackDesc,
        salary: cached.salary,
        skills: cached.skills || [],
        source: 'naukri',
        url: cached.url,
        status: 'applied',
      });
    } else if (jobDoc) {
      await Job.updateOne({ _id: jobDoc._id }, { $set: { status: 'applied', description: fallbackDesc || jobDoc.description } });
    }

    // 3. Create / update Application record (idempotent per job)
    if (jobDoc) {
      const applicationId = `naukri_agent_${jobId}`;
      await Application.findOneAndUpdate(
        { applicationId },
        {
          userId: user._id,
          jobId: jobDoc._id,
          applicationId,
          status: 'applied',
          appliedDate: new Date(),
          applicationMethod: 'auto_apply',
          platform: 'naukri',
          resumeUsed: null,
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('apply-result error:', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
