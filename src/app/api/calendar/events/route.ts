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

    // Get events from database
    const CalendarEvent = (await import('@/models/CalendarEvent')).default;
    const events = await CalendarEvent.find({ userId: user._id })
      .sort({ startDate: 1 })
      .populate('applicationId')
      .populate('jobId');
    
    return NextResponse.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
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
    
    // Create new event in database
    const CalendarEvent = (await import('@/models/CalendarEvent')).default;
    const newEvent = new CalendarEvent({
      userId: user._id,
      title: body.title,
      description: body.description,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      type: body.type || 'other',
      status: body.status || 'scheduled',
      priority: body.priority || 'medium',
      isAllDay: body.isAllDay || false,
      location: body.location || {},
      attendees: body.attendees || [],
      tags: body.tags || [],
      jobId: body.jobId || null,
      applicationId: body.applicationId || null
    });
    
    await newEvent.save();
    
    console.log('📅 [EVENTS] New event created:', {
      id: newEvent._id,
      title: newEvent.title,
      type: newEvent.type,
      startDate: newEvent.startDate
    });
    
    return NextResponse.json({
      success: true,
      event: newEvent,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
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
    const eventId = searchParams.get('id');
    const body = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }
    
    // Update event in database
    const CalendarEvent = (await import('@/models/CalendarEvent')).default;
    const updatedEvent = await CalendarEvent.findOneAndUpdate(
      { _id: eventId, userId: user._id },
      { ...body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    console.log('📅 [EVENTS] Event updated:', {
      id: updatedEvent._id,
      status: updatedEvent.status,
      title: updatedEvent.title
    });
    
    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
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
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }
    
    // Delete event from database
    const CalendarEvent = (await import('@/models/CalendarEvent')).default;
    const deletedEvent = await CalendarEvent.findOneAndDelete({
      _id: eventId,
      userId: user._id
    });
    
    if (!deletedEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    console.log('📅 [EVENTS] Event deleted:', { id: eventId });
    
    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}