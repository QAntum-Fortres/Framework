/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 1 ASYNC/HEALING - UNIT TESTS
 * Steps 15, 16, 17, 18: Wait Logic, Timeout Manager, Error Detector, Recovery Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Test utilities
let passed = 0;
let failed = 0;
const results = [];

function describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
}

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
        results.push({ name, status: 'passed' });
    } catch (error) {
        failed++;
        console.log(`  ❌ ${name}`);
        console.log(`     Error: ${error.message}`);
        results.push({ name, status: 'failed', error: error.message });
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
            const actualStr = JSON.stringify(actual);
            const expectedStr = JSON.stringify(expected);
            if (actualStr !== expectedStr) {
                throw new Error(`Expected ${expectedStr} but got ${actualStr}`);
            }
        },
        toBeDefined() {
            if (actual === undefined) {
                throw new Error('Expected value to be defined');
            }
        },
        toBeUndefined() {
            if (actual !== undefined) {
                throw new Error(`Expected undefined but got ${actual}`);
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
        toBeNull() {
            if (actual !== null) {
                throw new Error(`Expected null but got ${actual}`);
            }
        },
        toBeInstanceOf(expected) {
            if (!(actual instanceof expected)) {
                throw new Error(`Expected instance of ${expected.name}`);
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
        toHaveLength(expected) {
            if (actual.length !== expected) {
                throw new Error(`Expected length ${expected} but got ${actual.length}`);
            }
        },
        toBeGreaterThan(expected) {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} to be greater than ${expected}`);
            }
        },
        toBeGreaterThanOrEqual(expected) {
            if (actual < expected) {
                throw new Error(`Expected ${actual} to be >= ${expected}`);
            }
        },
        toBeLessThan(expected) {
            if (actual >= expected) {
                throw new Error(`Expected ${actual} to be less than ${expected}`);
            }
        },
        toBeLessThanOrEqual(expected) {
            if (actual > expected) {
                throw new Error(`Expected ${actual} to be <= ${expected}`);
            }
        },
        toThrow() {
            let threw = false;
            try {
                actual();
            } catch (e) {
                threw = true;
            }
            if (!threw) {
                throw new Error('Expected function to throw');
            }
        },
        toBeTypeOf(expected) {
            if (typeof actual !== expected) {
                throw new Error(`Expected type ${expected} but got ${typeof actual}`);
            }
        },
        toHaveProperty(prop) {
            if (!(prop in actual)) {
                throw new Error(`Expected object to have property ${prop}`);
            }
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT MODULES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🧪 PHASE 1 ASYNC/HEALING - UNIT TESTS');
console.log('═══════════════════════════════════════════════════════════════════════════════');

// Step 15 - Wait Logic
const {
    Condition,
    WaitEngine,
    FluentWait,
    Conditions,
    visible,
    exists,
    enabled,
    clickable,
    textContains,
    urlContains,
    createWait,
    getWaitEngine
} = require('../../async/wait-logic');

// Step 16 - Timeout Manager
const {
    TimeoutHandle,
    TimeoutManager,
    RetryStrategy,
    FixedRetryStrategy,
    ExponentialRetryStrategy,
    LinearRetryStrategy,
    JitterRetryStrategy,
    SmartRetryStrategy,
    TimeoutProfiles,
    withTimeout,
    withRetry,
    getTimeoutManager,
    createTimeoutManager
} = require('../../async/timeout-manager');

// Step 17 - Error Detector
const {
    ErrorPattern,
    ErrorDetector,
    ErrorAggregator,
    ErrorType,
    ErrorSeverity,
    BuiltInPatterns,
    getErrorDetector,
    createErrorDetector
} = require('../../healing/error-detector');

// Step 18 - Recovery Engine
const {
    RecoveryStrategy: RecoveryStrategyBase,
    RecoveryEngine,
    HealingContext,
    RetryRecoveryStrategy,
    RefreshRecoveryStrategy,
    WaitAndRetryStrategy,
    AlternativeSelectorStrategy,
    ScrollIntoViewStrategy,
    DismissOverlayStrategy,
    JavaScriptClickStrategy,
    NetworkRetryStrategy,
    getRecoveryEngine,
    createRecoveryEngine,
    createHealingContext
} = require('../../healing/recovery-engine');

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 15: WAIT LOGIC TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 15: Wait Logic', () => {
    
    // Condition tests
    describe('Condition', () => {
        test('Condition should be a class', () => {
            expect(typeof Condition).toBe('function');
        });
        
        test('Condition should accept name and check function', () => {
            const cond = new Condition('test', () => true);
            expect(cond.name).toBe('test');
        });
        
        test('Condition should have evaluate method', () => {
            const cond = new Condition('test', () => true);
            expect(typeof cond.evaluate).toBe('function');
        });
    });
    
    // Conditions object tests
    describe('Conditions', () => {
        test('Conditions should be defined', () => {
            expect(Conditions).toBeDefined();
        });
        
        test('Conditions.visible should return Condition', () => {
            const cond = Conditions.visible({});
            expect(cond instanceof Condition).toBeTruthy();
        });
        
        test('Conditions.exists should return Condition', () => {
            const cond = Conditions.exists({});
            expect(cond instanceof Condition).toBeTruthy();
        });
        
        test('Conditions.enabled should return Condition', () => {
            const cond = Conditions.enabled({});
            expect(cond instanceof Condition).toBeTruthy();
        });
        
        test('Conditions.clickable should return Condition', () => {
            const cond = Conditions.clickable({});
            expect(cond instanceof Condition).toBeTruthy();
        });
        
        test('Conditions.textContains should return Condition', () => {
            const cond = Conditions.textContains({}, 'test');
            expect(cond instanceof Condition).toBeTruthy();
        });
        
        test('Conditions.urlContains should return Condition', () => {
            const cond = Conditions.urlContains('test');
            expect(cond instanceof Condition).toBeTruthy();
        });
        
        test('Conditions.and should combine conditions', () => {
            const c1 = new Condition('c1', () => true);
            const c2 = new Condition('c2', () => true);
            const combined = Conditions.and(c1, c2);
            expect(combined.name).toBe('and');
        });
        
        test('Conditions.or should combine conditions', () => {
            const c1 = new Condition('c1', () => true);
            const c2 = new Condition('c2', () => false);
            const combined = Conditions.or(c1, c2);
            expect(combined.name).toBe('or');
        });
        
        test('Conditions.not should negate condition', () => {
            const c = new Condition('c', () => false);
            const negated = Conditions.not(c);
            expect(negated.name).toBe('not');
        });
        
        test('Conditions.custom should create custom condition', () => {
            const cond = Conditions.custom('myCondition', () => true);
            expect(cond.name).toBe('myCondition');
        });
    });
    
    // Shortcut exports tests
    describe('Shortcut Exports', () => {
        test('visible should be a function', () => {
            expect(typeof visible).toBe('function');
        });
        
        test('exists should be a function', () => {
            expect(typeof exists).toBe('function');
        });
        
        test('enabled should be a function', () => {
            expect(typeof enabled).toBe('function');
        });
        
        test('clickable should be a function', () => {
            expect(typeof clickable).toBe('function');
        });
        
        test('textContains should be a function', () => {
            expect(typeof textContains).toBe('function');
        });
        
        test('urlContains should be a function', () => {
            expect(typeof urlContains).toBe('function');
        });
    });
    
    // WaitEngine tests
    describe('WaitEngine', () => {
        test('WaitEngine should be a class', () => {
            expect(typeof WaitEngine).toBe('function');
        });
        
        test('WaitEngine should have waitFor method', () => {
            const engine = new WaitEngine();
            expect(typeof engine.waitFor).toBe('function');
        });
        
        test('WaitEngine should have waitForAll method', () => {
            const engine = new WaitEngine();
            expect(typeof engine.waitForAll).toBe('function');
        });
        
        test('WaitEngine should have waitForAny method', () => {
            const engine = new WaitEngine();
            expect(typeof engine.waitForAny).toBe('function');
        });
        
        test('WaitEngine should have waitForElement method', () => {
            const engine = new WaitEngine();
            expect(typeof engine.waitForElement).toBe('function');
        });
        
        test('WaitEngine should have waitForVisible method', () => {
            const engine = new WaitEngine();
            expect(typeof engine.waitForVisible).toBe('function');
        });
        
        test('WaitEngine should have waitForClickable method', () => {
            const engine = new WaitEngine();
            expect(typeof engine.waitForClickable).toBe('function');
        });
        
        test('WaitEngine should have waitForText method', () => {
            const engine = new WaitEngine();
            expect(typeof engine.waitForText).toBe('function');
        });
        
        test('WaitEngine should accept options', () => {
            const engine = new WaitEngine({ defaultTimeout: 5000 });
            expect(engine.options.defaultTimeout).toBe(5000);
        });
        
        test('WaitEngine should have stats', () => {
            const engine = new WaitEngine();
            expect(engine.stats).toHaveProperty('waits');
            expect(engine.stats).toHaveProperty('successes');
        });
    });
    
    // FluentWait tests
    describe('FluentWait', () => {
        test('FluentWait should be a class', () => {
            expect(typeof FluentWait).toBe('function');
        });
        
        test('FluentWait should have withTimeout method', () => {
            const engine = new WaitEngine();
            const fw = new FluentWait(engine);
            expect(typeof fw.withTimeout).toBe('function');
        });
        
        test('FluentWait should have pollingEvery method', () => {
            const engine = new WaitEngine();
            const fw = new FluentWait(engine);
            expect(typeof fw.pollingEvery).toBe('function');
        });
        
        test('FluentWait should have until method', () => {
            const engine = new WaitEngine();
            const fw = new FluentWait(engine);
            expect(typeof fw.until).toBe('function');
        });
        
        test('FluentWait should support chaining', () => {
            const engine = new WaitEngine();
            const fw = new FluentWait(engine);
            const chained = fw.withTimeout(5000).pollingEvery(100);
            expect(chained).toBeInstanceOf(FluentWait);
        });
    });
    
    // Factory functions tests
    describe('Factory Functions', () => {
        test('createWait should return WaitEngine', () => {
            const engine = createWait();
            expect(engine instanceof WaitEngine).toBeTruthy();
        });
        
        test('getWaitEngine should return singleton', () => {
            const e1 = getWaitEngine();
            const e2 = getWaitEngine();
            expect(e1).toBe(e2);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 16: TIMEOUT MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 16: Timeout Manager', () => {
    
    // TimeoutProfiles tests
    describe('TimeoutProfiles', () => {
        test('TimeoutProfiles should be defined', () => {
            expect(TimeoutProfiles).toBeDefined();
        });
        
        test('TimeoutProfiles should have INSTANT', () => {
            expect(TimeoutProfiles.INSTANT).toBeDefined();
            expect(TimeoutProfiles.INSTANT.timeout).toBe(1000);
        });
        
        test('TimeoutProfiles should have SHORT', () => {
            expect(TimeoutProfiles.SHORT).toBeDefined();
        });
        
        test('TimeoutProfiles should have MEDIUM', () => {
            expect(TimeoutProfiles.MEDIUM).toBeDefined();
        });
        
        test('TimeoutProfiles should have LONG', () => {
            expect(TimeoutProfiles.LONG).toBeDefined();
        });
        
        test('TimeoutProfiles should have VERY_LONG', () => {
            expect(TimeoutProfiles.VERY_LONG).toBeDefined();
        });
        
        test('TimeoutProfiles should have INFINITE', () => {
            expect(TimeoutProfiles.INFINITE).toBeDefined();
            expect(TimeoutProfiles.INFINITE.timeout).toBe(0);
        });
    });
    
    // RetryStrategy tests
    describe('RetryStrategy', () => {
        test('RetryStrategy should be a class', () => {
            expect(typeof RetryStrategy).toBe('function');
        });
        
        test('RetryStrategy should have getDelay method', () => {
            const strategy = new RetryStrategy('test');
            expect(typeof strategy.getDelay).toBe('function');
        });
        
        test('RetryStrategy should have shouldRetry method', () => {
            const strategy = new RetryStrategy('test');
            expect(typeof strategy.shouldRetry).toBe('function');
        });
    });
    
    // FixedRetryStrategy tests
    describe('FixedRetryStrategy', () => {
        test('FixedRetryStrategy should extend RetryStrategy', () => {
            const strategy = new FixedRetryStrategy();
            expect(strategy instanceof RetryStrategy).toBeTruthy();
        });
        
        test('FixedRetryStrategy getDelay should return fixed delay', () => {
            const strategy = new FixedRetryStrategy({ delay: 2000 });
            expect(strategy.getDelay(1)).toBe(2000);
            expect(strategy.getDelay(2)).toBe(2000);
        });
    });
    
    // ExponentialRetryStrategy tests
    describe('ExponentialRetryStrategy', () => {
        test('ExponentialRetryStrategy should extend RetryStrategy', () => {
            const strategy = new ExponentialRetryStrategy();
            expect(strategy instanceof RetryStrategy).toBeTruthy();
        });
        
        test('ExponentialRetryStrategy getDelay should increase exponentially', () => {
            const strategy = new ExponentialRetryStrategy({ baseDelay: 1000, multiplier: 2 });
            expect(strategy.getDelay(1)).toBe(1000);
            expect(strategy.getDelay(2)).toBe(2000);
            expect(strategy.getDelay(3)).toBe(4000);
        });
    });
    
    // LinearRetryStrategy tests
    describe('LinearRetryStrategy', () => {
        test('LinearRetryStrategy should extend RetryStrategy', () => {
            const strategy = new LinearRetryStrategy();
            expect(strategy instanceof RetryStrategy).toBeTruthy();
        });
        
        test('LinearRetryStrategy getDelay should increase linearly', () => {
            const strategy = new LinearRetryStrategy({ baseDelay: 1000, increment: 500 });
            expect(strategy.getDelay(1)).toBe(1000);
            expect(strategy.getDelay(2)).toBe(1500);
            expect(strategy.getDelay(3)).toBe(2000);
        });
    });
    
    // JitterRetryStrategy tests
    describe('JitterRetryStrategy', () => {
        test('JitterRetryStrategy should extend RetryStrategy', () => {
            const strategy = new JitterRetryStrategy();
            expect(strategy instanceof RetryStrategy).toBeTruthy();
        });
        
        test('JitterRetryStrategy getDelay should add randomness', () => {
            const strategy = new JitterRetryStrategy({ baseDelay: 1000 });
            const delay = strategy.getDelay(1);
            expect(delay).toBeGreaterThanOrEqual(1000);
        });
    });
    
    // SmartRetryStrategy tests
    describe('SmartRetryStrategy', () => {
        test('SmartRetryStrategy should extend RetryStrategy', () => {
            const strategy = new SmartRetryStrategy();
            expect(strategy instanceof RetryStrategy).toBeTruthy();
        });
        
        test('SmartRetryStrategy should have getStrategyForError', () => {
            const strategy = new SmartRetryStrategy();
            expect(typeof strategy.getStrategyForError).toBe('function');
        });
    });
    
    // TimeoutHandle tests
    describe('TimeoutHandle', () => {
        test('TimeoutHandle should be a class', () => {
            expect(typeof TimeoutHandle).toBe('function');
        });
        
        test('TimeoutHandle should have start method', () => {
            const handle = new TimeoutHandle('test', 1000, null);
            expect(typeof handle.start).toBe('function');
        });
        
        test('TimeoutHandle should have cancel method', () => {
            const handle = new TimeoutHandle('test', 1000, null);
            expect(typeof handle.cancel).toBe('function');
        });
        
        test('TimeoutHandle should have complete method', () => {
            const handle = new TimeoutHandle('test', 1000, null);
            expect(typeof handle.complete).toBe('function');
        });
        
        test('TimeoutHandle should have getRemainingTime method', () => {
            const handle = new TimeoutHandle('test', 1000, null);
            expect(typeof handle.getRemainingTime).toBe('function');
        });
        
        test('TimeoutHandle should have getElapsedTime method', () => {
            const handle = new TimeoutHandle('test', 1000, null);
            expect(typeof handle.getElapsedTime).toBe('function');
        });
    });
    
    // TimeoutManager tests
    describe('TimeoutManager', () => {
        test('TimeoutManager should be a class', () => {
            expect(typeof TimeoutManager).toBe('function');
        });
        
        test('TimeoutManager should have create method', () => {
            const manager = new TimeoutManager();
            expect(typeof manager.create).toBe('function');
        });
        
        test('TimeoutManager should have cancel method', () => {
            const manager = new TimeoutManager();
            expect(typeof manager.cancel).toBe('function');
        });
        
        test('TimeoutManager should have stats', () => {
            const manager = new TimeoutManager();
            expect(manager.stats).toHaveProperty('created');
            expect(manager.stats).toHaveProperty('completed');
        });
        
        test('TimeoutManager create should return TimeoutHandle', () => {
            const manager = new TimeoutManager();
            const handle = manager.create(1000);
            expect(handle instanceof TimeoutHandle).toBeTruthy();
            handle.cancel(); // Clean up
        });
    });
    
    // Decorators tests
    describe('Decorators', () => {
        test('withTimeout should be a function', () => {
            expect(typeof withTimeout).toBe('function');
        });
        
        test('withRetry should be a function', () => {
            expect(typeof withRetry).toBe('function');
        });
    });
    
    // Factory functions tests
    describe('Factory Functions', () => {
        test('getTimeoutManager should return singleton', () => {
            const m1 = getTimeoutManager();
            const m2 = getTimeoutManager();
            expect(m1).toBe(m2);
        });
        
        test('createTimeoutManager should return new instance', () => {
            const manager = createTimeoutManager({});
            expect(manager instanceof TimeoutManager).toBeTruthy();
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 17: ERROR DETECTOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 17: Error Detector', () => {
    
    // ErrorType tests
    describe('ErrorType', () => {
        test('ErrorType should be defined', () => {
            expect(ErrorType).toBeDefined();
        });
        
        test('ErrorType should have ELEMENT_NOT_FOUND', () => {
            expect(ErrorType.ELEMENT_NOT_FOUND).toBe('ELEMENT_NOT_FOUND');
        });
        
        test('ErrorType should have TIMEOUT', () => {
            expect(ErrorType.TIMEOUT).toBe('TIMEOUT');
        });
        
        test('ErrorType should have NETWORK_ERROR', () => {
            expect(ErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
        });
        
        test('ErrorType should have UNKNOWN', () => {
            expect(ErrorType.UNKNOWN).toBe('UNKNOWN');
        });
    });
    
    // ErrorSeverity tests
    describe('ErrorSeverity', () => {
        test('ErrorSeverity should be defined', () => {
            expect(ErrorSeverity).toBeDefined();
        });
        
        test('ErrorSeverity should have CRITICAL', () => {
            expect(ErrorSeverity.CRITICAL).toBe('critical');
        });
        
        test('ErrorSeverity should have HIGH', () => {
            expect(ErrorSeverity.HIGH).toBe('high');
        });
        
        test('ErrorSeverity should have MEDIUM', () => {
            expect(ErrorSeverity.MEDIUM).toBe('medium');
        });
        
        test('ErrorSeverity should have LOW', () => {
            expect(ErrorSeverity.LOW).toBe('low');
        });
    });
    
    // ErrorPattern tests
    describe('ErrorPattern', () => {
        test('ErrorPattern should be a class', () => {
            expect(typeof ErrorPattern).toBe('function');
        });
        
        test('ErrorPattern should have matches method', () => {
            const pattern = new ErrorPattern({ name: 'test', patterns: [] });
            expect(typeof pattern.matches).toBe('function');
        });
        
        test('ErrorPattern should match string patterns', () => {
            const pattern = new ErrorPattern({
                name: 'test',
                patterns: ['element not found']
            });
            expect(pattern.matches({ message: 'element not found on page' })).toBeTruthy();
        });
        
        test('ErrorPattern should match regex patterns', () => {
            const pattern = new ErrorPattern({
                name: 'test',
                patterns: [/timeout/i]
            });
            expect(pattern.matches({ message: 'Request Timeout Error' })).toBeTruthy();
        });
    });
    
    // BuiltInPatterns tests
    describe('BuiltInPatterns', () => {
        test('BuiltInPatterns should be an array', () => {
            expect(Array.isArray(BuiltInPatterns)).toBeTruthy();
        });
        
        test('BuiltInPatterns should have patterns', () => {
            expect(BuiltInPatterns.length).toBeGreaterThan(0);
        });
        
        test('BuiltInPatterns should contain ErrorPattern instances', () => {
            expect(BuiltInPatterns[0] instanceof ErrorPattern).toBeTruthy();
        });
    });
    
    // ErrorDetector tests
    describe('ErrorDetector', () => {
        test('ErrorDetector should be a class', () => {
            expect(typeof ErrorDetector).toBe('function');
        });
        
        test('ErrorDetector should have detect method', () => {
            const detector = new ErrorDetector();
            expect(typeof detector.detect).toBe('function');
        });
        
        test('ErrorDetector should have registerPattern method', () => {
            const detector = new ErrorDetector();
            expect(typeof detector.registerPattern).toBe('function');
        });
        
        test('ErrorDetector detect should return classified error', () => {
            const detector = new ErrorDetector();
            const result = detector.detect(new Error('Element not found'));
            expect(result).toHaveProperty('type');
            expect(result).toHaveProperty('severity');
            expect(result).toHaveProperty('recoverable');
        });
        
        test('ErrorDetector should classify element not found', () => {
            const detector = new ErrorDetector();
            const result = detector.detect(new Error('Unable to locate element'));
            expect(result.type).toBe(ErrorType.ELEMENT_NOT_FOUND);
        });
        
        test('ErrorDetector should track analytics', () => {
            const detector = new ErrorDetector();
            detector.detect(new Error('test error'));
            expect(detector.analytics.total).toBeGreaterThan(0);
        });
    });
    
    // ErrorAggregator tests
    describe('ErrorAggregator', () => {
        test('ErrorAggregator should be a class', () => {
            expect(typeof ErrorAggregator).toBe('function');
        });
        
        test('ErrorAggregator should have getSummary method', () => {
            const aggregator = new ErrorAggregator();
            expect(typeof aggregator.getSummary).toBe('function');
        });
        
        test('ErrorAggregator should have clear method', () => {
            const aggregator = new ErrorAggregator();
            expect(typeof aggregator.clear).toBe('function');
        });
    });
    
    // Factory functions tests
    describe('Factory Functions', () => {
        test('getErrorDetector should return singleton', () => {
            const d1 = getErrorDetector();
            const d2 = getErrorDetector();
            expect(d1).toBe(d2);
        });
        
        test('createErrorDetector should return new instance', () => {
            const detector = createErrorDetector({});
            expect(detector instanceof ErrorDetector).toBeTruthy();
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 18: RECOVERY ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 18: Recovery Engine', () => {
    
    // RecoveryStrategy tests
    describe('RecoveryStrategy', () => {
        test('RecoveryStrategy should be a class', () => {
            expect(typeof RecoveryStrategyBase).toBe('function');
        });
        
        test('RecoveryStrategy should have appliesTo method', () => {
            const strategy = new RecoveryStrategyBase({ name: 'test' });
            expect(typeof strategy.appliesTo).toBe('function');
        });
        
        test('RecoveryStrategy should have execute method', () => {
            const strategy = new RecoveryStrategyBase({ name: 'test' });
            expect(typeof strategy.execute).toBe('function');
        });
    });
    
    // Built-in strategies tests
    describe('Built-in Recovery Strategies', () => {
        test('RetryRecoveryStrategy should be a class', () => {
            expect(typeof RetryRecoveryStrategy).toBe('function');
        });
        
        test('RefreshRecoveryStrategy should be a class', () => {
            expect(typeof RefreshRecoveryStrategy).toBe('function');
        });
        
        test('WaitAndRetryStrategy should be a class', () => {
            expect(typeof WaitAndRetryStrategy).toBe('function');
        });
        
        test('AlternativeSelectorStrategy should be a class', () => {
            expect(typeof AlternativeSelectorStrategy).toBe('function');
        });
        
        test('ScrollIntoViewStrategy should be a class', () => {
            expect(typeof ScrollIntoViewStrategy).toBe('function');
        });
        
        test('DismissOverlayStrategy should be a class', () => {
            expect(typeof DismissOverlayStrategy).toBe('function');
        });
        
        test('JavaScriptClickStrategy should be a class', () => {
            expect(typeof JavaScriptClickStrategy).toBe('function');
        });
        
        test('NetworkRetryStrategy should be a class', () => {
            expect(typeof NetworkRetryStrategy).toBe('function');
        });
        
        test('RetryRecoveryStrategy should extend base', () => {
            const strategy = new RetryRecoveryStrategy();
            expect(strategy.name).toBe('retry');
        });
        
        test('RefreshRecoveryStrategy should extend base', () => {
            const strategy = new RefreshRecoveryStrategy();
            expect(strategy.name).toBe('refresh');
        });
        
        test('WaitAndRetryStrategy should extend base', () => {
            const strategy = new WaitAndRetryStrategy();
            expect(strategy.name).toBe('waitAndRetry');
        });
    });
    
    // RecoveryEngine tests
    describe('RecoveryEngine', () => {
        test('RecoveryEngine should be a class', () => {
            expect(typeof RecoveryEngine).toBe('function');
        });
        
        test('RecoveryEngine should have registerStrategy method', () => {
            const engine = new RecoveryEngine();
            expect(typeof engine.registerStrategy).toBe('function');
        });
        
        test('RecoveryEngine should have recover method', () => {
            const engine = new RecoveryEngine();
            expect(typeof engine.recover).toBe('function');
        });
        
        test('RecoveryEngine should have built-in strategies', () => {
            const engine = new RecoveryEngine();
            expect(engine.strategies.length).toBeGreaterThan(0);
        });
        
        test('RecoveryEngine should accept options', () => {
            const engine = new RecoveryEngine({ maxRecoveryAttempts: 10 });
            expect(engine.options.maxRecoveryAttempts).toBe(10);
        });
        
        test('RecoveryEngine registerStrategy should add strategy', () => {
            const engine = new RecoveryEngine();
            const initialCount = engine.strategies.length;
            engine.registerStrategy(new RecoveryStrategyBase({ name: 'custom', priority: 100 }));
            expect(engine.strategies.length).toBe(initialCount + 1);
        });
    });
    
    // HealingContext tests
    describe('HealingContext', () => {
        test('HealingContext should be a class', () => {
            expect(typeof HealingContext).toBe('function');
        });
        
        test('HealingContext should have execute method', () => {
            const engine = new RecoveryEngine();
            const ctx = new HealingContext(engine, {});
            expect(typeof ctx.execute).toBe('function');
        });
    });
    
    // Factory functions tests
    describe('Factory Functions', () => {
        test('getRecoveryEngine should return singleton', () => {
            const e1 = getRecoveryEngine();
            const e2 = getRecoveryEngine();
            expect(e1).toBe(e2);
        });
        
        test('createRecoveryEngine should return new instance', () => {
            const engine = createRecoveryEngine({});
            expect(engine instanceof RecoveryEngine).toBeTruthy();
        });
        
        test('createHealingContext should return HealingContext', () => {
            const engine = new RecoveryEngine();
            const ctx = createHealingContext(engine, {});
            expect(ctx instanceof HealingContext).toBeTruthy();
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('📊 TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════════════════════════════');

if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
    });
}

process.exit(failed > 0 ? 1 : 0);
