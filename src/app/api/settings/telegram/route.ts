import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import connectDB from '../../../../lib/db';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            telegramConfig: user.telegramConfig || { enabled: false }
        });
    } catch (error) {
        console.error('Error fetching Telegram settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, username, enabled } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Telegram User ID is required' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        user.telegramConfig = {
            userId,
            username,
            enabled: enabled !== undefined ? enabled : true
        };

        await user.save();

        return NextResponse.json({
            success: true,
            telegramConfig: user.telegramConfig
        });
    } catch (error) {
        console.error('Error saving Telegram settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}