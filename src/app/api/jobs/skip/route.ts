import { NextRequest, NextResponse } from 'next/server';
import { mongodbService } from '@/lib/mongodb-service';

export async function POST(request: NextRequest) {
  try {
    const { jobIds } = await request.json();
    
    if (!jobIds || !Array.isArray(jobIds)) {
      return NextResponse.json(
        { error: 'Job IDs array is required' },
        { status: 400 }
      );
    }

    const result = await mongodbService.skipJobs(jobIds);

    return NextResponse.json({
      success: true,
      skippedCount: result.modifiedCount || jobIds.length
    });

  } catch (error) {
    console.error('Error skipping jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}