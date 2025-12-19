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

        const { jobId, answers, tokens, cliStyle } = await request.json();

        if (!jobId) {
            return NextResponse.json(
                { error: 'Job ID is required' },
                { status: 400 }
            );
        }

        if (!tokens || !tokens.authorization || !tokens.cookies) {
            return NextResponse.json(
                { error: 'Valid tokens are required' },
                { status: 400 }
            );
        }

        console.log('Calling applyJob with jobId:', jobId);
        console.log('Auth token preview:', tokens.authorization.substring(0, 50) + '...');
        console.log('Cookie count:', tokens.cookies.split(';').length);

        // Check if this is an external application job (shouldn't happen, but safety check)
        // This would be checked in frontend, but adding server-side check too
        if (jobId.startsWith('external_')) {
            return NextResponse.json(
                { error: 'This job requires external application' },
                { status: 400 }
            );
        }

        // Try the application
        try {
            let result;

            if (cliStyle) {
                // Use CLI-style request format (string concatenation instead of JSON)
                const bodyStr = `{"strJobsarr":["${jobId}"],"applyData":{}}`;
                const fullBody = `${bodyStr},"logstr":"--drecomm_profile-2-F-0-1--17140801091455348-","flowtype":"show","crossdomain":true,"jquery":1,"rdxMsgId":"","chatBotSDK":true,"mandatory_skills":["CSS","HTML","React.Js"],"optional_skills":["Typescript","Angular"],"applyTypeId":"107","closebtn":"y","applySrc":"drecomm_profile","sid":"17140801091455348","mid":""}`;

                console.log('CLI-style apply request body:', fullBody);

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
                        'authorization': `Bearer ${tokens.authorization}`,
                        'cookie': tokens.cookies
                    },
                    body: fullBody
                });

                result = await response.json();
                console.log('CLI-style apply result:', result);
            } else {
                // Use normal service method
                result = await naukriService.applyJob(jobId, tokens.authorization, tokens.cookies);
                console.log('Normal apply result:', result);
            }

            return NextResponse.json(result);
        } catch (error: any) {
            // If 401, the token is expired, suggest re-login
            if (error.status === 401) {
                console.log('Token appears expired, suggesting fresh login');
                return NextResponse.json(
                    { error: 'Session expired. Please login again.', code: 'TOKEN_EXPIRED' },
                    { status: 401 }
                );
            }
            // If 406 with external flag, this job requires external application
            if (error.status === 406 && error.external) {
                console.log('Job detected as requiring external application');
                return NextResponse.json(
                    { error: 'This job requires external application.', code: 'EXTERNAL_REQUIRED', external: true },
                    { status: 406 }
                );
            }
            throw error;
        }

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

    } catch (error: any) {
        console.error('Apply API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Apply failed' },
            { status: 500 }
        );
    }
}
