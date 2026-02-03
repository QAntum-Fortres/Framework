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

import { Transform, Readable, Writable, pipeline } from 'node:stream';
import { promisify } from 'node:util';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip, createGunzip } from 'node:zlib';
import { EventEmitter } from 'node:events';

const pipelineAsync = promisify(pipeline);

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stream processing options
 */
export interface StreamProcessorOptions {
  /** High water mark for streams (default: 64KB) */
  highWaterMark?: number;
  /** Enable automatic backpressure handling */
  autoBackpressure?: boolean;
  /** Maximum memory threshold before pausing (bytes) */
  memoryThreshold?: number;
  /** Enable gzip compression for output */
  compress?: boolean;
}

/**
 * JSON streaming options
 */
export interface JSONStreamOptions {
  /** Path to array within JSON (e.g., 'data.items') */
  jsonPath?: string;
  /** Parse as NDJSON (newline-delimited JSON) */
  ndjson?: boolean;
  /** Buffer size for parsing */
  bufferSize?: number;
}

/**
 * Batch processing options
 */
export interface BatchOptions<T> {
  /** Number of items per batch */
  batchSize: number;
  /** Process function for each batch */
  processor: (batch: T[]) => Promise<void>;
  /** Max concurrent batches */
  concurrency?: number;
  /** Timeout per batch in ms */
  timeout?: number;
}

/**
 * Stream statistics
 */
export interface StreamStats {
  bytesProcessed: number;
  itemsProcessed: number;
  batchesProcessed: number;
  errors: number;
  startTime: number;
  throughput: number;
  memoryPeakUsage: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON LINE PARSER TRANSFORM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transform stream that parses JSON lines (NDJSON)
 * Each line is parsed independently, preventing memory overflow
 */
export class JSONLineParser extends Transform {
  private buffer = '';
  private lineCount = 0;

  constructor() {
    super({ objectMode: true });
  }

  _transform(chunk: Buffer, encoding: string, callback: Function): void {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    
    // Keep incomplete last line in buffer
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        this.lineCount++;
        this.push(parsed);
      } catch (error) {
        this.emit('parseError', { line: this.lineCount, error, content: trimmed });
      }
    }

    callback();
  }

  _flush(callback: Function): void {
    // Process remaining buffer
    const trimmed = this.buffer.trim();
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed);
        this.push(parsed);
      } catch (error) {
        this.emit('parseError', { line: this.lineCount, error, content: trimmed });
      }
    }
    callback();
  }

  getLineCount(): number {
    return this.lineCount;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSON ARRAY PARSER TRANSFORM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transform stream that parses large JSON arrays item by item
 * Uses minimal memory by streaming array elements
 */
export class JSONArrayParser extends Transform {
  private buffer = '';
  private depth = 0;
  private inArray = false;
  private itemStart = -1;
  private itemCount = 0;
  private jsonPath: string[];

  constructor(options: { jsonPath?: string } = {}) {
    super({ objectMode: true });
    this.jsonPath = options.jsonPath?.split('.') ?? [];
  }

  _transform(chunk: Buffer, encoding: string, callback: Function): void {
    const str = chunk.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      this.buffer += char;

      if (char === '[' && !this.inArray) {
        this.depth++;
        if (this.depth === this.jsonPath.length + 1) {
          this.inArray = true;
          this.itemStart = this.buffer.length;
        }
      } else if (char === ']' && this.inArray) {
        this.depth--;
        if (this.depth === this.jsonPath.length) {
          this.inArray = false;
        }
      } else if (char === '{') {
        if (this.inArray && this.itemStart === -1) {
          this.itemStart = this.buffer.length - 1;
        }
        this.depth++;
      } else if (char === '}') {
        this.depth--;
        if (this.inArray && this.depth === this.jsonPath.length + 1) {
          // Complete item found
          const itemStr = this.buffer.slice(this.itemStart);
          try {
            const item = JSON.parse(itemStr);
            this.itemCount++;
            this.push(item);
          } catch (error) {
            this.emit('parseError', { item: this.itemCount, error });
          }
          this.itemStart = -1;
          // Clear processed buffer to save memory
          this.buffer = '';
        }
      } else if (char === ',' && this.inArray && this.depth === this.jsonPath.length + 1) {
        this.itemStart = -1;
      }
    }

    callback();
  }

  _flush(callback: Function): void {
    callback();
  }

  getItemCount(): number {
    return this.itemCount;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATCH PROCESSOR TRANSFORM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transform stream that batches items for efficient processing
 */
export class BatchProcessor<T> extends Transform {
  private batch: T[] = [];
  private batchSize: number;
  private processor: (batch: T[]) => Promise<void>;
  private batchCount = 0;
  private processing = false;
  private queue: T[][] = [];
  private concurrency: number;
  private activeProcessors = 0;

  constructor(options: BatchOptions<T>) {
    super({ objectMode: true });
    this.batchSize = options.batchSize;
    this.processor = options.processor;
    this.concurrency = options.concurrency ?? 1;
  }

  _transform(item: T, encoding: string, callback: (error?: Error | null) => void): void {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      this.queue.push([...this.batch]);
      this.batch = [];
      this.processQueue().then(() => callback()).catch((err) => callback(err as Error));
    } else {
      callback();
    }
  }

  _flush(callback: (error?: Error | null) => void): void {
    // Process remaining items
    if (this.batch.length > 0) {
      this.queue.push([...this.batch]);
      this.batch = [];
    }

    this.flushQueue()
      .then(() => callback())
      .catch((err) => callback(err as Error));
  }

  private async flushQueue(): Promise<void> {
    // Process all remaining batches
    const promises: Promise<void>[] = [];
    while (this.queue.length > 0) {
      const batch = this.queue.shift();
      if (batch) {
        promises.push(this.processBatch(batch));
      }
    }
    await Promise.all(promises);
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.activeProcessors < this.concurrency) {
      const batch = this.queue.shift();
      if (batch) {
        this.activeProcessors++;
        this.processBatch(batch).finally(() => {
          this.activeProcessors--;
        });
      }
    }
  }

  private async processBatch(batch: T[]): Promise<void> {
    try {
      await this.processor(batch);
      this.batchCount++;
      this.push({ batchNumber: this.batchCount, itemCount: batch.length });
    } catch (error) {
      this.emit('batchError', { batch: this.batchCount, error });
    }
  }

  getBatchCount(): number {
    return this.batchCount;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY-AWARE THROTTLE TRANSFORM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transform stream that throttles based on memory pressure
 * Pauses upstream when memory threshold is exceeded
 */
export class MemoryThrottleTransform extends Transform {
  private threshold: number;
  private checkInterval: number;
  private _isPausedByMemory = false;
  private timer?: NodeJS.Timeout;
  private peakMemory = 0;

  constructor(options: { threshold?: number; checkInterval?: number } = {}) {
    super({ objectMode: true });
    this.threshold = options.threshold ?? 0.8 * 24 * 1024 * 1024 * 1024; // 80% of 24GB
    this.checkInterval = options.checkInterval ?? 1000;
    this.startMemoryMonitor();
  }

  /** Check if stream is paused due to memory pressure */
  get isPausedByMemory(): boolean {
    return this._isPausedByMemory;
  }

  private startMemoryMonitor(): void {
    this.timer = setInterval(() => {
      const usage = process.memoryUsage();
      this.peakMemory = Math.max(this.peakMemory, usage.heapUsed);

      if (usage.heapUsed > this.threshold && !this._isPausedByMemory) {
        this._isPausedByMemory = true;
        this.emit('pause', { reason: 'memory', usage: usage.heapUsed });
      } else if (usage.heapUsed < this.threshold * 0.7 && this._isPausedByMemory) {
        this._isPausedByMemory = false;
        this.emit('resume', { usage: usage.heapUsed });
      }
    }, this.checkInterval);
  }

  _transform(chunk: unknown, encoding: string, callback: Function): void {
    if (this._isPausedByMemory) {
      // Wait for memory to free up
      const waitForMemory = setInterval(() => {
        if (!this._isPausedByMemory) {
          clearInterval(waitForMemory);
          this.push(chunk);
          callback();
        }
      }, 100);
    } else {
      this.push(chunk);
      callback();
    }
  }

  _destroy(error: Error | null, callback: (error: Error | null) => void): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    callback(error);
  }

  getPeakMemory(): number {
    return this.peakMemory;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAM PROCESSOR FACADE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 📊 Stream Processor
 * 
 * High-level API for memory-efficient data processing.
 * Optimized for 24GB RAM Ryzen systems.
 */
export class StreamProcessor extends EventEmitter {
  private options: Required<StreamProcessorOptions>;
  private stats: StreamStats = {
    bytesProcessed: 0,
    itemsProcessed: 0,
    batchesProcessed: 0,
    errors: 0,
    startTime: 0,
    throughput: 0,
    memoryPeakUsage: 0
  };

  constructor(options: StreamProcessorOptions = {}) {
    super();
    this.options = {
      highWaterMark: options.highWaterMark ?? 64 * 1024, // 64KB
      autoBackpressure: options.autoBackpressure ?? true,
      memoryThreshold: options.memoryThreshold ?? 0.7 * 24 * 1024 * 1024 * 1024, // 70% of 24GB
      compress: options.compress ?? false
    };
  }

  /**
   * Process a large JSON file as a stream
   * @param inputPath - Path to input file
   * @param processor - Function to process each item
   * @param options - JSON streaming options
   */
  async processJSONFile<T>(
    inputPath: string,
    processor: (item: T) => Promise<void>,
    options: JSONStreamOptions = {}
  ): Promise<StreamStats> {
    this.resetStats();

    const readStream = createReadStream(inputPath, {
      highWaterMark: this.options.highWaterMark
    });

    const parser = options.ndjson 
      ? new JSONLineParser()
      : new JSONArrayParser({ jsonPath: options.jsonPath });

    const memoryThrottle = new MemoryThrottleTransform({
      threshold: this.options.memoryThreshold
    });

    // Track bytes
    readStream.on('data', (chunk: string | Buffer) => {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      this.stats.bytesProcessed += buffer.length;
    });

    // Process items
    const processTransform = new Transform({
      objectMode: true,
      transform: async (item, encoding, callback) => {
        try {
          await processor(item as T);
          this.stats.itemsProcessed++;
          callback();
        } catch (error) {
          this.stats.errors++;
          this.emit('processingError', { item, error });
          callback();
        }
      }
    });

    // Handle errors
    parser.on('parseError', (err: Error) => {
      this.stats.errors++;
      this.emit('parseError', err);
    });

    memoryThrottle.on('pause', (info: { reason: string; usage: number }) => {
      this.emit('memoryPressure', info);
    });

    try {
      await pipelineAsync(
        readStream,
        parser,
        memoryThrottle,
        processTransform
      );

      this.finalizeStats(memoryThrottle.getPeakMemory());
      return this.stats;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Process a large JSON file in batches
   * @param inputPath - Path to input file
   * @param options - Batch processing options
   */
  async processJSONInBatches<T>(
    inputPath: string,
    options: BatchOptions<T> & JSONStreamOptions
  ): Promise<StreamStats> {
    this.resetStats();

    const readStream = createReadStream(inputPath, {
      highWaterMark: this.options.highWaterMark
    });

    const parser = options.ndjson
      ? new JSONLineParser()
      : new JSONArrayParser({ jsonPath: options.jsonPath });

    const batchProcessor = new BatchProcessor<T>({
      batchSize: options.batchSize,
      processor: options.processor,
      concurrency: options.concurrency,
      timeout: options.timeout
    });

    const memoryThrottle = new MemoryThrottleTransform({
      threshold: this.options.memoryThreshold
    });

    // Track bytes
    readStream.on('data', (chunk: string | Buffer) => {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      this.stats.bytesProcessed += buffer.length;
    });

    // Track batches
    batchProcessor.on('data', (result: { batchNumber: number; itemCount: number }) => {
      this.stats.batchesProcessed = result.batchNumber;
      this.stats.itemsProcessed += result.itemCount;
    });

    batchProcessor.on('batchError', (err: Error) => {
      this.stats.errors++;
      this.emit('batchError', err);
    });

    try {
      await pipelineAsync(
        readStream,
        parser,
        memoryThrottle,
        batchProcessor
      );

      this.finalizeStats(memoryThrottle.getPeakMemory());
      return this.stats;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Stream data from one file to another with transformation
   * @param inputPath - Source file path
   * @param outputPath - Destination file path  
   * @param transform - Transform function for each item
   */
  async transformFile<TInput, TOutput>(
    inputPath: string,
    outputPath: string,
    transform: (item: TInput) => TOutput | Promise<TOutput>,
    options: JSONStreamOptions = {}
  ): Promise<StreamStats> {
    this.resetStats();

    const readStream = createReadStream(inputPath, {
      highWaterMark: this.options.highWaterMark
    });

    const parser = options.ndjson
      ? new JSONLineParser()
      : new JSONArrayParser({ jsonPath: options.jsonPath });

    // Transform each item
    const transformStream = new Transform({
      objectMode: true,
      transform: async (item, encoding, callback) => {
        try {
          const transformed = await transform(item as TInput);
          this.stats.itemsProcessed++;
          callback(null, JSON.stringify(transformed) + '\n');
        } catch (error) {
          this.stats.errors++;
          this.emit('transformError', { item, error });
          callback();
        }
      }
    });

    const writeStream = createWriteStream(outputPath);

    const streams: (Readable | Transform | Writable)[] = [
      readStream,
      parser as Transform,
      transformStream
    ];

    if (this.options.compress) {
      streams.push(createGzip());
    }

    streams.push(writeStream);

    // Track bytes
    readStream.on('data', (chunk: string | Buffer) => {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      this.stats.bytesProcessed += buffer.length;
    });

    try {
      // Use manual piping for better type control
      await new Promise<void>((resolve, reject) => {
        let currentStream: Readable | Transform = readStream;
        
        for (let i = 1; i < streams.length; i++) {
          const nextStream = streams[i];
          currentStream = currentStream.pipe(nextStream as Transform | Writable) as Transform;
        }
        
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        readStream.on('error', reject);
      });
      
      this.finalizeStats(process.memoryUsage().heapUsed);
      return this.stats;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Create a readable stream from an async generator
   * @param generator - Async generator function
   */
  createReadableFromGenerator<T>(
    generator: AsyncGenerator<T, void, unknown>
  ): Readable {
    return Readable.from(generator, { objectMode: true });
  }

  /**
   * Create a writable stream that collects items
   * @param maxItems - Maximum items to collect (prevents memory issues)
   */
  createCollectorStream<T>(maxItems = 10000): Writable & { getItems(): T[] } {
    const items: T[] = [];

    const writable = new Writable({
      objectMode: true,
      write(chunk: T, encoding, callback) {
        if (items.length < maxItems) {
          items.push(chunk);
          callback();
        } else {
          callback(new Error(`Maximum items (${maxItems}) exceeded`));
        }
      }
    });

    // Extend the writable with getItems method
    const writableWithGetItems = writable as Writable & { getItems(): T[] };
    writableWithGetItems.getItems = () => items;
    return writableWithGetItems;
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      bytesProcessed: 0,
      itemsProcessed: 0,
      batchesProcessed: 0,
      errors: 0,
      startTime: Date.now(),
      throughput: 0,
      memoryPeakUsage: 0
    };
  }

  /**
   * Finalize statistics
   */
  private finalizeStats(peakMemory: number): void {
    const duration = (Date.now() - this.stats.startTime) / 1000; // seconds
    this.stats.throughput = duration > 0 ? this.stats.itemsProcessed / duration : 0;
    this.stats.memoryPeakUsage = peakMemory;
  }

  /**
   * Get current statistics
   */
  getStats(): StreamStats {
    return { ...this.stats };
  }
}

export default StreamProcessor;
