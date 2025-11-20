import { NextRequest, NextResponse } from 'next/server';

const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;
const JOOBLE_BASE_URL = 'https://jooble.org/api/';

export async function GET(request: NextRequest) {
  try {
    if (!JOOBLE_API_KEY) {
      return NextResponse.json(
        { error: 'Jooble API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keywords = searchParams.get('keywords') || searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const salary = searchParams.get('salary') || '';
    const datecreatedfrom = searchParams.get('datecreatedfrom') || '';

    if (!keywords) {
      return NextResponse.json(
        { error: 'Keywords parameter is required' },
        { status: 400 }
      );
    }

    // Build request payload for Jooble API
    const requestPayload: any = {
      keywords: keywords,
      location: location,
      page: page.toString()
    };

    if (salary) requestPayload.salary = salary;
    if (datecreatedfrom) requestPayload.datecreatedfrom = datecreatedfrom;

    const apiUrl = `${JOOBLE_BASE_URL}${JOOBLE_API_KEY}`;
    
    console.log('🔍 Jooble API Request:', apiUrl);
    console.log('🔍 Jooble API Payload:', requestPayload);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      console.error('Jooble API Error:', response.status, response.statusText);
      throw new Error(`Jooble API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Jooble API Response:', {
      totalCount: data.totalCount,
      resultsLength: data.jobs?.length || 0
    });

    // Transform Jooble response to match our standard format
    const transformedJobs = (data.jobs || []).map((job: any) => ({
      id: job.id || `jooble-${Date.now()}-${Math.random()}`,
      title: job.title,
      company: job.company,
      location: job.location,
      url: job.link,
      description: job.snippet,
      publishedDate: job.updated,
      salary: job.salary,
      source: 'jooble'
    }));

    return NextResponse.json({
      success: true,
      totalCount: data.totalCount || 0,
      page: page,
      results: transformedJobs,
      source: 'jooble'
    });

  } catch (error) {
    console.error('Jooble API Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs from Jooble API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}