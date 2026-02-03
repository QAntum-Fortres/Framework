/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of QAntum.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited without express written permission.
 * 
 * For licensing inquiries: dimitar.papazov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * QANTUM - Advanced Usage Examples
 * 
 * This file demonstrates PRO features with real-world use cases.
 * Requires a valid PRO license: https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe
 */

import { QAntum } from '../src/index';

// ===================================
// EXAMPLE 1: CI/CD Pipeline Integration
// ===================================

async function ciPipelineExample() {
  console.log('\n🔮 === CI/CD Pipeline Integration ===\n');

  const mm = new QAntum({
    licenseKey: process.env.qantum_LICENSE || '',
    verbose: true
  });

  // Get the list of changed files from git
  const changedFiles = [
    'src/auth/login.ts',
    'src/auth/session.ts',
    'src/utils/validation.ts'
  ];

  console.log('📁 Changed files:', changedFiles);

  // Predict which tests are most likely to fail
  const predictions = await mm.predict({
    codeChanges: changedFiles,
    testHistory: './test-results/history.json'
  });

  console.log('\n📊 Prediction Results:');
  console.log(`   Risk Score: ${predictions.riskScore}/100`);
  console.log(`   Predicted Failures: ${predictions.predictedFailures.join(', ') || 'None'}`);
  console.log(`   Recommendation: ${predictions.recommendation}`);

  // In CI, you might want to:
  // 1. Run high-risk tests first
  // 2. Notify team if risk is high
  // 3. Block merge if prediction shows critical failures

  if (predictions.riskScore > 80) {
    console.log('\n⚠️  HIGH RISK! Consider reviewing these areas before merge.');
    // process.exit(1); // Uncomment to block pipeline
  }
}

// ===================================
// EXAMPLE 2: Time-Travel Debugging with Chronos
// ===================================

async function chronosExample() {
  console.log('\n⏰ === Chronos Time-Travel Debugging ===\n');

  const mm = new QAntum({
    licenseKey: process.env.qantum_LICENSE || ''
  });

  // Record a test session for later analysis
  const testRun = {
    testFile: './tests/checkout.spec.ts',
    startTime: Date.now(),
    snapshots: [] as any[]
  };

  // Simulate capturing snapshots during test execution
  console.log('📸 Capturing execution snapshots...\n');

  // Analyze the test execution
  const analysis = await mm.chronos({
    testId: 'checkout-flow-001',
    snapshots: testRun.snapshots,
    failurePoint: 'step-3'
  });

  console.log('🔍 Chronos Analysis:');
  console.log(`   Root Cause: ${analysis.rootCause}`);
  console.log(`   Timeline: ${analysis.timeline.join(' → ')}`);
  console.log(`   Fix Suggestion: ${analysis.suggestion}`);
}

// ===================================
// EXAMPLE 3: API Testing with Sensei
// ===================================

async function apiSenseiExample() {
  console.log('\n🥋 === API Sensei - Auto-Generated Tests ===\n');

  const mm = new QAntum({
    licenseKey: process.env.qantum_LICENSE || ''
  });

  // Point Sensei at your OpenAPI spec
  const tests = await mm.apiSensei({
    specUrl: 'https://api.example.com/openapi.json',
    coverage: 'full',
    includeEdgeCases: true
  });

  console.log('📝 Generated API Tests:');
  console.log(`   Total Tests: ${tests.generated.length}`);
  console.log(`   Edge Cases: ${tests.edgeCases.length}`);
  console.log(`   Coverage: ${tests.coveragePercent}%\n`);

  // Run the generated tests
  console.log('🚀 Running generated tests...\n');

  for (const test of tests.generated.slice(0, 3)) {
    console.log(`   ${test.passed ? '✅' : '❌'} ${test.name}`);
    if (!test.passed) {
      console.log(`      Error: ${test.error}`);
    }
  }
}

// ===================================
// EXAMPLE 4: Pre-Commit Hook
// ===================================

async function preCommitHookExample() {
  console.log('\n🪝 === Pre-Commit Hook Integration ===\n');

  const mm = new QAntum({
    licenseKey: process.env.qantum_LICENSE || ''
  });

  // Quick audit before committing
  console.log('Running quick audit...\n');

  const audit = await mm.audit({ url: 'http://localhost:3000' });

  // Check for critical issues
  const criticalIssues = audit.issues.filter(i => i.severity === 'critical');

  if (criticalIssues.length > 0) {
    console.log('❌ COMMIT BLOCKED - Critical issues found:\n');
    criticalIssues.forEach(issue => {
      console.log(`   • ${issue.message}`);
    });
    console.log('\nFix these issues before committing.');
    // process.exit(1);
  } else {
    console.log('✅ All checks passed! Safe to commit.');
  }
}

// ===================================
// EXAMPLE 5: Combined Workflow
// ===================================

async function fullWorkflowExample() {
  console.log('\n🚀 === Full QA Workflow ===\n');

  const mm = new QAntum({
    licenseKey: process.env.qantum_LICENSE || '',
    verbose: false
  });

  const stages = [
    { name: 'Link Check', fn: () => mm.checkLinks({ startUrl: 'http://localhost:3000' }) },
    { name: 'Audit', fn: () => mm.audit({ url: 'http://localhost:3000' }) },
    { name: 'API Tests', fn: () => mm.testAPI({ endpoint: 'http://localhost:3000/api', method: 'GET' }) },
    { name: 'Predictions', fn: () => mm.predict({ codeChanges: './src', testHistory: './history' }) }
  ];

  console.log('Running comprehensive QA pipeline...\n');

  for (const stage of stages) {
    try {
      console.log(`⏳ ${stage.name}...`);
      const result = await stage.fn();
      console.log(`✅ ${stage.name} - Complete\n`);
    } catch (error: any) {
      console.log(`❌ ${stage.name} - Failed: ${error.message}\n`);
    }
  }

  console.log('🎉 QA Pipeline Complete!');
}

// ===================================
// Run Examples
// ===================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          QANTUM - Advanced Examples (PRO)               ║');
  console.log('║     Get your license: buy.polar.sh/polar_cl_XBbOE...        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Check for license
  if (!process.env.qantum_LICENSE) {
    console.log('\n⚠️  Warning: No license key found in qantum_LICENSE');
    console.log('   PRO features will show simulated results.');
    console.log('   Get your Pro license: https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe\n');
  }

  try {
    await ciPipelineExample();
    await chronosExample();
    await apiSenseiExample();
    await preCommitHookExample();
    await fullWorkflowExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

main();
