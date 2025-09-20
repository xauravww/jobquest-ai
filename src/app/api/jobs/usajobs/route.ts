import { NextRequest, NextResponse } from 'next/server';

const USAJOBS_API_KEY = process.env.USAJOBS_API_KEY;
const USAJOBS_USER_AGENT = process.env.USAJOBS_USER_AGENT;
const USAJOBS_BASE_URL = 'https://data.usajobs.gov/api/search';

export async function GET(request: NextRequest) {
  try {
    if (!USAJOBS_API_KEY || !USAJOBS_USER_AGENT) {
      return NextResponse.json(
        { error: 'USAJOBS API key or user agent not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || searchParams.get('search') || '';
    const locationName = searchParams.get('locationName') || searchParams.get('location') || '';
    const jobCategoryCode = searchParams.get('jobCategoryCode') || '';
    const organizationCodes = searchParams.get('organizationCodes') || '';
    const positionOfferingTypeCode = searchParams.get('positionOfferingTypeCode') || '';
    const resultPerPage = parseInt(searchParams.get('resultPerPage') || '25');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query parameters for USAJOBS API
    const params = new URLSearchParams();
    if (keyword) params.append('Keyword', keyword);
    if (locationName) params.append('LocationName', locationName);
    if (jobCategoryCode) params.append('JobCategoryCode', jobCategoryCode);
    if (organizationCodes) params.append('OrganizationCodes', organizationCodes);
    if (positionOfferingTypeCode) params.append('PositionOfferingTypeCode', positionOfferingTypeCode);
    params.append('ResultsPerPage', resultPerPage.toString());
    params.append('Page', page.toString());

    const apiUrl = `${USAJOBS_BASE_URL}?${params.toString()}`;
    
    console.log('🔍 USAJOBS API Request:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Host': 'data.usajobs.gov',
        'User-Agent': USAJOBS_USER_AGENT,
        'Authorization-Key': USAJOBS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('USAJOBS API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('USAJOBS API Error Details:', errorText);
      throw new Error(`USAJOBS API error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ USAJOBS API Response:', {
      searchResultCount: data.SearchResult?.SearchResultCount || 0,
      searchResultCountAll: data.SearchResult?.SearchResultCountAll || 0,
      numberOfPages: data.SearchResult?.UserArea?.NumberOfPages || 0
    });

    // Transform USAJOBS response to match our standard format
    const transformedJobs = (data.SearchResult?.SearchResultItems || []).map((item: any) => {
      const matchedObjectDescriptor = item.MatchedObjectDescriptor;
      const positionLocation = matchedObjectDescriptor?.PositionLocation?.[0];
      
      return {
        id: matchedObjectDescriptor?.PositionID || `usajobs-${Date.now()}-${Math.random()}`,
        title: matchedObjectDescriptor?.PositionTitle || 'Unknown Title',
        company: matchedObjectDescriptor?.OrganizationName || 'U.S. Government',
        location: positionLocation ? 
          `${positionLocation.CityName || ''}, ${positionLocation.StateCode || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'Various Locations' 
          : 'Various Locations',
        url: matchedObjectDescriptor?.PositionURI || '#',
        description: matchedObjectDescriptor?.UserArea?.Details?.JobSummary || 
                    matchedObjectDescriptor?.QualificationSummary || 
                    'Government position - see full details on USAJOBS',
        publishedDate: matchedObjectDescriptor?.PublicationStartDate,
        salary: matchedObjectDescriptor?.PositionRemuneration?.[0]?.Description || 
               `${matchedObjectDescriptor?.PositionRemuneration?.[0]?.MinimumRange || ''} - ${matchedObjectDescriptor?.PositionRemuneration?.[0]?.MaximumRange || ''}`.trim().replace(/^-\s*|-\s*$/g, '') || 
               undefined,
        source: 'usajobs',
        metadata: {
          departmentName: matchedObjectDescriptor?.DepartmentName,
          jobCategory: matchedObjectDescriptor?.JobCategory?.[0]?.Name,
          jobGrade: matchedObjectDescriptor?.JobGrade?.[0]?.Code,
          positionSchedule: matchedObjectDescriptor?.PositionSchedule?.[0]?.Name,
          positionOfferingType: matchedObjectDescriptor?.PositionOfferingType?.[0]?.Name,
          applicationCloseDate: matchedObjectDescriptor?.ApplicationCloseDate
        }
      };
    });

    return NextResponse.json({
      success: true,
      searchResultCount: data.SearchResult?.SearchResultCount || 0,
      searchResultCountAll: data.SearchResult?.SearchResultCountAll || 0,
      numberOfPages: data.SearchResult?.UserArea?.NumberOfPages || 0,
      page: page,
      results: transformedJobs,
      source: 'usajobs'
    });

  } catch (error) {
    console.error('USAJOBS API Route Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch jobs from USAJOBS API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}