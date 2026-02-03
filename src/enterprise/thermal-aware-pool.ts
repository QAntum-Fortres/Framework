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
import * as os from 'os';
import { HardwareTelemetry, SystemMetrics } from '../telemetry/hardware-telemetry';

// ═══════════════════════════════════════════════════════════════════════════════
// 🌡️ THERMAL THROTTLING AWARE WORKER POOL - Ryzen 7 Optimized
// ═══════════════════════════════════════════════════════════════════════════════
// Автоматично регулира паралелизма базирано на CPU температура.
// >90°C → намали нишки, <70°C → форсирай до 40 инстанции
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Thermal throttling configuration
 */
export interface ThermalThrottleConfig {
    /** Temperature threshold to start throttling (°C) */
    throttleThreshold: number;
    /** Critical temperature to enter emergency mode (°C) */
    criticalThreshold: number;
    /** Cool temperature to unlock full power (°C) */
    coolThreshold: number;
    /** Maximum concurrent instances when cool */
    maxInstancesCool: number;
    /** Minimum concurrent instances when hot */
    minInstancesHot: number;
    /** Temperature check interval (ms) */
    checkInterval: number;
    /** Enable dynamic scaling */
    enableDynamicScaling: boolean;
}

/**
 * Throttle state
 */
export type ThrottleState = 'cool' | 'warm' | 'hot' | 'critical' | 'emergency';

/**
 * Throttle event
 */
export interface ThrottleEvent {
    previousState: ThrottleState;
    newState: ThrottleState;
    temperature: number;
    recommendedConcurrency: number;
    timestamp: number;
}

/**
 * Pool metrics
 */
export interface ThermalPoolMetrics {
    currentTemperature: number;
    state: ThrottleState;
    currentConcurrency: number;
    maxConcurrency: number;
    queueLength: number;
    completedTasks: number;
    throttleCount: number;
    avgTaskTime: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌡️ THERMAL AWARE POOL CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class ThermalAwarePool extends EventEmitter {
    private config: ThermalThrottleConfig;
    private telemetry: HardwareTelemetry;
    private currentState: ThrottleState = 'cool';
    private currentTemperature: number = 50;
    private currentConcurrency: number;
    private monitorInterval: NodeJS.Timeout | null = null;
    private throttleCount: number = 0;
    private completedTasks: number = 0;
    private totalTaskTime: number = 0;
    private taskQueue: Array<{ task: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: Error) => void }> = [];
    private activeWorkers: number = 0;
    
    constructor(config?: Partial<ThermalThrottleConfig>) {
        super();
        
        const cpuCount = os.cpus().length;
        
        this.config = {
            throttleThreshold: config?.throttleThreshold ?? 90,
            criticalThreshold: config?.criticalThreshold ?? 95,
            coolThreshold: config?.coolThreshold ?? 70,
            maxInstancesCool: config?.maxInstancesCool ?? 40,
            minInstancesHot: config?.minInstancesHot ?? 4,
            checkInterval: config?.checkInterval ?? 2000,
            enableDynamicScaling: config?.enableDynamicScaling ?? true
        };
        
        // Start with moderate concurrency
        this.currentConcurrency = Math.min(cpuCount, this.config.maxInstancesCool);
        
        // Initialize telemetry
        this.telemetry = new HardwareTelemetry({
            cpuThreshold: this.config.throttleThreshold,
            memoryThreshold: 85,
            checkInterval: this.config.checkInterval
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🚀 LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Start thermal monitoring
     */
    start(): void {
        if (this.monitorInterval) return;
        
        // Start telemetry monitoring
        this.telemetry.startMonitoring();
        
        // Subscribe to telemetry events
        this.telemetry.on('metrics', (metrics: SystemMetrics) => {
            this.handleMetrics(metrics);
        });
        
        this.emit('started', { concurrency: this.currentConcurrency });
    }
    
    /**
     * Stop thermal monitoring
     */
    stop(): void {
        this.telemetry.stopMonitoring();
        
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        this.emit('stopped');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🌡️ THERMAL MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Handle telemetry metrics
     */
    private handleMetrics(metrics: SystemMetrics): void {
        // Estimate temperature from CPU usage (real implementation would use actual sensors)
        // AMD Ryzen 7 7435HS: idle ~45°C, full load ~90°C
        const baseTemp = 45;
        const loadFactor = metrics.cpu.usage / 100;
        const estimatedTemp = baseTemp + (loadFactor * 50); // 45-95°C range
        
        this.currentTemperature = Math.round(estimatedTemp * 10) / 10;
        
        // Determine new state
        const newState = this.calculateState(this.currentTemperature);
        
        // Handle state change
        if (newState !== this.currentState) {
            const previousState = this.currentState;
            this.currentState = newState;
            
            if (this.config.enableDynamicScaling) {
                this.adjustConcurrency();
            }
            
            const event: ThrottleEvent = {
                previousState,
                newState,
                temperature: this.currentTemperature,
                recommendedConcurrency: this.currentConcurrency,
                timestamp: Date.now()
            };
            
            this.emit('state-changed', event);
            
            if (newState === 'hot' || newState === 'critical') {
                this.throttleCount++;
                this.emit('throttling', event);
            }
        }
        
        this.emit('temperature', {
            temperature: this.currentTemperature,
            state: this.currentState,
            concurrency: this.currentConcurrency
        });
    }
    
    /**
     * Calculate thermal state from temperature
     */
    private calculateState(temp: number): ThrottleState {
        if (temp >= this.config.criticalThreshold + 5) {
            return 'emergency';
        }
        if (temp >= this.config.criticalThreshold) {
            return 'critical';
        }
        if (temp >= this.config.throttleThreshold) {
            return 'hot';
        }
        if (temp > this.config.coolThreshold) {
            return 'warm';
        }
        return 'cool';
    }
    
    /**
     * Adjust concurrency based on thermal state
     */
    private adjustConcurrency(): void {
        const { maxInstancesCool, minInstancesHot, coolThreshold, throttleThreshold } = this.config;
        let newConcurrency: number;
        
        switch (this.currentState) {
            case 'emergency':
                // Emergency mode - minimum workers
                newConcurrency = Math.max(2, Math.floor(minInstancesHot / 2));
                break;
                
            case 'critical':
                // Critical - just above minimum
                newConcurrency = minInstancesHot;
                break;
                
            case 'hot':
                // Hot - reduced capacity
                newConcurrency = Math.floor(minInstancesHot + (maxInstancesCool - minInstancesHot) * 0.3);
                break;
                
            case 'warm':
                // Warm - moderate capacity
                const warmRange = throttleThreshold - coolThreshold;
                const warmPosition = (this.currentTemperature - coolThreshold) / warmRange;
                const capacityReduction = warmPosition * 0.4; // Up to 40% reduction
                newConcurrency = Math.floor(maxInstancesCool * (1 - capacityReduction));
                break;
                
            case 'cool':
            default:
                // Cool - full power!
                newConcurrency = maxInstancesCool;
                break;
        }
        
        if (newConcurrency !== this.currentConcurrency) {
            const previousConcurrency = this.currentConcurrency;
            this.currentConcurrency = newConcurrency;
            
            this.emit('concurrency-changed', {
                from: previousConcurrency,
                to: newConcurrency,
                state: this.currentState,
                temperature: this.currentTemperature
            });
        }
    }
    
    /**
     * Set temperature manually (for testing or external sensors)
     */
    setTemperature(temp: number): void {
        this.currentTemperature = temp;
        const newState = this.calculateState(temp);
        
        if (newState !== this.currentState) {
            this.currentState = newState;
            if (this.config.enableDynamicScaling) {
                this.adjustConcurrency();
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📋 TASK EXECUTION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Execute task with thermal-aware throttling
     */
    async execute<T>(task: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.taskQueue.push({
                task: task as () => Promise<unknown>,
                resolve: resolve as (v: unknown) => void,
                reject
            });
            
            this.processQueue();
        });
    }
    
    /**
     * Execute batch of tasks with thermal-aware concurrency
     */
    async executeBatch<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
        const results: T[] = [];
        const promises = tasks.map(task => this.execute(task));
        
        for (const promise of promises) {
            results.push(await promise);
        }
        
        return results;
    }
    
    /**
     * Process task queue
     */
    private async processQueue(): Promise<void> {
        while (this.taskQueue.length > 0 && this.activeWorkers < this.currentConcurrency) {
            const item = this.taskQueue.shift();
            if (!item) break;
            
            this.activeWorkers++;
            
            const startTime = Date.now();
            
            try {
                const result = await item.task();
                const duration = Date.now() - startTime;
                
                this.completedTasks++;
                this.totalTaskTime += duration;
                
                item.resolve(result);
            } catch (error) {
                item.reject(error instanceof Error ? error : new Error(String(error)));
            }
            
            this.activeWorkers--;
            
            // Continue processing
            if (this.taskQueue.length > 0) {
                this.processQueue();
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 STATUS & METRICS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Get current metrics
     */
    getMetrics(): ThermalPoolMetrics {
        return {
            currentTemperature: this.currentTemperature,
            state: this.currentState,
            currentConcurrency: this.currentConcurrency,
            maxConcurrency: this.config.maxInstancesCool,
            queueLength: this.taskQueue.length,
            completedTasks: this.completedTasks,
            throttleCount: this.throttleCount,
            avgTaskTime: this.completedTasks > 0 
                ? this.totalTaskTime / this.completedTasks 
                : 0
        };
    }
    
    /**
     * Get current state
     */
    getState(): ThrottleState {
        return this.currentState;
    }
    
    /**
     * Get current concurrency limit
     */
    getConcurrency(): number {
        return this.currentConcurrency;
    }
    
    /**
     * Get temperature
     */
    getTemperature(): number {
        return this.currentTemperature;
    }
    
    /**
     * Get configuration
     */
    getConfig(): ThermalThrottleConfig {
        return { ...this.config };
    }
    
    /**
     * Update configuration
     */
    updateConfig(config: Partial<ThermalThrottleConfig>): void {
        this.config = { ...this.config, ...config };
        
        if (this.config.enableDynamicScaling) {
            this.adjustConcurrency();
        }
        
        this.emit('config-updated', this.config);
    }
    
    /**
     * Force concurrency (override thermal scaling)
     */
    forceConcurrency(concurrency: number): void {
        this.currentConcurrency = Math.max(1, Math.min(concurrency, this.config.maxInstancesCool));
        this.emit('concurrency-forced', this.currentConcurrency);
    }
    
    /**
     * Get queue length
     */
    getQueueLength(): number {
        return this.taskQueue.length;
    }
    
    /**
     * Check if throttling is active
     */
    isThrottling(): boolean {
        return this.currentState === 'hot' || this.currentState === 'critical' || this.currentState === 'emergency';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { HardwareTelemetry, SystemMetrics };
export default ThermalAwarePool;
