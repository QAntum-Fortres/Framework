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

import { Worker, parentPort, workerData, isMainThread } from 'node:worker_threads';
import { cpus } from 'node:os';
import { EventEmitter } from 'node:events';
import {
  WorkerTask,
  WorkerInfo,
  WorkerPoolConfig,
  WorkerPoolStats
} from '../types';

/**
 * Priority Queue for task scheduling
 */
class PriorityQueue<T extends { priority: number }> {
  private items: T[] = [];

  enqueue(item: T): void {
    // Insert in sorted order (higher priority first)
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      const currentItem = this.items[i];
      if (currentItem && item.priority > currentItem.priority) {
        this.items.splice(i, 0, item);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      this.items.push(item);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }

  toArray(): T[] {
    return [...this.items];
  }
}

/**
 * Worker Pool Manager
 * 
 * Manages a pool of worker threads for parallel task execution.
 * Designed for CPU-intensive operations like Ghost simulations.
 */
export class WorkerPoolManager extends EventEmitter {
  private workers: Map<number, Worker> = new Map();
  private workerInfo: Map<number, WorkerInfo> = new Map();
  private taskQueue: PriorityQueue<WorkerTask> = new PriorityQueue();
  private activeTasks: Map<string, { workerId: number; task: WorkerTask }> = new Map();
  private config: Required<WorkerPoolConfig>;
  private isShuttingDown = false;
  private startTime = Date.now();
  private tasksCompleted = 0;
  private tasksFailed = 0;
  private totalExecutionTime = 0;
  private nextWorkerId = 1;
  
  // v26.0 Sovereign Nexus - Thermal Throttling & Dynamic Rebalancing
  private thermalState: 'cool' | 'warm' | 'hot' | 'critical' = 'cool';
  private estimatedTemperature: number = 50;
  private throttledTasks: number = 0;
  private rebalanceInterval: ReturnType<typeof setInterval> | null = null;
  /** Used for CPU usage delta calculation */
  private _lastCpuUsage: number[] = [];

  constructor(config: WorkerPoolConfig = {}) {
    super();
    
    const cpuCount = cpus().length;
    
    this.config = {
      workerCount: config.workerCount ?? cpuCount,
      maxTasksPerWorker: config.maxTasksPerWorker ?? 1000,
      taskTimeout: config.taskTimeout ?? 30000,
      maxQueueSize: config.maxQueueSize ?? 10000,
      enableWorkStealing: config.enableWorkStealing ?? true,
      workerScript: config.workerScript ?? this.getDefaultWorkerScript(),
      enableThermalThrottling: config.enableThermalThrottling ?? true,
      thermalThresholdCelsius: config.thermalThresholdCelsius ?? 85,
      enableDynamicRebalancing: config.enableDynamicRebalancing ?? true,
      rebalanceIntervalMs: config.rebalanceIntervalMs ?? 5000
    };

    // Initialize workers
    this.initializeWorkers();
    
    // Start thermal monitoring and rebalancing if enabled
    if (this.config.enableThermalThrottling || this.config.enableDynamicRebalancing) {
      this.startThermalMonitoring();
    }
  }

  /**
   * Initialize worker threads
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.config.workerCount; i++) {
      this.spawnWorker();
    }
  }
  
  /**
   * v26.0: Start thermal monitoring and dynamic rebalancing
   */
  private startThermalMonitoring(): void {
    this.rebalanceInterval = setInterval(() => {
      this.updateThermalState();
      
      if (this.config.enableDynamicRebalancing) {
        this.rebalanceWorkers();
      }
    }, this.config.rebalanceIntervalMs);
    
    this.emit('thermalMonitoringStarted');
  }
  
  /**
   * v26.0: Update thermal state based on CPU usage estimation
   */
  private updateThermalState(): void {
    const cpuInfo = cpus();
    const currentUsage: number[] = cpuInfo.map(cpu => {
      const total = cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle;
      const idle = cpu.times.idle;
      return ((total - idle) / total) * 100;
    });
    
    // Calculate average CPU usage
    const avgUsage = currentUsage.reduce((a, b) => a + b, 0) / currentUsage.length;
    
    // Estimate temperature based on usage (Ryzen 7 7435HS typical range: 45-95°C)
    const baseTemp = 45;
    const loadTemp = (avgUsage / 100) * 50;
    this.estimatedTemperature = Math.round(baseTemp + loadTemp);
    
    // Determine thermal state
    const prevState = this.thermalState;
    if (this.estimatedTemperature >= this.config.thermalThresholdCelsius + 10) {
      this.thermalState = 'critical';
    } else if (this.estimatedTemperature >= this.config.thermalThresholdCelsius) {
      this.thermalState = 'hot';
    } else if (this.estimatedTemperature >= this.config.thermalThresholdCelsius - 15) {
      this.thermalState = 'warm';
    } else {
      this.thermalState = 'cool';
    }
    
    if (prevState !== this.thermalState) {
      this.emit('thermalStateChanged', { 
        from: prevState, 
        to: this.thermalState, 
        temperature: this.estimatedTemperature 
      });
    }
    
    this._lastCpuUsage = currentUsage;
  }
  
  /**
   * v26.0: Dynamically rebalance workers based on thermal state and load
   */
  private rebalanceWorkers(): void {
    const currentWorkerCount = this.workers.size;
    const cpuCount = cpus().length;
    
    let targetWorkerCount = currentWorkerCount;
    
    // Adjust worker count based on thermal state
    switch (this.thermalState) {
      case 'critical':
        // Reduce to 25% of CPU count
        targetWorkerCount = Math.max(1, Math.floor(cpuCount * 0.25));
        break;
      case 'hot':
        // Reduce to 50% of CPU count
        targetWorkerCount = Math.max(2, Math.floor(cpuCount * 0.5));
        break;
      case 'warm':
        // Reduce to 75% of CPU count
        targetWorkerCount = Math.max(2, Math.floor(cpuCount * 0.75));
        break;
      case 'cool':
        // Use full capacity
        targetWorkerCount = this.config.workerCount;
        break;
    }
    
    // Scale workers if needed
    if (targetWorkerCount !== currentWorkerCount) {
      this.emit('rebalancing', { 
        from: currentWorkerCount, 
        to: targetWorkerCount, 
        reason: this.thermalState 
      });
      this.scale(targetWorkerCount);
    }
  }
  
  /**
   * v26.0: Check if task should be throttled based on thermal state
   */
  private shouldThrottleTask(task: WorkerTask): boolean {
    if (!this.config.enableThermalThrottling) return false;
    
    // In critical state, only allow high priority tasks
    if (this.thermalState === 'critical' && task.priority < 8) {
      return true;
    }
    
    // In hot state, delay low priority tasks
    if (this.thermalState === 'hot' && task.priority < 5) {
      return true;
    }
    
    return false;
  }

  /**
   * Spawn a new worker thread
   */
  private spawnWorker(): Worker {
    const workerId = this.nextWorkerId++;
    
    // Check if config is a file path or inline script
    const isFilePath = this.config.workerScript.endsWith('.js') || 
                       this.config.workerScript.endsWith('.ts') ||
                       this.config.workerScript.startsWith('./') ||
                       this.config.workerScript.startsWith('/') ||
                       /^[A-Za-z]:\\/.test(this.config.workerScript);
    
    const worker = new Worker(this.config.workerScript, {
      workerData: { workerId },
      eval: !isFilePath
    });

    // Track worker info
    this.workerInfo.set(workerId, {
      id: workerId,
      threadId: worker.threadId,
      status: 'idle',
      tasksCompleted: 0,
      totalExecutionTime: 0,
      lastActive: new Date(),
      errorCount: 0
    });

    // Set up event handlers
    worker.on('message', (message) => this.handleWorkerMessage(workerId, message));
    worker.on('error', (error) => this.handleWorkerError(workerId, error));
    worker.on('exit', (code) => this.handleWorkerExit(workerId, code));

    this.workers.set(workerId, worker);
    this.emit('workerSpawned', workerId);

    return worker;
  }

  /**
   * Handle message from worker
   */
  private handleWorkerMessage(workerId: number, message: { type: string; taskId?: string; result?: unknown; duration?: number; error?: string }): void {
    const info = this.workerInfo.get(workerId);
    if (!info) return;

    if (message.type === 'taskComplete') {
      const { taskId, result, duration } = message;
      const activeTask = this.activeTasks.get(taskId!);
      
      if (activeTask) {
        // Update stats
        info.tasksCompleted++;
        info.totalExecutionTime += duration;
        info.lastActive = new Date();
        info.status = 'idle';
        this.tasksCompleted++;
        this.totalExecutionTime += duration;

        // Resolve task
        activeTask.task.resolve(result);
        this.activeTasks.delete(taskId);

        // Check if worker needs recycling
        if (info.tasksCompleted >= this.config.maxTasksPerWorker) {
          this.recycleWorker(workerId);
        } else {
          // Try to pick up next task
          this.assignNextTask(workerId);
        }
      }
    } else if (message.type === 'taskError') {
      const { taskId, error } = message;
      const activeTask = this.activeTasks.get(taskId);
      
      if (activeTask) {
        info.errorCount++;
        info.lastActive = new Date();
        info.status = 'idle';
        this.tasksFailed++;

        activeTask.task.reject(new Error(error));
        this.activeTasks.delete(taskId);
        
        this.assignNextTask(workerId);
      }
    } else if (message.type === 'ready') {
      info.status = 'idle';
      this.assignNextTask(workerId);
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: number, error: Error): void {
    console.error(`[WorkerPool] Worker ${workerId} error:`, error.message);
    
    const info = this.workerInfo.get(workerId);
    if (info) {
      info.status = 'error';
      info.errorCount++;
    }

    // Fail any active task for this worker
    for (const [taskId, activeTask] of this.activeTasks.entries()) {
      if (activeTask.workerId === workerId) {
        activeTask.task.reject(error);
        this.activeTasks.delete(taskId);
        this.tasksFailed++;
      }
    }

    // Respawn worker if not shutting down
    if (!this.isShuttingDown) {
      this.workers.delete(workerId);
      this.workerInfo.delete(workerId);
      this.spawnWorker();
    }

    this.emit('workerError', workerId, error);
  }

  /**
   * Handle worker exit
   */
  private handleWorkerExit(workerId: number, code: number): void {
    const info = this.workerInfo.get(workerId);
    if (info) {
      info.status = 'terminated';
    }

    this.workers.delete(workerId);
    this.emit('workerExit', workerId, code);

    // Respawn if unexpected exit and not shutting down
    if (code !== 0 && !this.isShuttingDown) {
      this.spawnWorker();
    }
  }

  /**
   * Recycle a worker (terminate and respawn)
   */
  private recycleWorker(workerId: number): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerId);
      this.workerInfo.delete(workerId);
      this.spawnWorker();
      this.emit('workerRecycled', workerId);
    }
  }

  /**
   * Assign next task from queue to a worker
   */
  private assignNextTask(workerId: number): void {
    if (this.taskQueue.isEmpty() || this.isShuttingDown) return;

    const task = this.taskQueue.dequeue();
    if (!task) return;

    const worker = this.workers.get(workerId);
    const info = this.workerInfo.get(workerId);
    
    if (!worker || !info) {
      // Put task back in queue
      this.taskQueue.enqueue(task);
      return;
    }

    info.status = 'busy';
    info.currentTaskId = task.id;
    task.startedAt = new Date();

    this.activeTasks.set(task.id, { workerId, task });

    // Send task to worker
    worker.postMessage({
      type: 'executeTask',
      taskId: task.id,
      taskType: task.type,
      payload: task.payload,
      timeout: task.timeout ?? this.config.taskTimeout
    });

    this.emit('taskAssigned', task.id, workerId);
  }

  /**
   * Submit a task to the pool
   */
  async submitTask<T = unknown, R = unknown>(
    type: string,
    payload: T,
    options: {
      priority?: number;
      timeout?: number;
    } = {}
  ): Promise<R> {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down');
    }

    if (this.taskQueue.size >= this.config.maxQueueSize) {
      throw new Error('Task queue is full');
    }

    return new Promise<R>((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id: this.generateTaskId(),
        type,
        payload,
        priority: options.priority ?? 5,
        timeout: options.timeout,
        resolve,
        reject,
        queuedAt: new Date()
      };

      // v26.0: Check thermal throttling
      if (this.shouldThrottleTask(task)) {
        this.throttledTasks++;
        this.emit('taskThrottled', { taskId: task.id, thermalState: this.thermalState });
        
        // Delay low priority tasks during thermal throttling
        setTimeout(() => {
          if (!this.isShuttingDown) {
            this.taskQueue.enqueue(task);
            this.tryAssignToIdleWorker();
          }
        }, 1000 * (this.thermalState === 'critical' ? 5 : 2));
        return;
      }

      // Set timeout for task
      const timeoutMs = options.timeout ?? this.config.taskTimeout;
      const timeoutHandle = setTimeout(() => {
        if (this.activeTasks.has(task.id) || this.taskQueue.toArray().some(t => t.id === task.id)) {
          this.cancelTask(task.id);
          reject(new Error(`Task ${task.id} timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      // Clear timeout on resolution
      const originalResolve = task.resolve;
      task.resolve = (result: R) => {
        clearTimeout(timeoutHandle);
        originalResolve(result);
      };

      const originalReject = task.reject;
      task.reject = (error: Error) => {
        clearTimeout(timeoutHandle);
        originalReject(error);
      };

      this.taskQueue.enqueue(task);
      this.emit('taskQueued', task.id);

      // Try to assign to idle worker
      this.tryAssignToIdleWorker();
    });
  }

  /**
   * Try to assign task to an idle worker
   */
  private tryAssignToIdleWorker(): void {
    for (const [workerId, info] of this.workerInfo.entries()) {
      if (info.status === 'idle') {
        this.assignNextTask(workerId);
        break;
      }
    }
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    // Check if in queue
    const queueTasks = this.taskQueue.toArray();
    const taskIndex = queueTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
      queueTasks.splice(taskIndex, 1);
      this.taskQueue.clear();
      queueTasks.forEach(t => this.taskQueue.enqueue(t));
      return true;
    }

    // Check if active
    const activeTask = this.activeTasks.get(taskId);
    if (activeTask) {
      const worker = this.workers.get(activeTask.workerId);
      if (worker) {
        worker.postMessage({ type: 'cancelTask', taskId });
      }
      this.activeTasks.delete(taskId);
      return true;
    }

    return false;
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default worker script content
   */
  private getDefaultWorkerScript(): string {
    // Return inline worker code as data URL
    const workerCode = `
      const { parentPort, workerData } = require('node:worker_threads');
      
      // Signal ready
      parentPort.postMessage({ type: 'ready' });
      
      // Handle messages
      parentPort.on('message', async (message) => {
        if (message.type === 'executeTask') {
          const { taskId, taskType, payload, timeout } = message;
          const startTime = Date.now();
          
          try {
            // Execute based on task type
            let result;
            
            switch (taskType) {
              case 'ghostSimulation':
                result = await simulateGhost(payload);
                break;
              case 'mutationTest':
                result = await testMutation(payload);
                break;
              case 'stateComputation':
                result = await computeState(payload);
                break;
              default:
                result = { payload, processed: true };
            }
            
            parentPort.postMessage({
              type: 'taskComplete',
              taskId,
              result,
              duration: Date.now() - startTime
            });
          } catch (error) {
            parentPort.postMessage({
              type: 'taskError',
              taskId,
              error: error.message
            });
          }
        }
      });
      
      // Task implementations
      async function simulateGhost(payload) {
        // Simulate ghost execution
        return { ghostId: payload.ghostId, result: 'simulated' };
      }
      
      async function testMutation(payload) {
        // Test mutation
        return { mutationId: payload.mutationId, success: true };
      }
      
      async function computeState(payload) {
        // Compute state
        return { stateId: payload.stateId, computed: true };
      }
    `;
    
    // Return as a file path placeholder (in real usage, this would be a file)
    return workerCode;
  }

  /**
   * Get pool statistics
   */
  getStats(): WorkerPoolStats {
    let activeWorkers = 0;
    let idleWorkers = 0;

    for (const info of this.workerInfo.values()) {
      if (info.status === 'busy') activeWorkers++;
      else if (info.status === 'idle') idleWorkers++;
    }

    return {
      totalWorkers: this.workers.size,
      activeWorkers,
      idleWorkers,
      queueSize: this.taskQueue.size,
      tasksCompleted: this.tasksCompleted,
      tasksFailed: this.tasksFailed,
      avgTaskTime: this.tasksCompleted > 0 
        ? this.totalExecutionTime / this.tasksCompleted 
        : 0,
      uptime: Date.now() - this.startTime,
      // v26.0: Thermal monitoring stats
      thermalState: this.thermalState,
      estimatedTemperature: this.estimatedTemperature,
      throttledTasks: this.throttledTasks
    };
  }
  
  /**
   * v26.0: Get current thermal state
   */
  getThermalState(): 'cool' | 'warm' | 'hot' | 'critical' {
    return this.thermalState;
  }
  
  /**
   * v26.0: Get estimated CPU temperature
   */
  getEstimatedTemperature(): number {
    return this.estimatedTemperature;
  }

  /**
   * Get worker information
   */
  getWorkerInfo(): WorkerInfo[] {
    return Array.from(this.workerInfo.values());
  }

  /**
   * Scale workers up or down
   */
  scale(targetCount: number): void {
    const currentCount = this.workers.size;

    if (targetCount > currentCount) {
      // Scale up
      for (let i = 0; i < targetCount - currentCount; i++) {
        this.spawnWorker();
      }
    } else if (targetCount < currentCount) {
      // Scale down (terminate idle workers first)
      let toTerminate = currentCount - targetCount;
      
      for (const [workerId, info] of this.workerInfo.entries()) {
        if (toTerminate <= 0) break;
        if (info.status === 'idle') {
          const worker = this.workers.get(workerId);
          if (worker) {
            worker.terminate();
            this.workers.delete(workerId);
            this.workerInfo.delete(workerId);
            toTerminate--;
          }
        }
      }
    }

    this.emit('scaled', this.workers.size);
  }

  /**
   * Shutdown the pool gracefully
   */
  async shutdown(graceful = true): Promise<void> {
    this.isShuttingDown = true;

    // v26.0: Stop thermal monitoring
    if (this.rebalanceInterval) {
      clearInterval(this.rebalanceInterval);
      this.rebalanceInterval = null;
    }

    if (graceful) {
      // Wait for active tasks to complete
      while (this.activeTasks.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else {
      // Cancel all pending tasks
      for (const [, activeTask] of this.activeTasks.entries()) {
        activeTask.task.reject(new Error('Pool shutdown'));
      }
      this.activeTasks.clear();
    }

    // Terminate all workers
    for (const worker of this.workers.values()) {
      await worker.terminate();
    }

    this.workers.clear();
    this.workerInfo.clear();
    this.taskQueue.clear();

    this.emit('shutdown');
  }

  /**
   * Check if pool is running
   */
  isRunning(): boolean {
    return !this.isShuttingDown && this.workers.size > 0;
  }
}

/**
 * Worker thread entry point (for use in separate worker file)
 */
export function workerMain(): void {
  if (isMainThread) {
    throw new Error('workerMain() must be called from a worker thread');
  }

  const { workerId } = workerData;

  // Signal ready
  parentPort!.postMessage({ type: 'ready' });

  // Handle messages
  parentPort!.on('message', async (message: { type: string; taskId?: string; taskType?: string; payload?: unknown }) => {
    if (message.type === 'executeTask') {
      const { taskId, taskType, payload } = message;
      const startTime = Date.now();

      try {
        // Generic task execution
        const result = { taskType, payload, processed: true };

        parentPort!.postMessage({
          type: 'taskComplete',
          taskId,
          result,
          duration: Date.now() - startTime
        });
      } catch (error) {
        parentPort!.postMessage({
          type: 'taskError',
          taskId,
          error: (error as Error).message
        });
      }
    }
  });
}

export default WorkerPoolManager;
