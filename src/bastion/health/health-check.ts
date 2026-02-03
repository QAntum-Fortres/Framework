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

import { EventEmitter } from 'node:events';
import { cpus, freemem, totalmem } from 'node:os';
import { HealthCheckResult, SystemHealth } from '../types';

/**
 * Health check function type
 */
export type HealthCheckFn = () => Promise<HealthCheckResult>;

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Enable alerting */
  enabled: boolean;
  /** Memory threshold (0-1) */
  memoryThreshold: number;
  /** CPU threshold (0-1) */
  cpuThreshold: number;
  /** Consecutive failures before alert */
  failureThreshold: number;
  /** Alert callback */
  onAlert?: (alert: HealthAlert) => void;
}

/**
 * Health alert
 */
export interface HealthAlert {
  /** Alert ID */
  id: string;
  /** Severity */
  severity: AlertSeverity;
  /** Source module */
  module: string;
  /** Alert message */
  message: string;
  /** Timestamp */
  timestamp: Date;
  /** Auto-resolved */
  resolved: boolean;
  /** Resolution time */
  resolvedAt?: Date;
}

/**
 * Health history entry
 */
export interface HealthHistoryEntry {
  /** Timestamp */
  timestamp: Date;
  /** Overall healthy */
  healthy: boolean;
  /** Module count */
  moduleCount: number;
  /** Healthy modules */
  healthyModules: number;
  /** Memory usage ratio */
  memoryUsage: number;
  /** CPU usage ratio */
  cpuUsage: number;
}

/**
 * Health Check System Configuration
 */
export interface HealthCheckConfig {
  /** Enable health checks */
  enabled?: boolean;
  /** Check interval in ms */
  interval?: number;
  /** History retention count */
  historyRetention?: number;
  /** Alert configuration */
  alerts?: Partial<AlertConfig>;
}

/**
 * Health Check System
 * 
 * Monitors health of all QANTUM modules.
 */
export class HealthCheckSystem extends EventEmitter {
  private config: Required<HealthCheckConfig>;
  private alertConfig: AlertConfig;
  private checks: Map<string, HealthCheckFn> = new Map();
  private lastResults: Map<string, HealthCheckResult> = new Map();
  private consecutiveFailures: Map<string, number> = new Map();
  private alerts: Map<string, HealthAlert> = new Map();
  private history: HealthHistoryEntry[] = [];
  private checkInterval?: NodeJS.Timeout;
  private lastCpuInfo: { idle: number; total: number } | null = null;
  private startTime = Date.now();
  private checksPerformed = 0;

  constructor(config: HealthCheckConfig = {}) {
    super();
    
    this.config = {
      enabled: config.enabled ?? true,
      interval: config.interval ?? 30000, // 30 seconds
      historyRetention: config.historyRetention ?? 100,
      alerts: config.alerts ?? {}
    };

    this.alertConfig = {
      enabled: config.alerts?.enabled ?? true,
      memoryThreshold: config.alerts?.memoryThreshold ?? 0.85,
      cpuThreshold: config.alerts?.cpuThreshold ?? 0.90,
      failureThreshold: config.alerts?.failureThreshold ?? 3,
      onAlert: config.alerts?.onAlert
    };

    // Register built-in checks
    this.registerBuiltinChecks();
  }

  /**
   * Register built-in health checks
   */
  private registerBuiltinChecks(): void {
    // Memory check
    this.register('memory', async () => {
      const memUsage = process.memoryUsage();
      const ratio = memUsage.heapUsed / memUsage.heapTotal;
      
      return {
        module: 'memory',
        healthy: ratio < this.alertConfig.memoryThreshold,
        duration: 0,
        message: `Heap: ${Math.round(ratio * 100)}%`,
        metrics: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          rss: memUsage.rss
        },
        timestamp: new Date()
      };
    });

    // CPU check
    this.register('cpu', async () => {
      const usage = this.getCpuUsage();
      
      return {
        module: 'cpu',
        healthy: usage < this.alertConfig.cpuThreshold,
        duration: 0,
        message: `CPU: ${Math.round(usage * 100)}%`,
        metrics: { usage },
        timestamp: new Date()
      };
    });

    // System memory check
    this.register('system-memory', async () => {
      const free = freemem();
      const total = totalmem();
      const usage = (total - free) / total;
      
      return {
        module: 'system-memory',
        healthy: usage < 0.95,
        duration: 0,
        message: `System RAM: ${Math.round(usage * 100)}%`,
        metrics: { free, total, usage },
        timestamp: new Date()
      };
    });

    // Event loop check
    this.register('event-loop', async () => {
      const start = Date.now();
      
      await new Promise(resolve => setImmediate(resolve));
      
      const lag = Date.now() - start;
      
      return {
        module: 'event-loop',
        healthy: lag < 100, // Less than 100ms lag
        duration: lag,
        message: `Event loop lag: ${lag}ms`,
        metrics: { lag },
        timestamp: new Date()
      };
    });
  }

  /**
   * Get CPU usage
   */
  private getCpuUsage(): number {
    const cpuList = cpus();
    let idle = 0;
    let total = 0;

    for (const cpu of cpuList) {
      for (const type in cpu.times) {
        total += cpu.times[type as keyof typeof cpu.times];
      }
      idle += cpu.times.idle;
    }

    if (this.lastCpuInfo) {
      const idleDiff = idle - this.lastCpuInfo.idle;
      const totalDiff = total - this.lastCpuInfo.total;
      const usage = 1 - (idleDiff / totalDiff);
      
      this.lastCpuInfo = { idle, total };
      return Math.max(0, Math.min(1, usage));
    }

    this.lastCpuInfo = { idle, total };
    return 0;
  }

  /**
   * Register a health check
   * @param name - Check name
   * @param checkFn - Check function
   */
  register(name: string, checkFn: HealthCheckFn): void {
    this.checks.set(name, checkFn);
    this.consecutiveFailures.set(name, 0);
    this.emit('checkRegistered', name);
  }

  /**
   * Unregister a health check
   * @param name - Check name
   */
  unregister(name: string): boolean {
    const deleted = this.checks.delete(name);
    if (deleted) {
      this.lastResults.delete(name);
      this.consecutiveFailures.delete(name);
      this.emit('checkUnregistered', name);
    }
    return deleted;
  }

  /**
   * Start health check monitoring
   */
  start(): void {
    if (!this.config.enabled || this.checkInterval) return;

    // Run initial check
    this.runAllChecks();

    // Start interval
    this.checkInterval = setInterval(() => {
      this.runAllChecks();
    }, this.config.interval);

    this.emit('started', { interval: this.config.interval });
  }

  /**
   * Stop health check monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
    this.emit('stopped');
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    const checkPromises: Promise<HealthCheckResult>[] = [];

    for (const [name, checkFn] of this.checks) {
      checkPromises.push(
        this.runCheck(name, checkFn).then(result => {
          results.push(result);
          return result;
        })
      );
    }

    await Promise.all(checkPromises);
    this.checksPerformed++;

    // Update history
    this.updateHistory(results);

    // Check overall health
    const allHealthy = results.every(r => r.healthy);
    this.emit('checksComplete', { results, healthy: allHealthy });

    return results;
  }

  /**
   * Run a single health check
   */
  private async runCheck(name: string, checkFn: HealthCheckFn): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const result = await checkFn();
      result.duration = Date.now() - startTime;
      
      this.lastResults.set(name, result);
      
      if (result.healthy) {
        // Reset failure count
        this.consecutiveFailures.set(name, 0);
        
        // Check for resolved alerts
        this.tryResolveAlert(name);
      } else {
        // Increment failure count
        const failures = (this.consecutiveFailures.get(name) || 0) + 1;
        this.consecutiveFailures.set(name, failures);
        
        // Check if should alert
        if (failures >= this.alertConfig.failureThreshold) {
          this.createAlert(name, result);
        }
      }
      
      return result;
    } catch (error) {
      const result: HealthCheckResult = {
        module: name,
        healthy: false,
        duration: Date.now() - startTime,
        message: (error as Error).message,
        timestamp: new Date()
      };
      
      this.lastResults.set(name, result);
      
      const failures = (this.consecutiveFailures.get(name) || 0) + 1;
      this.consecutiveFailures.set(name, failures);
      
      if (failures >= this.alertConfig.failureThreshold) {
        this.createAlert(name, result);
      }
      
      return result;
    }
  }

  /**
   * Create an alert
   */
  private createAlert(module: string, result: HealthCheckResult): void {
    if (!this.alertConfig.enabled) return;
    
    const existingAlert = this.alerts.get(module);
    if (existingAlert && !existingAlert.resolved) return;

    const alert: HealthAlert = {
      id: `alert-${Date.now()}-${module}`,
      severity: this.determineSeverity(module, result),
      module,
      message: result.message,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(module, alert);
    this.emit('alert', alert);
    
    if (this.alertConfig.onAlert) {
      this.alertConfig.onAlert(alert);
    }
  }

  /**
   * Try to resolve an alert
   */
  private tryResolveAlert(module: string): void {
    const alert = this.alerts.get(module);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.emit('alertResolved', alert);
    }
  }

  /**
   * Determine alert severity
   */
  private determineSeverity(module: string, result: HealthCheckResult): AlertSeverity {
    const failures = this.consecutiveFailures.get(module) || 0;
    
    if (failures >= this.alertConfig.failureThreshold * 3) {
      return 'critical';
    } else if (failures >= this.alertConfig.failureThreshold * 2) {
      return 'warning';
    }
    return 'info';
  }

  /**
   * Update health history
   */
  private updateHistory(results: HealthCheckResult[]): void {
    const memUsage = process.memoryUsage();
    
    const entry: HealthHistoryEntry = {
      timestamp: new Date(),
      healthy: results.every(r => r.healthy),
      moduleCount: results.length,
      healthyModules: results.filter(r => r.healthy).length,
      memoryUsage: memUsage.heapUsed / memUsage.heapTotal,
      cpuUsage: this.getCpuUsage()
    };

    this.history.push(entry);

    // Trim history
    while (this.history.length > this.config.historyRetention) {
      this.history.shift();
    }
  }

  /**
   * Get current health status
   */
  async getHealth(): Promise<SystemHealth> {
    const results = await this.runAllChecks();
    const memUsage = process.memoryUsage();
    
    return {
      healthy: results.every(r => r.healthy),
      modules: results,
      activeServices: [],
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpuUsage: this.getCpuUsage(),
      uptime: Date.now() - this.startTime,
      checkedAt: new Date()
    };
  }

  /**
   * Get last results
   */
  getLastResults(): HealthCheckResult[] {
    return Array.from(this.lastResults.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get health history
   */
  getHistory(): HealthHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get health trend
   */
  getHealthTrend(): {
    trend: 'improving' | 'stable' | 'degrading';
    avgHealth: number;
    avgMemory: number;
    avgCpu: number;
  } {
    if (this.history.length < 2) {
      return {
        trend: 'stable',
        avgHealth: 1,
        avgMemory: 0,
        avgCpu: 0
      };
    }

    const recent = this.history.slice(-10);
    const avgHealth = recent.filter(h => h.healthy).length / recent.length;
    const avgMemory = recent.reduce((sum, h) => sum + h.memoryUsage, 0) / recent.length;
    const avgCpu = recent.reduce((sum, h) => sum + h.cpuUsage, 0) / recent.length;

    // Compare first half to second half
    const halfLen = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, halfLen);
    const secondHalf = recent.slice(halfLen);

    const firstAvg = firstHalf.filter(h => h.healthy).length / firstHalf.length;
    const secondAvg = secondHalf.filter(h => h.healthy).length / secondHalf.length;

    let trend: 'improving' | 'stable' | 'degrading';
    if (secondAvg > firstAvg + 0.1) {
      trend = 'improving';
    } else if (secondAvg < firstAvg - 0.1) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }

    return { trend, avgHealth, avgMemory, avgCpu };
  }

  /**
   * Get statistics
   */
  getStats(): {
    checksPerformed: number;
    registeredChecks: number;
    activeAlerts: number;
    historyEntries: number;
    uptime: number;
  } {
    return {
      checksPerformed: this.checksPerformed,
      registeredChecks: this.checks.size,
      activeAlerts: this.getActiveAlerts().length,
      historyEntries: this.history.length,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.checkInterval !== undefined;
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    this.stop();
    this.checks.clear();
    this.lastResults.clear();
    this.alerts.clear();
    this.history = [];
    this.emit('shutdown');
  }
}

export default HealthCheckSystem;
