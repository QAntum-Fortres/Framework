/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  PHASE 2 UNIT TESTS - VISUAL REGRESSION & HIVE MIND                           ║
 * ║  Testing: Steps 24-25 of 50                                                   ║
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
console.log('🧪 PHASE 2 VISUAL REGRESSION & HIVE MIND - UNIT TESTS');
console.log('═══════════════════════════════════════════════════════════════════════════════');

// Step 24: Visual Regression
const {
    ImageComparator,
    BaselineManager,
    VisualRegressionEngine,
    ScreenshotCapture,
    ComparisonMode,
    DiffResult,
    createVisualEngine,
    createComparator,
    getVisualEngine
} = require('../../visual/visual-regression.js');

// Step 25: Hive Mind
const {
    SwarmAgent,
    SwarmTask,
    HiveMind,
    AgentRole,
    AgentState,
    TaskPriority,
    createHiveMind,
    createAgent,
    createTask,
    getHiveMind
} = require('../../swarm/hive-mind.js');

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 24: VISUAL REGRESSION ENGINE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 24: ComparisonMode', () => {
    test('ComparisonMode should be defined', () => {
        expect(ComparisonMode).toBeDefined();
    });

    test('ComparisonMode should have PIXEL_BY_PIXEL', () => {
        expect(ComparisonMode.PIXEL_BY_PIXEL).toBe('pixel');
    });

    test('ComparisonMode should have STRUCTURAL', () => {
        expect(ComparisonMode.STRUCTURAL).toBe('structural');
    });

    test('ComparisonMode should have PERCEPTUAL', () => {
        expect(ComparisonMode.PERCEPTUAL).toBe('perceptual');
    });

    test('ComparisonMode should have ANTI_ALIASING', () => {
        expect(ComparisonMode.ANTI_ALIASING).toBe('anti_aliasing');
    });
});

describe('Step 24: DiffResult', () => {
    test('DiffResult should be defined', () => {
        expect(DiffResult).toBeDefined();
    });

    test('DiffResult should have IDENTICAL', () => {
        expect(DiffResult.IDENTICAL).toBe('identical');
    });

    test('DiffResult should have SIMILAR', () => {
        expect(DiffResult.SIMILAR).toBe('similar');
    });

    test('DiffResult should have DIFFERENT', () => {
        expect(DiffResult.DIFFERENT).toBe('different');
    });

    test('DiffResult should have ERROR', () => {
        expect(DiffResult.ERROR).toBe('error');
    });
});

describe('Step 24: ImageComparator', () => {
    test('ImageComparator should be a class', () => {
        expect(typeof ImageComparator).toBe('function');
    });

    test('ImageComparator should be constructable', () => {
        const comparator = new ImageComparator();
        expect(comparator).toBeInstanceOf(ImageComparator);
    });

    test('ImageComparator should accept options', () => {
        const comparator = new ImageComparator({ threshold: 0.2 });
        expect(comparator.options.threshold).toBe(0.2);
    });

    test('ImageComparator should have compare method', () => {
        const comparator = new ImageComparator();
        expect(typeof comparator.compare).toBe('function');
    });

    test('ImageComparator should have default threshold', () => {
        const comparator = new ImageComparator();
        expect(comparator.options.threshold).toBe(0.1);
    });

    test('ImageComparator should have antiAliasing option', () => {
        const comparator = new ImageComparator();
        expect(comparator.options.antiAliasing).toBe(true);
    });

    test('ImageComparator should have diffColor option', () => {
        const comparator = new ImageComparator();
        expect(comparator.options.diffColor).toHaveProperty('r');
    });

    test('ImageComparator should be EventEmitter', () => {
        const comparator = new ImageComparator();
        expect(typeof comparator.emit).toBe('function');
    });
});

describe('Step 24: BaselineManager', () => {
    test('BaselineManager should be a class', () => {
        expect(typeof BaselineManager).toBe('function');
    });

    test('BaselineManager should be constructable', () => {
        const manager = new BaselineManager();
        expect(manager).toBeInstanceOf(BaselineManager);
    });

    test('BaselineManager should accept options', () => {
        const manager = new BaselineManager({ baselineDir: './test-baselines' });
        expect(manager.options.baselineDir).toBe('./test-baselines');
    });

    test('BaselineManager should have generateName method', () => {
        const manager = new BaselineManager();
        expect(typeof manager.generateName).toBe('function');
    });

    test('BaselineManager generateName should sanitize test name', () => {
        const manager = new BaselineManager();
        const name = manager.generateName('Test Name With Spaces');
        expect(name).toContain('test_name_with_spaces');
    });

    test('BaselineManager should have getBaselinePath method', () => {
        const manager = new BaselineManager();
        expect(typeof manager.getBaselinePath).toBe('function');
    });

    test('BaselineManager should have getCurrentPath method', () => {
        const manager = new BaselineManager();
        expect(typeof manager.getCurrentPath).toBe('function');
    });

    test('BaselineManager should have getDiffPath method', () => {
        const manager = new BaselineManager();
        expect(typeof manager.getDiffPath).toBe('function');
    });

    test('BaselineManager should have hasBaseline method', () => {
        const manager = new BaselineManager();
        expect(typeof manager.hasBaseline).toBe('function');
    });

    test('BaselineManager should have listBaselines method', () => {
        const manager = new BaselineManager();
        expect(typeof manager.listBaselines).toBe('function');
    });

    test('BaselineManager should be EventEmitter', () => {
        const manager = new BaselineManager();
        expect(typeof manager.emit).toBe('function');
    });
});

describe('Step 24: VisualRegressionEngine', () => {
    test('VisualRegressionEngine should be a class', () => {
        expect(typeof VisualRegressionEngine).toBe('function');
    });

    test('VisualRegressionEngine should be constructable', () => {
        const engine = new VisualRegressionEngine();
        expect(engine).toBeInstanceOf(VisualRegressionEngine);
    });

    test('VisualRegressionEngine should have comparator', () => {
        const engine = new VisualRegressionEngine();
        expect(engine.comparator).toBeInstanceOf(ImageComparator);
    });

    test('VisualRegressionEngine should have baselineManager', () => {
        const engine = new VisualRegressionEngine();
        expect(engine.baselineManager).toBeInstanceOf(BaselineManager);
    });

    test('VisualRegressionEngine should have check method', () => {
        const engine = new VisualRegressionEngine();
        expect(typeof engine.check).toBe('function');
    });

    test('VisualRegressionEngine should have getResults method', () => {
        const engine = new VisualRegressionEngine();
        expect(typeof engine.getResults).toBe('function');
    });

    test('VisualRegressionEngine should have getStats method', () => {
        const engine = new VisualRegressionEngine();
        expect(typeof engine.getStats).toBe('function');
    });

    test('VisualRegressionEngine getStats should return stats object', () => {
        const engine = new VisualRegressionEngine();
        const stats = engine.getStats();
        expect(stats).toHaveProperty('total');
    });

    test('VisualRegressionEngine should be EventEmitter', () => {
        const engine = new VisualRegressionEngine();
        expect(typeof engine.emit).toBe('function');
    });
});

describe('Step 24: ScreenshotCapture', () => {
    test('ScreenshotCapture should be a class', () => {
        expect(typeof ScreenshotCapture).toBe('function');
    });

    test('ScreenshotCapture should be constructable', () => {
        const capture = new ScreenshotCapture({ screenshot: () => null });
        expect(capture).toBeInstanceOf(ScreenshotCapture);
    });

    test('ScreenshotCapture should have captureFullPage method', () => {
        const capture = new ScreenshotCapture({ screenshot: () => null });
        expect(typeof capture.captureFullPage).toBe('function');
    });

    test('ScreenshotCapture should have captureElement method', () => {
        const capture = new ScreenshotCapture({ screenshot: () => null });
        expect(typeof capture.captureElement).toBe('function');
    });

    test('ScreenshotCapture should have capture method', () => {
        const capture = new ScreenshotCapture({ screenshot: () => null });
        expect(typeof capture.capture).toBe('function');
    });
});

describe('Step 24: Visual Factory Functions', () => {
    test('createVisualEngine should create VisualRegressionEngine', () => {
        const engine = createVisualEngine();
        expect(engine).toBeInstanceOf(VisualRegressionEngine);
    });

    test('createComparator should create ImageComparator', () => {
        const comparator = createComparator();
        expect(comparator).toBeInstanceOf(ImageComparator);
    });

    test('getVisualEngine should return singleton', () => {
        const engine1 = getVisualEngine();
        const engine2 = getVisualEngine();
        expect(engine1).toBe(engine2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 25: HIVE MIND TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 25: AgentRole', () => {
    test('AgentRole should be defined', () => {
        expect(AgentRole).toBeDefined();
    });

    test('AgentRole should have COORDINATOR', () => {
        expect(AgentRole.COORDINATOR).toBe('coordinator');
    });

    test('AgentRole should have WORKER', () => {
        expect(AgentRole.WORKER).toBe('worker');
    });

    test('AgentRole should have SCOUT', () => {
        expect(AgentRole.SCOUT).toBe('scout');
    });

    test('AgentRole should have SPECIALIST', () => {
        expect(AgentRole.SPECIALIST).toBe('specialist');
    });

    test('AgentRole should have OBSERVER', () => {
        expect(AgentRole.OBSERVER).toBe('observer');
    });
});

describe('Step 25: AgentState', () => {
    test('AgentState should be defined', () => {
        expect(AgentState).toBeDefined();
    });

    test('AgentState should have IDLE', () => {
        expect(AgentState.IDLE).toBe('idle');
    });

    test('AgentState should have WORKING', () => {
        expect(AgentState.WORKING).toBe('working');
    });

    test('AgentState should have WAITING', () => {
        expect(AgentState.WAITING).toBe('waiting');
    });

    test('AgentState should have COMPLETED', () => {
        expect(AgentState.COMPLETED).toBe('completed');
    });

    test('AgentState should have FAILED', () => {
        expect(AgentState.FAILED).toBe('failed');
    });

    test('AgentState should have TERMINATED', () => {
        expect(AgentState.TERMINATED).toBe('terminated');
    });
});

describe('Step 25: TaskPriority', () => {
    test('TaskPriority should be defined', () => {
        expect(TaskPriority).toBeDefined();
    });

    test('TaskPriority should have CRITICAL', () => {
        expect(TaskPriority.CRITICAL).toBe(1);
    });

    test('TaskPriority should have HIGH', () => {
        expect(TaskPriority.HIGH).toBe(2);
    });

    test('TaskPriority should have NORMAL', () => {
        expect(TaskPriority.NORMAL).toBe(3);
    });

    test('TaskPriority should have LOW', () => {
        expect(TaskPriority.LOW).toBe(4);
    });

    test('TaskPriority should have BACKGROUND', () => {
        expect(TaskPriority.BACKGROUND).toBe(5);
    });
});

describe('Step 25: SwarmAgent', () => {
    test('SwarmAgent should be a class', () => {
        expect(typeof SwarmAgent).toBe('function');
    });

    test('SwarmAgent should be constructable', () => {
        const agent = new SwarmAgent({ name: 'test-agent' });
        expect(agent).toBeInstanceOf(SwarmAgent);
    });

    test('SwarmAgent should have id', () => {
        const agent = new SwarmAgent({ id: 'agent-1' });
        expect(agent.id).toBe('agent-1');
    });

    test('SwarmAgent should have name', () => {
        const agent = new SwarmAgent({ name: 'TestAgent' });
        expect(agent.name).toBe('TestAgent');
    });

    test('SwarmAgent should have role', () => {
        const agent = new SwarmAgent({ role: AgentRole.COORDINATOR });
        expect(agent.role).toBe(AgentRole.COORDINATOR);
    });

    test('SwarmAgent should default to WORKER role', () => {
        const agent = new SwarmAgent({});
        expect(agent.role).toBe(AgentRole.WORKER);
    });

    test('SwarmAgent should have state', () => {
        const agent = new SwarmAgent({});
        expect(agent.state).toBe(AgentState.IDLE);
    });

    test('SwarmAgent should have capabilities array', () => {
        const agent = new SwarmAgent({ capabilities: ['test', 'code'] });
        expect(agent.capabilities).toContain('test');
    });

    test('SwarmAgent should have assignTask method', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.assignTask).toBe('function');
    });

    test('SwarmAgent assignTask should change state to WORKING', () => {
        const agent = new SwarmAgent({});
        const task = new SwarmTask({ name: 'test-task' });
        agent.assignTask(task);
        expect(agent.state).toBe(AgentState.WORKING);
    });

    test('SwarmAgent should have completeTask method', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.completeTask).toBe('function');
    });

    test('SwarmAgent should have failTask method', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.failTask).toBe('function');
    });

    test('SwarmAgent should have hasCapability method', () => {
        const agent = new SwarmAgent({ capabilities: ['testing'] });
        expect(agent.hasCapability('testing')).toBe(true);
    });

    test('SwarmAgent hasCapability should return false for missing', () => {
        const agent = new SwarmAgent({ capabilities: ['testing'] });
        expect(agent.hasCapability('coding')).toBe(false);
    });

    test('SwarmAgent should have remember method', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.remember).toBe('function');
    });

    test('SwarmAgent should have recall method', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.recall).toBe('function');
    });

    test('SwarmAgent remember and recall should work', () => {
        const agent = new SwarmAgent({});
        agent.remember('key', 'value');
        expect(agent.recall('key')).toBe('value');
    });

    test('SwarmAgent should have connect method', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.connect).toBe('function');
    });

    test('SwarmAgent should have getStatus method', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.getStatus).toBe('function');
    });

    test('SwarmAgent getStatus should return status object', () => {
        const agent = new SwarmAgent({ name: 'test' });
        const status = agent.getStatus();
        expect(status).toHaveProperty('id');
        expect(status).toHaveProperty('name');
        expect(status).toHaveProperty('state');
    });

    test('SwarmAgent should have terminate method', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.terminate).toBe('function');
    });

    test('SwarmAgent terminate should set TERMINATED state', () => {
        const agent = new SwarmAgent({});
        agent.terminate();
        expect(agent.state).toBe(AgentState.TERMINATED);
    });

    test('SwarmAgent should have metrics', () => {
        const agent = new SwarmAgent({});
        expect(agent.metrics).toHaveProperty('tasksCompleted');
    });

    test('SwarmAgent should be EventEmitter', () => {
        const agent = new SwarmAgent({});
        expect(typeof agent.emit).toBe('function');
    });
});

describe('Step 25: SwarmTask', () => {
    test('SwarmTask should be a class', () => {
        expect(typeof SwarmTask).toBe('function');
    });

    test('SwarmTask should be constructable', () => {
        const task = new SwarmTask({ name: 'test-task' });
        expect(task).toBeInstanceOf(SwarmTask);
    });

    test('SwarmTask should have id', () => {
        const task = new SwarmTask({ id: 'task-1' });
        expect(task.id).toBe('task-1');
    });

    test('SwarmTask should have name', () => {
        const task = new SwarmTask({ name: 'TestTask' });
        expect(task.name).toBe('TestTask');
    });

    test('SwarmTask should have type', () => {
        const task = new SwarmTask({ type: 'test' });
        expect(task.type).toBe('test');
    });

    test('SwarmTask should have priority', () => {
        const task = new SwarmTask({ priority: TaskPriority.HIGH });
        expect(task.priority).toBe(TaskPriority.HIGH);
    });

    test('SwarmTask should default to NORMAL priority', () => {
        const task = new SwarmTask({});
        expect(task.priority).toBe(TaskPriority.NORMAL);
    });

    test('SwarmTask should have requiredCapabilities', () => {
        const task = new SwarmTask({ requiredCapabilities: ['test'] });
        expect(task.requiredCapabilities).toContain('test');
    });

    test('SwarmTask should have payload', () => {
        const task = new SwarmTask({ payload: { data: 'test' } });
        expect(task.payload.data).toBe('test');
    });

    test('SwarmTask should have status', () => {
        const task = new SwarmTask({});
        expect(task.status).toBe('pending');
    });

    test('SwarmTask should have canExecute method', () => {
        const task = new SwarmTask({});
        expect(typeof task.canExecute).toBe('function');
    });

    test('SwarmTask canExecute should check dependencies', () => {
        const task = new SwarmTask({ dependencies: ['dep-1'] });
        const completed = new Set(['dep-1']);
        expect(task.canExecute(completed)).toBe(true);
    });

    test('SwarmTask should have getWeight method', () => {
        const task = new SwarmTask({});
        expect(typeof task.getWeight).toBe('function');
    });

    test('SwarmTask should have maxRetries', () => {
        const task = new SwarmTask({ maxRetries: 5 });
        expect(task.maxRetries).toBe(5);
    });

    test('SwarmTask should have createdAt timestamp', () => {
        const task = new SwarmTask({});
        expect(task.createdAt).toBeGreaterThan(0);
    });

    test('SwarmTask should have dependencies array', () => {
        const task = new SwarmTask({ dependencies: ['task-1', 'task-2'] });
        expect(task.dependencies).toHaveLength(2);
    });
});

describe('Step 25: HiveMind', () => {
    test('HiveMind should be a class', () => {
        expect(typeof HiveMind).toBe('function');
    });

    test('HiveMind should be constructable', () => {
        const hive = new HiveMind();
        expect(hive).toBeInstanceOf(HiveMind);
    });

    test('HiveMind should accept options', () => {
        const hive = new HiveMind({ maxAgents: 20 });
        expect(hive.options.maxAgents).toBe(20);
    });

    test('HiveMind should have registerAgent method', () => {
        const hive = new HiveMind();
        expect(typeof hive.registerAgent).toBe('function');
    });

    test('HiveMind registerAgent should add agent', () => {
        const hive = new HiveMind();
        const agent = new SwarmAgent({ id: 'agent-1' });
        hive.registerAgent(agent);
        expect(hive.agents.has('agent-1')).toBe(true);
    });

    test('HiveMind should have createAgent method', () => {
        const hive = new HiveMind();
        expect(typeof hive.createAgent).toBe('function');
    });

    test('HiveMind createAgent should return agent', () => {
        const hive = new HiveMind();
        const agent = hive.createAgent({ name: 'test' });
        expect(agent).toBeInstanceOf(SwarmAgent);
    });

    test('HiveMind should have submitTask method', () => {
        const hive = new HiveMind();
        expect(typeof hive.submitTask).toBe('function');
    });

    test('HiveMind submitTask should add to queue', () => {
        const hive = new HiveMind();
        const task = new SwarmTask({ name: 'test' });
        hive.submitTask(task);
        expect(hive.taskQueue.length).toBe(1);
    });

    test('HiveMind should have broadcast method', () => {
        const hive = new HiveMind();
        expect(typeof hive.broadcast).toBe('function');
    });

    test('HiveMind should have getStatus method', () => {
        const hive = new HiveMind();
        expect(typeof hive.getStatus).toBe('function');
    });

    test('HiveMind getStatus should return status object', () => {
        const hive = new HiveMind();
        const status = hive.getStatus();
        expect(status).toHaveProperty('agents');
        expect(status).toHaveProperty('queueSize');
        expect(status).toHaveProperty('stats');
    });

    test('HiveMind should have terminate method', () => {
        const hive = new HiveMind();
        expect(typeof hive.terminate).toBe('function');
    });

    test('HiveMind should have sharedMemory', () => {
        const hive = new HiveMind();
        expect(hive.sharedMemory).toBeInstanceOf(Map);
    });

    test('HiveMind should have stats', () => {
        const hive = new HiveMind();
        expect(hive.stats).toHaveProperty('totalTasks');
    });

    test('HiveMind should be EventEmitter', () => {
        const hive = new HiveMind();
        expect(typeof hive.emit).toBe('function');
    });
});

describe('Step 25: Hive Mind Factory Functions', () => {
    test('createHiveMind should create HiveMind', () => {
        const hive = createHiveMind();
        expect(hive).toBeInstanceOf(HiveMind);
    });

    test('createAgent should create SwarmAgent', () => {
        const agent = createAgent({ name: 'test' });
        expect(agent).toBeInstanceOf(SwarmAgent);
    });

    test('createTask should create SwarmTask', () => {
        const task = createTask({ name: 'test' });
        expect(task).toBeInstanceOf(SwarmTask);
    });

    test('getHiveMind should return singleton', () => {
        const hive1 = getHiveMind();
        const hive2 = getHiveMind();
        expect(hive1).toBe(hive2);
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 25: Agent-Task Integration', () => {
    test('Agent should complete task and update metrics', () => {
        const agent = new SwarmAgent({});
        const task = new SwarmTask({ name: 'test' });
        
        agent.assignTask(task);
        agent.completeTask({ success: true });
        
        expect(agent.metrics.tasksCompleted).toBe(1);
        expect(agent.state).toBe(AgentState.IDLE);
    });

    test('Agent should fail task and update metrics', () => {
        const agent = new SwarmAgent({});
        const task = new SwarmTask({ name: 'test' });
        
        agent.assignTask(task);
        agent.failTask(new Error('Test error'));
        
        expect(agent.metrics.tasksFailed).toBe(1);
        expect(agent.state).toBe(AgentState.IDLE);
    });

    test('Agent should track task history', () => {
        const agent = new SwarmAgent({});
        const task1 = new SwarmTask({ name: 'task1' });
        const task2 = new SwarmTask({ name: 'task2' });
        
        agent.assignTask(task1);
        agent.completeTask({ result: 1 });
        
        agent.assignTask(task2);
        agent.completeTask({ result: 2 });
        
        expect(agent.taskHistory).toHaveLength(2);
    });
});

describe('Step 25: HiveMind-Agent Integration', () => {
    test('HiveMind should manage multiple agents', () => {
        const hive = new HiveMind();
        
        hive.registerAgent(new SwarmAgent({ id: 'a1' }));
        hive.registerAgent(new SwarmAgent({ id: 'a2' }));
        hive.registerAgent(new SwarmAgent({ id: 'a3' }));
        
        expect(hive.agents.size).toBe(3);
    });

    test('HiveMind createAgent should register agent', () => {
        const hive = new HiveMind();
        const agent = hive.createAgent({ id: 'a1' });
        
        expect(hive.agents.has('a1')).toBe(true);
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
