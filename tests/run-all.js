/**
 * 🧪 SIMPLE TEST RUNNER - MISTER MIND
 * Runs unit tests only - no network calls, no hanging
 */

const { spawn } = require('child_process');
const path = require('path');

const TEST_TIMEOUT = 120000; // 2 minutes max per test file

async function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(__dirname, testFile);
    const child = spawn(process.execPath, [testPath], { 
      stdio: 'pipe',
      timeout: TEST_TIMEOUT
    });
    
    let output = '';
    
    // Kill after timeout
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({
        passed: 0,
        failed: 1,
        success: false,
        output: 'TIMEOUT - Test killed after ' + (TEST_TIMEOUT/1000) + 's'
      });
    }, TEST_TIMEOUT);
    
    child.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text);
      output += text;
    });
    
    child.stderr.on('data', (data) => {
      const text = data.toString();
      process.stderr.write(text);
      output += text;
    });
    
    child.on('close', (code) => {
      clearTimeout(timer);
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      
      resolve({
        passed: passedMatch ? parseInt(passedMatch[1]) : 0,
        failed: failedMatch ? parseInt(failedMatch[1]) : 0,
        success: code === 0,
        output
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        passed: 0,
        failed: 1,
        success: false,
        output: 'Error: ' + err.message
      });
    });
  });
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         🧠 MISTER MIND - TEST RUNNER                 ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  const result = await runTest('unit.test.js');
  
  console.log('');
  if (result.success) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed.');
  }
  
  process.exit(result.success ? 0 : 1);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
