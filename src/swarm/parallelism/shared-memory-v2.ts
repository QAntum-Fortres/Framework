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
 * For licensing inquiries: dimitar.prodromov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 SHARED MEMORY V2 - High-Performance Lock-Free Memory Manager
// ═══════════════════════════════════════════════════════════════════════════════
// Designed for zero-latency deadlock-free communication between 500+ workers.
// Uses AtomicInt32Array for L3 cache-optimized operations on Ryzen 7000 series.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Memory segment configuration
 */
export interface MemorySegmentConfig {
  /** Segment name */
  name: string;
  /** Size in bytes */
  size: number;
  /** Initial value pattern */
  initialValue?: number;
  /** Alignment in bytes (default: 64 for cache line) */
  alignment?: number;
}

/**
 * Shared memory statistics
 */
export interface SharedMemoryStats {
  totalAllocated: number;
  totalSegments: number;
  readOperations: number;
  writeOperations: number;
  casOperations: number;
  contentionCount: number;
  avgLatencyNs: number;
  peakLatencyNs: number;
}

/**
 * Memory operation result
 */
export interface MemoryOpResult<T = number> {
  success: boolean;
  value?: T;
  previousValue?: T;
  latencyNs: number;
}

/**
 * Memory segment with atomic operations
 */
export interface MemorySegment {
  id: string;
  name: string;
  buffer: SharedArrayBuffer;
  view: Int32Array;
  size: number;
  alignment: number;
  createdAt: number;
  lastAccess: number;
  accessCount: number;
}

/**
 * Lock state for spinlock
 */
const UNLOCKED = 0;
const LOCKED = 1;

/**
 * SharedMemoryV2 - Lock-Free High-Performance Memory Manager
 * 
 * Features:
 * - Zero GC pressure through SharedArrayBuffer
 * - Lock-free atomic operations via Atomics
 * - Cache-line aligned allocations for Ryzen L3 optimization
 * - Deadlock-free spinlocks with exponential backoff
 * - Real-time performance telemetry
 */
export class SharedMemoryV2 extends EventEmitter {
  private segments: Map<string, MemorySegment> = new Map();
  private segmentNameIndex: Map<string, string> = new Map();
  private nextSegmentId = 0;
  
  // Statistics
  private stats: SharedMemoryStats = {
    totalAllocated: 0,
    totalSegments: 0,
    readOperations: 0,
    writeOperations: 0,
    casOperations: 0,
    contentionCount: 0,
    avgLatencyNs: 0,
    peakLatencyNs: 0,
  };
  
  // Performance tracking
  private latencyBuffer: number[] = [];
  private readonly MAX_LATENCY_SAMPLES = 1000;
  
  // Default alignment for cache line (64 bytes for modern CPUs)
  private readonly CACHE_LINE_SIZE = 64;
  
  constructor() {
    super();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📦 SEGMENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Allocate a new memory segment
   */
  allocateSegment(config: MemorySegmentConfig): MemorySegment {
    const segmentId = `seg_${++this.nextSegmentId}_${Date.now().toString(36)}`;
    
    // Ensure cache-line alignment
    const alignment = config.alignment ?? this.CACHE_LINE_SIZE;
    const alignedSize = this.alignSize(config.size, alignment);
    
    // Create SharedArrayBuffer for zero-copy inter-worker communication
    const buffer = new SharedArrayBuffer(alignedSize);
    const view = new Int32Array(buffer);
    
    // Initialize with pattern if specified
    if (config.initialValue !== undefined) {
      view.fill(config.initialValue);
    }
    
    const segment: MemorySegment = {
      id: segmentId,
      name: config.name,
      buffer,
      view,
      size: alignedSize,
      alignment,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      accessCount: 0,
    };
    
    this.segments.set(segmentId, segment);
    this.segmentNameIndex.set(config.name, segmentId);
    
    this.stats.totalAllocated += alignedSize;
    this.stats.totalSegments++;
    
    this.emit('segmentAllocated', { 
      id: segmentId, 
      name: config.name, 
      size: alignedSize 
    });
    
    return segment;
  }

  /**
   * Get segment by ID
   */
  getSegment(id: string): MemorySegment | undefined {
    return this.segments.get(id);
  }

  /**
   * Get segment by name
   */
  getSegmentByName(name: string): MemorySegment | undefined {
    const id = this.segmentNameIndex.get(name);
    return id ? this.segments.get(id) : undefined;
  }

  /**
   * Deallocate a segment
   */
  deallocateSegment(id: string): boolean {
    const segment = this.segments.get(id);
    if (!segment) return false;
    
    this.stats.totalAllocated -= segment.size;
    this.stats.totalSegments--;
    
    this.segments.delete(id);
    this.segmentNameIndex.delete(segment.name);
    
    this.emit('segmentDeallocated', { id, name: segment.name });
    
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚡ ATOMIC OPERATIONS - Lock-Free Memory Access
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Atomic read operation
   */
  atomicRead(segmentId: string, index: number): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || index >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    // Use Atomics.load for memory barrier guarantee
    const value = Atomics.load(segment.view, index);
    
    segment.lastAccess = Date.now();
    segment.accessCount++;
    this.stats.readOperations++;
    
    const latency = this.getHighResTime() - startTime;
    this.recordLatency(latency);
    
    return { success: true, value, latencyNs: latency };
  }

  /**
   * Atomic write operation
   */
  atomicWrite(segmentId: string, index: number, value: number): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || index >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    // Use Atomics.store for memory barrier guarantee
    const previousValue = Atomics.exchange(segment.view, index, value);
    
    segment.lastAccess = Date.now();
    segment.accessCount++;
    this.stats.writeOperations++;
    
    const latency = this.getHighResTime() - startTime;
    this.recordLatency(latency);
    
    return { success: true, value, previousValue, latencyNs: latency };
  }

  /**
   * Compare-and-swap (CAS) operation - Foundation for lock-free algorithms
   */
  compareAndSwap(
    segmentId: string, 
    index: number, 
    expectedValue: number, 
    newValue: number
  ): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || index >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    // Atomic CAS operation
    const actualValue = Atomics.compareExchange(
      segment.view, 
      index, 
      expectedValue, 
      newValue
    );
    
    const success = actualValue === expectedValue;
    
    if (!success) {
      this.stats.contentionCount++;
    }
    
    segment.lastAccess = Date.now();
    segment.accessCount++;
    this.stats.casOperations++;
    
    const latency = this.getHighResTime() - startTime;
    this.recordLatency(latency);
    
    return { 
      success, 
      value: success ? newValue : actualValue,
      previousValue: actualValue,
      latencyNs: latency 
    };
  }

  /**
   * Atomic add operation
   */
  atomicAdd(segmentId: string, index: number, addend: number): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || index >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    const previousValue = Atomics.add(segment.view, index, addend);
    
    segment.lastAccess = Date.now();
    segment.accessCount++;
    this.stats.writeOperations++;
    
    const latency = this.getHighResTime() - startTime;
    this.recordLatency(latency);
    
    return { 
      success: true, 
      value: previousValue + addend, 
      previousValue, 
      latencyNs: latency 
    };
  }

  /**
   * Atomic bitwise OR operation
   */
  atomicOr(segmentId: string, index: number, mask: number): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || index >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    const previousValue = Atomics.or(segment.view, index, mask);
    
    segment.lastAccess = Date.now();
    segment.accessCount++;
    this.stats.writeOperations++;
    
    const latency = this.getHighResTime() - startTime;
    this.recordLatency(latency);
    
    return { 
      success: true, 
      value: previousValue | mask, 
      previousValue, 
      latencyNs: latency 
    };
  }

  /**
   * Atomic bitwise AND operation
   */
  atomicAnd(segmentId: string, index: number, mask: number): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || index >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    const previousValue = Atomics.and(segment.view, index, mask);
    
    segment.lastAccess = Date.now();
    segment.accessCount++;
    this.stats.writeOperations++;
    
    const latency = this.getHighResTime() - startTime;
    this.recordLatency(latency);
    
    return { 
      success: true, 
      value: previousValue & mask, 
      previousValue, 
      latencyNs: latency 
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔒 SPINLOCK - Deadlock-Free Synchronization
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Acquire spinlock with exponential backoff
   * Returns lock acquisition time in nanoseconds
   */
  acquireSpinlock(segmentId: string, lockIndex: number, maxSpins = 1000): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || lockIndex >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    let spins = 0;
    let backoff = 1;
    
    while (spins < maxSpins) {
      // Try to acquire lock (CAS: 0 -> 1)
      const previousValue = Atomics.compareExchange(
        segment.view, 
        lockIndex, 
        UNLOCKED, 
        LOCKED
      );
      
      if (previousValue === UNLOCKED) {
        // Lock acquired successfully
        const latency = this.getHighResTime() - startTime;
        this.recordLatency(latency);
        
        return { success: true, value: LOCKED, latencyNs: latency };
      }
      
      // Exponential backoff to reduce contention
      this.spinWait(backoff);
      backoff = Math.min(backoff * 2, 128);
      spins++;
      this.stats.contentionCount++;
    }
    
    // Lock acquisition failed after max spins
    const latency = this.getHighResTime() - startTime;
    return { success: false, latencyNs: latency };
  }

  /**
   * Release spinlock
   */
  releaseSpinlock(segmentId: string, lockIndex: number): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || lockIndex >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    // Release lock (store 0)
    const previousValue = Atomics.exchange(segment.view, lockIndex, UNLOCKED);
    
    // Wake up waiting workers
    Atomics.notify(segment.view, lockIndex, 1);
    
    const latency = this.getHighResTime() - startTime;
    
    return { 
      success: previousValue === LOCKED, 
      previousValue, 
      latencyNs: latency 
    };
  }

  /**
   * Wait for lock with timeout
   */
  waitForLock(
    segmentId: string, 
    lockIndex: number, 
    timeoutMs: number = 1000
  ): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || lockIndex >= segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    // Wait for unlock notification
    const result = Atomics.wait(segment.view, lockIndex, LOCKED, timeoutMs);
    
    const latency = this.getHighResTime() - startTime;
    
    return {
      success: result === 'ok' || result === 'not-equal',
      latencyNs: latency,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📊 RING BUFFER - Lock-Free FIFO Queue
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a lock-free ring buffer segment
   * Layout: [head (4 bytes), tail (4 bytes), size (4 bytes), data...]
   */
  createRingBuffer(name: string, capacity: number): MemorySegment {
    const headerSize = 3; // head, tail, size indices
    const totalSize = (headerSize + capacity) * 4; // Int32 size
    
    const segment = this.allocateSegment({
      name,
      size: totalSize,
    });
    
    // Initialize header
    Atomics.store(segment.view, 0, 0); // head = 0
    Atomics.store(segment.view, 1, 0); // tail = 0
    Atomics.store(segment.view, 2, capacity); // size = capacity
    
    return segment;
  }

  /**
   * Push to ring buffer (lock-free)
   */
  ringBufferPush(segmentId: string, value: number): boolean {
    const segment = this.segments.get(segmentId);
    if (!segment) return false;
    
    const capacity = Atomics.load(segment.view, 2);
    const headerOffset = 3;
    
    while (true) {
      const tail = Atomics.load(segment.view, 1);
      const head = Atomics.load(segment.view, 0);
      
      const nextTail = (tail + 1) % capacity;
      
      // Check if buffer is full
      if (nextTail === head) {
        return false; // Buffer full
      }
      
      // Try to advance tail
      const actualTail = Atomics.compareExchange(segment.view, 1, tail, nextTail);
      
      if (actualTail === tail) {
        // Successfully claimed slot, write data
        Atomics.store(segment.view, headerOffset + tail, value);
        return true;
      }
      
      // Another thread advanced tail, retry
      this.stats.contentionCount++;
    }
  }

  /**
   * Pop from ring buffer (lock-free)
   */
  ringBufferPop(segmentId: string): MemoryOpResult {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      return { success: false, latencyNs: 0 };
    }
    
    const capacity = Atomics.load(segment.view, 2);
    const headerOffset = 3;
    
    while (true) {
      const head = Atomics.load(segment.view, 0);
      const tail = Atomics.load(segment.view, 1);
      
      // Check if buffer is empty
      if (head === tail) {
        return { success: false, latencyNs: 0 }; // Buffer empty
      }
      
      // Read data before advancing head
      const value = Atomics.load(segment.view, headerOffset + head);
      
      const nextHead = (head + 1) % capacity;
      
      // Try to advance head
      const actualHead = Atomics.compareExchange(segment.view, 0, head, nextHead);
      
      if (actualHead === head) {
        // Successfully popped
        return { success: true, value, latencyNs: 0 };
      }
      
      // Another thread advanced head, retry
      this.stats.contentionCount++;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔄 BULK OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Bulk read operation (returns copy)
   */
  bulkRead(segmentId: string, startIndex: number, length: number): MemoryOpResult<Int32Array> {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || startIndex + length > segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    // Create copy to avoid race conditions
    const result = new Int32Array(length);
    for (let i = 0; i < length; i++) {
      result[i] = Atomics.load(segment.view, startIndex + i);
    }
    
    segment.lastAccess = Date.now();
    segment.accessCount += length;
    this.stats.readOperations += length;
    
    const latency = this.getHighResTime() - startTime;
    this.recordLatency(latency);
    
    return { success: true, value: result, latencyNs: latency };
  }

  /**
   * Bulk write operation
   */
  bulkWrite(segmentId: string, startIndex: number, data: Int32Array): MemoryOpResult {
    const startTime = this.getHighResTime();
    const segment = this.segments.get(segmentId);
    
    if (!segment || startIndex + data.length > segment.view.length) {
      return { success: false, latencyNs: this.getHighResTime() - startTime };
    }
    
    for (let i = 0; i < data.length; i++) {
      const value = data[i];
      if (value !== undefined) {
        Atomics.store(segment.view, startIndex + i, value);
      }
    }
    
    segment.lastAccess = Date.now();
    segment.accessCount += data.length;
    this.stats.writeOperations += data.length;
    
    const latency = this.getHighResTime() - startTime;
    this.recordLatency(latency);
    
    return { success: true, latencyNs: latency };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 📈 STATISTICS & MONITORING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current statistics
   */
  getStats(): SharedMemoryStats {
    return { ...this.stats };
  }

  /**
   * Get detailed segment info
   */
  getSegmentInfo(segmentId: string): {
    id: string;
    name: string;
    size: number;
    alignment: number;
    accessCount: number;
    createdAt: number;
    lastAccess: number;
  } | undefined {
    const segment = this.segments.get(segmentId);
    if (!segment) return undefined;
    
    return {
      id: segment.id,
      name: segment.name,
      size: segment.size,
      alignment: segment.alignment,
      accessCount: segment.accessCount,
      createdAt: segment.createdAt,
      lastAccess: segment.lastAccess,
    };
  }

  /**
   * Get all segment names
   */
  getSegmentNames(): string[] {
    return Array.from(this.segmentNameIndex.keys());
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalAllocated: this.stats.totalAllocated,
      totalSegments: this.stats.totalSegments,
      readOperations: 0,
      writeOperations: 0,
      casOperations: 0,
      contentionCount: 0,
      avgLatencyNs: 0,
      peakLatencyNs: 0,
    };
    this.latencyBuffer = [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🛠️ INTERNAL UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Align size to cache line
   */
  private alignSize(size: number, alignment: number): number {
    return Math.ceil(size / alignment) * alignment;
  }

  /**
   * Get high-resolution time in nanoseconds
   */
  private getHighResTime(): number {
    const [seconds, nanoseconds] = process.hrtime();
    return seconds * 1e9 + nanoseconds;
  }

  /**
   * Record latency for statistics
   */
  private recordLatency(latencyNs: number): void {
    this.latencyBuffer.push(latencyNs);
    
    if (this.latencyBuffer.length > this.MAX_LATENCY_SAMPLES) {
      this.latencyBuffer.shift();
    }
    
    // Update stats
    const sum = this.latencyBuffer.reduce((a, b) => a + b, 0);
    this.stats.avgLatencyNs = sum / this.latencyBuffer.length;
    this.stats.peakLatencyNs = Math.max(this.stats.peakLatencyNs, latencyNs);
  }

  /**
   * CPU spin wait (reduces bus contention)
   */
  private spinWait(iterations: number): void {
    for (let i = 0; i < iterations; i++) {
      // Intentional spin wait - compiler won't optimize away
      Math.random();
    }
  }

  /**
   * Cleanup all segments
   */
  cleanup(): void {
    const ids = Array.from(this.segments.keys());
    for (const id of ids) {
      this.deallocateSegment(id);
    }
    this.resetStats();
    this.emit('cleanup');
  }
}

// Export singleton for global use
let sharedMemoryInstance: SharedMemoryV2 | null = null;

export function getSharedMemoryV2(): SharedMemoryV2 {
  if (!sharedMemoryInstance) {
    sharedMemoryInstance = new SharedMemoryV2();
  }
  return sharedMemoryInstance;
}

export default SharedMemoryV2;
