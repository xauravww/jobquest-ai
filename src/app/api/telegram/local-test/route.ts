import { NextRequest, NextResponse } from 'next/server';

// This endpoint simulates receiving Telegram messages for local testing
export async function POST(request: NextRequest) {
    try {
        const { command, chatId, isTextMessage } = await request.json();

        console.log('🧪 [LOCAL TEST] Simulating Telegram message:', { command, chatId, isTextMessage });

        let response: string | null = null;

        // Create a mock user for testing
        const mockUser = {
            email: 'test@example.com',
            name: 'Test User',
            telegramConfig: {
                chatId: chatId || 'test-chat',
                enabled: true
            }
        };

        if (isTextMessage || !command.startsWith('/')) {
            // Handle text messages (fleeting:, reminder:, etc.)
            const { handleTextMessage } = await import('../webhook/route');
            response = await handleTextMessage(command, chatId || 'test-chat', mockUser);
        } else {
            // Handle commands (/start, /status, etc.)
            const { handleCommand } = await import('../webhook/route');
            response = await handleCommand(command, chatId || 'test-chat', mockUser);
        }

        console.log('🧪 [LOCAL TEST] Generated response:', response);

        return NextResponse.json({
            success: true,
            command,
            response: response || 'No response generated',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('🔴 [LOCAL TEST] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Local Telegram Test Endpoint',
        usage: 'POST with { "command": "/start", "chatId": "test" }',
        availableCommands: [
            '/start',
            '/status',
            '/reminders',
            '/interviews',
            '/followups',
            '/help',
            '/menu'
        ]
    });
}