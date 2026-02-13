/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 1 COGNITIVE - UNIT TESTS
 * Steps 10, 11, 12: Model Integrator, Cognitive Services, API Orchestrator
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
console.log('🧪 PHASE 1 COGNITIVE - UNIT TESTS');
console.log('═══════════════════════════════════════════════════════════════════════════════');

// Step 10 - Model Integrator
const {
    BaseProvider,
    OpenAIProvider,
    AnthropicProvider,
    AzureOpenAIProvider,
    LocalProvider,
    ModelIntegrator,
    getIntegrator,
    createProvider
} = require('../../cognitive/model-integrator');

// Step 11 - Cognitive Services
const {
    IntentClassifier,
    EntityExtractor,
    SentimentAnalyzer,
    TextSummarizer,
    CodeAnalyzer,
    CognitiveServices,
    getServices
} = require('../../cognitive/services');

// Step 12 - API Orchestrator
const {
    RequestQueue,
    LoadBalancer,
    CircuitBreaker,
    ResponseCache,
    APIOrchestrator,
    getOrchestrator,
    createOrchestrator
} = require('../../cognitive/orchestrator');

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 10: MODEL INTEGRATOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 10: Model Integrator', () => {
    
    // BaseProvider tests
    describe('BaseProvider', () => {
        test('BaseProvider should be a class', () => {
            expect(typeof BaseProvider).toBe('function');
        });
        
        test('BaseProvider instance should have name', () => {
            const provider = new BaseProvider({ name: 'test' });
            expect(provider.name).toBe('test');
        });
        
        test('BaseProvider should have chat method', () => {
            const provider = new BaseProvider({ name: 'test' });
            expect(typeof provider.chat).toBe('function');
        });
        
        test('BaseProvider should have complete method', () => {
            const provider = new BaseProvider({ name: 'test' });
            expect(typeof provider.complete).toBe('function');
        });
        
        test('BaseProvider should have embed method', () => {
            const provider = new BaseProvider({ name: 'test' });
            expect(typeof provider.embed).toBe('function');
        });
        
        test('BaseProvider should have stream method', () => {
            const provider = new BaseProvider({ name: 'test' });
            expect(typeof provider.stream).toBe('function');
        });
        
        test('BaseProvider should have getStats method', () => {
            const provider = new BaseProvider({ name: 'test' });
            expect(typeof provider.getStats).toBe('function');
        });
        
        test('BaseProvider getStats should return stats object', () => {
            const provider = new BaseProvider({ name: 'test' });
            const stats = provider.getStats();
            expect(typeof stats).toBe('object');
            expect(stats).toHaveProperty('requests');
        });
    });
    
    // OpenAIProvider tests
    describe('OpenAIProvider', () => {
        test('OpenAIProvider should be a class', () => {
            expect(typeof OpenAIProvider).toBe('function');
        });
        
        test('OpenAIProvider should extend BaseProvider', () => {
            const provider = new OpenAIProvider();
            expect(provider instanceof BaseProvider).toBeTruthy();
        });
        
        test('OpenAIProvider should have name openai', () => {
            const provider = new OpenAIProvider();
            expect(provider.name).toBe('openai');
        });
        
        test('OpenAIProvider should have models', () => {
            const provider = new OpenAIProvider();
            expect(provider.models).toBeDefined();
            expect(typeof provider.models).toBe('object');
        });
        
        test('OpenAIProvider getModels should return array', async () => {
            const provider = new OpenAIProvider();
            const models = await provider.getModels();
            expect(Array.isArray(models)).toBeTruthy();
        });
        
        test('OpenAIProvider chat should return response', async () => {
            const provider = new OpenAIProvider();
            const response = await provider.chat([{ role: 'user', content: 'Hello' }]);
            expect(response).toBeDefined();
            expect(response.choices).toBeDefined();
        });
        
        test('OpenAIProvider embed should return embeddings', async () => {
            const provider = new OpenAIProvider();
            const result = await provider.embed('Hello world');
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
        });
    });
    
    // AnthropicProvider tests
    describe('AnthropicProvider', () => {
        test('AnthropicProvider should be a class', () => {
            expect(typeof AnthropicProvider).toBe('function');
        });
        
        test('AnthropicProvider should extend BaseProvider', () => {
            const provider = new AnthropicProvider();
            expect(provider instanceof BaseProvider).toBeTruthy();
        });
        
        test('AnthropicProvider should have name anthropic', () => {
            const provider = new AnthropicProvider();
            expect(provider.name).toBe('anthropic');
        });
    });
    
    // AzureOpenAIProvider tests
    describe('AzureOpenAIProvider', () => {
        test('AzureOpenAIProvider should be a class', () => {
            expect(typeof AzureOpenAIProvider).toBe('function');
        });
        
        test('AzureOpenAIProvider should extend BaseProvider', () => {
            const provider = new AzureOpenAIProvider({ endpoint: 'https://test.azure.com' });
            expect(provider instanceof BaseProvider).toBeTruthy();
        });
    });
    
    // LocalProvider tests
    describe('LocalProvider', () => {
        test('LocalProvider should be a class', () => {
            expect(typeof LocalProvider).toBe('function');
        });
        
        test('LocalProvider should extend BaseProvider', () => {
            const provider = new LocalProvider();
            expect(provider instanceof BaseProvider).toBeTruthy();
        });
    });
    
    // ModelIntegrator tests
    describe('ModelIntegrator', () => {
        test('ModelIntegrator should be a class', () => {
            expect(typeof ModelIntegrator).toBe('function');
        });
        
        test('ModelIntegrator should have registerProvider method', () => {
            const integrator = new ModelIntegrator();
            expect(typeof integrator.registerProvider).toBe('function');
        });
        
        test('ModelIntegrator should have getProvider method', () => {
            const integrator = new ModelIntegrator();
            expect(typeof integrator.getProvider).toBe('function');
        });
        
        test('ModelIntegrator registerProvider should add provider', () => {
            const integrator = new ModelIntegrator();
            const provider = new OpenAIProvider();
            integrator.registerProvider('openai', provider);
            expect(integrator.getProvider('openai')).toBe(provider);
        });
        
        test('ModelIntegrator should have complete method', () => {
            const integrator = new ModelIntegrator();
            expect(typeof integrator.complete).toBe('function');
        });
        
        test('ModelIntegrator should have listProviders method', () => {
            const integrator = new ModelIntegrator();
            expect(typeof integrator.listProviders).toBe('function');
        });
        
        test('ModelIntegrator listProviders should return array', () => {
            const integrator = new ModelIntegrator();
            const providers = integrator.listProviders();
            expect(Array.isArray(providers)).toBeTruthy();
        });
        
        test('ModelIntegrator should have getAllStats method', () => {
            const integrator = new ModelIntegrator();
            expect(typeof integrator.getAllStats).toBe('function');
        });
    });
    
    // Factory functions tests
    describe('Factory Functions', () => {
        test('getIntegrator should return ModelIntegrator instance', () => {
            const integrator = getIntegrator();
            expect(integrator instanceof ModelIntegrator).toBeTruthy();
        });
        
        test('getIntegrator should return singleton', () => {
            const i1 = getIntegrator();
            const i2 = getIntegrator();
            expect(i1).toBe(i2);
        });
        
        test('createProvider should create OpenAI provider', () => {
            const provider = createProvider('openai', {});
            expect(provider instanceof OpenAIProvider).toBeTruthy();
        });
        
        test('createProvider should create Anthropic provider', () => {
            const provider = createProvider('anthropic', {});
            expect(provider instanceof AnthropicProvider).toBeTruthy();
        });
        
        test('createProvider should throw for unknown type', () => {
            expect(() => createProvider('unknown', {})).toThrow();
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 11: COGNITIVE SERVICES TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 11: Cognitive Services', () => {
    
    // IntentClassifier tests
    describe('IntentClassifier', () => {
        test('IntentClassifier should be a class', () => {
            expect(typeof IntentClassifier).toBe('function');
        });
        
        test('IntentClassifier should have registerIntent method', () => {
            const classifier = new IntentClassifier();
            expect(typeof classifier.registerIntent).toBe('function');
        });
        
        test('IntentClassifier should have classify method', () => {
            const classifier = new IntentClassifier();
            expect(typeof classifier.classify).toBe('function');
        });
        
        test('IntentClassifier registerIntent should add intent', () => {
            const classifier = new IntentClassifier();
            classifier.registerIntent('greeting', {
                examples: ['hello', 'hi'],
                handler: () => 'Hello!'
            });
            expect(classifier.intents.has('greeting')).toBeTruthy();
        });
        
        test('IntentClassifier should have execute method', () => {
            const classifier = new IntentClassifier();
            expect(typeof classifier.execute).toBe('function');
        });
    });
    
    // EntityExtractor tests
    describe('EntityExtractor', () => {
        test('EntityExtractor should be a class', () => {
            expect(typeof EntityExtractor).toBe('function');
        });
        
        test('EntityExtractor should have registerType method', () => {
            const extractor = new EntityExtractor();
            expect(typeof extractor.registerType).toBe('function');
        });
        
        test('EntityExtractor should have extract method', () => {
            const extractor = new EntityExtractor();
            expect(typeof extractor.extract).toBe('function');
        });
        
        test('EntityExtractor should have built-in email type', () => {
            const extractor = new EntityExtractor();
            expect(extractor.entityTypes.has('email')).toBeTruthy();
        });
        
        test('EntityExtractor should have built-in phone type', () => {
            const extractor = new EntityExtractor();
            expect(extractor.entityTypes.has('phone')).toBeTruthy();
        });
        
        test('EntityExtractor should have built-in url type', () => {
            const extractor = new EntityExtractor();
            expect(extractor.entityTypes.has('url')).toBeTruthy();
        });
        
        test('EntityExtractor should extract email', () => {
            const extractor = new EntityExtractor();
            const entities = extractor.extract('Contact me at test@example.com');
            expect(entities.length).toBeGreaterThan(0);
            expect(entities[0].type).toBe('email');
        });
        
        test('EntityExtractor should extract URL', () => {
            const extractor = new EntityExtractor();
            const entities = extractor.extract('Visit https://example.com');
            const urls = entities.filter(e => e.type === 'url');
            expect(urls.length).toBeGreaterThan(0);
        });
        
        test('EntityExtractor registerType should add custom type', () => {
            const extractor = new EntityExtractor();
            extractor.registerType('custom', {
                pattern: /\bCUST-\d+\b/g
            });
            expect(extractor.entityTypes.has('custom')).toBeTruthy();
        });
    });
    
    // SentimentAnalyzer tests
    describe('SentimentAnalyzer', () => {
        test('SentimentAnalyzer should be a class', () => {
            expect(typeof SentimentAnalyzer).toBe('function');
        });
        
        test('SentimentAnalyzer should have analyze method', () => {
            const analyzer = new SentimentAnalyzer();
            expect(typeof analyzer.analyze).toBe('function');
        });
        
        test('SentimentAnalyzer analyze should return sentiment object', () => {
            const analyzer = new SentimentAnalyzer();
            const result = analyzer.analyze('I love this product');
            expect(result).toHaveProperty('sentiment');
            expect(result).toHaveProperty('score');
        });
        
        test('SentimentAnalyzer should detect positive sentiment', () => {
            const analyzer = new SentimentAnalyzer();
            const result = analyzer.analyze('This is great and amazing');
            expect(result.sentiment).toBe('positive');
        });
        
        test('SentimentAnalyzer should detect negative sentiment', () => {
            const analyzer = new SentimentAnalyzer();
            const result = analyzer.analyze('This is terrible and awful');
            expect(result.sentiment).toBe('negative');
        });
        
        test('SentimentAnalyzer should detect neutral sentiment', () => {
            const analyzer = new SentimentAnalyzer();
            const result = analyzer.analyze('The sky is blue');
            expect(result.sentiment).toBe('neutral');
        });
    });
    
    // TextSummarizer tests
    describe('TextSummarizer', () => {
        test('TextSummarizer should be a class', () => {
            expect(typeof TextSummarizer).toBe('function');
        });
        
        test('TextSummarizer should have summarize method', () => {
            const summarizer = new TextSummarizer();
            expect(typeof summarizer.summarize).toBe('function');
        });
        
        test('TextSummarizer should have options', () => {
            const summarizer = new TextSummarizer({ maxLength: 100 });
            expect(summarizer.options.maxLength).toBe(100);
        });
    });
    
    // CodeAnalyzer tests
    describe('CodeAnalyzer', () => {
        test('CodeAnalyzer should be a class', () => {
            expect(typeof CodeAnalyzer).toBe('function');
        });
        
        test('CodeAnalyzer should have explain method', () => {
            const analyzer = new CodeAnalyzer();
            expect(typeof analyzer.explain).toBe('function');
        });
        
        test('CodeAnalyzer should have generateTests method', () => {
            const analyzer = new CodeAnalyzer();
            expect(typeof analyzer.generateTests).toBe('function');
        });
        
        test('CodeAnalyzer should have review method', () => {
            const analyzer = new CodeAnalyzer();
            expect(typeof analyzer.review).toBe('function');
        });
    });
    
    // CognitiveServices tests
    describe('CognitiveServices', () => {
        test('CognitiveServices should be a class', () => {
            expect(typeof CognitiveServices).toBe('function');
        });
        
        test('CognitiveServices should have intents getter', () => {
            const services = new CognitiveServices();
            expect(services.intents).toBeDefined();
        });
        
        test('CognitiveServices should have entities getter', () => {
            const services = new CognitiveServices();
            expect(services.entities).toBeDefined();
        });
        
        test('CognitiveServices should have sentiment getter', () => {
            const services = new CognitiveServices();
            expect(services.sentiment).toBeDefined();
        });
        
        test('CognitiveServices should have summarizer getter', () => {
            const services = new CognitiveServices();
            expect(services.summarizer).toBeDefined();
        });
        
        test('CognitiveServices should have code getter', () => {
            const services = new CognitiveServices();
            expect(services.code).toBeDefined();
        });
        
        test('CognitiveServices should have analyze method', () => {
            const services = new CognitiveServices();
            expect(typeof services.analyze).toBe('function');
        });
    });
    
    // Factory function tests
    describe('Factory Functions', () => {
        test('getServices should return CognitiveServices instance', () => {
            const services = getServices();
            expect(services instanceof CognitiveServices).toBeTruthy();
        });
        
        test('getServices should return singleton', () => {
            const s1 = getServices();
            const s2 = getServices();
            expect(s1).toBe(s2);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 12: API ORCHESTRATOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 12: API Orchestrator', () => {
    
    // RequestQueue tests
    describe('RequestQueue', () => {
        test('RequestQueue should be a class', () => {
            expect(typeof RequestQueue).toBe('function');
        });
        
        test('RequestQueue should have enqueue method', () => {
            const queue = new RequestQueue();
            expect(typeof queue.enqueue).toBe('function');
        });
        
        test('RequestQueue should have getStats method', () => {
            const queue = new RequestQueue();
            expect(typeof queue.getStats).toBe('function');
        });
        
        test('RequestQueue getStats should return stats object', () => {
            const queue = new RequestQueue();
            const stats = queue.getStats();
            expect(typeof stats).toBe('object');
            expect(stats).toHaveProperty('queued');
            expect(stats).toHaveProperty('active');
        });
        
        test('RequestQueue enqueue should return promise', () => {
            const queue = new RequestQueue();
            const result = queue.enqueue(() => Promise.resolve('test'));
            expect(result instanceof Promise).toBeTruthy();
        });
        
        test('RequestQueue should accept options', () => {
            const queue = new RequestQueue({
                concurrency: 5,
                rateLimit: 100
            });
            expect(queue.options.concurrency).toBe(5);
        });
    });
    
    // LoadBalancer tests
    describe('LoadBalancer', () => {
        test('LoadBalancer should be a class', () => {
            expect(typeof LoadBalancer).toBe('function');
        });
        
        test('LoadBalancer should have register method', () => {
            const lb = new LoadBalancer();
            expect(typeof lb.register).toBe('function');
        });
        
        test('LoadBalancer should have getNext method', () => {
            const lb = new LoadBalancer();
            expect(typeof lb.getNext).toBe('function');
        });
        
        test('LoadBalancer should have setStrategy method', () => {
            const lb = new LoadBalancer();
            expect(typeof lb.setStrategy).toBe('function');
        });
        
        test('LoadBalancer register should add provider', () => {
            const lb = new LoadBalancer();
            lb.register('provider1', { weight: 1 });
            expect(lb.providers.has('provider1')).toBeTruthy();
        });
        
        test('LoadBalancer setStrategy should accept round-robin', () => {
            const lb = new LoadBalancer();
            lb.setStrategy('round-robin');
            expect(lb.strategy).toBe('round-robin');
        });
        
        test('LoadBalancer setStrategy should accept least-connections', () => {
            const lb = new LoadBalancer();
            lb.setStrategy('least-connections');
            expect(lb.strategy).toBe('least-connections');
        });
        
        test('LoadBalancer setStrategy should accept weighted', () => {
            const lb = new LoadBalancer();
            lb.setStrategy('weighted');
            expect(lb.strategy).toBe('weighted');
        });
        
        test('LoadBalancer setStrategy should accept random', () => {
            const lb = new LoadBalancer();
            lb.setStrategy('random');
            expect(lb.strategy).toBe('random');
        });
        
        test('LoadBalancer setStrategy should throw for invalid', () => {
            const lb = new LoadBalancer();
            expect(() => lb.setStrategy('invalid')).toThrow();
        });
        
        test('LoadBalancer should have startRequest method', () => {
            const lb = new LoadBalancer();
            expect(typeof lb.startRequest).toBe('function');
        });
        
        test('LoadBalancer should have endRequest method', () => {
            const lb = new LoadBalancer();
            expect(typeof lb.endRequest).toBe('function');
        });
        
        test('LoadBalancer should have getStats method', () => {
            const lb = new LoadBalancer();
            expect(typeof lb.getStats).toBe('function');
        });
        
        test('LoadBalancer getNext should return provider', () => {
            const lb = new LoadBalancer();
            lb.register('p1', { weight: 1 });
            const provider = lb.getNext();
            expect(provider.name).toBe('p1');
        });
    });
    
    // CircuitBreaker tests
    describe('CircuitBreaker', () => {
        test('CircuitBreaker should be a class', () => {
            expect(typeof CircuitBreaker).toBe('function');
        });
        
        test('CircuitBreaker should have execute method', () => {
            const cb = new CircuitBreaker();
            expect(typeof cb.execute).toBe('function');
        });
        
        test('CircuitBreaker should have reset method', () => {
            const cb = new CircuitBreaker();
            expect(typeof cb.reset).toBe('function');
        });
        
        test('CircuitBreaker should have getState method', () => {
            const cb = new CircuitBreaker();
            expect(typeof cb.getState).toBe('function');
        });
        
        test('CircuitBreaker initial state should be closed', () => {
            const cb = new CircuitBreaker();
            expect(cb.state).toBe('closed');
        });
        
        test('CircuitBreaker getState should return state object', () => {
            const cb = new CircuitBreaker();
            const state = cb.getState();
            expect(state).toHaveProperty('state');
            expect(state).toHaveProperty('failures');
        });
        
        test('CircuitBreaker should accept options', () => {
            const cb = new CircuitBreaker({
                failureThreshold: 10,
                timeout: 60000
            });
            expect(cb.options.failureThreshold).toBe(10);
            expect(cb.options.timeout).toBe(60000);
        });
        
        test('CircuitBreaker execute should run function', async () => {
            const cb = new CircuitBreaker();
            const result = await cb.execute(() => Promise.resolve('success'));
            expect(result).toBe('success');
        });
        
        test('CircuitBreaker reset should reset state', () => {
            const cb = new CircuitBreaker();
            cb.state = 'open';
            cb.failures = 5;
            cb.reset();
            expect(cb.state).toBe('closed');
            expect(cb.failures).toBe(0);
        });
    });
    
    // ResponseCache tests
    describe('ResponseCache', () => {
        test('ResponseCache should be a class', () => {
            expect(typeof ResponseCache).toBe('function');
        });
        
        test('ResponseCache should have get method', () => {
            const cache = new ResponseCache();
            expect(typeof cache.get).toBe('function');
        });
        
        test('ResponseCache should have set method', () => {
            const cache = new ResponseCache();
            expect(typeof cache.set).toBe('function');
        });
        
        test('ResponseCache should have getStats method', () => {
            const cache = new ResponseCache();
            expect(typeof cache.getStats).toBe('function');
        });
        
        test('ResponseCache should accept options', () => {
            const cache = new ResponseCache({
                maxSize: 500,
                defaultTTL: 1800000
            });
            expect(cache.options.maxSize).toBe(500);
        });
        
        test('ResponseCache set/get should work', () => {
            const cache = new ResponseCache();
            cache.set({ key: 'test' }, { value: 'data' });
            const result = cache.get({ key: 'test' });
            expect(result.value).toBe('data');
        });
        
        test('ResponseCache getStats should return hits/misses', () => {
            const cache = new ResponseCache();
            const stats = cache.getStats();
            expect(stats).toHaveProperty('hits');
            expect(stats).toHaveProperty('misses');
        });
    });
    
    // APIOrchestrator tests
    describe('APIOrchestrator', () => {
        test('APIOrchestrator should be a class', () => {
            expect(typeof APIOrchestrator).toBe('function');
        });
        
        test('APIOrchestrator should have execute method', () => {
            const orchestrator = new APIOrchestrator();
            expect(typeof orchestrator.execute).toBe('function');
        });
        
        test('APIOrchestrator should have executeBatch method', () => {
            const orchestrator = new APIOrchestrator();
            expect(typeof orchestrator.executeBatch).toBe('function');
        });
        
        test('APIOrchestrator should have executeWithRetry method', () => {
            const orchestrator = new APIOrchestrator();
            expect(typeof orchestrator.executeWithRetry).toBe('function');
        });
        
        test('APIOrchestrator should have getStats method', () => {
            const orchestrator = new APIOrchestrator();
            expect(typeof orchestrator.getStats).toBe('function');
        });
        
        test('APIOrchestrator getStats should return stats', () => {
            const orchestrator = new APIOrchestrator();
            const stats = orchestrator.getStats();
            expect(typeof stats).toBe('object');
            expect(stats).toHaveProperty('queue');
        });
        
        test('APIOrchestrator should have queue property', () => {
            const orchestrator = new APIOrchestrator();
            expect(orchestrator.queue).toBeInstanceOf(RequestQueue);
        });
        
        test('APIOrchestrator should have loadBalancer property', () => {
            const orchestrator = new APIOrchestrator();
            expect(orchestrator.loadBalancer).toBeInstanceOf(LoadBalancer);
        });
        
        test('APIOrchestrator should have cache property', () => {
            const orchestrator = new APIOrchestrator();
            expect(orchestrator.cache).toBeInstanceOf(ResponseCache);
        });
    });
    
    // Factory functions tests
    describe('Factory Functions', () => {
        test('getOrchestrator should return APIOrchestrator instance', () => {
            const orchestrator = getOrchestrator();
            expect(orchestrator instanceof APIOrchestrator).toBeTruthy();
        });
        
        test('getOrchestrator should return singleton', () => {
            const o1 = getOrchestrator();
            const o2 = getOrchestrator();
            expect(o1).toBe(o2);
        });
        
        test('createOrchestrator should create new instance', () => {
            const o1 = createOrchestrator({});
            const o2 = createOrchestrator({});
            expect(o1 instanceof APIOrchestrator).toBeTruthy();
            expect(o2 instanceof APIOrchestrator).toBeTruthy();
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
