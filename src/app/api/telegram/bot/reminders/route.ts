import { NextRequest, NextResponse } from 'next/server';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import connectDB from '@/lib/mongodb';
import { Reminder } from '@/models/Reminder';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');
    const limit = parseInt(searchParams.get('limit') || '5');
    const status = searchParams.get('status') || 'pending';

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID required' }, { status: 400 });
    }

    // Get user by Telegram ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await connectDB();

    // Get reminders for the user
    const reminders = await Reminder.find({ 
      userId: user._id, 
      status 
    })
    .populate('jobId', 'company position')
    .sort({ dueDate: 1 })
    .limit(limit);

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Error fetching reminders for bot:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}