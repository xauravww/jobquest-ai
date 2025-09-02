import { NextRequest, NextResponse } from 'next/server';

// Import AI filter service dynamically
let AiFilterService: unknown;

const initService = async () => {
  if (!AiFilterService) {
    AiFilterService = (await import('@/lib/aiFilterService')).default || require('@/lib/aiFilterService');
  }
};

export async function POST(request: NextRequest) {
  try {
    await initService();
    const aiFilterService = new AiFilterService();
    
    const { results, filters = {} } = await request.json();

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Results array is required in request body.' },
        { status: 400 }
      );
    }

    console.log(`Received filter request for ${results.length} results`);
    console.log('Applied filters:', filters);

    const filteredResults = await aiFilterService.filterResults(results, filters);

    return NextResponse.json({
      success: true,
      originalCount: results.length,
      filteredCount: filteredResults.length,
      filtersApplied: filters,
      data: filteredResults
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Filter API error:', errorMessage);
    return NextResponse.json(
      { error: 'An error occurred while filtering results.', details: errorMessage },
      { status: 500 }
    );
  }
}