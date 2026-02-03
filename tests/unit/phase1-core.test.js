/**
 * ═══════════════════════════════════════════════════════════════════════════
 * UNIT TESTS - Phase 1 Core Modules
 * Tests for: config.js, dependency-manager.js, security-baseline.js,
 *            ml-pipeline.js, model-versioning.js, config-manager.js
 * ═══════════════════════════════════════════════════════════════════════════
 */

const assert = require('assert');

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

function test(name, fn) {
    try {
        fn();
        testsPassed++;
        testResults.push({ name, status: 'PASS' });
        console.log(`  ✅ ${name}`);
    } catch (error) {
        testsFailed++;
        testResults.push({ name, status: 'FAIL', error: error.message });
        console.log(`  ❌ ${name}: ${error.message}`);
    }
}

function describe(suiteName, fn) {
    console.log(`\n📦 ${suiteName}`);
    console.log('─'.repeat(50));
    fn();
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: config.js
// ═══════════════════════════════════════════════════════════════════════════

describe('EnvironmentConfig', () => {
    const { EnvironmentConfig } = require('../../config');

    test('should create with default environment', () => {
        const config = new EnvironmentConfig();
        assert.ok(config);
        assert.strictEqual(typeof config.get, 'function');
    });

    test('should accept environment parameter', () => {
        const config = new EnvironmentConfig('production');
        assert.ok(config);
    });

    test('should have get method', () => {
        const config = new EnvironmentConfig('development');
        assert.strictEqual(typeof config.get, 'function');
    });

    test('should have set method', () => {
        const config = new EnvironmentConfig();
        assert.strictEqual(typeof config.set, 'function');
    });

    test('should store and retrieve values', () => {
        const config = new EnvironmentConfig();
        config.set('testKey', 'testValue');
        assert.strictEqual(config.get('testKey'), 'testValue');
    });

    test('should return null for missing keys (default)', () => {
        const config = new EnvironmentConfig();
        assert.strictEqual(config.get('nonexistent'), null);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: dependency-manager.js
// ═══════════════════════════════════════════════════════════════════════════

describe('DependencyManager', () => {
    const { DependencyManager, Container, VersionResolver } = require('../../dependency-manager');

    test('DependencyManager should exist', () => {
        assert.ok(DependencyManager);
    });

    test('should create DependencyManager instance', () => {
        const dm = new DependencyManager();
        assert.ok(dm);
    });

    test('DependencyManager should have checkNodePackage method', () => {
        const dm = new DependencyManager();
        assert.strictEqual(typeof dm.checkNodePackage, 'function');
    });

    test('DependencyManager should have checkAllDependencies method', () => {
        const dm = new DependencyManager();
        assert.strictEqual(typeof dm.checkAllDependencies, 'function');
    });

    test('DependencyManager should have getSummary method', () => {
        const dm = new DependencyManager();
        assert.strictEqual(typeof dm.getSummary, 'function');
    });

    test('Container should exist', () => {
        assert.ok(Container);
    });

    test('Container should be constructable', () => {
        const container = new Container();
        assert.ok(container);
    });

    test('Container should have register method', () => {
        const container = new Container();
        assert.strictEqual(typeof container.register, 'function');
    });

    test('Container should have resolve method', () => {
        const container = new Container();
        assert.strictEqual(typeof container.resolve, 'function');
    });

    test('Container should register and resolve services', () => {
        const container = new Container();
        class TestService { getValue() { return 'test'; } }
        container.register('testService', TestService);
        const instance = container.resolve('testService');
        assert.ok(instance);
        assert.strictEqual(instance.getValue(), 'test');
    });

    test('Container should support singletons', () => {
        const container = new Container();
        class Counter { constructor() { this.count = 0; } }
        container.registerSingleton('counter', Counter);
        const c1 = container.resolve('counter');
        c1.count = 5;
        const c2 = container.resolve('counter');
        assert.strictEqual(c2.count, 5); // Same instance
    });

    test('VersionResolver should exist', () => {
        assert.ok(VersionResolver);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: security-baseline.js
// ═══════════════════════════════════════════════════════════════════════════

describe('SecurityBaseline', () => {
    const { SecurityBaseline, RBAC, Encryption } = require('../../security-baseline');

    test('SecurityBaseline should exist', () => {
        assert.ok(SecurityBaseline);
    });

    test('should create SecurityBaseline instance', () => {
        const security = new SecurityBaseline();
        assert.ok(security);
    });

    test('SecurityBaseline should have encrypt method', () => {
        const security = new SecurityBaseline();
        assert.strictEqual(typeof security.encrypt, 'function');
    });

    test('SecurityBaseline should have decrypt method', () => {
        const security = new SecurityBaseline();
        assert.strictEqual(typeof security.decrypt, 'function');
    });

    test('RBAC should exist', () => {
        assert.ok(RBAC);
    });

    test('RBAC should be constructable', () => {
        const rbac = new RBAC();
        assert.ok(rbac);
    });

    test('RBAC should have can method', () => {
        const rbac = new RBAC();
        assert.strictEqual(typeof rbac.can, 'function');
    });

    test('RBAC should have addRole method', () => {
        const rbac = new RBAC();
        assert.strictEqual(typeof rbac.addRole, 'function');
    });

    test('RBAC should manage roles and permissions', () => {
        const rbac = new RBAC();
        rbac.addRole('editor', ['document:read', 'document:write']);
        rbac.assignRole('user1', 'editor');
        assert.strictEqual(rbac.can('user1', 'document:read'), true);
        assert.strictEqual(rbac.can('user1', 'document:delete'), false);
    });

    test('Encryption should exist', () => {
        assert.ok(Encryption);
    });

    test('Encryption should be constructable', () => {
        const enc = new Encryption();
        assert.ok(enc);
    });

    test('Encryption should have encrypt method', () => {
        const enc = new Encryption();
        assert.strictEqual(typeof enc.encrypt, 'function');
    });

    test('Encryption should have decrypt method', () => {
        const enc = new Encryption();
        assert.strictEqual(typeof enc.decrypt, 'function');
    });

    test('Encryption should have deriveKey method', () => {
        const enc = new Encryption();
        assert.strictEqual(typeof enc.deriveKey, 'function');
    });

    test('Encryption encrypt/decrypt roundtrip', () => {
        const enc = new Encryption();
        const { key } = enc.deriveKey('testPassword');
        const original = { message: 'Hello World', value: 42 };
        const encrypted = enc.encrypt(original, key);
        const decrypted = enc.decrypt(encrypted, key);
        assert.deepStrictEqual(decrypted, original);
    });

    test('Encryption should have hash method', () => {
        const enc = new Encryption();
        const hash = enc.hash('test data');
        assert.strictEqual(typeof hash, 'string');
        assert.strictEqual(hash.length, 64); // SHA256 hex
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: ml-pipeline.js
// ═══════════════════════════════════════════════════════════════════════════

describe('MLPipeline (DataPipeline)', () => {
    const { DataPipeline, DataLoader, FeatureEngineer, trainTestSplit } = require('../../ml-pipeline');

    test('DataPipeline should exist', () => {
        assert.ok(DataPipeline);
    });

    test('should create DataPipeline instance', () => {
        const pipeline = new DataPipeline();
        assert.ok(pipeline);
    });

    test('DataPipeline should have addStage method', () => {
        const pipeline = new DataPipeline();
        assert.strictEqual(typeof pipeline.addStage, 'function');
    });

    test('DataPipeline should have map method', () => {
        const pipeline = new DataPipeline();
        assert.strictEqual(typeof pipeline.map, 'function');
    });

    test('DataPipeline should have filter method', () => {
        const pipeline = new DataPipeline();
        assert.strictEqual(typeof pipeline.filter, 'function');
    });

    test('DataLoader should exist', () => {
        assert.ok(DataLoader);
    });

    test('DataLoader should be constructable', () => {
        const loader = new DataLoader();
        assert.ok(loader);
    });

    test('FeatureEngineer should exist', () => {
        assert.ok(FeatureEngineer);
    });

    test('FeatureEngineer should be constructable', () => {
        const fe = new FeatureEngineer();
        assert.ok(fe);
    });

    test('trainTestSplit should exist', () => {
        assert.ok(trainTestSplit);
        assert.strictEqual(typeof trainTestSplit, 'function');
    });

    test('trainTestSplit should split data', () => {
        const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const { train, test } = trainTestSplit(data, { testSize: 0.2 });
        assert.strictEqual(train.length, 8);
        assert.strictEqual(test.length, 2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: model-versioning.js
// ═══════════════════════════════════════════════════════════════════════════

describe('ModelVersioning', () => {
    const { ModelVersionControl, ExperimentTracker, ArtifactManager } = require('../../model-versioning');

    test('ModelVersionControl should exist', () => {
        assert.ok(ModelVersionControl);
    });

    test('should create ModelVersionControl instance', () => {
        const vc = new ModelVersionControl({ repositoryPath: './.test-models' });
        assert.ok(vc);
    });

    test('ModelVersionControl should have registerModel method', () => {
        const vc = new ModelVersionControl({ repositoryPath: './.test-models' });
        assert.strictEqual(typeof vc.registerModel, 'function');
    });

    test('ExperimentTracker should exist', () => {
        assert.ok(ExperimentTracker);
    });

    test('ArtifactManager should exist', () => {
        assert.ok(ArtifactManager);
    });

    test('ArtifactManager should be constructable', () => {
        const am = new ArtifactManager('./.test-artifacts');
        assert.ok(am);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTS: config-manager.js
// ═══════════════════════════════════════════════════════════════════════════

describe('ConfigManager', () => {
    const { 
        ConfigurationManager, 
        ConfigManager, 
        ConfigSchema, 
        SchemaValidator,
        EnvironmentProfiles 
    } = require('../../config-manager');

    test('ConfigurationManager should exist', () => {
        assert.ok(ConfigurationManager);
    });

    test('ConfigManager alias should exist', () => {
        assert.ok(ConfigManager);
        assert.strictEqual(ConfigManager, ConfigurationManager);
    });

    test('should create ConfigManager instance', () => {
        const cm = new ConfigManager();
        assert.ok(cm);
    });

    test('ConfigManager should have validate method', () => {
        const cm = new ConfigManager();
        assert.strictEqual(typeof cm.validate, 'function');
    });

    test('ConfigManager should have get method', () => {
        const cm = new ConfigManager();
        assert.strictEqual(typeof cm.get, 'function');
    });

    test('ConfigManager should have set method', () => {
        const cm = new ConfigManager();
        assert.strictEqual(typeof cm.set, 'function');
    });

    test('ConfigSchema should exist', () => {
        assert.ok(ConfigSchema);
    });

    test('SchemaValidator alias should exist', () => {
        assert.ok(SchemaValidator);
        assert.strictEqual(SchemaValidator, ConfigSchema);
    });

    test('SchemaValidator should be constructable', () => {
        const sv = new SchemaValidator();
        assert.ok(sv);
    });

    test('SchemaValidator should have define method', () => {
        const sv = new SchemaValidator();
        assert.strictEqual(typeof sv.define, 'function');
    });

    test('SchemaValidator should have validate method', () => {
        const sv = new SchemaValidator();
        assert.strictEqual(typeof sv.validate, 'function');
    });

    test('EnvironmentProfiles should exist', () => {
        assert.ok(EnvironmentProfiles);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(50));
console.log('📊 PHASE 1 CORE - TEST SUMMARY');
console.log('═'.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('═'.repeat(50));

// Export for CI
module.exports = {
    passed: testsPassed,
    failed: testsFailed,
    results: testResults
};

if (testsFailed > 0) {
    process.exit(1);
}
