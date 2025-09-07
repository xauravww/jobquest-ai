import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Resume from '@/models/Resume';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if resume exists and belongs to user
    const resume = await Resume.findOne({
      _id: id,
      userId: user._id,
      isActive: true
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Remove default flag from all user's resumes
    await Resume.updateMany(
      { userId: user._id },
      { isDefault: false }
    );

    // Set this resume as default
    await Resume.findByIdAndUpdate(id, {
      isDefault: true,
      updatedAt: new Date()
    });

    return NextResponse.json({ message: 'Default resume updated successfully' });
  } catch (error) {
    console.error('Set default resume error:', error);
    return NextResponse.json(
      { error: 'Failed to set default resume' },
      { status: 500 }
    );
  }
}
