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
import {
  SwarmConfig,
  SwarmMessage,
  SwarmTask,
  TaskResult,
  ExecutionPlan,
  CriticFeedback,
  SwarmStats,
  MessagePriority,
} from '../types';
import { BaseAgent } from '../agents/base-agent';
import { PlannerAgent } from '../agents/planner-agent';
import { ExecutorAgent } from '../agents/executor-agent';
import { CriticAgent } from '../agents/critic-agent';
import {
  generateTraceId,
  generateSpanId,
  generateMessageId,
} from '../utils/id-generator';

/** Orchestrator status */
export type OrchestratorStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

/** Message handler function */
type MessageHandler = (message: SwarmMessage) => Promise<void>;

/**
 * Agentic Orchestrator
 * 
 * Coordinates the swarm of agents:
 * 1. Routes messages between agents
 * 2. Manages execution flow
 * 3. Handles retries and fallbacks
 * 4. Collects metrics and stats
 */
export class AgenticOrchestrator extends EventEmitter {
  /** Configuration */
  private config: SwarmConfig;
  
  /** Planner agent */
  private planner: PlannerAgent | null = null;
  
  /** Executor agents (can have multiple) */
  private executors: ExecutorAgent[] = [];
  
  /** Critic agent */
  private critic: CriticAgent | null = null;
  
  /** Message queue */
  private messageQueue: SwarmMessage[] = [];
  
  /** Processing flag */
  private isProcessing: boolean = false;
  
  /** Status */
  private status: OrchestratorStatus = 'idle';
  
  /** Start time */
  private startTime: Date | null = null;
  
  /** Statistics */
  private stats: SwarmStats = {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    avgExecutionTime: 0,
    distillationEntries: 0,
    activeAgents: 0,
    activeBrowsers: 0,
    successRate: 0,
    uptime: 0,
  };
  
  /** Task execution times for averaging */
  private executionTimes: number[] = [];
  
  /** Active trace IDs */
  private activeTraces: Map<string, { startTime: Date; tasks: string[] }> = new Map();
  
  /** External message handlers (for WebSocket integration) */
  private externalHandlers: Map<string, MessageHandler> = new Map();
  
  /** Verbose logging */
  private verbose: boolean;

  constructor(config?: Partial<SwarmConfig>) {
    super();
    
    this.config = {
      name: config?.name || 'QAntum-Swarm',
      agents: config?.agents || [],
      enableDistillation: config?.enableDistillation ?? true,
      distillationPath: config?.distillationPath || './fine-tuning-dataset.jsonl',
      enableTracing: config?.enableTracing ?? true,
      tracingEndpoint: config?.tracingEndpoint,
      maxParallelBrowsers: config?.maxParallelBrowsers || 4,
      enableLearning: config?.enableLearning ?? true,
      verbose: config?.verbose ?? false,
    };
    
    this.verbose = this.config.verbose || false;
  }

  /**
   * Initialize the orchestrator with agents
   */
  async initialize(): Promise<void> {
    this.log('Initializing Agentic Orchestrator...');
    
    // Create default agents if none provided
    if (this.config.agents.length === 0) {
      this.log('Creating default agents...');
      this.createDefaultAgents();
    } else {
      this.createAgentsFromConfig();
    }
    
    // Set up internal event handlers
    this.setupEventHandlers();
    
    this.status = 'idle';
    this.log(`Orchestrator initialized with ${this.getAgentCount()} agents`);
    this.emit('initialized', { agents: this.getAgentCount() });
  }

  /**
   * Create default agents
   */
  private createDefaultAgents(): void {
    // Create planner
    this.planner = new PlannerAgent({ verbose: this.verbose });
    this.log(`Created Planner: ${this.planner.id}`);
    
    // Create executor(s)
    const executorCount = Math.min(this.config.maxParallelBrowsers || 4, 8);
    for (let i = 0; i < executorCount; i++) {
      const executor = new ExecutorAgent({ verbose: this.verbose });
      this.executors.push(executor);
      this.log(`Created Executor ${i + 1}: ${executor.id}`);
    }
    
    // Create critic
    this.critic = new CriticAgent({ verbose: this.verbose });
    this.log(`Created Critic: ${this.critic.id}`);
  }

  /**
   * Create agents from configuration
   */
  private createAgentsFromConfig(): void {
    for (const agentConfig of this.config.agents) {
      switch (agentConfig.role) {
        case 'planner':
          this.planner = new PlannerAgent({ ...agentConfig, verbose: this.verbose });
          break;
        case 'executor':
          this.executors.push(new ExecutorAgent({ ...agentConfig, verbose: this.verbose }));
          break;
        case 'critic':
          this.critic = new CriticAgent({ ...agentConfig, verbose: this.verbose });
          break;
      }
    }
  }

  /**
   * Set up event handlers for agents
   */
  private setupEventHandlers(): void {
    // Forward agent events
    const forwardEvent = (agent: BaseAgent, eventName: string) => {
      agent.on(eventName, (data: unknown) => {
        this.emit(`agent:${eventName}`, { agent: agent.id, ...(data as Record<string, unknown>) });
      });
    };
    
    if (this.planner) {
      forwardEvent(this.planner, 'planCreated');
      forwardEvent(this.planner, 'planRevised');
      forwardEvent(this.planner, 'statusChange');
    }
    
    for (const executor of this.executors) {
      forwardEvent(executor, 'taskStarted');
      forwardEvent(executor, 'taskCompleted');
      forwardEvent(executor, 'taskFailed');
      forwardEvent(executor, 'statusChange');
    }
    
    if (this.critic) {
      forwardEvent(this.critic, 'feedbackGenerated');
      forwardEvent(this.critic, 'statusChange');
    }
  }

  /**
   * Start the orchestrator
   */
  start(): void {
    if (this.status === 'running') {
      this.log('Orchestrator already running');
      return;
    }
    
    this.status = 'running';
    this.startTime = new Date();
    this.log('Orchestrator started');
    this.emit('started', { timestamp: this.startTime });
    
    // Start message processing loop
    this.processMessages();
  }

  /**
   * Pause the orchestrator
   */
  pause(): void {
    this.status = 'paused';
    this.log('Orchestrator paused');
    this.emit('paused', { timestamp: new Date() });
  }

  /**
   * Resume the orchestrator
   */
  resume(): void {
    if (this.status === 'paused') {
      this.status = 'running';
      this.log('Orchestrator resumed');
      this.emit('resumed', { timestamp: new Date() });
      this.processMessages();
    }
  }

  /**
   * Stop the orchestrator
   */
  async stop(): Promise<void> {
    this.status = 'stopped';
    this.log('Orchestrator stopping...');
    
    // Shutdown agents
    if (this.planner) await this.planner.shutdown();
    for (const executor of this.executors) await executor.shutdown();
    if (this.critic) await this.critic.shutdown();
    
    this.emit('stopped', { timestamp: new Date(), stats: this.getStats() });
    this.log('Orchestrator stopped');
  }

  /**
   * Execute a goal through the swarm
   */
  async executeGoal(
    goal: string,
    context?: Record<string, unknown>
  ): Promise<{
    traceId: string;
    success: boolean;
    results: TaskResult[];
    plan: ExecutionPlan | null;
  }> {
    const traceId = generateTraceId();
    this.log(`Executing goal [${traceId}]: ${goal}`);
    
    // Track active trace
    this.activeTraces.set(traceId, { startTime: new Date(), tasks: [] });
    
    try {
      // Step 1: Plan
      if (!this.planner) {
        throw new Error('No planner agent available');
      }
      
      const plan = await this.planner.createPlan(goal, context, traceId);
      this.emit('planCreated', { traceId, plan });
      
      // Step 2: Execute tasks
      const results: TaskResult[] = [];
      
      for (const task of plan.tasks) {
        // Get available executor
        const executor = this.getAvailableExecutor();
        if (!executor) {
          throw new Error('No executor available');
        }
        
        // Execute task
        const result = await executor.executeTask(task);
        results.push(result);
        this.activeTraces.get(traceId)?.tasks.push(task.id);
        
        // Update stats
        this.updateStats(result);
        
        // Step 3: Critic review (if enabled)
        if (this.critic && result.success) {
          const feedback = await this.critic.reviewResult(result, task);
          
          // If rejected, try fallback
          if (!feedback.approved && plan.fallbackPlan) {
            this.log(`Task ${task.id} rejected, trying fallback`);
            const fallbackTask = plan.fallbackPlan.find(t => t.type === task.type);
            if (fallbackTask) {
              const retryResult = await executor.executeTask(fallbackTask);
              results.push(retryResult);
              this.updateStats(retryResult);
            }
          }
          
          // Emit for distillation
          if (feedback.approved && result.confidence && result.confidence > 0.8) {
            this.emit('successfulExecution', {
              traceId,
              task,
              result,
              reasoning: result.reasoning,
            });
          }
        }
        
        // Stop on critical failure
        if (!result.success && task.priority === 'critical') {
          this.log(`Critical task failed, stopping execution`);
          break;
        }
      }
      
      const success = results.every(r => r.success) || 
                      results.filter(r => r.success).length / results.length > 0.7;
      
      this.activeTraces.delete(traceId);
      
      return { traceId, success, results, plan };
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Goal execution failed: ${message}`);
      this.activeTraces.delete(traceId);
      
      return {
        traceId,
        success: false,
        results: [],
        plan: null,
      };
    }
  }

  /**
   * Execute a single task directly
   */
  async executeTask(task: SwarmTask): Promise<TaskResult> {
    const executor = this.getAvailableExecutor();
    if (!executor) {
      return {
        taskId: task.id,
        traceId: task.traceId,
        success: false,
        error: 'No executor available',
        duration: 0,
        executedBy: 'orchestrator',
        completedAt: new Date(),
      };
    }
    
    const result = await executor.executeTask(task);
    this.updateStats(result);
    
    return result;
  }

  /**
   * Send a message to the swarm
   */
  sendMessage(message: SwarmMessage): void {
    this.messageQueue.push(message);
    this.log(`Message queued: ${message.type} from ${message.from} to ${message.to}`);
    
    if (this.status === 'running') {
      this.processMessages();
    }
  }

  /**
   * Process message queue
   */
  private async processMessages(): Promise<void> {
    if (this.isProcessing || this.status !== 'running') {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.messageQueue.length > 0 && this.status === 'running') {
      // Sort by priority
      this.messageQueue.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      const message = this.messageQueue.shift()!;
      await this.routeMessage(message);
    }
    
    this.isProcessing = false;
  }

  /**
   * Route a message to the appropriate agent
   */
  private async routeMessage(message: SwarmMessage): Promise<void> {
    this.log(`Routing message ${message.id} to ${message.to}`);
    
    // Check for external handler first
    const externalHandler = this.externalHandlers.get(message.to);
    if (externalHandler) {
      await externalHandler(message);
      return;
    }
    
    // Route to internal agents
    const agent = this.findAgent(message.to);
    if (agent) {
      agent.receiveMessage(message);
      const response = await agent.processNextMessage();
      
      if (response) {
        this.sendMessage(response);
      }
    } else {
      this.log(`Agent not found: ${message.to}`);
      this.emit('routingError', { message, error: 'Agent not found' });
    }
  }

  /**
   * Find an agent by ID
   */
  private findAgent(agentId: string): BaseAgent | null {
    if (this.planner && this.planner.id === agentId) {
      return this.planner;
    }
    
    if (this.critic && this.critic.id === agentId) {
      return this.critic;
    }
    
    const executor = this.executors.find(e => e.id === agentId);
    if (executor) {
      return executor;
    }
    
    return null;
  }

  /**
   * Get an available executor
   */
  private getAvailableExecutor(): ExecutorAgent | null {
    for (const executor of this.executors) {
      if (executor.getStatus() === 'idle') {
        return executor;
      }
    }
    
    // If all busy, return first one (will queue)
    return this.executors[0] || null;
  }

  /**
   * Register external message handler (for WebSocket)
   */
  registerExternalHandler(agentId: string, handler: MessageHandler): void {
    this.externalHandlers.set(agentId, handler);
    this.log(`Registered external handler for: ${agentId}`);
  }

  /**
   * Unregister external handler
   */
  unregisterExternalHandler(agentId: string): void {
    this.externalHandlers.delete(agentId);
  }

  /**
   * Set browser page for executors
   */
  setPage(page: unknown): void {
    for (const executor of this.executors) {
      executor.setPage(page);
    }
    this.log('Browser page set for all executors');
  }

  /**
   * Update statistics
   */
  private updateStats(result: TaskResult): void {
    this.stats.totalTasks++;
    
    if (result.success) {
      this.stats.successfulTasks++;
    } else {
      this.stats.failedTasks++;
    }
    
    this.executionTimes.push(result.duration);
    if (this.executionTimes.length > 1000) {
      this.executionTimes.shift();
    }
    
    this.stats.avgExecutionTime = 
      this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length;
    
    this.stats.successRate = 
      this.stats.totalTasks > 0 
        ? this.stats.successfulTasks / this.stats.totalTasks 
        : 0;
    
    this.stats.activeAgents = this.getActiveAgentCount();
  }

  /**
   * Get current statistics
   */
  getStats(): SwarmStats {
    return {
      ...this.stats,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      activeAgents: this.getActiveAgentCount(),
    };
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    let count = 0;
    if (this.planner) count++;
    count += this.executors.length;
    if (this.critic) count++;
    return count;
  }

  /**
   * Get active agent count
   */
  private getActiveAgentCount(): number {
    let count = 0;
    if (this.planner && this.planner.getStatus() === 'working') count++;
    count += this.executors.filter(e => e.getStatus() === 'working').length;
    if (this.critic && this.critic.getStatus() === 'working') count++;
    return count;
  }

  /**
   * Get orchestrator status
   */
  getStatus(): OrchestratorStatus {
    return this.status;
  }

  /**
   * Get planner agent
   */
  getPlanner(): PlannerAgent | null {
    return this.planner;
  }

  /**
   * Get executor agents
   */
  getExecutors(): ExecutorAgent[] {
    return [...this.executors];
  }

  /**
   * Get critic agent
   */
  getCritic(): CriticAgent | null {
    return this.critic;
  }

  /**
   * Log if verbose
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.verbose) {
      console.log(`[Orchestrator] ${message}`, ...args);
    }
  }

  /**
   * Increment distillation entry count
   */
  incrementDistillationCount(): void {
    this.stats.distillationEntries++;
  }
}

export default AgenticOrchestrator;
