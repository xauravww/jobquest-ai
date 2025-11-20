import { NextRequest, NextResponse } from 'next/server';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import connectDB from '@/lib/mongodb';
import { CalendarEvent } from '@/models/CalendarEvent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');
    const type = searchParams.get('type') || 'interview';
    const status = searchParams.get('status') || 'scheduled';

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID required' }, { status: 400 });
    }

    // Get user by Telegram ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await connectDB();

    // Get interviews for the user
    const events = await CalendarEvent.find({ 
      userId: user._id, 
      type,
      status,
      startDate: { $gte: new Date() }
    })
    .sort({ startDate: 1 })
    .limit(10);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching interviews for bot:', error);
    return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
  }
}