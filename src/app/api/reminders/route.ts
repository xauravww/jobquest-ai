import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get reminders from database
    const Reminder = (await import('@/models/Reminder')).default;
    const reminders = await Reminder.find({ userId: user._id })
      .sort({ dueDate: 1 })
      .populate('applicationId')
      .populate('jobId');
    
    return NextResponse.json({
      success: true,
      reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
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

    await connectDB();

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Create new reminder in database
    const Reminder = (await import('@/models/Reminder')).default;
    const newReminder = new Reminder({
      userId: user._id,
      title: body.title,
      description: body.description,
      dueDate: new Date(body.dueDate),
      dueTime: body.dueTime || '09:00',
      type: body.type || 'custom',
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      tags: body.tags || [],
      jobId: body.jobId || null,
      applicationId: body.applicationId || null
    });
    
    await newReminder.save();
    
    console.log('⏰ [REMINDERS] New reminder created:', {
      id: newReminder._id,
      title: newReminder.title,
      dueDate: newReminder.dueDate
    });
    
    return NextResponse.json({
      success: true,
      reminder: newReminder,
      message: 'Reminder created successfully'
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const reminderId = searchParams.get('id');
    const body = await request.json();
    
    if (!reminderId) {
      return NextResponse.json(
        { error: 'Reminder ID required' },
        { status: 400 }
      );
    }
    
    // Update reminder in database
    const Reminder = (await import('@/models/Reminder')).default;
    const updatedReminder = await Reminder.findOneAndUpdate(
      { _id: reminderId, userId: user._id },
      { ...body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedReminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    console.log('⏰ [REMINDERS] Reminder updated:', {
      id: updatedReminder._id,
      status: updatedReminder.status,
      title: updatedReminder.title
    });
    
    return NextResponse.json({
      success: true,
      reminder: updatedReminder,
      message: 'Reminder updated successfully'
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find user first to get userId
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const reminderId = searchParams.get('id');
    
    if (!reminderId) {
      return NextResponse.json(
        { error: 'Reminder ID required' },
        { status: 400 }
      );
    }
    
    // Delete reminder from database
    const Reminder = (await import('@/models/Reminder')).default;
    const deletedReminder = await Reminder.findOneAndDelete({
      _id: reminderId,
      userId: user._id
    });
    
    if (!deletedReminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    console.log('⏰ [REMINDERS] Reminder deleted:', { id: reminderId });
    
    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}