import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory storage for demo (replace with database in production)
let events: any[] = [];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Sort by start date
    const sortedEvents = events.sort((a, b) => {
      const aDate = new Date(a.startDate);
      const bDate = new Date(b.startDate);
      return aDate.getTime() - bDate.getTime();
    });
    
    return NextResponse.json({
      success: true,
      events: sortedEvents
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
    const body = await request.json();
    
    const newEvent = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      title: body.title,
      description: body.description,
      startDate: body.startDate,
      endDate: body.endDate,
      type: body.type || 'event',
      status: body.status || 'scheduled',
      priority: body.priority || 'medium',
      isAllDay: body.isAllDay || false,
      location: body.location || null,
      attendees: body.attendees || [],
      tags: body.tags || [],
      jobId: body.jobId || null,
      applicationId: body.applicationId || null,
      userId: session?.user?.email || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    events.push(newEvent);
    
    console.log('📅 [EVENTS] New event created:', {
      id: newEvent.id,
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
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    const body = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }
    
    const eventIndex = events.findIndex(event => event.id === eventId);
    
    if (eventIndex === -1) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    events[eventIndex] = {
      ...events[eventIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    console.log('📅 [EVENTS] Event updated:', {
      id: events[eventIndex].id,
      status: events[eventIndex].status,
      title: events[eventIndex].title
    });
    
    return NextResponse.json({
      success: true,
      event: events[eventIndex],
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
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      );
    }
    
    const initialLength = events.length;
    events = events.filter(event => event.id !== eventId);
    
    if (events.length === initialLength) {
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