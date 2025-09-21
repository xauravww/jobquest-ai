import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';

// This endpoint simulates receiving Telegram messages for local testing
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json({
                success: false,
                error: 'Please log in to test Telegram commands'
            }, { status: 401 });
        }

        const { command, chatId, isTextMessage } = await request.json();

        console.log('🧪 [LOCAL TEST] Simulating Telegram message:', { command, chatId, isTextMessage });

        // Get the actual user from database
        await connectDB();
        const User = (await import('@/models/User')).default;
        const user = await User.findOne({ email: session.user.email });
        
        if (!user) {
            return NextResponse.json({
                success: false,
                error: 'User not found in database'
            }, { status: 404 });
        }

        console.log('🧪 [LOCAL TEST] Using real user:', {
            email: user.email,
            name: user.name,
            userId: user._id.toString(),
            telegramConfig: user.telegramConfig
        });

        let response: string | null = null;

        if (isTextMessage || !command.startsWith('/')) {
            // Handle text messages (fleeting:, reminder:, etc.)
            const { handleTextMessage } = await import('../webhook/route');
            response = await handleTextMessage(command, chatId || 'test-chat', user);
        } else {
            // Handle commands (/start, /status, etc.)
            const { handleCommand } = await import('../webhook/route');
            response = await handleCommand(command, chatId || 'test-chat', user);
        }

        console.log('🧪 [LOCAL TEST] Generated response:', response);

        return NextResponse.json({
            success: true,
            command,
            response: response || 'No response generated',
            timestamp: new Date().toISOString(),
            userInfo: {
                email: user.email,
                name: user.name,
                userId: user._id.toString()
            }
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