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

import { EventEmitter } from 'node:events';
import { BrowserMetadata, ResourceTracker } from '../types';

/**
 * Resource types that can be tracked
 */
export type ResourceType = 
  | 'browser' 
  | 'page' 
  | 'ghost' 
  | 'mutation' 
  | 'worker'
  | 'socket'
  | 'stream';

/**
 * Cleanup callback type
 */
export type CleanupCallback = () => void | Promise<void>;

/**
 * Memory Hardening Manager
 * 
 * Provides GC-friendly resource tracking and automatic cleanup.
 */
export class MemoryHardeningManager extends EventEmitter {
  /** WeakMap for browser instance metadata */
  private browserMetadata: WeakMap<object, BrowserMetadata> = new WeakMap();
  
  /** WeakMap for general resource metadata */
  private resourceMetadata: WeakMap<object, Record<string, unknown>> = new WeakMap();
  
  /** WeakRef registry for tracking live objects */
  private weakRefs: Map<string, WeakRef<object>> = new Map();
  
  /** Finalization registry for cleanup callbacks */
  private finalizationRegistry: FinalizationRegistry<{
    resourceId: string;
    type: ResourceType;
    cleanup?: CleanupCallback;
  }>;
  
  /** Resource trackers by type */
  private trackers: Map<ResourceType, ResourceTracker> = new Map();
  
  /** Cleanup callbacks pending execution */
  private pendingCleanups: Map<string, CleanupCallback> = new Map();
  
  /** Start time for uptime tracking */
  private startTime = Date.now();
  
  /** Memory check interval */
  private memoryCheckInterval?: NodeJS.Timeout;
  
  /** Memory pressure threshold (percentage) */
  private memoryPressureThreshold = 0.85;

  constructor() {
    super();
    
    // Initialize finalization registry
    this.finalizationRegistry = new FinalizationRegistry((heldValue) => {
      this.handleFinalization(heldValue);
    });
    
    // Initialize trackers for each resource type
    const resourceTypes: ResourceType[] = [
      'browser', 'page', 'ghost', 'mutation', 'worker', 'socket', 'stream'
    ];
    
    for (const type of resourceTypes) {
      this.trackers.set(type, {
        activeCount: 0,
        peakCount: 0,
        totalCreated: 0,
        totalCleaned: 0,
        pendingCleanups: 0
      });
    }
    
    // Start memory monitoring
    this.startMemoryMonitoring();
  }

  /**
   * Register a browser instance with metadata
   * @param browser - Browser instance object
   * @param instanceId - Unique instance ID
   */
  registerBrowser(browser: object, instanceId: string): void {
    const metadata: BrowserMetadata = {
      instanceId,
      createdAt: new Date(),
      pagesOpened: 0,
      memoryEstimate: 0,
      isActive: true,
      lastActivity: new Date()
    };
    
    this.browserMetadata.set(browser, metadata);
    this.trackResource('browser', browser, instanceId);
    
    this.emit('browserRegistered', instanceId);
  }

  /**
   * Get browser metadata
   * @param browser - Browser instance
   */
  getBrowserMetadata(browser: object): BrowserMetadata | undefined {
    return this.browserMetadata.get(browser);
  }

  /**
   * Update browser activity
   * @param browser - Browser instance
   * @param pagesOpened - Number of pages opened
   * @param memoryEstimate - Estimated memory usage
   */
  updateBrowserActivity(
    browser: object, 
    pagesOpened?: number,
    memoryEstimate?: number
  ): void {
    const metadata = this.browserMetadata.get(browser);
    if (metadata) {
      metadata.lastActivity = new Date();
      if (pagesOpened !== undefined) metadata.pagesOpened = pagesOpened;
      if (memoryEstimate !== undefined) metadata.memoryEstimate = memoryEstimate;
    }
  }

  /**
   * Mark browser as inactive
   * @param browser - Browser instance
   */
  deactivateBrowser(browser: object): void {
    const metadata = this.browserMetadata.get(browser);
    if (metadata) {
      metadata.isActive = false;
      this.emit('browserDeactivated', metadata.instanceId);
    }
  }

  /**
   * Track a resource with WeakRef
   * @param type - Resource type
   * @param resource - Resource object
   * @param resourceId - Unique resource ID
   * @param cleanup - Optional cleanup callback
   */
  trackResource(
    type: ResourceType,
    resource: object,
    resourceId: string,
    cleanup?: CleanupCallback
  ): void {
    // Store WeakRef
    this.weakRefs.set(resourceId, new WeakRef(resource));
    
    // Register for finalization
    this.finalizationRegistry.register(
      resource,
      { resourceId, type, cleanup },
      resource // Unregister token
    );
    
    // Store cleanup callback
    if (cleanup) {
      this.pendingCleanups.set(resourceId, cleanup);
    }
    
    // Update tracker
    const tracker = this.trackers.get(type)!;
    tracker.activeCount++;
    tracker.totalCreated++;
    tracker.peakCount = Math.max(tracker.peakCount, tracker.activeCount);
    if (cleanup) tracker.pendingCleanups++;
    
    this.emit('resourceTracked', { type, resourceId });
  }

  /**
   * Check if a resource is still alive
   * @param resourceId - Resource ID
   */
  isResourceAlive(resourceId: string): boolean {
    const ref = this.weakRefs.get(resourceId);
    if (!ref) return false;
    return ref.deref() !== undefined;
  }

  /**
   * Get a tracked resource (if still alive)
   * @param resourceId - Resource ID
   */
  getResource<T extends object>(resourceId: string): T | undefined {
    const ref = this.weakRefs.get(resourceId);
    if (!ref) return undefined;
    return ref.deref() as T | undefined;
  }

  /**
   * Attach metadata to any object
   * @param object - Object to attach metadata to
   * @param metadata - Metadata to attach
   */
  attachMetadata<T extends object>(object: T, metadata: Record<string, unknown>): void {
    const existing = this.resourceMetadata.get(object) || {};
    this.resourceMetadata.set(object, { ...existing, ...metadata });
  }

  /**
   * Get metadata from an object
   * @param object - Object to get metadata from
   */
  getMetadata<T extends object>(object: T): Record<string, unknown> | undefined {
    return this.resourceMetadata.get(object);
  }

  /**
   * Handle finalization (called by GC)
   */
  private handleFinalization(heldValue: {
    resourceId: string;
    type: ResourceType;
    cleanup?: CleanupCallback;
  }): void {
    const { resourceId, type, cleanup } = heldValue;
    
    // Update tracker
    const tracker = this.trackers.get(type);
    if (tracker) {
      tracker.activeCount--;
      tracker.totalCleaned++;
      if (cleanup) tracker.pendingCleanups--;
    }
    
    // Remove WeakRef
    this.weakRefs.delete(resourceId);
    
    // Execute cleanup callback
    if (cleanup) {
      this.pendingCleanups.delete(resourceId);
      this.executeCleanup(resourceId, cleanup);
    }
    
    this.emit('resourceFinalized', { type, resourceId });
  }

  /**
   * Execute cleanup callback safely
   */
  private async executeCleanup(resourceId: string, cleanup: CleanupCallback): Promise<void> {
    try {
      await cleanup();
      this.emit('cleanupComplete', resourceId);
    } catch (error) {
      this.emit('cleanupError', { resourceId, error });
    }
  }

  /**
   * Force cleanup of a specific resource
   * @param resourceId - Resource ID to clean up
   */
  async forceCleanup(resourceId: string): Promise<boolean> {
    const cleanup = this.pendingCleanups.get(resourceId);
    if (!cleanup) return false;
    
    this.pendingCleanups.delete(resourceId);
    
    // Unregister from finalization
    const ref = this.weakRefs.get(resourceId);
    if (ref) {
      const resource = ref.deref();
      if (resource) {
        this.finalizationRegistry.unregister(resource);
      }
    }
    
    this.weakRefs.delete(resourceId);
    
    // Execute cleanup
    await this.executeCleanup(resourceId, cleanup);
    
    return true;
  }

  /**
   * Get tracker statistics
   * @param type - Resource type (optional, all if not specified)
   */
  getTrackerStats(type?: ResourceType): ResourceTracker | Map<ResourceType, ResourceTracker> {
    if (type) {
      return this.trackers.get(type)!;
    }
    return new Map(this.trackers);
  }

  /**
   * Start memory pressure monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Check for memory pressure
   */
  private checkMemoryPressure(): void {
    const memUsage = process.memoryUsage();
    const heapUsedRatio = memUsage.heapUsed / memUsage.heapTotal;
    
    if (heapUsedRatio > this.memoryPressureThreshold) {
      this.emit('memoryPressure', {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        ratio: heapUsedRatio
      });
      
      // Suggest garbage collection if available
      if (global.gc) {
        global.gc();
        this.emit('gcTriggered');
      }
    }
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    activeResources: number;
    peakResources: number;
    uptime: number;
  } {
    const memUsage = process.memoryUsage();
    
    let activeResources = 0;
    let peakResources = 0;
    
    for (const tracker of this.trackers.values()) {
      activeResources += tracker.activeCount;
      peakResources += tracker.peakCount;
    }
    
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      activeResources,
      peakResources,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Clean up all resources of a type
   * @param type - Resource type
   */
  async cleanupType(type: ResourceType): Promise<number> {
    let cleaned = 0;
    
    for (const [resourceId, cleanup] of this.pendingCleanups.entries()) {
      // Check if this resource is of the specified type
      const ref = this.weakRefs.get(resourceId);
      if (ref) {
        const resource = ref.deref();
        if (resource) {
          const metadata = this.resourceMetadata.get(resource);
          if (metadata?.type === type) {
            await this.forceCleanup(resourceId);
            cleaned++;
          }
        }
      }
    }
    
    return cleaned;
  }

  /**
   * Set memory pressure threshold
   * @param threshold - Threshold (0-1)
   */
  setMemoryPressureThreshold(threshold: number): void {
    this.memoryPressureThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Stop memory monitoring and clean up
   */
  shutdown(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    
    this.weakRefs.clear();
    this.pendingCleanups.clear();
    
    this.emit('shutdown');
  }
}

/**
 * Singleton instance for global resource tracking
 */
let globalInstance: MemoryHardeningManager | null = null;

/**
 * Get the global memory hardening instance
 */
export function getGlobalMemoryManager(): MemoryHardeningManager {
  if (!globalInstance) {
    globalInstance = new MemoryHardeningManager();
  }
  return globalInstance;
}

export default MemoryHardeningManager;
