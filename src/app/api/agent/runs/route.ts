import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import AgentRun from '@/models/AgentRun';
import User from '@/models/User';

export async function GET(request: NextRequest) {
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

    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20', 10), 100);

    const runs = await AgentRun.find({ userId: user._id })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ runs });
  } catch (error: any) {
    console.error('[Agent] runs list failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to load runs' }, { status: 500 });
  }
}
