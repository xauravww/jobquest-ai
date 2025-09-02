import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mongodbService } from '@/lib/mongodb-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');
    
    // If date range is provided, get jobs by date range
    if (dateFrom || dateTo) {
      const jobs = await mongodbService.getJobsByDateRange(
        dateFrom || '', 
        dateTo || '', 
        { status }
      );
      return NextResponse.json(jobs);
    }

    // Otherwise get applications for this user
    const applications = await mongodbService.getApplications(user._id);
    return NextResponse.json(applications);
    
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { jobs } = body;
    
    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: 'Jobs array is required' },
        { status: 400 }
      );
    }

    // Handle different data structures - from AI filtering vs direct application creation
    const applications = jobs.map(job => {
      // If it's from AI filtering (has jobTitle, company, etc.)
      if (job.jobTitle && job.company) {
        return {
          userId: user._id,
          jobTitle: job.jobTitle,
          company: job.company,
          location: job.location || 'Unknown Location',
          jobUrl: job.jobUrl || '',
          description: job.description || '',
          status: job.status || 'submitted',
          applicationMethod: 'manual',
          platform: 'other',
          notes: job.notes || `Added from AI search on ${new Date().toLocaleDateString()}`,
          priority: 'medium' // Default priority for AI filtered jobs
        };
      } else {
        // Legacy format - transform to new format
        return {
          userId: user._id,
          jobId: job.id,
          status: job.status || 'submitted',
          applicationMethod: 'manual',
          platform: 'other',
          notes: job.aiReason || '',
          priority: job.aiScore >= 80 ? 'high' : job.aiScore >= 60 ? 'medium' : 'low',
          aiScore: job.aiScore,
          aiReason: job.aiReason
        };
      }
    });

    const savedApplications = await mongodbService.saveApplicationsFromAI(applications);

    return NextResponse.json({
      success: true,
      savedCount: savedApplications.length,
      applications: savedApplications
    });

  } catch (error) {
    console.error('Error creating applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}