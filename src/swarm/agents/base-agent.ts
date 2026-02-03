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

import {
  AgentConfig,
  AgentRole,
  AgentStatus,
  SwarmMessage,
  SwarmTask,
  TaskResult,
  MessagePriority,
} from '../types';
import { generateAgentId, generateMessageId, generateSpanId } from '../utils/id-generator';

/**
 * Abstract base class for swarm agents
 */
export abstract class BaseAgent {
  /** Agent configuration */
  protected config: AgentConfig;
  
  /** Current status */
  protected status: AgentStatus = 'idle';
  
  /** Message queue */
  protected messageQueue: SwarmMessage[] = [];
  
  /** Event listeners */
  protected listeners: Map<string, Function[]> = new Map();
  
  /** Start time */
  protected startTime: Date;
  
  /** Processed message count */
  protected processedMessages: number = 0;
  
  /** Error count */
  protected errorCount: number = 0;

  constructor(config: Partial<AgentConfig> & { role: AgentRole }) {
    this.config = {
      id: config.id || generateAgentId(),
      role: config.role,
      model: config.model || this.getDefaultModel(config.role),
      env: config.env || this.getDefaultEnv(config.role),
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature || 0.7,
      timeout: config.timeout || 30000,
      verbose: config.verbose || false,
    };
    this.startTime = new Date();
  }

  /**
   * Get default model based on role
   */
  private getDefaultModel(role: AgentRole): string {
    switch (role) {
      case 'planner':
        return 'claude-3-5-sonnet';
      case 'executor':
        return 'gemma-7b';
      case 'critic':
        return 'gemini-flash';
      case 'orchestrator':
        return 'internal';
      default:
        return 'gpt-4o-mini';
    }
  }

  /**
   * Get default environment based on role
   */
  private getDefaultEnv(role: AgentRole): 'cloud' | 'local' | 'hybrid' {
    switch (role) {
      case 'planner':
        return 'cloud';
      case 'executor':
        return 'local';
      case 'critic':
        return 'cloud';
      case 'orchestrator':
        return 'local';
      default:
        return 'hybrid';
    }
  }

  /**
   * Get agent ID
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * Get agent role
   */
  get role(): AgentRole {
    return this.config.role;
  }

  /**
   * Get current status
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Set status
   */
  setStatus(status: AgentStatus): void {
    const oldStatus = this.status;
    this.status = status;
    this.emit('statusChange', { agent: this.id, from: oldStatus, to: status });
  }

  /**
   * Get agent info
   */
  getInfo(): AgentConfig & { status: AgentStatus } {
    return { ...this.config, status: this.status };
  }

  /**
   * Receive a message
   */
  receiveMessage(message: SwarmMessage): void {
    this.messageQueue.push(message);
    this.emit('messageReceived', message);
    
    if (this.config.verbose) {
      console.log(`[${this.id}] Received message from ${message.from}: ${message.type}`);
    }
  }

  /**
   * Create a message to send
   */
  protected createMessage(
    to: string,
    type: SwarmMessage['type'],
    payload: unknown,
    traceId: string,
    parentSpanId?: string,
    priority: MessagePriority = 'normal'
  ): SwarmMessage {
    return {
      id: generateMessageId(),
      traceId,
      spanId: generateSpanId(),
      parentSpanId,
      from: this.id,
      to,
      type,
      priority,
      payload,
      timestamp: new Date(),
    };
  }

  /**
   * Process next message in queue
   */
  async processNextMessage(): Promise<SwarmMessage | null> {
    if (this.messageQueue.length === 0) {
      return null;
    }
    
    // Sort by priority
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    const message = this.messageQueue.shift()!;
    this.setStatus('working');
    
    try {
      const result = await this.handleMessage(message);
      this.processedMessages++;
      this.setStatus('idle');
      return result;
    } catch (error) {
      this.errorCount++;
      this.setStatus('error');
      this.emit('error', { agent: this.id, message, error });
      throw error;
    }
  }

  /**
   * Handle a message (implemented by subclasses)
   */
  protected abstract handleMessage(message: SwarmMessage): Promise<SwarmMessage | null>;

  /**
   * Execute a task (implemented by subclasses)
   */
  abstract executeTask(task: SwarmTask): Promise<TaskResult>;

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   */
  protected emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`[${this.id}] Error in event callback:`, error);
        }
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    id: string;
    role: AgentRole;
    status: AgentStatus;
    processedMessages: number;
    errorCount: number;
    uptime: number;
    queueLength: number;
  } {
    return {
      id: this.id,
      role: this.role,
      status: this.status,
      processedMessages: this.processedMessages,
      errorCount: this.errorCount,
      uptime: Date.now() - this.startTime.getTime(),
      queueLength: this.messageQueue.length,
    };
  }

  /**
   * Log if verbose mode
   */
  protected log(message: string, ...args: unknown[]): void {
    if (this.config.verbose) {
      console.log(`[${this.id}] ${message}`, ...args);
    }
  }

  /**
   * Shutdown the agent
   */
  async shutdown(): Promise<void> {
    this.setStatus('completed');
    this.messageQueue = [];
    this.emit('shutdown', { agent: this.id });
    this.log('Agent shutdown complete');
  }
}

export default BaseAgent;
