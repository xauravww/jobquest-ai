import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const userEmail = session.user.email;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all reminders
    const allReminders = await db.collection('reminders').find({ userEmail }).toArray();
    const pendingReminders = allReminders.filter(r => r.status === 'pending' && new Date(r.dueDate) >= now);
    const completedReminders = allReminders.filter(r => r.status === 'completed');

    // Get all events
    const allEvents = await db.collection('events').find({ userEmail }).toArray();
    const upcomingInterviews = allEvents.filter(e => 
      e.type === 'interview' && 
      new Date(e.startDate) >= now && 
      e.status !== 'cancelled'
    );
    const completedEvents = allEvents.filter(e => e.status === 'completed');

    // Get all applications
    const allApplications = await db.collection('applications').find({ userEmail }).toArray();
    const activeApplications = allApplications.filter(a => 
      !['rejected', 'withdrawn', 'declined'].includes(a.status?.toLowerCase())
    );

    // Calculate total activities
    const totalActivities = allReminders.length + allEvents.length + allApplications.length;

    // Get weekly progress
    const weeklyReminders = allReminders.filter(r => new Date(r.createdAt || r.dueDate) >= weekAgo);
    const weeklyEvents = allEvents.filter(e => new Date(e.createdAt || e.startDate) >= weekAgo);
    const weeklyTotal = weeklyReminders.length + weeklyEvents.length;
    const weeklyCompleted = weeklyReminders.filter(r => r.status === 'completed').length + 
                           weeklyEvents.filter(e => e.status === 'completed').length;

    // Calculate completion rate
    const completedActivities = completedReminders.length + completedEvents.length;
    const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

    // Get application status breakdown
    const applicationStatusCounts = allApplications.reduce((acc, app) => {
      const status = app.status?.toLowerCase() || 'applied';
      if (status.includes('interview')) {
        acc.interviewing = (acc.interviewing || 0) + 1;
      } else if (status === 'rejected' || status === 'declined') {
        acc.rejected = (acc.rejected || 0) + 1;
      } else if (status === 'pending' || status === 'under review') {
        acc.pending = (acc.pending || 0) + 1;
      } else {
        acc.applied = (acc.applied || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Get application trend data (last 30 days)
    const applicationTrendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayApplications = allApplications.filter(app => 
        app.createdAt && new Date(app.createdAt).toISOString().split('T')[0] === dateStr
      ).length;
      
      const dayInterviews = allEvents.filter(event => 
        event.type === 'interview' && 
        event.createdAt && 
        new Date(event.createdAt).toISOString().split('T')[0] === dateStr
      ).length;

      if (dayApplications > 0 || dayInterviews > 0) {
        applicationTrendData.push({
          date: dateStr,
          applications: dayApplications,
          interviews: dayInterviews
        });
      }
    }

    // Get upcoming reminders (next 7 days)
    const upcomingReminders = allReminders
      .filter(r => r.status === 'pending' && new Date(r.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map(r => ({
        _id: r._id,
        title: r.title,
        dueDate: r.dueDate
      }));

    // Get user's top skills from applications or profile
    const userProfile = await db.collection('users').findOne({ email: userEmail });
    const topSkills = userProfile?.skills?.slice(0, 5).map((skill: string, index: number) => ({
      id: index + 1,
      skill
    })) || [];

    // Calculate response rate
    const totalApplicationsWithResponse = allApplications.filter(app => 
      app.status && !['applied', 'pending'].includes(app.status.toLowerCase())
    ).length;
    const responseRate = allApplications.length > 0 ? 
      Math.round((totalApplicationsWithResponse / allApplications.length) * 100) : 0;

    const response = {
      // Main dashboard stats
      totalActivities,
      pendingReminders: pendingReminders.length,
      upcomingInterviews: upcomingInterviews.length,
      overdueFollowUps: 0, // Would need follow-ups collection
      activeContacts: 0, // Would need contacts collection
      completionRate,
      weeklyProgress: {
        completed: weeklyCompleted,
        total: weeklyTotal
      },
      
      // Additional dashboard data
      jobStats: {
        totalApplications: allApplications.length,
        activeApplications: activeApplications.length,
        interviews: allEvents.filter(e => e.type === 'interview').length,
        offers: allApplications.filter(a => a.status?.toLowerCase().includes('offer')).length,
        responseRate
      },
      
      userProfile: {
        firstName: session.user.name?.split(' ')[0] || userProfile?.firstName || 'User',
        targetRole: userProfile?.targetRole || 'Job Seeker',
        location: userProfile?.location || 'Remote'
      },
      
      applicationStatus: [
        { name: 'Applied', value: applicationStatusCounts.applied || 0, color: '#3b82f6' },
        { name: 'Interviewing', value: applicationStatusCounts.interviewing || 0, color: '#f59e0b' },
        { name: 'Pending', value: applicationStatusCounts.pending || 0, color: '#6b7280' },
        { name: 'Rejected', value: applicationStatusCounts.rejected || 0, color: '#ef4444' }
      ],
      
      applicationTrendData,
      upcomingReminders,
      topSkills
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in simple stats API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}