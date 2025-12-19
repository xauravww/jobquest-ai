// Test the job ID pattern detection
function testJobIdPattern() {
  const testJobs = [
    { jobId: '191125931638', expected: true, description: 'External job with 259 pattern' },
    { jobId: '191225002425', expected: false, description: 'Internal job without 259 pattern' },
    { jobId: '191125932592', expected: true, description: 'Another external job with 259' },
    { jobId: '191225003421', expected: false, description: 'Another internal job' },
  ];

  console.log('Testing Job ID Pattern Detection (259 indicates external):\n');

  testJobs.forEach(job => {
    const has259 = job.jobId.toString().includes('259');
    const result = has259 ? 'EXTERNAL' : 'INTERNAL';
    const expected = job.expected ? 'EXTERNAL' : 'INTERNAL';
    const status = has259 === job.expected ? '✅ PASS' : '❌ FAIL';

    console.log(`${status} ${job.description}`);
    console.log(`  Job ID: ${job.jobId}`);
    console.log(`  Contains '259': ${has259}`);
    console.log(`  Detected as: ${result} (Expected: ${expected})`);
    console.log('');
  });
}

testJobIdPattern();