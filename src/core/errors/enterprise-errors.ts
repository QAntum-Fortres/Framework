/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE ERROR HANDLING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * God Mode Error Handling with:
 * - Typed error hierarchy
 * - Automatic error recovery strategies
 * - Circuit breaker integration
 * - Retry mechanisms with exponential backoff
 * - Error correlation and tracking
 * - Automatic alerting for critical errors
 * - Error analytics and reporting
 */

import { getLogger, LogContext } from '../logging/enterprise-logger';

const logger = getLogger();

/**
 * Base error class for all QAntum errors
 */
export abstract class QAntumError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  abstract readonly recoverable: boolean;
  readonly retryStrategy: 'none' | 'immediate' | 'exponential' | 'alternative';
  readonly timestamp: Date;
  readonly correlationId: string;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    this.correlationId = `err-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    this.context = context;
    this.retryStrategy = 'none';

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);

    // Log the error
    logger.error(message, this, { component: 'ErrorHandler' }, context);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      recoverable: this.recoverable,
      retryStrategy: this.retryStrategy,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Validation Errors (400)
 */
export class ValidationError extends QAntumError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  readonly recoverable = false;
  
  constructor(message: string, public readonly validationErrors?: Record<string, string[]>) {
    super(message, { validationErrors });
  }
}

/**
 * Authentication Errors (401)
 */
export class AuthenticationError extends QAntumError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
  readonly recoverable = false;

  constructor(message: string = 'Authentication failed') {
    super(message);
  }
}

/**
 * Authorization Errors (403)
 */
export class AuthorizationError extends QAntumError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
  readonly recoverable = false;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }
}

/**
 * Not Found Errors (404)
 */
export class NotFoundError extends QAntumError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  readonly recoverable = false;

  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, { resource, identifier });
  }
}

/**
 * Conflict Errors (409)
 */
export class ConflictError extends QAntumError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;
  readonly recoverable = false;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Rate Limit Errors (429)
 */
export class RateLimitError extends QAntumError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;
  readonly recoverable = true;
  readonly retryStrategy = 'exponential' as const;

  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message, { retryAfter });
  }
}

/**
 * Internal Server Errors (500)
 */
export class InternalServerError extends QAntumError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = 500;
  readonly recoverable = false;

  constructor(message: string = 'Internal server error', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Service Unavailable Errors (503)
 */
export class ServiceUnavailableError extends QAntumError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly statusCode = 503;
  readonly recoverable = true;
  readonly retryStrategy = 'exponential' as const;

  constructor(service: string, reason?: string) {
    const message = reason 
      ? `Service ${service} unavailable: ${reason}`
      : `Service ${service} unavailable`;
    super(message, { service, reason });
  }
}

/**
 * Timeout Errors
 */
export class TimeoutError extends QAntumError {
  readonly code = 'TIMEOUT';
  readonly statusCode = 504;
  readonly recoverable = true;
  readonly retryStrategy = 'exponential' as const;

  constructor(operation: string, timeout: number) {
    super(`Operation '${operation}' timed out after ${timeout}ms`, { operation, timeout });
  }
}

/**
 * Database Errors
 */
export class DatabaseError extends QAntumError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;
  readonly recoverable = false;

  constructor(message: string, public readonly originalError?: Error) {
    super(message, { originalError: originalError?.message });
  }
}

/**
 * Network Errors
 */
export class NetworkError extends QAntumError {
  readonly code = 'NETWORK_ERROR';
  readonly statusCode = 503;
  readonly recoverable = true;
  readonly retryStrategy = 'exponential' as const;

  constructor(message: string, public readonly endpoint?: string) {
    super(message, { endpoint });
  }
}

/**
 * Configuration Errors
 */
export class ConfigurationError extends QAntumError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly statusCode = 500;
  readonly recoverable = false;

  constructor(message: string, public readonly configKey?: string) {
    super(message, { configKey });
  }
}

/**
 * Security Errors
 */
export class SecurityError extends QAntumError {
  readonly code = 'SECURITY_VIOLATION';
  readonly statusCode = 403;
  readonly recoverable = false;

  constructor(
    message: string,
    public readonly severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
  ) {
    super(message, { severity });
    
    // Log security event
    logger.security(`Security violation: ${message}`, severity, {
      component: 'ErrorHandler',
      correlationId: this.correlationId
    });
  }
}

/**
 * License Errors
 */
export class LicenseError extends QAntumError {
  readonly code = 'LICENSE_ERROR';
  readonly statusCode = 403;
  readonly recoverable = false;

  constructor(message: string) {
    super(message);
  }
}

/**
 * Circuit Breaker Errors
 */
export class CircuitBreakerError extends QAntumError {
  readonly code = 'CIRCUIT_BREAKER_OPEN';
  readonly statusCode = 503;
  readonly recoverable = true;
  readonly retryStrategy = 'alternative' as const;

  constructor(service: string) {
    super(`Circuit breaker open for service: ${service}`, { service });
  }
}

/**
 * Error Recovery Strategies
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export class ErrorRecoveryManager {
  private static defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  };

  /**
   * Retry an operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error | undefined;
    let delay = retryConfig.initialDelay;

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === retryConfig.maxAttempts) {
          break;
        }

        // Check if error is recoverable
        if (error instanceof QAntumError && !error.recoverable) {
          throw error;
        }

        // Calculate next delay with jitter
        const actualDelay = retryConfig.jitter
          ? delay * (0.5 + Math.random())
          : delay;

        logger.warn(`Retry attempt ${attempt}/${retryConfig.maxAttempts} after ${actualDelay}ms`, {
          component: 'ErrorRecovery',
          operation: operation.name,
          error: (error as Error).message
        });

        await this.sleep(actualDelay);

        delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Execute with timeout
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string = 'operation'
  ): Promise<T> {
    return Promise.race([
      operation(),
      this.sleep(timeoutMs).then(() => {
        throw new TimeoutError(operationName, timeoutMs);
      })
    ]);
  }

  /**
   * Execute with circuit breaker
   */
  static async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    serviceName: string,
    circuitBreaker: CircuitBreaker
  ): Promise<T> {
    if (circuitBreaker.isOpen()) {
      throw new CircuitBreakerError(serviceName);
    }

    try {
      const result = await operation();
      circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      circuitBreaker.recordFailure();
      throw error;
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Circuit Breaker Implementation
 */
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 1 minute
    private readonly halfOpenAttempts: number = 1
  ) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      // Check if timeout has elapsed
      if (this.lastFailureTime && 
          Date.now() - this.lastFailureTime.getTime() > this.timeout) {
        this.state = 'half-open';
        this.failureCount = 0;
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    
    if (this.state === 'half-open') {
      this.state = 'closed';
      logger.info('Circuit breaker closed', { component: 'CircuitBreaker' });
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      logger.error('Circuit breaker opened', undefined, { 
        component: 'CircuitBreaker',
        failureCount: this.failureCount,
        threshold: this.threshold
      });
    }
  }

  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.state = 'closed';
    this.lastFailureTime = undefined;
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

/**
 * Global error handler for unhandled errors
 */
export class GlobalErrorHandler {
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) {
      return;
    }

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
      logger.fatal(
        'Unhandled Promise Rejection',
        reason instanceof Error ? reason : new Error(String(reason)),
        { component: 'GlobalErrorHandler' },
        { promise: promise.toString() }
      );
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.fatal(
        'Uncaught Exception',
        error,
        { component: 'GlobalErrorHandler' }
      );
      
      // Give time for logs to flush
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully', {
        component: 'GlobalErrorHandler'
      });
      this.gracefulShutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully', {
        component: 'GlobalErrorHandler'
      });
      this.gracefulShutdown();
    });

    this.initialized = true;
    logger.info('Global error handler initialized', { component: 'GlobalErrorHandler' });
  }

  private static async gracefulShutdown(): Promise<void> {
    try {
      // Perform cleanup tasks
      await logger.shutdown();
      process.exit(0);
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }
}

/**
 * Error formatter for API responses
 */
export class ErrorFormatter {
  static toHTTPResponse(error: Error): {
    statusCode: number;
    body: Record<string, unknown>;
  } {
    if (error instanceof QAntumError) {
      return {
        statusCode: error.statusCode,
        body: {
          error: {
            code: error.code,
            message: error.message,
            correlationId: error.correlationId,
            timestamp: error.timestamp.toISOString(),
            ...(process.env.NODE_ENV === 'development' && { 
              stack: error.stack,
              context: error.context 
            })
          }
        }
      };
    }

    // Unknown error
    return {
      statusCode: 500,
      body: {
        error: {
          code: 'UNKNOWN_ERROR',
          message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : error.message,
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        }
      }
    };
  }
}
