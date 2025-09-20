import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSharedBotToken, getUserByTelegramUserId } from '@/lib/telegram-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, text, parseMode = 'Markdown' } = await request.json();

    if (!userId || !text) {
      return NextResponse.json({ error: 'User ID and text are required' }, { status: 400 });
    }

    // Get shared bot token
    const botToken = getSharedBotToken();
    if (!botToken) {
      return NextResponse.json({ error: 'Bot not configured' }, { status: 500 });
    }

    // Verify the user exists and is linked
    const user = await getUserByTelegramUserId(userId);
    if (!user || user.email !== session.user.email) {
      return NextResponse.json({ error: 'Telegram account not linked or unauthorized' }, { status: 403 });
    }

    // Send message via Telegram Bot API
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: userId, // Use userId as chat_id for DM
        text: text,
        parse_mode: parseMode
      })
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log('🟢 [SEND MESSAGE] Message sent successfully to user:', userId);
      return NextResponse.json({ 
        success: true, 
        message: 'Message sent successfully',
        telegramResponse: responseData
      });
    } else {
      const errorData = await response.text();
      console.error('🔴 [SEND MESSAGE] Telegram API error:', response.status, errorData);
      return NextResponse.json({ 
        error: 'Failed to send message via Telegram API',
        details: errorData
      }, { status: 500 });
    }

  } catch (error) {
    console.error('🔴 [SEND MESSAGE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}