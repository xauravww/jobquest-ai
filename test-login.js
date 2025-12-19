import { NaukriService } from './src/services/NaukriService.ts';

async function testLogin() {
  const naukri = new NaukriService();
  try {
    const tokens = await naukri.login('sauravmaheshwari8@gmail.com', 'Job@98120');
    console.log('Login successful:', tokens);
    console.log('Cookies from API:', tokens.cookies);
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}

testLogin();