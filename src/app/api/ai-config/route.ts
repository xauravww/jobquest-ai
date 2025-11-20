import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AIConfig from '@/models/AIConfig';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const configs = await AIConfig.find({ userId: session.user.id }).sort({ lastSelectedAt: -1 });

    return NextResponse.json(configs);
  } catch (error) {
    console.error('Error fetching AI configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI configs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, apiUrl, aiModel } = body;

    if (!provider || !aiModel) {
      return NextResponse.json(
        { error: 'Provider and model are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create new config
    const newConfig = new AIConfig({
      userId: session.user.id,
      provider,
      apiKey,
      apiUrl,
      aiModel,
      isActive: false, // New configs start as inactive
      lastSelectedAt: new Date(),
    });

    await newConfig.save();

    return NextResponse.json(newConfig, { status: 201 });
  } catch (error) {
    console.error('Error creating AI config:', error);
    return NextResponse.json(
      { error: 'Failed to create AI config' },
      { status: 500 }
    );
  }
}
