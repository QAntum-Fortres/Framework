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

import * as fs from 'fs';
import * as path from 'path';
import { DistillationEntry, TaskResult, SwarmTask } from '../types';
import { generateEntryId, generateTraceId } from '../utils/id-generator';

/** Distillation logger configuration */
export interface DistillationConfig {
  /** Output file path */
  outputPath?: string;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Minimum quality score */
  minQuality?: number;
  /** Max entries per file (for rotation) */
  maxEntriesPerFile?: number;
  /** Enable auto-flush */
  autoFlush?: boolean;
  /** Flush interval in ms */
  flushInterval?: number;
  /** Include metadata in output */
  includeMetadata?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

/** HuggingFace conversation format */
interface HFConversation {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

/** Quality assessment result */
interface QualityAssessment {
  score: number;
  factors: Record<string, number>;
  passed: boolean;
}

/**
 * Distillation Logger
 * 
 * Captures high-quality execution traces for:
 * - Fine-tuning local models (Gemma, Llama)
 * - Building domain-specific knowledge
 * - Improving selector generation
 * - Teaching reasoning patterns
 */
export class DistillationLogger {
  /** Configuration */
  private config: DistillationConfig;
  
  /** In-memory buffer */
  private buffer: DistillationEntry[] = [];
  
  /** Total entries written */
  private totalEntries: number = 0;
  
  /** Current file index */
  private fileIndex: number = 0;
  
  /** Flush timer */
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  
  /** Statistics */
  private stats = {
    accepted: 0,
    rejected: 0,
    flushed: 0,
  };

  constructor(config?: DistillationConfig) {
    this.config = {
      outputPath: config?.outputPath || './fine-tuning-dataset.jsonl',
      minConfidence: config?.minConfidence || 0.75,
      minQuality: config?.minQuality || 0.7,
      maxEntriesPerFile: config?.maxEntriesPerFile || 10000,
      autoFlush: config?.autoFlush ?? true,
      flushInterval: config?.flushInterval || 60000, // 1 minute
      includeMetadata: config?.includeMetadata ?? true,
      verbose: config?.verbose ?? false,
    };
    
    if (this.config.autoFlush) {
      this.startAutoFlush();
    }
  }

  /**
   * Record a successful execution
   */
  async record(
    task: SwarmTask,
    result: TaskResult,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    // Skip if not successful
    if (!result.success) {
      this.log(`Skipping failed task: ${task.id}`);
      this.stats.rejected++;
      return false;
    }
    
    // Check confidence threshold
    if (result.confidence !== undefined && result.confidence < this.config.minConfidence!) {
      this.log(`Skipping low confidence task: ${result.confidence}`);
      this.stats.rejected++;
      return false;
    }
    
    // Assess quality
    const quality = this.assessQuality(task, result);
    if (!quality.passed) {
      this.log(`Skipping low quality task: ${quality.score}`);
      this.stats.rejected++;
      return false;
    }
    
    // Create entry
    const entry = this.createEntry(task, result, context, quality.score);
    
    // Add to buffer
    this.buffer.push(entry);
    this.stats.accepted++;
    
    this.log(`Recorded entry: ${entry.id}`);
    
    // Check if buffer needs flushing
    if (this.buffer.length >= 100) {
      await this.flush();
    }
    
    return true;
  }

  /**
   * Assess quality of execution
   */
  private assessQuality(task: SwarmTask, result: TaskResult): QualityAssessment {
    const factors: Record<string, number> = {};
    
    // Factor 1: Confidence (40%)
    factors.confidence = result.confidence !== undefined ? result.confidence : 0.5;
    
    // Factor 2: Duration reasonableness (20%)
    const expectedDuration = this.getExpectedDuration(task.type);
    const durationRatio = Math.min(result.duration / expectedDuration, 2);
    factors.duration = Math.max(0, 1 - Math.abs(1 - durationRatio) * 0.5);
    
    // Factor 3: Reasoning completeness (25%)
    const reasoningCount = result.reasoning?.length || 0;
    factors.reasoning = Math.min(1, reasoningCount / 3);
    
    // Factor 4: Selector specificity (15%)
    if (result.selectorUsed) {
      factors.selector = this.assessSelectorQuality(result.selectorUsed);
    } else {
      factors.selector = 0.5;
    }
    
    // Weighted average
    const score = 
      factors.confidence * 0.4 +
      factors.duration * 0.2 +
      factors.reasoning * 0.25 +
      factors.selector * 0.15;
    
    return {
      score,
      factors,
      passed: score >= this.config.minQuality!,
    };
  }

  /**
   * Get expected duration for task type
   */
  private getExpectedDuration(type: SwarmTask['type']): number {
    const expectations: Record<SwarmTask['type'], number> = {
      navigate: 2000,
      click: 500,
      fill: 400,
      extract: 1000,
      validate: 600,
      custom: 1500,
    };
    return expectations[type] || 1000;
  }

  /**
   * Assess selector quality
   */
  private assessSelectorQuality(selector: string): number {
    // Best: data-testid
    if (selector.includes('data-testid')) return 1.0;
    
    // Great: ID selector
    if (selector.startsWith('#')) return 0.95;
    
    // Good: Aria label
    if (selector.includes('aria-label')) return 0.85;
    
    // OK: Name attribute
    if (selector.includes('[name=')) return 0.75;
    
    // Fair: Text-based
    if (selector.includes('text=') || selector.includes('has-text')) return 0.65;
    
    // Poor: Class-based
    if (selector.startsWith('.')) return 0.4;
    
    // Default
    return 0.5;
  }

  /**
   * Create a distillation entry
   */
  private createEntry(
    task: SwarmTask,
    result: TaskResult,
    context: Record<string, unknown> | undefined,
    quality: number
  ): DistillationEntry {
    // Build prompt from task
    const prompt = this.buildPrompt(task, context);
    
    // Build completion from result
    const completion = this.buildCompletion(task, result);
    
    // Extract domain from context
    const domain = this.extractDomain(context?.url || task.target);
    
    // Build tags
    const tags = this.buildTags(task, result);
    
    return {
      id: generateEntryId(),
      traceId: task.traceId || generateTraceId(),
      timestamp: new Date(),
      prompt,
      completion,
      taskType: task.type,
      domain,
      reasoning: result.reasoning || [],
      selector: result.selectorUsed,
      confidence: result.confidence || 0.8,
      tags,
      quality,
    };
  }

  /**
   * Build prompt from task
   */
  private buildPrompt(task: SwarmTask, context?: Record<string, unknown>): string {
    const parts: string[] = [];
    
    // System context
    parts.push(`Task: ${task.type}`);
    parts.push(`Target: ${task.target}`);
    
    if (task.expectedOutcome) {
      parts.push(`Expected: ${task.expectedOutcome}`);
    }
    
    if (task.params) {
      parts.push(`Parameters: ${JSON.stringify(task.params)}`);
    }
    
    if (context) {
      parts.push(`Context: ${JSON.stringify(context)}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Build completion from result
   */
  private buildCompletion(task: SwarmTask, result: TaskResult): string {
    const parts: string[] = [];
    
    // Include reasoning
    if (result.reasoning && result.reasoning.length > 0) {
      parts.push('Reasoning:');
      for (const step of result.reasoning) {
        parts.push(`- ${step}`);
      }
    }
    
    // Include selector
    if (result.selectorUsed) {
      parts.push(`\nSelector used: ${result.selectorUsed}`);
    }
    
    // Include result
    parts.push(`\nResult: ${result.success ? 'Success' : 'Failed'}`);
    
    if (result.data) {
      parts.push(`Data: ${JSON.stringify(result.data)}`);
    }
    
    return parts.join('\n');
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(urlOrTarget: string): string {
    try {
      if (urlOrTarget.startsWith('http')) {
        const url = new URL(urlOrTarget);
        return url.hostname;
      }
    } catch {}
    return 'unknown';
  }

  /**
   * Build tags for entry
   */
  private buildTags(task: SwarmTask, result: TaskResult): string[] {
    const tags: string[] = [task.type];
    
    if (result.confidence && result.confidence > 0.9) {
      tags.push('high-confidence');
    }
    
    if (result.selectorUsed) {
      if (result.selectorUsed.includes('data-testid')) {
        tags.push('stable-selector');
      } else if (result.selectorUsed.includes('text=')) {
        tags.push('text-selector');
      }
    }
    
    if (task.params?.fallback) {
      tags.push('fallback');
    }
    
    return tags;
  }

  /**
   * Flush buffer to file
   */
  async flush(): Promise<number> {
    if (this.buffer.length === 0) {
      return 0;
    }
    
    const entries = [...this.buffer];
    this.buffer = [];
    
    // Determine output file
    const outputPath = this.getOutputPath();
    
    // Convert to JSONL
    const lines = entries.map(entry => this.entryToJsonl(entry));
    
    try {
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Append to file
      fs.appendFileSync(outputPath, lines.join('\n') + '\n');
      
      this.totalEntries += entries.length;
      this.stats.flushed += entries.length;
      
      this.log(`Flushed ${entries.length} entries to ${outputPath}`);
      
      // Check for file rotation
      if (this.totalEntries >= this.config.maxEntriesPerFile!) {
        this.rotateFile();
      }
      
      return entries.length;
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Flush failed: ${message}`);
      // Put entries back in buffer
      this.buffer.unshift(...entries);
      throw error;
    }
  }

  /**
   * Convert entry to JSONL format
   */
  private entryToJsonl(entry: DistillationEntry): string {
    // HuggingFace conversation format
    const hfEntry: HFConversation & { metadata?: Record<string, unknown> } = {
      messages: [
        {
          role: 'system',
          content: 'You are an expert QA automation assistant that helps find and interact with web elements.',
        },
        {
          role: 'user',
          content: entry.prompt,
        },
        {
          role: 'assistant',
          content: entry.completion,
        },
      ],
    };
    
    if (this.config.includeMetadata) {
      hfEntry.metadata = {
        id: entry.id,
        traceId: entry.traceId,
        timestamp: entry.timestamp.toISOString(),
        taskType: entry.taskType,
        domain: entry.domain,
        confidence: entry.confidence,
        quality: entry.quality,
        tags: entry.tags,
        selector: entry.selector,
      };
    }
    
    return JSON.stringify(hfEntry);
  }

  /**
   * Get output file path
   */
  private getOutputPath(): string {
    if (this.fileIndex === 0) {
      return this.config.outputPath!;
    }
    
    const ext = path.extname(this.config.outputPath!);
    const base = this.config.outputPath!.slice(0, -ext.length);
    return `${base}_${this.fileIndex}${ext}`;
  }

  /**
   * Rotate to new file
   */
  private rotateFile(): void {
    this.fileIndex++;
    this.totalEntries = 0;
    this.log(`Rotated to file index: ${this.fileIndex}`);
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.stopAutoFlush();
    this.flushTimer = setInterval(() => {
      this.flush().catch(err => this.log(`Auto-flush error: ${err.message}`));
    }, this.config.flushInterval);
  }

  /**
   * Stop auto-flush timer
   */
  private stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Export in different formats
   */
  async exportAs(format: 'jsonl' | 'csv' | 'parquet', outputPath: string): Promise<void> {
    // Ensure buffer is flushed
    await this.flush();
    
    // Read current file
    const currentPath = this.getOutputPath();
    if (!fs.existsSync(currentPath)) {
      throw new Error('No data to export');
    }
    
    const content = fs.readFileSync(currentPath, 'utf-8');
    const entries = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    
    switch (format) {
      case 'jsonl':
        // Already in JSONL, just copy
        fs.copyFileSync(currentPath, outputPath);
        break;
        
      case 'csv':
        await this.exportToCsv(entries, outputPath);
        break;
        
      case 'parquet':
        // Would need parquet library
        throw new Error('Parquet export not yet implemented');
        
      default:
        throw new Error(`Unknown format: ${format}`);
    }
    
    this.log(`Exported to ${format}: ${outputPath}`);
  }

  /**
   * Export to CSV format
   */
  private async exportToCsv(entries: Array<{
    messages?: Array<{ content?: string }>;
    metadata?: {
      taskType?: string;
      domain?: string;
      confidence?: number;
      quality?: number;
      tags?: string[];
    };
  }>, outputPath: string): Promise<void> {
    const headers = ['prompt', 'completion', 'task_type', 'domain', 'confidence', 'quality', 'tags'];
    const lines = [headers.join(',')];
    
    for (const entry of entries) {
      const row = [
        `"${this.escapeCsv(entry.messages[1]?.content || '')}"`,
        `"${this.escapeCsv(entry.messages[2]?.content || '')}"`,
        `"${entry.metadata?.taskType || ''}"`,
        `"${entry.metadata?.domain || ''}"`,
        entry.metadata?.confidence || '',
        entry.metadata?.quality || '',
        `"${(entry.metadata?.tags || []).join(';')}"`,
      ];
      lines.push(row.join(','));
    }
    
    fs.writeFileSync(outputPath, lines.join('\n'));
  }

  /**
   * Escape CSV field
   */
  private escapeCsv(value: string): string {
    return value.replace(/"/g, '""').replace(/\n/g, ' ');
  }

  /**
   * Get statistics
   */
  getStats(): {
    accepted: number;
    rejected: number;
    flushed: number;
    buffered: number;
    totalEntries: number;
    acceptanceRate: number;
  } {
    const total = this.stats.accepted + this.stats.rejected;
    return {
      ...this.stats,
      buffered: this.buffer.length,
      totalEntries: this.totalEntries + this.buffer.length,
      acceptanceRate: total > 0 ? this.stats.accepted / total : 0,
    };
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    this.buffer = [];
    this.totalEntries = 0;
    this.fileIndex = 0;
    this.stats = { accepted: 0, rejected: 0, flushed: 0 };
    
    // Remove output file
    const outputPath = this.config.outputPath!;
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    
    this.log('Distillation data cleared');
  }

  /**
   * Shutdown logger
   */
  async shutdown(): Promise<void> {
    this.stopAutoFlush();
    await this.flush();
    this.log('Distillation logger shutdown');
  }

  /**
   * Log if verbose
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.verbose) {
      console.log(`[Distillation] ${message}`, ...args);
    }
  }
}

export default DistillationLogger;
