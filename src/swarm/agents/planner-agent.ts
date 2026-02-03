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
  ExecutionPlan,
  MessagePriority,
} from '../types';
import { generatePlanId, generateTaskId, generateTraceId } from '../utils/id-generator';

/**
 * Planner Agent - Strategic Planning
 * 
 * Responsibilities:
 * - Break down high-level goals into executable tasks
 * - Create execution plans with dependencies
 * - Design fallback strategies
 * - Optimize task ordering
 */
export class PlannerAgent extends BaseAgent {
  /** Planning history for context */
  private planHistory: ExecutionPlan[] = [];
  
  /** Max plans to keep in history */
  private maxHistorySize: number = 100;

  constructor(config?: Partial<AgentConfig>) {
    super({ ...config, role: 'planner' });
  }

  /**
   * Handle incoming message
   */
  protected async handleMessage(message: SwarmMessage): Promise<SwarmMessage | null> {
    switch (message.type) {
      case 'task':
        // Planning request
        const plan = await this.createPlan(
          message.payload.goal,
          message.payload.context,
          message.traceId
        );
        return this.createMessage(
          message.from,
          'result',
          { plan },
          message.traceId,
          message.spanId,
          'high'
        );
        
      case 'feedback':
        // Critic feedback - revise plan
        const revisedPlan = await this.revisePlan(
          message.payload.planId,
          message.payload.feedback,
          message.traceId
        );
        return this.createMessage(
          message.from,
          'result',
          { plan: revisedPlan },
          message.traceId,
          message.spanId,
          'high'
        );
        
      default:
        return null;
    }
  }

  /**
   * Execute a task (planners don't execute directly)
   */
  async executeTask(task: SwarmTask): Promise<TaskResult> {
    const startTime = Date.now();
    
    return {
      taskId: task.id,
      traceId: task.traceId,
      success: false,
      error: 'Planner agents do not execute tasks directly',
      duration: Date.now() - startTime,
      executedBy: this.id,
      completedAt: new Date(),
    };
  }

  /**
   * Create an execution plan from a high-level goal
   */
  async createPlan(
    goal: string,
    context?: Record<string, unknown>,
    traceId?: string
  ): Promise<ExecutionPlan> {
    const planTraceId = traceId || generateTraceId();
    this.log(`Creating plan for goal: ${goal}`);
    
    // Analyze the goal and break it down
    const tasks = this.decomposeGoal(goal, context, planTraceId);
    const dependencies = this.calculateDependencies(tasks);
    const fallbackPlan = this.createFallbackPlan(tasks, planTraceId);
    
    const plan: ExecutionPlan = {
      id: generatePlanId(),
      traceId: planTraceId,
      goal,
      tasks,
      estimatedDuration: this.estimateDuration(tasks),
      dependencies,
      fallbackPlan,
      createdAt: new Date(),
    };
    
    // Store in history
    this.planHistory.push(plan);
    if (this.planHistory.length > this.maxHistorySize) {
      this.planHistory.shift();
    }
    
    this.emit('planCreated', plan);
    this.log(`Plan created with ${tasks.length} tasks`);
    
    return plan;
  }

  /**
   * Revise a plan based on feedback
   */
  async revisePlan(
    planId: string,
    feedback: string,
    traceId?: string
  ): Promise<ExecutionPlan | null> {
    const originalPlan = this.planHistory.find(p => p.id === planId);
    if (!originalPlan) {
      this.log(`Plan not found: ${planId}`);
      return null;
    }
    
    this.log(`Revising plan ${planId} based on feedback`);
    
    // Create revised plan
    const revisedTasks = this.reviseTasks(originalPlan.tasks, feedback, traceId || originalPlan.traceId);
    
    const revisedPlan: ExecutionPlan = {
      id: generatePlanId(),
      traceId: traceId || originalPlan.traceId,
      goal: originalPlan.goal,
      tasks: revisedTasks,
      estimatedDuration: this.estimateDuration(revisedTasks),
      dependencies: this.calculateDependencies(revisedTasks),
      fallbackPlan: this.createFallbackPlan(revisedTasks, traceId || originalPlan.traceId),
      createdAt: new Date(),
    };
    
    this.planHistory.push(revisedPlan);
    this.emit('planRevised', { original: planId, revised: revisedPlan.id });
    
    return revisedPlan;
  }

  /**
   * Decompose a goal into tasks
   */
  private decomposeGoal(
    goal: string,
    context?: Record<string, unknown>,
    traceId?: string
  ): SwarmTask[] {
    const tasks: SwarmTask[] = [];
    const goalLower = goal.toLowerCase();
    const tid = traceId || generateTraceId();
    
    // Pattern matching for common goals
    if (goalLower.includes('login') || goalLower.includes('authenticate')) {
      tasks.push(
        this.createTask('navigate', context?.url || 'login page', { action: 'navigate' }, tid, 'high'),
        this.createTask('fill', 'username field', { field: 'username', value: context?.username }, tid),
        this.createTask('fill', 'password field', { field: 'password', value: context?.password }, tid),
        this.createTask('click', 'login button', { action: 'submit' }, tid),
        this.createTask('validate', 'success indicator', { expected: 'logged in' }, tid)
      );
    } else if (goalLower.includes('extract') || goalLower.includes('scrape')) {
      tasks.push(
        this.createTask('navigate', context?.url || 'target page', { action: 'navigate' }, tid, 'high'),
        this.createTask('extract', context?.selector || 'data elements', { format: context?.format || 'json' }, tid)
      );
    } else if (goalLower.includes('fill') && goalLower.includes('form')) {
      tasks.push(
        this.createTask('navigate', context?.url || 'form page', { action: 'navigate' }, tid, 'high'),
        ...this.createFormTasks(context?.fields || {}, tid),
        this.createTask('click', 'submit button', { action: 'submit' }, tid),
        this.createTask('validate', 'form submission', { expected: 'success' }, tid)
      );
    } else if (goalLower.includes('test') || goalLower.includes('verify')) {
      tasks.push(
        this.createTask('navigate', context?.url || 'test page', { action: 'navigate' }, tid, 'high'),
        this.createTask('validate', 'page elements', { checks: context?.checks || [] }, tid)
      );
    } else {
      // Generic task decomposition
      tasks.push(
        this.createTask('custom', goal, { context }, tid)
      );
    }
    
    return tasks;
  }

  /**
   * Create form filling tasks
   */
  private createFormTasks(fields: Record<string, unknown>, traceId: string): SwarmTask[] {
    return Object.entries(fields).map(([field, value]) => 
      this.createTask('fill', field, { field, value }, traceId)
    );
  }

  /**
   * Create a task
   */
  private createTask(
    type: SwarmTask['type'],
    target: string,
    params: Record<string, unknown>,
    traceId: string,
    priority: MessagePriority = 'normal'
  ): SwarmTask {
    return {
      id: generateTaskId(),
      traceId,
      type,
      target,
      params,
      priority,
      createdAt: new Date(),
    };
  }

  /**
   * Calculate task dependencies
   */
  private calculateDependencies(tasks: SwarmTask[]): Record<string, string[]> {
    const dependencies: Record<string, string[]> = {};
    
    for (let i = 1; i < tasks.length; i++) {
      const task = tasks[i];
      const prevTask = tasks[i - 1];
      
      // By default, each task depends on the previous one
      dependencies[task.id] = [prevTask.id];
      
      // Navigation must complete before other actions
      if (prevTask.type === 'navigate') {
        dependencies[task.id] = [prevTask.id];
      }
    }
    
    return dependencies;
  }

  /**
   * Create fallback plan
   */
  private createFallbackPlan(tasks: SwarmTask[], traceId: string): SwarmTask[] {
    // Simplified fallback - retry with different strategies
    return tasks.map(task => ({
      ...task,
      id: generateTaskId(),
      params: {
        ...task.params,
        fallback: true,
        alternativeStrategy: true,
      },
      retries: 3,
    }));
  }

  /**
   * Estimate total duration for tasks
   */
  private estimateDuration(tasks: SwarmTask[]): number {
    const estimates: Record<SwarmTask['type'], number> = {
      navigate: 2000,
      click: 500,
      fill: 300,
      extract: 1000,
      validate: 500,
      custom: 2000,
    };
    
    return tasks.reduce((total, task) => total + (estimates[task.type] || 1000), 0);
  }

  /**
   * Revise tasks based on feedback
   */
  private reviseTasks(
    originalTasks: SwarmTask[],
    feedback: string,
    traceId: string
  ): SwarmTask[] {
    // Simple revision - add retry and alternative strategies
    return originalTasks.map(task => ({
      ...task,
      id: generateTaskId(),
      traceId,
      params: {
        ...task.params,
        revised: true,
        feedbackApplied: feedback,
      },
      retries: (task.retries || 0) + 1,
      createdAt: new Date(),
    }));
  }

  /**
   * Get planning history
   */
  getPlanHistory(): ExecutionPlan[] {
    return [...this.planHistory];
  }

  /**
   * Get specific plan
   */
  getPlan(planId: string): ExecutionPlan | undefined {
    return this.planHistory.find(p => p.id === planId);
  }
}

export default PlannerAgent;
