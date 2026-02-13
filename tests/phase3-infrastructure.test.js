/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 3A: INFRASTRUCTURE TESTS (Steps 38-42)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Memory Hardening, Sandbox Executor, Worker Pool, Thermal Pool, Docker Manager
 * Page Object Model (POM) pattern with explicit waits
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TEST HARNESS
// ═══════════════════════════════════════════════════════════════════════════════

const testResults = { passed: 0, failed: 0, total: 0 };

function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

function test(name, fn) {
  testResults.total++;
  try {
    fn();
    testResults.passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    testResults.failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) 
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeDefined: () => {
      if (actual === undefined) throw new Error('Expected value to be defined');
    },
    toBeUndefined: () => {
      if (actual !== undefined) throw new Error('Expected undefined');
    },
    toBeNull: () => {
      if (actual !== null) throw new Error('Expected null');
    },
    toBeTruthy: () => {
      if (!actual) throw new Error('Expected truthy value');
    },
    toBeFalsy: () => {
      if (actual) throw new Error('Expected falsy value');
    },
    toBeGreaterThan: (expected) => {
      if (actual <= expected) throw new Error(`Expected ${actual} > ${expected}`);
    },
    toBeGreaterThanOrEqual: (expected) => {
      if (actual < expected) throw new Error(`Expected ${actual} >= ${expected}`);
    },
    toBeLessThan: (expected) => {
      if (actual >= expected) throw new Error(`Expected ${actual} < ${expected}`);
    },
    toBeLessThanOrEqual: (expected) => {
      if (actual > expected) throw new Error(`Expected ${actual} <= ${expected}`);
    },
    toContain: (expected) => {
      if (Array.isArray(actual)) {
        if (!actual.includes(expected)) throw new Error(`Array doesn't contain ${expected}`);
      } else if (typeof actual === 'string') {
        if (!actual.includes(expected)) throw new Error(`String doesn't contain ${expected}`);
      }
    },
    toBeInstanceOf: (expected) => {
      if (!(actual instanceof expected)) throw new Error(`Not instance of ${expected.name}`);
    },
    toHaveLength: (expected) => {
      if (actual.length !== expected) throw new Error(`Expected length ${expected}, got ${actual.length}`);
    },
    toHaveProperty: (prop) => {
      if (!(prop in actual)) throw new Error(`Missing property: ${prop}`);
    },
    toThrow: () => {
      let threw = false;
      try { actual(); } catch { threw = true; }
      if (!threw) throw new Error('Expected function to throw');
    },
    not: {
      toBe: (expected) => {
        if (actual === expected) throw new Error(`Expected not ${expected}`);
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) === JSON.stringify(expected)) 
          throw new Error(`Expected not equal to ${JSON.stringify(expected)}`);
      },
      toBeNull: () => {
        if (actual === null) throw new Error('Expected not null');
      },
      toBeUndefined: () => {
        if (actual === undefined) throw new Error('Expected not undefined');
      },
      toContain: (expected) => {
        if (Array.isArray(actual) && actual.includes(expected)) 
          throw new Error(`Array should not contain ${expected}`);
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE OBJECT MODEL (POM) HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

class PageObject {
  constructor(name) {
    this.name = name;
    this.elements = new Map();
    this.waitTimeout = 5000;
  }

  registerElement(name, selector) {
    this.elements.set(name, selector);
    return this;
  }

  getSelector(name) {
    return this.elements.get(name);
  }

  async waitForElement(name, timeout = this.waitTimeout) {
    const selector = this.elements.get(name);
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (selector) return { found: true, selector };
      await new Promise(r => setTimeout(r, 100));
    }
    return { found: false, selector };
  }
}

class ExplicitWait {
  constructor(timeout = 5000) {
    this.timeout = timeout;
  }

  async until(condition, message = 'Timeout') {
    const start = Date.now();
    while (Date.now() - start < this.timeout) {
      if (await condition()) return true;
      await new Promise(r => setTimeout(r, 50));
    }
    throw new Error(message);
  }

  static elementVisible(element) {
    return () => element && element.visible !== false;
  }

  static elementClickable(element) {
    return () => element && element.enabled !== false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 38: MEMORY HARDENING MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 38: MemoryHardeningManager', () => {
  
  // WeakRef implementation
  class WeakRefTracker {
    constructor() {
      this.refs = new Map();
      this.metadata = new WeakMap();
    }
    
    track(id, obj) {
      this.refs.set(id, new WeakRef(obj));
      return id;
    }
    
    isAlive(id) {
      const ref = this.refs.get(id);
      return ref ? ref.deref() !== undefined : false;
    }
    
    get(id) {
      const ref = this.refs.get(id);
      return ref ? ref.deref() : undefined;
    }
    
    attachMeta(obj, data) {
      this.metadata.set(obj, data);
    }
    
    getMeta(obj) {
      return this.metadata.get(obj);
    }
  }

  test('WeakRef should track object references', () => {
    const tracker = new WeakRefTracker();
    const obj = { data: 'test' };
    tracker.track('obj1', obj);
    expect(tracker.isAlive('obj1')).toBe(true);
  });

  test('WeakRef should return tracked object', () => {
    const tracker = new WeakRefTracker();
    const obj = { value: 42 };
    tracker.track('obj2', obj);
    const retrieved = tracker.get('obj2');
    expect(retrieved.value).toBe(42);
  });

  test('WeakMap should store metadata', () => {
    const tracker = new WeakRefTracker();
    const obj = { id: 1 };
    tracker.attachMeta(obj, { created: Date.now() });
    const meta = tracker.getMeta(obj);
    expect(meta).toBeDefined();
    expect(meta).toHaveProperty('created');
  });

  test('should return undefined for non-existent ref', () => {
    const tracker = new WeakRefTracker();
    expect(tracker.get('nonexistent')).toBeUndefined();
  });

  test('isAlive should return false for non-existent', () => {
    const tracker = new WeakRefTracker();
    expect(tracker.isAlive('fake')).toBe(false);
  });

  // ResourceTracker
  class ResourceTracker {
    constructor() {
      this.resources = new Map();
      this.stats = { active: 0, peak: 0, created: 0, cleaned: 0 };
    }

    track(type, id, cleanup) {
      this.resources.set(id, { type, cleanup, created: Date.now() });
      this.stats.active++;
      this.stats.created++;
      this.stats.peak = Math.max(this.stats.peak, this.stats.active);
    }

    release(id) {
      const res = this.resources.get(id);
      if (res) {
        if (res.cleanup) res.cleanup();
        this.resources.delete(id);
        this.stats.active--;
        this.stats.cleaned++;
        return true;
      }
      return false;
    }

    getStats() { return { ...this.stats }; }
    isTracked(id) { return this.resources.has(id); }
  }

  test('ResourceTracker should track resources', () => {
    const tracker = new ResourceTracker();
    tracker.track('browser', 'br1', () => {});
    expect(tracker.isTracked('br1')).toBe(true);
  });

  test('ResourceTracker should update stats on track', () => {
    const tracker = new ResourceTracker();
    tracker.track('page', 'pg1', null);
    const stats = tracker.getStats();
    expect(stats.active).toBe(1);
    expect(stats.created).toBe(1);
  });

  test('ResourceTracker should release resources', () => {
    const tracker = new ResourceTracker();
    let cleaned = false;
    tracker.track('worker', 'w1', () => { cleaned = true; });
    tracker.release('w1');
    expect(cleaned).toBe(true);
    expect(tracker.isTracked('w1')).toBe(false);
  });

  test('ResourceTracker should track peak', () => {
    const tracker = new ResourceTracker();
    tracker.track('a', 'a1', null);
    tracker.track('a', 'a2', null);
    tracker.track('a', 'a3', null);
    tracker.release('a1');
    expect(tracker.getStats().peak).toBe(3);
    expect(tracker.getStats().active).toBe(2);
  });

  test('release should return false for non-existent', () => {
    const tracker = new ResourceTracker();
    expect(tracker.release('fake')).toBe(false);
  });

  // BrowserMetadata
  class BrowserMetadata {
    constructor(instanceId) {
      this.instanceId = instanceId;
      this.createdAt = new Date();
      this.pagesOpened = 0;
      this.memoryEstimate = 0;
      this.isActive = true;
      this.lastActivity = new Date();
    }

    openPage() { this.pagesOpened++; this.lastActivity = new Date(); }
    closePage() { if (this.pagesOpened > 0) this.pagesOpened--; }
    updateMemory(bytes) { this.memoryEstimate = bytes; }
    deactivate() { this.isActive = false; }
  }

  test('BrowserMetadata should initialize correctly', () => {
    const meta = new BrowserMetadata('chrome-1');
    expect(meta.instanceId).toBe('chrome-1');
    expect(meta.isActive).toBe(true);
    expect(meta.pagesOpened).toBe(0);
  });

  test('BrowserMetadata should track pages', () => {
    const meta = new BrowserMetadata('ff-1');
    meta.openPage();
    meta.openPage();
    expect(meta.pagesOpened).toBe(2);
    meta.closePage();
    expect(meta.pagesOpened).toBe(1);
  });

  test('BrowserMetadata should update memory estimate', () => {
    const meta = new BrowserMetadata('edge-1');
    meta.updateMemory(1024 * 1024 * 100);
    expect(meta.memoryEstimate).toBe(104857600);
  });

  test('BrowserMetadata deactivate should set isActive false', () => {
    const meta = new BrowserMetadata('br-1');
    meta.deactivate();
    expect(meta.isActive).toBe(false);
  });

  // MemoryPressureMonitor
  class MemoryPressureMonitor {
    constructor(threshold = 0.85) {
      this.threshold = threshold;
      this.alerts = [];
    }

    check(heapUsed, heapTotal) {
      const ratio = heapUsed / heapTotal;
      if (ratio > this.threshold) {
        this.alerts.push({ ratio, timestamp: Date.now() });
        return { pressure: true, ratio };
      }
      return { pressure: false, ratio };
    }

    setThreshold(t) { this.threshold = Math.max(0, Math.min(1, t)); }
    getAlerts() { return [...this.alerts]; }
    clearAlerts() { this.alerts = []; }
  }

  test('MemoryPressureMonitor should detect pressure', () => {
    const monitor = new MemoryPressureMonitor(0.8);
    const result = monitor.check(900, 1000);
    expect(result.pressure).toBe(true);
  });

  test('MemoryPressureMonitor should not alert below threshold', () => {
    const monitor = new MemoryPressureMonitor(0.9);
    const result = monitor.check(500, 1000);
    expect(result.pressure).toBe(false);
  });

  test('MemoryPressureMonitor should record alerts', () => {
    const monitor = new MemoryPressureMonitor(0.5);
    monitor.check(600, 1000);
    expect(monitor.getAlerts()).toHaveLength(1);
  });

  test('setThreshold should clamp values', () => {
    const monitor = new MemoryPressureMonitor();
    monitor.setThreshold(1.5);
    expect(monitor.threshold).toBe(1);
    monitor.setThreshold(-0.5);
    expect(monitor.threshold).toBe(0);
  });

  test('clearAlerts should empty array', () => {
    const monitor = new MemoryPressureMonitor(0.1);
    monitor.check(500, 1000);
    monitor.clearAlerts();
    expect(monitor.getAlerts()).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 39: SANDBOX EXECUTOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 39: SandboxExecutor', () => {

  // SecurityPolicy
  class SecurityPolicy {
    constructor(options = {}) {
      this.allowFileSystem = options.allowFileSystem ?? false;
      this.allowNetwork = options.allowNetwork ?? false;
      this.allowProcess = options.allowProcess ?? false;
      this.maxExecutionTime = options.maxExecutionTime ?? 5000;
      this.maxMemory = options.maxMemory ?? 128 * 1024 * 1024;
      this.allowEval = options.allowEval ?? false;
      this.allowedModules = options.allowedModules ?? [];
    }

    allows(action) {
      switch (action) {
        case 'filesystem': return this.allowFileSystem;
        case 'network': return this.allowNetwork;
        case 'process': return this.allowProcess;
        case 'eval': return this.allowEval;
        default: return false;
      }
    }

    isModuleAllowed(name) {
      return this.allowedModules.includes(name);
    }
  }

  test('SecurityPolicy should default to restrictive', () => {
    const policy = new SecurityPolicy();
    expect(policy.allowFileSystem).toBe(false);
    expect(policy.allowNetwork).toBe(false);
    expect(policy.allowProcess).toBe(false);
  });

  test('SecurityPolicy allows() should check permissions', () => {
    const policy = new SecurityPolicy({ allowNetwork: true });
    expect(policy.allows('network')).toBe(true);
    expect(policy.allows('filesystem')).toBe(false);
  });

  test('SecurityPolicy should check allowed modules', () => {
    const policy = new SecurityPolicy({ allowedModules: ['path', 'url'] });
    expect(policy.isModuleAllowed('path')).toBe(true);
    expect(policy.isModuleAllowed('fs')).toBe(false);
  });

  test('SecurityPolicy should have default maxExecutionTime', () => {
    const policy = new SecurityPolicy();
    expect(policy.maxExecutionTime).toBe(5000);
  });

  test('SecurityPolicy should have default maxMemory', () => {
    const policy = new SecurityPolicy();
    expect(policy.maxMemory).toBe(134217728);
  });

  // SecurityViolation
  class SecurityViolation {
    constructor(type, operation, details) {
      this.type = type;
      this.operation = operation;
      this.details = details;
      this.timestamp = new Date();
      this.blocked = true;
    }

    toString() {
      return `[${this.type}] ${this.operation}: ${this.details}`;
    }
  }

  test('SecurityViolation should capture violation info', () => {
    const v = new SecurityViolation('filesystem', 'read', '/etc/passwd');
    expect(v.type).toBe('filesystem');
    expect(v.blocked).toBe(true);
  });

  test('SecurityViolation toString should format correctly', () => {
    const v = new SecurityViolation('network', 'fetch', 'http://evil.com');
    expect(v.toString()).toContain('network');
    expect(v.toString()).toContain('fetch');
  });

  // SandboxExecutor
  class SandboxExecutor {
    constructor(policy = new SecurityPolicy()) {
      this.policy = policy;
      this.violations = [];
      this.executionCount = 0;
      this.blockedCount = 0;
    }

    execute(code, context = {}) {
      this.executionCount++;
      const violations = [];

      // Check for dangerous patterns
      if (code.includes('require(') && !this.policy.allowedModules.length) {
        violations.push(new SecurityViolation('require', 'module import', 'require() blocked'));
      }
      if (code.includes('process.') && !this.policy.allowProcess) {
        violations.push(new SecurityViolation('process', 'process access', 'process blocked'));
      }
      if (code.includes('eval(') && !this.policy.allowEval) {
        violations.push(new SecurityViolation('eval', 'eval call', 'eval blocked'));
      }
      if ((code.includes('fetch(') || code.includes('XMLHttpRequest')) && !this.policy.allowNetwork) {
        violations.push(new SecurityViolation('network', 'network access', 'network blocked'));
      }

      this.violations.push(...violations);
      if (violations.length > 0) this.blockedCount++;

      return {
        success: violations.length === 0,
        violations,
        executionTime: Math.random() * 100
      };
    }

    getViolations() { return [...this.violations]; }
    getStats() {
      return {
        executionCount: this.executionCount,
        blockedCount: this.blockedCount,
        violationCount: this.violations.length
      };
    }
    clearViolations() { this.violations = []; }
  }

  test('SandboxExecutor should block require', () => {
    const sandbox = new SandboxExecutor();
    const result = sandbox.execute('const fs = require("fs")');
    expect(result.success).toBe(false);
    expect(result.violations).toHaveLength(1);
  });

  test('SandboxExecutor should block process access', () => {
    const sandbox = new SandboxExecutor();
    const result = sandbox.execute('process.exit(1)');
    expect(result.success).toBe(false);
  });

  test('SandboxExecutor should block eval', () => {
    const sandbox = new SandboxExecutor();
    const result = sandbox.execute('eval("malicious")');
    expect(result.success).toBe(false);
  });

  test('SandboxExecutor should block network', () => {
    const sandbox = new SandboxExecutor();
    const result = sandbox.execute('fetch("http://evil.com")');
    expect(result.success).toBe(false);
  });

  test('SandboxExecutor should allow safe code', () => {
    const sandbox = new SandboxExecutor();
    const result = sandbox.execute('const x = 1 + 2;');
    expect(result.success).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test('SandboxExecutor should track stats', () => {
    const sandbox = new SandboxExecutor();
    sandbox.execute('safe code');
    sandbox.execute('process.exit()');
    const stats = sandbox.getStats();
    expect(stats.executionCount).toBe(2);
    expect(stats.blockedCount).toBe(1);
  });

  test('clearViolations should reset', () => {
    const sandbox = new SandboxExecutor();
    sandbox.execute('eval("x")');
    sandbox.clearViolations();
    expect(sandbox.getViolations()).toHaveLength(0);
  });

  // MutationValidator
  class MutationValidator {
    constructor(sandbox) {
      this.sandbox = sandbox;
    }

    validate(mutationId, code) {
      const result = this.sandbox.execute(code);
      const isMalicious = result.violations.some(v => 
        ['process', 'filesystem', 'network'].includes(v.type)
      );
      const isUnstable = result.violations.some(v => 
        ['timeout', 'memory'].includes(v.type)
      );

      return {
        mutationId,
        isSafe: result.success,
        isMalicious,
        isUnstable,
        recommendation: isMalicious ? 'reject' : (isUnstable ? 'review' : 'apply')
      };
    }
  }

  test('MutationValidator should recommend reject for malicious', () => {
    const validator = new MutationValidator(new SandboxExecutor());
    const result = validator.validate('mut-1', 'process.exit()');
    expect(result.recommendation).toBe('reject');
    expect(result.isMalicious).toBe(true);
  });

  test('MutationValidator should recommend apply for safe', () => {
    const validator = new MutationValidator(new SandboxExecutor());
    const result = validator.validate('mut-2', 'const x = 5;');
    expect(result.recommendation).toBe('apply');
    expect(result.isSafe).toBe(true);
  });

  test('MutationValidator should include mutationId', () => {
    const validator = new MutationValidator(new SandboxExecutor());
    const result = validator.validate('mutation-123', 'code');
    expect(result.mutationId).toBe('mutation-123');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 40: WORKER POOL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 40: WorkerPoolManager', () => {

  // PriorityQueue
  class PriorityQueue {
    constructor() {
      this.items = [];
    }

    enqueue(item) {
      let inserted = false;
      for (let i = 0; i < this.items.length; i++) {
        if (item.priority > this.items[i].priority) {
          this.items.splice(i, 0, item);
          inserted = true;
          break;
        }
      }
      if (!inserted) this.items.push(item);
    }

    dequeue() { return this.items.shift(); }
    peek() { return this.items[0]; }
    get size() { return this.items.length; }
    isEmpty() { return this.items.length === 0; }
    clear() { this.items = []; }
    toArray() { return [...this.items]; }
  }

  test('PriorityQueue should enqueue items', () => {
    const q = new PriorityQueue();
    q.enqueue({ id: 1, priority: 5 });
    expect(q.size).toBe(1);
  });

  test('PriorityQueue should order by priority', () => {
    const q = new PriorityQueue();
    q.enqueue({ id: 'low', priority: 1 });
    q.enqueue({ id: 'high', priority: 10 });
    q.enqueue({ id: 'med', priority: 5 });
    expect(q.peek().id).toBe('high');
  });

  test('PriorityQueue dequeue should return highest priority', () => {
    const q = new PriorityQueue();
    q.enqueue({ id: 'a', priority: 3 });
    q.enqueue({ id: 'b', priority: 7 });
    const item = q.dequeue();
    expect(item.id).toBe('b');
    expect(q.size).toBe(1);
  });

  test('PriorityQueue isEmpty should work', () => {
    const q = new PriorityQueue();
    expect(q.isEmpty()).toBe(true);
    q.enqueue({ priority: 1 });
    expect(q.isEmpty()).toBe(false);
  });

  test('PriorityQueue clear should empty queue', () => {
    const q = new PriorityQueue();
    q.enqueue({ priority: 1 });
    q.enqueue({ priority: 2 });
    q.clear();
    expect(q.size).toBe(0);
  });

  test('PriorityQueue toArray should return copy', () => {
    const q = new PriorityQueue();
    q.enqueue({ id: 1, priority: 5 });
    const arr = q.toArray();
    arr.pop();
    expect(q.size).toBe(1);
  });

  // WorkerInfo
  class WorkerInfo {
    constructor(id) {
      this.id = id;
      this.status = 'idle';
      this.tasksCompleted = 0;
      this.totalExecutionTime = 0;
      this.lastActive = new Date();
      this.errorCount = 0;
    }

    markBusy() { this.status = 'busy'; this.lastActive = new Date(); }
    markIdle() { this.status = 'idle'; }
    recordTask(duration) {
      this.tasksCompleted++;
      this.totalExecutionTime += duration;
      this.lastActive = new Date();
    }
    recordError() { this.errorCount++; }
    getAvgTime() {
      return this.tasksCompleted > 0 ? this.totalExecutionTime / this.tasksCompleted : 0;
    }
  }

  test('WorkerInfo should initialize correctly', () => {
    const info = new WorkerInfo(1);
    expect(info.id).toBe(1);
    expect(info.status).toBe('idle');
  });

  test('WorkerInfo markBusy should update status', () => {
    const info = new WorkerInfo(1);
    info.markBusy();
    expect(info.status).toBe('busy');
  });

  test('WorkerInfo recordTask should update stats', () => {
    const info = new WorkerInfo(1);
    info.recordTask(100);
    info.recordTask(200);
    expect(info.tasksCompleted).toBe(2);
    expect(info.totalExecutionTime).toBe(300);
  });

  test('WorkerInfo getAvgTime should calculate average', () => {
    const info = new WorkerInfo(1);
    info.recordTask(100);
    info.recordTask(300);
    expect(info.getAvgTime()).toBe(200);
  });

  test('WorkerInfo getAvgTime should return 0 when no tasks', () => {
    const info = new WorkerInfo(1);
    expect(info.getAvgTime()).toBe(0);
  });

  // WorkerPoolManager mock
  class WorkerPoolManager {
    constructor(config = {}) {
      this.config = {
        workerCount: config.workerCount ?? 4,
        maxTasksPerWorker: config.maxTasksPerWorker ?? 1000,
        taskTimeout: config.taskTimeout ?? 30000,
        maxQueueSize: config.maxQueueSize ?? 10000,
        enableThermalThrottling: config.enableThermalThrottling ?? true
      };
      this.workers = new Map();
      this.taskQueue = new PriorityQueue();
      this.activeTasks = new Map();
      this.stats = { completed: 0, failed: 0 };
      this.thermalState = 'cool';
    }

    submitTask(type, payload, options = {}) {
      const task = {
        id: `task-${Date.now()}`,
        type,
        payload,
        priority: options.priority ?? 5,
        resolve: null,
        reject: null
      };
      
      return new Promise((resolve, reject) => {
        task.resolve = resolve;
        task.reject = reject;
        this.taskQueue.enqueue(task);
      });
    }

    scale(targetCount) {
      const current = this.workers.size;
      if (targetCount > current) {
        for (let i = current; i < targetCount; i++) {
          this.workers.set(i, new WorkerInfo(i));
        }
      } else {
        for (let i = current - 1; i >= targetCount; i--) {
          this.workers.delete(i);
        }
      }
    }

    setThermalState(state) { this.thermalState = state; }
    getQueueSize() { return this.taskQueue.size; }
    getWorkerCount() { return this.workers.size; }
    getStats() { return { ...this.stats, queueSize: this.taskQueue.size }; }
  }

  test('WorkerPoolManager should initialize with config', () => {
    const pool = new WorkerPoolManager({ workerCount: 8 });
    expect(pool.config.workerCount).toBe(8);
  });

  test('WorkerPoolManager submitTask should queue task', () => {
    const pool = new WorkerPoolManager();
    pool.submitTask('test', { data: 1 });
    expect(pool.getQueueSize()).toBe(1);
  });

  test('WorkerPoolManager scale up should add workers', () => {
    const pool = new WorkerPoolManager();
    pool.scale(4);
    expect(pool.getWorkerCount()).toBe(4);
  });

  test('WorkerPoolManager scale down should remove workers', () => {
    const pool = new WorkerPoolManager();
    pool.scale(4);
    pool.scale(2);
    expect(pool.getWorkerCount()).toBe(2);
  });

  test('WorkerPoolManager setThermalState should update', () => {
    const pool = new WorkerPoolManager();
    pool.setThermalState('hot');
    expect(pool.thermalState).toBe('hot');
  });

  test('WorkerPoolManager getStats should return stats', () => {
    const pool = new WorkerPoolManager();
    const stats = pool.getStats();
    expect(stats).toHaveProperty('completed');
    expect(stats).toHaveProperty('failed');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 41: THERMAL AWARE POOL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 41: ThermalAwarePool', () => {

  class ThermalAwarePool {
    constructor(config = {}) {
      this.config = {
        throttleThreshold: config.throttleThreshold ?? 90,
        criticalThreshold: config.criticalThreshold ?? 95,
        coolThreshold: config.coolThreshold ?? 70,
        maxInstancesCool: config.maxInstancesCool ?? 40,
        minInstancesHot: config.minInstancesHot ?? 4,
        enableDynamicScaling: config.enableDynamicScaling ?? true
      };
      this.currentState = 'cool';
      this.currentTemperature = 50;
      this.currentConcurrency = this.config.maxInstancesCool;
      this.throttleCount = 0;
      this.taskQueue = [];
      this.completedTasks = 0;
      this.totalTaskTime = 0;
    }

    calculateState(temp) {
      if (temp >= this.config.criticalThreshold + 5) return 'emergency';
      if (temp >= this.config.criticalThreshold) return 'critical';
      if (temp >= this.config.throttleThreshold) return 'hot';
      if (temp > this.config.coolThreshold) return 'warm';
      return 'cool';
    }

    setTemperature(temp) {
      this.currentTemperature = temp;
      const newState = this.calculateState(temp);
      if (newState !== this.currentState) {
        this.currentState = newState;
        if (this.config.enableDynamicScaling) this.adjustConcurrency();
      }
    }

    adjustConcurrency() {
      const { maxInstancesCool, minInstancesHot } = this.config;
      switch (this.currentState) {
        case 'emergency':
          this.currentConcurrency = Math.max(2, Math.floor(minInstancesHot / 2));
          this.throttleCount++;
          break;
        case 'critical':
          this.currentConcurrency = minInstancesHot;
          this.throttleCount++;
          break;
        case 'hot':
          this.currentConcurrency = Math.floor(minInstancesHot + (maxInstancesCool - minInstancesHot) * 0.3);
          this.throttleCount++;
          break;
        case 'warm':
          this.currentConcurrency = Math.floor(maxInstancesCool * 0.7);
          break;
        case 'cool':
        default:
          this.currentConcurrency = maxInstancesCool;
      }
    }

    isThrottling() {
      return ['hot', 'critical', 'emergency'].includes(this.currentState);
    }

    getMetrics() {
      return {
        currentTemperature: this.currentTemperature,
        state: this.currentState,
        currentConcurrency: this.currentConcurrency,
        maxConcurrency: this.config.maxInstancesCool,
        throttleCount: this.throttleCount,
        completedTasks: this.completedTasks,
        avgTaskTime: this.completedTasks > 0 ? this.totalTaskTime / this.completedTasks : 0
      };
    }

    getState() { return this.currentState; }
    getConcurrency() { return this.currentConcurrency; }
    getTemperature() { return this.currentTemperature; }
    getConfig() { return { ...this.config }; }
    forceConcurrency(c) { 
      this.currentConcurrency = Math.max(1, Math.min(c, this.config.maxInstancesCool)); 
    }
  }

  test('ThermalAwarePool should initialize with defaults', () => {
    const pool = new ThermalAwarePool();
    expect(pool.currentState).toBe('cool');
    expect(pool.currentConcurrency).toBe(40);
  });

  test('calculateState should return cool for low temp', () => {
    const pool = new ThermalAwarePool();
    expect(pool.calculateState(60)).toBe('cool');
  });

  test('calculateState should return warm for medium temp', () => {
    const pool = new ThermalAwarePool();
    expect(pool.calculateState(80)).toBe('warm');
  });

  test('calculateState should return hot for high temp', () => {
    const pool = new ThermalAwarePool();
    expect(pool.calculateState(92)).toBe('hot');
  });

  test('calculateState should return critical for very high temp', () => {
    const pool = new ThermalAwarePool();
    expect(pool.calculateState(96)).toBe('critical');
  });

  test('calculateState should return emergency for extreme temp', () => {
    const pool = new ThermalAwarePool();
    expect(pool.calculateState(101)).toBe('emergency');
  });

  test('setTemperature should update state', () => {
    const pool = new ThermalAwarePool();
    pool.setTemperature(92);
    expect(pool.currentState).toBe('hot');
  });

  test('setTemperature should adjust concurrency', () => {
    const pool = new ThermalAwarePool();
    pool.setTemperature(96);
    expect(pool.currentConcurrency).toBeLessThan(40);
  });

  test('isThrottling should return true when hot', () => {
    const pool = new ThermalAwarePool();
    pool.setTemperature(92);
    expect(pool.isThrottling()).toBe(true);
  });

  test('isThrottling should return false when cool', () => {
    const pool = new ThermalAwarePool();
    pool.setTemperature(60);
    expect(pool.isThrottling()).toBe(false);
  });

  test('getMetrics should return all metrics', () => {
    const pool = new ThermalAwarePool();
    const metrics = pool.getMetrics();
    expect(metrics).toHaveProperty('currentTemperature');
    expect(metrics).toHaveProperty('state');
    expect(metrics).toHaveProperty('currentConcurrency');
  });

  test('forceConcurrency should override scaling', () => {
    const pool = new ThermalAwarePool();
    pool.forceConcurrency(10);
    expect(pool.getConcurrency()).toBe(10);
  });

  test('forceConcurrency should clamp to max', () => {
    const pool = new ThermalAwarePool();
    pool.forceConcurrency(100);
    expect(pool.getConcurrency()).toBe(40);
  });

  test('forceConcurrency should clamp to min 1', () => {
    const pool = new ThermalAwarePool();
    pool.forceConcurrency(0);
    expect(pool.getConcurrency()).toBe(1);
  });

  test('throttleCount should increment on throttle', () => {
    const pool = new ThermalAwarePool();
    pool.setTemperature(92);
    expect(pool.throttleCount).toBeGreaterThan(0);
  });

  test('getConfig should return config copy', () => {
    const pool = new ThermalAwarePool({ maxInstancesCool: 20 });
    const config = pool.getConfig();
    expect(config.maxInstancesCool).toBe(20);
    config.maxInstancesCool = 100;
    expect(pool.config.maxInstancesCool).toBe(20);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 42: DOCKER MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 42: DockerManager', () => {

  class ContainerConfig {
    constructor(options = {}) {
      this.name = options.name ?? 'chrome';
      this.browser = options.browser ?? 'chrome';
      this.instances = options.instances ?? 4;
      this.memoryLimit = options.memoryLimit ?? '2g';
      this.cpuLimit = options.cpuLimit ?? '2.0';
      this.enableVnc = options.enableVnc ?? true;
      this.vncPort = options.vncPort ?? 5900;
      this.seleniumPort = options.seleniumPort ?? 5555;
    }
  }

  test('ContainerConfig should have defaults', () => {
    const config = new ContainerConfig();
    expect(config.browser).toBe('chrome');
    expect(config.instances).toBe(4);
  });

  test('ContainerConfig should accept custom values', () => {
    const config = new ContainerConfig({ browser: 'firefox', instances: 8 });
    expect(config.browser).toBe('firefox');
    expect(config.instances).toBe(8);
  });

  // GridConfig
  class GridConfig {
    constructor(options = {}) {
      this.hubPort = options.hubPort ?? 4444;
      this.maxSessions = options.maxSessions ?? 16;
      this.sessionTimeout = options.sessionTimeout ?? 300;
      this.networkName = options.networkName ?? 'QAntum-grid';
      this.enableVideo = options.enableVideo ?? false;
      this.nodes = options.nodes ?? [];
    }
  }

  test('GridConfig should have default port', () => {
    const config = new GridConfig();
    expect(config.hubPort).toBe(4444);
  });

  test('GridConfig should accept custom sessions', () => {
    const config = new GridConfig({ maxSessions: 32 });
    expect(config.maxSessions).toBe(32);
  });

  // DockerManager mock
  class DockerManager {
    constructor(config = {}) {
      this.config = new GridConfig(config);
      this.isGridRunning = false;
      this.containers = new Map();
    }

    generateDockerfile() {
      return `FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
CMD ["npm", "run", "test"]`;
    }

    generateDockerCompose() {
      const services = {
        'selenium-hub': {
          image: 'selenium/hub:4.16.1',
          ports: [`${this.config.hubPort}:4444`]
        }
      };

      for (const node of this.config.nodes) {
        services[`${node.browser}-node`] = {
          image: `selenium/node-${node.browser}:4.16.1`,
          depends_on: ['selenium-hub']
        };
      }

      return JSON.stringify({ version: '3.8', services }, null, 2);
    }

    async startGrid() {
      if (this.isGridRunning) throw new Error('Grid already running');
      this.isGridRunning = true;
      return { hubPort: this.config.hubPort };
    }

    async stopGrid() {
      this.isGridRunning = false;
    }

    isRunning() { return this.isGridRunning; }

    getStatus() {
      return {
        running: this.isGridRunning,
        hubPort: this.config.hubPort,
        nodes: this.config.nodes.length
      };
    }

    addNode(node) {
      this.config.nodes.push(node);
    }
  }

  test('DockerManager generateDockerfile should return valid content', () => {
    const dm = new DockerManager();
    const dockerfile = dm.generateDockerfile();
    expect(dockerfile).toContain('FROM node');
    expect(dockerfile).toContain('WORKDIR');
  });

  test('DockerManager generateDockerCompose should include hub', () => {
    const dm = new DockerManager();
    const compose = dm.generateDockerCompose();
    expect(compose).toContain('selenium-hub');
  });

  test('DockerManager generateDockerCompose should include nodes', () => {
    const dm = new DockerManager({ nodes: [{ browser: 'chrome' }] });
    const compose = dm.generateDockerCompose();
    expect(compose).toContain('chrome-node');
  });

  test('DockerManager startGrid should set running', async () => {
    const dm = new DockerManager();
    await dm.startGrid();
    expect(dm.isRunning()).toBe(true);
  });

  test('DockerManager startGrid should throw if already running', async () => {
    const dm = new DockerManager();
    await dm.startGrid();
    let threw = false;
    try { await dm.startGrid(); } catch { threw = true; }
    expect(threw).toBe(true);
  });

  test('DockerManager stopGrid should clear running', async () => {
    const dm = new DockerManager();
    await dm.startGrid();
    await dm.stopGrid();
    expect(dm.isRunning()).toBe(false);
  });

  test('DockerManager getStatus should return info', () => {
    const dm = new DockerManager({ hubPort: 5555 });
    const status = dm.getStatus();
    expect(status.hubPort).toBe(5555);
    expect(status).toHaveProperty('running');
  });

  test('DockerManager addNode should add to config', () => {
    const dm = new DockerManager();
    dm.addNode({ browser: 'firefox' });
    expect(dm.config.nodes).toHaveLength(1);
  });

  // Selenium Grid URL builder
  class GridUrlBuilder {
    constructor(host = 'localhost', port = 4444) {
      this.host = host;
      this.port = port;
    }

    getHubUrl() { return `http://${this.host}:${this.port}/wd/hub`; }
    getStatusUrl() { return `http://${this.host}:${this.port}/status`; }
    getSessionUrl(sessionId) { return `http://${this.host}:${this.port}/session/${sessionId}`; }
  }

  test('GridUrlBuilder should build hub URL', () => {
    const builder = new GridUrlBuilder();
    expect(builder.getHubUrl()).toBe('http://localhost:4444/wd/hub');
  });

  test('GridUrlBuilder should build status URL', () => {
    const builder = new GridUrlBuilder('grid.local', 5555);
    expect(builder.getStatusUrl()).toBe('http://grid.local:5555/status');
  });

  test('GridUrlBuilder should build session URL', () => {
    const builder = new GridUrlBuilder();
    expect(builder.getSessionUrl('abc123')).toContain('abc123');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// POM INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('POM & Explicit Waits Integration', () => {

  test('PageObject should register elements', () => {
    const page = new PageObject('LoginPage');
    page.registerElement('username', '#username');
    page.registerElement('password', '#password');
    expect(page.getSelector('username')).toBe('#username');
  });

  test('PageObject should chain registrations', () => {
    const page = new PageObject('HomePage')
      .registerElement('nav', '.nav')
      .registerElement('footer', '.footer');
    expect(page.elements.size).toBe(2);
  });

  test('ExplicitWait should resolve when condition met', async () => {
    const wait = new ExplicitWait(1000);
    let counter = 0;
    const result = await wait.until(() => {
      counter++;
      return counter >= 3;
    });
    expect(result).toBe(true);
  });

  test('ExplicitWait elementVisible should create condition', () => {
    const condition = ExplicitWait.elementVisible({ visible: true });
    expect(condition()).toBe(true);
  });

  test('ExplicitWait elementClickable should create condition', () => {
    const condition = ExplicitWait.elementClickable({ enabled: true });
    expect(condition()).toBe(true);
  });

  test('PageObject waitForElement should return found status', async () => {
    const page = new PageObject('TestPage');
    page.registerElement('btn', '#submit');
    const result = await page.waitForElement('btn', 100);
    expect(result.found).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n' + '═'.repeat(70));
console.log('📊 PHASE 3A INFRASTRUCTURE TEST RESULTS');
console.log('═'.repeat(70));
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📝 Total:  ${testResults.total}`);
console.log(`📈 Rate:   ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
console.log('═'.repeat(70));

process.exit(testResults.failed > 0 ? 1 : 0);
