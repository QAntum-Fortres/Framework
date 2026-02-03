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

import { BaseAgent } from './base-agent';
import {
  AgentConfig,
  SwarmMessage,
  SwarmTask,
  TaskResult,
  CriticFeedback,
} from '../types';
import { generateFeedbackId } from '../utils/id-generator';

/**
 * Critic Agent - Quality Assurance
 * 
 * Responsibilities:
 * - Review task execution results
 * - Identify issues and failures
 * - Provide constructive feedback
 * - Approve or reject results
 */
export class CriticAgent extends BaseAgent {
  /** Feedback history */
  private feedbackHistory: CriticFeedback[] = [];
  
  /** Max history size */
  private maxHistorySize: number = 200;
  
  /** Strict mode - reject on any issue */
  private strictMode: boolean = false;
  
  /** Quality threshold (0-1) */
  private qualityThreshold: number = 0.7;

  constructor(config?: Partial<AgentConfig>) {
    super({ ...config, role: 'critic' });
  }

  /**
   * Set strict mode
   */
  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }

  /**
   * Set quality threshold
   */
  setQualityThreshold(threshold: number): void {
    this.qualityThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Handle incoming message
   */
  protected async handleMessage(message: SwarmMessage): Promise<SwarmMessage | null> {
    switch (message.type) {
      case 'result':
        // Review result
        const feedback = await this.reviewResult(
          message.payload.result,
          message.payload.task
        );
        return this.createMessage(
          message.from,
          'feedback',
          { feedback },
          message.traceId,
          message.spanId
        );
        
      default:
        return null;
    }
  }

  /**
   * Execute a task (critics don't execute directly)
   */
  async executeTask(task: SwarmTask): Promise<TaskResult> {
    const startTime = Date.now();
    
    return {
      taskId: task.id,
      traceId: task.traceId,
      success: false,
      error: 'Critic agents do not execute tasks directly',
      duration: Date.now() - startTime,
      executedBy: this.id,
      completedAt: new Date(),
    };
  }

  /**
   * Review a task result
   */
  async reviewResult(
    result: TaskResult,
    task?: SwarmTask
  ): Promise<CriticFeedback> {
    this.log(`Reviewing result for task: ${result.taskId}`);
    
    const issues: string[] = [];
    let severity: CriticFeedback['severity'] = 'minor';
    
    // Check success
    if (!result.success) {
      issues.push(`Task failed: ${result.error}`);
      severity = 'critical';
    }
    
    // Check confidence
    if (result.confidence !== undefined && result.confidence < this.qualityThreshold) {
      issues.push(`Low confidence: ${(result.confidence * 100).toFixed(1)}% (threshold: ${(this.qualityThreshold * 100).toFixed(1)}%)`);
      if (severity === 'minor') severity = 'major';
    }
    
    // Check duration (warn if too slow)
    if (result.duration > 10000) {
      issues.push(`Slow execution: ${result.duration}ms`);
    }
    
    // Check reasoning quality
    if (result.reasoning && result.reasoning.length < 2) {
      issues.push('Insufficient reasoning documented');
    }
    
    // Task-specific validation
    if (task) {
      const taskIssues = this.validateTaskResult(task, result);
      issues.push(...taskIssues);
      if (taskIssues.length > 0 && severity === 'minor') {
        severity = 'major';
      }
    }
    
    // Determine approval
    const approved = this.strictMode 
      ? issues.length === 0 
      : !issues.some(i => i.includes('failed') || i.includes('critical'));
    
    // Generate correction suggestion
    const correction = issues.length > 0 
      ? this.suggestCorrection(issues, task, result)
      : undefined;
    
    const feedback: CriticFeedback = {
      id: generateFeedbackId(),
      taskId: result.taskId,
      traceId: result.traceId,
      approved,
      issue: issues.length > 0 ? issues.join('; ') : undefined,
      correction,
      severity: issues.length > 0 ? severity : undefined,
      createdAt: new Date(),
    };
    
    this.storeFeedback(feedback);
    this.emit('feedbackGenerated', feedback);
    
    this.log(`Review complete: ${approved ? 'APPROVED' : 'REJECTED'}`);
    
    return feedback;
  }

  /**
   * Validate task-specific results
   */
  private validateTaskResult(task: SwarmTask, result: TaskResult): string[] {
    const issues: string[] = [];
    
    switch (task.type) {
      case 'navigate':
        if (result.data && !result.data.url) {
          issues.push('Navigation did not return URL');
        }
        break;
        
      case 'click':
        if (result.data && !result.data.clicked) {
          issues.push('Click action not confirmed');
        }
        break;
        
      case 'fill':
        if (result.data && !result.data.filled) {
          issues.push('Fill action not confirmed');
        }
        break;
        
      case 'extract':
        if (result.data && (!result.data.extracted || result.data.extracted.length === 0)) {
          issues.push('No data extracted');
        }
        break;
        
      case 'validate':
        if (result.data && !result.data.valid) {
          issues.push('Validation failed');
        }
        break;
    }
    
    return issues;
  }

  /**
   * Suggest correction based on issues
   */
  private suggestCorrection(
    issues: string[],
    task?: SwarmTask,
    result?: TaskResult
  ): string {
    const suggestions: string[] = [];
    
    for (const issue of issues) {
      const issueLower = issue.toLowerCase();
      
      if (issueLower.includes('failed')) {
        suggestions.push('Retry with alternative selectors');
        suggestions.push('Try semantic element finding');
      }
      
      if (issueLower.includes('confidence')) {
        suggestions.push('Use more specific selectors');
        suggestions.push('Add data-testid attributes to elements');
      }
      
      if (issueLower.includes('slow')) {
        suggestions.push('Check network conditions');
        suggestions.push('Consider parallel execution');
      }
      
      if (issueLower.includes('reasoning')) {
        suggestions.push('Add more logging to reasoning chain');
      }
      
      if (issueLower.includes('extract') && issueLower.includes('no data')) {
        suggestions.push('Verify selector matches actual DOM');
        suggestions.push('Wait for dynamic content to load');
      }
      
      if (issueLower.includes('validation')) {
        suggestions.push('Check if expected content is present');
        suggestions.push('Verify page loaded completely');
      }
    }
    
    return suggestions.length > 0 
      ? suggestions.join('. ')
      : 'Review task parameters and retry';
  }

  /**
   * Batch review multiple results
   */
  async batchReview(results: TaskResult[], tasks?: SwarmTask[]): Promise<CriticFeedback[]> {
    const feedbacks: CriticFeedback[] = [];
    
    for (let i = 0; i < results.length; i++) {
      const task = tasks ? tasks.find(t => t.id === results[i].taskId) : undefined;
      const feedback = await this.reviewResult(results[i], task);
      feedbacks.push(feedback);
    }
    
    return feedbacks;
  }

  /**
   * Get approval rate
   */
  getApprovalRate(): number {
    if (this.feedbackHistory.length === 0) return 0;
    const approved = this.feedbackHistory.filter(f => f.approved).length;
    return approved / this.feedbackHistory.length;
  }

  /**
   * Get common issues
   */
  getCommonIssues(): Record<string, number> {
    const issueCounts: Record<string, number> = {};
    
    for (const feedback of this.feedbackHistory) {
      if (feedback.issue) {
        // Categorize issues
        const issueKey = this.categorizeIssue(feedback.issue);
        issueCounts[issueKey] = (issueCounts[issueKey] || 0) + 1;
      }
    }
    
    return issueCounts;
  }

  /**
   * Categorize issue into buckets
   */
  private categorizeIssue(issue: string): string {
    const issueLower = issue.toLowerCase();
    
    if (issueLower.includes('fail')) return 'execution_failure';
    if (issueLower.includes('confidence')) return 'low_confidence';
    if (issueLower.includes('slow')) return 'performance';
    if (issueLower.includes('extract')) return 'extraction_issue';
    if (issueLower.includes('validation')) return 'validation_failure';
    if (issueLower.includes('reasoning')) return 'documentation';
    
    return 'other';
  }

  /**
   * Store feedback
   */
  private storeFeedback(feedback: CriticFeedback): void {
    this.feedbackHistory.push(feedback);
    if (this.feedbackHistory.length > this.maxHistorySize) {
      this.feedbackHistory.shift();
    }
  }

  /**
   * Get feedback history
   */
  getFeedbackHistory(): CriticFeedback[] {
    return [...this.feedbackHistory];
  }

  /**
   * Get feedback by task ID
   */
  getFeedbackByTask(taskId: string): CriticFeedback | undefined {
    return this.feedbackHistory.find(f => f.taskId === taskId);
  }
}

export default CriticAgent;
