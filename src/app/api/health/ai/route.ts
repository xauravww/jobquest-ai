import { NextRequest, NextResponse } from 'next/server';

// Import AI filter service dynamically
let AiFilterService: any;

const initService = async () => {
  if (!AiFilterService) {
    AiFilterService = (await import('@/lib/aiFilterService')).default || require('@/lib/aiFilterService');
  }
};

export async function GET(request: NextRequest) {
  try {
    await initService();
    const aiFilterService = new AiFilterService();
    
    // Test AI service with a simple query
    const testContent = "We are hiring a Senior JavaScript Developer with 5+ years experience.";
    const analysis = await aiFilterService.analyzeContent(testContent);

    return NextResponse.json({
      status: 'healthy',
      ai_service: 'available',
      test_analysis: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        ai_service: 'unavailable',
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}