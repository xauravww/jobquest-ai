import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import AiFilterService from '@/lib/aiFilterService';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { results, filters = {}, aiConfig } = await request.json();

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const aiFilterService = new AiFilterService();

    // Use user's stored AI config, or provided config, or default
    if (user.aiConfig) {
      aiFilterService.saveConfig({
        provider: user.aiConfig.provider,
        apiUrl: user.aiConfig.apiUrl,
        model: user.aiConfig.model,
        apiKey: user.aiConfig.apiKey
      });
    } else if (aiConfig) {
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