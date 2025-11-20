import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({
        success: false,
        error: 'No bot token configured',
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL,
          VERCEL_URL: process.env.VERCEL_URL
        }
      }, { status: 400 });
    }

    // Check webhook info
    const webhookResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookInfo = await webhookResponse.json();

    // Check bot info
    const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const botInfo = await botResponse.json();

    return NextResponse.json({
      success: true,
      botInfo,
      webhookInfo,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        VERCEL_URL: process.env.VERCEL_URL,
        hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN
      }
    });

  } catch (error) {
    console.error('Error checking Telegram status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}