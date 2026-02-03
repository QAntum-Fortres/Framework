/**
 * SOVEREIGN SINGULARITY - Phase 1 Selectors Unit Tests
 * Step 13: Data Source Selector
 * Step 14: Feature Selector
 */

const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// SIMPLE TEST HARNESS
// ═══════════════════════════════════════════════════════════════════════════════

let currentSuite = '';
let testResults = { passed: 0, failed: 0, errors: [] };

function describe(name, fn) {
    currentSuite = name;
    console.log(`\n📦 ${name}`);
    fn();
}

function test(name, fn) {
    try {
        fn();
        testResults.passed++;
        console.log(`  ✅ ${name}`);
    } catch (error) {
        testResults.failed++;
        testResults.errors.push({ suite: currentSuite, test: name, error: error.message });
        console.log(`  ❌ ${name}: ${error.message}`);
    }
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) {
                throw new Error(`Expected ${expected} but got ${actual}`);
            }
        },
        toEqual(expected) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
            }
        },
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected truthy but got ${actual}`);
            }
        },
        toBeFalsy() {
            if (actual) {
                throw new Error(`Expected falsy but got ${actual}`);
            }
        },
        toBeGreaterThan(expected) {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} > ${expected}`);
            }
        },
        toBeGreaterThanOrEqual(expected) {
            if (actual < expected) {
                throw new Error(`Expected ${actual} >= ${expected}`);
            }
        },
        toBeLessThan(expected) {
            if (actual >= expected) {
                throw new Error(`Expected ${actual} < ${expected}`);
            }
        },
        toBeLessThanOrEqual(expected) {
            if (actual > expected) {
                throw new Error(`Expected ${actual} <= ${expected}`);
            }
        },
        toBeInstanceOf(expected) {
            if (!(actual instanceof expected)) {
                throw new Error(`Expected instance of ${expected.name}`);
            }
        },
        toHaveProperty(prop) {
            if (!(prop in actual)) {
                throw new Error(`Expected to have property ${prop}`);
            }
        },
        toContain(expected) {
            if (Array.isArray(actual)) {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected array to contain ${expected}`);
                }
            } else if (typeof actual === 'string') {
                if (!actual.includes(expected)) {
                    throw new Error(`Expected string to contain ${expected}`);
                }
            }
        },
        toBeNull() {
            if (actual !== null) {
                throw new Error(`Expected null but got ${actual}`);
            }
        },
        toBeUndefined() {
            if (actual !== undefined) {
                throw new Error(`Expected undefined but got ${actual}`);
            }
        },
        toBeDefined() {
            if (actual === undefined) {
                throw new Error(`Expected defined but got undefined`);
            }
        },
        toThrow(expectedMessage) {
            if (typeof actual !== 'function') {
                throw new Error(`Expected a function`);
            }
            try {
                actual();
                throw new Error(`Expected function to throw`);
            } catch (e) {
                if (expectedMessage && !e.message.includes(expectedMessage)) {
                    throw new Error(`Expected error message to contain "${expectedMessage}" but got "${e.message}"`);
                }
            }
        },
        toHaveLength(expected) {
            if (actual.length !== expected) {
                throw new Error(`Expected length ${expected} but got ${actual.length}`);
            }
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD MODULES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('SOVEREIGN SINGULARITY - Phase 1 Selectors Unit Tests (Steps 13-14)');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

const { 
    DataSource, 
    FileDataSource, 
    DatabaseDataSource, 
    APIDataSource, 
    StreamDataSource, 
    DataSourceSelector, 
    getSelector, 
    createSource 
} = require('../../selectors/data-selector');

const { 
    FeatureSelector, 
    AutoFeatureSelector, 
    createSelector, 
    createAutoSelector 
} = require('../../selectors/feature-selector');

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 13: DATA SOURCE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 13: DataSource - Base Class', () => {
    test('should create DataSource with default options', () => {
        const source = new DataSource();
        expect(source).toBeInstanceOf(DataSource);
        expect(source.type).toBe('generic');
    });

    test('should create DataSource with custom type', () => {
        const source = new DataSource({ type: 'custom' });
        expect(source.type).toBe('custom');
    });

    test('should have initial state as disconnected', () => {
        const source = new DataSource();
        expect(source.state.connected).toBe(false);
    });

    test('should have initial accessCount of 0', () => {
        const source = new DataSource();
        expect(source.state.accessCount).toBe(0);
    });

    test('should calculate health score', () => {
        const source = new DataSource();
        const health = source.getHealthScore();
        expect(health).toBeGreaterThanOrEqual(0);
        expect(health).toBeLessThanOrEqual(1);
    });

    test('should emit events (inherits EventEmitter)', () => {
        const source = new DataSource();
        let emitted = false;
        source.on('test', () => { emitted = true; });
        source.emit('test');
        expect(emitted).toBe(true);
    });

    test('should track lastAccess state', () => {
        const source = new DataSource();
        expect(source.state.lastAccess).toBe(null);
    });

    test('should have getInfo method', () => {
        const source = new DataSource({ type: 'test' });
        const info = source.getInfo();
        expect(info).toHaveProperty('type');
        expect(info.type).toBe('test');
    });
});

describe('Step 13: DataSource - Connect/Disconnect', () => {
    test('should connect successfully', async () => {
        const source = new DataSource();
        await source.connect();
        expect(source.state.connected).toBe(true);
    });

    test('should disconnect successfully', async () => {
        const source = new DataSource();
        await source.connect();
        await source.disconnect();
        expect(source.state.connected).toBe(false);
    });

    test('should emit connected event', async () => {
        const source = new DataSource();
        let eventFired = false;
        source.on('connected', () => { eventFired = true; });
        await source.connect();
        expect(eventFired).toBe(true);
    });

    test('should emit disconnected event', async () => {
        const source = new DataSource();
        let eventFired = false;
        source.on('disconnected', () => { eventFired = true; });
        await source.connect();
        await source.disconnect();
        expect(eventFired).toBe(true);
    });

    test('should check availability', async () => {
        const source = new DataSource();
        await source.connect();
        const available = await source.isAvailable();
        expect(available).toBe(true);
    });
});

describe('Step 13: FileDataSource', () => {
    test('should create FileDataSource with defaults', () => {
        const source = new FileDataSource();
        expect(source).toBeInstanceOf(FileDataSource);
        expect(source.type).toBe('file');
    });

    test('should accept basePath option', () => {
        const source = new FileDataSource({ basePath: '/path/to/data' });
        expect(source.basePath).toBe('/path/to/data');
    });

    test('should default basePath to ./data', () => {
        const source = new FileDataSource();
        expect(source.basePath).toBe('./data');
    });

    test('should default format to json', () => {
        const source = new FileDataSource();
        expect(source.format).toBe('json');
    });

    test('should accept custom csv format', () => {
        const source = new FileDataSource({ format: 'csv' });
        expect(source.format).toBe('csv');
    });

    test('should have read method', () => {
        const source = new FileDataSource();
        expect(typeof source.read).toBe('function');
    });

    test('should have write method', () => {
        const source = new FileDataSource();
        expect(typeof source.write).toBe('function');
    });

    test('should have _parseCSV method', () => {
        const source = new FileDataSource();
        expect(typeof source._parseCSV).toBe('function');
    });

    test('should parse CSV content correctly', () => {
        const source = new FileDataSource();
        const csv = 'name,value\ntest,123';
        const result = source._parseCSV(csv);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('test');
        // CSV parsing may auto-convert numeric values
        expect(result[0].value == 123).toBe(true);
    });

    test('should have _toCSV method', () => {
        const source = new FileDataSource();
        expect(typeof source._toCSV).toBe('function');
    });
});

describe('Step 13: DatabaseDataSource', () => {
    test('should create DatabaseDataSource with defaults', () => {
        const source = new DatabaseDataSource();
        expect(source).toBeInstanceOf(DatabaseDataSource);
        expect(source.type).toBe('database');
    });

    test('should accept connectionString option', () => {
        const source = new DatabaseDataSource({ connectionString: 'postgres://localhost' });
        expect(source.connectionString).toBe('postgres://localhost');
    });

    test('should default to postgres dbType', () => {
        const source = new DatabaseDataSource();
        expect(source.dbType).toBe('postgres');
    });

    test('should accept custom dbType', () => {
        const source = new DatabaseDataSource({ dbType: 'mysql' });
        expect(source.dbType).toBe('mysql');
    });

    test('should connect and set state', async () => {
        const source = new DatabaseDataSource();
        await source.connect();
        expect(source.state.connected).toBe(true);
    });

    test('should emit connected event', async () => {
        const source = new DatabaseDataSource();
        let eventFired = false;
        source.on('connected', () => { eventFired = true; });
        await source.connect();
        expect(eventFired).toBe(true);
    });

    test('should read data (simulated)', async () => {
        const source = new DatabaseDataSource();
        const data = await source.read();
        expect(Array.isArray(data)).toBe(true);
    });

    test('should write data (simulated)', async () => {
        const source = new DatabaseDataSource();
        const result = await source.write([{ id: 1 }]);
        expect(result).toHaveProperty('inserted');
    });

    test('should have query method', async () => {
        const source = new DatabaseDataSource();
        expect(typeof source.query).toBe('function');
        const result = await source.query('SELECT * FROM test');
        expect(Array.isArray(result)).toBe(true);
    });

    test('should inherit from DataSource', () => {
        const source = new DatabaseDataSource();
        expect(source).toBeInstanceOf(DataSource);
    });
});

describe('Step 13: APIDataSource', () => {
    test('should create APIDataSource with defaults', () => {
        const source = new APIDataSource();
        expect(source).toBeInstanceOf(APIDataSource);
        expect(source.type).toBe('api');
    });

    test('should accept baseUrl option', () => {
        const source = new APIDataSource({ baseUrl: 'https://api.example.com' });
        expect(source.baseUrl).toBe('https://api.example.com');
    });

    test('should accept headers option', () => {
        const source = new APIDataSource({ headers: { 'X-API-Key': 'test' } });
        expect(source.headers['X-API-Key']).toBe('test');
    });

    test('should accept auth option', () => {
        const source = new APIDataSource({ auth: { type: 'bearer', token: 'abc' } });
        expect(source.auth.type).toBe('bearer');
    });

    test('should read data (simulated)', async () => {
        const source = new APIDataSource({ baseUrl: 'https://api.example.com' });
        const data = await source.read({ endpoint: '/users' });
        expect(data).toHaveProperty('source');
        expect(data.source).toBe('api');
    });

    test('should write data (simulated)', async () => {
        const source = new APIDataSource({ baseUrl: 'https://api.example.com' });
        const result = await source.write({ name: 'test' });
        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);
    });

    test('should inherit from DataSource', () => {
        const source = new APIDataSource();
        expect(source).toBeInstanceOf(DataSource);
    });
});

describe('Step 13: StreamDataSource', () => {
    test('should create StreamDataSource with defaults', () => {
        const source = new StreamDataSource();
        expect(source).toBeInstanceOf(StreamDataSource);
        expect(source.type).toBe('stream');
    });

    test('should have default bufferSize', () => {
        const source = new StreamDataSource();
        expect(source.bufferSize).toBe(1000);
    });

    test('should accept custom bufferSize', () => {
        const source = new StreamDataSource({ bufferSize: 500 });
        expect(source.bufferSize).toBe(500);
    });

    test('should have empty buffer initially', () => {
        const source = new StreamDataSource();
        expect(source.buffer).toEqual([]);
    });

    test('should push items to buffer', async () => {
        const source = new StreamDataSource({ bufferSize: 100 });
        await source.push({ data: 'test' });
        expect(source.buffer).toHaveLength(1);
    });

    test('should have read as async generator', async () => {
        const source = new StreamDataSource();
        const reader = source.read();
        expect(reader[Symbol.asyncIterator]).toBeTruthy();
    });

    test('should yield items from stream', async () => {
        const source = new StreamDataSource();
        const items = [];
        for await (const item of source.read()) {
            items.push(item);
            if (items.length >= 3) break;
        }
        expect(items.length).toBeGreaterThanOrEqual(3);
    });

    test('should inherit from DataSource', () => {
        const source = new StreamDataSource();
        expect(source).toBeInstanceOf(DataSource);
    });
});

describe('Step 13: DataSourceSelector - Constructor', () => {
    test('should create selector with default options', () => {
        const selector = new DataSourceSelector();
        expect(selector).toBeInstanceOf(DataSourceSelector);
    });

    test('should default to priority strategy', () => {
        const selector = new DataSourceSelector();
        expect(selector.options.strategy).toBe('priority');
    });

    test('should accept custom strategy', () => {
        const selector = new DataSourceSelector({ strategy: 'health' });
        expect(selector.options.strategy).toBe('health');
    });

    test('should enable fallback by default', () => {
        const selector = new DataSourceSelector();
        expect(selector.options.fallbackEnabled).toBe(true);
    });

    test('should allow disabling fallback', () => {
        const selector = new DataSourceSelector({ fallbackEnabled: false });
        expect(selector.options.fallbackEnabled).toBe(false);
    });

    test('should have default healthThreshold', () => {
        const selector = new DataSourceSelector();
        expect(selector.options.healthThreshold).toBe(0.5);
    });

    test('should have empty sources map', () => {
        const selector = new DataSourceSelector();
        expect(selector.sources.size).toBe(0);
    });

    test('should have empty history', () => {
        const selector = new DataSourceSelector();
        expect(selector.history).toHaveLength(0);
    });
});

describe('Step 13: DataSourceSelector - Registration', () => {
    test('should register a DataSource instance', () => {
        const selector = new DataSourceSelector();
        const source = new FileDataSource({ filePath: 'test.json' });
        selector.register('file1', source);
        expect(selector.sources.size).toBe(1);
    });

    test('should register source with priority', () => {
        const selector = new DataSourceSelector();
        const source = new FileDataSource();
        selector.register('file1', source, 10);
        expect(selector.sources.get('file1').priority).toBe(10);
    });

    test('should register source from config object', () => {
        const selector = new DataSourceSelector();
        selector.register('db1', { type: 'database', connectionString: 'test' });
        expect(selector.sources.size).toBe(1);
    });

    test('should emit source:registered event', () => {
        const selector = new DataSourceSelector();
        let eventData = null;
        selector.on('source:registered', (data) => { eventData = data; });
        selector.register('file1', new FileDataSource());
        expect(eventData).toBeTruthy();
        expect(eventData.name).toBe('file1');
    });

    test('should return self for chaining', () => {
        const selector = new DataSourceSelector();
        const result = selector.register('file1', new FileDataSource());
        expect(result).toBe(selector);
    });

    test('should register multiple sources', () => {
        const selector = new DataSourceSelector();
        selector.register('file1', new FileDataSource());
        selector.register('db1', new DatabaseDataSource());
        selector.register('api1', new APIDataSource());
        expect(selector.sources.size).toBe(3);
    });
});

describe('Step 13: DataSourceSelector - Selection', () => {
    test('should select source by priority', async () => {
        const selector = new DataSourceSelector({ strategy: 'priority' });
        const source1 = new FileDataSource();
        const source2 = new DatabaseDataSource();
        await source1.connect();
        await source2.connect();
        selector.register('file1', source1, 5);
        selector.register('db1', source2, 10);
        const selected = selector.selectSource();
        expect(selected.name).toBe('db1');
    });

    test('should select source by health', async () => {
        const selector = new DataSourceSelector({ strategy: 'health' });
        const source1 = new FileDataSource();
        const source2 = new DatabaseDataSource();
        await source1.connect();
        await source2.connect();
        selector.register('file1', source1);
        selector.register('db1', source2);
        const selected = selector.selectSource();
        expect(selected).toBeTruthy();
    });

    test('should throw if no suitable source', () => {
        const selector = new DataSourceSelector();
        expect(() => selector.selectSource()).toThrow('No suitable data source found');
    });

    test('should filter by type requirement', async () => {
        const selector = new DataSourceSelector();
        const source1 = new FileDataSource();
        const source2 = new DatabaseDataSource();
        await source1.connect();
        await source2.connect();
        selector.register('file1', source1);
        selector.register('db1', source2);
        const selected = selector.selectSource({ type: 'database' });
        expect(selected.type).toBe('database');
    });

    test('should emit source:selected event', async () => {
        const selector = new DataSourceSelector();
        const source = new FileDataSource();
        await source.connect();
        selector.register('file1', source);
        let eventData = null;
        selector.on('source:selected', (data) => { eventData = data; });
        selector.selectSource();
        expect(eventData).toBeTruthy();
        expect(eventData.source).toBe('file1');
    });

    test('should record selection in history', async () => {
        const selector = new DataSourceSelector();
        const source = new FileDataSource();
        await source.connect();
        selector.register('file1', source);
        selector.selectSource();
        expect(selector.history).toHaveLength(1);
    });
});

describe('Step 13: DataSourceSelector - Read Operations', () => {
    test('should read from selected source', async () => {
        const selector = new DataSourceSelector();
        const source = new DatabaseDataSource();
        await source.connect();
        selector.register('db1', source);
        const data = await selector.read();
        expect(Array.isArray(data)).toBe(true);
    });

    test('should read with requirements filter', async () => {
        const selector = new DataSourceSelector();
        const source1 = new FileDataSource();
        const source2 = new DatabaseDataSource();
        await source1.connect();
        await source2.connect();
        selector.register('file1', source1);
        selector.register('db1', source2);
        const data = await selector.read({}, { type: 'database' });
        expect(Array.isArray(data)).toBe(true);
    });
});

describe('Step 13: DataSourceSelector - Strategies', () => {
    test('should support latency strategy', async () => {
        const selector = new DataSourceSelector({ strategy: 'latency' });
        const source = new FileDataSource();
        await source.connect();
        selector.register('file1', source);
        const selected = selector.selectSource();
        expect(selected).toBeTruthy();
    });

    test('should support round-robin strategy', async () => {
        const selector = new DataSourceSelector({ strategy: 'round-robin' });
        const source1 = new FileDataSource();
        const source2 = new DatabaseDataSource();
        await source1.connect();
        await source2.connect();
        selector.register('file1', source1);
        selector.register('db1', source2);
        const selected1 = selector.selectSource();
        const selected2 = selector.selectSource();
        // Round-robin should cycle through sources
        expect(selected1).toBeTruthy();
        expect(selected2).toBeTruthy();
    });
});

describe('Step 13: Factory Functions', () => {
    test('getSelector should return singleton', () => {
        const selector1 = getSelector();
        const selector2 = getSelector();
        expect(selector1).toBe(selector2);
    });

    test('createSource should create FileDataSource', () => {
        const source = createSource('file', { filePath: 'test.json' });
        expect(source).toBeInstanceOf(FileDataSource);
    });

    test('createSource should create DatabaseDataSource', () => {
        const source = createSource('database', { connectionString: 'test' });
        expect(source).toBeInstanceOf(DatabaseDataSource);
    });

    test('createSource should create APIDataSource', () => {
        const source = createSource('api', { baseUrl: 'https://api.example.com' });
        expect(source).toBeInstanceOf(APIDataSource);
    });

    test('createSource should create StreamDataSource', () => {
        const source = createSource('stream', { bufferSize: 100 });
        expect(source).toBeInstanceOf(StreamDataSource);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 14: FEATURE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 14: FeatureSelector - Constructor', () => {
    test('should create FeatureSelector with default options', () => {
        const selector = new FeatureSelector();
        expect(selector).toBeInstanceOf(FeatureSelector);
    });

    test('should have default minVariance', () => {
        const selector = new FeatureSelector();
        expect(selector.options.minVariance).toBe(0.01);
    });

    test('should accept custom minVariance', () => {
        const selector = new FeatureSelector({ minVariance: 0.05 });
        expect(selector.options.minVariance).toBe(0.05);
    });

    test('should have default correlationThreshold', () => {
        const selector = new FeatureSelector();
        expect(selector.options.correlationThreshold).toBe(0.95);
    });

    test('should have empty featureStats map', () => {
        const selector = new FeatureSelector();
        expect(selector.featureStats.size).toBe(0);
    });

    test('should have empty selectedFeatures array', () => {
        const selector = new FeatureSelector();
        expect(selector.selectedFeatures).toHaveLength(0);
    });
});

describe('Step 14: FeatureSelector - Analyze', () => {
    const sampleData = [
        { age: 25, income: 50000, score: 80, city: 'NY' },
        { age: 30, income: 60000, score: 85, city: 'LA' },
        { age: 35, income: 70000, score: 90, city: 'NY' },
        { age: 40, income: 80000, score: 75, city: 'SF' },
        { age: 45, income: 90000, score: 95, city: 'LA' }
    ];

    test('should analyze numeric features', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        expect(selector.featureStats.size).toBeGreaterThan(0);
    });

    test('should detect numeric feature type', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const ageStats = selector.featureStats.get('age');
        expect(ageStats.type).toBe('numeric');
    });

    test('should detect categorical feature type', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const cityStats = selector.featureStats.get('city');
        expect(cityStats.type).toBe('categorical');
    });

    test('should calculate mean for numeric features', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const ageStats = selector.featureStats.get('age');
        expect(ageStats.mean).toBe(35); // (25+30+35+40+45)/5
    });

    test('should calculate variance for numeric features', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const ageStats = selector.featureStats.get('age');
        expect(ageStats.variance).toBeGreaterThan(0);
    });

    test('should calculate importance score', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const ageStats = selector.featureStats.get('age');
        expect(ageStats.importance).toBeGreaterThanOrEqual(0);
        expect(ageStats.importance).toBeLessThanOrEqual(1);
    });

    test('should emit analyzed event', () => {
        const selector = new FeatureSelector();
        let eventData = null;
        selector.on('analyzed', (data) => { eventData = data; });
        selector.analyze(sampleData);
        expect(eventData).toBeTruthy();
        expect(eventData.features).toBeGreaterThan(0);
    });

    test('should analyze with target column', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData, 'score');
        const ageStats = selector.featureStats.get('age');
        expect(ageStats).toBeTruthy();
    });

    test('should calculate target correlation when target provided', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData, 'score');
        const ageStats = selector.featureStats.get('age');
        expect(ageStats.targetCorrelation).toBeDefined();
    });

    test('should count unique values for categorical', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const cityStats = selector.featureStats.get('city');
        expect(cityStats.uniqueCount).toBe(3); // NY, LA, SF
    });
});

describe('Step 14: FeatureSelector - Selection Methods', () => {
    const sampleData = [
        { a: 1, b: 100, c: 0.001, d: 1 },
        { a: 2, b: 200, c: 0.001, d: 2 },
        { a: 3, b: 300, c: 0.001, d: 3 },
        { a: 4, b: 400, c: 0.001, d: 4 },
        { a: 5, b: 500, c: 0.001, d: 5 }
    ];

    test('should select by variance', () => {
        const selector = new FeatureSelector({ minVariance: 0.001 });
        selector.analyze(sampleData);
        selector.selectByVariance();
        expect(selector.selectedFeatures.length).toBeGreaterThan(0);
    });

    test('should filter low variance features with high threshold', () => {
        // Feature 'c' has constant value 0.001, so variance is 0
        const selector = new FeatureSelector({ minVariance: 1 });
        selector.analyze(sampleData);
        selector.selectByVariance();
        // 'c' should not be selected with high variance threshold
        expect(selector.selectedFeatures.includes('c')).toBe(false);
    });

    test('should emit selected event on variance selection', () => {
        const selector = new FeatureSelector();
        let eventData = null;
        selector.on('selected', (data) => { eventData = data; });
        selector.analyze(sampleData);
        selector.selectByVariance();
        expect(eventData).toBeTruthy();
        expect(eventData.method).toBe('variance');
    });

    test('should select by correlation', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData, 'd');
        selector.selectByCorrelation();
        expect(selector.selectedFeatures.length).toBeGreaterThan(0);
    });

    test('should remove high correlation features', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        selector.selectByVariance();
        const removed = selector.removeHighCorrelation(sampleData);
        expect(Array.isArray(removed)).toBe(true);
    });

    test('should select top K features', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const ranked = selector.selectTopK(2);
        expect(ranked).toHaveLength(2);
    });

    test('should emit selected event on top K', () => {
        const selector = new FeatureSelector();
        let eventData = null;
        selector.on('selected', (data) => { eventData = data; });
        selector.analyze(sampleData);
        selector.selectTopK(3);
        expect(eventData).toBeTruthy();
        expect(eventData.method).toBe('top_k');
    });
});

describe('Step 14: FeatureSelector - Transform', () => {
    const sampleData = [
        { a: 1, b: 2, c: 3 },
        { a: 4, b: 5, c: 6 }
    ];

    test('should transform data to selected features', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        selector.selectByVariance();
        const transformed = selector.transform(sampleData);
        expect(transformed).toHaveLength(2);
    });

    test('should throw if no features selected', () => {
        const selector = new FeatureSelector();
        expect(() => selector.transform(sampleData)).toThrow('No features selected');
    });

    test('should fitTransform in one step', () => {
        const selector = new FeatureSelector();
        const transformed = selector.fitTransform(sampleData);
        expect(transformed).toHaveLength(2);
    });

    test('should fitTransform with variance method', () => {
        const selector = new FeatureSelector();
        const transformed = selector.fitTransform(sampleData, null, 'variance');
        expect(transformed).toHaveLength(2);
    });

    test('should fitTransform with correlation method', () => {
        const selector = new FeatureSelector();
        const transformed = selector.fitTransform(sampleData, 'c', 'correlation');
        expect(transformed).toHaveLength(2);
    });

    test('should fitTransform with top_k method', () => {
        const selector = new FeatureSelector({ maxFeatures: 2 });
        const transformed = selector.fitTransform(sampleData, null, 'top_k');
        expect(transformed).toHaveLength(2);
    });
});

describe('Step 14: FeatureSelector - Utilities', () => {
    const sampleData = [
        { a: 1, b: 2 },
        { a: 2, b: 4 },
        { a: 3, b: 6 }
    ];

    test('should get selected features', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        selector.selectByVariance();
        const selected = selector.getSelected();
        expect(Array.isArray(selected)).toBe(true);
    });

    test('should get importance ranking', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const ranking = selector.getImportanceRanking();
        expect(Array.isArray(ranking)).toBe(true);
        expect(ranking[0]).toHaveProperty('name');
        expect(ranking[0]).toHaveProperty('importance');
    });

    test('should export config', () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        selector.selectByVariance();
        const config = selector.exportConfig();
        expect(config).toHaveProperty('options');
        expect(config).toHaveProperty('selectedFeatures');
        expect(config).toHaveProperty('featureStats');
    });

    test('should import config', () => {
        const selector1 = new FeatureSelector();
        selector1.analyze(sampleData);
        selector1.selectByVariance();
        const config = selector1.exportConfig();
        
        const selector2 = new FeatureSelector();
        selector2.importConfig(config);
        expect(selector2.selectedFeatures).toEqual(selector1.selectedFeatures);
    });

    test('should calculate Pearson correlation', () => {
        const selector = new FeatureSelector();
        // Access private method for testing
        const corr = selector._pearsonCorrelation([1, 2, 3], [1, 2, 3]);
        expect(corr).toBeGreaterThan(0.99);
    });
});

describe('Step 14: FeatureSelector - RFE', () => {
    const sampleData = [
        { a: 1, b: 2, c: 3, d: 4, target: 10 },
        { a: 2, b: 3, c: 4, d: 5, target: 14 },
        { a: 3, b: 4, c: 5, d: 6, target: 18 }
    ];

    test('should perform recursive feature elimination', async () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        const selected = await selector.rfe(sampleData, 'target', null, 2);
        expect(selected).toHaveLength(2);
    });

    test('should emit rfe:iteration event', async () => {
        const selector = new FeatureSelector();
        selector.analyze(sampleData);
        let iterations = 0;
        selector.on('rfe:iteration', () => { iterations++; });
        await selector.rfe(sampleData, 'target', null, 2);
        expect(iterations).toBeGreaterThan(0);
    });
});

describe('Step 14: AutoFeatureSelector - Constructor', () => {
    test('should create AutoFeatureSelector', () => {
        const selector = new AutoFeatureSelector();
        expect(selector).toBeInstanceOf(AutoFeatureSelector);
    });

    test('should inherit from FeatureSelector', () => {
        const selector = new AutoFeatureSelector();
        expect(selector).toBeInstanceOf(FeatureSelector);
    });

    test('should enable variance filter by default', () => {
        const selector = new AutoFeatureSelector();
        expect(selector.autoConfig.enableVarianceFilter).toBe(true);
    });

    test('should enable correlation filter by default', () => {
        const selector = new AutoFeatureSelector();
        expect(selector.autoConfig.enableCorrelationFilter).toBe(true);
    });

    test('should enable importance filter by default', () => {
        const selector = new AutoFeatureSelector();
        expect(selector.autoConfig.enableImportanceFilter).toBe(true);
    });

    test('should have default targetRatio of 0.5', () => {
        const selector = new AutoFeatureSelector();
        expect(selector.autoConfig.targetRatio).toBe(0.5);
    });

    test('should accept custom targetRatio', () => {
        const selector = new AutoFeatureSelector({ targetRatio: 0.3 });
        expect(selector.autoConfig.targetRatio).toBe(0.3);
    });
});

describe('Step 14: AutoFeatureSelector - Auto Select', () => {
    const sampleData = [
        { a: 1, b: 100, c: 0.001, d: 10, target: 50 },
        { a: 2, b: 200, c: 0.001, d: 20, target: 60 },
        { a: 3, b: 300, c: 0.001, d: 30, target: 70 },
        { a: 4, b: 400, c: 0.001, d: 40, target: 80 },
        { a: 5, b: 500, c: 0.001, d: 50, target: 90 }
    ];

    test('should auto select features', () => {
        const selector = new AutoFeatureSelector();
        const result = selector.autoSelect(sampleData, 'target');
        expect(result).toHaveProperty('features');
        expect(result).toHaveProperty('steps');
        expect(result).toHaveProperty('summary');
    });

    test('should return steps array', () => {
        const selector = new AutoFeatureSelector();
        const result = selector.autoSelect(sampleData, 'target');
        expect(Array.isArray(result.steps)).toBe(true);
        expect(result.steps.length).toBeGreaterThan(0);
    });

    test('should include analyze step', () => {
        const selector = new AutoFeatureSelector();
        const result = selector.autoSelect(sampleData, 'target');
        const analyzeStep = result.steps.find(s => s.step === 'analyze');
        expect(analyzeStep).toBeTruthy();
    });

    test('should include variance_filter step', () => {
        const selector = new AutoFeatureSelector();
        const result = selector.autoSelect(sampleData, 'target');
        const varianceStep = result.steps.find(s => s.step === 'variance_filter');
        expect(varianceStep).toBeTruthy();
    });

    test('should return summary with reduction', () => {
        const selector = new AutoFeatureSelector();
        const result = selector.autoSelect(sampleData, 'target');
        expect(result.summary).toHaveProperty('original');
        expect(result.summary).toHaveProperty('selected');
        expect(result.summary).toHaveProperty('reduction');
    });

    test('should emit auto:complete event', () => {
        const selector = new AutoFeatureSelector();
        let eventData = null;
        selector.on('auto:complete', (data) => { eventData = data; });
        selector.autoSelect(sampleData, 'target');
        expect(eventData).toBeTruthy();
        expect(eventData).toHaveProperty('steps');
    });

    test('should respect enableVarianceFilter = false', () => {
        const selector = new AutoFeatureSelector();
        selector.autoConfig.enableVarianceFilter = false;
        const result = selector.autoSelect(sampleData);
        const varianceStep = result.steps.find(s => s.step === 'variance_filter');
        expect(varianceStep).toBeFalsy();
    });

    test('should respect enableCorrelationFilter = false', () => {
        const selector = new AutoFeatureSelector();
        selector.autoConfig.enableCorrelationFilter = false;
        const result = selector.autoSelect(sampleData);
        const corrStep = result.steps.find(s => s.step === 'correlation_filter');
        expect(corrStep).toBeFalsy();
    });
});

describe('Step 14: Factory Functions', () => {
    test('createSelector should create FeatureSelector', () => {
        const selector = createSelector();
        expect(selector).toBeInstanceOf(FeatureSelector);
    });

    test('createSelector should accept options', () => {
        const selector = createSelector({ varianceThreshold: 0.05 });
        expect(selector.options.varianceThreshold).toBe(0.05);
    });

    test('createAutoSelector should create AutoFeatureSelector', () => {
        const selector = createAutoSelector();
        expect(selector).toBeInstanceOf(AutoFeatureSelector);
    });

    test('createAutoSelector should accept options', () => {
        const selector = createAutoSelector({ targetRatio: 0.3 });
        expect(selector.autoConfig.targetRatio).toBe(0.3);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('TEST RESULTS');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📊 Total:  ${testResults.passed + testResults.failed}`);
console.log(`📈 Rate:   ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);

if (testResults.errors.length > 0) {
    console.log('\n❌ FAILURES:');
    testResults.errors.forEach(e => {
        console.log(`  ${e.suite} > ${e.test}`);
        console.log(`    ${e.error}`);
    });
}

process.exit(testResults.failed > 0 ? 1 : 0);
