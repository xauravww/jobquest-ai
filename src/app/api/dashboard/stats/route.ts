import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';

// Helper function to get status colors
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'applied': '#3b82f6',
    'interviewing': '#f59e0b',
    'under_review': '#8b5cf6',
    'offered': '#10b981',
    'rejected': '#ef4444',
    'withdrawn': '#6b7280',
    'expired': '#9ca3af'
  };
  return colors[status] || '#6b7280';
}

// Helper function to generate trend data
function generateTrendData(applications: any[], events: any[]) {
  const last7Days = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayApplications = applications.filter(a => 
      new Date(a.appliedDate).toISOString().split('T')[0] === dateStr
    ).length;
    
    const dayInterviews = events.filter(e => 
      e.type === 'interview' && 
      new Date(e.startDate).toISOString().split('T')[0] === dateStr
    ).length;
    
    last7Days.push({
      date: dateStr,
      applications: dayApplications,
      interviews: dayInterviews
    });
  }
  
  return last7Days;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Return fallback stats instead of error
      return NextResponse.json({
        totalApplications: 0,
        totalReminders: 0,
        totalEvents: 0,
        totalActivities: 0,
        pendingReminders: 0,
        upcomingInterviews: 0,
        overdueReminders: 0,
        overdueFollowUps: 0,
        activeContacts: 0,
        weeklyProgress: { completed: 0, total: 0 },
        completionRate: 0,
        applicationsByStatus: {},
        recentActivity: [],
        trends: {
          applications: { current: 0, previous: 0 },
          interviews: { current: 0, previous: 0 }
        }
      });
    }

    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Dynamically import models to handle potential issues
    let applications: any[] = [];
    let reminders: any[] = [];
    let events: any[] = [];

    try {
      const { Application } = await import('@/models/Application');
      applications = await Application.find({ 
        userId: session.user.id 
      }).populate('jobId').lean();
    } catch (error) {
      console.error('Error fetching applications:', error);
      applications = [];
    }

    try {
      const { Reminder } = await import('@/models/Reminder');
      reminders = await Reminder.find({ 
        userId: session.user.id 
      }).lean();
    } catch (error) {
      console.error('Error fetching reminders:', error);
      reminders = [];
    }

    try {
      const { CalendarEvent } = await import('@/models/CalendarEvent');
      events = await CalendarEvent.find({ 
        userId: session.user.id 
      }).lean();
    } catch (error) {
      console.error('Error fetching events:', error);
      events = [];
    }

    // Calculate statistics in the format expected by the dashboard
    const interviewCount = events.filter(e => e.type === 'interview').length;
    const completedApplications = applications.filter(a => a.status === 'completed' || a.status === 'offered').length;
    const responseRate = applications.length > 0 ? Math.round((completedApplications / applications.length) * 100) : 0;

    const stats = {
      jobStats: {
        totalApplications: applications.length,
        activeApplications: applications.filter(a => ['applied', 'interviewing', 'under_review'].includes(a.status)).length,
        interviews: interviewCount,
        offers: applications.filter(a => a.status === 'offered').length,
        responseRate: responseRate
      },
      userProfile: {
        firstName: session.user.name?.split(' ')[0] || 'User',
        targetRole: 'Job Seeker',
        location: 'Remote'
      },
      applicationStatus: Object.entries(applications.reduce((acc: any, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value as number,
        color: getStatusColor(name)
      })),
      applicationTrendData: generateTrendData(applications, events),
      upcomingReminders: reminders.filter(r => 
        r.status === 'pending' && 
        new Date(r.dueDate) > now
      ).slice(0, 5).map(r => ({
        _id: r._id,
        title: r.title,
        dueDate: r.dueDate
      })),
      topSkills: [
        { id: 1, skill: 'JavaScript' },
        { id: 2, skill: 'React' },
        { id: 3, skill: 'Node.js' },
        { id: 4, skill: 'Python' },
        { id: 5, skill: 'TypeScript' }
      ]
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    // Return fallback stats in the correct format
    const fallbackStats = {
      jobStats: {
        totalApplications: 0,
        activeApplications: 0,
        interviews: 0,
        offers: 0,
        responseRate: 0
      },
      userProfile: {
        firstName: 'User',
        targetRole: 'Job Seeker',
        location: 'Remote'
      },
      applicationStatus: [],
      applicationTrendData: [],
      upcomingReminders: [],
      topSkills: []
    };
    
    return NextResponse.json(fallbackStats);
  }
}