/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 2 NLU & SHADOW DOM - UNIT TESTS
 * Steps 21, 23: NLU Engine, Shadow DOM Penetration
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Test utilities
let passed = 0;
let failed = 0;
const errors = [];

function describe(name, fn) {
    console.log(`\n📦 ${name}`);
    fn();
}

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (err) {
        failed++;
        errors.push({ name, error: err.message });
        console.log(`  ❌ ${name}: ${err.message}`);
    }
}

function expect(actual) {
    return {
        toBe: (expected) => { if (actual !== expected) throw new Error(`Expected ${expected} but got ${actual}`); },
        toEqual: (expected) => { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Deep equality failed`); },
        toBeTruthy: () => { if (!actual) throw new Error(`Expected truthy but got ${actual}`); },
        toBeFalsy: () => { if (actual) throw new Error(`Expected falsy but got ${actual}`); },
        toBeInstanceOf: (cls) => { if (!(actual instanceof cls)) throw new Error(`Expected instance of ${cls.name}`); },
        toHaveProperty: (prop) => { if (!(prop in actual)) throw new Error(`Missing property ${prop}`); },
        toBeGreaterThan: (n) => { if (actual <= n) throw new Error(`Expected ${actual} > ${n}`); },
        toContain: (item) => { if (!actual.includes(item)) throw new Error(`Expected to contain ${item}`); },
        toHaveLength: (len) => { if (actual.length !== len) throw new Error(`Expected length ${len} but got ${actual.length}`); }
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD MODULES
// ═══════════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🧪 PHASE 2 NLU & SHADOW DOM - UNIT TESTS');
console.log('═══════════════════════════════════════════════════════════════════════════════');

const {
    Tokenizer,
    IntentPattern,
    EntityExtractor,
    NLUEngine,
    IntentCategory,
    EntityType,
    BuiltInIntents,
    createNLU,
    getNLUEngine
} = require('../../nlu/nlu-engine');

const {
    ShadowPath,
    ShadowDOMNavigator,
    ShadowSelectorBuilder,
    PiercingLocator,
    ShadowDOMInteractor,
    ShadowMode,
    TraversalStrategy,
    createNavigator,
    createInteractor,
    selector,
    getShadowNavigator
} = require('../../shadow/shadow-dom');

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 21: NLU ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 21: IntentCategory', () => {
    test('IntentCategory should be defined', () => {
        expect(IntentCategory).toBeTruthy();
    });

    test('IntentCategory should have NAVIGATION', () => {
        expect(IntentCategory.NAVIGATION).toBe('navigation');
    });

    test('IntentCategory should have FORM_INTERACTION', () => {
        expect(IntentCategory.FORM_INTERACTION).toBe('form_interaction');
    });

    test('IntentCategory should have DATA_VALIDATION', () => {
        expect(IntentCategory.DATA_VALIDATION).toBe('data_validation');
    });

    test('IntentCategory should have ASSERTION', () => {
        expect(IntentCategory.ASSERTION).toBe('assertion');
    });

    test('IntentCategory should have API_CALL', () => {
        expect(IntentCategory.API_CALL).toBe('api_call');
    });

    test('IntentCategory should have WAIT', () => {
        expect(IntentCategory.WAIT).toBe('wait');
    });

    test('IntentCategory should have UNKNOWN', () => {
        expect(IntentCategory.UNKNOWN).toBe('unknown');
    });
});

describe('Step 21: EntityType', () => {
    test('EntityType should be defined', () => {
        expect(EntityType).toBeTruthy();
    });

    test('EntityType should have ELEMENT', () => {
        expect(EntityType.ELEMENT).toBe('element');
    });

    test('EntityType should have VALUE', () => {
        expect(EntityType.VALUE).toBe('value');
    });

    test('EntityType should have URL', () => {
        expect(EntityType.URL).toBe('url');
    });

    test('EntityType should have SELECTOR', () => {
        expect(EntityType.SELECTOR).toBe('selector');
    });
});

describe('Step 21: Tokenizer', () => {
    test('Tokenizer should be a class', () => {
        expect(typeof Tokenizer).toBe('function');
    });

    test('Tokenizer should be constructable', () => {
        const tokenizer = new Tokenizer();
        expect(tokenizer).toBeInstanceOf(Tokenizer);
    });

    test('Tokenizer should have tokenize method', () => {
        const tokenizer = new Tokenizer();
        expect(typeof tokenizer.tokenize).toBe('function');
    });

    test('Tokenizer should tokenize text', () => {
        const tokenizer = new Tokenizer();
        const tokens = tokenizer.tokenize('click the button');
        expect(Array.isArray(tokens)).toBe(true);
    });

    test('Tokenizer should lowercase by default', () => {
        const tokenizer = new Tokenizer();
        const tokens = tokenizer.tokenize('CLICK BUTTON');
        expect(tokens[0]).toBe('click');
    });

    test('Tokenizer should remove stopwords by default', () => {
        const tokenizer = new Tokenizer({ removeStopwords: true });
        const tokens = tokenizer.tokenize('click the button');
        expect(tokens.includes('the')).toBe(false);
    });

    test('Tokenizer should have ngrams method', () => {
        const tokenizer = new Tokenizer();
        expect(typeof tokenizer.ngrams).toBe('function');
    });
});

describe('Step 21: IntentPattern', () => {
    test('IntentPattern should be a class', () => {
        expect(typeof IntentPattern).toBe('function');
    });

    test('IntentPattern should be constructable', () => {
        const pattern = new IntentPattern({ name: 'test', category: 'test', patterns: [] });
        expect(pattern).toBeInstanceOf(IntentPattern);
    });

    test('IntentPattern should have match method', () => {
        const pattern = new IntentPattern({ name: 'test', patterns: [] });
        expect(typeof pattern.match).toBe('function');
    });
});

describe('Step 21: EntityExtractor', () => {
    test('EntityExtractor should be a class', () => {
        expect(typeof EntityExtractor).toBe('function');
    });

    test('EntityExtractor should be constructable', () => {
        const extractor = new EntityExtractor();
        expect(extractor).toBeInstanceOf(EntityExtractor);
    });

    test('EntityExtractor should have extract method', () => {
        const extractor = new EntityExtractor();
        expect(typeof extractor.extract).toBe('function');
    });
});

describe('Step 21: NLUEngine', () => {
    test('NLUEngine should be a class', () => {
        expect(typeof NLUEngine).toBe('function');
    });

    test('NLUEngine should be constructable', () => {
        const engine = new NLUEngine();
        expect(engine).toBeInstanceOf(NLUEngine);
    });

    test('NLUEngine should have understand method', () => {
        const engine = new NLUEngine();
        expect(typeof engine.understand).toBe('function');
    });

    test('NLUEngine should have registerIntent method', () => {
        const engine = new NLUEngine();
        expect(typeof engine.registerIntent).toBe('function');
    });

    test('NLUEngine should have tokenizer', () => {
        const engine = new NLUEngine();
        expect(engine.tokenizer).toBeInstanceOf(Tokenizer);
    });

    test('NLUEngine should have entityExtractor', () => {
        const engine = new NLUEngine();
        expect(engine.entityExtractor).toBeInstanceOf(EntityExtractor);
    });

    test('NLUEngine should have getStats method', () => {
        const engine = new NLUEngine();
        expect(typeof engine.getStats).toBe('function');
    });

    test('NLUEngine getStats should return stats object', () => {
        const engine = new NLUEngine();
        const stats = engine.getStats();
        expect(stats).toHaveProperty('processed');
    });
});

describe('Step 21: BuiltInIntents', () => {
    test('BuiltInIntents should be defined', () => {
        expect(BuiltInIntents).toBeTruthy();
    });

    test('BuiltInIntents should be an array', () => {
        expect(Array.isArray(BuiltInIntents)).toBe(true);
    });

    test('BuiltInIntents should have intent patterns', () => {
        expect(BuiltInIntents.length).toBeGreaterThan(0);
    });
});

describe('Step 21: NLU Factory Functions', () => {
    test('createNLU should create NLUEngine', () => {
        const engine = createNLU();
        expect(engine).toBeInstanceOf(NLUEngine);
    });

    test('getNLUEngine should return singleton', () => {
        const engine1 = getNLUEngine();
        const engine2 = getNLUEngine();
        expect(engine1).toBe(engine2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 23: SHADOW DOM TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 23: ShadowMode', () => {
    test('ShadowMode should be defined', () => {
        expect(ShadowMode).toBeTruthy();
    });

    test('ShadowMode should have OPEN', () => {
        expect(ShadowMode.OPEN).toBe('open');
    });

    test('ShadowMode should have CLOSED', () => {
        expect(ShadowMode.CLOSED).toBe('closed');
    });
});

describe('Step 23: TraversalStrategy', () => {
    test('TraversalStrategy should be defined', () => {
        expect(TraversalStrategy).toBeTruthy();
    });

    test('TraversalStrategy should have DEEP_FIRST', () => {
        expect(TraversalStrategy.DEEP_FIRST).toBe('deep_first');
    });

    test('TraversalStrategy should have BREADTH_FIRST', () => {
        expect(TraversalStrategy.BREADTH_FIRST).toBe('breadth_first');
    });

    test('TraversalStrategy should have PIERCE', () => {
        expect(TraversalStrategy.PIERCE).toBe('pierce');
    });
});

describe('Step 23: ShadowPath', () => {
    test('ShadowPath should be a class', () => {
        expect(typeof ShadowPath).toBe('function');
    });

    test('ShadowPath should be constructable', () => {
        const path = new ShadowPath();
        expect(path).toBeInstanceOf(ShadowPath);
    });

    test('ShadowPath should have addSegment method', () => {
        const path = new ShadowPath();
        expect(typeof path.addSegment).toBe('function');
    });

    test('ShadowPath addSegment should return self', () => {
        const path = new ShadowPath();
        const result = path.addSegment('.host');
        expect(result).toBe(path);
    });

    test('ShadowPath should have toString method', () => {
        const path = new ShadowPath();
        expect(typeof path.toString).toBe('function');
    });

    test('ShadowPath should have getDepth method', () => {
        const path = new ShadowPath();
        expect(typeof path.getDepth).toBe('function');
    });

    test('ShadowPath.fromString should parse >>> notation', () => {
        const path = ShadowPath.fromString('.host >>> .inner >>> .target');
        expect(path.segments.length).toBe(3);
    });

    test('ShadowPath toString should return >>> notation', () => {
        const path = new ShadowPath();
        path.addSegment('.host', true);
        path.addSegment('.target', false);
        expect(path.toString()).toContain('>>>');
    });
});

describe('Step 23: ShadowDOMNavigator', () => {
    test('ShadowDOMNavigator should be a class', () => {
        expect(typeof ShadowDOMNavigator).toBe('function');
    });

    test('ShadowDOMNavigator should be constructable', () => {
        const navigator = new ShadowDOMNavigator();
        expect(navigator).toBeInstanceOf(ShadowDOMNavigator);
    });

    test('ShadowDOMNavigator should accept options', () => {
        const navigator = new ShadowDOMNavigator({ maxDepth: 5 });
        expect(navigator.options.maxDepth).toBe(5);
    });

    test('ShadowDOMNavigator should have findElement method', () => {
        const navigator = new ShadowDOMNavigator();
        expect(typeof navigator.findElement).toBe('function');
    });

    test('ShadowDOMNavigator should have findElements method', () => {
        const navigator = new ShadowDOMNavigator();
        expect(typeof navigator.findElements).toBe('function');
    });

    test('ShadowDOMNavigator should track stats', () => {
        const navigator = new ShadowDOMNavigator();
        expect(navigator.stats).toHaveProperty('traversals');
    });
});

describe('Step 23: ShadowSelectorBuilder', () => {
    test('ShadowSelectorBuilder should be a class', () => {
        expect(typeof ShadowSelectorBuilder).toBe('function');
    });

    test('ShadowSelectorBuilder should be constructable', () => {
        const builder = new ShadowSelectorBuilder();
        expect(builder).toBeInstanceOf(ShadowSelectorBuilder);
    });

    test('ShadowSelectorBuilder should have shadow method', () => {
        const builder = new ShadowSelectorBuilder();
        expect(typeof builder.shadow).toBe('function');
    });

    test('ShadowSelectorBuilder should support chaining', () => {
        const builder = new ShadowSelectorBuilder();
        const result = builder.shadow('.host');
        expect(result).toBe(builder);
    });

    test('ShadowSelectorBuilder should have select method', () => {
        const builder = new ShadowSelectorBuilder();
        expect(typeof builder.select).toBe('function');
    });

    test('ShadowSelectorBuilder should have build method', () => {
        const builder = new ShadowSelectorBuilder();
        expect(typeof builder.build).toBe('function');
    });
});

describe('Step 23: PiercingLocator', () => {
    test('PiercingLocator should be a class', () => {
        expect(typeof PiercingLocator).toBe('function');
    });

    test('PiercingLocator should be constructable', () => {
        const navigator = new ShadowDOMNavigator();
        const locator = new PiercingLocator(navigator, '.target');
        expect(locator).toBeInstanceOf(PiercingLocator);
    });

    test('PiercingLocator should have find method', () => {
        const navigator = new ShadowDOMNavigator();
        const locator = new PiercingLocator(navigator, '.target');
        expect(typeof locator.find).toBe('function');
    });

    test('PiercingLocator should have waitFor method', () => {
        const navigator = new ShadowDOMNavigator();
        const locator = new PiercingLocator(navigator, '.target');
        expect(typeof locator.waitFor).toBe('function');
    });
});

describe('Step 23: ShadowDOMInteractor', () => {
    test('ShadowDOMInteractor should be a class', () => {
        expect(typeof ShadowDOMInteractor).toBe('function');
    });

    test('ShadowDOMInteractor should have click method', () => {
        const navigator = new ShadowDOMNavigator();
        const interactor = new ShadowDOMInteractor(navigator);
        expect(typeof interactor.click).toBe('function');
    });

    test('ShadowDOMInteractor should have type method', () => {
        const navigator = new ShadowDOMNavigator();
        const interactor = new ShadowDOMInteractor(navigator);
        expect(typeof interactor.type).toBe('function');
    });

    test('ShadowDOMInteractor should have getText method', () => {
        const navigator = new ShadowDOMNavigator();
        const interactor = new ShadowDOMInteractor(navigator);
        expect(typeof interactor.getText).toBe('function');
    });

    test('ShadowDOMInteractor should have exists method', () => {
        const navigator = new ShadowDOMNavigator();
        const interactor = new ShadowDOMInteractor(navigator);
        expect(typeof interactor.exists).toBe('function');
    });

    test('ShadowDOMInteractor should have locator method', () => {
        const navigator = new ShadowDOMNavigator();
        const interactor = new ShadowDOMInteractor(navigator);
        expect(typeof interactor.locator).toBe('function');
    });
});

describe('Step 23: Shadow DOM Factory Functions', () => {
    test('createNavigator should create ShadowDOMNavigator', () => {
        const navigator = createNavigator();
        expect(navigator).toBeInstanceOf(ShadowDOMNavigator);
    });

    test('createInteractor should create ShadowDOMInteractor', () => {
        const navigator = new ShadowDOMNavigator();
        const interactor = createInteractor(navigator);
        expect(interactor).toBeInstanceOf(ShadowDOMInteractor);
    });

    test('selector should return ShadowSelectorBuilder', () => {
        const builder = selector();
        expect(builder).toBeInstanceOf(ShadowSelectorBuilder);
    });

    test('getShadowNavigator should return singleton', () => {
        const nav1 = getShadowNavigator();
        const nav2 = getShadowNavigator();
        expect(nav1).toBe(nav2);
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

if (errors.length > 0) {
    console.log('\n❌ FAILURES:');
    errors.forEach(e => console.log(`  ${e.name}: ${e.error}`));
}

process.exit(failed > 0 ? 1 : 0);
