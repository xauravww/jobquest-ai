import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import Contact from '@/models/Contact';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID is required' }, { status: 400 });
    }

    // Get user by Telegram user ID
    const user = await getUserByTelegramUserId(telegramUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found for Telegram ID' }, { status: 404 });
    }

    await connectDB();

    // Get contacts
    const contacts = await Contact.find({ userEmail: user.email })
      .sort({ name: 1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      contacts: contacts.map(contact => ({
        id: contact._id.toString(),
        name: contact.name,
        company: contact.company,
        position: contact.position,
        email: contact.email,
        phone: contact.phone
      }))
    });

  } catch (error) {
    console.error('Get Telegram contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}