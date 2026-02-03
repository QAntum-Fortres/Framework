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

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import {
  SwappableModule,
  SwappableMethod,
  MethodAlternative,
  HotSwapEvent,
  HotSwapConfig,
} from '../types';

/** Generate unique ID */
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Hot-Swap Module Loader
 * 
 * Features:
 * - Register methods as swappable
 * - Add alternatives for A/B testing
 * - Swap implementations at runtime
 * - Track performance of each alternative
 */
export class HotSwapModuleLoader extends EventEmitter {
  /** Configuration */
  private config: HotSwapConfig;
  
  /** Registered modules */
  private modules: Map<string, SwappableModule> = new Map();
  
  /** Registered methods */
  private methods: Map<string, SwappableMethod> = new Map();
  
  /** Swap history */
  private swapHistory: HotSwapEvent[] = [];
  
  /** Original implementations (for rollback) */
  private originals: Map<string, Function> = new Map();
  
  /** Statistics */
  private stats = {
    modulesRegistered: 0,
    methodsRegistered: 0,
    swapsPerformed: 0,
    rollbacksPerformed: 0,
    alternativesAdded: 0,
  };
  
  /** Start time */
  private startTime: Date;

  constructor(config?: HotSwapConfig) {
    super();
    
    this.config = {
      enabled: config?.enabled ?? true,
      preserveState: config?.preserveState ?? true,
      trackPerformance: config?.trackPerformance ?? true,
      maxAlternatives: config?.maxAlternatives || 5,
      autoRollbackOnError: config?.autoRollbackOnError ?? true,
    };
    
    this.startTime = new Date();
  }

  /**
   * Register a module as swappable
   */
  registerModule(
    name: string,
    instance: object,
    description?: string
  ): SwappableModule {
    const moduleId = generateId('mod');
    
    const module: SwappableModule = {
      id: moduleId,
      name,
      methods: new Map(),
      registeredAt: new Date(),
      description,
    };
    
    // Auto-discover methods
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
      .filter(name => name !== 'constructor' && typeof (instance as Record<string, unknown>)[name] === 'function');
    
    for (const methodName of methodNames) {
      const method = this.registerMethod(
        moduleId,
        methodName,
        ((instance as Record<string, unknown>)[methodName] as Function).bind(instance)
      );
      module.methods.set(methodName, method);
    }
    
    this.modules.set(moduleId, module);
    this.stats.modulesRegistered++;
    
    this.emit('moduleRegistered', { moduleId, name, methodCount: methodNames.length });
    
    return module;
  }

  /**
   * Register a method as swappable
   */
  registerMethod(
    moduleId: string,
    methodName: string,
    implementation: Function
  ): SwappableMethod {
    const methodId = `${moduleId}:${methodName}`;
    
    // Store original
    this.originals.set(methodId, implementation);
    
    const method: SwappableMethod = {
      id: methodId,
      name: methodName,
      moduleId,
      currentImplementation: implementation,
      alternatives: [],
      callCount: 0,
      avgExecutionTime: 0,
      errorCount: 0,
    };
    
    this.methods.set(methodId, method);
    this.stats.methodsRegistered++;
    
    this.emit('methodRegistered', { methodId, methodName, moduleId });
    
    return method;
  }

  /**
   * Add an alternative implementation
   */
  addAlternative(
    methodId: string,
    implementation: Function,
    options?: {
      name?: string;
      description?: string;
      priority?: number;
    }
  ): MethodAlternative {
    const method = this.methods.get(methodId);
    if (!method) {
      throw new Error(`Method not found: ${methodId}`);
    }
    
    if (method.alternatives.length >= (this.config.maxAlternatives || 5)) {
      throw new Error(`Max alternatives reached for method: ${methodId}`);
    }
    
    const alternative: MethodAlternative = {
      id: generateId('alt'),
      name: options?.name || `Alternative ${method.alternatives.length + 1}`,
      implementation,
      addedAt: new Date(),
      callCount: 0,
      avgExecutionTime: 0,
      errorCount: 0,
      successRate: 0,
      priority: options?.priority || method.alternatives.length,
      description: options?.description,
    };
    
    method.alternatives.push(alternative);
    this.stats.alternativesAdded++;
    
    this.emit('alternativeAdded', { methodId, alternativeId: alternative.id });
    
    return alternative;
  }

  /**
   * Swap to an alternative implementation
   */
  async swap(methodId: string, alternativeId: string): Promise<boolean> {
    const method = this.methods.get(methodId);
    if (!method) {
      throw new Error(`Method not found: ${methodId}`);
    }
    
    const alternative = method.alternatives.find(a => a.id === alternativeId);
    if (!alternative) {
      throw new Error(`Alternative not found: ${alternativeId}`);
    }
    
    const previousImplementation = method.currentImplementation;
    const previousId = method.activeAlternativeId;
    
    try {
      // Perform the swap
      method.currentImplementation = alternative.implementation;
      method.activeAlternativeId = alternativeId;
      
      const event: HotSwapEvent = {
        id: generateId('swap'),
        methodId,
        fromAlternativeId: previousId,
        toAlternativeId: alternativeId,
        timestamp: new Date(),
        success: true,
      };
      
      this.swapHistory.push(event);
      this.stats.swapsPerformed++;
      
      this.emit('swapped', { methodId, alternativeId, event });
      
      return true;
      
    } catch (error: unknown) {
      // Rollback on error
      if (this.config.autoRollbackOnError) {
        method.currentImplementation = previousImplementation;
        method.activeAlternativeId = previousId;
      }
      
      const message = error instanceof Error ? error.message : String(error);
      const event: HotSwapEvent = {
        id: generateId('swap'),
        methodId,
        fromAlternativeId: previousId,
        toAlternativeId: alternativeId,
        timestamp: new Date(),
        success: false,
        error: message,
      };
      
      this.swapHistory.push(event);
      
      this.emit('swapFailed', { methodId, alternativeId, error: error.message });
      
      return false;
    }
  }

  /**
   * Rollback to original implementation
   */
  async rollback(methodId: string): Promise<boolean> {
    const method = this.methods.get(methodId);
    if (!method) {
      throw new Error(`Method not found: ${methodId}`);
    }
    
    const original = this.originals.get(methodId);
    if (!original) {
      throw new Error(`Original not found for method: ${methodId}`);
    }
    
    const previousId = method.activeAlternativeId;
    
    method.currentImplementation = original;
    method.activeAlternativeId = undefined;
    
    this.stats.rollbacksPerformed++;
    
    const event: HotSwapEvent = {
      id: generateId('swap'),
      methodId,
      fromAlternativeId: previousId,
      toAlternativeId: 'original',
      timestamp: new Date(),
      success: true,
    };
    
    this.swapHistory.push(event);
    
    this.emit('rolledBack', { methodId, event });
    
    return true;
  }

  /**
   * Execute a method (with tracking)
   */
  async execute<T>(methodId: string, ...args: unknown[]): Promise<T> {
    const method = this.methods.get(methodId);
    if (!method) {
      throw new Error(`Method not found: ${methodId}`);
    }
    
    const startTime = Date.now();
    method.callCount++;
    
    // Track alternative if active
    let activeAlternative: MethodAlternative | undefined;
    if (method.activeAlternativeId) {
      activeAlternative = method.alternatives.find(a => a.id === method.activeAlternativeId);
      if (activeAlternative) {
        activeAlternative.callCount++;
      }
    }
    
    try {
      const result = await method.currentImplementation(...args);
      
      // Update timing
      const executionTime = Date.now() - startTime;
      this.updateAverageTime(method, executionTime);
      
      if (activeAlternative) {
        this.updateAlternativeTime(activeAlternative, executionTime);
        activeAlternative.successRate = 
          (activeAlternative.callCount - activeAlternative.errorCount) / activeAlternative.callCount;
      }
      
      this.emit('executed', { methodId, executionTime, success: true });
      
      return result;
      
    } catch (error: unknown) {
      method.errorCount++;
      
      if (activeAlternative) {
        activeAlternative.errorCount++;
        activeAlternative.successRate = 
          (activeAlternative.callCount - activeAlternative.errorCount) / activeAlternative.callCount;
      }
      
      // Auto-rollback on error if configured
      if (this.config.autoRollbackOnError && activeAlternative) {
        await this.rollback(methodId);
      }
      
      const message = error instanceof Error ? error.message : String(error);
      this.emit('executionError', { methodId, error: message });
      
      throw error;
    }
  }

  /**
   * Update average execution time
   */
  private updateAverageTime(method: SwappableMethod, executionTime: number): void {
    const alpha = 0.2; // EMA factor
    method.avgExecutionTime = method.avgExecutionTime * (1 - alpha) + executionTime * alpha;
  }

  /**
   * Update alternative's average time
   */
  private updateAlternativeTime(alternative: MethodAlternative, executionTime: number): void {
    const alpha = 0.2;
    alternative.avgExecutionTime = alternative.avgExecutionTime * (1 - alpha) + executionTime * alpha;
  }

  /**
   * Create a proxy for a method that auto-tracks
   */
  createProxy<T extends (...args: unknown[]) => unknown>(methodId: string): T {
    const self = this;
    
    return (async function(...args: unknown[]) {
      return self.execute(methodId, ...args);
    }) as unknown as T;
  }

  /**
   * Get best performing alternative
   */
  getBestAlternative(methodId: string): MethodAlternative | null {
    const method = this.methods.get(methodId);
    if (!method || method.alternatives.length === 0) {
      return null;
    }
    
    // Sort by success rate, then by execution time
    const sorted = [...method.alternatives]
      .filter(a => a.callCount >= 5) // Minimum samples
      .sort((a, b) => {
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate;
        }
        return a.avgExecutionTime - b.avgExecutionTime;
      });
    
    return sorted[0] || null;
  }

  /**
   * Get method by ID
   */
  getMethod(methodId: string): SwappableMethod | undefined {
    return this.methods.get(methodId);
  }

  /**
   * Get module by ID
   */
  getModule(moduleId: string): SwappableModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get all methods in a module
   */
  getModuleMethods(moduleId: string): SwappableMethod[] {
    return Array.from(this.methods.values())
      .filter(m => m.moduleId === moduleId);
  }

  /**
   * Get swap history
   */
  getSwapHistory(): HotSwapEvent[] {
    return [...this.swapHistory];
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & {
    moduleCount: number;
    methodCount: number;
    activeSwaps: number;
    uptime: number;
  } {
    const activeSwaps = Array.from(this.methods.values())
      .filter(m => m.activeAlternativeId !== undefined)
      .length;
    
    return {
      ...this.stats,
      moduleCount: this.modules.size,
      methodCount: this.methods.size,
      activeSwaps,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Export configuration
   */
  exportConfig(): {
    modules: Array<{ id: string; name: string; methods: string[] }>;
    methods: Array<{ id: string; alternativeCount: number; activeAlternative?: string }>;
  } {
    const modules = Array.from(this.modules.values()).map(m => ({
      id: m.id,
      name: m.name,
      methods: Array.from(m.methods.keys()),
    }));
    
    const methods = Array.from(this.methods.values()).map(m => ({
      id: m.id,
      alternativeCount: m.alternatives.length,
      activeAlternative: m.activeAlternativeId,
    }));
    
    return { modules, methods };
  }

  /**
   * Clear all
   */
  clear(): void {
    this.modules.clear();
    this.methods.clear();
    this.originals.clear();
    this.swapHistory = [];
    this.emit('cleared');
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    // Rollback all active swaps
    for (const method of this.methods.values()) {
      if (method.activeAlternativeId) {
        await this.rollback(method.id);
      }
    }
    
    this.emit('shutdown', { stats: this.getStats() });
  }
}

export default HotSwapModuleLoader;
