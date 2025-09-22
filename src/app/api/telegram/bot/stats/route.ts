import { NextRequest, NextResponse } from 'next/server';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import connectDB from '@/lib/mongodb';
import { Reminder } from '@/models/Reminder';
import { CalendarEvent } from '@/models/CalendarEvent';
import { FollowUp } from '@/models/FollowUp';
import { Contact } from '@/models/Contact';
import { Job } from '@/models/Job';

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

    // Get stats for the user
    const [
      totalActivities,
      pendingReminders,
      upcomingInterviews,
      overdueFollowUps,
      activeContacts
    ] = await Promise.all([
      Job.countDocuments({ userId: user._id }),
      Reminder.countDocuments({ userId: user._id, status: 'pending' }),
      CalendarEvent.countDocuments({ 
        userId: user._id, 
        type: 'interview',
        startDate: { $gte: new Date() }
      }),
      FollowUp.countDocuments({ 
        userId: user._id, 
        status: { $in: ['scheduled', 'overdue'] },
        scheduledDate: { $lt: new Date() }
      }),
      Contact.countDocuments({ userId: user._id })
    ]);

    const completedActivities = await Job.countDocuments({ 
      userId: user._id, 
      status: { $in: ['offered'] }
    });

    const completionRate = totalActivities > 0 
      ? Math.round((completedActivities / totalActivities) * 100) 
      : 0;

    const stats = {
      totalActivities,
      pendingReminders,
      upcomingInterviews,
      overdueFollowUps,
      activeContacts,
      completionRate
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats for bot:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}