import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
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

    return NextResponse.json({
      telegramConfig: user.telegramConfig || { enabled: false }
    });

  } catch (error) {
    console.error('Get Telegram settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram settings' },
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

    const { userId, username, enabled } = await request.json();

    if (!userId && enabled) {
      return NextResponse.json({ error: 'Telegram user ID is required when enabling' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.telegramConfig = {
      userId: userId || user.telegramConfig?.userId,
      username: username || user.telegramConfig?.username,
      enabled: enabled !== undefined ? enabled : false
    };

    await user.save();

    return NextResponse.json({
      success: true,
      telegramConfig: user.telegramConfig
    });

  } catch (error) {
    console.error('Update Telegram settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update Telegram settings' },
      { status: 500 }
    );
  }
}