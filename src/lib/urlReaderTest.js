import { fetchAndConvertToMarkdown } from './urlReader.js';

async function testUrlReader() {
  const testUrl = 'https://in.indeed.com/cmp/Kotech-Solutions?from=mobviewjob&tk=1j4t619l7hbvn803&fromjk=1d70ce43e9be96e6&attributionid=mobvjcmp'; // Replace with any URL you want to test

  try {
    console.log('Testing URL reader with:', testUrl);
    const markdown = await fetchAndConvertToMarkdown(testUrl);
    console.log('--- Markdown Content ---');
    console.log(markdown);
    console.log('--- Test completed successfully ---');
  } catch (error) {
    console.error('Error during URL reading test:', error.message);
  }
}

testUrlReader();
