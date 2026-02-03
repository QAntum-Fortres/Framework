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
  GhostPath,
  GhostExecutionResult,
  GhostSession,
  GhostExecutionConfig,
} from '../types';

/** Generate unique ID */
function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Ghost Execution Layer
 * 
 * Features:
 * - Parallel testing of alternative selector paths
 * - Non-blocking shadow execution
 * - Automatic knowledge base updates
 * - Winner path detection
 */
export class GhostExecutionLayer extends EventEmitter {
  /** Configuration */
  private config: GhostExecutionConfig;
  
  /** Active ghost sessions */
  private activeSessions: Map<string, GhostSession> = new Map();
  
  /** Path knowledge base (path hash → performance data) */
  private knowledgeBase: Map<string, {
    successRate: number;
    avgTime: number;
    sampleCount: number;
    lastUpdated: Date;
  }> = new Map();
  
  /** Statistics */
  private stats = {
    totalSessions: 0,
    completedSessions: 0,
    improvementsFound: 0,
    pathsTested: 0,
    knowledgeUpdates: 0,
  };
  
  /** Start time */
  private startTime: Date;

  constructor(config?: GhostExecutionConfig) {
    super();
    
    this.config = {
      enabled: config?.enabled ?? true,
      maxGhostThreads: config?.maxGhostThreads || 3,
      ghostTimeout: config?.ghostTimeout || 5000,
      minConfidenceDelta: config?.minConfidenceDelta || 0.1,
      enableScreenshots: config?.enableScreenshots ?? false,
      onlyOnFirstEncounter: config?.onlyOnFirstEncounter ?? false,
    };
    
    this.startTime = new Date();
  }

  /**
   * Start a ghost execution session
   * Tests alternative paths while the main path executes
   */
  async startGhostSession(
    realPath: GhostPath,
    alternativePaths: GhostPath[],
    page: unknown // Playwright Page
  ): Promise<GhostSession> {
    if (!this.config.enabled) {
      throw new Error('Ghost execution is disabled');
    }
    
    const session: GhostSession = {
      id: generateId('ghost'),
      realPath,
      ghostPaths: alternativePaths.slice(0, this.config.maxGhostThreads),
      results: new Map(),
      startedAt: new Date(),
      shouldUpdateKnowledge: true,
    };
    
    this.activeSessions.set(session.id, session);
    this.stats.totalSessions++;
    
    this.emit('sessionStarted', { sessionId: session.id, pathCount: session.ghostPaths.length });
    
    // Execute all ghost paths in parallel (without affecting main test state)
    const ghostPromises = session.ghostPaths.map(path => 
      this.executeGhostPath(session.id, path, page)
    );
    
    // Don't await - let them run in background
    Promise.all(ghostPromises)
      .then(results => this.completeSession(session.id, results))
      .catch(err => this.emit('sessionError', { sessionId: session.id, error: err.message }));
    
    return session;
  }

  /**
   * Execute a single ghost path
   */
  private async executeGhostPath(
    sessionId: string,
    path: GhostPath,
    page: unknown
  ): Promise<GhostExecutionResult> {
    const startTime = Date.now();
    this.stats.pathsTested++;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Ghost timeout')), this.config.ghostTimeout);
      });
      
      // Try to find element using the ghost path's selector
      const findPromise = this.findElementGhost(page, path);
      
      // Race between finding and timeout
      const result = await Promise.race([findPromise, timeoutPromise]);
      
      const executionResult: GhostExecutionResult = {
        path,
        success: result.found,
        executionTime: Date.now() - startTime,
        elementFound: result.found,
        elementState: result.state,
        timestamp: new Date(),
      };
      
      // Get screenshot hash if enabled
      if (this.config.enableScreenshots && result.found) {
        executionResult.screenshotHash = await this.getScreenshotHash(page, path.selector);
      }
      
      return executionResult;
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        path,
        success: false,
        executionTime: Date.now() - startTime,
        error: message,
        elementFound: false,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Find element using ghost path (read-only, doesn't affect state)
   */
  private async findElementGhost(
    page: unknown,
    path: GhostPath
  ): Promise<{ found: boolean; state?: { visible: boolean; enabled: boolean; interactable: boolean } }> {
    if (!page) {
      // Simulate for testing
      return this.simulateFindElement(path);
    }
    
    // Type assertion for page-like object with selector methods
    const browserPage = page as {
      $: (selector: string) => Promise<{
        isVisible: () => Promise<boolean>;
        isEnabled: () => Promise<boolean>;
        boundingBox: () => Promise<{ x: number; y: number; width: number; height: number } | null>;
      } | null>;
    };
    
    try {
      let element: Awaited<ReturnType<typeof browserPage.$>> = null;
      
      switch (path.strategy) {
        case 'semantic':
        case 'text':
          element = await browserPage.$(`text="${path.selector}"`);
          break;
        case 'css':
          element = await browserPage.$(path.selector);
          break;
        case 'xpath':
          element = await browserPage.$(`xpath=${path.selector}`);
          break;
        case 'visual':
          // Visual strategy would use image matching
          element = await browserPage.$(path.selector);
          break;
        default:
          element = await browserPage.$(path.selector);
      }
      
      if (!element) {
        return { found: false };
      }
      
      // Get element state without interacting
      const visible = await element.isVisible().catch(() => false);
      const enabled = await element.isEnabled().catch(() => false);
      const box = await element.boundingBox().catch(() => null);
      
      return {
        found: true,
        state: {
          visible,
          enabled,
          interactable: visible && enabled && box !== null,
        },
      };
      
    } catch {
      return { found: false };
    }
  }

  /**
   * Simulate finding element (for testing without browser)
   */
  private simulateFindElement(path: GhostPath): { found: boolean; state?: { visible: boolean; enabled: boolean; interactable: boolean } } {
    // Simulate with random success based on confidence
    const success = Math.random() < path.confidence;
    
    return {
      found: success,
      state: success ? {
        visible: true,
        enabled: true,
        interactable: true,
      } : undefined,
    };
  }

  /**
   * Get screenshot hash for visual comparison
   */
  private async getScreenshotHash(page: unknown, selector: string): Promise<string> {
    try {
      if (!page) return 'simulated_hash';
      
      // Type assertion for page-like object
      const browserPage = page as {
        $: (selector: string) => Promise<{
          screenshot: (options: { type: string }) => Promise<Buffer>;
        } | null>;
      };
      
      const element = await browserPage.$(selector);
      if (!element) return '';
      
      const screenshot = await element.screenshot({ type: 'png' });
      return crypto.createHash('md5').update(screenshot).digest('hex');
    } catch {
      return '';
    }
  }

  /**
   * Complete a ghost session and determine winner
   */
  private completeSession(sessionId: string, results: GhostExecutionResult[]): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    // Store results
    for (const result of results) {
      session.results.set(result.path.id, result);
    }
    
    // Find winner (best performing path)
    const successfulResults = results.filter(r => r.success && r.elementFound);
    
    if (successfulResults.length > 0) {
      // Sort by execution time (fastest first)
      successfulResults.sort((a, b) => a.executionTime - b.executionTime);
      
      const winner = successfulResults[0];
      session.winnerPath = winner.path;
      
      // Check if ghost found better path than real
      const realResult = session.results.get(session.realPath.id);
      if (realResult && winner.path.id !== session.realPath.id) {
        if (!realResult.success || winner.executionTime < realResult.executionTime * 0.8) {
          this.stats.improvementsFound++;
          this.emit('improvementFound', {
            sessionId,
            realPath: session.realPath,
            betterPath: winner.path,
            timeSaved: realResult.executionTime - winner.executionTime,
          });
        }
      }
    }
    
    // Update knowledge base
    if (session.shouldUpdateKnowledge) {
      this.updateKnowledgeBase(results);
    }
    
    session.completedAt = new Date();
    this.stats.completedSessions++;
    
    this.emit('sessionCompleted', {
      sessionId,
      winner: session.winnerPath,
      resultsCount: results.length,
    });
    
    // Clean up session after a delay
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
    }, 60000);
  }

  /**
   * Update knowledge base with ghost results
   */
  private updateKnowledgeBase(results: GhostExecutionResult[]): void {
    for (const result of results) {
      const pathHash = this.getPathHash(result.path);
      const existing = this.knowledgeBase.get(pathHash);
      
      if (existing) {
        // Update with exponential moving average
        const alpha = 0.3; // Learning rate
        existing.successRate = existing.successRate * (1 - alpha) + (result.success ? 1 : 0) * alpha;
        existing.avgTime = existing.avgTime * (1 - alpha) + result.executionTime * alpha;
        existing.sampleCount++;
        existing.lastUpdated = new Date();
      } else {
        // New entry
        this.knowledgeBase.set(pathHash, {
          successRate: result.success ? 1 : 0,
          avgTime: result.executionTime,
          sampleCount: 1,
          lastUpdated: new Date(),
        });
      }
      
      this.stats.knowledgeUpdates++;
    }
  }

  /**
   * Generate hash for path (for knowledge base key)
   */
  private getPathHash(path: GhostPath): string {
    return crypto.createHash('md5')
      .update(`${path.strategy}:${path.selector}`)
      .digest('hex');
  }

  /**
   * Generate alternative paths for a given selector
   */
  generateAlternativePaths(
    originalSelector: string,
    targetText?: string,
    elementType?: string
  ): GhostPath[] {
    const alternatives: GhostPath[] = [];
    const baseConfidence = 0.7;
    
    // Original path
    alternatives.push({
      id: generateId('path'),
      name: 'Path A (Original)',
      selector: originalSelector,
      strategy: 'css',
      confidence: 0.9,
    });
    
    // Text-based alternative
    if (targetText) {
      alternatives.push({
        id: generateId('path'),
        name: 'Path B (Text)',
        selector: targetText,
        strategy: 'text',
        confidence: baseConfidence + 0.15,
      });
    }
    
    // Simplified CSS (remove complex specificity)
    const simplifiedSelector = this.simplifySelector(originalSelector);
    if (simplifiedSelector !== originalSelector) {
      alternatives.push({
        id: generateId('path'),
        name: 'Path C (Simplified)',
        selector: simplifiedSelector,
        strategy: 'css',
        confidence: baseConfidence,
      });
    }
    
    // Type-based selector
    if (elementType) {
      alternatives.push({
        id: generateId('path'),
        name: 'Path D (Type)',
        selector: elementType,
        strategy: 'css',
        confidence: baseConfidence - 0.1,
      });
    }
    
    // XPath alternative
    if (!originalSelector.includes('xpath')) {
      alternatives.push({
        id: generateId('path'),
        name: 'Path E (XPath)',
        selector: this.toXPath(originalSelector),
        strategy: 'xpath',
        confidence: baseConfidence - 0.05,
      });
    }
    
    return alternatives;
  }

  /**
   * Simplify CSS selector
   */
  private simplifySelector(selector: string): string {
    // Remove nth-child, :not(), complex pseudo-selectors
    let simplified = selector
      .replace(/:nth-child\([^)]+\)/g, '')
      .replace(/:not\([^)]+\)/g, '')
      .replace(/\s+>\s+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    // If we have ID, just use that
    const idMatch = selector.match(/#[\w-]+/);
    if (idMatch) {
      return idMatch[0];
    }
    
    // If we have data-testid, use that
    const testIdMatch = selector.match(/\[data-testid="[^"]+"\]/);
    if (testIdMatch) {
      return testIdMatch[0];
    }
    
    return simplified || selector;
  }

  /**
   * Convert CSS selector to XPath
   */
  private toXPath(cssSelector: string): string {
    // Simple conversion - not comprehensive
    let xpath = cssSelector
      .replace(/#([\w-]+)/g, '[@id="$1"]')
      .replace(/\.([\w-]+)/g, '[contains(@class, "$1")]')
      .replace(/\[([^\]]+)="([^"]+)"\]/g, '[@$1="$2"]');
    
    // If starts with tag, convert to XPath format
    const tagMatch = xpath.match(/^(\w+)/);
    if (tagMatch) {
      xpath = `//${tagMatch[1]}${xpath.slice(tagMatch[0].length)}`;
    } else {
      xpath = `//*${xpath}`;
    }
    
    return xpath;
  }

  /**
   * Get best known path for a selector pattern
   */
  getBestKnownPath(selectorPattern: string): GhostPath | null {
    let bestPath: GhostPath | null = null;
    let bestScore = 0;
    
    for (const [hash, data] of this.knowledgeBase.entries()) {
      if (data.successRate > bestScore && data.sampleCount >= 3) {
        bestScore = data.successRate;
        // We'd need to store full path info - simplified for now
      }
    }
    
    return bestPath;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): GhostSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): GhostSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats & {
    knowledgeBaseSize: number;
    activeSessions: number;
    uptime: number;
    improvementRate: number;
  } {
    return {
      ...this.stats,
      knowledgeBaseSize: this.knowledgeBase.size,
      activeSessions: this.activeSessions.size,
      uptime: Date.now() - this.startTime.getTime(),
      improvementRate: this.stats.completedSessions > 0 
        ? this.stats.improvementsFound / this.stats.completedSessions 
        : 0,
    };
  }

  /**
   * Export knowledge base
   */
  exportKnowledge(): Array<{
    pathHash: string;
    successRate: number;
    avgTime: number;
    sampleCount: number;
    lastUpdated: Date;
  }> {
    const data: unknown[] = [];
    
    for (const [hash, value] of this.knowledgeBase.entries()) {
      data.push({
        pathHash: hash,
        ...value,
      });
    }
    
    return data;
  }

  /**
   * Import knowledge base
   */
  importKnowledge(data: Array<{
    pathHash: string;
    successRate: number;
    avgTime: number;
    sampleCount: number;
    lastUpdated: Date;
  }>): void {
    for (const entry of data) {
      this.knowledgeBase.set(entry.pathHash, {
        successRate: entry.successRate,
        avgTime: entry.avgTime,
        sampleCount: entry.sampleCount,
        lastUpdated: new Date(entry.lastUpdated),
      });
    }
  }

  /**
   * Clear knowledge base
   */
  clearKnowledge(): void {
    this.knowledgeBase.clear();
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    // Cancel all active sessions
    for (const [sessionId] of this.activeSessions) {
      this.emit('sessionCancelled', { sessionId, reason: 'shutdown' });
    }
    this.activeSessions.clear();
    
    this.emit('shutdown', { stats: this.getStats() });
  }
}

export default GhostExecutionLayer;
