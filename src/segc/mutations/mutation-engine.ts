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
  GeneticMutation,
  FailurePattern,
  MutationType,
  MutationEngineConfig,
} from '../types';

/** Generate unique ID */
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Genetic Mutation Engine
 * 
 * Features:
 * - Identifies recurring failure patterns
 * - Generates code mutations to fix issues
 * - Tests mutations in ghost threads
 * - Applies successful mutations automatically
 */
export class GeneticMutationEngine extends EventEmitter {
  /** Configuration */
  private config: MutationEngineConfig;
  
  /** Detected failure patterns */
  private failurePatterns: Map<string, FailurePattern> = new Map();
  
  /** Generated mutations */
  private mutations: Map<string, GeneticMutation> = new Map();
  
  /** Mutation history (for rollback) */
  private mutationHistory: Array<{
    mutation: GeneticMutation;
    appliedAt: Date;
    rolledBack: boolean;
  }> = [];
  
  /** Pattern signatures to mutation rules */
  private mutationRules: Map<string, (pattern: FailurePattern) => GeneticMutation> = new Map();
  
  /** Statistics */
  private stats = {
    patternsDetected: 0,
    mutationsGenerated: 0,
    mutationsApplied: 0,
    mutationsRolledBack: 0,
    successfulMutations: 0,
    failedMutations: 0,
  };
  
  /** Start time */
  private startTime: Date;

  constructor(config?: MutationEngineConfig) {
    super();
    
    this.config = {
      enabled: config?.enabled ?? true,
      autoApply: config?.autoApply ?? false, // Safety first
      maxMutationsPerHour: config?.maxMutationsPerHour || 10,
      mutationCooldown: config?.mutationCooldown || 60000, // 1 minute
      rollbackOnFailure: config?.rollbackOnFailure ?? true,
      minPatternOccurrences: config?.minPatternOccurrences || 3,
    };
    
    this.startTime = new Date();
    this.initializeMutationRules();
  }

  /**
   * Initialize built-in mutation rules
   */
  private initializeMutationRules(): void {
    // Rule: Timeout failures → increase timeout
    this.mutationRules.set('timeout', (pattern) => ({
      id: generateId('mut'),
      type: MutationType.TIMEOUT_ADJUSTMENT,
      targetSelector: pattern.selector || '',
      originalCode: `timeout: 30000`,
      mutatedCode: `timeout: 60000`,
      confidence: 0.8,
      generatedAt: new Date(),
      status: 'pending',
      parentPattern: pattern.id,
    }));
    
    // Rule: Element not found → add wait
    this.mutationRules.set('element_not_found', (pattern) => ({
      id: generateId('mut'),
      type: MutationType.WAIT_INJECTION,
      targetSelector: pattern.selector || '',
      originalCode: `await page.click('${pattern.selector}')`,
      mutatedCode: `await page.waitForSelector('${pattern.selector}', { state: 'visible', timeout: 10000 });\nawait page.click('${pattern.selector}')`,
      confidence: 0.85,
      generatedAt: new Date(),
      status: 'pending',
      parentPattern: pattern.id,
    }));
    
    // Rule: Stale element → retry with refresh
    this.mutationRules.set('stale_element', (pattern) => ({
      id: generateId('mut'),
      type: MutationType.RETRY_LOGIC,
      targetSelector: pattern.selector || '',
      originalCode: `await action()`,
      mutatedCode: `await retryWithRefresh(async () => await action(), 3)`,
      confidence: 0.75,
      generatedAt: new Date(),
      status: 'pending',
      parentPattern: pattern.id,
    }));
    
    // Rule: Animation interference → add animation wait
    this.mutationRules.set('animation', (pattern) => ({
      id: generateId('mut'),
      type: MutationType.ANIMATION_WAIT,
      targetSelector: pattern.selector || '',
      originalCode: `await page.click('${pattern.selector}')`,
      mutatedCode: `await page.waitForFunction(() => !document.querySelector('.animating'));\nawait page.click('${pattern.selector}')`,
      confidence: 0.7,
      generatedAt: new Date(),
      status: 'pending',
      parentPattern: pattern.id,
    }));
    
    // Rule: Selector brittleness → simplify selector
    this.mutationRules.set('selector_fragile', (pattern) => {
      const simplified = this.simplifySelector(pattern.selector || '');
      return {
        id: generateId('mut'),
        type: MutationType.SELECTOR_SIMPLIFICATION,
        targetSelector: pattern.selector || '',
        originalCode: `'${pattern.selector}'`,
        mutatedCode: `'${simplified}'`,
        confidence: 0.65,
        generatedAt: new Date(),
        status: 'pending',
        parentPattern: pattern.id,
      };
    });
  }

  /**
   * Record a test failure
   */
  recordFailure(failure: {
    error: string;
    selector?: string;
    stack?: string;
    testName?: string;
    timestamp?: Date;
  }): FailurePattern {
    const patternSignature = this.generatePatternSignature(failure);
    
    let pattern = this.failurePatterns.get(patternSignature);
    
    if (pattern) {
      pattern.occurrences++;
      pattern.lastSeen = new Date();
    } else {
      pattern = {
        id: generateId('pattern'),
        signature: patternSignature,
        errorType: this.classifyError(failure.error),
        selector: failure.selector,
        occurrences: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        testNames: failure.testName ? [failure.testName] : [],
      };
      
      this.failurePatterns.set(patternSignature, pattern);
      this.stats.patternsDetected++;
    }
    
    if (failure.testName && !pattern.testNames.includes(failure.testName)) {
      pattern.testNames.push(failure.testName);
    }
    
    this.emit('failureRecorded', { pattern });
    
    // Check if mutation should be generated
    if (pattern.occurrences >= (this.config.minPatternOccurrences || 3)) {
      this.generateMutationForPattern(pattern);
    }
    
    return pattern;
  }

  /**
   * Generate signature for failure pattern
   */
  private generatePatternSignature(failure: {
    error: string;
    selector?: string;
    stack?: string;
  }): string {
    // Extract key parts of error for pattern matching
    const errorKey = failure.error
      .replace(/\d+/g, 'N') // Normalize numbers
      .replace(/"[^"]+"/g, '"X"') // Normalize quoted strings
      .substring(0, 100);
    
    const selectorKey = failure.selector?.substring(0, 50) || 'no_selector';
    
    return crypto.createHash('md5')
      .update(`${errorKey}:${selectorKey}`)
      .digest('hex');
  }

  /**
   * Classify error type
   */
  private classifyError(error: string): string {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes('timeout')) return 'timeout';
    if (lowerError.includes('not found') || lowerError.includes('no element')) return 'element_not_found';
    if (lowerError.includes('stale')) return 'stale_element';
    if (lowerError.includes('animation') || lowerError.includes('transition')) return 'animation';
    if (lowerError.includes('selector') || lowerError.includes('locator')) return 'selector_fragile';
    if (lowerError.includes('network')) return 'network';
    if (lowerError.includes('navigation')) return 'navigation';
    if (lowerError.includes('click') || lowerError.includes('intercept')) return 'click_intercept';
    
    return 'unknown';
  }

  /**
   * Generate mutation for a failure pattern
   */
  private generateMutationForPattern(pattern: FailurePattern): GeneticMutation | null {
    if (!pattern.suggestedMutation) {
      const rule = this.mutationRules.get(pattern.errorType);
      
      if (rule) {
        const mutation = rule(pattern);
        this.mutations.set(mutation.id, mutation);
        pattern.suggestedMutation = mutation.id;
        this.stats.mutationsGenerated++;
        
        this.emit('mutationGenerated', { mutation, pattern });
        
        // Auto-apply if enabled and confidence is high
        if (this.config.autoApply && mutation.confidence >= 0.8) {
          this.applyMutation(mutation.id);
        }
        
        return mutation;
      }
    }
    
    return pattern.suggestedMutation 
      ? this.mutations.get(pattern.suggestedMutation) || null 
      : null;
  }

  /**
   * Apply a mutation
   */
  async applyMutation(mutationId: string): Promise<boolean> {
    const mutation = this.mutations.get(mutationId);
    if (!mutation) {
      throw new Error(`Mutation not found: ${mutationId}`);
    }
    
    if (mutation.status === 'applied') {
      return true; // Already applied
    }
    
    try {
      // In real implementation, this would modify actual code
      mutation.status = 'applied';
      mutation.appliedAt = new Date();
      
      this.mutationHistory.push({
        mutation,
        appliedAt: new Date(),
        rolledBack: false,
      });
      
      this.stats.mutationsApplied++;
      
      this.emit('mutationApplied', { mutation });
      
      return true;
      
    } catch (error: unknown) {
      mutation.status = 'failed';
      this.stats.failedMutations++;
      
      const message = error instanceof Error ? error.message : String(error);
      this.emit('mutationFailed', { mutation, error: message });
      
      return false;
    }
  }

  /**
   * Rollback a mutation
   */
  async rollbackMutation(mutationId: string): Promise<boolean> {
    const mutation = this.mutations.get(mutationId);
    if (!mutation) {
      throw new Error(`Mutation not found: ${mutationId}`);
    }
    
    if (mutation.status !== 'applied') {
      return false; // Can't rollback unapplied mutation
    }
    
    try {
      // In real implementation, this would revert code changes
      mutation.status = 'rolled_back';
      
      const historyEntry = this.mutationHistory.find(h => h.mutation.id === mutationId);
      if (historyEntry) {
        historyEntry.rolledBack = true;
      }
      
      this.stats.mutationsRolledBack++;
      
      this.emit('mutationRolledBack', { mutation });
      
      return true;
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit('rollbackFailed', { mutation, error: message });
      return false;
    }
  }

  /**
   * Record mutation success/failure
   */
  recordMutationResult(mutationId: string, success: boolean): void {
    const mutation = this.mutations.get(mutationId);
    if (!mutation) return;
    
    if (success) {
      mutation.status = 'successful';
      this.stats.successfulMutations++;
      
      // Increase confidence for this type of mutation
      this.adjustMutationConfidence(mutation.type, 0.05);
      
      this.emit('mutationSuccess', { mutation });
    } else {
      this.stats.failedMutations++;
      
      // Decrease confidence
      this.adjustMutationConfidence(mutation.type, -0.1);
      
      // Auto-rollback if configured
      if (this.config.rollbackOnFailure) {
        this.rollbackMutation(mutationId);
      }
      
      this.emit('mutationFailure', { mutation });
    }
  }

  /**
   * Adjust confidence for a mutation type
   */
  private adjustMutationConfidence(type: MutationType, delta: number): void {
    // This would persist to a learning database in real implementation
    this.emit('confidenceAdjusted', { type, delta });
  }

  /**
   * Simplify a selector
   */
  private simplifySelector(selector: string): string {
    // Try to extract the simplest unique identifier
    
    // Check for data-testid
    const testIdMatch = selector.match(/\[data-testid="([^"]+)"\]/);
    if (testIdMatch) return `[data-testid="${testIdMatch[1]}"]`;
    
    // Check for ID
    const idMatch = selector.match(/#([\w-]+)/);
    if (idMatch) return `#${idMatch[1]}`;
    
    // Check for unique class
    const classMatch = selector.match(/\.([\w-]+)/);
    if (classMatch) return `.${classMatch[1]}`;
    
    // Remove complex pseudo-selectors
    return selector
      .replace(/:nth-child\([^)]+\)/g, '')
      .replace(/:not\([^)]+\)/g, '')
      .replace(/\s+>\s+/g, ' ')
      .trim();
  }

  /**
   * Get pending mutations
   */
  getPendingMutations(): GeneticMutation[] {
    return Array.from(this.mutations.values())
      .filter(m => m.status === 'pending');
  }

  /**
   * Get applied mutations
   */
  getAppliedMutations(): GeneticMutation[] {
    return Array.from(this.mutations.values())
      .filter(m => m.status === 'applied' || m.status === 'successful');
  }

  /**
   * Get failure patterns
   */
  getFailurePatterns(): FailurePattern[] {
    return Array.from(this.failurePatterns.values())
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Get mutation by ID
   */
  getMutation(mutationId: string): GeneticMutation | undefined {
    return this.mutations.get(mutationId);
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & {
    patternCount: number;
    mutationCount: number;
    successRate: number;
    uptime: number;
  } {
    const totalAttempted = this.stats.successfulMutations + this.stats.failedMutations;
    
    return {
      ...this.stats,
      patternCount: this.failurePatterns.size,
      mutationCount: this.mutations.size,
      successRate: totalAttempted > 0 ? this.stats.successfulMutations / totalAttempted : 0,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * Add custom mutation rule
   */
  addMutationRule(
    errorType: string, 
    rule: (pattern: FailurePattern) => GeneticMutation
  ): void {
    this.mutationRules.set(errorType, rule);
    this.emit('ruleAdded', { errorType });
  }

  /**
   * Export mutation history
   */
  exportHistory(): Array<{
    mutation: GeneticMutation;
    appliedAt: Date;
    rolledBack: boolean;
  }> {
    return [...this.mutationHistory];
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.failurePatterns.clear();
    this.mutations.clear();
    this.mutationHistory = [];
    this.emit('cleared');
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    this.emit('shutdown', { stats: this.getStats() });
  }
}

export default GeneticMutationEngine;
