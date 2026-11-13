import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import AgentConfigModel, { getOrCreateAgentConfig } from '@/models/AgentConfig';
import NaukriCredential from '@/models/NaukriCredential';
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

    const config = await getOrCreateAgentConfig(String(user._id));
    const cred = await NaukriCredential.findOne({ userId: user._id });

    return NextResponse.json({
      config,
      credentials: {
        naukriEmail: cred?.naukriEmail || '',
        hasPassword: Boolean(cred?.naukriPassword),
        lastLoginAt: cred?.lastLoginAt,
        lastLoginOk: cred?.lastLoginOk,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load config' }, { status: 500 });
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

    // Agent config update
    if (body?.config) {
      const allowed = [
        'autoApplyEnabled',
        'applyThreshold',
        'dailyApplyCap',
        'maxSearchCallsPerRun',
        'companyBlacklist',
      ];
      const update: Record<string, unknown> = {};
      for (const key of allowed) {
        if (body.config[key] !== undefined) update[key] = body.config[key];
      }
      await getOrCreateAgentConfig(String(user._id));
      await AgentConfigModel.updateOne({ userId: user._id }, { $set: update });
    }

    // Naukri credentials update
    if (body?.credentials?.naukriEmail && body?.credentials?.naukriPassword) {
      await NaukriCredential.findOneAndUpdate(
        { userId: user._id },
        {
          naukriEmail: String(body.credentials.naukriEmail).trim(),
          naukriPassword: String(body.credentials.naukriPassword),
          lastLoginOk: undefined,
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save config' }, { status: 500 });
  }
}
