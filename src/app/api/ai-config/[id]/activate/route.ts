import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AIConfig from '@/models/AIConfig';
import User from '@/models/User';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    // Find the config to activate
    const configToActivate = await AIConfig.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!configToActivate) {
      return NextResponse.json(
        { error: 'AI config not found' },
        { status: 404 }
      );
    }

    // Update the config to be active and set lastSelectedAt
    configToActivate.isActive = true;
    configToActivate.lastSelectedAt = new Date();
    await configToActivate.save();

    // Also update the user's aiConfig
    await User.findOneAndUpdate(
      { _id: configToActivate.userId },
      {
        aiConfig: {
          provider: configToActivate.provider,
          apiKey: configToActivate.apiKey,
          apiUrl: configToActivate.apiUrl,
          model: configToActivate.aiModel,
          enabled: true
        }
      }
    );

    return NextResponse.json(configToActivate);
  } catch (error) {
    console.error('Error activating AI config:', error);
    return NextResponse.json(
      { error: 'Failed to activate AI config' },
      { status: 500 }
    );
  }
}
