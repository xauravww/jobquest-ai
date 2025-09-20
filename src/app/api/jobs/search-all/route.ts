import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || searchParams.get('keywords') || '';
    const location = searchParams.get('location') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const source = searchParams.get('source') || 'all'; // 'findwork', 'jooble', 'usajobs', or 'all'

    if (!search) {
      return NextResponse.json(
        { error: 'Search keywords are required' },
        { status: 400 }
      );
    }

    const results: any[] = [];
    const errors: string[] = [];
    let totalCount = 0;

    // Fetch from FindWork if requested
    if (source === 'all' || source === 'findwork') {
      try {
        const findworkParams = new URLSearchParams({
          search,
          ...(location && { location }),
          sort_by: 'relevance'
        });

        const findworkResponse = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/findwork?${findworkParams.toString()}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (findworkResponse.ok) {
          const findworkData = await findworkResponse.json();
          if (findworkData.success && findworkData.results) {
            const transformedJobs = findworkData.results.map((job: any) => ({
              ...job,
              id: `findwork-${job.id}`,
              source: 'findwork'
            }));
            results.push(...transformedJobs);
            totalCount += findworkData.count || 0;
            console.log(`✅ FindWork: ${transformedJobs.length} jobs fetched`);
          }
        } else {
          errors.push('FindWork API failed');
          console.error('FindWork API failed:', findworkResponse.status);
        }
      } catch (error) {
        errors.push('FindWork API error');
        console.error('FindWork API error:', error);
      }
    }

    // Fetch from Jooble if requested
    if (source === 'all' || source === 'jooble') {
      try {
        const joobleParams = new URLSearchParams({
          keywords: search,
          ...(location && { location }),
          page: page.toString()
        });

        const joobleResponse = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/jooble?${joobleParams.toString()}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (joobleResponse.ok) {
          const joobleData = await joobleResponse.json();
          if (joobleData.success && joobleData.results) {
            const transformedJobs = joobleData.results.map((job: any) => ({
              ...job,
              id: `jooble-${job.id}`,
              source: 'jooble'
            }));
            results.push(...transformedJobs);
            totalCount += joobleData.totalCount || 0;
            console.log(`✅ Jooble: ${transformedJobs.length} jobs fetched`);
          }
        } else {
          errors.push('Jooble API failed');
          console.error('Jooble API failed:', joobleResponse.status);
        }
      } catch (error) {
        errors.push('Jooble API error');
        console.error('Jooble API error:', error);
      }
    }

    // Fetch from USAJOBS if requested
    if (source === 'all' || source === 'usajobs') {
      try {
        const usajobsParams = new URLSearchParams({
          keyword: search,
          ...(location && { locationName: location }),
          page: page.toString(),
          resultPerPage: '25'
        });

        const usajobsResponse = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/jobs/usajobs?${usajobsParams.toString()}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (usajobsResponse.ok) {
          const usajobsData = await usajobsResponse.json();
          if (usajobsData.success && usajobsData.results) {
            const transformedJobs = usajobsData.results.map((job: any) => ({
              ...job,
              id: `usajobs-${job.id}`,
              source: 'usajobs'
            }));
            results.push(...transformedJobs);
            totalCount += usajobsData.searchResultCountAll || 0;
            console.log(`✅ USAJOBS: ${transformedJobs.length} jobs fetched`);
          }
        } else {
          errors.push('USAJOBS API failed');
          console.error('USAJOBS API failed:', usajobsResponse.status);
        }
      } catch (error) {
        errors.push('USAJOBS API error');
        console.error('USAJOBS API error:', error);
      }
    }

    // Sort results by relevance/date
    results.sort((a, b) => {
      // Prioritize jobs with more complete information
      const scoreA = (a.salary ? 1 : 0) + (a.description ? 1 : 0) + (a.publishedDate ? 1 : 0);
      const scoreB = (b.salary ? 1 : 0) + (b.description ? 1 : 0) + (b.publishedDate ? 1 : 0);
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      // Then sort by date if available
      if (a.publishedDate && b.publishedDate) {
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      }
      
      return 0;
    });

    console.log(`🔍 Combined Search Results: ${results.length} jobs from ${source === 'all' ? 'all sources' : source}`);

    return NextResponse.json({
      success: true,
      totalCount,
      resultsCount: results.length,
      page,
      results,
      sources: source === 'all' ? ['findwork', 'jooble', 'usajobs'] : [source],
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Combined Search API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}