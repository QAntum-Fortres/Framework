/**
 * 🧪 API SENSEI FUNCTION TESTS (PRO)
 * Tests the intelligent API testing implementation
 */

const { MisterMind } = require('../dist/index.js');

const PRO_LICENSE = 'MM-TEST-1234-ABCD';
const TEST_API_URL = 'https://jsonplaceholder.typicode.com';

async function runAPISenseiTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           🧪 API SENSEI FUNCTION TESTS (PRO)                  ║');
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
    await mm.apiSensei({ baseUrl: TEST_API_URL });
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
    const result = await mm.apiSensei({ baseUrl: TEST_API_URL });
    
    if (typeof result.totalTests !== 'number') {
      throw new Error('totalTests should be a number');
    }
    
    console.log('   ✅ PASSED - Works with Pro license');
    console.log(`      Total Tests: ${result.totalTests}`);
    console.log(`      Passed: ${result.passed}`);
    console.log(`      Failed: ${result.failed}`);
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
    const result = await mm.apiSensei({ baseUrl: TEST_API_URL });
    
    const requiredFields = ['baseUrl', 'totalTests', 'passed', 'failed', 'testResults', 'coverage', 'recommendations', 'duration'];
    const missingFields = requiredFields.filter(field => !(field in result));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    console.log('   ✅ PASSED - All required fields present');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 4: Test results have correct structure
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 4: Test results have correct structure');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.apiSensei({ baseUrl: TEST_API_URL });
    
    if (result.testResults.length === 0) {
      throw new Error('Should have test results');
    }
    
    const testResult = result.testResults[0];
    const requiredTestFields = ['name', 'endpoint', 'method', 'scenario', 'status', 'responseTime', 'assertions'];
    const missingTestFields = requiredTestFields.filter(field => !(field in testResult));
    
    if (missingTestFields.length > 0) {
      throw new Error(`Missing test result fields: ${missingTestFields.join(', ')}`);
    }
    
    console.log('   ✅ PASSED - Test results have correct structure');
    console.log(`      Sample: ${testResult.name} - ${testResult.status}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: Coverage is calculated
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 5: Coverage is calculated');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.apiSensei({ baseUrl: TEST_API_URL });
    
    if (typeof result.coverage.coveragePercent !== 'number') {
      throw new Error('coveragePercent should be a number');
    }
    
    if (result.coverage.coveragePercent < 0 || result.coverage.coveragePercent > 100) {
      throw new Error('Coverage should be 0-100');
    }
    
    console.log('   ✅ PASSED - Coverage calculated correctly');
    console.log(`      Coverage: ${result.coverage.coveragePercent.toFixed(1)}%`);
    console.log(`      Tested Endpoints: ${result.coverage.testedEndpoints}/${result.coverage.endpoints}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: Custom scenarios are respected
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 6: Custom scenarios are respected');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.apiSensei({ 
      baseUrl: TEST_API_URL,
      scenarios: ['happy-path']
    });
    
    // Should only have happy-path tests
    const scenarios = new Set(result.testResults.map(t => t.scenario));
    
    if (scenarios.has('error-handling') || scenarios.has('security')) {
      throw new Error('Should only have happy-path scenarios');
    }
    
    console.log('   ✅ PASSED - Custom scenarios respected');
    console.log(`      Scenarios tested: ${[...scenarios].join(', ')}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 7: Recommendations are generated
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 7: Recommendations are generated');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.apiSensei({ baseUrl: TEST_API_URL });
    
    if (!Array.isArray(result.recommendations)) {
      throw new Error('recommendations should be an array');
    }
    
    if (result.recommendations.length === 0) {
      throw new Error('Should have at least one recommendation');
    }
    
    console.log('   ✅ PASSED - Recommendations generated');
    console.log(`      ${result.recommendations[0]}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 8: Duration is measured
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 8: Duration is measured');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.apiSensei({ baseUrl: TEST_API_URL });
    
    if (typeof result.duration !== 'number' || result.duration <= 0) {
      throw new Error('Duration should be a positive number');
    }
    
    console.log('   ✅ PASSED - Duration measured correctly');
    console.log(`      Duration: ${result.duration}ms`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 9: Throws error without baseUrl
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 9: Throws error without baseUrl');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    await mm.apiSensei({ baseUrl: '' });
    console.log('   ❌ FAILED - Should have thrown error without baseUrl');
    failed++;
  } catch (e) {
    if (e.message.includes('baseUrl')) {
      console.log('   ✅ PASSED - Correctly requires baseUrl');
      passed++;
    } else {
      console.log('   ❌ FAILED - Wrong error:', e.message);
      failed++;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 10: All scenarios work
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 10: All scenarios work');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.apiSensei({ 
      baseUrl: TEST_API_URL,
      scenarios: ['happy-path', 'edge-cases', 'error-handling', 'security', 'performance']
    });
    
    const scenarios = new Set(result.testResults.map(t => t.scenario));
    
    if (scenarios.size < 4) {
      throw new Error(`Expected at least 4 different scenarios, got ${scenarios.size}`);
    }
    
    console.log('   ✅ PASSED - All scenarios work');
    console.log(`      Scenarios: ${[...scenarios].join(', ')}`);
    console.log(`      Total tests: ${result.totalTests}`);
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
  console.log(`📊 API SENSEI TESTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  return { passed, failed };
}

// Run tests
runAPISenseiTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
