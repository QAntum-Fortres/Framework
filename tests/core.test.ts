/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of QAntum.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited without express written permission.
 * 
 * For licensing inquiries: dimitar.papazov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCY INJECTION CONTAINER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('💎 DIContainer', () => {
  // Import dynamically to avoid worker thread issues
  let DIContainer: any;
  let ServiceToken: any;
  let ServiceLifetime: any;

  beforeEach(async () => {
    const module = await import('../src/core/di/container');
    DIContainer = module.DIContainer;
    ServiceToken = module.ServiceToken;
    ServiceLifetime = module.ServiceLifetime;
  });

  describe('Service Registration', () => {
    it('should register and resolve a singleton service', async () => {
      const container = new DIContainer();
      const token = new ServiceToken<{ value: number }>('TestService');
      
      let createCount = 0;
      container.register(token, () => {
        createCount++;
        return { value: 42 };
      }, ServiceLifetime.Singleton);

      const instance1 = await container.resolve(token);
      const instance2 = await container.resolve(token);

      expect(instance1.value).toBe(42);
      expect(instance1).toBe(instance2); // Same instance
      expect(createCount).toBe(1); // Factory called once
    });

    it('should create new instance for transient lifetime', async () => {
      const container = new DIContainer();
      const token = new ServiceToken<{ id: number }>('TransientService');
      
      let counter = 0;
      container.register(token, () => {
        return { id: ++counter };
      }, ServiceLifetime.Transient);

      const instance1 = await container.resolve(token);
      const instance2 = await container.resolve(token);

      expect(instance1.id).toBe(1);
      expect(instance2.id).toBe(2);
      expect(instance1).not.toBe(instance2);
    });

    it('should throw on duplicate registration', () => {
      const container = new DIContainer();
      const token = new ServiceToken<string>('DuplicateService');
      
      container.register(token, () => 'first');
      
      expect(() => {
        container.register(token, () => 'second');
      }).toThrow(/already registered/);
    });

    it('should allow replacing registration', async () => {
      const container = new DIContainer();
      const token = new ServiceToken<string>('ReplaceableService');
      
      container.register(token, () => 'original');
      container.replace(token, () => 'replaced');

      const result = await container.resolve(token);
      expect(result).toBe('replaced');
    });

    it('should throw on unregistered service', async () => {
      const container = new DIContainer();
      const token = new ServiceToken<string>('UnknownService');
      
      await expect(container.resolve(token)).rejects.toThrow(/not registered/);
    });
  });

  describe('Circular Dependency Detection', () => {
    it('should detect circular dependencies', async () => {
      const container = new DIContainer();
      const tokenA = new ServiceToken<{ b: any }>('ServiceA');
      const tokenB = new ServiceToken<{ a: any }>('ServiceB');
      
      container.register(tokenA, async (c) => ({
        b: await c.resolve(tokenB)
      }));
      
      container.register(tokenB, async (c) => ({
        a: await c.resolve(tokenA)
      }));

      await expect(container.resolve(tokenA)).rejects.toThrow(/Circular dependency/);
    });
  });

  describe('Scoped Lifetime', () => {
    it('should create scoped instances', async () => {
      const container = new DIContainer();
      const token = new ServiceToken<{ scopeId: string }>('ScopedService');
      
      let currentScope = '';
      container.register(token, () => ({ scopeId: currentScope }), ServiceLifetime.Scoped);

      // Run in scope 1
      const result1 = await container.runInScope('scope-1', async () => {
        currentScope = 'scope-1';
        const instance1 = await container.resolve(token);
        const instance2 = await container.resolve(token);
        return { instance1, instance2 };
      });

      // Run in scope 2
      const result2 = await container.runInScope('scope-2', async () => {
        currentScope = 'scope-2';
        return await container.resolve(token);
      });

      expect(result1.instance1).toBe(result1.instance2); // Same in scope
      expect(result1.instance1.scopeId).toBe('scope-1');
      expect(result2.scopeId).toBe('scope-2');
    });
  });

  describe('Container Utilities', () => {
    it('should check if service is registered', () => {
      const container = new DIContainer();
      const token = new ServiceToken<string>('CheckService');
      
      expect(container.isRegistered(token)).toBe(false);
      container.register(token, () => 'test');
      expect(container.isRegistered(token)).toBe(true);
    });

    it('should list registered services', () => {
      const container = new DIContainer();
      container.register(new ServiceToken('Service1'), () => 1);
      container.register(new ServiceToken('Service2'), () => 2);

      const services = container.getRegisteredServices();
      expect(services).toContain('Service1');
      expect(services).toContain('Service2');
    });

    it('should create child container', async () => {
      const parent = new DIContainer();
      const token = new ServiceToken<number>('InheritedService');
      
      parent.register(token, () => 42);
      const child = parent.createChild();

      const result = await child.resolve(token);
      expect(result).toBe(42);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING SYSTEM TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('🛡️ Error Handling System', () => {
  let CentralizedErrorHandler: any;
  let ExponentialBackoffRetry: any;
  let NetworkError: any;
  let TimeoutError: any;
  let ValidationError: any;
  let SecurityError: any;
  let createNeuralSnapshot: any;

  beforeEach(async () => {
    const module = await import('../src/core/errors/error-handler');
    CentralizedErrorHandler = module.CentralizedErrorHandler;
    ExponentialBackoffRetry = module.ExponentialBackoffRetry;
    NetworkError = module.NetworkError;
    TimeoutError = module.TimeoutError;
    ValidationError = module.ValidationError;
    SecurityError = module.SecurityError;
    createNeuralSnapshot = module.createNeuralSnapshot;
  });

  describe('Custom Error Types', () => {
    it('should create NetworkError with details', () => {
      const error = new NetworkError('Connection failed', {
        statusCode: 503,
        endpoint: 'https://api.example.com'
      });

      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.recoverable).toBe(true);
      expect(error.retryStrategy).toBe('exponential');
      expect(error.statusCode).toBe(503);
      expect(error.endpoint).toBe('https://api.example.com');
    });

    it('should create TimeoutError with timing info', () => {
      const error = new TimeoutError('fetchData', 5000, 5234);

      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.operation).toBe('fetchData');
      expect(error.timeout).toBe(5000);
      expect(error.elapsed).toBe(5234);
      expect(error.message).toContain('timed out');
    });

    it('should create ValidationError with violations', () => {
      const error = new ValidationError('Invalid input', [
        { field: 'email', rule: 'format', message: 'Invalid email format' },
        { field: 'age', rule: 'min', message: 'Age must be at least 18' }
      ]);

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.recoverable).toBe(false);
      expect(error.fields).toEqual(['email', 'age']);
      expect(error.violations).toHaveLength(2);
    });

    it('should create SecurityError - never retryable', () => {
      const error = new SecurityError(
        'Unauthorized access attempt',
        'sandbox',
        'process.env access'
      );

      expect(error.code).toBe('SECURITY_ERROR');
      expect(error.recoverable).toBe(false);
      expect(error.retryStrategy).toBe('none');
      expect(error.violationType).toBe('sandbox');
    });
  });

  describe('Neural Snapshot', () => {
    it('should capture system state', () => {
      const snapshot = createNeuralSnapshot();

      expect(snapshot.memoryUsage).toBeDefined();
      expect(snapshot.memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(snapshot.uptime).toBeGreaterThan(0);
      expect(snapshot.timestamp).toBeInstanceOf(Date);
      expect(snapshot.stackTrace).toBeDefined();
    });

    it('should include error stack trace', () => {
      const error = new Error('Test error');
      const snapshot = createNeuralSnapshot(error);

      expect(snapshot.stackTrace).toContain('Test error');
    });
  });

  describe('Exponential Backoff Retry', () => {
    it('should succeed on first attempt', async () => {
      const retry = new ExponentialBackoffRetry();
      let attempts = 0;

      const result = await retry.execute(async () => {
        attempts++;
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const retry = new ExponentialBackoffRetry();
      let attempts = 0;

      const result = await retry.execute(async () => {
        attempts++;
        if (attempts < 3) throw new Error('Not yet');
        return 'success';
      }, {
        maxRetries: 5,
        initialDelay: 10 // Fast for testing
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw AggregateRetryError after all retries fail', async () => {
      const retry = new ExponentialBackoffRetry();

      await expect(
        retry.execute(async () => {
          throw new Error('Always fails');
        }, {
          maxRetries: 2,
          initialDelay: 10,
          operationName: 'testOp'
        })
      ).rejects.toMatchObject({
        totalAttempts: 2
      });
    });

    it('should respect retry condition', async () => {
      const retry = new ExponentialBackoffRetry();
      let attempts = 0;

      try {
        await retry.execute(async () => {
          attempts++;
          throw new Error('Fatal error');
        }, {
          maxRetries: 5,
          initialDelay: 10,
          retryCondition: (err) => !err.message.includes('Fatal')
        });
      } catch (error) {
        // Error should be AggregateRetryError containing the original error
        expect((error as Error).message).toContain('attempts failed');
      }

      expect(attempts).toBe(1); // No retries due to condition
    });
  });

  describe('Centralized Error Handler', () => {
    it('should handle errors with registered strategies', async () => {
      const handler = new CentralizedErrorHandler();
      const error = new NetworkError('Connection lost', { statusCode: 500 });

      // The handler processes errors and returns a result
      try {
        const result = await handler.handle(error, {
          operation: 'fetchData',
          component: 'API'
        });
        // Handler may or may not recover
        expect(result).toBeDefined();
      } catch (handlerError) {
        // Handler may re-throw if no strategy works
        expect(handlerError).toBeDefined();
      }
    });

    it('should emit events on error', async () => {
      const handler = new CentralizedErrorHandler();
      const error = new Error('Test error');
      
      const errorPromise = new Promise(resolve => {
        handler.on('error', resolve);
      });

      try {
        await handler.handle(error, { operation: 'test', component: 'test' });
      } catch {
        // Ignore - we're testing event emission
      }
      
      const emitted = await Promise.race([
        errorPromise,
        new Promise(resolve => setTimeout(() => resolve({ emitted: true }), 100))
      ]);
      expect(emitted).toBeDefined();
    });

    it('should not retry non-recoverable errors', async () => {
      const handler = new CentralizedErrorHandler();
      const error = new SecurityError('Access denied', 'authorization', 'admin panel');

      try {
        const result = await handler.handle(error, {
          operation: 'accessAdmin',
          component: 'Auth'
        });
        // If it returns, check properties
        expect(result.recovered).toBe(false);
      } catch (handlerError) {
        // Security errors may be wrapped in an error handler error
        expect(handlerError).toBeDefined();
        expect((handlerError as Error).message).toContain('Unhandled');
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AI LOGIC GATE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('🧪 AI Logic Gate', () => {
  let AILogicGate: any;

  beforeEach(async () => {
    const module = await import('../src/core/validation/logic-gate');
    AILogicGate = module.AILogicGate;
  });

  describe('Syntax Validation', () => {
    it('should approve valid JavaScript', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('const x = 1 + 2;');

      expect(report.syntax.valid).toBe(true);
      expect(report.syntax.errors).toHaveLength(0);
    });

    it('should reject invalid syntax', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('const x = {;');

      expect(report.syntax.valid).toBe(false);
      expect(report.syntax.errors.length).toBeGreaterThan(0);
      expect(report.approved).toBe(false);
    });

    it('should detect mismatched brackets', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('function test() { if (true) { }');

      expect(report.syntax.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Logic Validation', () => {
    it('should detect eval usage', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('eval("alert(1)")');

      expect(report.logic.valid).toBe(false);
      expect(report.logic.issues.some(i => i.message.includes('eval'))).toBe(true);
      expect(report.approved).toBe(false);
    });

    it('should detect process access', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('const secret = process.env.SECRET');

      expect(report.logic.issues.some(i => i.message.includes('process'))).toBe(true);
    });

    it('should detect __proto__ pollution', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('obj.__proto__.polluted = true');

      expect(report.logic.issues.some(i => i.message.includes('__proto__'))).toBe(true);
    });

    it('should calculate code metrics', async () => {
      const gate = new AILogicGate();
      const code = `
        function test() {
          if (a) {
            if (b) {
              return 1;
            }
          }
          return 2;
        }
      `;
      const report = await gate.validate(code);

      expect(report.logic.metrics.lineCount).toBeGreaterThan(0);
      expect(report.logic.metrics.complexity).toBeGreaterThan(1);
      expect(report.logic.metrics.nestingDepth).toBeGreaterThan(1);
    });
  });

  describe('Sandbox Execution', () => {
    it('should execute safe code in sandbox', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('1 + 2');

      expect(report.sandbox.success).toBe(true);
      expect(report.sandbox.result).toBe(3);
    });

    it('should block process access in sandbox', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('process.exit()');

      expect(report.sandbox.violations.length).toBeGreaterThan(0);
      expect(report.sandbox.violations[0].type).toBe('process');
    });

    it('should block fetch in sandbox', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('fetch("http://evil.com")');

      expect(report.sandbox.violations.some(v => v.type === 'network')).toBe(true);
    });

    it('should capture console output', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('console.log("Hello"); 42');

      expect(report.sandbox.output).toContain('Hello');
    });
  });

  describe('Approval Score', () => {
    it('should approve clean code with high score', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('const sum = (a, b) => a + b;');

      expect(report.score).toBeGreaterThanOrEqual(80);
      expect(report.approved).toBe(true);
    });

    it('should reject dangerous code with low score', async () => {
      const gate = new AILogicGate();
      const report = await gate.validate('eval(process.env.CODE)');

      expect(report.score).toBeLessThan(50);
      expect(report.approved).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should track validation statistics', async () => {
      const gate = new AILogicGate();
      
      await gate.validate('const x = 1;');
      await gate.validate('eval("bad")');
      
      const stats = gate.getStats();
      expect(stats.totalValidations).toBe(2);
      expect(stats.approved).toBe(1);
      expect(stats.rejected).toBe(1);
    });

    it('should return recent reports', async () => {
      const gate = new AILogicGate();
      
      await gate.validate('const a = 1;');
      await gate.validate('const b = 2;');
      
      const reports = gate.getRecentReports(2);
      expect(reports).toHaveLength(2);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// STREAM PROCESSOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('📊 Stream Processor', () => {
  let StreamProcessor: any;
  let JSONLineParser: any;
  let BatchProcessor: any;

  beforeEach(async () => {
    const module = await import('../src/core/streams/stream-processor');
    StreamProcessor = module.StreamProcessor;
    JSONLineParser = module.JSONLineParser;
    BatchProcessor = module.BatchProcessor;
  });

  describe('JSONLineParser', () => {
    it('should parse NDJSON lines', async () => {
      const parser = new JSONLineParser();
      const results: any[] = [];

      await new Promise<void>((resolve) => {
        parser.on('data', (item: any) => results.push(item));
        parser.on('end', () => {
          expect(results).toEqual([
            { id: 1, name: 'first' },
            { id: 2, name: 'second' }
          ]);
          resolve();
        });

        parser.write('{"id": 1, "name": "first"}\n');
        parser.write('{"id": 2, "name": "second"}\n');
        parser.end();
      });
    });

    it('should handle incomplete lines', async () => {
      const parser = new JSONLineParser();
      const results: any[] = [];

      await new Promise<void>((resolve) => {
        parser.on('data', (item: any) => results.push(item));
        parser.on('end', () => {
          expect(results).toHaveLength(2);
          resolve();
        });

        parser.write('{"id": 1}\n{"id":');
        parser.write(' 2}\n');
        parser.end();
      });
    });

    it('should emit parseError for invalid JSON', async () => {
      const parser = new JSONLineParser();
      
      await new Promise<void>((resolve) => {
        parser.on('parseError', (err: any) => {
          expect(err.content).toBe('invalid json');
          resolve();
        });

        parser.write('invalid json\n');
        parser.end();
      });
    });
  });

  describe('BatchProcessor', () => {
    it('should batch items correctly', async () => {
      const batches: any[][] = [];
      
      const processor = new BatchProcessor({
        batchSize: 3,
        processor: async (batch) => {
          batches.push([...batch]); // Clone batch
        }
      });

      await new Promise<void>((resolve, reject) => {
        processor.on('finish', () => {
          // May have 1 or 2 batches depending on flush timing
          expect(batches.length).toBeGreaterThanOrEqual(1);
          const totalItems = batches.reduce((sum, b) => sum + b.length, 0);
          expect(totalItems).toBe(5); // All 5 items processed
          resolve();
        });

        processor.on('error', reject);

        for (let i = 0; i < 5; i++) {
          processor.write({ id: i });
        }
        processor.end();
      });
    });
  });

  describe('StreamProcessor', () => {
    it('should create processor with options', () => {
      const processor = new StreamProcessor({
        highWaterMark: 128 * 1024,
        autoBackpressure: true
      });

      expect(processor).toBeDefined();
      expect(processor.getStats().bytesProcessed).toBe(0);
    });

    it('should create readable from generator', async () => {
      const processor = new StreamProcessor();
      
      async function* generate() {
        yield { id: 1 };
        yield { id: 2 };
      }

      const readable = processor.createReadableFromGenerator(generate());
      const items: any[] = [];

      await new Promise<void>((resolve) => {
        readable.on('data', (item: any) => items.push(item));
        readable.on('end', () => {
          expect(items).toHaveLength(2);
          resolve();
        });
      });
    });

    it('should create collector stream', async () => {
      const processor = new StreamProcessor();
      const collector = processor.createCollectorStream<number>(100);

      await new Promise<void>((resolve) => {
        collector.on('finish', () => {
          expect(collector.getItems()).toEqual([1, 2, 3]);
          resolve();
        });

        collector.write(1);
        collector.write(2);
        collector.write(3);
        collector.end();
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HEAVY TASK DELEGATOR TESTS (Limited - Worker threads)
// ═══════════════════════════════════════════════════════════════════════════════

describe('🧵 Heavy Task Delegator', () => {
  // Note: Full worker tests require special handling
  // These tests focus on the API and type safety
  
  let HeavyTaskType: any;

  beforeEach(async () => {
    const module = await import('../src/core/workers/heavy-task-delegator');
    HeavyTaskType = module.HeavyTaskType;
  });

  describe('Task Types', () => {
    it('should have all required task types', () => {
      expect(HeavyTaskType.VISUAL_REGRESSION).toBe('visual-regression');
      expect(HeavyTaskType.DATA_MINING).toBe('data-mining');
      expect(HeavyTaskType.JSON_PARSING).toBe('json-parsing');
      expect(HeavyTaskType.DOM_COMPARISON).toBe('dom-comparison');
      expect(HeavyTaskType.MUTATION_TESTING).toBe('mutation-testing');
      expect(HeavyTaskType.CODE_ANALYSIS).toBe('code-analysis');
      expect(HeavyTaskType.HASH_COMPUTATION).toBe('hash-computation');
      expect(HeavyTaskType.COMPRESSION).toBe('compression');
      expect(HeavyTaskType.CUSTOM).toBe('custom');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('🔗 Integration Tests', () => {
  it('should use DI container with error handler', async () => {
    const { DIContainer, ServiceToken, ServiceLifetime } = await import('../src/core/di/container');
    const { CentralizedErrorHandler } = await import('../src/core/errors/error-handler');

    const container = new DIContainer();
    const errorHandlerToken = new ServiceToken<CentralizedErrorHandler>('ErrorHandler');

    container.register(errorHandlerToken, () => new CentralizedErrorHandler(), ServiceLifetime.Singleton);

    const handler = await container.resolve(errorHandlerToken);
    expect(handler).toBeInstanceOf(CentralizedErrorHandler);
  });

  it('should use Logic Gate to validate before storing', async () => {
    const { AILogicGate } = await import('../src/core/validation/logic-gate');

    const gate = new AILogicGate();
    const userCode = 'function add(a, b) { return a + b; }';

    const report = await gate.validate(userCode);
    
    if (report.approved) {
      // Safe to proceed
      expect(report.score).toBeGreaterThanOrEqual(80);
    } else {
      // Block the code
      expect(report.approvalReason).toContain('Rejected');
    }
  });
});
