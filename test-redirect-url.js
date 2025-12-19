// Test the redirect URL to see if it contains questionnaire data
async function testRedirectUrl() {
  const redirectUrl = 'https://www.naukri.com/myapply/saveApply?strJobsarr=[171225038531]&applytype=single&resId=252451452&ApplyMode=1&id=263475676&src=d3skt0p&logstr=--drecomm_profile-2-F-0-1--17140801091455348--drecomm_profile&applySrc=drecomm_profile&multiApplyResp=%7B%22171225038531%22%3A406%7D';

  console.log('Testing redirect URL for questionnaire data\n');

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

    // Test the redirect URL
    console.log('=== Testing Redirect URL ===');
    console.log('URL:', redirectUrl);

    const redirectResponse = await fetch(redirectUrl, {
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
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'cookie': cookieString,
        'authorization': `Bearer ${authToken}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      redirect: 'manual'
    });

    console.log('Redirect Response:');
    console.log('Status:', redirectResponse.status);
    console.log('Status Text:', redirectResponse.statusText);
    console.log('Location header:', redirectResponse.headers.get('location'));
    console.log('Content-Type:', redirectResponse.headers.get('content-type'));

    if (redirectResponse.status >= 300 && redirectResponse.status < 400) {
      console.log('REDIRECT detected - following redirect...');

      const location = redirectResponse.headers.get('location');
      if (location) {
        console.log('Following redirect to:', location);

        const followResponse = await fetch(location, {
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
            'sec-fetch-site': 'same-origin',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'cookie': cookieString,
            'authorization': `Bearer ${authToken}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          redirect: 'manual'
        });

        console.log('Follow Response:');
        console.log('Status:', followResponse.status);
        console.log('Content-Type:', followResponse.headers.get('content-type'));

        const html = await followResponse.text();
        console.log('HTML Length:', html.length);

        // Check if HTML contains questionnaire data
        if (html.includes('questionnaire') || html.includes('applyData') || html.includes('validationError')) {
          console.log('✅ HTML contains application-related content');
          // Look for questionnaire JSON in the HTML
          const questionnaireMatch = html.match(/questionnaire[^}]*}/g);
          if (questionnaireMatch) {
            console.log('Found questionnaire data in HTML:', questionnaireMatch);
          }
        } else {
          console.log('❌ HTML does not contain questionnaire data');
          console.log('First 1000 chars:', html.substring(0, 1000));
        }
      }
    } else {
      const html = await redirectResponse.text();
      console.log('Response HTML length:', html.length);
      console.log('First 500 chars:', html.substring(0, 500));

      // Check for questionnaire data in HTML
      if (html.includes('questionnaire')) {
        console.log('✅ Found questionnaire in direct response');
      } else {
        console.log('❌ No questionnaire found in direct response');
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRedirectUrl();