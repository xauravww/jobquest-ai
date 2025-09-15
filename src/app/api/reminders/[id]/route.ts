import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Reminder } from '@/models/Reminder';

interface NotificationData {
  type: string;
  timing: string;
  sent: boolean;
  sentAt?: Date;
}

interface ReminderUpdateData {
  title?: string;
  description?: string;
  dueDate?: Date;
  dueTime?: string;
  type?: string;
  priority?: string;
  status?: string;
  applicationId?: string;
  jobId?: string;
  tags?: string[];
  color?: string;
  notifications?: NotificationData[];
  completedNotes?: string;
  snoozedUntil?: Date;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: Date | null;
  completedAt?: Date;
}

interface ReminderRequestBody {
  title?: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  type?: string;
  priority?: string;
  status?: string;
  applicationId?: string;
  jobId?: string;
  tags?: string[];
  color?: string;
  notifications?: NotificationData[];
  completedNotes?: string;
  snoozedUntil?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  recurrenceInterval?: number;
  recurrenceEndDate?: string | null;
}

// GET - Fetch single reminder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const reminder = await Reminder.findById(id)
      .populate('applicationId', 'status jobId')
      .populate('jobId', 'title company');
    
    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(reminder);
    
  } catch (error) {
    console.error('Error fetching reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update reminder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body: ReminderRequestBody = await request.json();
    const {
      title,
      description,
      dueDate,
      dueTime,
      type,
      priority,
      status,
      applicationId,
      jobId,
      tags,
      color,
      notifications,
      completedNotes,
      snoozedUntil,
      isRecurring,
      recurrencePattern,
      recurrenceInterval,
      recurrenceEndDate
    } = body;
    
    const updateData: ReminderUpdateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (dueTime !== undefined) updateData.dueTime = dueTime;
    if (type !== undefined) updateData.type = type;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (applicationId !== undefined) updateData.applicationId = applicationId;
    if (jobId !== undefined) updateData.jobId = jobId;
    if (tags !== undefined) updateData.tags = tags;
    if (color !== undefined) updateData.color = color;
    if (notifications !== undefined) updateData.notifications = notifications as NotificationData[];
    if (completedNotes !== undefined) updateData.completedNotes = completedNotes;
    if (snoozedUntil !== undefined) {
      updateData.snoozedUntil = new Date(snoozedUntil);
    }
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (recurrencePattern !== undefined) updateData.recurrencePattern = recurrencePattern;
    if (recurrenceInterval !== undefined) updateData.recurrenceInterval = recurrenceInterval;
    if (recurrenceEndDate !== undefined) updateData.recurrenceEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
    
    interface UpdateQuery {
      $inc?: { snoozeCount: number };
      [key: string]: unknown;
    }
    const updateQuery: UpdateQuery = { ...updateData };
    if (snoozedUntil !== undefined) {
      updateQuery.$inc = { snoozeCount: 1 };
    }

    const reminder = await Reminder.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true, runValidators: true }
    )
      .populate('applicationId', 'status jobId')
      .populate('jobId', 'title company');
    
    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      reminder
    });
    
  } catch (error) {
    console.error('Error updating reminder:', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete reminder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const reminder = await Reminder.findByIdAndDelete(id);
    
    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting reminder:', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}