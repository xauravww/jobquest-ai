import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CalendarEvent } from '@/models/CalendarEvent';

// GET - Fetch calendar events
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const applicationId = searchParams.get('applicationId');
    const jobId = searchParams.get('jobId');
    const view = searchParams.get('view') || 'month'; // month, week, day
    
    // TODO: Get userId from session
    const userId = '507f1f77bcf86cd799439011'; // Placeholder for now
    
    // Build query
    const query: unknown = {
      userId // Filter by user
    };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (applicationId) {
      query.applicationId = applicationId;
    }
    
    if (jobId) {
      query.jobId = jobId;
    }
    
    // Date filtering
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) {
        query.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.startDate.$lte = new Date(endDate);
      }
    }
    
    // Fetch events
    const events = await CalendarEvent.find(query)
      .populate('applicationId', 'status jobId')
      .populate('jobId', 'title company')
      .populate('reminderId', 'title type')
      .sort({ startDate: 1 });
    
    // Get upcoming events (next 7 days)
    const upcomingQuery = {
      ...query,
      startDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      status: { $in: ['scheduled', 'confirmed'] }
    };
    
    const upcomingEvents = await CalendarEvent.find(upcomingQuery)
      .populate('applicationId', 'status jobId')
      .populate('jobId', 'title company')
      .sort({ startDate: 1 })
      .limit(5);
    
    // Get stats
    const stats = await CalendarEvent.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusStats = {
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0
    };
    
    stats.forEach(stat => {
      statusStats[stat._id as keyof typeof statusStats] = stat.count;
    });
    
    return NextResponse.json({
      events,
      upcomingEvents,
      stats: statusStats
    });
    
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new calendar event
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
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
      priority
    } = body;
    
    // Validation
    if (!title || !startDate || !endDate || !type) {
      return NextResponse.json(
        { error: 'Title, start date, end date, and type are required' },
        { status: 400 }
      );
    }
    
    // TODO: Get userId from session
    const userId = '507f1f77bcf86cd799439011'; // Placeholder for now
    
    // Create event
    const event = new CalendarEvent({
      userId,
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isAllDay: isAllDay || false,
      timezone: timezone || 'UTC',
      location: location || {},
      type,
      attendees: attendees || [],
      reminders: reminders || [],
      applicationId: applicationId || null,
      jobId: jobId || null,
      reminderId: reminderId || null,
      preparationNotes,
      agenda: agenda || [],
      documents: documents || [],
      tags: tags || [],
      color: color || '#3b82f6',
      priority: priority || 'medium'
    });
    
    await event.save();
    
    // Populate references for response
    await event.populate('applicationId', 'status jobId');
    await event.populate('jobId', 'title company');
    await event.populate('reminderId', 'title type');
    
    return NextResponse.json({
      success: true,
      event
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}