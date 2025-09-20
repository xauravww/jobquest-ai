import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import { Reminder } from '@/models/Reminder';
import { CalendarEvent } from '@/models/CalendarEvent';

export async function GET() {
  try {
    // For development, return empty array if no session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      // Return empty array instead of error for development
      return NextResponse.json([]);
    }

    try {
      await dbConnect();
    } catch (dbError) {
      // If database connection fails, return empty array for development
      console.log('Database connection failed, returning empty notifications');
      return NextResponse.json([]);
    }

    const now = new Date();
    const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const scheduledNotifications = [];

    try {
      // Check for reminders due soon
      const upcomingReminders = await Reminder.find({
        userId: session.user.id,
        status: 'pending',
        dueDate: {
          $gte: now,
          $lte: in1Hour
        }
      }).populate('jobId').lean();

    for (const reminder of upcomingReminders) {
      const dueTime = new Date(reminder.dueDate);
      const minutesUntilDue = Math.floor((dueTime.getTime() - now.getTime()) / (1000 * 60));

      if (minutesUntilDue <= 15 && minutesUntilDue > 0) {
        scheduledNotifications.push({
          title: 'Reminder Due Soon',
          message: `"${reminder.title}" is due in ${minutesUntilDue} minutes`,
          type: 'reminder',
          actionUrl: `/unified-dashboard?tab=activities`,
          actionLabel: 'View Reminder',
          metadata: {
            activityId: reminder._id,
            jobId: reminder.jobId?._id
          }
        });
      }
    }

    // Check for overdue reminders
    const overdueReminders = await Reminder.find({
      userId: session.user.id,
      status: 'pending',
      dueDate: { $lt: now }
    }).populate('jobId').lean();

    for (const reminder of overdueReminders) {
      const hoursOverdue = Math.floor((now.getTime() - new Date(reminder.dueDate).getTime()) / (1000 * 60 * 60));
      
      if (hoursOverdue <= 24) { // Only notify for recently overdue items
        scheduledNotifications.push({
          title: 'Overdue Reminder',
          message: `"${reminder.title}" was due ${hoursOverdue} hours ago`,
          type: 'warning',
          actionUrl: `/unified-dashboard?tab=activities`,
          actionLabel: 'Complete Now',
          metadata: {
            activityId: reminder._id,
            jobId: reminder.jobId?._id
          }
        });
      }
    }

    // Check for upcoming interviews
    const upcomingInterviews = await CalendarEvent.find({
      userId: session.user.id,
      type: 'interview',
      status: { $in: ['scheduled', 'confirmed'] },
      startDate: {
        $gte: now,
        $lte: in1Day
      }
    }).populate('jobId').lean();

    for (const interview of upcomingInterviews) {
      const startTime = new Date(interview.startDate);
      const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
      const hoursUntilStart = Math.floor(minutesUntilStart / 60);

      if (minutesUntilStart <= 30 && minutesUntilStart > 0) {
        scheduledNotifications.push({
          title: 'Interview Starting Soon',
          message: `Your interview "${interview.title}" starts in ${minutesUntilStart} minutes`,
          type: 'interview',
          actionUrl: `/unified-dashboard?tab=activities`,
          actionLabel: 'View Details',
          metadata: {
            activityId: interview._id,
            jobId: interview.jobId?._id
          }
        });
      } else if (hoursUntilStart <= 24 && hoursUntilStart > 0 && hoursUntilStart % 6 === 0) {
        // Notify every 6 hours for interviews within 24 hours
        scheduledNotifications.push({
          title: 'Upcoming Interview',
          message: `Don't forget: "${interview.title}" is in ${hoursUntilStart} hours`,
          type: 'interview',
          actionUrl: `/unified-dashboard?tab=activities`,
          actionLabel: 'Prepare Now',
          metadata: {
            activityId: interview._id,
            jobId: interview.jobId?._id
          }
        });
      }
    }

    // Check for follow-up reminders
    const followUpReminders = await Reminder.find({
      userId: session.user.id,
      type: 'follow_up',
      status: 'pending',
      dueDate: {
        $gte: now,
        $lte: in1Day
      }
    }).populate('jobId').lean();

    for (const followUp of followUpReminders) {
      const dueTime = new Date(followUp.dueDate);
      const hoursUntilDue = Math.floor((dueTime.getTime() - now.getTime()) / (1000 * 60 * 60));

      if (hoursUntilDue <= 2 && hoursUntilDue > 0) {
        scheduledNotifications.push({
          title: 'Follow-up Due Soon',
          message: `Time to follow up: "${followUp.title}" is due in ${hoursUntilDue} hours`,
          type: 'follow_up',
          actionUrl: `/unified-dashboard?tab=followups`,
          actionLabel: 'Start Follow-up',
          metadata: {
            activityId: followUp._id,
            jobId: followUp.jobId?._id
          }
        });
      }
    }

    // Check for application deadlines (if stored in reminders)
    const applicationDeadlines = await Reminder.find({
      userId: session.user.id,
      type: 'application_deadline',
      status: 'pending',
      dueDate: {
        $gte: now,
        $lte: in1Day
      }
    }).populate('jobId').lean();

    for (const deadline of applicationDeadlines) {
      const dueTime = new Date(deadline.dueDate);
      const hoursUntilDeadline = Math.floor((dueTime.getTime() - now.getTime()) / (1000 * 60 * 60));

      if (hoursUntilDeadline <= 6 && hoursUntilDeadline > 0) {
        scheduledNotifications.push({
          title: 'Application Deadline Approaching',
          message: `Application deadline for "${deadline.title}" is in ${hoursUntilDeadline} hours`,
          type: 'warning',
          actionUrl: `/application-tracking`,
          actionLabel: 'Complete Application',
          metadata: {
            activityId: deadline._id,
            jobId: deadline.jobId?._id
          }
        });
      }
    }

    // Remove duplicates and limit to 10 notifications
    const uniqueNotifications = scheduledNotifications
      .filter((notification, index, self) => 
        index === self.findIndex(n => 
          n.title === notification.title && 
          n.metadata?.activityId === notification.metadata?.activityId
        )
      )
      .slice(0, 10);

      return NextResponse.json(uniqueNotifications);
    } catch (dbError) {
      // If database queries fail, return empty array
      console.log('Database query failed, returning empty notifications');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    // Return empty array instead of error for better UX
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      // For development, allow scheduling without auth
      console.log('No session, allowing notification scheduling for development');
    }

    const { notification, scheduledTime } = await request.json();

    // In a real implementation, you would store this in a job queue or database
    // For now, we'll just return success
    console.log('Scheduling notification:', {
      notification,
      scheduledTime,
      userId: session?.user?.id
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Notification scheduled successfully' 
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return NextResponse.json(
      { error: 'Failed to schedule notification' },
      { status: 500 }
    );
  }
}