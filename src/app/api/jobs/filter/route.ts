import { NextRequest, NextResponse } from 'next/server';
import AiFilterService from '@/lib/aiFilterService';

export async function POST(request: NextRequest) {
  try {
    const { results, filters = {}, aiConfig } = await request.json();

    const aiFilterService = new AiFilterService();

    // If AI config is provided, save it to the service
    if (aiConfig) {
      aiFilterService.saveConfig(aiConfig);
    }

    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Results array is required in request body.' },
        { status: 400 }
      );
    }

    console.log(`Received filter request for ${results.length} results`);
    console.log('Applied filters:', filters);

    const filteredResults = await aiFilterService.filterResults(results, filters);

    console.log(`AI Filter API - Filtered results count: ${filteredResults.length}`);

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
      { error: errorMessage, details: errorMessage },
      { status: 500 }
    );
  }
}