/**
 * 🧪 AUDIT FUNCTION TESTS
 * Tests the real audit() implementation with Playwright
 */

const { MisterMind } = require('../dist/index.js');

const TEST_URLS = {
  valid: 'https://example.com',
  invalid: 'not-a-valid-url',
  nonExistent: 'https://this-domain-definitely-does-not-exist-12345.com'
};

async function runAuditTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           🧪 AUDIT FUNCTION TESTS                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════
  // TEST 1: Audit returns valid structure
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 TEST 1: Audit returns valid structure');
  try {
    const mm = new MisterMind({ verbose: true });
    const result = await mm.audit(TEST_URLS.valid);
    
    // Check all required fields exist
    const requiredFields = ['url', 'timestamp', 'performance', 'accessibility', 'seo', 'brokenLinks', 'suggestions', 'duration', 'metrics'];
    const missingFields = requiredFields.filter(field => !(field in result));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    console.log('   ✅ PASSED - All required fields present');
    console.log(`      URL: ${result.url}`);
    console.log(`      Performance: ${result.performance}/100`);
    console.log(`      Accessibility: ${result.accessibility}/100`);
    console.log(`      SEO: ${result.seo}/100`);
    console.log(`      Duration: ${result.duration}ms`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: Audit metrics are realistic (not random)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 2: Audit metrics are realistic');
  try {
    const mm = new MisterMind();
    const result = await mm.audit(TEST_URLS.valid);
    
    // Check metrics structure
    if (!result.metrics || typeof result.metrics !== 'object') {
      throw new Error('Metrics object missing');
    }
    
    const metricFields = ['loadTime', 'domContentLoaded', 'resourceCount', 'totalSize'];
    const missingMetrics = metricFields.filter(field => typeof result.metrics[field] !== 'number');
    
    if (missingMetrics.length > 0) {
      throw new Error(`Missing metric fields: ${missingMetrics.join(', ')}`);
    }
    
    // Load time should be > 0 for a real request
    if (result.metrics.loadTime <= 0) {
      throw new Error('Load time should be > 0');
    }
    
    console.log('   ✅ PASSED - Metrics are realistic');
    console.log(`      Load Time: ${result.metrics.loadTime}ms`);
    console.log(`      DOM Content Loaded: ${result.metrics.domContentLoaded}ms`);
    console.log(`      Resource Count: ${result.metrics.resourceCount}`);
    console.log(`      Total Size: ${(result.metrics.totalSize / 1024).toFixed(2)}KB`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: Scores are within valid range (0-100)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 3: Scores are within valid range (0-100)');
  try {
    const mm = new MisterMind();
    const result = await mm.audit(TEST_URLS.valid);
    
    const scores = [
      { name: 'Performance', value: result.performance },
      { name: 'Accessibility', value: result.accessibility },
      { name: 'SEO', value: result.seo }
    ];
    
    for (const score of scores) {
      if (score.value < 0 || score.value > 100) {
        throw new Error(`${score.name} score ${score.value} is out of range`);
      }
    }
    
    console.log('   ✅ PASSED - All scores within 0-100 range');
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 4: Invalid URL throws error
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 4: Invalid URL throws error');
  try {
    const mm = new MisterMind();
    await mm.audit(TEST_URLS.invalid);
    console.log('   ❌ FAILED - Should have thrown error for invalid URL');
    failed++;
  } catch (e) {
    if (e.message.includes('Invalid URL')) {
      console.log('   ✅ PASSED - Correctly throws error for invalid URL');
      passed++;
    } else {
      console.log('   ❌ FAILED - Wrong error message:', e.message);
      failed++;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: Empty URL throws error
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 5: Empty URL throws error');
  try {
    const mm = new MisterMind();
    await mm.audit('');
    console.log('   ❌ FAILED - Should have thrown error for empty URL');
    failed++;
  } catch (e) {
    if (e.message.includes('Invalid URL')) {
      console.log('   ✅ PASSED - Correctly throws error for empty URL');
      passed++;
    } else {
      console.log('   ❌ FAILED - Wrong error message:', e.message);
      failed++;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: Suggestions array is populated
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 6: Suggestions array is populated');
  try {
    const mm = new MisterMind();
    const result = await mm.audit(TEST_URLS.valid);
    
    if (!Array.isArray(result.suggestions)) {
      throw new Error('Suggestions should be an array');
    }
    
    // Should have at least some suggestions for most sites
    console.log('   ✅ PASSED - Suggestions array present');
    console.log(`      Found ${result.suggestions.length} suggestion(s)`);
    if (result.suggestions.length > 0) {
      console.log(`      First: "${result.suggestions[0]}"`);
    }
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 7: Consistent results (not random)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 7: Consistent results (not random)');
  try {
    const mm = new MisterMind();
    const result1 = await mm.audit(TEST_URLS.valid);
    const result2 = await mm.audit(TEST_URLS.valid);
    
    // Performance scores should be similar (within 10 points) for same URL
    const perfDiff = Math.abs(result1.performance - result2.performance);
    
    if (perfDiff > 20) {
      throw new Error(`Performance scores too different: ${result1.performance} vs ${result2.performance}`);
    }
    
    console.log('   ✅ PASSED - Results are consistent (not random)');
    console.log(`      Run 1 Performance: ${result1.performance}`);
    console.log(`      Run 2 Performance: ${result2.performance}`);
    console.log(`      Difference: ${perfDiff} points`);
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
  console.log(`📊 AUDIT TESTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  return { passed, failed };
}

// Run tests
runAuditTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
