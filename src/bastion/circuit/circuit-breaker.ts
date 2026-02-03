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
import {
  CircuitState,
  ServiceProvider,
  ServiceHealth,
  FallbackChain,
  CircuitBreakerConfig,
  HealthCheckResult,
  SystemHealth
} from '../types';

/**
 * Circuit state per service
 */
interface CircuitInfo {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  lastStateChange: Date;
  halfOpenStartTime?: Date;
}

/**
 * Request options
 */
export interface RequestOptions {
  service?: ServiceProvider;
  timeout?: number;
  retries?: number;
  fallbackEnabled?: boolean;
}

/**
 * Circuit Breaker Manager
 * 
 * Provides fault tolerance for AI service calls with automatic failover.
 */
export class CircuitBreakerManager extends EventEmitter {
  private config: Required<CircuitBreakerConfig>;
  private circuits: Map<ServiceProvider, CircuitInfo> = new Map();
  private serviceHealth: Map<ServiceProvider, ServiceHealth> = new Map();
  private fallbackChain: FallbackChain;
  private healthCheckInterval?: NodeJS.Timeout;
  private startTime = Date.now();
  private tripCount = 0;
  private requestCount = 0;
  private failedCount = 0;

  constructor(config: CircuitBreakerConfig = {}) {
    super();
    
    this.config = {
      enabled: config.enabled ?? true,
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 3,
      resetTimeout: config.resetTimeout ?? 30000,
      healthCheckInterval: config.healthCheckInterval ?? 30000,
      requestTimeout: config.requestTimeout ?? 10000
    };

    // Initialize fallback chain
    this.fallbackChain = {
      primary: 'gemini',
      fallbacks: ['claude', 'openai', 'ollama', 'local'],
      activeService: 'gemini',
      failoverCount: 0
    };

    // Initialize circuits for all services
    const services: ServiceProvider[] = ['gemini', 'claude', 'openai', 'ollama', 'local'];
    for (const service of services) {
      this.initializeCircuit(service);
    }

    // Start health checks
    if (this.config.enabled) {
      this.startHealthChecks();
    }
  }

  /**
   * Initialize a circuit for a service
   */
  private initializeCircuit(service: ServiceProvider): void {
    this.circuits.set(service, {
      state: 'closed',
      failures: 0,
      successes: 0,
      lastStateChange: new Date()
    });

    this.serviceHealth.set(service, {
      service,
      healthy: true,
      responseTime: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      errorRate: 0,
      circuitState: 'closed'
    });
  }

  /**
   * Execute a request with circuit breaker protection
   * @param requestFn - Function that makes the actual request
   * @param options - Request options
   */
  async execute<T>(
    requestFn: (service: ServiceProvider) => Promise<T>,
    options: RequestOptions = {}
  ): Promise<T> {
    if (!this.config.enabled) {
      return requestFn(options.service ?? this.fallbackChain.activeService);
    }

    const service = options.service ?? this.fallbackChain.activeService;
    this.requestCount++;

    // Check if circuit allows request
    if (!this.canRequest(service)) {
      // Try fallback
      if (options.fallbackEnabled !== false) {
        return this.executeWithFallback(requestFn, options);
      }
      throw new Error(`Circuit open for service: ${service}`);
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(
        () => requestFn(service),
        options.timeout ?? this.config.requestTimeout
      );
      
      this.recordSuccess(service);
      return result;
    } catch (error) {
      this.recordFailure(service);
      
      // Try fallback
      if (options.fallbackEnabled !== false) {
        return this.executeWithFallback(requestFn, options, service);
      }
      
      throw error;
    }
  }

  /**
   * Execute with fallback chain
   */
  private async executeWithFallback<T>(
    requestFn: (service: ServiceProvider) => Promise<T>,
    options: RequestOptions,
    failedService?: ServiceProvider
  ): Promise<T> {
    const services = this.getAvailableServices(failedService);

    for (const service of services) {
      if (!this.canRequest(service)) continue;

      try {
        const result = await this.executeWithTimeout(
          () => requestFn(service),
          options.timeout ?? this.config.requestTimeout
        );
        
        this.recordSuccess(service);
        
        // Update active service if different
        if (service !== this.fallbackChain.activeService) {
          this.fallbackChain.activeService = service;
          this.fallbackChain.failoverCount++;
          this.emit('failover', { from: failedService, to: service });
        }
        
        return result;
      } catch (error) {
        this.recordFailure(service);
        continue;
      }
    }

    this.failedCount++;
    throw new Error('All services exhausted');
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      fn()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Check if circuit allows requests
   */
  canRequest(service: ServiceProvider): boolean {
    const circuit = this.circuits.get(service);
    if (!circuit) return false;

    switch (circuit.state) {
      case 'closed':
        return true;
      
      case 'open':
        // Check if reset timeout has passed
        if (circuit.lastStateChange) {
          const elapsed = Date.now() - circuit.lastStateChange.getTime();
          if (elapsed >= this.config.resetTimeout) {
            this.transitionTo(service, 'half-open');
            return true;
          }
        }
        return false;
      
      case 'half-open':
        return true;
    }
  }

  /**
   * Record successful request
   */
  private recordSuccess(service: ServiceProvider): void {
    const circuit = this.circuits.get(service)!;
    const health = this.serviceHealth.get(service)!;

    circuit.successes++;
    circuit.lastSuccess = new Date();
    health.consecutiveFailures = 0;
    health.healthy = true;

    // Half-open -> Closed after success threshold
    if (circuit.state === 'half-open') {
      if (circuit.successes >= this.config.successThreshold) {
        this.transitionTo(service, 'closed');
      }
    }

    // Update error rate
    const total = circuit.successes + circuit.failures;
    health.errorRate = total > 0 ? circuit.failures / total : 0;

    this.emit('success', { service });
  }

  /**
   * Record failed request
   */
  private recordFailure(service: ServiceProvider): void {
    const circuit = this.circuits.get(service)!;
    const health = this.serviceHealth.get(service)!;

    circuit.failures++;
    circuit.lastFailure = new Date();
    health.consecutiveFailures++;

    // Update error rate
    const total = circuit.successes + circuit.failures;
    health.errorRate = total > 0 ? circuit.failures / total : 0;

    // Check if should trip
    if (circuit.state === 'closed') {
      if (circuit.failures >= this.config.failureThreshold) {
        this.transitionTo(service, 'open');
      }
    } else if (circuit.state === 'half-open') {
      // Any failure in half-open trips back to open
      this.transitionTo(service, 'open');
    }

    health.healthy = circuit.state === 'closed';

    this.emit('failure', { service, consecutiveFailures: health.consecutiveFailures });
  }

  /**
   * Transition circuit to new state
   */
  private transitionTo(service: ServiceProvider, state: CircuitState): void {
    const circuit = this.circuits.get(service)!;
    const health = this.serviceHealth.get(service)!;
    const previousState = circuit.state;

    circuit.state = state;
    circuit.lastStateChange = new Date();
    health.circuitState = state;

    if (state === 'open') {
      this.tripCount++;
      this.emit('circuitOpen', { service, previousState });
    } else if (state === 'closed') {
      circuit.failures = 0;
      circuit.successes = 0;
      this.emit('circuitClosed', { service, previousState });
    } else if (state === 'half-open') {
      circuit.halfOpenStartTime = new Date();
      circuit.successes = 0;
      this.emit('circuitHalfOpen', { service, previousState });
    }
  }

  /**
   * Get available services in fallback order
   */
  private getAvailableServices(exclude?: ServiceProvider): ServiceProvider[] {
    const all = [this.fallbackChain.primary, ...this.fallbackChain.fallbacks];
    return all.filter(s => s !== exclude);
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all services
   */
  async performHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const [service, health] of this.serviceHealth) {
      const startTime = Date.now();
      
      try {
        const isHealthy = await this.checkServiceHealth(service);
        const duration = Date.now() - startTime;

        health.responseTime = duration;
        health.lastCheck = new Date();
        health.healthy = isHealthy;

        results.push({
          module: service,
          healthy: isHealthy,
          duration,
          message: isHealthy ? 'OK' : 'Health check failed',
          timestamp: new Date()
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        
        results.push({
          module: service,
          healthy: false,
          duration,
          message: (error as Error).message,
          timestamp: new Date()
        });
      }
    }

    this.emit('healthCheckComplete', results);
    return results;
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(service: ServiceProvider): Promise<boolean> {
    // In real implementation, this would ping the actual service
    // For now, return based on circuit state
    const circuit = this.circuits.get(service);
    return circuit?.state !== 'open';
  }

  /**
   * Get circuit state for a service
   */
  getCircuitState(service: ServiceProvider): CircuitState | undefined {
    return this.circuits.get(service)?.state;
  }

  /**
   * Get all service health
   */
  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealth.values());
  }

  /**
   * Get fallback chain info
   */
  getFallbackChain(): FallbackChain {
    return { ...this.fallbackChain };
  }

  /**
   * Get active service
   */
  getActiveService(): ServiceProvider {
    return this.fallbackChain.activeService;
  }

  /**
   * Force circuit state
   */
  forceState(service: ServiceProvider, state: CircuitState): void {
    this.transitionTo(service, state);
  }

  /**
   * Reset all circuits
   */
  resetAll(): void {
    for (const service of this.circuits.keys()) {
      this.transitionTo(service, 'closed');
    }
    this.fallbackChain.activeService = this.fallbackChain.primary;
    this.fallbackChain.failoverCount = 0;
  }

  /**
   * Set primary service
   */
  setPrimary(service: ServiceProvider): void {
    this.fallbackChain.primary = service;
    this.fallbackChain.activeService = service;
  }

  /**
   * Get system health overview
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const moduleHealth = await this.performHealthChecks();
    const memUsage = process.memoryUsage();

    return {
      healthy: moduleHealth.every(m => m.healthy),
      modules: moduleHealth,
      activeServices: Array.from(this.serviceHealth.values()),
      memoryUsage: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss
      },
      cpuUsage: 0, // Would require async measurement
      uptime: Date.now() - this.startTime,
      checkedAt: new Date()
    };
  }

  /**
   * Get statistics
   */
  getStats(): {
    requestCount: number;
    failedCount: number;
    tripCount: number;
    failoverCount: number;
    activeService: ServiceProvider;
    uptime: number;
  } {
    return {
      requestCount: this.requestCount,
      failedCount: this.failedCount,
      tripCount: this.tripCount,
      failoverCount: this.fallbackChain.failoverCount,
      activeService: this.fallbackChain.activeService,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Check if circuit breaker is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.emit('shutdown');
  }
}

export default CircuitBreakerManager;
