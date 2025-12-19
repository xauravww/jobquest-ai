import { NaukriService } from './src/services/NaukriService.ts';

async function testSearchAndApply() {
  const naukri = new NaukriService();
  try {
    console.log('Logging in...');
    const tokens = await naukri.login('sauravmaheshwari8@gmail.com', 'Job@98120');
    console.log('Login successful');

    console.log('Searching jobs...');
    const searchResult = await naukri.searchJobs({ keyword: 'nodejs', location: 'pune' }, tokens);
    console.log('Search successful, found jobs:', searchResult.jobDetails?.length);

    if (searchResult.jobDetails && searchResult.jobDetails.length > 0) {
      const jobId = searchResult.jobDetails[0].jobId;
      console.log('Applying to job:', jobId);
      const applyResult = await naukri.applyJob(jobId, tokens);
      console.log('Apply result:', applyResult);
    } else {
      console.log('No jobs found to apply');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSearchAndApply();