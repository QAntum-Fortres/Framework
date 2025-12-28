/**
 * 🧪 PREDICT FUNCTION TESTS (PRO)
 * Tests the Prediction Matrix implementation
 */

const { MisterMind } = require('../dist/index.js');

// Valid Pro license for testing (format: MM-XXXX-XXXX-XXXX)
const PRO_LICENSE = 'MM-TEST-1234-ABCD';

const SAMPLE_CODE = `
+function authenticateUser(username, password) {
+  if (!username || !password) {
+    throw new Error('Missing credentials');
+  }
+  
+  return fetch('/api/auth/login', {
+    method: 'POST',
+    body: JSON.stringify({ username, password })
+  })
+  .then(res => res.json())
+  .catch(err => {
+    console.error('Auth failed:', err);
+    throw err;
+  });
+}
+
+async function processPayment(order) {
+  const token = await getPaymentToken();
+  
+  if (order.total > 1000) {
+    return await processLargePayment(order, token);
+  } else {
+    return await processSmallPayment(order, token);
+  }
+}
`;

const SAMPLE_TEST_HISTORY = [
  { testName: 'login.spec.js', passed: true, duration: 1200, timestamp: new Date('2024-01-01') },
  { testName: 'login.spec.js', passed: false, duration: 1500, timestamp: new Date('2024-01-02') },
  { testName: 'login.spec.js', passed: true, duration: 1100, timestamp: new Date('2024-01-03') },
  { testName: 'login.spec.js', passed: false, duration: 1400, timestamp: new Date('2024-01-04') },
  { testName: 'checkout.spec.js', passed: true, duration: 2000, timestamp: new Date('2024-01-01') },
  { testName: 'checkout.spec.js', passed: true, duration: 1800, timestamp: new Date('2024-01-02') },
  { testName: 'dashboard.spec.js', passed: false, duration: 800, timestamp: new Date('2024-01-03') },
  { testName: 'dashboard.spec.js', passed: false, duration: 900, timestamp: new Date('2024-01-04') }
];

async function runPredictTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           🧪 PREDICT FUNCTION TESTS (PRO)                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════
  // TEST 1: Throws error without Pro license
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 TEST 1: Throws error without Pro license');
  try {
    const mm = new MisterMind();
    await mm.predict({ codeChanges: SAMPLE_CODE });
    console.log('   ❌ FAILED - Should have thrown error without license');
    failed++;
  } catch (e) {
    if (e.message.includes('Pro license')) {
      console.log('   ✅ PASSED - Correctly requires Pro license');
      passed++;
    } else {
      console.log('   ❌ FAILED - Wrong error:', e.message);
      failed++;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: Works with Pro license
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 2: Works with Pro license');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE, verbose: true });
    const result = await mm.predict({ codeChanges: SAMPLE_CODE });
    
    if (typeof result.riskScore !== 'number') {
      throw new Error('riskScore should be a number');
    }
    
    console.log('   ✅ PASSED - Works with Pro license');
    console.log(`      Risk Score: ${result.riskScore}/100`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: Returns valid structure
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 3: Returns valid structure');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.predict({ 
      codeChanges: SAMPLE_CODE,
      testHistory: SAMPLE_TEST_HISTORY
    });
    
    const requiredFields = ['riskScore', 'predictedFailures', 'recommendation', 'confidence', 'analyzedAt', 'codeMetrics', 'riskFactors'];
    const missingFields = requiredFields.filter(field => !(field in result));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    console.log('   ✅ PASSED - All required fields present');
    console.log(`      Risk Score: ${result.riskScore}`);
    console.log(`      Predicted Failures: ${result.predictedFailures.length}`);
    console.log(`      Risk Factors: ${result.riskFactors.length}`);
    console.log(`      Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 4: Detects authentication risk area
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 4: Detects authentication risk area');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.predict({ codeChanges: SAMPLE_CODE });
    
    const hasAuthRisk = result.codeMetrics.riskAreas.includes('authentication');
    
    if (!hasAuthRisk) {
      throw new Error('Should detect authentication risk area');
    }
    
    console.log('   ✅ PASSED - Detected authentication risk');
    console.log(`      Risk Areas: ${result.codeMetrics.riskAreas.join(', ')}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: Detects payment flow risk area
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 5: Detects payment flow risk area');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.predict({ codeChanges: SAMPLE_CODE });
    
    const hasPaymentRisk = result.codeMetrics.riskAreas.includes('payment-flow');
    
    if (!hasPaymentRisk) {
      throw new Error('Should detect payment-flow risk area');
    }
    
    console.log('   ✅ PASSED - Detected payment flow risk');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: Identifies flaky tests from history
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 6: Identifies flaky tests from history');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.predict({ 
      codeChanges: '',
      testHistory: SAMPLE_TEST_HISTORY
    });
    
    // login.spec.js alternates pass/fail, should be detected as flaky
    const hasFlakyWarning = result.riskFactors.some(f => 
      f.factor.toLowerCase().includes('flaky')
    );
    
    if (!hasFlakyWarning) {
      throw new Error('Should detect flaky tests');
    }
    
    console.log('   ✅ PASSED - Detected flaky tests');
    const flakyFactor = result.riskFactors.find(f => f.factor.toLowerCase().includes('flaky'));
    console.log(`      ${flakyFactor.factor}: ${flakyFactor.description}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 7: Code metrics are calculated correctly
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 7: Code metrics are calculated correctly');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.predict({ codeChanges: SAMPLE_CODE });
    
    if (result.codeMetrics.totalLines <= 0) {
      throw new Error('totalLines should be > 0');
    }
    
    if (result.codeMetrics.complexity <= 0) {
      throw new Error('complexity should be > 0');
    }
    
    // SAMPLE_CODE has lines starting with +
    if (result.codeMetrics.changedLines <= 0) {
      throw new Error('changedLines should be > 0');
    }
    
    console.log('   ✅ PASSED - Code metrics calculated correctly');
    console.log(`      Total Lines: ${result.codeMetrics.totalLines}`);
    console.log(`      Complexity: ${result.codeMetrics.complexity}`);
    console.log(`      Changed Lines: ${result.codeMetrics.changedLines}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 8: Recommendation is generated
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 8: Recommendation is generated');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.predict({ 
      codeChanges: SAMPLE_CODE,
      testHistory: SAMPLE_TEST_HISTORY
    });
    
    if (!result.recommendation || result.recommendation.length < 10) {
      throw new Error('Recommendation should be a meaningful string');
    }
    
    console.log('   ✅ PASSED - Recommendation generated');
    console.log(`      ${result.recommendation}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 9: Risk score is in valid range
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 9: Risk score is in valid range (0-100)');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.predict({ 
      codeChanges: SAMPLE_CODE,
      testHistory: SAMPLE_TEST_HISTORY
    });
    
    if (result.riskScore < 0 || result.riskScore > 100) {
      throw new Error(`Risk score ${result.riskScore} out of range`);
    }
    
    console.log('   ✅ PASSED - Risk score in valid range');
    console.log(`      Risk Score: ${result.riskScore}/100`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 10: Confidence is in valid range
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 10: Confidence is in valid range (0-1)');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.predict({ 
      codeChanges: SAMPLE_CODE,
      testHistory: SAMPLE_TEST_HISTORY
    });
    
    if (result.confidence < 0 || result.confidence > 1) {
      throw new Error(`Confidence ${result.confidence} out of range`);
    }
    
    console.log('   ✅ PASSED - Confidence in valid range');
    console.log(`      Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📊 PREDICT TESTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  return { passed, failed };
}

// Run tests
runPredictTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
