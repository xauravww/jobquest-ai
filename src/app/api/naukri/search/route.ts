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

        const { criteria, tokens } = await request.json();

        if (!criteria || !tokens) {
            return NextResponse.json(
                { error: 'Search criteria and tokens are required' },
                { status: 400 }
            );
        }

        const searchResults = await naukriService.searchJobs(criteria, tokens);

        const savedJobs = [];
        if (searchResults && searchResults.jobDetails) {
            for (const jobData of searchResults.jobDetails) {
                // Check if job has external application (comprehensive detection)
                const hasExternalApplication = jobData.applyUrl ||
                    jobData.isExternal === true ||
                    jobData.applicationType === 'external' ||
                    jobData.mode === 'external' ||
                    (jobData.staticUrl && jobData.staticUrl.startsWith('http') && (
                        jobData.staticUrl.includes('.com') ||
                        jobData.staticUrl.includes('.org') ||
                        jobData.staticUrl.includes('.net') ||
                        !jobData.staticUrl.includes('naukri.com')
                    )) ||
                    (jobData.footerPlaceholderLabel && (
                        jobData.footerPlaceholderLabel.toLowerCase().includes('external') ||
                        jobData.footerPlaceholderLabel.toLowerCase().includes('web job') ||
                        jobData.footerPlaceholderLabel.toLowerCase().includes('posted on external')
                    )) ||
                    (jobData.placeholders && jobData.placeholders.some((p: any) =>
                        p && typeof p === 'string' && (
                            p.toLowerCase().includes('external') ||
                            p.toLowerCase().includes('web job') ||
                            p.toLowerCase().includes('posted on external')
                        )
                    )) ||
                    (jobData.title && (
                        jobData.title.toLowerCase().includes('external') ||
                        jobData.title.toLowerCase().includes('web job')
                    )) ||
                    (jobData.jobDescription && (
                        jobData.jobDescription.toLowerCase().includes('external site') ||
                        jobData.jobDescription.toLowerCase().includes('posted on external') ||
                        jobData.jobDescription.toLowerCase().includes('apply externally')
                    ));

                // Enhanced logging for jobs that might be external
                if (savedJobs.length === 0 || hasExternalApplication || jobData.companyName === 'Vibeosys') {
                    console.log('\n=== Job Analysis ===');
                    console.log('Job ID:', jobData.jobId, 'Company:', jobData.companyName);
                    console.log('Title:', jobData.title);
                    console.log('All fields:', Object.keys(jobData));
                    console.log('staticUrl:', jobData.staticUrl);
                    console.log('isExternal:', jobData.isExternal);
                    console.log('applyUrl:', jobData.applyUrl);
                    console.log('mode:', jobData.mode);
                    console.log('applicationType:', jobData.applicationType);
                    console.log('showMultipleApply:', jobData.showMultipleApply);
                    console.log('footerPlaceholderLabel:', jobData.footerPlaceholderLabel);
                    console.log('placeholders:', jobData.placeholders);
                    console.log('jobDescription (first 200 chars):', jobData.jobDescription?.substring(0, 200));
                    console.log('tagsAndSkills:', jobData.tagsAndSkills);
                    console.log('Detected as external:', hasExternalApplication);
                    console.log('Assigned status:', hasExternalApplication ? 'external' : 'saved');
                    console.log('===================\n');
                }

                const job = {
                    jobId: jobData.jobId,
                    title: jobData.title,
                    company: jobData.companyName,
                    location: Array.isArray(jobData.locations) ? jobData.locations.join(', ') : jobData.locations,
                    description: jobData.jobDescription,
                    salary: jobData.minSalary && jobData.maxSalary ? `${jobData.minSalary}-${jobData.maxSalary}` : 'Not disclosed',
                    experienceLevel: jobData.experience,
                    skills: jobData.tagsAndSkills ? jobData.tagsAndSkills.split(',').map((s: string) => s.trim()) : [],
                    source: 'naukri',
                    url: `https://www.naukri.com/job-listings-${jobData.jobId}`,
                    externalApplyUrl: jobData.applyUrl || (jobData.staticUrl && jobData.staticUrl.startsWith('http') ? jobData.staticUrl : null),
                    isExternalApplication: hasExternalApplication,
                    applicationType: hasExternalApplication ? 'external' : 'naukri',
                    datePosted: new Date(jobData.postedDate),
                    userId: "dummy",
                    status: hasExternalApplication ? 'external' : 'saved',
                    isActive: true
                };

                savedJobs.push(job);
            }
        }

        return NextResponse.json({
            success: true,
            count: savedJobs.length,
            jobs: savedJobs,
            raw: searchResults
        });

    } catch (error: any) {
        console.error('Search API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Search failed' },
            { status: 500 }
        );
    }
}
