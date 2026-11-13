import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import { runAgent } from '@/lib/naukriAgent/orchestrator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = Boolean(body?.dryRun);
    const keywords = Array.isArray(body?.keywords) ? body.keywords : undefined;
    const locations = Array.isArray(body?.locations) ? body.locations : undefined;

    const User = (await import('@/models/User')).default;
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const runId = await runAgent(String(user._id), { dryRun, keywords, locations });

    return NextResponse.json({ success: true, runId, dryRun });
  } catch (error: any) {
    console.error('[Agent] run trigger failed:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to start agent run' },
      { status: 500 }
    );
  }
}
