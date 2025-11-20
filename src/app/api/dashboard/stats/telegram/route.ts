import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import Job from '@/models/Job';
import Reminder from '@/models/Reminder';
import CalendarEvent from '@/models/CalendarEvent';
import FollowUp from '@/models/FollowUp';
import Contact from '@/models/Contact';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID is required' }, { status: 400 });
    }

    // Get user by Telegram user ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found for Telegram ID' }, { status: 404 });
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
      Job.countDocuments({ userEmail: user.email }),
      Reminder.countDocuments({ 
        userEmail: user.email, 
        status: 'pending',
        dueDate: { $gte: new Date() }
      }),
      CalendarEvent.countDocuments({ 
        userEmail: user.email, 
        type: 'interview',
        status: 'scheduled',
        startDate: { $gte: new Date() }
      }),
      FollowUp.countDocuments({ 
        userEmail: user.email, 
        status: { $in: ['scheduled', 'overdue'] },
        scheduledDate: { $lt: new Date() }
      }),
      Contact.countDocuments({ userEmail: user.email })
    ]);

    // Calculate completion rate (simplified)
    const completedReminders = await Reminder.countDocuments({ 
      userEmail: user.email, 
      status: 'completed' 
    });
    const totalReminders = await Reminder.countDocuments({ userEmail: user.email });
    const completionRate = totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : 0;

    return NextResponse.json({
      success: true,
      totalActivities,
      pendingReminders,
      upcomingInterviews,
      overdueFollowUps,
      activeContacts,
      completionRate
    });

  } catch (error) {
    console.error('Get Telegram dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}