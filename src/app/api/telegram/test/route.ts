import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Telegram webhook test endpoint is working',
    timestamp: new Date().toISOString(),
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🧪 [TELEGRAM TEST] Received test webhook:', JSON.stringify(body, null, 2));
    
    // Simple echo response
    if (body.message?.text) {
      const text = body.message.text;
      const chatId = body.message.chat.id;
      
      console.log('🧪 [TELEGRAM TEST] Processing test message:', { text, chatId });
      
      // Send a simple response back
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (botToken) {
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        
        const response = await fetch(telegramApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🧪 *Test Echo*\n\nYou sent: "${text}"\n\n✅ Webhook is working!`,
            parse_mode: 'Markdown'
          })
        });
        
        console.log('🧪 [TELEGRAM TEST] Response sent, status:', response.status);
        
        if (response.ok) {
          return NextResponse.json({ success: true, message: 'Test response sent' });
        } else {
          const errorText = await response.text();
          console.error('🧪 [TELEGRAM TEST] Failed to send response:', errorText);
          return NextResponse.json({ success: false, error: errorText }, { status: 500 });
        }
      } else {
        console.log('🧪 [TELEGRAM TEST] No bot token configured');
        return NextResponse.json({ success: false, error: 'No bot token configured' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ success: true, message: 'Test webhook received' });
    
  } catch (error) {
    console.error('🧪 [TELEGRAM TEST] Error:', error);
    return NextResponse.json({ success: false, error: 'Test failed' }, { status: 500 });
  }
}