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
  StateVersion,
  StateVersionConfig,
} from '../types';

/** Generate unique ID */
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Version Performance Metrics
 */
interface VersionMetrics {
  successCount: number;
  failureCount: number;
  totalExecutions: number;
  avgExecutionTime: number;
  lastExecutedAt: Date;
  errorMessages: string[];
}

/**
 * State Versioning System
 * 
 * Features:
 * - Multiple strategy versions running in parallel
 * - Automatic winner selection based on metrics
 * - Gradual rollout with traffic splitting
 * - Rollback capability
 */
export class StateVersioningSystem extends EventEmitter {
  /** Configuration */
  private config: StateVersionConfig;
  
  /** Registered versions */
  private versions: Map<string, StateVersion> = new Map();
  
  /** Version metrics */
  private metrics: Map<string, VersionMetrics> = new Map();
  
  /** Active version ID */
  private activeVersionId: string | null = null;
  
  /** Baseline version ID */
  private baselineVersionId: string | null = null;
  
  /** Traffic allocation */
  private trafficAllocation: Map<string, number> = new Map();
  
  /** Experiment history */
  private experiments: Array<{
    id: string;
    versionA: string;
    versionB: string;
    startedAt: Date;
    endedAt?: Date;
    winner?: string;
    metrics: { versionA: VersionMetrics; versionB: VersionMetrics };
  }> = [];
  
  /** Statistics */
  private stats = {
    versionsCreated: 0,
    experimentsRun: 0,
    winnersSelected: 0,
    rollbacksPerformed: 0,
    totalExecutions: 0,
  };
  
  /** Start time */
  private startTime: Date;

  constructor(config?: StateVersionConfig) {
    super();
    
    this.config = {
      enabled: config?.enabled ?? true,
      minSampleSize: config?.minSampleSize || 100,
      confidenceLevel: config?.confidenceLevel || 0.95,
      maxConcurrentVersions: config?.maxConcurrentVersions || 5,
      autoPromote: config?.autoPromote ?? false,
    };
    
    this.startTime = new Date();
  }

  /**
   * Create a new version
   */
  createVersion(options: {
    name: string;
    description?: string;
    strategy: object;
    isBaseline?: boolean;
  }): StateVersion {
    const version: StateVersion = {
      id: generateId('ver'),
      name: options.name,
      description: options.description,
      createdAt: new Date(),
      strategy: options.strategy,
      isActive: false,
      isBaseline: options.isBaseline || false,
    };
    
    this.versions.set(version.id, version);
    this.metrics.set(version.id, this.createEmptyMetrics());
    this.stats.versionsCreated++;
    
    if (options.isBaseline) {
      this.baselineVersionId = version.id;
    }
    
    this.emit('versionCreated', { version });
    
    return version;
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(): VersionMetrics {
    return {
      successCount: 0,
      failureCount: 0,
      totalExecutions: 0,
      avgExecutionTime: 0,
      lastExecutedAt: new Date(),
      errorMessages: [],
    };
  }

  /**
   * Activate a version
   */
  activateVersion(versionId: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) {
      throw new Error(`Version not found: ${versionId}`);
    }
    
    // Deactivate previous
    if (this.activeVersionId) {
      const prev = this.versions.get(this.activeVersionId);
      if (prev) prev.isActive = false;
    }
    
    version.isActive = true;
    this.activeVersionId = versionId;
    
    // Default traffic allocation
    this.trafficAllocation.set(versionId, 1.0);
    
    this.emit('versionActivated', { versionId });
    
    return true;
  }

  /**
   * Start an A/B experiment
   */
  startExperiment(versionAId: string, versionBId: string, trafficSplit: number = 0.5): string {
    const versionA = this.versions.get(versionAId);
    const versionB = this.versions.get(versionBId);
    
    if (!versionA || !versionB) {
      throw new Error('Both versions must exist');
    }
    
    if (trafficSplit < 0 || trafficSplit > 1) {
      throw new Error('Traffic split must be between 0 and 1');
    }
    
    const experimentId = generateId('exp');
    
    // Set traffic allocation
    this.trafficAllocation.set(versionAId, trafficSplit);
    this.trafficAllocation.set(versionBId, 1 - trafficSplit);
    
    // Reset metrics for fair comparison
    this.metrics.set(versionAId, this.createEmptyMetrics());
    this.metrics.set(versionBId, this.createEmptyMetrics());
    
    // Mark both as active
    versionA.isActive = true;
    versionB.isActive = true;
    
    this.experiments.push({
      id: experimentId,
      versionA: versionAId,
      versionB: versionBId,
      startedAt: new Date(),
      metrics: {
        versionA: this.createEmptyMetrics(),
        versionB: this.createEmptyMetrics(),
      },
    });
    
    this.stats.experimentsRun++;
    
    this.emit('experimentStarted', { 
      experimentId, 
      versionA: versionAId, 
      versionB: versionBId,
      trafficSplit,
    });
    
    return experimentId;
  }

  /**
   * Get version to use (based on traffic allocation)
   */
  selectVersion(): StateVersion | null {
    const activeVersions = Array.from(this.versions.values())
      .filter(v => v.isActive);
    
    if (activeVersions.length === 0) {
      return null;
    }
    
    if (activeVersions.length === 1) {
      return activeVersions[0];
    }
    
    // Random selection based on traffic allocation
    const random = Math.random();
    let cumulative = 0;
    
    for (const version of activeVersions) {
      const allocation = this.trafficAllocation.get(version.id) || 0;
      cumulative += allocation;
      
      if (random <= cumulative) {
        return version;
      }
    }
    
    return activeVersions[0];
  }

  /**
   * Record execution result
   */
  recordResult(versionId: string, result: {
    success: boolean;
    executionTime: number;
    error?: string;
  }): void {
    const metrics = this.metrics.get(versionId);
    if (!metrics) return;
    
    metrics.totalExecutions++;
    this.stats.totalExecutions++;
    
    if (result.success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
      if (result.error) {
        metrics.errorMessages.push(result.error);
        // Keep only last 10 errors
        if (metrics.errorMessages.length > 10) {
          metrics.errorMessages.shift();
        }
      }
    }
    
    // Update average execution time (EMA)
    const alpha = 0.2;
    metrics.avgExecutionTime = 
      metrics.avgExecutionTime * (1 - alpha) + result.executionTime * alpha;
    metrics.lastExecutedAt = new Date();
    
    this.emit('resultRecorded', { versionId, result });
    
    // Check if experiment can be concluded
    this.checkExperimentConclusion();
  }

  /**
   * Check if any experiment can be concluded
   */
  private checkExperimentConclusion(): void {
    for (const experiment of this.experiments) {
      if (experiment.endedAt) continue; // Already concluded
      
      const metricsA = this.metrics.get(experiment.versionA);
      const metricsB = this.metrics.get(experiment.versionB);
      
      if (!metricsA || !metricsB) continue;
      
      // Check if we have enough samples
      if (metricsA.totalExecutions < (this.config.minSampleSize || 100) ||
          metricsB.totalExecutions < (this.config.minSampleSize || 100)) {
        continue;
      }
      
      // Calculate success rates
      const successRateA = metricsA.successCount / metricsA.totalExecutions;
      const successRateB = metricsB.successCount / metricsB.totalExecutions;
      
      // Simple statistical significance check
      const significant = this.isStatisticallySignificant(
        metricsA.successCount, metricsA.totalExecutions,
        metricsB.successCount, metricsB.totalExecutions
      );
      
      if (significant) {
        const winner = successRateA > successRateB ? experiment.versionA : experiment.versionB;
        this.concludeExperiment(experiment.id, winner);
      }
    }
  }

  /**
   * Simple statistical significance test
   */
  private isStatisticallySignificant(
    successA: number, totalA: number,
    successB: number, totalB: number
  ): boolean {
    // Z-test for two proportions
    const pA = successA / totalA;
    const pB = successB / totalB;
    const pPooled = (successA + successB) / (totalA + totalB);
    
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/totalA + 1/totalB));
    const z = Math.abs(pA - pB) / se;
    
    // z > 1.96 for 95% confidence
    const zThreshold = this.config.confidenceLevel === 0.99 ? 2.576 : 
                       this.config.confidenceLevel === 0.95 ? 1.96 : 1.645;
    
    return z > zThreshold;
  }

  /**
   * Conclude an experiment
   */
  concludeExperiment(experimentId: string, winnerId: string): void {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment || experiment.endedAt) return;
    
    experiment.endedAt = new Date();
    experiment.winner = winnerId;
    experiment.metrics = {
      versionA: { ...this.metrics.get(experiment.versionA)! },
      versionB: { ...this.metrics.get(experiment.versionB)! },
    };
    
    this.stats.winnersSelected++;
    
    // Deactivate loser
    const loserId = winnerId === experiment.versionA ? experiment.versionB : experiment.versionA;
    const loser = this.versions.get(loserId);
    if (loser) loser.isActive = false;
    
    // Reset traffic to winner only
    this.trafficAllocation.clear();
    this.trafficAllocation.set(winnerId, 1.0);
    
    // Auto-promote if configured
    if (this.config.autoPromote) {
      this.activeVersionId = winnerId;
    }
    
    this.emit('experimentConcluded', { experimentId, winner: winnerId, loser: loserId });
  }

  /**
   * Rollback to baseline
   */
  rollbackToBaseline(): boolean {
    if (!this.baselineVersionId) {
      throw new Error('No baseline version set');
    }
    
    // Deactivate all versions except baseline
    for (const version of this.versions.values()) {
      version.isActive = version.id === this.baselineVersionId;
    }
    
    this.activeVersionId = this.baselineVersionId;
    this.trafficAllocation.clear();
    this.trafficAllocation.set(this.baselineVersionId, 1.0);
    
    this.stats.rollbacksPerformed++;
    
    this.emit('rolledBackToBaseline', { versionId: this.baselineVersionId });
    
    return true;
  }

  /**
   * Get version by ID
   */
  getVersion(versionId: string): StateVersion | undefined {
    return this.versions.get(versionId);
  }

  /**
   * Get version metrics
   */
  getVersionMetrics(versionId: string): VersionMetrics | undefined {
    return this.metrics.get(versionId);
  }

  /**
   * Get all versions
   */
  getAllVersions(): StateVersion[] {
    return Array.from(this.versions.values());
  }

  /**
   * Get active versions
   */
  getActiveVersions(): StateVersion[] {
    return Array.from(this.versions.values()).filter(v => v.isActive);
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string) {
    return this.experiments.find(e => e.id === experimentId);
  }

  /**
   * Get all experiments
   */
  getExperiments() {
    return [...this.experiments];
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & {
    versionCount: number;
    activeVersionCount: number;
    activeExperiments: number;
    uptime: number;
  } {
    return {
      ...this.stats,
      versionCount: this.versions.size,
      activeVersionCount: this.getActiveVersions().length,
      activeExperiments: this.experiments.filter(e => !e.endedAt).length,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Export state
   */
  exportState(): {
    versions: StateVersion[];
    metrics: Array<{ versionId: string; metrics: VersionMetrics }>;
    experiments: Array<{
      id: string;
      versionA: string;
      versionB: string;
      startedAt: Date;
      endedAt?: Date;
      winner?: string;
      metrics: { versionA: VersionMetrics; versionB: VersionMetrics };
    }>;
    activeVersionId: string | null;
    baselineVersionId: string | null;
  } {
    return {
      versions: Array.from(this.versions.values()),
      metrics: Array.from(this.metrics.entries()).map(([id, m]) => ({
        versionId: id,
        metrics: m,
      })),
      experiments: this.experiments,
      activeVersionId: this.activeVersionId,
      baselineVersionId: this.baselineVersionId,
    };
  }

  /**
   * Clear all
   */
  clear(): void {
    this.versions.clear();
    this.metrics.clear();
    this.trafficAllocation.clear();
    this.experiments = [];
    this.activeVersionId = null;
    this.baselineVersionId = null;
    this.emit('cleared');
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    this.emit('shutdown', { stats: this.getStats() });
  }
}

export default StateVersioningSystem;
