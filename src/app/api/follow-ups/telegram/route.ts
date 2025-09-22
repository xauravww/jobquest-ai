import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getUserByTelegramUserId } from '@/lib/telegram-config';
import FollowUp from '@/models/FollowUp';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telegramUserId = searchParams.get('telegramUserId');
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

    // Get follow-ups
    const followUps = await FollowUp.find({ userEmail: user.email })
      .sort({ scheduledDate: 1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      followUps: followUps.map(followUp => ({
        id: followUp._id.toString(),
        subject: followUp.subject,
        scheduledDate: followUp.scheduledDate,
        status: followUp.status,
        priority: followUp.priority,
        contactId: followUp.contactId
      }))
    });

  } catch (error) {
    console.error('Get Telegram follow-ups error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups' },
      { status: 500 }
    );
  }
}