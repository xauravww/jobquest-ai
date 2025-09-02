import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Reminder } from '@/models/Reminder';
import { getServerSession } from 'next-auth';

// GET - Fetch reminders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const applicationId = searchParams.get('applicationId');
    const jobId = searchParams.get('jobId');
    
    // TODO: Get userId from session
    const userId = '507f1f77bcf86cd799439011'; // Placeholder for now
    
    // Build query
    const query: unknown = {
      userId // Filter by user
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (applicationId) {
      query.applicationId = applicationId;
    }
    
    if (jobId) {
      query.jobId = jobId;
    }
    
    // Date filtering
    if (dateFrom || dateTo) {
      query.dueDate = {};
      if (dateFrom) {
        query.dueDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.dueDate.$lte = new Date(dateTo);
      }
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Fetch reminders
    const reminders = await Reminder.find(query)
      .populate('applicationId', 'status jobId')
      .populate('jobId', 'title company')
      .sort({ dueDate: 1, priority: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Reminder.countDocuments(query);
    
    // Get stats
    const stats = await Reminder.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusStats = {
      pending: 0,
      completed: 0,
      snoozed: 0,
      cancelled: 0
    };
    
    stats.forEach(stat => {
      statusStats[stat._id as keyof typeof statusStats] = stat.count;
    });
    
    return NextResponse.json({
      reminders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statusStats
    });
    
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new reminder
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      title,
      description,
      dueDate,
      dueTime,
      type,
      priority,
      applicationId,
      jobId,
      tags,
      color,
      notifications,
      isRecurring,
      recurrencePattern,
      recurrenceInterval,
      recurrenceEndDate
    } = body;
    
    // Validation
    if (!title || !dueDate || !type) {
      return NextResponse.json(
        { error: 'Title, due date, and type are required' },
        { status: 400 }
      );
    }
    
    // TODO: Get userId from session
    const userId = '507f1f77bcf86cd799439011'; // Placeholder for now
    
    // Create reminder
    const reminder = new Reminder({
      userId,
      title,
      description,
      dueDate: new Date(dueDate),
      dueTime: dueTime || '09:00',
      type,
      priority: priority || 'medium',
      applicationId: applicationId || null,
      jobId: jobId || null,
      tags: tags || [],
      color: color || '#3b82f6',
      notifications: notifications || [],
      isRecurring: isRecurring || false,
      recurrencePattern,
      recurrenceInterval,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null
    });
    
    await reminder.save();
    
    // Populate references for response
    await reminder.populate('applicationId', 'status jobId');
    await reminder.populate('jobId', 'title company');
    
    return NextResponse.json({
      success: true,
      reminder
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}