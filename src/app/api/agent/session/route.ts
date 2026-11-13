import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import NaukriSession from '@/models/NaukriSession';
import User from '@/models/User';

export async function GET() {
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

    const stored = await NaukriSession.findOne({ userId: user._id });
    return NextResponse.json({
      hasSession: Boolean(stored?.authorization),
      capturedAt: stored?.capturedAt,
      expiresAt: stored?.expiresAt,
      lastUsedAt: stored?.lastUsedAt,
      // never return the actual cookie/token values to the client UI
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load session' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { cookies, authorization } = body || {};

    if (typeof authorization !== 'string' || !authorization || typeof cookies !== 'string' || !cookies) {
      return NextResponse.json({ error: 'Cookies and authorization token are required' }, { status: 400 });
    }

    await NaukriSession.findOneAndUpdate(
      { userId: user._id },
      {
        authorization,
        cookies,
        capturedAt: new Date(),
        expiresAt: undefined,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Agent] session store failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to store session' }, { status: 500 });
  }
}
