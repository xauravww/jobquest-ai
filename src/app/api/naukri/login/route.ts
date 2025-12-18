import { NextRequest, NextResponse } from 'next/server';
import { NaukriService } from '@/services/NaukriService';

const naukriService = new NaukriService();

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const tokens = await naukriService.login(username, password);

        // In a real app, you might want to encrypt these or store them in a secure session
        // For this implementation, we'll return them to the client to be stored in memory/local storage
        // or set them as HTTP-only cookies on this response.

        return NextResponse.json({
            success: true,
            tokens
        });

    } catch (error: any) {
        console.error('Login API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Login failed' },
            { status: 500 }
        );
    }
}
