import { NextRequest, NextResponse } from 'next/server';

// Import MongoDB service dynamically
let MongoDBService: any;

const initService = async () => {
  if (!MongoDBService) {
    MongoDBService = (await import('@/lib/mongodbService')).default || require('@/lib/mongodbService');
  }
};

export async function GET(request: NextRequest) {
  try {
    await initService();
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