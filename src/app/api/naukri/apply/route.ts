import { NextRequest, NextResponse } from 'next/server';
import { NaukriService } from '@/services/NaukriService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { default as MongoDBServiceClass } from '@/lib/mongodbService';

const naukriService = new NaukriService();
const mongoService = new MongoDBServiceClass();

export async function POST(request: NextRequest) {
    try {
        // const session = await getServerSession(authOptions);
        // if (!session?.user?.email) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { jobId, answers } = await request.json();

        if (!jobId) {
            return NextResponse.json(
                { error: 'Job ID is required' },
                { status: 400 }
            );
        }

        console.log('Calling applyJob with jobId:', jobId);
        const result = await naukriService.applyJob(jobId, { authorization: '', cookies: '' }, answers || {}, undefined, undefined);
        console.log('Apply result:', result);

        // Update job status - skipped for testing
        // if (result && result.jobs && result.jobs[0] && result.jobs[0].status === 200) {
        //     await mongoService.updateJobForUser(user._id, jobId, { status: 'applied', appliedDate: new Date() });

        //     // Create Application record
        //     const Application = (await import('@/models/Application')).default;
        //     const job = await Job.findOne({ jobId, userId: user._id });

        //     if (job) {
        //         const application = new Application({
        //             userId: user._id,
        //             jobId: job._id,
        //             applicationId: `naukri_${jobId}_${Date.now()}`,
        //             status: 'applied',
        //             appliedDate: new Date(),
        //             applicationMethod: 'auto_apply',
        //             platform: 'naukri',
        //             automationData: {
        //                 isAutomated: true,
        //                 automationScript: 'naukri-automation',
        //                 lastAutomationRun: new Date(),
        //                 automationStatus: 'completed'
        //             }
        //         });

        //         await application.save();
        //     }
        // }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Apply API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Apply failed' },
            { status: 500 }
        );
    }
}
