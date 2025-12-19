// Test different API endpoints to get questionnaire data
async function testQuestionnaireApis() {
  const jobId = '171225038531';
  const resId = '252451452';
  const id = '263475676';

  console.log('Testing different API endpoints for questionnaire data\n');

  try {
    // Login to get tokens first
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

    // Test different questionnaire API endpoints
    const endpoints = [
      {
        name: 'Questionnaire API with resId',
        url: `https://www.naukri.com/cloudgateway-workflow/workflow-services/questionnaire/${resId}`,
        method: 'GET'
      },
      {
        name: 'Questionnaire API with jobId',
        url: `https://www.naukri.com/cloudgateway-workflow/workflow-services/questionnaire/job/${jobId}`,
        method: 'GET'
      },
      {
        name: 'Apply questionnaire endpoint',
        url: 'https://www.naukri.com/cloudgateway-workflow/workflow-services/apply-workflow/v1/get-questionnaire',
        method: 'POST',
        body: JSON.stringify({ jobId, resId, id })
      },
      {
        name: 'Job details API (might have questionnaire)',
        url: `https://www.naukri.com/jobapi/v4/job/${jobId}?microsite=y&src=jobsearchDesk&sid=17140801091455348&xp=1&px=1`,
        method: 'GET'
      }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`=== Testing: ${endpoint.name} ===`);
        console.log(`URL: ${endpoint.url}`);
        console.log(`Method: ${endpoint.method}`);

        const response = await fetch(endpoint.url, {
          method: endpoint.method,
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
          body: endpoint.body
        });

        console.log(`Response Status: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log('Response Data Keys:', Object.keys(data));

          if (data.questionnaire) {
            console.log('✅ SUCCESS: Found questionnaire!');
            console.log('Questionnaire length:', data.questionnaire.length);
            console.log('Questions:', data.questionnaire.map(q => q.questionName));
            return; // Found it, stop testing
          } else if (data.questions) {
            console.log('✅ SUCCESS: Found questions!');
            console.log('Questions length:', data.questions.length);
            return;
          } else {
            console.log('❌ No questionnaire in response');
            console.log('First level keys:', Object.keys(data));
          }
        } else {
          const errorText = await response.text();
          console.log('❌ Request failed:', errorText.substring(0, 200));
        }

        console.log('');

      } catch (error) {
        console.log(`❌ Error testing ${endpoint.name}:`, error.message);
        console.log('');
      }
    }

    console.log('❌ No questionnaire endpoint found');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testQuestionnaireApis();