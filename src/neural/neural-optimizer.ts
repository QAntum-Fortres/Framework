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
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 NEURAL OPTIMIZER - Knowledge Compression & LRU Cache
// ═══════════════════════════════════════════════════════════════════════════════
// Optimizes memory usage through intelligent caching and pattern deduplication
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LRU Cache Node for doubly linked list
 */
interface LRUNode<K, V> {
    key: K;
    value: V;
    prev: LRUNode<K, V> | null;
    next: LRUNode<K, V> | null;
    accessCount: number;
    lastAccess: number;
    size: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    currentSize: number;
    maxSize: number;
    itemCount: number;
    hitRate: number;
    memoryUsage: number;
}

/**
 * Pattern for deduplication
 */
export interface Pattern {
    id: string;
    pattern: string;
    frequency: number;
    lastSeen: number;
    contexts: string[];
}

/**
 * Compressed heuristics structure
 */
export interface CompressedHeuristics {
    version: string;
    compressionRatio: number;
    patterns: Pattern[];
    selectors: Map<string, number>; // selector -> pattern ID reference
    metadata: {
        originalSize: number;
        compressedSize: number;
        patternCount: number;
        timestamp: number;
    };
}

/**
 * 🧠 LRUCache - Least Recently Used Cache Implementation
 * 
 * High-performance cache with O(1) get/put operations.
 * Automatically evicts least recently used items when capacity is reached.
 */
export class LRUCache<K, V> extends EventEmitter {
    private capacity: number;
    private maxMemory: number;
    private cache: Map<K, LRUNode<K, V>>;
    private head: LRUNode<K, V> | null = null;
    private tail: LRUNode<K, V> | null = null;
    private currentMemory: number = 0;
    
    // Statistics
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        currentSize: 0,
        maxSize: 0,
        itemCount: 0,
        hitRate: 0,
        memoryUsage: 0
    };
    
    constructor(capacity: number = 1000, maxMemoryMB: number = 100) {
        super();
        this.capacity = capacity;
        this.maxMemory = maxMemoryMB * 1024 * 1024; // Convert to bytes
        this.cache = new Map();
        this.stats.maxSize = capacity;
    }
    
    /**
     * Get value from cache
     */
    get(key: K): V | undefined {
        const node = this.cache.get(key);
        
        if (!node) {
            this.stats.misses++;
            this.updateHitRate();
            return undefined;
        }
        
        // Update access info
        node.accessCount++;
        node.lastAccess = Date.now();
        
        // Move to head (most recently used)
        this.moveToHead(node);
        
        this.stats.hits++;
        this.updateHitRate();
        
        return node.value;
    }
    
    /**
     * Put value in cache
     */
    put(key: K, value: V, sizeBytes?: number): void {
        const size = sizeBytes || this.estimateSize(value);
        
        // Check if key exists
        const existing = this.cache.get(key);
        if (existing) {
            // Update existing node
            this.currentMemory -= existing.size;
            existing.value = value;
            existing.size = size;
            existing.accessCount++;
            existing.lastAccess = Date.now();
            this.currentMemory += size;
            this.moveToHead(existing);
            return;
        }
        
        // Evict if necessary
        while (this.shouldEvict(size)) {
            this.evictLRU();
        }
        
        // Create new node
        const node: LRUNode<K, V> = {
            key,
            value,
            prev: null,
            next: null,
            accessCount: 1,
            lastAccess: Date.now(),
            size
        };
        
        // Add to cache and list
        this.cache.set(key, node);
        this.addToHead(node);
        this.currentMemory += size;
        
        this.stats.currentSize = this.cache.size;
        this.stats.itemCount = this.cache.size;
        this.stats.memoryUsage = this.currentMemory;
        
        this.emit('put', { key, size });
    }
    
    /**
     * Check if key exists
     */
    has(key: K): boolean {
        return this.cache.has(key);
    }
    
    /**
     * Delete key from cache
     */
    delete(key: K): boolean {
        const node = this.cache.get(key);
        if (!node) return false;
        
        this.removeNode(node);
        this.cache.delete(key);
        this.currentMemory -= node.size;
        
        this.stats.currentSize = this.cache.size;
        this.stats.itemCount = this.cache.size;
        this.stats.memoryUsage = this.currentMemory;
        
        return true;
    }
    
    /**
     * Clear the cache
     */
    clear(): void {
        this.cache.clear();
        this.head = null;
        this.tail = null;
        this.currentMemory = 0;
        
        this.stats.currentSize = 0;
        this.stats.itemCount = 0;
        this.stats.memoryUsage = 0;
        
        this.emit('clear');
    }
    
    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }
    
    /**
     * Get most frequently accessed items
     */
    getHotItems(count: number = 10): Array<{ key: K; accessCount: number }> {
        const items: Array<{ key: K; accessCount: number }> = [];
        
        for (const [key, node] of this.cache) {
            items.push({ key, accessCount: node.accessCount });
        }
        
        return items
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, count);
    }
    
    /**
     * Move node to head of list
     */
    private moveToHead(node: LRUNode<K, V>): void {
        if (node === this.head) return;
        
        this.removeNode(node);
        this.addToHead(node);
    }
    
    /**
     * Add node to head
     */
    private addToHead(node: LRUNode<K, V>): void {
        node.prev = null;
        node.next = this.head;
        
        if (this.head) {
            this.head.prev = node;
        }
        
        this.head = node;
        
        if (!this.tail) {
            this.tail = node;
        }
    }
    
    /**
     * Remove node from list
     */
    private removeNode(node: LRUNode<K, V>): void {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }
        
        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }
    }
    
    /**
     * Check if eviction is needed
     */
    private shouldEvict(incomingSize: number): boolean {
        return (
            this.cache.size >= this.capacity ||
            this.currentMemory + incomingSize > this.maxMemory
        );
    }
    
    /**
     * Evict least recently used item
     */
    private evictLRU(): void {
        if (!this.tail) return;
        
        const lru = this.tail;
        this.removeNode(lru);
        this.cache.delete(lru.key);
        this.currentMemory -= lru.size;
        
        this.stats.evictions++;
        
        this.emit('eviction', { key: lru.key, accessCount: lru.accessCount });
    }
    
    /**
     * Update hit rate statistic
     */
    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    }
    
    /**
     * Estimate size of value in bytes
     */
    private estimateSize(value: V): number {
        if (typeof value === 'string') {
            return value.length * 2; // UTF-16
        }
        if (typeof value === 'number') {
            return 8;
        }
        if (Buffer.isBuffer(value)) {
            return value.length;
        }
        // Rough estimate for objects
        return JSON.stringify(value).length * 2;
    }
    
    /**
     * Get current size
     */
    get size(): number {
        return this.cache.size;
    }
}

/**
 * 🗜️ PatternDeduplicator - Compresses repetitive patterns
 * 
 * Identifies and deduplicates common patterns in selector data
 * to reduce memory footprint and improve lookup speed.
 */
export class PatternDeduplicator extends EventEmitter {
    private patterns: Map<string, Pattern> = new Map();
    private patternIndex: Map<string, string> = new Map(); // hash -> pattern ID
    private nextPatternId: number = 1;
    
    /**
     * Extract and deduplicate patterns from selectors
     */
    deduplicate(selectors: string[]): {
        compressed: Map<string, string>; // selector -> pattern ID
        patterns: Pattern[];
        compressionRatio: number;
    } {
        const compressed = new Map<string, string>();
        const originalSize = selectors.join('').length;
        
        for (const selector of selectors) {
            // Extract common patterns
            const patterns = this.extractPatterns(selector);
            
            for (const pattern of patterns) {
                const patternId = this.getOrCreatePattern(pattern, selector);
                compressed.set(selector, patternId);
            }
        }
        
        // Calculate compression ratio
        const compressedSize = this.calculateCompressedSize();
        const compressionRatio = originalSize > 0 
            ? (1 - compressedSize / originalSize) * 100 
            : 0;
        
        this.emit('deduplicated', {
            originalSelectors: selectors.length,
            uniquePatterns: this.patterns.size,
            compressionRatio
        });
        
        return {
            compressed,
            patterns: Array.from(this.patterns.values()),
            compressionRatio
        };
    }
    
    /**
     * Extract patterns from a selector
     */
    private extractPatterns(selector: string): string[] {
        const patterns: string[] = [];
        
        // Common CSS selector patterns
        const patternRegexes = [
            /\[data-[\w-]+\]/g,           // data attributes
            /\.[\w-]+/g,                   // classes
            /#[\w-]+/g,                    // IDs
            /\[aria-[\w-]+\]/g,           // ARIA attributes
            /input\[type="[\w]+"\]/g,     // input types
            /\[role="[\w]+"\]/g,          // roles
        ];
        
        for (const regex of patternRegexes) {
            const matches = selector.match(regex);
            if (matches) {
                patterns.push(...matches);
            }
        }
        
        // If no patterns found, use the whole selector
        if (patterns.length === 0) {
            patterns.push(selector);
        }
        
        return patterns;
    }
    
    /**
     * Get existing pattern or create new one
     */
    private getOrCreatePattern(pattern: string, context: string): string {
        const hash = this.hashPattern(pattern);
        
        if (this.patternIndex.has(hash)) {
            const id = this.patternIndex.get(hash)!;
            const existing = this.patterns.get(id)!;
            existing.frequency++;
            existing.lastSeen = Date.now();
            if (!existing.contexts.includes(context)) {
                existing.contexts.push(context);
            }
            return id;
        }
        
        // Create new pattern
        const id = `p${this.nextPatternId++}`;
        const newPattern: Pattern = {
            id,
            pattern,
            frequency: 1,
            lastSeen: Date.now(),
            contexts: [context]
        };
        
        this.patterns.set(id, newPattern);
        this.patternIndex.set(hash, id);
        
        return id;
    }
    
    /**
     * Simple hash function for patterns
     */
    private hashPattern(pattern: string): string {
        let hash = 0;
        for (let i = 0; i < pattern.length; i++) {
            const char = pattern.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    
    /**
     * Calculate compressed size
     */
    private calculateCompressedSize(): number {
        let size = 0;
        for (const pattern of this.patterns.values()) {
            size += pattern.pattern.length + pattern.id.length;
        }
        return size;
    }
    
    /**
     * Get most common patterns
     */
    getTopPatterns(count: number = 20): Pattern[] {
        return Array.from(this.patterns.values())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, count);
    }
    
    /**
     * Clear all patterns
     */
    clear(): void {
        this.patterns.clear();
        this.patternIndex.clear();
        this.nextPatternId = 1;
    }
}

/**
 * 🧠 NeuralOptimizer - Main Knowledge Optimization Engine
 * 
 * Combines LRU caching and pattern deduplication for optimal
 * memory usage and fast selector lookups.
 */
export class NeuralOptimizer extends EventEmitter {
    private selectorCache: LRUCache<string, string>;
    private heuristicsCache: LRUCache<string, unknown>;
    private deduplicator: PatternDeduplicator;
    private compressionEnabled: boolean = true;
    
    constructor(options?: {
        selectorCacheSize?: number;
        heuristicsCacheSize?: number;
        maxMemoryMB?: number;
    }) {
        super();
        
        const opts = {
            selectorCacheSize: 5000,
            heuristicsCacheSize: 1000,
            maxMemoryMB: 150,
            ...options
        };
        
        this.selectorCache = new LRUCache<string, string>(
            opts.selectorCacheSize,
            opts.maxMemoryMB * 0.6
        );
        
        this.heuristicsCache = new LRUCache<string, unknown>(
            opts.heuristicsCacheSize,
            opts.maxMemoryMB * 0.4
        );
        
        this.deduplicator = new PatternDeduplicator();
        
        // Forward events
        this.selectorCache.on('eviction', (data) => {
            this.emit('selector-eviction', data);
        });
        
        this.heuristicsCache.on('eviction', (data) => {
            this.emit('heuristic-eviction', data);
        });
    }
    
    /**
     * Cache a selector mapping
     */
    cacheSelector(intent: string, selector: string): void {
        this.selectorCache.put(intent, selector);
    }
    
    /**
     * Get cached selector
     */
    getSelector(intent: string): string | undefined {
        return this.selectorCache.get(intent);
    }
    
    /**
     * Cache heuristic data
     */
    cacheHeuristic(key: string, data: unknown): void {
        this.heuristicsCache.put(key, data);
    }
    
    /**
     * Get cached heuristic
     */
    getHeuristic(key: string): unknown | undefined {
        return this.heuristicsCache.get(key);
    }
    
    /**
     * Compress and optimize global_heuristics.json
     */
    async optimizeHeuristicsFile(filePath: string): Promise<{
        originalSize: number;
        compressedSize: number;
        compressionRatio: number;
        patternCount: number;
    }> {
        // Read original file
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const originalSize = Buffer.byteLength(content, 'utf-8');
        
        // Parse JSON
        const heuristics = JSON.parse(content);
        
        // Extract all selectors
        const selectors = this.extractSelectorsFromHeuristics(heuristics);
        
        // Deduplicate patterns
        const { compressed, patterns, compressionRatio } = 
            this.deduplicator.deduplicate(selectors);
        
        // Create optimized structure
        const optimized: CompressedHeuristics = {
            version: '1.0',
            compressionRatio,
            patterns,
            selectors: compressed,
            metadata: {
                originalSize,
                compressedSize: 0,
                patternCount: patterns.length,
                timestamp: Date.now()
            }
        };
        
        // Compress with gzip
        const jsonStr = JSON.stringify(optimized);
        const compressedBuffer = await this.gzipCompress(jsonStr);
        const compressedSize = compressedBuffer.length;
        
        optimized.metadata.compressedSize = compressedSize;
        
        // Write optimized file
        const optimizedPath = filePath.replace('.json', '.optimized.json.gz');
        await fs.promises.writeFile(optimizedPath, compressedBuffer);
        
        this.emit('optimization-complete', {
            originalSize,
            compressedSize,
            compressionRatio: ((1 - compressedSize / originalSize) * 100).toFixed(2),
            patternCount: patterns.length
        });
        
        return {
            originalSize,
            compressedSize,
            compressionRatio: (1 - compressedSize / originalSize) * 100,
            patternCount: patterns.length
        };
    }
    
    /**
     * Load optimized heuristics file
     */
    async loadOptimizedHeuristics(filePath: string): Promise<CompressedHeuristics> {
        const compressed = await fs.promises.readFile(filePath);
        const decompressed = await this.gzipDecompress(compressed);
        return JSON.parse(decompressed);
    }
    
    /**
     * Extract selectors from heuristics object
     */
    private extractSelectorsFromHeuristics(obj: unknown, selectors: string[] = []): string[] {
        if (typeof obj === 'string') {
            // Check if it looks like a selector
            if (obj.includes('.') || obj.includes('#') || obj.includes('[')) {
                selectors.push(obj);
            }
        } else if (Array.isArray(obj)) {
            for (const item of obj) {
                this.extractSelectorsFromHeuristics(item, selectors);
            }
        } else if (typeof obj === 'object' && obj !== null) {
            for (const key of Object.keys(obj)) {
                if (key === 'selector' || key === 'selectors' || key.includes('Selector')) {
                    const value = (obj as Record<string, unknown>)[key];
                    if (typeof value === 'string') {
                        selectors.push(value);
                    } else if (Array.isArray(value)) {
                        selectors.push(...value.filter((v): v is string => typeof v === 'string'));
                    }
                }
                this.extractSelectorsFromHeuristics((obj as Record<string, unknown>)[key], selectors);
            }
        }
        return selectors;
    }
    
    /**
     * Gzip compress
     */
    private gzipCompress(data: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            zlib.gzip(data, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
    
    /**
     * Gzip decompress
     */
    private gzipDecompress(data: Buffer): Promise<string> {
        return new Promise((resolve, reject) => {
            zlib.gunzip(data, (err, result) => {
                if (err) reject(err);
                else resolve(result.toString('utf-8'));
            });
        });
    }
    
    /**
     * Get combined cache statistics
     */
    getStats(): {
        selectors: CacheStats;
        heuristics: CacheStats;
        topPatterns: Pattern[];
    } {
        return {
            selectors: this.selectorCache.getStats(),
            heuristics: this.heuristicsCache.getStats(),
            topPatterns: this.deduplicator.getTopPatterns(10)
        };
    }
    
    /**
     * Clear all caches
     */
    clear(): void {
        this.selectorCache.clear();
        this.heuristicsCache.clear();
        this.deduplicator.clear();
        this.emit('cleared');
    }
    
    /**
     * Get hot selectors for preloading
     */
    getHotSelectors(count: number = 50): Array<{ key: string; accessCount: number }> {
        return this.selectorCache.getHotItems(count) as Array<{ key: string; accessCount: number }>;
    }
    
    /**
     * Preload frequently used selectors
     */
    preload(selectors: Array<{ intent: string; selector: string }>): void {
        for (const { intent, selector } of selectors) {
            this.cacheSelector(intent, selector);
        }
        this.emit('preloaded', { count: selectors.length });
    }
}

// Export singleton instance
export const neuralOptimizer = new NeuralOptimizer();
