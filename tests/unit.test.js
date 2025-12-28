/**
 * 🧪 UNIT TESTS - MISTER MIND
 * Fast unit tests without network calls
 * NO SELF-HEALING, NO RETRIES - SIMPLE PASS/FAIL
 */

const { MisterMind } = require('../dist/index.js');

// Global timeout for safety
const TEST_TIMEOUT = 5000;

let passed = 0;
let failed = 0;

function test(name, fn) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log(`   ⏱️ TIMEOUT - ${name}`);
      failed++;
      resolve();
    }, TEST_TIMEOUT);

    try {
      const result = fn();
      if (result instanceof Promise) {
        result
          .then(() => {
            clearTimeout(timer);
            console.log(`   ✅ ${name}`);
            passed++;
            resolve();
          })
          .catch((e) => {
            clearTimeout(timer);
            console.log(`   ❌ ${name}: ${e.message}`);
            failed++;
            resolve();
          });
      } else {
        clearTimeout(timer);
        console.log(`   ✅ ${name}`);
        passed++;
        resolve();
      }
    } catch (e) {
      clearTimeout(timer);
      console.log(`   ❌ ${name}: ${e.message}`);
      failed++;
      resolve();
    }
  });
}

async function runTests() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         🧪 MISTER MIND - UNIT TESTS                  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // CONSTRUCTOR TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('📦 Constructor Tests:');
  
  await test('Creates instance without config', () => {
    const mm = new MisterMind();
    if (!mm) throw new Error('Failed to create instance');
  });

  await test('Creates instance with empty config', () => {
    const mm = new MisterMind({});
    if (!mm) throw new Error('Failed to create instance');
  });

  await test('Creates instance with timeout', () => {
    const mm = new MisterMind({ timeout: 5000 });
    if (!mm) throw new Error('Failed to create instance');
  });

  await test('Throws on invalid timeout', () => {
    try {
      new MisterMind({ timeout: -1 });
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Invalid timeout')) throw e;
    }
  });

  await test('Throws on non-number timeout', () => {
    try {
      new MisterMind({ timeout: 'abc' });
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Invalid timeout')) throw e;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // LICENSE TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📦 License Tests:');

  await test('Free tier by default', () => {
    const mm = new MisterMind();
    const status = mm.getLicenseStatus();
    if (status.tier !== 'free') throw new Error('Expected free tier');
    if (status.isValid) throw new Error('Should not be valid');
  });

  await test('Invalid license stays free', () => {
    const mm = new MisterMind({ licenseKey: 'INVALID' });
    const status = mm.getLicenseStatus();
    if (status.tier !== 'free') throw new Error('Expected free tier');
  });

  await test('Valid license format activates PRO', () => {
    const mm = new MisterMind({ licenseKey: 'MM-ABCD-1234-WXYZ' });
    const status = mm.getLicenseStatus();
    if (status.tier !== 'pro') throw new Error('Expected pro tier');
    if (!status.isValid) throw new Error('Should be valid');
  });

  await test('Lowercase license converted to uppercase', () => {
    const mm = new MisterMind({ licenseKey: 'mm-abcd-1234-wxyz' });
    const status = mm.getLicenseStatus();
    if (status.tier !== 'pro') throw new Error('Expected pro tier');
  });

  // ═══════════════════════════════════════════════════════════════
  // INPUT VALIDATION TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📦 Input Validation Tests:');

  await test('audit() throws on empty URL', async () => {
    const mm = new MisterMind();
    try {
      await mm.audit('');
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Invalid URL')) throw e;
    }
  });

  await test('audit() throws on invalid URL', async () => {
    const mm = new MisterMind();
    try {
      await mm.audit('not-a-url');
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Invalid URL')) throw e;
    }
  });

  await test('testAPI() throws on empty endpoint', async () => {
    const mm = new MisterMind();
    try {
      await mm.testAPI('');
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Invalid endpoint')) throw e;
    }
  });

  await test('checkLinks() throws on invalid URL', async () => {
    const mm = new MisterMind();
    try {
      await mm.checkLinks('not-valid');
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Invalid URL')) throw e;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // PRO FEATURE GATE TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📦 PRO Feature Gate Tests:');

  await test('predict() throws without license', async () => {
    const mm = new MisterMind();
    try {
      await mm.predict({});
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Pro license')) throw e;
    }
  });

  await test('apiSensei() throws without license', async () => {
    const mm = new MisterMind();
    try {
      await mm.apiSensei({ baseUrl: 'https://api.example.com' });
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Pro license')) throw e;
    }
  });

  await test('chronos() throws without license', async () => {
    const mm = new MisterMind();
    try {
      await mm.chronos({ testFn: async () => {} });
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Pro license')) throw e;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // PRO FEATURES WITH LICENSE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📦 PRO Features With License:');

  await test('predict() works with valid license', async () => {
    const mm = new MisterMind({ licenseKey: 'MM-TEST-1234-ABCD' });
    const result = await mm.predict({ codeChanges: 'const x = 1;' });
    if (typeof result.riskScore !== 'number') throw new Error('Missing riskScore');
    if (!result.recommendation) throw new Error('Missing recommendation');
  });

  await test('predict() analyzes complexity', async () => {
    const mm = new MisterMind({ licenseKey: 'MM-TEST-1234-ABCD' });
    const complexCode = `
      if (a) {
        if (b) {
          for (let i = 0; i < 10; i++) {
            while (x) {
              switch (y) {
                case 1: break;
                case 2: break;
              }
            }
          }
        }
      }
    `;
    const result = await mm.predict({ codeChanges: complexCode });
    if (result.codeMetrics.complexity < 5) throw new Error('Should detect high complexity');
  });

  await test('chronos() records snapshots', async () => {
    const mm = new MisterMind({ licenseKey: 'MM-TEST-1234-ABCD' });
    const result = await mm.chronos({
      testFn: async () => { await new Promise(r => setTimeout(r, 50)); },
      autoSnapshot: true,
      snapshotInterval: 10
    });
    if (!result.success) throw new Error('Should succeed');
    if (result.snapshots.length < 2) throw new Error('Should have snapshots');
  });

  await test('chronos() captures errors', async () => {
    const mm = new MisterMind({ licenseKey: 'MM-TEST-1234-ABCD' });
    const result = await mm.chronos({
      testFn: async () => { throw new Error('Test error'); },
      autoSnapshot: false
    });
    if (result.success) throw new Error('Should fail');
    if (!result.error) throw new Error('Should have error message');
  });

  await test('apiSensei() requires baseUrl', async () => {
    const mm = new MisterMind({ licenseKey: 'MM-TEST-1234-ABCD' });
    try {
      await mm.apiSensei({});
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('baseUrl')) throw e;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // ASC (Adaptive Semantic Core) TESTS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📦 ASC (Adaptive Semantic Core) Tests:');

  await test('ASC requires PRO license for createSemanticMap', async () => {
    const mm = new MisterMind();
    try {
      await mm.createSemanticMap({});
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Pro license')) throw e;
    }
  });

  await test('ASC requires PRO license for findByIntent', async () => {
    const mm = new MisterMind();
    try {
      await mm.findByIntent({}, { action: 'TEST', keywords: ['test'] });
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Pro license')) throw e;
    }
  });

  await test('ASC requires PRO license for smartClick', async () => {
    const mm = new MisterMind();
    try {
      await mm.smartClick({}, ['login']);
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Pro license')) throw e;
    }
  });

  await test('ASC initializes with PRO license', () => {
    const mm = new MisterMind({ licenseKey: 'MM-TEST-1234-ABCD' });
    const asc = mm.getASC();
    if (!asc) throw new Error('ASC should be initialized with PRO license');
  });

  await test('ASC getStats returns null without init', () => {
    const mm = new MisterMind();
    const stats = mm.getASCStats();
    if (stats !== null) throw new Error('Should return null without ASC');
  });

  await test('ASC getStats returns object with PRO', () => {
    const mm = new MisterMind({ licenseKey: 'MM-TEST-1234-ABCD' });
    const stats = mm.getASCStats();
    if (!stats) throw new Error('Should return stats');
    if (typeof stats.totalEntries !== 'number') throw new Error('Missing totalEntries');
    if (typeof stats.successRate !== 'number') throw new Error('Missing successRate');
  });

  await test('doAction throws on unknown action', async () => {
    const mm = new MisterMind({ licenseKey: 'MM-TEST-1234-ABCD' });
    try {
      await mm.doAction({}, 'UNKNOWN_ACTION');
      throw new Error('Should have thrown');
    } catch (e) {
      if (!e.message.includes('Unknown action')) throw e;
    }
  });

  await test('CommonIntents are exported', () => {
    const { CommonIntents } = require('../dist/index.js');
    if (!CommonIntents) throw new Error('CommonIntents not exported');
    if (!CommonIntents.LOGIN) throw new Error('LOGIN intent missing');
    if (!CommonIntents.SUBMIT) throw new Error('SUBMIT intent missing');
    if (!CommonIntents.ADD_TO_CART) throw new Error('ADD_TO_CART intent missing');
  });

  await test('VERSION is 16.0.0', () => {
    const { VERSION } = require('../dist/index.js');
    if (VERSION !== '16.0.0') throw new Error(`Expected 16.0.0, got ${VERSION}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════════');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run with global timeout protection
const GLOBAL_TIMEOUT = 60000; // 1 minute max
const globalTimer = setTimeout(() => {
  console.error('\n❌ GLOBAL TIMEOUT - Tests took too long!');
  process.exit(1);
}, GLOBAL_TIMEOUT);

runTests()
  .then(() => clearTimeout(globalTimer))
  .catch((e) => {
    clearTimeout(globalTimer);
    console.error('Fatal error:', e);
    process.exit(1);
  });
