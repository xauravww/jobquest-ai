import { NaukriService } from './src/services/NaukriService';

async function testLogin() {
  const naukri = new NaukriService();
  try {
    const tokens = await naukri.login('sauravmaheshwari8@gmail.com', 'tesrtpass');
    console.log('Login successful:', tokens);
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}

testLogin();