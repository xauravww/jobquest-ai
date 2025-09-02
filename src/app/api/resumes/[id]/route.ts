import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { unlink } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const resume = await Resume.findOne({ 
      _id: params.id, 
      userId: user._id,
      isActive: true 
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json(resume);
  } catch (error) {
    console.error('Resume fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const resume = await Resume.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json(resume);
  } catch (error) {
    console.error('Resume update error:', error);
    return NextResponse.json(
      { error: 'Failed to update resume' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const resume = await Resume.findOne({ 
      _id: params.id, 
      userId: user._id 
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const fullPath = path.join(process.cwd(), resume.filePath);
      await unlink(fullPath);
    } catch (fileError) {
      console.warn('Failed to delete file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Soft delete - mark as inactive
    await Resume.findByIdAndUpdate(params.id, { 
      isActive: false,
      updatedAt: new Date()
    });

    // If this was the default resume, set another one as default
    if (resume.isDefault) {
      const nextResume = await Resume.findOne({
        userId: user._id,
        isActive: true,
        _id: { $ne: params.id }
      }).sort({ updatedAt: -1 });

      if (nextResume) {
        await Resume.findByIdAndUpdate(nextResume._id, { isDefault: true });
      }
    }

    return NextResponse.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Resume deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}