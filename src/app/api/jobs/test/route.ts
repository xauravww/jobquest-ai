import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: any = {
    findwork: { status: 'unknown', error: null, count: 0 },
    jooble: { status: 'unknown', error: null, count: 0 },
    usajobs: { status: 'unknown', error: null, count: 0 },
    environment: {
      hasFindworkKey: !!process.env.FINDWORK_API_KEY,
      hasJoobleKey: !!process.env.JOOBLE_API_KEY,
      hasUsajobsKey: !!process.env.USAJOBS_API_KEY,
      hasUsajobsUserAgent: !!process.env.USAJOBS_USER_AGENT,
      findworkKeyPreview: process.env.FINDWORK_API_KEY ? 
        process.env.FINDWORK_API_KEY.substring(0, 8) + '...' : 'Not set',
      joobleKeyPreview: process.env.JOOBLE_API_KEY ? 
        process.env.JOOBLE_API_KEY.substring(0, 8) + '...' : 'Not set',
      usajobsKeyPreview: process.env.USAJOBS_API_KEY ? 
        process.env.USAJOBS_API_KEY.substring(0, 8) + '...' : 'Not set',
      usajobsUserAgent: process.env.USAJOBS_USER_AGENT || 'Not set'
    }
  };

  // Test FindWork API
  try {
    const findworkResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/findwork?search=developer&location=remote`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (findworkResponse.ok) {
      const data = await findworkResponse.json();
      results.findwork = {
        status: 'success',
        error: null,
        count: data.results?.length || 0,
        totalCount: data.count || 0
      };
    } else {
      const errorText = await findworkResponse.text();
      results.findwork = {
        status: 'error',
        error: `HTTP ${findworkResponse.status}: ${errorText}`,
        count: 0
      };
    }
  } catch (error) {
    results.findwork = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    };
  }

  // Test Jooble API
  try {
    const joobleResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/jooble?keywords=developer&location=remote`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (joobleResponse.ok) {
      const data = await joobleResponse.json();
      results.jooble = {
        status: 'success',
        error: null,
        count: data.results?.length || 0,
        totalCount: data.totalCount || 0
      };
    } else {
      const errorText = await joobleResponse.text();
      results.jooble = {
        status: 'error',
        error: `HTTP ${joobleResponse.status}: ${errorText}`,
        count: 0
      };
    }
  } catch (error) {
    results.jooble = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    };
  }

  // Test USAJOBS API
  try {
    const usajobsResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/usajobs?keyword=developer&locationName=Washington`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    if (usajobsResponse.ok) {
      const data = await usajobsResponse.json();
      results.usajobs = {
        status: 'success',
        error: null,
        count: data.results?.length || 0,
        searchResultCount: data.searchResultCount || 0,
        searchResultCountAll: data.searchResultCountAll || 0
      };
    } else {
      const errorText = await usajobsResponse.text();
      results.usajobs = {
        status: 'error',
        error: `HTTP ${usajobsResponse.status}: ${errorText}`,
        count: 0
      };
    }
  } catch (error) {
    results.usajobs = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    };
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results
  });
}