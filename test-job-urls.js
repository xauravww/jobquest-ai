async function testJobUrls() {
  const externalJobId = '191125931638'; // company redirecting
  const internalJobId = '191225002425'; // naukri inbuilt

  console.log('Testing direct job URL fetching to compare external vs internal jobs\n');

  let authToken, cookieString;

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

    authToken = naukAtCookie.value;
    cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    console.log('Login successful. Got auth token and cookies.\n');

    // Test external job URL
    console.log(`=== Testing External Job URL: https://www.naukri.com/job-listings-${externalJobId} ===`);
    const externalUrlResponse = await fetch(`https://www.naukri.com/job-listings-${externalJobId}`, {
      method: 'GET',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log('External Job URL Response:');
    console.log('Status:', externalUrlResponse.status);
    console.log('Status Text:', externalUrlResponse.statusText);
    console.log('Location header:', externalUrlResponse.headers.get('location'));
    console.log('Content-Type:', externalUrlResponse.headers.get('content-type'));

    if (externalUrlResponse.status >= 300 && externalUrlResponse.status < 400) {
      console.log('REDIRECT DETECTED! This is likely an external job.');
    }

    // Get a small sample of the response
    const externalText = await externalUrlResponse.text();
    console.log('Response length:', externalText.length);
    console.log('First 500 chars:', externalText.substring(0, 500));
    console.log('');

    // Test internal job URL
    console.log(`=== Testing Internal Job URL: https://www.naukri.com/job-listings-${internalJobId} ===`);
    const internalUrlResponse = await fetch(`https://www.naukri.com/job-listings-${internalJobId}`, {
      method: 'GET',
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
        'cache-control': 'no-cache',
        'pragma': 'no-cache',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log('Internal Job URL Response:');
    console.log('Status:', internalUrlResponse.status);
    console.log('Status Text:', internalUrlResponse.statusText);
    console.log('Location header:', internalUrlResponse.headers.get('location'));
    console.log('Content-Type:', internalUrlResponse.headers.get('content-type'));

    if (internalUrlResponse.status >= 300 && internalUrlResponse.status < 400) {
      console.log('REDIRECT DETECTED! This might be an external job.');
    }

    // Get a small sample of the response
    const internalText = await internalUrlResponse.text();
    console.log('Response length:', internalText.length);
    console.log('First 500 chars:', internalText.substring(0, 500));
    console.log('');

    // Comparison
    console.log('=== COMPARISON ===');
    console.log('External job response:');
    console.log('- Status:', externalUrlResponse.status);
    console.log('- Has redirect:', externalUrlResponse.status >= 300 && externalUrlResponse.status < 400);
    console.log('- Location:', externalUrlResponse.headers.get('location') || 'None');

    console.log('\nInternal job response:');
    console.log('- Status:', internalUrlResponse.status);
    console.log('- Has redirect:', internalUrlResponse.status >= 300 && internalUrlResponse.status < 400);
    console.log('- Location:', internalUrlResponse.headers.get('location') || 'None');

    if (externalUrlResponse.status >= 300 && externalUrlResponse.status < 400 && internalUrlResponse.status < 300) {
      console.log('\n✅ CONFIRMED: External job redirects, internal job serves content directly');
    } else if (internalUrlResponse.status >= 300 && internalUrlResponse.status < 400 && externalUrlResponse.status < 300) {
      console.log('\n❌ UNEXPECTED: Internal job redirects, external job serves content');
    } else {
      console.log('\n🤔 No clear redirect pattern detected');
    }

    // Now test job details API for both jobs
    console.log(`=== Testing External Job Details API: ${externalJobId} ===`);
    const externalDetailsResponse = await fetch(`https://www.naukri.com/jobapi/v4/job/${externalJobId}?microsite=y&src=jobsearchDesk&sid=17140801091455348&xp=1&px=1`, {
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
        'cookie': cookieString
      },
    });

    const externalDetails = await externalDetailsResponse.json();
    console.log('External Job Details API Response:');
    console.log('Status:', externalDetailsResponse.status);
    console.log('Key fields:');
    console.log('- isExternal:', externalDetails.isExternal);
    console.log('- applicationType:', externalDetails.applicationType);
    console.log('- mode:', externalDetails.mode);
    console.log('- applyUrl:', externalDetails.applyUrl);
    console.log('- staticUrl:', externalDetails.staticUrl);
    console.log('- applyFlow:', externalDetails.applyFlow);
    console.log('- jobDescription preview:', externalDetails.jobDescription?.substring(0, 100));
    console.log('');

    // Test internal job details API
    console.log(`=== Testing Internal Job Details API: ${internalJobId} ===`);
    const internalDetailsResponse = await fetch(`https://www.naukri.com/jobapi/v4/job/${internalJobId}?microsite=y&src=jobsearchDesk&sid=17140801091455348&xp=1&px=1`, {
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
        'cookie': cookieString
      },
    });

    const internalDetails = await internalDetailsResponse.json();
    console.log('Internal Job Details API Response:');
    console.log('Status:', internalDetailsResponse.status);
    console.log('Key fields:');
    console.log('- isExternal:', internalDetails.isExternal);
    console.log('- applicationType:', internalDetails.applicationType);
    console.log('- mode:', internalDetails.mode);
    console.log('- applyUrl:', internalDetails.applyUrl);
    console.log('- staticUrl:', internalDetails.staticUrl);
    console.log('- applyFlow:', internalDetails.applyFlow);
    console.log('- jobDescription preview:', internalDetails.jobDescription?.substring(0, 100));
    console.log('');

    // Detailed comparison
    console.log('=== DETAILED API COMPARISON ===');
    const differences = [];

    if (externalDetails.isExternal !== internalDetails.isExternal) {
      differences.push(`isExternal: ${externalDetails.isExternal} vs ${internalDetails.isExternal}`);
    }
    if (externalDetails.applicationType !== internalDetails.applicationType) {
      differences.push(`applicationType: ${externalDetails.applicationType} vs ${internalDetails.applicationType}`);
    }
    if (externalDetails.mode !== internalDetails.mode) {
      differences.push(`mode: ${externalDetails.mode} vs ${internalDetails.mode}`);
    }
    if (externalDetails.applyUrl !== internalDetails.applyUrl) {
      differences.push(`applyUrl: ${!!externalDetails.applyUrl} vs ${!!internalDetails.applyUrl}`);
    }
    if (externalDetails.staticUrl !== internalDetails.staticUrl) {
      differences.push(`staticUrl: ${!!externalDetails.staticUrl} vs ${!!internalDetails.staticUrl}`);
    }
    if (externalDetails.applyFlow !== internalDetails.applyFlow) {
      differences.push(`applyFlow: ${externalDetails.applyFlow} vs ${internalDetails.applyFlow}`);
    }

    if (differences.length > 0) {
      console.log('🔍 Key differences found:');
      differences.forEach(diff => console.log(`- ${diff}`));

      // Check which one should be external
      const externalIsActuallyExternal = externalDetails.isExternal || externalDetails.applicationType === 'external' ||
                                       externalDetails.mode === 'external' || externalDetails.applyUrl ||
                                       externalDetails.applyFlow === 'external';

      const internalIsActuallyExternal = internalDetails.isExternal || internalDetails.applicationType === 'external' ||
                                       internalDetails.mode === 'external' || internalDetails.applyUrl ||
                                       internalDetails.applyFlow === 'external';

      console.log(`\nExternal job (${externalJobId}) is actually external: ${externalIsActuallyExternal}`);
      console.log(`Internal job (${internalJobId}) is actually external: ${internalIsActuallyExternal}`);

      if (externalIsActuallyExternal && !internalIsActuallyExternal) {
        console.log('\n✅ API data confirms the difference!');
      } else if (!externalIsActuallyExternal && internalIsActuallyExternal) {
        console.log('\n❌ API data suggests the opposite!');
      } else {
        console.log('\n🤔 API data doesn\'t clearly distinguish them');
      }
    } else {
      console.log('No differences found in key API fields');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testJobUrls();