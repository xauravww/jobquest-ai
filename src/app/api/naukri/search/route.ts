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
                    datePosted: new Date(jobData.postedDate),
                    userId: "dummy",
                    status: 'saved',
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
