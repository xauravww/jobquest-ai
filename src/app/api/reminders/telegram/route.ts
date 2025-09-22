import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import Reminder from '@/models/Reminder';
import Job from '@/models/Job';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');
    const limit = parseInt(searchParams.get('limit') || '5');
    const status = searchParams.get('status') || 'pending';

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID is required' }, { status: 400 });
    }

    // Get user by Telegram user ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found for Telegram ID' }, { status: 404 });
    }

    await connectDB();

    // Build query
    const query: any = { userEmail: user.email };
    if (status === 'pending') {
      query.status = 'pending';
      query.dueDate = { $gte: new Date() };
    } else if (status) {
      query.status = status;
    }

    // Get reminders with job details
    const reminders = await Reminder.find(query)
      .populate('jobId', 'company position')
      .sort({ dueDate: 1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      reminders: reminders.map(reminder => ({
        id: reminder._id.toString(),
        title: reminder.title,
        dueDate: reminder.dueDate,
        status: reminder.status,
        priority: reminder.priority,
        jobId: reminder.jobId ? {
          company: reminder.jobId.company,
          position: reminder.jobId.position
        } : null
      }))
    });

  } catch (error) {
    console.error('Get Telegram reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}