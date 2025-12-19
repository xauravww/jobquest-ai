async function testJobApplication() {
  const jobId = process.argv[2] || '181225915045'; // Use the failing job ID
  const email = process.argv[3];
  const password = process.argv[4];

  if (!email || !password) {
    console.error('Usage: npx ts-node test-apply.ts <jobId> <email> <password>');
    process.exit(1);
  }

  console.log(`Testing job application for job ${jobId} (same as failing webapp request)`);

  try {
    // Test CLI method with fresh login
    console.log('\n=== Testing CLI Method (Fresh Login) ===');
    const cliStart = Date.now();

    // First login via CLI-like approach
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
        username: email,
        password: password
      }),
    });

    const loginData = await loginResponse.json();
    if (loginData.userStateInfo?.userState !== 'AUTHENTICATED') {
      throw new Error('CLI login failed');
    }

    const cookies = loginData.cookies || [];
    const naukAtCookie = cookies.find((c: any) => c.name === 'nauk_at');
    if (!naukAtCookie) {
      throw new Error('CLI login failed: No authorization token');
    }

    const authToken = naukAtCookie.value;
    const cookieString = cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');

    console.log('Fresh CLI Login Details:');
    console.log('Auth Token Length:', authToken.length);
    console.log('Cookie Count:', cookieString.split(';').length);
    console.log('Cookies include:', cookies.map((c: any) => c.name).join(', '));

    // Now apply using CLI method (string concatenation like original CLI)
    const bodyStr = `{"strJobsarr":["${jobId}"],"applyData":{}}`;
    const fullBody = `${bodyStr},"logstr":"--drecomm_profile-2-F-0-1--17140801091455348-","flowtype":"show","crossdomain":true,"jquery":1,"rdxMsgId":"","chatBotSDK":true,"mandatory_skills":["CSS","HTML","React.Js"],"optional_skills":["Typescript","Angular"],"applyTypeId":"107","closebtn":"y","applySrc":"drecomm_profile","sid":"17140801091455348","mid":""}`;

    console.log('\nCLI Apply Request:');
    console.log('Body:', fullBody);

    const applyResponse = await fetch('https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/apply', {
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
        'systemid': 'Naukri',
        'Referer-Policy': 'strict-origin-when-cross-origin',
        'authorization': `Bearer ${authToken}`,
        'cookie': cookieString
      },
      body: fullBody
    });

    const cliResult = await applyResponse.json();
    const cliTime = Date.now() - cliStart;

    console.log('\nCLI Results:');
    console.log('Status:', applyResponse.status);
    console.log('Response:', cliResult);
    console.log(`Time: ${cliTime}ms`);

    // Compare with webapp logs
    console.log('\n=== Comparison with Webapp (from logs) ===');
    console.log('Webapp Status: 401');
    console.log('Webapp Auth Token (first 50 chars):', 'eyJraWQiOiIzIiwidHlwIjoiSldUIiwiYWxnIjoiUlM1MTIifQ.eyJkZXZpY2VUeXBlIjoiZDNza3QwcCIsInVkX3Jlc0lkIjoyNTI0NTE0NTIsInN1YiI6IjI2MzQ3NTY3NiIsInVkX3VzZXJuYW1lIjoic2F1cmF2bWFoZXNod2FyaThAZ21haWwuY29tIiwidWRfaXNFbWFpbCI6dHJ1ZSwiaXNzIjoiSW5mb0VkZ2UgSW5kaWEgUHZ0LiBMdGQuIiwidXNlckFnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyNC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiaXBBZHJlc3MiOiIyNDA5OjQwOTA6OTA0Zjo5MjBiOmE1ZmU6ZDg3YzozMTgzOmRlZjAiLCJ1ZF9pc1RlY2hPcHNMb2dpbiI6ZmFsc2UsInVzZXJJZCI6MjYzNDc1Njc2LCJzdWJVc2VyVHlwZSI6ImpvYnNlZWtlciIsInVzZXJTdGF0ZSI6IkFVVEhFTlRJQ0FURUQiLCJ1ZF9pc1BhaWRDbGllbnQiOmZhbHNlLCJ1ZF9lbWFpbFZlcmlmaWVkIjp0cnVlLCJ1c2VyVHlwZSI6ImpvYnNlZWtlciIsInNlc3Npb25TdGF0VGltZSI6IjIwMjUtMTItMTlUMjE6NTU6MTUiLCJ1ZF9lbWFpbCI6InNhdXJhdm1haGVzaHdhcmk4QGdtYWlsLmNvbSIsInVzZXJSb2xlIjoidXNlciIsImV4cCI6MTc2NjE2NTExNSwidG9rZW5UeXBlIjoiYWNjZXNzVG9rZW4iLCJpYXQiOjE3NjYxNjE1MTUsImp0aSI6IjVmOWVlMTBjMzY2MjQ0NTliYmRjYTQ1MTNlZDE5OTIyIiwicG9kSWQiOiJwcm9kLTY2Yzc1OTk4ZDQtY21xZHcifQ.lzITlviJu2BC9JdYAkbRuim-uytacp4DIQ3a4WGktmNuUyJe9hl3LxtykJiM5WwoA_zLpXLhKEeQG8rl6Q014-LQEEKDddggNTB5WAzlKK4vDuqLkWPTgq29gXziuiLwD8fS_YZdTZ4I0r9jvvhHJk2l6w_ajKnc580J4W77yzu-ZBKUOBfOuOFjmEfkAovXKk6lWPV2xHEKMho5_kbBI6ORtlR0e_yjdGtgiMYxHyRMLh2bJ2wXB3PLbPfAy9Pd1bl_N1fbX3NvHvqmrnutCw6lTlhG162IK5P38ifgddcHtrJGdAEMaAJYWigd13pGwzeenNraaXA910k9Uey5Rg');
    console.log('Webapp Cookie Count: ~15+ cookies');
    console.log('\nLikely Issues:');
    console.log('1. Token Expiration: Webapp token may be expired');
    console.log('2. Missing Session Cookies: CLI has more/fresher cookies');
    console.log('3. Body Format: CLI uses string concat, webapp now uses JSON.stringify');
    console.log('4. Timing: Webapp may be using stale session data');

  } catch (error: any) {
    console.error('Test failed:', error.message);
  }
}

testJobApplication();