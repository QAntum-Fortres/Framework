/**
 * 🧪 MASTER TEST RUNNER - MISTER MIND
 * Runs all test suites and provides summary
 */

const { spawn } = require('child_process');
const path = require('path');

const TEST_SUITES = [
  { name: 'Audit (FREE)', file: 'audit.test.js' },
  { name: 'Check Links (FREE)', file: 'checkLinks.test.js' },
  { name: 'Test API (FREE)', file: 'testAPI.test.js' },
  { name: 'Predict (PRO)', file: 'predict.test.js' },
  { name: 'API Sensei (PRO)', file: 'apiSensei.test.js' },
  { name: 'Chronos Engine (PRO)', file: 'chronos.test.js' }
];

async function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, testFile);
    const child = spawn('node', [testPath], { stdio: 'pipe' });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      // Parse results from output
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      
      resolve({
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        success: code === 0,
        output
      });
    });
  });
}

async function runAllTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    🧠 MISTER MIND - MASTER TEST SUITE                         ║');
  console.log('║                         Full Implementation Tests                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of TEST_SUITES) {
    console.log(`\n📦 Running: ${suite.name}...`);
    console.log('─'.repeat(70));
    
    const result = await runTest(suite.file);
    results.push({ ...suite, ...result });
    
    totalPassed += result.passed;
    totalFailed += result.failed;
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${suite.name}: ${result.passed} passed, ${result.failed} failed`);
  }

  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                              📊 FINAL SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  console.log('FREE Tier Functions:');
  console.log('─'.repeat(50));
  results.filter(r => !r.name.includes('PRO')).forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.name}: ${r.passed}/${r.passed + r.failed} tests`);
  });

  console.log('');
  console.log('PRO Tier Functions:');
  console.log('─'.repeat(50));
  results.filter(r => r.name.includes('PRO')).forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.name}: ${r.passed}/${r.passed + r.failed} tests`);
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  const overallStatus = totalFailed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED';
  console.log(`  ${overallStatus}`);
  console.log(`  Total: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  process.exit(totalFailed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Master test runner error:', error);
  process.exit(1);
});
