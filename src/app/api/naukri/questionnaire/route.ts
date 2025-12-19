import { NextRequest, NextResponse } from 'next/server';
import { NaukriService } from '@/services/NaukriService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { default as MongoDBServiceClass } from '@/lib/mongodbService';

const naukriService = new NaukriService();
const mongoService = new MongoDBServiceClass();

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { jobId, tokens, answers } = await request.json();

        if (!jobId || !tokens || !answers) {
            return NextResponse.json(
                { error: 'Job ID, tokens, and answers are required' },
                { status: 400 }
            );
        }

        // Get user profile for context
        const User = (await import('@/models/User')).default;
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

        // Apply with manual answers
        const result = await naukriService.applyJob(jobId, tokens.authorization, tokens.cookies);

        // Update job status if successful
        if (result && result.jobs && result.jobs[0] && result.jobs[0].status === 200) {
            await mongoService.updateJobForUser(user._id, jobId, { status: 'applied', appliedDate: new Date() });

            // Create Application record
            const Application = (await import('@/models/Application')).default;
            const Job = (await import('@/models/Job')).default;
            const job = await Job.findOne({ jobId, userId: user._id });

            if (job) {
                const application = new Application({
                    userId: user._id,
                    jobId: job._id,
                    applicationId: `naukri_manual_${jobId}_${Date.now()}`,
                    status: 'applied',
                    appliedDate: new Date(),
                    applicationMethod: 'auto_apply',
                    platform: 'naukri',
                    automationData: {
                        isAutomated: true,
                        automationScript: 'naukri-manual',
                        lastAutomationRun: new Date(),
                        automationStatus: 'completed'
                    }
                });

                await application.save();
            }
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Manual questionnaire apply API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Manual apply failed' },
            { status: 500 }
        );
    }
}