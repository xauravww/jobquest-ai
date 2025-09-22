import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSharedBotToken, getUserByTelegramUserId } from '@/lib/telegram-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, text, parseMode = 'Markdown' } = await request.json();

    if (!userId || !text) {
      return NextResponse.json({ error: 'userId and text are required' }, { status: 400 });
    }

    // Get shared bot token
    const botToken = getSharedBotToken();
    if (!botToken) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    // Verify the user exists and is linked to this Telegram user ID
    const user = await getUserByTelegramUserId(userId);
    if (!user) {
      return NextResponse.json({ error: 'Telegram user not found or not linked' }, { status: 404 });
    }

    // Verify the requesting user matches the linked user
    if (user.email !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized to send to this Telegram user' }, { status: 403 });
    }

    // Send message via Telegram Bot API
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: text,
        parse_mode: parseMode
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({ 
        success: true, 
        messageId: result.result?.message_id 
      });
    } else {
      const errorText = await response.text();
      console.error('Telegram API error:', response.status, errorText);
      return NextResponse.json({ 
        error: 'Failed to send message', 
        details: errorText 
      }, { status: response.status });
    }

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}