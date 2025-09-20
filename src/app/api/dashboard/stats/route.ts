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

    console.log('Dashboard stats API called for user:', session.user.email);

    // Connect to database with better error handling
    try {
      await connectDB();
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      // Return fallback stats instead of error
      const fallbackStats = {
        jobStats: {
          totalApplications: 0,
          activeApplications: 0,
          interviews: 0,
          offers: 0,
          responseRate: 0
        },
        userProfile: {
          firstName: session.user.name?.split(' ')[0] || 'User',
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

    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Find user first to get userId (same pattern as applications API)
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      console.log('User not found for email:', session.user.email);
      // Return fallback stats if user not found
      const fallbackStats = {
        jobStats: {
          totalApplications: 0,
          activeApplications: 0,
          interviews: 0,
          offers: 0,
          responseRate: 0
        },
        userProfile: {
          firstName: session.user.name?.split(' ')[0] || 'User',
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

    console.log('Fetching data from database for user:', user._id);
    
    // Use Mongoose models with userId (ObjectId) instead of userEmail
    let applications: any[] = [];
    let reminders: any[] = [];
    let events: any[] = [];

    try {
      // Use Application model with userId
      const Application = (await import('@/models/Application')).default;
      applications = await Application.find({ userId: user._id }).populate('jobId');
      console.log(`Found ${applications.length} applications`);
    } catch (error) {
      console.error('Error fetching applications:', error);
      applications = [];
    }

    try {
      // Use Reminder model with userId
      const Reminder = (await import('@/models/Reminder')).default;
      reminders = await Reminder.find({ userId: user._id });
      console.log(`Found ${reminders.length} reminders`);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      reminders = [];
    }

    try {
      // Use CalendarEvent model with userId
      const CalendarEvent = (await import('@/models/CalendarEvent')).default;
      events = await CalendarEvent.find({ userId: user._id });
      console.log(`Found ${events.length} events`);
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

    console.log('Returning dashboard stats:', {
      totalApplications: stats.jobStats.totalApplications,
      activeApplications: stats.jobStats.activeApplications,
      interviews: stats.jobStats.interviews
    });

    // Return with no-cache headers to prevent caching issues
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
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
    
    return NextResponse.json(fallbackStats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  }
}