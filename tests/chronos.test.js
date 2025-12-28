/**
 * 🧪 CHRONOS ENGINE FUNCTION TESTS (PRO)
 * Tests the time-travel debugging implementation
 */

const { MisterMind } = require('../dist/index.js');

const PRO_LICENSE = 'MM-TEST-1234-ABCD';

// Simulate async operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runChronosTests() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           🧪 CHRONOS ENGINE FUNCTION TESTS (PRO)              ║');
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
    await mm.chronos({ testFn: async () => {} });
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
    const result = await mm.chronos({ 
      testFn: async () => { 
        await delay(50); 
      } 
    });
    
    if (typeof result.success !== 'boolean') {
      throw new Error('success should be a boolean');
    }
    
    console.log('   ✅ PASSED - Works with Pro license');
    console.log(`      Success: ${result.success}`);
    console.log(`      Duration: ${result.duration}ms`);
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
    const result = await mm.chronos({ testFn: async () => {} });
    
    const requiredFields = ['success', 'snapshots', 'timeline', 'duration'];
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
  // TEST 4: Captures snapshots
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 4: Captures snapshots');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.chronos({ 
      testFn: async () => { 
        await delay(200); 
      },
      autoSnapshot: true,
      snapshotInterval: 50
    });
    
    if (!Array.isArray(result.snapshots)) {
      throw new Error('snapshots should be an array');
    }
    
    // Should have at least initial and final snapshots
    if (result.snapshots.length < 2) {
      throw new Error(`Expected at least 2 snapshots, got ${result.snapshots.length}`);
    }
    
    console.log('   ✅ PASSED - Captures snapshots');
    console.log(`      Snapshots captured: ${result.snapshots.length}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: Snapshot structure is valid
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 5: Snapshot structure is valid');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.chronos({ testFn: async () => {} });
    
    const snapshot = result.snapshots[0];
    const requiredSnapshotFields = ['id', 'timestamp', 'state'];
    const missingSnapshotFields = requiredSnapshotFields.filter(field => !(field in snapshot));
    
    if (missingSnapshotFields.length > 0) {
      throw new Error(`Missing snapshot fields: ${missingSnapshotFields.join(', ')}`);
    }
    
    if (typeof snapshot.id !== 'string' || !snapshot.id.startsWith('snap_')) {
      throw new Error('Snapshot ID should be a string starting with snap_');
    }
    
    console.log('   ✅ PASSED - Snapshot structure is valid');
    console.log(`      First snapshot ID: ${snapshot.id}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: Timeline records events
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 6: Timeline records events');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.chronos({ testFn: async () => {} });
    
    if (!Array.isArray(result.timeline)) {
      throw new Error('timeline should be an array');
    }
    
    if (result.timeline.length < 2) {
      throw new Error('Timeline should have at least 2 events');
    }
    
    const event = result.timeline[0];
    if (!event.type || !event.description || !event.timestamp) {
      throw new Error('Timeline events should have type, description, and timestamp');
    }
    
    console.log('   ✅ PASSED - Timeline records events');
    console.log(`      Events recorded: ${result.timeline.length}`);
    console.log(`      First event: ${result.timeline[0].description}`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 7: Captures errors
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 7: Captures errors');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.chronos({ 
      testFn: async () => { 
        throw new Error('Test error'); 
      } 
    });
    
    if (result.success !== false) {
      throw new Error('success should be false when test throws');
    }
    
    if (!result.error) {
      throw new Error('error should be set when test throws');
    }
    
    console.log('   ✅ PASSED - Captures errors correctly');
    console.log(`      Error captured: ${result.error}`);
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
    const start = Date.now();
    const result = await mm.chronos({ 
      testFn: async () => { 
        await delay(100); 
      },
      autoSnapshot: false
    });
    const elapsed = Date.now() - start;
    
    if (result.duration < 100) {
      throw new Error(`Duration ${result.duration} is too short`);
    }
    
    if (result.duration > elapsed + 50) {
      throw new Error(`Duration ${result.duration} is too long`);
    }
    
    console.log('   ✅ PASSED - Duration measured correctly');
    console.log(`      Duration: ${result.duration}ms`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 9: Respects maxSnapshots
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 9: Respects maxSnapshots');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    const result = await mm.chronos({ 
      testFn: async () => { 
        await delay(500); 
      },
      autoSnapshot: true,
      snapshotInterval: 20,
      maxSnapshots: 5
    });
    
    if (result.snapshots.length > 5) {
      throw new Error(`Expected max 5 snapshots, got ${result.snapshots.length}`);
    }
    
    console.log('   ✅ PASSED - Respects maxSnapshots');
    console.log(`      Snapshots: ${result.snapshots.length} (max: 5)`);
    passed++;
  } catch (e) {
    console.log('   ❌ FAILED -', e.message);
    failed++;
  }

  // ═══════════════════════════════════════════════════════════════
  // TEST 10: Throws error without testFn
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 TEST 10: Throws error without testFn');
  try {
    const mm = new MisterMind({ licenseKey: PRO_LICENSE });
    await mm.chronos({ testFn: 'not a function' });
    console.log('   ❌ FAILED - Should have thrown error');
    failed++;
  } catch (e) {
    if (e.message.includes('function')) {
      console.log('   ✅ PASSED - Correctly validates testFn');
      passed++;
    } else {
      console.log('   ❌ FAILED - Wrong error:', e.message);
      failed++;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📊 CHRONOS ENGINE TESTS: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  return { passed, failed };
}

// Run tests
runChronosTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
