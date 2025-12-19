async function testJobDetails() {
  const externalJobId = '191125931638'; // company redirecting
  const internalJobId = '191225002425'; // naukri inbuilt

  console.log('Testing job details for external vs internal jobs\n');

  try {
    // Login to get tokens
    console.log('=== Logging in to get tokens ===');
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
        username: process.env.NAUKRI_EMAIL,
        password: process.env.NAUKRI_PASSWORD
      }),
    });

    const loginData = await loginResponse.json();
    if (loginData.userStateInfo?.userState !== 'AUTHENTICATED') {
      throw new Error('Login failed');
    }

    const cookies = loginData.cookies || [];
    const naukAtCookie = cookies.find((c: any) => c.name === 'nauk_at');
    if (!naukAtCookie) {
      throw new Error('No authorization token');
    }

    const authToken = naukAtCookie.value;
    const cookieString = cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');

    console.log('Login successful. Got tokens.\n');

    // Test external job
    console.log(`=== Testing External Job: ${externalJobId} ===`);
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
    console.log('External Job Details:');
    console.log('Status:', externalDetailsResponse.status);
    console.log('Keys:', Object.keys(externalDetails));
    console.log('isExternal:', externalDetails.isExternal);
    console.log('applicationType:', externalDetails.applicationType);
    console.log('mode:', externalDetails.mode);
    console.log('applyUrl:', externalDetails.applyUrl);
    console.log('staticUrl:', externalDetails.staticUrl);
    console.log('applyFlow:', externalDetails.applyFlow);
    console.log('jobDescription (first 100 chars):', externalDetails.jobDescription?.substring(0, 100));
    console.log('');

    // Test internal job
    console.log(`=== Testing Internal Job: ${internalJobId} ===`);
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
    console.log('Internal Job Details:');
    console.log('Status:', internalDetailsResponse.status);
    console.log('Keys:', Object.keys(internalDetails));
    console.log('isExternal:', internalDetails.isExternal);
    console.log('applicationType:', internalDetails.applicationType);
    console.log('mode:', internalDetails.mode);
    console.log('applyUrl:', internalDetails.applyUrl);
    console.log('staticUrl:', internalDetails.staticUrl);
    console.log('applyFlow:', internalDetails.applyFlow);
    console.log('jobDescription (first 100 chars):', internalDetails.jobDescription?.substring(0, 100));
    console.log('');

    // Compare differences
    console.log('=== COMPARISON ===');
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
      console.log('Key differences:');
      differences.forEach(diff => console.log(`- ${diff}`));
    } else {
      console.log('No obvious differences in key fields');
    }

  } catch (error: any) {
    console.error('Test failed:', error.message);
  }
}

testJobDetails();