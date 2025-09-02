import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { reminderCalendarService } from '@/lib/reminder-calendar-service';
import { Application } from '@/models/Application';
import { Job } from '@/models/Job';

// GET - Get reminders for a specific application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const application = await Application.findById(params.id)
      .populate('reminders')
      .populate('calendarEvents');
    
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      reminders: application.reminders,
      calendarEvents: application.calendarEvents
    });
    
  } catch (error) {
    console.error('Error fetching application reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create reminders for an application
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { type, autoGenerate } = body;
    
    const application = await Application.findById(params.id).populate('jobId');
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    let result;
    
    if (autoGenerate) {
      // Auto-generate standard reminders for the application
      result = await reminderCalendarService.createApplicationReminders(
        params.id,
        application.jobId
      );
    } else if (type === 'interview') {
      // Create interview event and related reminders
      const {
        title,
        startDate,
        endDate,
        interviewType,
        location,
        attendees,
        preparationNotes
      } = body;
      
      result = await reminderCalendarService.createInterviewEvent({
        applicationId: params.id,
        title: title || `Interview for ${application.jobId.title}`,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: interviewType || 'interview',
        location,
        attendees,
        preparationNotes
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('Error creating application reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}