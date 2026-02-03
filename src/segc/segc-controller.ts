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
import { GhostExecutionLayer } from './ghost/ghost-execution-layer';
import { PredictiveStatePreloader } from './predictive/state-preloader';
import { GeneticMutationEngine } from './mutations/mutation-engine';
import { HotSwapModuleLoader } from './hotswap/module-loader';
import { StateVersioningSystem } from './versioning/state-versioner';
import { SEGCConfig, SEGCStats, GhostPath, GeneticMutation, StateVersion } from './types';

/**
 * Self-Evolving Genetic Core
 * 
 * The "Metabolism" of QANTUM
 * - Learns from every test execution
 * - Self-optimizes selector strategies
 * - Predicts and preloads future states
 * - Hot-swaps implementations without restart
 */
export class SEGCController extends EventEmitter {
  /** Configuration */
  private config: SEGCConfig;
  
  /** Ghost Execution Layer */
  public ghost: GhostExecutionLayer;
  
  /** Predictive State Pre-loader */
  public predictive: PredictiveStatePreloader;
  
  /** Genetic Mutation Engine */
  public mutations: GeneticMutationEngine;
  
  /** Hot-Swap Module Loader */
  public hotswap: HotSwapModuleLoader;
  
  /** State Versioning System */
  public versioning: StateVersioningSystem;
  
  /** Start time */
  private startTime: Date;
  
  /** Global stats */
  private globalStats = {
    totalLearningCycles: 0,
    improvementsApplied: 0,
    rollbacksPerformed: 0,
  };

  constructor(config?: SEGCConfig) {
    super();
    
    this.config = {
      enabled: config?.enabled ?? true,
      learningRate: config?.learningRate || 0.1,
      verbose: config?.verbose ?? false,
      ...config,
    };
    
    // Initialize all components
    this.ghost = new GhostExecutionLayer(this.config.ghostExecution);
    this.predictive = new PredictiveStatePreloader(this.config.predictive);
    this.mutations = new GeneticMutationEngine(this.config.mutationEngine);
    this.hotswap = new HotSwapModuleLoader(this.config.hotSwap);
    this.versioning = new StateVersioningSystem(this.config.stateVersioning);
    
    this.startTime = new Date();
    
    // Wire up cross-component events
    this.setupEventWiring();
    
    if (this.config.verbose) {
      this.log('SEGC Controller initialized');
    }
  }

  /**
   * Setup event wiring between components
   */
  private setupEventWiring(): void {
    // Ghost improvements → Mutations
    this.ghost.on('improvementFound', (data) => {
      this.emit('improvement', {
        source: 'ghost',
        ...data,
      });
      this.globalStats.improvementsApplied++;
    });
    
    // Mutation applied → Log
    this.mutations.on('mutationApplied', (data) => {
      this.emit('mutation', {
        action: 'applied',
        ...data,
      });
    });
    
    // Versioning winner → Update active
    this.versioning.on('experimentConcluded', (data) => {
      this.emit('experiment', {
        action: 'concluded',
        ...data,
      });
    });
    
    // Hot-swap event → Log
    this.hotswap.on('swapped', (data) => {
      this.emit('hotswap', data);
    });
    
    // Predictive cache hit → Stats
    this.predictive.on('timeSaved', (data) => {
      this.emit('optimization', {
        source: 'predictive',
        ...data,
      });
    });
  }

  /**
   * Run a learning cycle
   * Analyzes recent data and applies improvements
   */
  async runLearningCycle(): Promise<{
    improvements: number;
    mutations: GeneticMutation[];
    predictions: number;
  }> {
    this.globalStats.totalLearningCycles++;
    
    // Get pending mutations
    const pendingMutations = this.mutations.getPendingMutations();
    const appliedMutations: GeneticMutation[] = [];
    
    // Apply high-confidence mutations
    for (const mutation of pendingMutations) {
      if (mutation.confidence >= 0.8) {
        const success = await this.mutations.applyMutation(mutation.id);
        if (success) {
          appliedMutations.push(mutation);
        }
      }
    }
    
    // Get prediction stats
    const predictiveStats = this.predictive.getStats();
    
    this.emit('learningCycle', {
      cycle: this.globalStats.totalLearningCycles,
      improvements: appliedMutations.length,
      predictions: predictiveStats.predictionsGenerated,
    });
    
    return {
      improvements: appliedMutations.length,
      mutations: appliedMutations,
      predictions: predictiveStats.predictionsGenerated,
    };
  }

  /**
   * Test alternative paths for a selector
   */
  async testAlternativePaths(
    currentSelector: string,
    page: unknown,
    options?: {
      targetText?: string;
      elementType?: string;
    }
  ): Promise<GhostPath | null> {
    // Generate alternatives
    const alternatives = this.ghost.generateAlternativePaths(
      currentSelector,
      options?.targetText,
      options?.elementType
    );
    
    if (alternatives.length < 2) {
      return null;
    }
    
    // Start ghost session
    const session = await this.ghost.startGhostSession(
      alternatives[0], // First is original
      alternatives.slice(1), // Rest are alternatives
      page
    );
    
    // Wait for session to complete
    return new Promise((resolve) => {
      this.ghost.once('sessionCompleted', (data) => {
        if (data.sessionId === session.id) {
          resolve(data.winner || null);
        }
      });
      
      // Timeout fallback
      setTimeout(() => resolve(null), 10000);
    });
  }

  /**
   * Record a test failure for mutation analysis
   */
  recordFailure(failure: {
    error: string;
    selector?: string;
    testName?: string;
  }): void {
    this.mutations.recordFailure(failure);
  }

  /**
   * Record a state change for prediction learning
   */
  recordStateChange(newState: string): void {
    this.predictive.recordStateChange(newState);
  }

  /**
   * Get precomputed selector for a state
   */
  getPrecomputedSelector(stateId: string, selector: string): string[] | null {
    const precomputed = this.predictive.getPrecomputedSelector(stateId, selector);
    if (!precomputed) return null;
    
    return [precomputed.original, ...precomputed.alternatives];
  }

  /**
   * Create a new strategy version
   */
  createVersion(options: {
    name: string;
    description?: string;
    strategy: object;
    isBaseline?: boolean;
  }): StateVersion {
    return this.versioning.createVersion(options);
  }

  /**
   * Start A/B experiment
   */
  startExperiment(versionA: string, versionB: string, trafficSplit?: number): string {
    return this.versioning.startExperiment(versionA, versionB, trafficSplit);
  }

  /**
   * Get current active version
   */
  getActiveVersion(): StateVersion | null {
    return this.versioning.selectVersion();
  }

  /**
   * Record version execution result
   */
  recordVersionResult(versionId: string, result: {
    success: boolean;
    executionTime: number;
    error?: string;
  }): void {
    this.versioning.recordResult(versionId, result);
  }

  /**
   * Register a module for hot-swapping
   */
  registerSwappableModule(name: string, instance: object): void {
    this.hotswap.registerModule(name, instance);
  }

  /**
   * Get comprehensive statistics
   */
  getStats(): SEGCStats {
    const ghostStats = this.ghost.getStats();
    const predictiveStats = this.predictive.getStats();
    const mutationStats = this.mutations.getStats();
    const hotswapStats = this.hotswap.getStats();
    const versioningStats = this.versioning.getStats();
    
    return {
      ghostExecutions: ghostStats.totalSessions,
      ghostImprovements: ghostStats.improvementsFound,
      predictionsMade: predictiveStats.predictionsGenerated,
      predictionAccuracy: predictiveStats.cacheHitRate,
      mutationsProposed: mutationStats.mutationsGenerated,
      mutationsApplied: mutationStats.mutationsApplied,
      hotSwapsPerformed: hotswapStats.swapsPerformed,
      overallFitnessImprovement: this.calculateOverallFitness(),
      activeVersions: versioningStats.activeVersionCount,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Calculate overall fitness improvement
   */
  private calculateOverallFitness(): number {
    const ghostStats = this.ghost.getStats();
    const mutationStats = this.mutations.getStats();
    
    // Simple weighted average
    const ghostContribution = ghostStats.improvementRate * 0.3;
    const mutationContribution = mutationStats.successRate * 0.4;
    const predictiveContribution = this.predictive.getStats().cacheHitRate * 0.3;
    
    return ghostContribution + mutationContribution + predictiveContribution;
  }

  /**
   * Export all knowledge
   */
  exportKnowledge(): {
    ghost: ReturnType<GhostExecutionLayer['exportKnowledge']>;
    predictive: ReturnType<PredictiveStatePreloader['exportStateMachine']>;
    mutations: ReturnType<GeneticMutationEngine['exportHistory']>;
    versioning: ReturnType<StateVersioningSystem['exportState']>;
  } {
    return {
      ghost: this.ghost.exportKnowledge(),
      predictive: this.predictive.exportStateMachine(),
      mutations: this.mutations.exportHistory(),
      versioning: this.versioning.exportState(),
    };
  }

  /**
   * Import knowledge
   */
  importKnowledge(data: {
    ghost?: ReturnType<GhostExecutionLayer['exportKnowledge']>;
    predictive?: ReturnType<PredictiveStatePreloader['exportStateMachine']>;
  }): void {
    if (data.ghost) {
      this.ghost.importKnowledge(data.ghost);
    }
    if (data.predictive) {
      this.predictive.importStateMachine(data.predictive);
    }
  }

  /**
   * Log message
   */
  private log(message: string, data?: unknown): void {
    if (this.config.verbose) {
      console.log(`[SEGC] ${message}`, data || '');
    }
  }

  /**
   * Shutdown all components
   */
  async shutdown(): Promise<void> {
    await Promise.all([
      this.ghost.shutdown(),
      this.predictive.shutdown(),
      this.mutations.shutdown(),
      this.hotswap.shutdown(),
      this.versioning.shutdown(),
    ]);
    
    this.emit('shutdown', { stats: this.getStats() });
    
    if (this.config.verbose) {
      this.log('SEGC Controller shutdown complete');
    }
  }
}

export default SEGCController;
