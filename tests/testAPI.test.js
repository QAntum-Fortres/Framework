/**
 * 🧪 TEST API FUNCTION TESTS
 * Tests the real testAPI() implementation with axios
 */

const { MisterMind } = require('../dist/index.js');

const TEST_ENDPOINTS = {
  valid: 'https://jsonplaceholder.typicode.com/posts/1',
  validList: 'https://jsonplaceholder.typicode.com/posts',
  notFound: 'https://jsonplaceholder.typicode.com/posts/999999',
  invalid: 'not-a-valid-url'
};

async function runTestAPITests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           🧪 TEST API FUNCTION TESTS                          ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════
  // TEST 1: GET request returns valid structure
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 TEST 1: GET request returns valid structure');
  try {
    const mm = new MisterMind({ verbose: true });
    const result = await mm.testAPI(TEST_ENDPOINTS.valid);
    
    const requiredFields = ['endpoint', 'method', 'status', 'statusText', 'responseTime', 'responseSize', 'success', 'headers', 'contentType', 'timestamp'];
    const missingFields = requiredFields.filter(field => !(field in result));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    console.log('   ✅ PASSED - All required fields present');
    console.log(`      Endpoint: ${result.endpoint}`);
    console.log(`      Status: ${result.status}`);
    console.log(`      Response Time: ${result.responseTime}ms`);
    console.log(`      Response Size: ${result.responseSize} bytes`);
    console.log(`      Success: ${result.success}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: Real response time (not random)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 2: Real response time (not random)');
  try {
    const mm = new MisterMind();
    const result = await mm.testAPI(TEST_ENDPOINTS.valid);
    
    if (result.responseTime <= 0) {
      throw new Error('Response time should be > 0');
    }
    
    // Response time should be reasonable (< 30 seconds)
    if (result.responseTime > 30000) {
      throw new Error('Response time seems unrealistic');
    }
    
    console.log('   ✅ PASSED - Response time is realistic');
    console.log(`      Response Time: ${result.responseTime}ms`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: Returns correct status for 404
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 3: Returns correct status for 404');
  try {
    const mm = new MisterMind();
    const result = await mm.testAPI(TEST_ENDPOINTS.notFound);
    
    if (result.status !== 404) {
      throw new Error(`Expected status 404, got ${result.status}`);
    }
    
    if (result.success !== false) {
      throw new Error('Success should be false for 404');
    }
    
    console.log('   ✅ PASSED - Correctly reports 404 status');
    console.log(`      Status: ${result.status}`);
    console.log(`      Success: ${result.success}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 4: POST request with body
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 4: POST request with body');
  try {
    const mm = new MisterMind();
    const result = await mm.testAPI(TEST_ENDPOINTS.validList, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { title: 'Test', body: 'Test body', userId: 1 }
    });
    
    if (result.method !== 'POST') {
      throw new Error(`Expected method POST, got ${result.method}`);
    }
    
    // JSONPlaceholder returns 201 for successful POST
    if (result.status !== 201) {
      throw new Error(`Expected status 201, got ${result.status}`);
    }
    
    console.log('   ✅ PASSED - POST request works correctly');
    console.log(`      Method: ${result.method}`);
    console.log(`      Status: ${result.status}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: Invalid URL throws error
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 5: Invalid URL throws error');
  try {
    const mm = new MisterMind();
    await mm.testAPI(TEST_ENDPOINTS.invalid);
    console.log('   ❌ FAILED - Should have thrown error for invalid URL');
    failed++;
  } catch (e) {
    if (e.message.includes('Invalid endpoint')) {
      console.log('   ✅ PASSED - Correctly throws error for invalid URL');
      passed++;
    } else {
      console.log('   ❌ FAILED - Wrong error message:', e.message);
      failed++;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: Headers are captured
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 6: Headers are captured');
  try {
    const mm = new MisterMind();
    const result = await mm.testAPI(TEST_ENDPOINTS.valid);
    
    if (typeof result.headers !== 'object') {
      throw new Error('Headers should be an object');
    }
    
    if (!result.contentType || result.contentType === 'unknown') {
      throw new Error('Content type should be captured');
    }
    
    console.log('   ✅ PASSED - Headers are captured');
    console.log(`      Content-Type: ${result.contentType}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 7: Batch API testing
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 7: Batch API testing');
  try {
    const mm = new MisterMind();
    const results = await mm.testAPIs([
      { url: TEST_ENDPOINTS.valid },
      { url: TEST_ENDPOINTS.validList, options: { method: 'GET' } }
    ]);
    
    if (!Array.isArray(results)) {
      throw new Error('Results should be an array');
    }
    
    if (results.length !== 2) {
      throw new Error(`Expected 2 results, got ${results.length}`);
    }
    
    console.log('   ✅ PASSED - Batch API testing works');
    console.log(`      Tested ${results.length} endpoints`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 8: Timestamp is set
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 8: Timestamp is set');
  try {
    const mm = new MisterMind();
    const result = await mm.testAPI(TEST_ENDPOINTS.valid);
    
    if (!(result.timestamp instanceof Date)) {
      throw new Error('Timestamp should be a Date object');
    }
    
    console.log('   ✅ PASSED - Timestamp is set correctly');
    console.log(`      Timestamp: ${result.timestamp.toISOString()}`);
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
  console.log(`📊 TEST API TESTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  return { passed, failed };
}

// Run tests
runTestAPITests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
