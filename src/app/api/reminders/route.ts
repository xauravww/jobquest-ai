import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage for demo (replace with database in production)
let reminders: any[] = [];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Sort by due date
    const sortedReminders = reminders.sort((a, b) => {
      const aDate = new Date(a.dueDate);
      const bDate = new Date(b.dueDate);
      return aDate.getTime() - bDate.getTime();
    });
    
    return NextResponse.json({
      success: true,
      reminders: sortedReminders
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
    const body = await request.json();
    
    const newReminder = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      title: body.title,
      description: body.description,
      dueDate: body.dueDate,
      dueTime: body.dueTime || '09:00',
      type: body.type || 'custom',
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      tags: body.tags || [],
      jobId: body.jobId || null,
      applicationId: body.applicationId || null,
      userId: session?.user?.email || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    reminders.push(newReminder);
    
    console.log('⏰ [REMINDERS] New reminder created:', {
      id: newReminder.id,
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
    const { searchParams } = new URL(request.url);
    const reminderId = searchParams.get('id');
    const body = await request.json();
    
    if (!reminderId) {
      return NextResponse.json(
        { error: 'Reminder ID required' },
        { status: 400 }
      );
    }
    
    const reminderIndex = reminders.findIndex(reminder => reminder.id === reminderId);
    
    if (reminderIndex === -1) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    reminders[reminderIndex] = {
      ...reminders[reminderIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    console.log('⏰ [REMINDERS] Reminder updated:', {
      id: reminders[reminderIndex].id,
      status: reminders[reminderIndex].status,
      title: reminders[reminderIndex].title
    });
    
    return NextResponse.json({
      success: true,
      reminder: reminders[reminderIndex],
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
    const { searchParams } = new URL(request.url);
    const reminderId = searchParams.get('id');
    
    if (!reminderId) {
      return NextResponse.json(
        { error: 'Reminder ID required' },
        { status: 400 }
      );
    }
    
    const initialLength = reminders.length;
    reminders = reminders.filter(reminder => reminder.id !== reminderId);
    
    if (reminders.length === initialLength) {
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