// Test batch job processing with external detection
async function testBatchProcessing() {
  console.log('Testing batch job processing with external job detection\n');

  try {
    // Login to get tokens
    console.log('=== Logging in ===');
    const loginResponse = await fetch('https://www.naukri.com/central-login-services/v1/login', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'appid': '121',
        'cache-control': 'no-cache',
        'clientid': 'd3skt0p',
        'content-type': 'application/json',
        'gid': 'LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'nkparam': 'jH9QnltH+MuGKLwVCzx6nuqLOex1fiLfmrNahP7GLA0SQihJC6d0hDFoJXV65lyEzWcAjLQ7SuUTKBlHw4Artw==',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'systemid': 'jobseeker',
      },
      body: JSON.stringify({
        username: 'sauravmaheshwari8@gmail.com',
        password: 'Job@98120'
      }),
    });

    const loginData = await loginResponse.json();
    if (loginData.userStateInfo?.userState !== 'AUTHENTICATED') {
      throw new Error('Login failed: ' + JSON.stringify(loginData));
    }

    const cookies = loginData.cookies || [];
    const naukAtCookie = cookies.find(c => c.name === 'nauk_at');
    if (!naukAtCookie) {
      throw new Error('No authorization token found');
    }

    const authToken = naukAtCookie.value;
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    console.log('Login successful.\n');

    // Search for jobs using the same parameters as the webapp
    console.log('=== Searching for jobs ===');
    const searchParams = new URLSearchParams({
      noOfResults: '20',
      urlType: 'search_by_key_loc',
      searchType: 'adv',
      keyword: 'react developer',
      location: "pune, mumbai, bengaluru, bangalore",
      pageNo: '1',
      sort: 'p',
      k: 'react developer',
      l: "pune, mumbai, bengaluru, bangalore",
      nignbevent_src: 'jobsearchDeskGNB',
      src: 'cluster',
      latLong: '18.7506117_73.8764436',
      sid: '17143714288347830_8',
      experience: '3',
      ctctFilter: '6to10',
      ctctFilter: '10to15',
      ctctFilter: '15to25',
      ctctFilter: '25to50',
      ctctFilter: '50to75',
      ctctFilter: '75to100'
    });

    const searchResponse = await fetch(`https://www.naukri.com/jobapi/v3/search?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'appid': '121',
        'cache-control': 'no-cache',
        'clientid': 'd3skt0p',
        'content-type': 'application/json',
        'gid': 'LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE',
        'pragma': 'no-cache',
        'priority': 'u=1, i',
        'nkparam': 'jH9QnltH+MuGKLwVCzx6nuqLOex1fiLfmrNahP7GLA0SQihJC6d0hDFoJXV65lyEzWcAjLQ7SuUTKBlHw4Artw==',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest',
        'systemid': 'Naukri',
        'Referer-Policy': 'strict-origin-when-cross-origin',
        'authorization': `Bearer ${authToken}`,
        'cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    const searchData = await searchResponse.json();
    console.log('Search completed. Found', searchData.jobDetails?.length || 0, 'jobs\n');

    if (!searchData.jobDetails || searchData.jobDetails.length === 0) {
      console.log('No jobs found in search results');
      return;
    }

    // Analyze each job for external detection (simulating the webapp logic)
    const jobAnalysis = [];
    let externalCount = 0;
    let internalCount = 0;

    for (const jobData of searchData.jobDetails.slice(0, 10)) { // Test first 10 jobs
      // Detailed external detection with reasons
      const reasons = [];

      if (jobData.applyUrl) {
        reasons.push('applyUrl present');
      }
      if (jobData.isExternal === true) {
        reasons.push('isExternal=true');
      }
      if (jobData.applicationType === 'external') {
        reasons.push('applicationType=external');
      }
      if (jobData.mode === 'external') {
        reasons.push('mode=external');
      }
      if (jobData.staticUrl && jobData.staticUrl.startsWith('http') && (
        jobData.staticUrl.includes('.com') ||
        jobData.staticUrl.includes('.org') ||
        jobData.staticUrl.includes('.net') ||
        !jobData.staticUrl.includes('naukri.com')
      )) {
        reasons.push('staticUrl is external domain');
      }
      if (jobData.footerPlaceholderLabel && (
        jobData.footerPlaceholderLabel.toLowerCase().includes('external') ||
        jobData.footerPlaceholderLabel.toLowerCase().includes('web job') ||
        jobData.footerPlaceholderLabel.toLowerCase().includes('posted on external')
      )) {
        reasons.push('footerPlaceholderLabel contains external text');
      }
      if (jobData.placeholders && jobData.placeholders.some(p =>
        p && typeof p === 'string' && (
          p.toLowerCase().includes('external') ||
          p.toLowerCase().includes('web job') ||
          p.toLowerCase().includes('posted on external')
        )
      )) {
        reasons.push('placeholders contain external text');
      }
      if (jobData.title && (
        jobData.title.toLowerCase().includes('external') ||
        jobData.title.toLowerCase().includes('web job')
      )) {
        reasons.push('title contains external text');
      }
      if (jobData.jobDescription && (
        jobData.jobDescription.toLowerCase().includes('external site') ||
        jobData.jobDescription.toLowerCase().includes('posted on external') ||
        jobData.jobDescription.toLowerCase().includes('apply externally')
      )) {
        reasons.push('jobDescription contains external text');
      }

      const hasExternalApplication = reasons.length > 0;

      const analysis = {
        jobId: jobData.jobId,
        title: jobData.title?.substring(0, 50),
        company: jobData.companyName,
        isExternal: hasExternalApplication,
        reasons: reasons,
        applyUrl: !!jobData.applyUrl,
        staticUrl: jobData.staticUrl?.substring(0, 50),
        applicationType: jobData.applicationType,
        mode: jobData.mode,
        isExternalFlag: jobData.isExternal
      };

      jobAnalysis.push(analysis);

      if (hasExternalApplication) {
        externalCount++;
      } else {
        internalCount++;
      }
    }

    // Display results
    console.log('=== BATCH PROCESSING RESULTS ===');
    console.log(`Total jobs analyzed: ${jobAnalysis.length}`);
    console.log(`External jobs: ${externalCount}`);
    console.log(`Internal jobs: ${internalCount}`);
    console.log(`External percentage: ${((externalCount / jobAnalysis.length) * 100).toFixed(1)}%\n`);

    console.log('=== SAMPLE JOB ANALYSIS ===');
    jobAnalysis.slice(0, 5).forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} (${job.company})`);
      console.log(`   Job ID: ${job.jobId}`);
      console.log(`   External: ${job.isExternal ? 'YES' : 'NO'}`);
      if (job.reasons.length > 0) {
        console.log(`   Reasons: ${job.reasons.join(', ')}`);
      }
      if (job.applyUrl) console.log(`   Has applyUrl: YES`);
      if (job.staticUrl) console.log(`   staticUrl: ${job.staticUrl}`);
      if (job.applicationType) console.log(`   applicationType: ${job.applicationType}`);
      console.log('');
    });

    // Summary
    if (externalCount > 0 && internalCount > 0) {
      console.log('✅ SUCCESS: System correctly identifies both external and internal jobs');
      console.log('✅ Batch processing will skip external jobs and process internal ones');
    } else if (externalCount === 0) {
      console.log('ℹ️  No external jobs found in this batch - all jobs are internal');
    } else if (internalCount === 0) {
      console.log('⚠️  All jobs detected as external - may indicate over-detection');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBatchProcessing();