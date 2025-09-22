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
    
    console.log('🟦 [SEND MESSAGE] Sending to Telegram API:', {
      url: telegramApiUrl.replace(botToken, 'BOT_TOKEN_HIDDEN'),
      chat_id: userId,
      text_preview: text.substring(0, 50) + '...',
      parse_mode: parseMode
    });
    
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

    const responseText = await response.text();
    console.log('🟦 [SEND MESSAGE] Telegram API raw response:', responseText);

    if (response.ok) {
      const responseData = JSON.parse(responseText);
      console.log('🟢 [SEND MESSAGE] Message sent successfully to user:', userId);
      return NextResponse.json({ 
        success: true, 
        message: 'Message sent successfully',
        telegramResponse: responseData
      });
    } else {
      console.error('🔴 [SEND MESSAGE] Telegram API error:', response.status, responseText);
      
      // Parse error for better debugging
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = errorJson;
        
        // Handle specific Telegram errors
        if (errorJson.error_code === 404) {
          console.error('🔴 [SEND MESSAGE] 404 Error - Possible causes:');
          console.error('  - Bot token is invalid');
          console.error('  - User ID is incorrect');
          console.error('  - User has not started the bot yet');
          console.error('  - User has blocked the bot');
          
          return NextResponse.json({ 
            error: 'Failed to send message - User not found or bot not started',
            details: 'The user may need to start the bot first by sending /start',
            telegramError: errorJson
          }, { status: 404 });
        }
        
        if (errorJson.error_code === 403) {
          return NextResponse.json({ 
            error: 'Failed to send message - Bot blocked by user',
            details: 'The user has blocked the bot or the bot lacks permissions',
            telegramError: errorJson
          }, { status: 403 });
        }
        
      } catch (parseError) {
        console.error('🔴 [SEND MESSAGE] Could not parse error response:', parseError);
      }
      
      return NextResponse.json({ 
        error: 'Failed to send message via Telegram API',
        details: errorDetails
      }, { status: response.status });
    }

  } catch (error) {
    console.error('🔴 [SEND MESSAGE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}