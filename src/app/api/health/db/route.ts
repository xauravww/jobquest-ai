import { NextResponse } from 'next/server';
import MongoDBService from '@/lib/mongodbService';

export async function GET() {
  try {
    const mongoService = new MongoDBService();
    const health = await mongoService.healthCheck();

    if (health.status === 'healthy') {
      return NextResponse.json({
        status: 'healthy',
        message: 'MongoDB is connected',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: health.error,
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
