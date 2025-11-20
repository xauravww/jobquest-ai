import { NextRequest, NextResponse } from 'next/server';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import connectDB from '@/lib/mongodb';
import { FleetingNote } from '@/models/FleetingNote';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, telegramUserId, source = 'telegram', timestamp } = body;

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID required' }, { status: 400 });
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get user by Telegram ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await connectDB();

    // Create fleeting note
    const fleetingNote = new FleetingNote({
      userEmail: user.email,
      content: content.trim(),
      source,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    await fleetingNote.save();

    return NextResponse.json({ 
      success: true, 
      note: fleetingNote 
    });
  } catch (error) {
    console.error('Error saving fleeting note for bot:', error);
    return NextResponse.json({ error: 'Failed to save fleeting note' }, { status: 500 });
  }
}