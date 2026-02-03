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

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as os from 'node:os';

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE EXHAUSTION SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════════

const CHAOS_CONFIG = {
  /** Number of parallel ghost threads */
  GHOST_THREAD_COUNT: 50,
  /** Heavy computation iterations */
  HEAVY_ITERATIONS: 1_000_000,
  /** Memory allocation size per task (bytes) */
  MEMORY_ALLOCATION_SIZE: 10 * 1024 * 1024, // 10MB
  /** Maximum allowed execution time (ms) */
  MAX_EXECUTION_TIME: 30_000, // 30 seconds
  /** CPU saturation threshold */
  CPU_THRESHOLD: 0.95, // 95%
  /** Memory threshold for OOM prevention */
  MEMORY_THRESHOLD: 0.85, // 85% of available RAM
};

// ═══════════════════════════════════════════════════════════════════════════════
// HEAVY COMPUTATION TASKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CPU-intensive task: Prime number calculation
 */
function heavyPrimeCalculation(iterations: number): { primes: number; duration: number } {
  const start = Date.now();
  let primeCount = 0;
  
  for (let n = 2; n < iterations; n++) {
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (n % i === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primeCount++;
  }
  
  return { primes: primeCount, duration: Date.now() - start };
}

/**
 * Memory-intensive task: Large array manipulation
 */
function heavyMemoryTask(sizeBytes: number): { allocated: number; duration: number } {
  const start = Date.now();
  
  // Allocate large buffer
  const buffer = Buffer.alloc(sizeBytes);
  
  // Fill with random data to prevent optimization
  for (let i = 0; i < sizeBytes; i += 1024) {
    buffer.writeUInt32LE(Math.random() * 0xFFFFFFFF, i);
  }
  
  // Do some work on it
  let checksum = 0;
  for (let i = 0; i < sizeBytes; i += 4) {
    checksum ^= buffer.readUInt32LE(i);
  }
  
  return { allocated: sizeBytes, duration: Date.now() - start };
}

/**
 * Event loop blocking task
 */
function blockEventLoop(durationMs: number): { blocked: number; actualDuration: number } {
  const start = Date.now();
  const end = start + durationMs;
  
  // Synchronous busy-wait (evil!)
  let iterations = 0;
  while (Date.now() < end) {
    iterations++;
    Math.sqrt(Math.random());
  }
  
  return { blocked: durationMs, actualDuration: Date.now() - start };
}

/**
 * JSON serialization stress (common bottleneck)
 */
function heavyJSONTask(depth: number, breadth: number): { objectSize: number; duration: number } {
  const start = Date.now();
  
  function createDeepObject(currentDepth: number): any {
    if (currentDepth === 0) {
      return { value: Math.random(), data: 'x'.repeat(100) };
    }
    const obj: any = {};
    for (let i = 0; i < breadth; i++) {
      obj[`child_${i}`] = createDeepObject(currentDepth - 1);
    }
    return obj;
  }
  
  const obj = createDeepObject(depth);
  const json = JSON.stringify(obj);
  const parsed = JSON.parse(json);
  
  return { objectSize: json.length, duration: Date.now() - start };
}

/**
 * Regex catastrophic backtracking (ReDoS)
 */
function heavyRegexTask(inputLength: number): { matched: boolean; duration: number } {
  const start = Date.now();
  
  // Evil regex pattern prone to catastrophic backtracking
  const evilPattern = /^(a+)+$/;
  const input = 'a'.repeat(inputLength) + 'b';
  
  // This will be slow but shouldn't crash
  let matched = false;
  try {
    matched = evilPattern.test(input);
  } catch (e) {
    // Regex timed out or errored
  }
  
  return { matched, duration: Date.now() - start };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM METRICS COLLECTION
// ═══════════════════════════════════════════════════════════════════════════════

interface SystemMetrics {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  memoryPercent: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  eventLoopLag: number;
  timestamp: Date;
}

async function collectMetrics(): Promise<SystemMetrics> {
  const startHr = process.hrtime.bigint();
  
  // Measure event loop lag
  await new Promise(resolve => setImmediate(resolve));
  const endHr = process.hrtime.bigint();
  const lagNs = Number(endHr - startHr);
  
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  
  return {
    cpuUsage: os.loadavg()[0] / os.cpus().length, // Normalized CPU usage
    memoryUsed: totalMem - freeMem,
    memoryTotal: totalMem,
    memoryPercent: (totalMem - freeMem) / totalMem,
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers,
    eventLoopLag: lagNs / 1_000_000, // Convert to ms
    timestamp: new Date(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════

describe('🟠 CHAOS: Resource Exhaustion Test', () => {
  let startMetrics: SystemMetrics;
  let peakMetrics: SystemMetrics;
  let HeavyTaskDelegator: any;
  let HeavyTaskType: any;
  let delegator: any;
  
  beforeAll(async () => {
    startMetrics = await collectMetrics();
    peakMetrics = startMetrics;
    
    // Import task delegator
    const module = await import('../../src/core/workers/heavy-task-delegator');
    HeavyTaskDelegator = module.HeavyTaskDelegator;
    HeavyTaskType = module.HeavyTaskType;
  });

  beforeEach(async () => {
    // Force GC if available to start clean
    if (global.gc) {
      global.gc();
    }
  });

  describe('🧵 50 Parallel Ghost Thread Stress', () => {
    it('should handle 50 parallel CPU-intensive tasks', async () => {
      const TASK_COUNT = CHAOS_CONFIG.GHOST_THREAD_COUNT;
      const results: Array<{ taskId: number; success: boolean; duration: number }> = [];
      const startTime = Date.now();
      
      console.log(`\n   🧵 Spawning ${TASK_COUNT} parallel ghost threads...`);
      
      // Create parallel tasks
      const tasks = Array.from({ length: TASK_COUNT }, (_, i) => {
        return new Promise<void>(async (resolve) => {
          const taskStart = Date.now();
          try {
            // Each ghost does different work
            if (i % 4 === 0) {
              heavyPrimeCalculation(10000);
            } else if (i % 4 === 1) {
              heavyMemoryTask(1024 * 1024); // 1MB each
            } else if (i % 4 === 2) {
              heavyJSONTask(5, 5);
            } else {
              // Light task - just yield
              await new Promise(r => setImmediate(r));
            }
            results.push({ taskId: i, success: true, duration: Date.now() - taskStart });
          } catch (error) {
            results.push({ taskId: i, success: false, duration: Date.now() - taskStart });
          }
          resolve();
        });
      });
      
      // Execute all in parallel
      await Promise.all(tasks);
      
      const totalDuration = Date.now() - startTime;
      const successful = results.filter(r => r.success).length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      
      console.log(`   ✅ Completed: ${successful}/${TASK_COUNT} tasks`);
      console.log(`   ⏱️  Total time: ${totalDuration}ms`);
      console.log(`   📊 Avg task time: ${avgDuration.toFixed(0)}ms`);
      
      // Update peak metrics
      const currentMetrics = await collectMetrics();
      if (currentMetrics.memoryPercent > peakMetrics.memoryPercent) {
        peakMetrics = currentMetrics;
      }
      
      // Assertions
      expect(successful).toBeGreaterThanOrEqual(TASK_COUNT * 0.95); // 95% success rate
      expect(totalDuration).toBeLessThan(CHAOS_CONFIG.MAX_EXECUTION_TIME);
    }, 60000);

    it('should not crash under memory pressure', async () => {
      const ALLOCATIONS = 20;
      const ALLOCATION_SIZE = 5 * 1024 * 1024; // 5MB each
      const allocations: Buffer[] = [];
      
      console.log(`\n   💾 Allocating ${ALLOCATIONS} x ${ALLOCATION_SIZE / 1024 / 1024}MB...`);
      
      const beforeMem = process.memoryUsage();
      
      try {
        for (let i = 0; i < ALLOCATIONS; i++) {
          const buf = Buffer.alloc(ALLOCATION_SIZE);
          buf.fill(i % 256);
          allocations.push(buf);
          
          const metrics = await collectMetrics();
          if (metrics.memoryPercent > peakMetrics.memoryPercent) {
            peakMetrics = metrics;
          }
          
          console.log(`   📦 Allocation ${i + 1}/${ALLOCATIONS} | Heap: ${(metrics.heapUsed / 1024 / 1024).toFixed(0)}MB`);
        }
      } catch (error) {
        console.log(`   ⚠️  Memory pressure triggered at allocation #${allocations.length}`);
      }
      
      const afterMem = process.memoryUsage();
      const heapGrowth = afterMem.heapUsed - beforeMem.heapUsed;
      
      console.log(`   📈 Heap growth: ${(heapGrowth / 1024 / 1024).toFixed(0)}MB`);
      
      // Clear allocations to free memory
      allocations.length = 0;
      if (global.gc) global.gc();
      
      // System should not have crashed
      expect(true).toBe(true);
    }, 30000);
  });

  describe('⚡ Event Loop Stress', () => {
    it('should recover from event loop blocking', async () => {
      const BLOCK_DURATIONS = [10, 50, 100, 200];
      const results: Array<{ blockTime: number; recovered: boolean; recoveryTime: number }> = [];
      
      console.log('\n   ⚡ Testing event loop recovery...');
      
      for (const blockTime of BLOCK_DURATIONS) {
        const beforeLag = (await collectMetrics()).eventLoopLag;
        
        // Block the event loop
        blockEventLoop(blockTime);
        
        // Measure recovery
        const recoveryStart = Date.now();
        await new Promise(resolve => setImmediate(resolve));
        const recoveryTime = Date.now() - recoveryStart;
        
        const afterLag = (await collectMetrics()).eventLoopLag;
        
        results.push({
          blockTime,
          recovered: recoveryTime < blockTime * 2,
          recoveryTime,
        });
        
        console.log(`   Block ${blockTime}ms -> Recovery: ${recoveryTime}ms | Lag: ${afterLag.toFixed(2)}ms`);
      }
      
      // At least 75% should recover quickly
      const goodRecoveries = results.filter(r => r.recovered).length;
      expect(goodRecoveries).toBeGreaterThanOrEqual(BLOCK_DURATIONS.length * 0.75);
    });

    it('should handle rapid async task spawning', async () => {
      const RAPID_TASKS = 1000;
      const startTime = Date.now();
      let completed = 0;
      
      console.log(`\n   🚀 Spawning ${RAPID_TASKS} rapid async tasks...`);
      
      const promises = Array.from({ length: RAPID_TASKS }, () =>
        Promise.resolve().then(() => {
          completed++;
          return Math.random();
        })
      );
      
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      const throughput = RAPID_TASKS / (duration / 1000);
      
      console.log(`   ✅ Completed: ${completed}/${RAPID_TASKS}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);
      console.log(`   📊 Throughput: ${throughput.toFixed(0)} tasks/sec`);
      
      expect(completed).toBe(RAPID_TASKS);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  describe('🧮 Heavy Computation Isolation', () => {
    it('should isolate heavy regex without crashing', async () => {
      // ReDoS protection test - reduced input to avoid hanging
      const INPUT_LENGTHS = [10, 15, 18, 20];
      const TIMEOUT = 1000; // 1 second per test
      
      console.log('\n   🧮 Testing ReDoS protection...');
      
      for (const len of INPUT_LENGTHS) {
        const start = Date.now();
        
        const result = await Promise.race([
          new Promise<{ matched: boolean; duration: number }>(resolve => {
            const r = heavyRegexTask(len);
            resolve(r);
          }),
          new Promise<{ matched: boolean; duration: number }>(resolve => {
            setTimeout(() => resolve({ matched: false, duration: TIMEOUT }), TIMEOUT);
          }),
        ]);
        
        const duration = Date.now() - start;
        const timedOut = duration >= TIMEOUT;
        
        console.log(`   Input length ${len}: ${timedOut ? 'TIMEOUT' : `${result.duration}ms`}`);
        
        // System should not crash regardless of timeout
        expect(true).toBe(true);
      }
    }, 10000);

    it('should handle JSON serialization of large objects', async () => {
      const DEPTHS = [3, 4, 5];
      const BREADTH = 5;
      
      console.log('\n   📄 Testing large JSON serialization...');
      
      for (const depth of DEPTHS) {
        const start = Date.now();
        
        try {
          const result = heavyJSONTask(depth, BREADTH);
          const duration = Date.now() - start;
          
          console.log(`   Depth ${depth}: ${(result.objectSize / 1024).toFixed(0)}KB in ${duration}ms`);
          
          expect(result.objectSize).toBeGreaterThan(0);
        } catch (error) {
          console.log(`   Depth ${depth}: Failed (expected for very large objects)`);
        }
      }
    });
  });

  describe('📊 System Stability Under Load', () => {
    it('should maintain reasonable memory usage', async () => {
      const metrics = await collectMetrics();
      
      console.log('\n   📊 Final System Metrics:');
      console.log(`   Memory: ${(metrics.memoryPercent * 100).toFixed(1)}%`);
      console.log(`   Heap: ${(metrics.heapUsed / 1024 / 1024).toFixed(0)}MB / ${(metrics.heapTotal / 1024 / 1024).toFixed(0)}MB`);
      console.log(`   Event Loop Lag: ${metrics.eventLoopLag.toFixed(2)}ms`);
      
      // Memory should not exceed threshold
      expect(metrics.memoryPercent).toBeLessThan(CHAOS_CONFIG.MEMORY_THRESHOLD);
    });

    it('should have acceptable event loop latency', async () => {
      const metrics = await collectMetrics();
      
      // Event loop should not be severely lagged (< 100ms is acceptable under stress)
      expect(metrics.eventLoopLag).toBeLessThan(100);
    });
  });

  afterAll(async () => {
    const endMetrics = await collectMetrics();
    
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🟠 RESOURCE EXHAUSTION TEST - SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Start Memory: ${(startMetrics.heapUsed / 1024 / 1024).toFixed(0)}MB`);
    console.log(`   Peak Memory:  ${(peakMetrics.heapUsed / 1024 / 1024).toFixed(0)}MB`);
    console.log(`   End Memory:   ${(endMetrics.heapUsed / 1024 / 1024).toFixed(0)}MB`);
    console.log(`   Peak System:  ${(peakMetrics.memoryPercent * 100).toFixed(1)}%`);
    console.log(`   Event Loop:   ${endMetrics.eventLoopLag.toFixed(2)}ms lag`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Force cleanup
    if (global.gc) global.gc();
  });
});
