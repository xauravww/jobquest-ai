import { NextRequest, NextResponse } from 'next/server';

// Import MongoDB service dynamically
let MongoDBService: unknown;

const initService = async () => {
  if (!MongoDBService) {
    MongoDBService = (await import('@/lib/mongodbService')).default || require('@/lib/mongodbService');
  }
};

export async function POST(request: NextRequest) {
  try {
    await initService();
    
    const { jobs } = await request.json();

    if (!jobs || !Array.isArray(jobs)) {
      return NextResponse.json(
        { error: 'Jobs array is required in request body.' },
        { status: 400 }
      );
    }

    console.log(`Received save request for ${jobs.length} filtered jobs`);

    const mongoService = new MongoDBService();
    const saveResults = await mongoService.saveFilteredJobs(jobs);

    return NextResponse.json({
      success: true,
      savedCount: Array.isArray(saveResults) ? saveResults.length : 0,
      message: `Successfully processed ${jobs.length} filtered jobs`,
      data: saveResults
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Save jobs API error:', errorMessage);
    return NextResponse.json(
      { error: 'An error occurred while saving jobs.', details: errorMessage },
      { status: 500 }
    );
  }
}