import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mongodbService } from '@/lib/mongodb-service';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Reminder from '@/models/Reminder';
import Resume from '@/models/Resume';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !('id' in session.user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    await connectDB();

    // 1. Get Application Stats
    const applicationStats = await mongodbService.getApplicationStats(userId);

    // 2. Get User Profile Info
    const user = await User.findById(userId).select('name profile.title profile.location');
    const userProfile = {
      firstName: user?.name?.split(' ')[0] || 'User',
      targetRole: user?.profile?.title || 'Not Set',
      location: user?.profile?.location || 'Not Set',
    };

    // 3. Get Upcoming Reminders (next 7 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);
    const reminders = await Reminder.find({
      userId,
      dueDate: { $gte: new Date(), $lte: upcomingDate },
      status: 'pending'
    }).sort({ dueDate: 1 }).limit(5);

    // 4. Get Top Skills from Resumes
    const resumes = await Resume.find({ userId, isActive: true }).select('skills');
    const skillsSet = new Set<string>();
    resumes.forEach(resume => {
      resume.skills?.technical?.forEach((skill: string) => skillsSet.add(skill));
      resume.skills?.frameworks?.forEach((skill: string) => skillsSet.add(skill));
    });
    const topSkills = Array.from(skillsSet).slice(0, 9).map((skill, id) => ({ id, skill }));


    // 5. Get Application Trend Data (last 30 days)
    const trendEndDate = new Date();
    const trendStartDate = new Date();
    trendStartDate.setDate(trendEndDate.getDate() - 30);

    const trendData = await mongodbService.getApplicationTrend(userId, trendStartDate, trendEndDate);

    return NextResponse.json({
      jobStats: applicationStats.stats,
      applicationStatus: applicationStats.statusCounts,
      applicationTrendData: trendData,
      userProfile,
      upcomingReminders: reminders,
      topSkills
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
