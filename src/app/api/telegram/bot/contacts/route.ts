import { NextRequest, NextResponse } from 'next/server';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import connectDB from '@/lib/mongodb';
import { Contact } from '@/models/Contact';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID required' }, { status: 400 });
    }

    // Get user by Telegram ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await connectDB();

    // Get contacts for the user
    const contacts = await Contact.find({ 
      userId: user._id
    })
    .sort({ name: 1 });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts for bot:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}