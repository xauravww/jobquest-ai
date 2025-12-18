import { NextRequest, NextResponse } from 'next/server';
import { NaukriService } from '@/services/NaukriService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const naukriService = new NaukriService();

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { questionnaire } = await request.json();

        if (!questionnaire) {
            return NextResponse.json(
                { error: 'Questionnaire is required' },
                { status: 400 }
            );
        }

        // Get user profile and AI config
        const User = (await import('@/models/User')).default;
        const AIConfig = (await import('@/models/AIConfig')).default;
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Build user profile string for AI
        const profile = user.profile || {};
        const userProfile = `Name: ${user.name || 'Not provided'}
Email: ${user.email}
Title: ${profile.title || 'Not specified'}
Experience: ${profile.experience || 0} years
Skills: ${profile.skills?.join(', ') || 'Not specified'}
Education: ${profile.education?.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join(', ') || 'Not specified'}
Bio: ${profile.bio || 'Not provided'}
Summary: ${profile.summary || 'Not provided'}`;

        // Get active AI config
        const aiConfig = await AIConfig.findOne({ userId: user._id, isActive: true });

        const answers = await naukriService.generateAnswers(questionnaire, userProfile, aiConfig);

        return NextResponse.json({
            success: true,
            answers
        });

    } catch (error: any) {
        console.error('AI answers API Error:', error);
        return NextResponse.json(
            { error: error.message || 'AI answer generation failed' },
            { status: 500 }
        );
    }
}