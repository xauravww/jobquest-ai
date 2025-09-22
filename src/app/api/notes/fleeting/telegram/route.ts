import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import FleetingNote from '@/models/FleetingNote';
import { getUserByTelegramUserId } from '@/lib/telegram-config';

export async function POST(request: NextRequest) {
  try {
    const { content, source = 'telegram', timestamp, telegramUserId } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID is required' }, { status: 400 });
    }

    // Get user by Telegram user ID
    const user = await getUserByTelegramUserId(telegramUserId.toString());
    if (!user) {
      return NextResponse.json({ error: 'User not found for Telegram ID' }, { status: 404 });
    }

    await connectDB();

    const note = new FleetingNote({
      content: content.trim(),
      userEmail: user.email,
      source,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    await note.save();

    // Transform note to match expected interface
    const transformedNote = {
      id: note._id.toString(),
      content: note.content,
      source: note.source,
      timestamp: note.timestamp || note.createdAt,
      userId: user.email,
      tags: note.tags || [],
      archived: note.isArchived || false
    };

    return NextResponse.json({
      success: true,
      message: 'Fleeting note saved successfully',
      note: transformedNote
    });

  } catch (error) {
    console.error('Create Telegram fleeting note error:', error);
    return NextResponse.json(
      { error: 'Failed to save fleeting note' },
      { status: 500 }
    );
  }
}