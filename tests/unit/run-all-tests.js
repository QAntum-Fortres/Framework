/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🚀 SOVEREIGN SINGULARITY - MASTER TEST RUNNER (FAST MODE)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Usage: node run-all-tests.js [phase]
 *   phase: 1, 2, 3, or all (default: all)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Quick header
console.log('\n🚀 SOVEREIGN SINGULARITY - MASTER TEST RUNNER\n');

const phase = process.argv[2] || 'all';

const allTests = {
  '1': [
    { name: 'Phase 1A', file: 'phase1-core.test.js' },
    { name: 'Phase 1B', file: 'phase1-advanced.test.js' },
    { name: 'Phase 1C', file: 'phase1-integration.test.js' }
  ],
  '2': [
    { name: 'Phase 2A', file: 'phase2-neural.test.js' },
    { name: 'Phase 2B', file: 'phase2-quantum.test.js' },
    { name: 'Phase 2C', file: 'phase2-omniscient.test.js' }
  ],
  '3': [
    { name: 'Phase 3A', file: 'phase3-infrastructure.test.js' },
    { name: 'Phase 3B', file: 'phase3-intelligence.test.js' },
    { name: 'Phase 3C', file: 'phase3-production.test.js' }
  ]
};

// Select tests based on phase
let testFiles = [];
if (phase === 'all') {
  testFiles = [...allTests['1'], ...allTests['2'], ...allTests['3']];
} else if (allTests[phase]) {
  testFiles = allTests[phase];
} else {
  console.log('Usage: node run-all-tests.js [1|2|3|all]');
  process.exit(1);
}

// Filter only existing files
testFiles = testFiles.filter(t => fs.existsSync(path.join(__dirname, t.file)));

console.log(`📦 Running ${testFiles.length} test files (Phase: ${phase})\n`);

let totalPassed = 0, totalFailed = 0, totalTests = 0;
const results = [];
const startTime = Date.now();

for (const test of testFiles) {
  const filePath = path.join(__dirname, test.file);
  process.stdout.write(`  ${test.name}... `);
  
  const result = spawnSync('node', [filePath], { encoding: 'utf-8', timeout: 30000 });
  const output = result.stdout || '';
  
  const passedMatch = output.match(/✅ Passed: (\d+)/);
  const failedMatch = output.match(/❌ Failed: (\d+)/);
  const totalMatch = output.match(/📝 Total:\s*(\d+)/);
  
  const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;
  
  totalPassed += passed;
  totalFailed += failed;
  totalTests += total;
  
  const status = failed === 0 ? '✅' : '❌';
  const rate = total > 0 ? ((passed / total) * 100).toFixed(0) : 0;
  console.log(`${status} ${passed}/${total} (${rate}%)`);
  
  results.push({ name: test.name, passed, failed, total });
}

const duration = ((Date.now() - startTime) / 1000).toFixed(1);
const overallRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

console.log('\n' + '═'.repeat(50));
console.log(`📊 RESULTS: ${totalPassed}/${totalTests} (${overallRate}%)`);
console.log(`⏱️  Time: ${duration}s`);
console.log('═'.repeat(50));

if (totalFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED!\n');
} else {
  console.log(`\n⚠️  ${totalFailed} tests failed\n`);
}

process.exit(totalFailed > 0 ? 1 : 0);
