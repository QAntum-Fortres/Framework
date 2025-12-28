/**
 * 🧪 CHECK LINKS FUNCTION TESTS
 * Tests the real checkLinks() implementation
 */

const { MisterMind } = require('../dist/index.js');

const TEST_URLS = {
  valid: 'https://example.com',
  withLinks: 'https://www.google.com',
  invalid: 'not-a-valid-url'
};

async function runCheckLinksTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           🧪 CHECK LINKS FUNCTION TESTS                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  let passed = 0;
  let failed = 0;

  // ═══════════════════════════════════════════════════════════════
  // TEST 1: Returns valid structure
  // ═══════════════════════════════════════════════════════════════
  console.log('📋 TEST 1: Returns valid structure');
  try {
    const mm = new MisterMind({ verbose: true });
    const result = await mm.checkLinks(TEST_URLS.valid);
    
    const requiredFields = ['url', 'totalLinks', 'checkedLinks', 'brokenLinks', 'results', 'duration'];
    const missingFields = requiredFields.filter(field => !(field in result));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing fields: ${missingFields.join(', ')}`);
    }
    
    if (!Array.isArray(result.brokenLinks)) {
      throw new Error('brokenLinks should be an array');
    }
    
    if (!Array.isArray(result.results)) {
      throw new Error('results should be an array');
    }
    
    console.log('   ✅ PASSED - All required fields present');
    console.log(`      URL: ${result.url}`);
    console.log(`      Total Links: ${result.totalLinks}`);
    console.log(`      Checked Links: ${result.checkedLinks}`);
    console.log(`      Broken Links: ${result.brokenLinks.length}`);
    console.log(`      Duration: ${result.duration}ms`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: Link results have correct structure
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 2: Link results have correct structure');
  try {
    const mm = new MisterMind();
    const result = await mm.checkLinks(TEST_URLS.valid);
    
    if (result.results.length > 0) {
      const linkResult = result.results[0];
      const requiredLinkFields = ['url', 'status', 'statusText', 'isValid', 'isExternal'];
      const missingLinkFields = requiredLinkFields.filter(field => !(field in linkResult));
      
      if (missingLinkFields.length > 0) {
        throw new Error(`Missing link result fields: ${missingLinkFields.join(', ')}`);
      }
      
      console.log('   ✅ PASSED - Link results have correct structure');
      console.log(`      Sample: ${linkResult.url} - Status: ${linkResult.status}`);
    } else {
      console.log('   ✅ PASSED - No links to check (structure is valid)');
    }
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: Invalid URL throws error
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 3: Invalid URL throws error');
  try {
    const mm = new MisterMind();
    await mm.checkLinks(TEST_URLS.invalid);
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
  // TEST 4: Respects maxLinks option
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 4: Respects maxLinks option');
  try {
    const mm = new MisterMind();
    const result = await mm.checkLinks(TEST_URLS.valid, { maxLinks: 5 });
    
    if (result.checkedLinks <= 5) {
      console.log('   ✅ PASSED - Respects maxLinks option');
      console.log(`      Checked: ${result.checkedLinks} (max: 5)`);
      passed++;
    } else {
      throw new Error(`Checked ${result.checkedLinks} links, expected <= 5`);
    }
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: Duration is measured
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 5: Duration is measured');
  try {
    const mm = new MisterMind();
    const result = await mm.checkLinks(TEST_URLS.valid);
    
    if (typeof result.duration !== 'number' || result.duration <= 0) {
      throw new Error('Duration should be a positive number');
    }
    
    console.log('   ✅ PASSED - Duration is measured correctly');
    console.log(`      Duration: ${result.duration}ms`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: Empty URL throws error
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 6: Empty URL throws error');
  try {
    const mm = new MisterMind();
    await mm.checkLinks('');
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
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📊 CHECK LINKS TESTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  return { passed, failed };
}

// Run tests
runCheckLinksTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
