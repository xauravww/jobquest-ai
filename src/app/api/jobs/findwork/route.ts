import { NextRequest, NextResponse } from 'next/server';

const FINDWORK_API_KEY = process.env.FINDWORK_API_KEY;
const FINDWORK_BASE_URL = 'https://findwork.dev/api/jobs/';

export async function GET(request: NextRequest) {
  try {
    if (!FINDWORK_API_KEY) {
      return NextResponse.json(
        { error: 'FindWork API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const sortBy = searchParams.get('sort_by') || 'relevance';
    const remote = searchParams.get('remote');

    // Build query parameters for FindWork API
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (location) params.append('location', location);
    if (sortBy) params.append('sort_by', sortBy);
    if (remote === 'true') params.append('remote', 'true');

    const apiUrl = `${FINDWORK_BASE_URL}?${params.toString()}`;
    
    console.log('🔍 FindWork API Request:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Token ${FINDWORK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('FindWork API Error:', response.status, response.statusText);
      throw new Error(`FindWork API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ FindWork API Response:', {
      count: data.count,
      resultsLength: data.results?.length || 0
    });

    return NextResponse.json({
      success: true,
      count: data.count,
      next: data.next,
      previous: data.previous,
      results: data.results || []
    });

  } catch (error) {
    console.error('FindWork API Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs from FindWork API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}