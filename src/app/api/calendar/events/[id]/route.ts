import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { CalendarEvent } from '@/models/CalendarEvent';

interface CalendarEventUpdateData {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  isAllDay?: boolean;
  timezone?: string;
  location?: {
    address?: string;
    coordinates?: { lat?: number; lng?: number };
    isVirtual?: boolean;
    meetingLink?: string;
    meetingId?: string;
    meetingPassword?: string;
  };
  type?: string;
  status?: string;
  attendees?: Array<{
    name?: string;
    email?: string;
    role?: string;
    company?: string;
    phone?: string;
    responseStatus?: string;
  }>;
  reminders?: Array<{
    type?: string;
    timing?: number;
    sent?: boolean;
    sentAt?: Date;
  }>;
  applicationId?: string;
  jobId?: string;
  reminderId?: string;
  preparationNotes?: string;
  agenda?: string[];
  documents?: Array<{
    name?: string;
    url?: string;
    type?: string;
  }>;
  tags?: string[];
  color?: string;
  priority?: string;
  outcome?: {
    result?: string;
    feedback?: string;
    nextSteps?: string;
    followUpScheduled?: boolean;
  };
  followUpRequired?: boolean;
  followUpDate?: Date;
  followUpNotes?: string;
}

// GET - Fetch single calendar event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const event = await CalendarEvent.findById(id)
      .populate('applicationId', 'status jobId')
      .populate('jobId', 'title company')
      .populate('reminderId', 'title type');
    
    if (!event) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(event);
    
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update calendar event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      description,
      startDate,
      endDate,
      isAllDay,
      timezone,
      location,
      type,
      status,
      attendees,
      reminders,
      applicationId,
      jobId,
      reminderId,
      preparationNotes,
      agenda,
      documents,
      tags,
      color,
      priority,
      outcome,
      followUpRequired,
      followUpDate,
      followUpNotes
    } = body;
    
    const updateData: CalendarEventUpdateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (isAllDay !== undefined) updateData.isAllDay = isAllDay;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (location !== undefined) updateData.location = location;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (attendees !== undefined) updateData.attendees = attendees;
    if (reminders !== undefined) updateData.reminders = reminders;
    if (applicationId !== undefined) updateData.applicationId = applicationId;
    if (jobId !== undefined) updateData.jobId = jobId;
    if (reminderId !== undefined) updateData.reminderId = reminderId;
    if (preparationNotes !== undefined) updateData.preparationNotes = preparationNotes;
    if (agenda !== undefined) updateData.agenda = agenda;
    if (documents !== undefined) updateData.documents = documents;
    if (tags !== undefined) updateData.tags = tags;
    if (color !== undefined) updateData.color = color;
    if (priority !== undefined) updateData.priority = priority;
    if (outcome !== undefined) updateData.outcome = outcome;
    if (followUpRequired !== undefined) updateData.followUpRequired = followUpRequired;
    if (followUpDate !== undefined) updateData.followUpDate = new Date(followUpDate);
    if (followUpNotes !== undefined) updateData.followUpNotes = followUpNotes;
    
    const event = await CalendarEvent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('applicationId', 'status jobId')
      .populate('jobId', 'title company')
      .populate('reminderId', 'title type');
    
    if (!event) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      event
    });
    
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete calendar event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const event = await CalendarEvent.findByIdAndDelete(id);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Calendar event not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}