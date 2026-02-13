/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  PHASE 2 UNIT TESTS - Steps 29-34                                             ║
 * ║  Look-Ahead, Knowledge Distillation, Genetic, Mutations, Decisions, Meta      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

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
        toBeGreaterThanOrEqual: (n) => { if (actual < n) throw new Error(`Expected ${actual} >= ${n}`); },
        toBeLessThan: (n) => { if (actual >= n) throw new Error(`Expected ${actual} < ${n}`); },
        toBeLessThanOrEqual: (n) => { if (actual > n) throw new Error(`Expected ${actual} <= ${n}`); },
        toContain: (item) => { if (!actual.includes(item)) throw new Error(`Expected to contain ${item}`); },
        toHaveLength: (len) => { if (actual.length !== len) throw new Error(`Expected length ${len} but got ${actual.length}`); },
        toBeDefined: () => { if (actual === undefined) throw new Error(`Expected defined but got undefined`); },
        toBeNull: () => { if (actual !== null) throw new Error(`Expected null but got ${actual}`); },
        toBeCloseTo: (expected, precision = 2) => { 
            const diff = Math.abs(actual - expected);
            const tolerance = Math.pow(10, -precision) / 2;
            if (diff > tolerance) throw new Error(`Expected ${actual} to be close to ${expected}`);
        },
        not: {
            toBe: (expected) => { if (actual === expected) throw new Error(`Expected ${actual} to not equal ${expected}`); },
            toEqual: (expected) => { if (JSON.stringify(actual) === JSON.stringify(expected)) throw new Error(`Expected values to differ`); }
        }
    };
}

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🧪 PHASE 2 STEPS 29-34 - UNIT TESTS');
console.log('   Look-Ahead, Knowledge Distillation, Genetic, Mutations, Decisions, Meta');
console.log('═══════════════════════════════════════════════════════════════════════════════');

// Step 29: Look-Ahead Engine
const {
    StateNode,
    MCTS,
    MinimaxEngine,
    LookAheadEngine,
    createEngine: createLookAhead,
    createMCTS,
    createMinimax
} = require('../../chronos/look-ahead');

// Step 30: Knowledge Distillation
const {
    KnowledgeExtractor,
    DistillationLoss,
    KnowledgeDistiller,
    KnowledgeType,
    DistillationMode,
    createDistiller,
    createExtractor
} = require('../../knowledge/distillation');

// Step 31: Genetic Evolution
const {
    Genome,
    SelectionOperator,
    CrossoverOperator,
    GeneticAlgorithm,
    SelectionMethod,
    CrossoverMethod,
    createGA,
    createGenome
} = require('../../evolution/genetic');

// Step 32: Mutation Engine
const {
    BasicMutations,
    RealMutations,
    AdaptiveMutation,
    MutationEngine,
    MutationType,
    createEngine: createMutationEngine,
    bitFlip,
    swap,
    gaussian
} = require('../../evolution/mutations');

// Step 33: Autonomous Decisions
const {
    Option,
    DecisionMaker,
    AutonomousDecisionEngine,
    DecisionStrategy,
    DecisionPriority,
    createEngine: createDecisionEngine,
    createDecisionMaker
} = require('../../autonomous/decisions');

// Step 34: Meta-Learning
const {
    TaskDistribution,
    MAML,
    Reptile,
    MetaLearningEngine,
    MetaStrategy,
    TaskType,
    createEngine: createMetaEngine,
    createMAML,
    createReptile,
    createTaskDistribution
} = require('../../meta/learning');

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 29: LOOK-AHEAD ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 29: StateNode', () => {
    test('should create state node with initial values', () => {
        const node = new StateNode({ x: 0, y: 0 });
        expect(node.state).toBeDefined();
        expect(node.state.x).toBe(0);
        expect(node.children).toBeInstanceOf(Array);
        expect(node.children.length).toBe(0);
        expect(node.visits).toBe(0);
        expect(node.value).toBe(0);
        expect(node.depth).toBe(0);
    });

    test('should create node with action and parent', () => {
        const parent = new StateNode({ pos: 0 });
        const child = new StateNode({ pos: 1 }, 'move', parent);
        expect(child.action).toBe('move');
        expect(child.parent).toBe(parent);
        expect(child.depth).toBe(1);
    });

    test('should add child nodes', () => {
        const root = new StateNode({ val: 0 });
        const child = root.addChild({ val: 1 }, 'increment');
        expect(root.children.length).toBe(1);
        expect(child.parent).toBe(root);
        expect(child.action).toBe('increment');
    });

    test('should calculate UCB1 correctly', () => {
        const root = new StateNode({});
        root.visits = 100;
        const child = root.addChild({}, 'act');
        child.visits = 10;
        child.value = 5;
        
        const ucb = child.getUCB1();
        expect(typeof ucb).toBe('number');
        expect(ucb).toBeGreaterThan(0);
    });

    test('should return Infinity for unvisited nodes', () => {
        const root = new StateNode({});
        const child = root.addChild({}, 'act');
        expect(child.getUCB1()).toBe(Infinity);
    });

    test('should detect leaf nodes', () => {
        const node = new StateNode({});
        expect(node.isLeaf()).toBe(true);
        node.addChild({}, 'a');
        expect(node.isLeaf()).toBe(false);
    });

    test('should get path from root', () => {
        const root = new StateNode({ level: 0 });
        const child1 = root.addChild({ level: 1 }, 'a');
        const child2 = child1.addChild({ level: 2 }, 'b');
        
        const path = child2.getPath();
        expect(path.length).toBe(2);
        expect(path[0].action).toBe('a');
        expect(path[1].action).toBe('b');
    });
});

describe('Step 29: MCTS', () => {
    test('should create MCTS with default options', () => {
        const mcts = new MCTS();
        expect(mcts.options.simulations).toBe(1000);
        expect(mcts.options.maxDepth).toBe(50);
    });

    test('should create MCTS with custom options', () => {
        const mcts = new MCTS({ simulations: 500, maxDepth: 20 });
        expect(mcts.options.simulations).toBe(500);
        expect(mcts.options.maxDepth).toBe(20);
    });

    test('should search for best action', () => {
        const mcts = new MCTS({ simulations: 50 });
        
        const getActions = (state) => state < 10 ? ['inc', 'stay'] : [];
        const transition = (state, action) => action === 'inc' ? state + 1 : state;
        const evaluate = (state) => state;
        const isTerminal = (state) => state >= 10;
        
        const result = mcts.search(0, getActions, transition, evaluate, isTerminal);
        expect(result.action).toBeDefined();
        expect(typeof result.value).toBe('number');
    });

    test('should use factory function', () => {
        const mcts = createMCTS({ simulations: 100 });
        expect(mcts).toBeInstanceOf(MCTS);
    });

    test('should emit progress events', () => {
        const mcts = new MCTS({ simulations: 200 });
        let progressEmitted = false;
        
        mcts.on('progress', () => { progressEmitted = true; });
        
        const getActions = (s) => s < 5 ? ['a'] : [];
        const transition = (s, a) => s + 1;
        const evaluate = (s) => s;
        const isTerminal = (s) => s >= 5;
        
        mcts.search(0, getActions, transition, evaluate, isTerminal);
        expect(progressEmitted).toBe(true);
    });
});

describe('Step 29: MinimaxEngine', () => {
    test('should create minimax with default options', () => {
        const minimax = new MinimaxEngine();
        expect(minimax.options.maxDepth).toBe(10);
        expect(minimax.nodesExplored).toBe(0);
    });

    test('should create minimax with custom depth', () => {
        const minimax = new MinimaxEngine({ maxDepth: 5 });
        expect(minimax.options.maxDepth).toBe(5);
    });

    test('should search for best action', () => {
        const minimax = new MinimaxEngine({ maxDepth: 3 });
        
        const getActions = (state) => state.depth < 3 ? [0, 1] : [];
        const transition = (state, action) => ({ depth: state.depth + 1, val: state.val + action });
        const evaluate = (state) => state.val;
        const isTerminal = (state) => state.depth >= 3;
        
        const result = minimax.search(
            { depth: 0, val: 0 },
            getActions, transition, evaluate, isTerminal, true
        );
        
        expect(result.value).toBeDefined();
    });

    test('should use factory function', () => {
        const minimax = createMinimax({ maxDepth: 8 });
        expect(minimax).toBeInstanceOf(MinimaxEngine);
    });

    test('should emit complete event', () => {
        const minimax = new MinimaxEngine({ maxDepth: 2 });
        let completed = false;
        
        minimax.on('complete', () => { completed = true; });
        
        minimax.search(
            { d: 0 },
            (s) => s.d < 2 ? [1] : [],
            (s, a) => ({ d: s.d + 1 }),
            (s) => s.d,
            (s) => s.d >= 2
        );
        
        expect(completed).toBe(true);
    });
});

describe('Step 29: LookAheadEngine', () => {
    test('should create engine with default options', () => {
        const engine = new LookAheadEngine();
        expect(engine.options.nSteps).toBeDefined();
    });

    test('should use factory function', () => {
        const engine = createLookAhead({ nSteps: 5 });
        expect(engine).toBeInstanceOf(LookAheadEngine);
    });

    test('should clear cache', () => {
        const engine = new LookAheadEngine();
        engine.clearCache();
        expect(engine.cache.size).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 30: KNOWLEDGE DISTILLATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 30: KnowledgeExtractor', () => {
    test('should create extractor with default options', () => {
        const extractor = new KnowledgeExtractor();
        expect(extractor.options.temperature).toBe(3.0);
        expect(extractor.extractedKnowledge).toBeInstanceOf(Array);
    });

    test('should create extractor with custom temperature', () => {
        const extractor = new KnowledgeExtractor({ temperature: 5.0 });
        expect(extractor.options.temperature).toBe(5.0);
    });

    test('should extract soft labels from logits', () => {
        const extractor = new KnowledgeExtractor();
        const logits = [2.0, 1.0, 0.1];
        
        const result = extractor.extractSoftLabels(logits);
        expect(result.type).toBe(KnowledgeType.SOFT_LABELS);
        expect(result.data).toBeInstanceOf(Array);
        expect(result.data.length).toBe(3);
        
        // Sum should be close to 1
        const sum = result.data.reduce((a, b) => a + b, 0);
        expect(Math.abs(sum - 1)).toBeLessThan(0.001);
    });

    test('should extract feature maps', () => {
        const extractor = new KnowledgeExtractor();
        const activations = [1.0, 2.0, 3.0, 4.0, 5.0];
        
        const result = extractor.extractFeatureMaps(activations);
        expect(result.type).toBe(KnowledgeType.FEATURE_MAPS);
        expect(result.data).toBeInstanceOf(Array);
    });

    test('should extract attention patterns', () => {
        const extractor = new KnowledgeExtractor();
        const attention = [[0.1, 0.2, 0.7], [0.3, 0.3, 0.4]];
        
        const result = extractor.extractAttention(attention);
        expect(result.type).toBe(KnowledgeType.ATTENTION);
        expect(result.heads).toBe(2);
    });

    test('should use factory function', () => {
        const extractor = createExtractor({ temperature: 2.0 });
        expect(extractor).toBeInstanceOf(KnowledgeExtractor);
    });

    test('should extract all knowledge types', () => {
        const extractor = new KnowledgeExtractor({
            extractionTypes: [KnowledgeType.SOFT_LABELS, KnowledgeType.EMBEDDINGS]
        });
        
        const teacherOutput = {
            logits: [1, 2, 3],
            embeddings: [0.1, 0.2, 0.3]
        };
        
        const knowledge = extractor.extract(teacherOutput);
        expect(knowledge.softLabels).toBeDefined();
        expect(knowledge.embeddings).toBeDefined();
    });
});

describe('Step 30: DistillationLoss', () => {
    test('should calculate KL divergence', () => {
        const studentProbs = [0.3, 0.3, 0.4];
        const teacherProbs = [0.2, 0.3, 0.5];
        
        const loss = DistillationLoss.klDivergence(studentProbs, teacherProbs);
        expect(typeof loss).toBe('number');
        expect(loss).toBeGreaterThanOrEqual(0);
    });

    test('should calculate MSE loss', () => {
        const student = [1, 2, 3];
        const teacher = [1.1, 2.2, 3.3];
        
        const loss = DistillationLoss.mse(student, teacher);
        expect(typeof loss).toBe('number');
        expect(loss).toBeGreaterThan(0);
    });

    test('should calculate cosine similarity loss', () => {
        const vec1 = [1, 0, 0];
        const vec2 = [0, 1, 0];
        
        const loss = DistillationLoss.cosineSimilarity(vec1, vec2);
        expect(typeof loss).toBe('number');
        // Orthogonal vectors should have similarity near 0, loss near 1
        expect(loss).toBeCloseTo(1, 1);
    });

    test('should calculate combined loss', () => {
        const studentOutput = { logits: [1, 2, 3] };
        const teacherKnowledge = { 
            softLabels: { data: [0.2, 0.3, 0.5] }
        };
        
        const result = DistillationLoss.combined(studentOutput, teacherKnowledge);
        expect(result.total).toBeDefined();
        expect(result.components).toBeDefined();
    });
});

describe('Step 30: KnowledgeDistiller', () => {
    test('should create distiller with default options', () => {
        const distiller = new KnowledgeDistiller();
        expect(distiller.options.mode).toBe(DistillationMode.OFFLINE);
        expect(distiller.options.temperature).toBe(3.0);
        expect(distiller.options.alpha).toBe(0.5);
    });

    test('should create distiller with custom options', () => {
        const distiller = new KnowledgeDistiller({ 
            mode: DistillationMode.ONLINE,
            temperature: 4.0
        });
        expect(distiller.options.mode).toBe(DistillationMode.ONLINE);
        expect(distiller.options.temperature).toBe(4.0);
    });

    test('should use factory function', () => {
        const distiller = createDistiller({ alpha: 0.7 });
        expect(distiller).toBeInstanceOf(KnowledgeDistiller);
    });

    test('should have extractor', () => {
        const distiller = new KnowledgeDistiller();
        expect(distiller.extractor).toBeInstanceOf(KnowledgeExtractor);
    });

    test('should verify knowledge types enum', () => {
        expect(KnowledgeType.SOFT_LABELS).toBe('soft_labels');
        expect(KnowledgeType.FEATURE_MAPS).toBe('feature_maps');
        expect(KnowledgeType.ATTENTION).toBe('attention');
        expect(KnowledgeType.LOGITS).toBe('logits');
        expect(KnowledgeType.EMBEDDINGS).toBe('embeddings');
    });

    test('should verify distillation modes', () => {
        expect(DistillationMode.OFFLINE).toBe('offline');
        expect(DistillationMode.ONLINE).toBe('online');
        expect(DistillationMode.SELF).toBe('self');
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 31: GENETIC EVOLUTION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 31: Genome', () => {
    test('should create genome with genes', () => {
        const genome = new Genome([1, 2, 3, 4, 5]);
        expect(genome.genes).toEqual([1, 2, 3, 4, 5]);
        expect(genome.fitness).toBeNull();
        expect(genome.length).toBe(5);
    });

    test('should create genome with fitness', () => {
        const genome = new Genome([1, 2], 0.8);
        expect(genome.fitness).toBe(0.8);
    });

    test('should create random genome', () => {
        const genome = Genome.random(10, () => Math.random());
        expect(genome.length).toBe(10);
        expect(genome.genes.every(g => typeof g === 'number')).toBe(true);
    });

    test('should clone genome', () => {
        const original = new Genome([1, 2, 3], 0.5);
        original.age = 5;
        
        const clone = original.clone();
        expect(clone.genes).toEqual(original.genes);
        expect(clone.fitness).toBe(original.fitness);
        expect(clone.age).toBe(original.age);
        expect(clone.id).not.toBe(original.id);
    });

    test('should get gene at index', () => {
        const genome = new Genome([10, 20, 30]);
        expect(genome.get(0)).toBe(10);
        expect(genome.get(1)).toBe(20);
        expect(genome.get(2)).toBe(30);
    });

    test('should set gene and invalidate fitness', () => {
        const genome = new Genome([1, 2, 3], 0.9);
        genome.set(1, 99);
        expect(genome.get(1)).toBe(99);
        expect(genome.fitness).toBeNull();
    });

    test('should use factory function', () => {
        const genome = createGenome([1, 2, 3], 0.5);
        expect(genome).toBeInstanceOf(Genome);
    });
});

describe('Step 31: SelectionOperator', () => {
    const createPopulation = () => [
        new Genome([1], 0.9),
        new Genome([2], 0.5),
        new Genome([3], 0.3),
        new Genome([4], 0.1)
    ].map(g => { g.fitness = g.genes[0] / 10; return g; });

    test('should perform tournament selection', () => {
        const population = createPopulation();
        const selected = SelectionOperator.tournament(population, 2);
        expect(selected).toBeInstanceOf(Genome);
        expect(population.includes(selected)).toBe(true);
    });

    test('should perform roulette selection', () => {
        const population = createPopulation();
        const selected = SelectionOperator.roulette(population);
        expect(selected).toBeInstanceOf(Genome);
    });

    test('should perform rank selection', () => {
        const population = createPopulation();
        const selected = SelectionOperator.rank(population);
        expect(selected).toBeInstanceOf(Genome);
    });

    test('should perform truncation selection', () => {
        const population = createPopulation();
        const selected = SelectionOperator.truncation(population, 0.5);
        expect(selected).toBeInstanceOf(Genome);
    });

    test('should verify selection methods enum', () => {
        expect(SelectionMethod.TOURNAMENT).toBe('tournament');
        expect(SelectionMethod.ROULETTE).toBe('roulette');
        expect(SelectionMethod.RANK).toBe('rank');
        expect(SelectionMethod.ELITISM).toBe('elitism');
    });
});

describe('Step 31: CrossoverOperator', () => {
    test('should perform single point crossover', () => {
        const p1 = new Genome([1, 1, 1, 1]);
        const p2 = new Genome([2, 2, 2, 2]);
        
        const [c1, c2] = CrossoverOperator.singlePoint(p1, p2);
        expect(c1.length).toBe(4);
        expect(c2.length).toBe(4);
    });

    test('should perform two point crossover', () => {
        const p1 = new Genome([1, 1, 1, 1, 1]);
        const p2 = new Genome([2, 2, 2, 2, 2]);
        
        const [c1, c2] = CrossoverOperator.twoPoint(p1, p2);
        expect(c1.length).toBe(5);
        expect(c2.length).toBe(5);
    });

    test('should perform uniform crossover', () => {
        const p1 = new Genome([1, 1, 1, 1]);
        const p2 = new Genome([2, 2, 2, 2]);
        
        const [c1, c2] = CrossoverOperator.uniform(p1, p2);
        expect(c1.length).toBe(4);
        expect(c2.length).toBe(4);
    });

    test('should perform arithmetic crossover', () => {
        const p1 = new Genome([0, 0, 0]);
        const p2 = new Genome([10, 10, 10]);
        
        const [c1, c2] = CrossoverOperator.arithmetic(p1, p2, 0.5);
        // With alpha=0.5, children should have values around 5
        expect(c1.genes[0]).toBeCloseTo(5, 1);
    });

    test('should perform SBX crossover', () => {
        const p1 = new Genome([1, 2, 3]);
        const p2 = new Genome([4, 5, 6]);
        
        const [c1, c2] = CrossoverOperator.sbx(p1, p2);
        expect(c1.length).toBe(3);
        expect(c2.length).toBe(3);
    });

    test('should verify crossover methods enum', () => {
        expect(CrossoverMethod.SINGLE_POINT).toBe('single_point');
        expect(CrossoverMethod.TWO_POINT).toBe('two_point');
        expect(CrossoverMethod.UNIFORM).toBe('uniform');
        expect(CrossoverMethod.SBX).toBe('sbx');
    });
});

describe('Step 31: GeneticAlgorithm', () => {
    test('should create GA with default options', () => {
        const ga = new GeneticAlgorithm();
        expect(ga.population).toBeInstanceOf(Array);
        expect(ga.generation).toBe(0);
    });

    test('should use factory function', () => {
        const ga = createGA({ populationSize: 20 });
        expect(ga).toBeInstanceOf(GeneticAlgorithm);
    });

    test('should initialize population', () => {
        const ga = new GeneticAlgorithm({ populationSize: 10 });
        ga.initialize(5, () => Math.random());
        expect(ga.population.length).toBe(10);
        expect(ga.population[0].length).toBe(5);
    });

    test('should get statistics', () => {
        const ga = new GeneticAlgorithm({ populationSize: 5 });
        ga.initialize(3, () => Math.random());
        ga.population.forEach((g, i) => g.fitness = i);
        
        const stats = ga.getStatistics();
        expect(stats.generation).toBe(0);
        expect(stats.best).toBeDefined();
        expect(stats.worst).toBeDefined();
        expect(stats.average).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 32: MUTATION ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 32: BasicMutations', () => {
    test('should perform bit flip mutation', () => {
        const genome = new Genome([0, 0, 0, 0, 0]);
        BasicMutations.bitFlip(genome, 1.0); // 100% rate
        // At least some should flip
        const sum = genome.genes.reduce((a, b) => a + b, 0);
        expect(sum).toBeGreaterThan(0);
        expect(genome.fitness).toBeNull();
    });

    test('should perform swap mutation', () => {
        const genome = new Genome([1, 2, 3, 4, 5]);
        BasicMutations.swap(genome, 1.0);
        expect(genome.fitness).toBeNull();
    });

    test('should perform inversion mutation', () => {
        const genome = new Genome([1, 2, 3, 4, 5]);
        BasicMutations.inversion(genome, 1.0);
        expect(genome.fitness).toBeNull();
    });

    test('should perform scramble mutation', () => {
        const genome = new Genome([1, 2, 3, 4, 5]);
        BasicMutations.scramble(genome, 1.0);
        expect(genome.fitness).toBeNull();
    });

    test('should use exported shortcuts', () => {
        const genome1 = new Genome([0, 0, 0, 0]);
        bitFlip(genome1, 1.0);
        
        const genome2 = new Genome([1, 2, 3, 4]);
        swap(genome2, 1.0);
        
        expect(genome1.fitness).toBeNull();
        expect(genome2.fitness).toBeNull();
    });
});

describe('Step 32: RealMutations', () => {
    test('should perform gaussian mutation', () => {
        const genome = new Genome([0, 0, 0, 0, 0]);
        RealMutations.gaussian(genome, 1.0, 0.5);
        // Some values should have changed
        expect(genome.genes.some(g => g !== 0)).toBe(true);
        expect(genome.fitness).toBeNull();
    });

    test('should perform uniform mutation', () => {
        const genome = new Genome([0, 0, 0, 0, 0]);
        RealMutations.uniform(genome, 1.0, 0, 1);
        expect(genome.genes.every(g => g >= 0 && g <= 1)).toBe(true);
    });

    test('should perform polynomial mutation', () => {
        const genome = new Genome([0.5, 0.5, 0.5]);
        RealMutations.polynomial(genome, 1.0, 20, 0, 1);
        expect(genome.genes.every(g => g >= 0 && g <= 1)).toBe(true);
    });

    test('should perform creep mutation', () => {
        const genome = new Genome([0.5, 0.5, 0.5]);
        const original = [...genome.genes];
        RealMutations.creep(genome, 1.0, 0.1);
        // Values should have changed slightly
        expect(genome.genes.some((g, i) => g !== original[i])).toBe(true);
    });

    test('should use exported shortcuts', () => {
        const genome = new Genome([0, 0, 0]);
        gaussian(genome, 1.0, 0.1);
        expect(genome.fitness).toBeNull();
    });
});

describe('Step 32: AdaptiveMutation', () => {
    test('should create with default options', () => {
        const am = new AdaptiveMutation();
        expect(am.rate).toBe(0.1);
        expect(am.options.minRate).toBe(0.001);
        expect(am.options.maxRate).toBe(0.5);
    });

    test('should create with custom options', () => {
        const am = new AdaptiveMutation({ initialRate: 0.2 });
        expect(am.rate).toBe(0.2);
    });

    test('should apply mutation', () => {
        const am = new AdaptiveMutation();
        const genome = new Genome([0, 0, 0, 0, 0]);
        am.mutate(genome);
        expect(genome.fitness).toBeNull();
    });

    test('should track success count', () => {
        const am = new AdaptiveMutation();
        const genome = new Genome([1, 2, 3]);
        am.mutate(genome, true);
        expect(am.successCount).toBe(1);
        expect(am.totalCount).toBe(1);
    });

    test('should adapt rate after threshold', () => {
        const am = new AdaptiveMutation({ initialRate: 0.1 });
        const genome = new Genome([1, 2, 3]);
        
        // Apply 10 mutations with high success rate
        for (let i = 0; i < 10; i++) {
            am.mutate(genome, true);
        }
        
        // Rate should have increased
        expect(am.history.length).toBeGreaterThan(0);
    });
});

describe('Step 32: MutationEngine', () => {
    test('should create engine with default options', () => {
        const engine = new MutationEngine();
        expect(engine.options.rate).toBeDefined();
    });

    test('should use factory function', () => {
        const engine = createMutationEngine({ rate: 0.2 });
        expect(engine).toBeInstanceOf(MutationEngine);
    });

    test('should verify mutation types enum', () => {
        expect(MutationType.BIT_FLIP).toBe('bit_flip');
        expect(MutationType.SWAP).toBe('swap');
        expect(MutationType.GAUSSIAN).toBe('gaussian');
        expect(MutationType.ADAPTIVE).toBe('adaptive');
    });

    test('should get mutation operator', () => {
        const engine = new MutationEngine();
        const operator = engine.getOperator();
        expect(typeof operator).toBe('function');
    });

    test('should get stats', () => {
        const engine = new MutationEngine();
        const stats = engine.getStats();
        expect(stats).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 33: AUTONOMOUS DECISIONS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 33: Option', () => {
    test('should create option with id and name', () => {
        const option = new Option('opt1', 'Option One');
        expect(option.id).toBe('opt1');
        expect(option.name).toBe('Option One');
        expect(option.trials).toBe(0);
        expect(option.successes).toBe(0);
    });

    test('should create option with metadata', () => {
        const option = new Option('opt1', 'Test', { category: 'test' });
        expect(option.metadata.category).toBe('test');
    });

    test('should record outcome', () => {
        const option = new Option('opt1', 'Test');
        option.record(10, true);
        expect(option.trials).toBe(1);
        expect(option.successes).toBe(1);
        expect(option.totalReward).toBe(10);
    });

    test('should calculate average reward', () => {
        const option = new Option('opt1', 'Test');
        option.record(10);
        option.record(20);
        expect(option.getAverageReward()).toBe(15);
    });

    test('should calculate success rate', () => {
        const option = new Option('opt1', 'Test');
        option.record(1, true);
        option.record(1, false);
        option.record(1, true);
        expect(option.getSuccessRate()).toBeCloseTo(0.667, 2);
    });

    test('should sample from beta distribution', () => {
        const option = new Option('opt1', 'Test');
        option.record(1, true);
        const sample = option.sampleBeta();
        expect(typeof sample).toBe('number');
        expect(sample).toBeGreaterThanOrEqual(0);
        expect(sample).toBeLessThanOrEqual(1);
    });

    test('should calculate UCB score', () => {
        const option = new Option('opt1', 'Test');
        option.record(10);
        option.record(20);
        
        const ucb = option.getUCB(100);
        expect(typeof ucb).toBe('number');
    });

    test('should return Infinity UCB for unvisited', () => {
        const option = new Option('opt1', 'Test');
        expect(option.getUCB(100)).toBe(Infinity);
    });
});

describe('Step 33: DecisionMaker', () => {
    test('should create with default options', () => {
        const dm = new DecisionMaker();
        expect(dm.options.strategy).toBe(DecisionStrategy.UCB);
        expect(dm.totalTrials).toBe(0);
    });

    test('should create with custom strategy', () => {
        const dm = new DecisionMaker({ strategy: DecisionStrategy.GREEDY });
        expect(dm.options.strategy).toBe(DecisionStrategy.GREEDY);
    });

    test('should add options', () => {
        const dm = new DecisionMaker();
        dm.addOption('a', 'Option A');
        dm.addOption('b', 'Option B');
        expect(dm.options_.size).toBe(2);
    });

    test('should remove options', () => {
        const dm = new DecisionMaker();
        dm.addOption('a', 'Option A');
        dm.removeOption('a');
        expect(dm.options_.size).toBe(0);
    });

    test('should select option', () => {
        const dm = new DecisionMaker();
        dm.addOption('a', 'Option A');
        dm.addOption('b', 'Option B');
        
        const selected = dm.select();
        expect(selected).toBeInstanceOf(Option);
    });

    test('should throw if no options', () => {
        const dm = new DecisionMaker();
        let threw = false;
        try {
            dm.select();
        } catch (e) {
            threw = true;
        }
        expect(threw).toBe(true);
    });

    test('should use factory function', () => {
        const dm = createDecisionMaker({ epsilon: 0.2 });
        expect(dm).toBeInstanceOf(DecisionMaker);
    });

    test('should verify decision strategies', () => {
        expect(DecisionStrategy.GREEDY).toBe('greedy');
        expect(DecisionStrategy.EPSILON_GREEDY).toBe('epsilon_greedy');
        expect(DecisionStrategy.UCB).toBe('ucb');
        expect(DecisionStrategy.THOMPSON).toBe('thompson');
        expect(DecisionStrategy.SOFTMAX).toBe('softmax');
    });

    test('should verify decision priorities', () => {
        expect(DecisionPriority.CRITICAL).toBe(1);
        expect(DecisionPriority.HIGH).toBe(2);
        expect(DecisionPriority.MEDIUM).toBe(3);
        expect(DecisionPriority.LOW).toBe(4);
    });
});

describe('Step 33: AutonomousDecisionEngine', () => {
    test('should create with default options', () => {
        const engine = new AutonomousDecisionEngine();
        expect(engine.decisionMaker).toBeInstanceOf(DecisionMaker);
    });

    test('should use factory function', () => {
        const engine = createDecisionEngine({ confidenceThreshold: 0.9 });
        expect(engine).toBeInstanceOf(AutonomousDecisionEngine);
    });

    test('should get summary', () => {
        const engine = new AutonomousDecisionEngine();
        const summary = engine.getSummary();
        expect(summary.totalDecisions).toBeDefined();
        expect(summary.autonomousCapable).toBeDefined();
    });

    test('should check autonomous capability', () => {
        const engine = new AutonomousDecisionEngine();
        expect(engine.shouldActAutonomously()).toBe(false); // Not enough trials
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 34: META-LEARNING TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 34: TaskDistribution', () => {
    test('should create with default options', () => {
        const td = new TaskDistribution();
        expect(td.options.nWay).toBe(5);
        expect(td.options.kShot).toBe(1);
        expect(td.tasks).toBeInstanceOf(Array);
    });

    test('should create with custom options', () => {
        const td = new TaskDistribution({ nWay: 3, kShot: 5 });
        expect(td.options.nWay).toBe(3);
        expect(td.options.kShot).toBe(5);
    });

    test('should create task from data', () => {
        const td = new TaskDistribution({ nWay: 2, kShot: 1 });
        
        const data = [1, 2, 3, 4, 5, 6];
        const labels = ['a', 'a', 'b', 'b', 'c', 'c'];
        
        const task = td.createTask(data, labels);
        expect(task.id).toBeDefined();
        expect(task.classes).toBeInstanceOf(Array);
        expect(task.support).toBeInstanceOf(Array);
        expect(task.query).toBeInstanceOf(Array);
    });

    test('should create batch of tasks', () => {
        const td = new TaskDistribution({ nWay: 2, kShot: 1 });
        
        const data = [1, 2, 3, 4, 5, 6];
        const labels = ['a', 'a', 'b', 'b', 'c', 'c'];
        
        const batch = td.createBatch(data, labels, 3);
        expect(batch.length).toBe(3);
    });

    test('should use factory function', () => {
        const td = createTaskDistribution({ nWay: 3 });
        expect(td).toBeInstanceOf(TaskDistribution);
    });
});

describe('Step 34: MAML', () => {
    test('should create with default options', () => {
        const maml = new MAML();
        expect(maml.options.innerLR).toBe(0.01);
        expect(maml.options.outerLR).toBe(0.001);
        expect(maml.options.innerSteps).toBe(5);
    });

    test('should create with custom options', () => {
        const maml = new MAML({ innerLR: 0.05, innerSteps: 10 });
        expect(maml.options.innerLR).toBe(0.05);
        expect(maml.options.innerSteps).toBe(10);
    });

    test('should initialize meta-parameters', () => {
        const maml = new MAML();
        maml.initialize([3, 4, 5]);
        expect(maml.metaParameters).toBeDefined();
    });

    test('should use factory function', () => {
        const maml = createMAML({ innerLR: 0.02 });
        expect(maml).toBeInstanceOf(MAML);
    });

    test('should verify meta strategies', () => {
        expect(MetaStrategy.MAML).toBe('maml');
        expect(MetaStrategy.REPTILE).toBe('reptile');
        expect(MetaStrategy.PROTOTYPICAL).toBe('proto');
        expect(MetaStrategy.MATCHING).toBe('matching');
        expect(MetaStrategy.MEMORY).toBe('memory');
    });

    test('should verify task types', () => {
        expect(TaskType.CLASSIFICATION).toBe('classification');
        expect(TaskType.REGRESSION).toBe('regression');
        expect(TaskType.REINFORCEMENT).toBe('reinforcement');
        expect(TaskType.GENERATION).toBe('generation');
    });
});

describe('Step 34: Reptile', () => {
    test('should create with default options', () => {
        const reptile = new Reptile();
        expect(reptile.options.epsilon).toBeDefined();
        expect(reptile.options.innerSteps).toBeDefined();
    });

    test('should create with custom options', () => {
        const reptile = new Reptile({ epsilon: 0.2 });
        expect(reptile.options.epsilon).toBe(0.2);
    });

    test('should initialize parameters', () => {
        const reptile = new Reptile();
        reptile.initialize([2, 3]);
        expect(reptile.parameters).toBeDefined();
    });

    test('should use factory function', () => {
        const reptile = createReptile({ innerSteps: 3 });
        expect(reptile).toBeInstanceOf(Reptile);
    });
});

describe('Step 34: MetaLearningEngine', () => {
    test('should create with default options', () => {
        const engine = new MetaLearningEngine();
        expect(engine.options.strategy).toBeDefined();
        expect(engine.metrics).toBeDefined();
    });

    test('should create with custom strategy', () => {
        const engine = new MetaLearningEngine({ strategy: MetaStrategy.REPTILE });
        expect(engine.options.strategy).toBe(MetaStrategy.REPTILE);
    });

    test('should use factory function', () => {
        const engine = createMetaEngine({ epochs: 50 });
        expect(engine).toBeInstanceOf(MetaLearningEngine);
    });

    test('should get metrics', () => {
        const engine = new MetaLearningEngine();
        const metrics = engine.getMetrics();
        expect(metrics).toBeDefined();
        expect(metrics.avgAdaptTime).toBeDefined();
    });

    test('should track adaptation speed', () => {
        const engine = new MetaLearningEngine();
        expect(engine.metrics.adaptationSpeed).toBeInstanceOf(Array);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Steps 29-34: Integration Tests', () => {
    test('should integrate look-ahead with decisions', () => {
        const mcts = new MCTS({ simulations: 20 });
        const dm = new DecisionMaker();
        
        dm.addOption('mcts', 'MCTS Search');
        dm.addOption('minimax', 'Minimax Search');
        
        const selected = dm.select();
        expect(selected).toBeDefined();
    });

    test('should integrate genetic algorithm with mutations', () => {
        const ga = new GeneticAlgorithm({ populationSize: 5 });
        ga.initialize(5, () => Math.random());
        
        const mutationEngine = new MutationEngine({ type: MutationType.GAUSSIAN });
        
        for (const genome of ga.population) {
            mutationEngine.mutate(genome);
        }
        
        expect(ga.population.every(g => g.fitness === null)).toBe(true);
    });

    test('should integrate knowledge distillation with meta-learning', () => {
        const distiller = new KnowledgeDistiller();
        const metaEngine = new MetaLearningEngine();
        
        const knowledge = distiller.extractor.extractSoftLabels([1, 2, 3]);
        expect(knowledge.type).toBe(KnowledgeType.SOFT_LABELS);
        
        const metrics = metaEngine.getMetrics();
        expect(metrics.tasksLearned).toBe(0);
    });

    test('should integrate all evolution components', () => {
        // Create genetic algorithm
        const ga = new GeneticAlgorithm({ populationSize: 10 });
        ga.initialize(5, () => Math.random());
        
        // Create mutation engine
        const mutEngine = new MutationEngine({ type: MutationType.GAUSSIAN });
        
        // Evaluate population
        ga.population.forEach((g, i) => g.fitness = g.genes.reduce((a, b) => a + b, 0));
        
        // Get statistics
        const stats = ga.getStatistics();
        expect(stats.generation).toBe(0);
        expect(stats.best).toBeGreaterThan(0);
        
        // Select parents and crossover
        const p1 = SelectionOperator.tournament(ga.population, 3);
        const p2 = SelectionOperator.tournament(ga.population, 3);
        const [c1, c2] = CrossoverOperator.uniform(p1, p2);
        
        // Mutate children
        mutEngine.mutate(c1);
        mutEngine.mutate(c2);
        
        expect(c1.fitness).toBeNull();
        expect(c2.fitness).toBeNull();
    });

    test('should combine decision strategies with UCB exploration', () => {
        const dm = new DecisionMaker({ strategy: DecisionStrategy.UCB });
        
        dm.addOption('explore', 'Exploration');
        dm.addOption('exploit', 'Exploitation');
        
        // Simulate some trials
        const opt1 = dm.options_.get('explore');
        const opt2 = dm.options_.get('exploit');
        
        opt1.record(5);
        opt2.record(10);
        
        dm.totalTrials = 2;
        
        const ucb1 = opt1.getUCB(dm.totalTrials);
        const ucb2 = opt2.getUCB(dm.totalTrials);
        
        expect(ucb2).toBeGreaterThan(ucb1); // Higher reward option
    });

    test('should create complete meta-learning pipeline', () => {
        const taskDist = new TaskDistribution({ nWay: 2, kShot: 2 });
        const maml = new MAML({ innerLR: 0.01 });
        const engine = new MetaLearningEngine({ strategy: MetaStrategy.MAML });
        
        // Generate simple data
        const data = Array(20).fill(0).map((_, i) => i);
        const labels = data.map(d => d < 10 ? 'A' : 'B');
        
        const task = taskDist.createTask(data, labels);
        expect(task.classes.length).toBe(2);
        
        const metrics = engine.getMetrics();
        expect(metrics.tasksLearned).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════════════════════════');
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed (${Math.round(passed/(passed+failed)*100)}%)`);
console.log('═══════════════════════════════════════════════════════════════════════════════');

if (errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    errors.forEach(e => console.log(`   - ${e.name}: ${e.error}`));
}

process.exit(failed > 0 ? 1 : 0);
