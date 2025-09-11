import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Resume from '@/models/Resume';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Aggregate resumes with usage count from applications
    const resumes = await Resume.aggregate([
      { $match: { userId: user._id, isActive: true } },
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'resumeUsed',
          as: 'applications'
        }
      },
      {
        $addFields: {
          usageCount: { $size: '$applications' }
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);

    return NextResponse.json(resumes);
  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resumes' },
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

    const body = await request.json();
    
    await dbConnect();
    
    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resumeData = {
      ...body,
      userId: user._id
    };

    const resume = new Resume(resumeData);
    await resume.save();

    return NextResponse.json(resume, { status: 201 });
  } catch (error) {
    console.error('Resume creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create resume' },
      { status: 500 }
    );
  }
}