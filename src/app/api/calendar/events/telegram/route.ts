import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import CalendarEvent from '@/models/CalendarEvent';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'scheduled';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID is required' }, { status: 400 });
    }

    // Get user by Telegram user ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found for Telegram ID' }, { status: 404 });
    }

    await connectDB();

    // Build query
    const query: any = { 
      userEmail: user.email,
      status: status,
      startDate: { $gte: new Date() } // Only future events
    };
    
    if (type) {
      query.type = type;
    }

    // Get events
    const events = await CalendarEvent.find(query)
      .sort({ startDate: 1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      events: events.map(event => ({
        id: event._id.toString(),
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        type: event.type,
        status: event.status,
        location: event.location
      }))
    });

  } catch (error) {
    console.error('Get Telegram calendar events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}