/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  PHASE 2 UNIT TESTS - SECURITY & QUANTUM                                      ║
 * ║  Testing: Steps 27-28 of 50                                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// TEST HARNESS
// ═══════════════════════════════════════════════════════════════════════════════

let currentSuite = '';
let passed = 0;
let failed = 0;

function describe(name, fn) {
    currentSuite = name;
    console.log(`\n📦 ${name}`);
    fn();
}

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
        passed++;
    } catch (error) {
        console.log(`  ❌ ${name}`);
        console.log(`     Error: ${error.message}`);
        failed++;
    }
}

const expect = (actual) => ({
    toBe: (expected) => {
        if (actual !== expected) {
            throw new Error(`Expected ${expected} but got ${actual}`);
        }
    },
    toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
    },
    toBeInstanceOf: (expected) => {
        if (!(actual instanceof expected)) {
            throw new Error(`Expected instance of ${expected.name}`);
        }
    },
    toBeDefined: () => {
        if (actual === undefined) {
            throw new Error('Expected value to be defined');
        }
    },
    toBeNull: () => {
        if (actual !== null) {
            throw new Error(`Expected null but got ${actual}`);
        }
    },
    toBeTruthy: () => {
        if (!actual) {
            throw new Error(`Expected truthy value but got ${actual}`);
        }
    },
    toBeFalsy: () => {
        if (actual) {
            throw new Error(`Expected falsy value but got ${actual}`);
        }
    },
    toBeGreaterThan: (expected) => {
        if (actual <= expected) {
            throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
    },
    toBeLessThan: (expected) => {
        if (actual >= expected) {
            throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
    },
    toContain: (expected) => {
        if (!actual.includes(expected)) {
            throw new Error(`Expected ${actual} to contain ${expected}`);
        }
    },
    toHaveProperty: (prop) => {
        if (!(prop in actual)) {
            throw new Error(`Expected object to have property ${prop}`);
        }
    },
    toHaveLength: (expected) => {
        if (actual.length !== expected) {
            throw new Error(`Expected length ${expected} but got ${actual.length}`);
        }
    },
    toThrow: () => {
        let threw = false;
        try {
            actual();
        } catch (e) {
            threw = true;
        }
        if (!threw) {
            throw new Error('Expected function to throw');
        }
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD MODULES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🧪 PHASE 2 SECURITY & QUANTUM - UNIT TESTS');
console.log('═══════════════════════════════════════════════════════════════════════════════');

// Step 27: Neuro Sentinel
const {
    ThreatDetector,
    AnomalyDetector,
    RateLimiter,
    NeuroSentinel,
    ThreatLevel,
    ThreatType,
    createSentinel,
    getSentinel
} = require('../../security/neuro-sentinel.js');

// Step 28: Quantum Scaling
const {
    QuantumState,
    QuantumOptimizer,
    QuantumAnnealer,
    QuantumResourceScaler,
    createScaler,
    createOptimizer,
    createAnnealer,
    getScaler
} = require('../../quantum/scaling.js');

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 27: NEURO SENTINEL SECURITY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 27: ThreatLevel', () => {
    test('ThreatLevel should be defined', () => {
        expect(ThreatLevel).toBeDefined();
    });

    test('ThreatLevel should have CRITICAL', () => {
        expect(ThreatLevel.CRITICAL).toBe('critical');
    });

    test('ThreatLevel should have HIGH', () => {
        expect(ThreatLevel.HIGH).toBe('high');
    });

    test('ThreatLevel should have MEDIUM', () => {
        expect(ThreatLevel.MEDIUM).toBe('medium');
    });

    test('ThreatLevel should have LOW', () => {
        expect(ThreatLevel.LOW).toBe('low');
    });

    test('ThreatLevel should have INFO', () => {
        expect(ThreatLevel.INFO).toBe('info');
    });
});

describe('Step 27: ThreatType', () => {
    test('ThreatType should be defined', () => {
        expect(ThreatType).toBeDefined();
    });

    test('ThreatType should have INJECTION', () => {
        expect(ThreatType.INJECTION).toBe('injection');
    });

    test('ThreatType should have XSS', () => {
        expect(ThreatType.XSS).toBe('xss');
    });

    test('ThreatType should have CSRF', () => {
        expect(ThreatType.CSRF).toBe('csrf');
    });

    test('ThreatType should have AUTHENTICATION', () => {
        expect(ThreatType.AUTHENTICATION).toBe('authentication');
    });

    test('ThreatType should have RATE_LIMIT', () => {
        expect(ThreatType.RATE_LIMIT).toBe('rate_limit');
    });

    test('ThreatType should have ANOMALY', () => {
        expect(ThreatType.ANOMALY).toBe('anomaly');
    });
});

describe('Step 27: ThreatDetector', () => {
    test('ThreatDetector should be a class', () => {
        expect(typeof ThreatDetector).toBe('function');
    });

    test('ThreatDetector should be constructable', () => {
        const detector = new ThreatDetector();
        expect(detector).toBeInstanceOf(ThreatDetector);
    });

    test('ThreatDetector should have scan method', () => {
        const detector = new ThreatDetector();
        expect(typeof detector.scan).toBe('function');
    });

    test('ThreatDetector should have stats', () => {
        const detector = new ThreatDetector();
        expect(detector.stats).toHaveProperty('scanned');
    });

    test('ThreatDetector should be EventEmitter', () => {
        const detector = new ThreatDetector();
        expect(typeof detector.emit).toBe('function');
    });
});

describe('Step 27: AnomalyDetector', () => {
    test('AnomalyDetector should be a class', () => {
        expect(typeof AnomalyDetector).toBe('function');
    });

    test('AnomalyDetector should be constructable', () => {
        const detector = new AnomalyDetector();
        expect(detector).toBeInstanceOf(AnomalyDetector);
    });

    test('AnomalyDetector should have record method', () => {
        const detector = new AnomalyDetector();
        expect(typeof detector.record).toBe('function');
    });

    test('AnomalyDetector should have metrics map', () => {
        const detector = new AnomalyDetector();
        expect(detector.metrics).toBeInstanceOf(Map);
    });

    test('AnomalyDetector should be EventEmitter', () => {
        const detector = new AnomalyDetector();
        expect(typeof detector.emit).toBe('function');
    });
});

describe('Step 27: RateLimiter', () => {
    test('RateLimiter should be a class', () => {
        expect(typeof RateLimiter).toBe('function');
    });

    test('RateLimiter should be constructable', () => {
        const limiter = new RateLimiter();
        expect(limiter).toBeInstanceOf(RateLimiter);
    });

    test('RateLimiter should accept options', () => {
        const limiter = new RateLimiter({ maxRequests: 50 });
        expect(limiter.options.maxRequests).toBe(50);
    });

    test('RateLimiter should have check method', () => {
        const limiter = new RateLimiter();
        expect(typeof limiter.check).toBe('function');
    });

    test('RateLimiter should have reset method', () => {
        const limiter = new RateLimiter();
        expect(typeof limiter.reset).toBe('function');
    });

    test('RateLimiter should be EventEmitter', () => {
        const limiter = new RateLimiter();
        expect(typeof limiter.emit).toBe('function');
    });
});

describe('Step 27: NeuroSentinel', () => {
    test('NeuroSentinel should be a class', () => {
        expect(typeof NeuroSentinel).toBe('function');
    });

    test('NeuroSentinel should be constructable', () => {
        const sentinel = new NeuroSentinel();
        expect(sentinel).toBeInstanceOf(NeuroSentinel);
    });

    test('NeuroSentinel should have threatDetector', () => {
        const sentinel = new NeuroSentinel();
        expect(sentinel.threatDetector).toBeInstanceOf(ThreatDetector);
    });

    test('NeuroSentinel should have rateLimiter', () => {
        const sentinel = new NeuroSentinel();
        expect(sentinel.rateLimiter).toBeInstanceOf(RateLimiter);
    });

    test('NeuroSentinel should have analyze method', () => {
        const sentinel = new NeuroSentinel();
        expect(typeof sentinel.analyze).toBe('function');
    });

    test('NeuroSentinel should have block method', () => {
        const sentinel = new NeuroSentinel();
        expect(typeof sentinel.block).toBe('function');
    });

    test('NeuroSentinel should have allow method', () => {
        const sentinel = new NeuroSentinel();
        expect(typeof sentinel.allow).toBe('function');
    });

    test('NeuroSentinel should have getReport method', () => {
        const sentinel = new NeuroSentinel();
        expect(typeof sentinel.getReport).toBe('function');
    });

    test('NeuroSentinel getReport should return report object', () => {
        const sentinel = new NeuroSentinel();
        const report = sentinel.getReport();
        expect(report).toHaveProperty('stats');
    });

    test('NeuroSentinel should be EventEmitter', () => {
        const sentinel = new NeuroSentinel();
        expect(typeof sentinel.emit).toBe('function');
    });
});

describe('Step 27: Security Factory Functions', () => {
    test('createSentinel should create NeuroSentinel', () => {
        const sentinel = createSentinel();
        expect(sentinel).toBeInstanceOf(NeuroSentinel);
    });

    test('getSentinel should return singleton', () => {
        const s1 = getSentinel();
        const s2 = getSentinel();
        expect(s1).toBe(s2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 28: QUANTUM SCALING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 28: QuantumState', () => {
    test('QuantumState should be a class', () => {
        expect(typeof QuantumState).toBe('function');
    });

    test('QuantumState should be constructable', () => {
        const state = new QuantumState();
        expect(state).toBeInstanceOf(QuantumState);
    });

    test('QuantumState should accept dimensions', () => {
        const state = new QuantumState(4);
        expect(state.dimensions).toBe(4);
    });

    test('QuantumState should have amplitudes array', () => {
        const state = new QuantumState(4);
        expect(state.amplitudes).toHaveLength(4);
    });

    test('QuantumState should start in ground state', () => {
        const state = new QuantumState(4);
        expect(state.amplitudes[0]).toBe(1);
    });

    test('QuantumState should have hadamard method', () => {
        const state = new QuantumState();
        expect(typeof state.hadamard).toBe('function');
    });

    test('QuantumState hadamard should create superposition', () => {
        const state = new QuantumState(4);
        state.hadamard();
        expect(state.amplitudes[0]).toBe(state.amplitudes[1]);
    });

    test('QuantumState should have measure method', () => {
        const state = new QuantumState();
        expect(typeof state.measure).toBe('function');
    });

    test('QuantumState measure should return index', () => {
        const state = new QuantumState(4);
        const result = state.measure();
        expect(result).toBe(0); // Ground state
    });

    test('QuantumState should have entangle method', () => {
        const state = new QuantumState();
        expect(typeof state.entangle).toBe('function');
    });

    test('QuantumState should have getProbabilities method', () => {
        const state = new QuantumState();
        expect(typeof state.getProbabilities).toBe('function');
    });
});

describe('Step 28: QuantumOptimizer', () => {
    test('QuantumOptimizer should be a class', () => {
        expect(typeof QuantumOptimizer).toBe('function');
    });

    test('QuantumOptimizer should be constructable', () => {
        const optimizer = new QuantumOptimizer();
        expect(optimizer).toBeInstanceOf(QuantumOptimizer);
    });

    test('QuantumOptimizer should accept options', () => {
        const optimizer = new QuantumOptimizer({ iterations: 50 });
        expect(optimizer.options.iterations).toBe(50);
    });

    test('QuantumOptimizer should have initialize method', () => {
        const optimizer = new QuantumOptimizer();
        expect(typeof optimizer.initialize).toBe('function');
    });

    test('QuantumOptimizer should have optimize method', () => {
        const optimizer = new QuantumOptimizer();
        expect(typeof optimizer.optimize).toBe('function');
    });

    test('QuantumOptimizer should be EventEmitter', () => {
        const optimizer = new QuantumOptimizer();
        expect(typeof optimizer.emit).toBe('function');
    });
});

describe('Step 28: QuantumAnnealer', () => {
    test('QuantumAnnealer should be a class', () => {
        expect(typeof QuantumAnnealer).toBe('function');
    });

    test('QuantumAnnealer should be constructable', () => {
        const annealer = new QuantumAnnealer();
        expect(annealer).toBeInstanceOf(QuantumAnnealer);
    });

    test('QuantumAnnealer should accept options', () => {
        const annealer = new QuantumAnnealer({ temperature: 20 });
        expect(annealer.options.temperature).toBe(20);
    });

    test('QuantumAnnealer should have anneal method', () => {
        const annealer = new QuantumAnnealer();
        expect(typeof annealer.anneal).toBe('function');
    });

    test('QuantumAnnealer should have tunneling option', () => {
        const annealer = new QuantumAnnealer({ tunneling: false });
        expect(annealer.options.tunneling).toBe(false);
    });

    test('QuantumAnnealer should be EventEmitter', () => {
        const annealer = new QuantumAnnealer();
        expect(typeof annealer.emit).toBe('function');
    });
});

describe('Step 28: QuantumResourceScaler', () => {
    test('QuantumResourceScaler should be a class', () => {
        expect(typeof QuantumResourceScaler).toBe('function');
    });

    test('QuantumResourceScaler should be constructable', () => {
        const scaler = new QuantumResourceScaler();
        expect(scaler).toBeInstanceOf(QuantumResourceScaler);
    });

    test('QuantumResourceScaler should have optimizer', () => {
        const scaler = new QuantumResourceScaler();
        expect(scaler.optimizer).toBeInstanceOf(QuantumOptimizer);
    });

    test('QuantumResourceScaler should have annealer', () => {
        const scaler = new QuantumResourceScaler();
        expect(scaler.annealer).toBeInstanceOf(QuantumAnnealer);
    });

    test('QuantumResourceScaler should have optimize method', () => {
        const scaler = new QuantumResourceScaler();
        expect(typeof scaler.optimize).toBe('function');
    });

    test('QuantumResourceScaler should have autoScale method', () => {
        const scaler = new QuantumResourceScaler();
        expect(typeof scaler.autoScale).toBe('function');
    });

    test('QuantumResourceScaler should be EventEmitter', () => {
        const scaler = new QuantumResourceScaler();
        expect(typeof scaler.emit).toBe('function');
    });
});

describe('Step 28: Quantum Factory Functions', () => {
    test('createScaler should create QuantumResourceScaler', () => {
        const scaler = createScaler();
        expect(scaler).toBeInstanceOf(QuantumResourceScaler);
    });

    test('createOptimizer should create QuantumOptimizer', () => {
        const optimizer = createOptimizer();
        expect(optimizer).toBeInstanceOf(QuantumOptimizer);
    });

    test('createAnnealer should create QuantumAnnealer', () => {
        const annealer = createAnnealer();
        expect(annealer).toBeInstanceOf(QuantumAnnealer);
    });

    test('getScaler should return singleton', () => {
        const s1 = getScaler();
        const s2 = getScaler();
        expect(s1).toBe(s2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 27: Security Integration', () => {
    test('ThreatDetector scan should track stats', () => {
        const detector = new ThreatDetector();
        detector.scan('test input');
        expect(detector.stats.scanned).toBe(1);
    });

    test('AnomalyDetector record should return result', () => {
        const detector = new AnomalyDetector();
        for (let i = 0; i < 15; i++) {
            detector.record('metric', 100 + Math.random() * 10);
        }
        const result = detector.record('metric', 100);
        expect(result).toHaveProperty('isAnomaly');
    });

    test('RateLimiter should allow requests within limit', () => {
        const limiter = new RateLimiter({ maxRequests: 100 });
        const result = limiter.check('user-1');
        expect(result.allowed).toBe(true);
    });
});

describe('Step 28: Quantum Integration', () => {
    test('QuantumState should maintain probability sum', () => {
        const state = new QuantumState(4);
        state.hadamard();
        const probs = state.getProbabilities();
        const sum = probs.reduce((a, b) => a + b, 0);
        expect(Math.abs(sum - 1)).toBeLessThan(0.001);
    });

    test('QuantumAnnealer should find solution', () => {
        const annealer = new QuantumAnnealer({ 
            temperature: 5, 
            coolingRate: 0.9,
            minTemperature: 0.1 
        });
        
        const energy = (state) => state.reduce((a, b) => a + b, 0);
        const initial = [1, 1, 1];
        const neighbor = (state) => {
            const next = [...state];
            const idx = Math.floor(Math.random() * next.length);
            next[idx] = Math.random() > 0.5 ? 1 : 0;
            return next;
        };
        
        const result = annealer.anneal(energy, initial, neighbor);
        expect(result).toHaveProperty('solution');
        expect(result).toHaveProperty('energy');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log('📊 TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════════════════════════════════════════════════');
