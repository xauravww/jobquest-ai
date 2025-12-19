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

        const { jobId, tokens, answers, redirectParams } = await request.json();

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

        // Try CLI-style apply call to get questionnaire
        const bodyStr = `{"strJobsarr":["${jobId}"],"applyData":{}}`;
        const fullBody = `${bodyStr},"logstr":"--drecomm_profile-2-F-0-1--17140801091455348-","flowtype":"show","crossdomain":true,"jquery":1,"rdxMsgId":"","chatBotSDK":true,"mandatory_skills":["CSS","HTML","React.Js"],"optional_skills":["Typescript","Angular"],"applyTypeId":"107","closebtn":"y","applySrc":"drecomm_profile","sid":"17140801091455348","mid":""}`;

        console.log('Questionnaire fetch - CLI-style body:', fullBody);

        const response = await fetch('https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
                'appid': '121',
                'cache-control': 'no-cache',
                'clientid': 'd3skt0p',
                'content-type': 'application/json',
                'gid': 'LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE',
                'pragma': 'no-cache',
                'priority': 'u=1, i',
                'nkparam': 'jH9QnltH+MuGKLwVCzx6nuqLOex1fiLfmrNahP7GLA0SQihJC6d0hDFoJXV65lyEzWcAjLQ7SuUTKBlHw4Artw==',
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'x-requested-with': 'XMLHttpRequest',
                'systemid': 'Naukri',
                'Referer-Policy': 'strict-origin-when-cross-origin',
                'authorization': tokens.authorization,
                'cookie': tokens.cookies
            },
            body: fullBody
        });

        const result = await response.json();
        console.log('Questionnaire fetch result:', result);

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