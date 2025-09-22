import { NextRequest, NextResponse } from 'next/server';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import connectDB from '@/lib/mongodb';
import { FollowUp } from '@/models/FollowUp';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID required' }, { status: 400 });
    }

    // Get user by Telegram ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await connectDB();

    // Get follow-ups for the user
    const followUps = await FollowUp.find({ 
      userId: user._id
    })
    .sort({ scheduledDate: 1 })
    .limit(20);

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error('Error fetching follow-ups for bot:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}