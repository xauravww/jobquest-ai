// Test external URL construction logic
function testExternalUrlConstruction() {
  console.log('Testing external URL construction logic\n');

  // Simulate job data with different URL scenarios
  const testJobs = [
    {
      name: 'Internal job with Naukri URL',
      jobId: '123456789012',
      applyUrl: null,
      staticUrl: 'naukri-company-jobs-12345',
      expectedUrl: 'https://www.naukri.com/job-listings-123456789012',
      expectedExternal: false
    },
    {
      name: 'External job with company careers URL',
      jobId: '123456789013',
      applyUrl: 'https://careers.company.com/job/123',
      staticUrl: 'company-jobs-67890',
      expectedUrl: 'https://careers.company.com/job/123',
      expectedExternal: true
    },
    {
      name: 'External job with Naukri staticUrl',
      jobId: '123456789014',
      applyUrl: null,
      staticUrl: 'https://www.naukri.com/jobs/company-job-123',
      expectedUrl: 'https://www.naukri.com/jobs/company-job-123',
      expectedExternal: false // Should not be external since it's naukri.com
    },
    {
      name: 'External job with external domain staticUrl',
      jobId: '123456789015',
      applyUrl: null,
      staticUrl: 'https://jobs.externalcompany.com/position/456',
      expectedUrl: 'https://jobs.externalcompany.com/position/456',
      expectedExternal: true
    },
    {
      name: 'Job with no URLs',
      jobId: '123456789016',
      applyUrl: null,
      staticUrl: null,
      expectedUrl: 'https://www.naukri.com/job-listings-123456789016',
      expectedExternal: false
    }
  ];

  console.log('=== URL CONSTRUCTION TEST RESULTS ===\n');

  testJobs.forEach((testJob, index) => {
    // Simulate the URL construction logic from the search route
    const externalApplyUrl = testJob.applyUrl || (testJob.staticUrl && testJob.staticUrl.startsWith('http') ? testJob.staticUrl : null);
    const constructedUrl = externalApplyUrl || `https://www.naukri.com/job-listings-${testJob.jobId}`;

    // Simulate external detection
    const hasExternalApplication = !!testJob.applyUrl ||
      !!(testJob.staticUrl && testJob.staticUrl.startsWith('http') &&
         !testJob.staticUrl.includes('naukri.com') && (
          testJob.staticUrl.includes('.com') ||
          testJob.staticUrl.includes('.org') ||
          testJob.staticUrl.includes('.net')
        ));

    const urlMatch = constructedUrl === testJob.expectedUrl;
    const externalMatch = hasExternalApplication === testJob.expectedExternal;
    const status = (urlMatch && externalMatch) ? '✅ PASS' : '❌ FAIL';

    console.log(`${index + 1}. ${status} ${testJob.name}`);
    console.log(`   Job ID: ${testJob.jobId}`);
    console.log(`   applyUrl: ${testJob.applyUrl || 'null'}`);
    console.log(`   staticUrl: ${testJob.staticUrl || 'null'}`);
    console.log(`   Constructed URL: ${constructedUrl}`);
    console.log(`   Expected URL: ${testJob.expectedUrl}`);
    console.log(`   Is External: ${hasExternalApplication ? 'true' : 'false'} (Expected: ${testJob.expectedExternal ? 'true' : 'false'})`);
    console.log(`   Debug - hasExternalApplication: ${hasExternalApplication}, expectedExternal: ${testJob.expectedExternal}, equal: ${hasExternalApplication === testJob.expectedExternal}`);

    if (constructedUrl !== testJob.expectedUrl) {
      console.log(`   ❌ URL mismatch!`);
    }
    if (hasExternalApplication !== testJob.expectedExternal) {
      console.log(`   ❌ External detection mismatch!`);
    }

    console.log('');
  });

  console.log('=== SUMMARY ===');
  const allPassed = testJobs.every(job => {
    const externalApplyUrl = job.applyUrl || (job.staticUrl && job.staticUrl.startsWith('http') ? job.staticUrl : null);
    const constructedUrl = externalApplyUrl || `https://www.naukri.com/job-listings-${job.jobId}`;
    const hasExternalApplication = !!job.applyUrl ||
      !!(job.staticUrl && job.staticUrl.startsWith('http') &&
         !job.staticUrl.includes('naukri.com') && (
          job.staticUrl.includes('.com') ||
          job.staticUrl.includes('.org') ||
          job.staticUrl.includes('.net')
        ));

    return constructedUrl === job.expectedUrl && hasExternalApplication === job.expectedExternal;
  });

  if (allPassed) {
    console.log('✅ All URL construction tests passed!');
    console.log('✅ External job URLs will be properly constructed and validated.');
  } else {
    console.log('❌ Some URL construction tests failed.');
  }
}

testExternalUrlConstruction();