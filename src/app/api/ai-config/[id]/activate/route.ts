import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AIConfig from '@/models/AIConfig';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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

    return NextResponse.json(configToActivate);
  } catch (error) {
    console.error('Error activating AI config:', error);
    return NextResponse.json(
      { error: 'Failed to activate AI config' },
      { status: 500 }
    );
  }
}
