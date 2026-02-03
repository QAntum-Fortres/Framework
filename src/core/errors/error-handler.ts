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
  IErrorHandler,
  IRetryStrategy,
  ILogger,
  ErrorContext,
  ErrorHandleResult,
  ErrorStrategy,
  RetryOptions,
  NeuralSnapshot
} from '../di/container';

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM ERROR TYPES - Specific, not generic!
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base error class for QANTUM errors
 * All custom errors extend this for type-safe handling
 */
export abstract class QAntumError extends Error {
  /** Error code for categorization */
  abstract readonly code: string;
  /** Component where error originated */
  abstract readonly component: string;
  /** Whether this error is recoverable */
  abstract readonly recoverable: boolean;
  /** Suggested retry strategy */
  abstract readonly retryStrategy: 'none' | 'immediate' | 'exponential' | 'alternative';
  /** Neural snapshot at time of error */
  neuralSnapshot?: NeuralSnapshot;
  /** Original error if wrapped */
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Network-related errors (API calls, WebSocket, etc.)
 */
export class NetworkError extends QAntumError {
  readonly code = 'NETWORK_ERROR';
  readonly component = 'Network';
  readonly recoverable = true;
  readonly retryStrategy: 'exponential' = 'exponential';
  
  /** HTTP status code if applicable */
  readonly statusCode?: number;
  /** Target URL or endpoint */
  readonly endpoint?: string;

  constructor(message: string, options?: { statusCode?: number; endpoint?: string; cause?: Error }) {
    super(message, options?.cause);
    this.statusCode = options?.statusCode;
    this.endpoint = options?.endpoint;
  }
}

/**
 * Timeout errors for operations that exceeded their time limit
 */
export class TimeoutError extends QAntumError {
  readonly code = 'TIMEOUT_ERROR';
  readonly component = 'Timeout';
  readonly recoverable = true;
  readonly retryStrategy: 'exponential' = 'exponential';
  
  /** Operation that timed out */
  readonly operation: string;
  /** Timeout duration in ms */
  readonly timeout: number;
  /** Elapsed time when timeout occurred */
  readonly elapsed: number;

  constructor(operation: string, timeout: number, elapsed: number, cause?: Error) {
    super(`Operation '${operation}' timed out after ${elapsed}ms (limit: ${timeout}ms)`, cause);
    this.operation = operation;
    this.timeout = timeout;
    this.elapsed = elapsed;
  }
}

/**
 * Validation errors for invalid input or data
 */
export class ValidationError extends QAntumError {
  readonly code = 'VALIDATION_ERROR';
  readonly component = 'Validation';
  readonly recoverable = false;
  readonly retryStrategy: 'none' = 'none';
  
  /** Field(s) that failed validation */
  readonly fields: string[];
  /** Validation rules that were violated */
  readonly violations: Array<{ field: string; rule: string; message: string }>;

  constructor(message: string, violations: Array<{ field: string; rule: string; message: string }>) {
    super(message);
    this.fields = violations.map(v => v.field);
    this.violations = violations;
  }
}

/**
 * Configuration errors for missing or invalid configuration
 */
export class ConfigurationError extends QAntumError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly component = 'Configuration';
  readonly recoverable = false;
  readonly retryStrategy: 'none' = 'none';
  
  /** Configuration key that's problematic */
  readonly configKey: string;
  /** Expected type or value */
  readonly expected?: string;
  /** Actual value received */
  readonly actual?: string;

  constructor(message: string, configKey: string, options?: { expected?: string; actual?: string }) {
    super(message);
    this.configKey = configKey;
    this.expected = options?.expected;
    this.actual = options?.actual;
  }
}

/**
 * AI service errors (API failures, rate limits, etc.)
 */
export class AIServiceError extends QAntumError {
  readonly code = 'AI_SERVICE_ERROR';
  readonly component = 'AIService';
  readonly recoverable = true;
  readonly retryStrategy: 'alternative' = 'alternative';
  
  /** AI provider that failed */
  readonly provider: string;
  /** Model used */
  readonly model?: string;
  /** Error type from provider */
  readonly providerError?: string;
  /** Whether rate limited */
  readonly rateLimited: boolean;

  constructor(message: string, provider: string, options?: {
    model?: string;
    providerError?: string;
    rateLimited?: boolean;
    cause?: Error;
  }) {
    super(message, options?.cause);
    this.provider = provider;
    this.model = options?.model;
    this.providerError = options?.providerError;
    this.rateLimited = options?.rateLimited ?? false;
  }
}

/**
 * Browser automation errors
 */
export class BrowserError extends QAntumError {
  readonly code = 'BROWSER_ERROR';
  readonly component = 'Browser';
  readonly recoverable = true;
  readonly retryStrategy: 'immediate' = 'immediate';
  
  /** Browser type (chromium, firefox, webkit) */
  readonly browserType: string;
  /** Page URL when error occurred */
  readonly pageUrl?: string;
  /** Selector that caused the error */
  readonly selector?: string;

  constructor(message: string, browserType: string, options?: {
    pageUrl?: string;
    selector?: string;
    cause?: Error;
  }) {
    super(message, options?.cause);
    this.browserType = browserType;
    this.pageUrl = options?.pageUrl;
    this.selector = options?.selector;
  }
}

/**
 * Security violation errors from sandbox
 */
export class SecurityError extends QAntumError {
  readonly code = 'SECURITY_ERROR';
  readonly component = 'Security';
  readonly recoverable = false;
  readonly retryStrategy: 'none' = 'none';
  
  /** Type of security violation */
  readonly violationType: 'sandbox' | 'authentication' | 'authorization' | 'injection';
  /** Attempted operation */
  readonly attemptedOperation: string;

  constructor(message: string, violationType: SecurityError['violationType'], attemptedOperation: string) {
    super(message);
    this.violationType = violationType;
    this.attemptedOperation = attemptedOperation;
  }
}

/**
 * Mutation errors from SEGC
 */
export class MutationError extends QAntumError {
  readonly code = 'MUTATION_ERROR';
  readonly component = 'SEGC';
  readonly recoverable = true;
  readonly retryStrategy: 'alternative' = 'alternative';
  
  /** Mutation ID that failed */
  readonly mutationId: string;
  /** Phase where failure occurred */
  readonly phase: 'proposal' | 'validation' | 'application' | 'rollback';
  /** Whether rollback is available */
  readonly rollbackAvailable: boolean;

  constructor(message: string, mutationId: string, phase: MutationError['phase'], options?: {
    rollbackAvailable?: boolean;
    cause?: Error;
  }) {
    super(message, options?.cause);
    this.mutationId = mutationId;
    this.phase = phase;
    this.rollbackAvailable = options?.rollbackAvailable ?? false;
  }
}

/**
 * Worker thread errors
 */
export class WorkerError extends QAntumError {
  readonly code = 'WORKER_ERROR';
  readonly component = 'Worker';
  readonly recoverable = true;
  readonly retryStrategy: 'immediate' = 'immediate';
  
  /** Worker ID that errored */
  readonly workerId: number;
  /** Task type being executed */
  readonly taskType?: string;
  /** Task ID if available */
  readonly taskId?: string;

  constructor(message: string, workerId: number, options?: {
    taskType?: string;
    taskId?: string;
    cause?: Error;
  }) {
    super(message, options?.cause);
    this.workerId = workerId;
    this.taskType = options?.taskType;
    this.taskId = options?.taskId;
  }
}

/**
 * Circuit breaker errors
 */
export class CircuitOpenError extends QAntumError {
  readonly code = 'CIRCUIT_OPEN';
  readonly component = 'CircuitBreaker';
  readonly recoverable = true;
  readonly retryStrategy: 'alternative' = 'alternative';
  
  /** Service that's circuit-opened */
  readonly service: string;
  /** When circuit will attempt half-open */
  readonly cooldownEnd: Date;

  constructor(service: string, cooldownEnd: Date) {
    super(`Circuit breaker open for service '${service}'. Retry after ${cooldownEnd.toISOString()}`);
    this.service = service;
    this.cooldownEnd = cooldownEnd;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL SNAPSHOT GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a neural snapshot of the current system state
 * Captures memory, handles, and stack trace for debugging
 */
export function createNeuralSnapshot(error?: Error): NeuralSnapshot {
  // Note: _getActiveHandles is an undocumented Node.js API for debugging
  const processWithInternals = process as NodeJS.Process & { _getActiveHandles?: () => unknown[] };
  return {
    memoryUsage: process.memoryUsage(),
    activeHandles: processWithInternals._getActiveHandles?.()?.length ?? 0,
    uptime: process.uptime(),
    timestamp: new Date(),
    stackTrace: error?.stack ?? new Error().stack ?? ''
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPONENTIAL BACKOFF RETRY STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryCondition: () => true
};

/**
 * Alternative strategy definition
 */
export interface AlternativeStrategy<T> {
  name: string;
  execute: () => Promise<T>;
  condition?: (error: Error) => boolean;
}

/**
 * 🔄 Exponential Backoff Retry Strategy
 * 
 * Implements intelligent retry logic with:
 * - Exponential backoff (delay doubles each attempt)
 * - Jitter to prevent thundering herd
 * - Alternative strategies when retries exhausted
 * - Neural snapshots on each failure
 */
export class ExponentialBackoffRetry implements IRetryStrategy {
  private logger?: ILogger;
  private alternatives: Map<string, AlternativeStrategy<unknown>[]> = new Map();

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Register alternative strategies for a specific operation
   * @param operationName - Name of the operation
   * @param strategies - Alternative strategies to try
   */
  registerAlternatives<T>(operationName: string, strategies: AlternativeStrategy<T>[]): void {
    this.alternatives.set(operationName, strategies as AlternativeStrategy<unknown>[]);
  }

  /**
   * Execute a function with exponential backoff retry
   * @param fn - Function to execute
   * @param options - Retry options
   * @returns Result of successful execution
   * @throws Last error if all retries and alternatives fail
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions & { operationName?: string } = {}
  ): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    const errors: Array<{ error: Error; attempt: number; snapshot: NeuralSnapshot }> = [];
    
    // Try main function with retries
    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const err = error as Error;
        const snapshot = createNeuralSnapshot(err);
        
        errors.push({ error: err, attempt, snapshot });
        
        this.logger?.warn(`Retry attempt ${attempt}/${opts.maxRetries} failed`, {
          error: err.message,
          attempt,
          operation: options.operationName
        });

        // Check if we should retry
        if (attempt === opts.maxRetries || !opts.retryCondition(err)) {
          break;
        }

        // Calculate delay with jitter
        const baseDelay = opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1);
        const jitter = Math.random() * 0.3 * baseDelay;
        const delay = Math.min(baseDelay + jitter, opts.maxDelay);

        this.logger?.info(`Waiting ${Math.round(delay)}ms before retry ${attempt + 1}`, {
          operation: options.operationName
        });

        await this.sleep(delay);
      }
    }

    // Try alternative strategies
    if (options.operationName) {
      const alternatives = this.alternatives.get(options.operationName);
      if (alternatives && alternatives.length > 0) {
        const lastError = errors[errors.length - 1]?.error;
        
        for (const alt of alternatives) {
          if (alt.condition && lastError && !alt.condition(lastError)) {
            continue;
          }

          try {
            this.logger?.info(`Trying alternative strategy: ${alt.name}`, {
              operation: options.operationName
            });
            return await alt.execute() as T;
          } catch (altError) {
            const err = altError as Error;
            errors.push({ 
              error: err, 
              attempt: opts.maxRetries + alternatives.indexOf(alt) + 1,
              snapshot: createNeuralSnapshot(err)
            });
            this.logger?.warn(`Alternative strategy '${alt.name}' failed`, {
              error: err.message
            });
          }
        }
      }
    }

    // All attempts failed - create comprehensive error
    const lastError = errors[errors.length - 1];
    const aggregateError = new AggregateRetryError(
      `All ${errors.length} attempts failed for operation '${options.operationName ?? 'unknown'}'`,
      errors
    );
    
    throw aggregateError;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Aggregate error containing all retry failures
 */
export class AggregateRetryError extends Error {
  readonly code = 'AGGREGATE_RETRY_ERROR';
  readonly attempts: Array<{ error: Error; attempt: number; snapshot: NeuralSnapshot }>;
  readonly totalAttempts: number;

  constructor(
    message: string,
    attempts: Array<{ error: Error; attempt: number; snapshot: NeuralSnapshot }>
  ) {
    super(message);
    this.name = 'AggregateRetryError';
    this.attempts = attempts;
    this.totalAttempts = attempts.length;
  }

  /**
   * Get the last error
   */
  get lastError(): Error | undefined {
    return this.attempts[this.attempts.length - 1]?.error;
  }

  /**
   * Get all unique error types
   */
  get errorTypes(): string[] {
    return [...new Set(this.attempts.map(a => a.error.name))];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CENTRALIZED ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🛡️ Centralized Error Handler
 * 
 * Routes errors to appropriate handlers based on type.
 * Supports custom strategies for different error categories.
 */
export class CentralizedErrorHandler extends EventEmitter implements IErrorHandler {
  private strategies = new Map<string, ErrorStrategy>();
  private logger?: ILogger;
  private retryStrategy: IRetryStrategy;

  constructor(options?: { logger?: ILogger; retryStrategy?: IRetryStrategy }) {
    super();
    this.logger = options?.logger;
    this.retryStrategy = options?.retryStrategy ?? new ExponentialBackoffRetry(options?.logger);
    
    // Register default strategies
    this.registerDefaultStrategies();
  }

  /**
   * Register a custom error handling strategy
   * @param errorType - Error type name (constructor.name)
   * @param strategy - Strategy to handle the error
   */
  registerStrategy(errorType: string, strategy: ErrorStrategy): void {
    this.strategies.set(errorType, strategy);
    this.logger?.debug(`Registered error strategy for '${errorType}'`);
  }

  /**
   * Handle an error with appropriate strategy
   * @param error - Error to handle
   * @param context - Additional context
   * @returns Result of error handling
   */
  async handle(error: Error, context?: ErrorContext): Promise<ErrorHandleResult> {
    // Capture neural snapshot
    const snapshot = createNeuralSnapshot(error);
    if (error instanceof QAntumError) {
      error.neuralSnapshot = snapshot;
    }

    // Log the error
    this.logger?.error(`Error in ${context?.component ?? 'unknown'}`, error, {
      operation: context?.operation,
      code: (error as QAntumError).code,
      recoverable: (error as QAntumError).recoverable,
      memoryUsage: snapshot.memoryUsage.heapUsed
    });

    // Emit error event
    this.emit('error', { error, context, snapshot });

    // Find appropriate strategy
    const strategy = this.findStrategy(error);
    
    if (strategy) {
      try {
        return await strategy.handle(error, context ?? {
          operation: 'unknown',
          component: 'unknown',
          neuralSnapshot: snapshot
        });
      } catch (strategyError) {
        this.logger?.error('Error strategy failed', strategyError as Error);
      }
    }

    // Default handling - not recovered
    return {
      recovered: false,
      retried: false,
      retryCount: 0,
      finalError: error
    };
  }

  /**
   * Find the most appropriate strategy for an error
   */
  private findStrategy(error: Error): ErrorStrategy | undefined {
    // Try exact match first
    let strategy = this.strategies.get(error.name);
    if (strategy?.canHandle(error)) {
      return strategy;
    }

    // Try by error code for QAntumErrors
    if (error instanceof QAntumError) {
      strategy = this.strategies.get(error.code);
      if (strategy?.canHandle(error)) {
        return strategy;
      }
    }

    // Try generic handlers
    for (const [, s] of this.strategies) {
      if (s.canHandle(error)) {
        return s;
      }
    }

    return undefined;
  }

  /**
   * Register default strategies for known error types
   */
  private registerDefaultStrategies(): void {
    // Network error strategy - retry with exponential backoff
    this.registerStrategy('NetworkError', {
      canHandle: (e) => e instanceof NetworkError,
      handle: async (error, context) => {
        const networkError = error as NetworkError;
        
        // Don't retry 4xx errors (client errors)
        if (networkError.statusCode && networkError.statusCode >= 400 && networkError.statusCode < 500) {
          return { recovered: false, retried: false, retryCount: 0, finalError: error };
        }

        // Will retry via external mechanism
        return { recovered: false, retried: true, retryCount: 0, finalError: error };
      }
    });

    // AI Service error strategy - try alternative providers
    this.registerStrategy('AIServiceError', {
      canHandle: (e) => e instanceof AIServiceError,
      handle: async (error, _context) => {
        const aiError = error as AIServiceError;
        
        // If rate limited, retry is suggested
        if (aiError.rateLimited) {
          return { recovered: false, retried: true, retryCount: 0, finalError: error };
        }

        // Try alternative provider
        return { recovered: false, retried: true, retryCount: 0, finalError: error };
      }
    });

    // Timeout error strategy
    this.registerStrategy('TimeoutError', {
      canHandle: (e) => e instanceof TimeoutError,
      handle: async (_error, _context) => {
        return { recovered: false, retried: true, retryCount: 0 };
      }
    });

    // Security error strategy - never retry
    this.registerStrategy('SecurityError', {
      canHandle: (e) => e instanceof SecurityError,
      handle: async (error, context) => {
        this.logger?.fatal('SECURITY VIOLATION', error, { context });
        this.emit('securityViolation', { error, context });
        return { recovered: false, retried: false, retryCount: 0, finalError: error };
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default CentralizedErrorHandler;
