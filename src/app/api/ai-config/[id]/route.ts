import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import AIConfig from '@/models/AIConfig';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { provider, apiKey, apiUrl, aiModel } = body;

    if (!provider || !aiModel) {
      return NextResponse.json(
        { error: 'Provider and model are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const config = await AIConfig.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        provider,
        apiKey: apiKey || undefined,
        apiUrl: apiUrl || undefined,
        aiModel,
      },
      { new: true }
    );

    if (!config) {
      return NextResponse.json(
        { error: 'AI config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating AI config:', error);
    return NextResponse.json(
      { error: 'Failed to update AI config' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const result = await AIConfig.deleteOne({ _id: id, userId: session.user.id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'AI config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'AI config deleted' });
  } catch (error) {
    console.error('Error deleting AI config:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI config' },
      { status: 500 }
    );
  }
}
