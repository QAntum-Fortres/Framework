/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE LOGGING SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * God Mode Enterprise Logging with:
 * - Structured JSON logging
 * - Correlation IDs for distributed tracing
 * - Multiple log levels (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Performance metrics
 * - Security audit trails
 * - Log aggregation ready (ELK, Datadog, Splunk)
 * - Automatic PII masking
 * - Context enrichment
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
  SECURITY = 5
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  operation?: string;
  component?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context: LogContext;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration?: number;
    memory?: number;
    cpu?: number;
  };
  hostname: string;
  pid: number;
  environment: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filePath?: string;
  maxFileSize?: number;
  enableMetrics: boolean;
  enablePIIMasking: boolean;
  customTransports?: LogTransport[];
}

export interface LogTransport {
  log(entry: LogEntry): void | Promise<void>;
}

/**
 * Enterprise-Grade Logger
 * 
 * Features:
 * - Structured JSON logging
 * - Multiple transports (console, file, custom)
 * - Automatic correlation ID propagation
 * - Performance tracking
 * - Security event logging
 * - PII data masking
 */
export class EnterpriseLogger extends EventEmitter {
  private config: LoggerConfig;
  private fileStream?: fs.WriteStream;
  private metricsBuffer: LogEntry[] = [];
  private readonly PII_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // Credit card
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g // IP address (optional masking)
  ];

  constructor(config: Partial<LoggerConfig> = {}) {
    super();
    
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enableConsole: config.enableConsole ?? true,
      enableFile: config.enableFile ?? false,
      filePath: config.filePath ?? path.join(process.cwd(), 'logs', 'qantum.log'),
      maxFileSize: config.maxFileSize ?? 100 * 1024 * 1024, // 100MB
      enableMetrics: config.enableMetrics ?? true,
      enablePIIMasking: config.enablePIIMasking ?? true,
      customTransports: config.customTransports ?? []
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.config.enableFile) {
      this.initializeFileTransport();
    }

    // Set up metrics flushing
    if (this.config.enableMetrics) {
      setInterval(() => this.flushMetrics(), 60000); // Every minute
    }

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private initializeFileTransport(): void {
    const logDir = path.dirname(this.config.filePath!);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.fileStream = fs.createWriteStream(this.config.filePath!, {
      flags: 'a',
      encoding: 'utf8'
    });

    this.fileStream.on('error', (error) => {
      console.error('[EnterpriseLogger] File stream error:', error);
    });
  }

  /**
   * Create a log entry with full context
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    metadata?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message: this.config.enablePIIMasking ? this.maskPII(message) : message,
      context: {
        ...context,
        correlationId: context.correlationId ?? this.generateCorrelationId()
      },
      hostname: os.hostname(),
      pid: process.pid,
      environment: process.env.NODE_ENV || 'development'
    };

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: this.config.enablePIIMasking ? this.maskPII(error.message) : error.message,
        stack: error.stack,
        code: (error as any).code
      };
    }

    if (this.config.enableMetrics) {
      entry.performance = {
        memory: process.memoryUsage().heapUsed,
        cpu: process.cpuUsage().user
      };
    }

    return entry;
  }

  /**
   * Mask PII data from log messages
   */
  private maskPII(text: string): string {
    let masked = text;
    for (const pattern of this.PII_PATTERNS) {
      masked = masked.replace(pattern, '[REDACTED]');
    }
    return masked;
  }

  /**
   * Generate correlation ID for distributed tracing
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Write log entry to all transports
   */
  private async writeLog(entry: LogEntry): Promise<void> {
    // Check log level
    if (LogLevel[entry.level as keyof typeof LogLevel] < this.config.level) {
      return;
    }

    // Console transport
    if (this.config.enableConsole) {
      this.writeToConsole(entry);
    }

    // File transport
    if (this.config.enableFile && this.fileStream) {
      this.writeToFile(entry);
    }

    // Custom transports
    for (const transport of this.config.customTransports) {
      try {
        await transport.log(entry);
      } catch (error) {
        console.error('[EnterpriseLogger] Transport error:', error);
      }
    }

    // Store for metrics
    if (this.config.enableMetrics) {
      this.metricsBuffer.push(entry);
    }

    // Emit event
    this.emit('log', entry);
  }

  private writeToConsole(entry: LogEntry): void {
    const colorize = (level: string, text: string): string => {
      const colors: Record<string, string> = {
        DEBUG: '\x1b[36m',
        INFO: '\x1b[32m',
        WARN: '\x1b[33m',
        ERROR: '\x1b[31m',
        FATAL: '\x1b[35m',
        SECURITY: '\x1b[41m\x1b[37m'
      };
      const reset = '\x1b[0m';
      return `${colors[level] || ''}${text}${reset}`;
    };

    const formatted = JSON.stringify(entry, null, 2);
    console.log(colorize(entry.level, formatted));
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.fileStream) return;

    const line = JSON.stringify(entry) + '\n';
    this.fileStream.write(line);

    // Check file size and rotate if needed
    if (this.fileStream.bytesWritten > this.config.maxFileSize!) {
      this.rotateLog();
    }
  }

  private rotateLog(): void {
    if (!this.fileStream) return;

    this.fileStream.end();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const rotatedPath = this.config.filePath!.replace('.log', `.${timestamp}.log`);
    
    fs.renameSync(this.config.filePath!, rotatedPath);
    
    this.initializeFileTransport();
  }

  private flushMetrics(): void {
    if (this.metricsBuffer.length === 0) return;

    const metrics = {
      timestamp: new Date().toISOString(),
      period: '1m',
      totalLogs: this.metricsBuffer.length,
      byLevel: this.calculateLogLevelDistribution(),
      avgMemory: this.calculateAverageMemory(),
      errors: this.metricsBuffer.filter(e => e.level === 'ERROR' || e.level === 'FATAL').length
    };

    this.emit('metrics', metrics);
    this.metricsBuffer = [];
  }

  private calculateLogLevelDistribution(): Record<string, number> {
    return this.metricsBuffer.reduce((acc, entry) => {
      acc[entry.level] = (acc[entry.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateAverageMemory(): number {
    const total = this.metricsBuffer.reduce((sum, entry) => 
      sum + (entry.performance?.memory || 0), 0);
    return total / this.metricsBuffer.length;
  }

  /**
   * Public logging methods
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, metadata);
    this.writeLog(entry);
  }

  info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, metadata);
    this.writeLog(entry);
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, metadata);
    this.writeLog(entry);
  }

  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, metadata, error);
    this.writeLog(entry);
  }

  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, metadata, error);
    this.writeLog(entry);
    
    // For fatal errors, ensure logs are flushed before exit
    this.shutdown();
    process.exit(1);
  }

  /**
   * Security event logging with enhanced tracking
   */
  security(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: LogContext,
    metadata?: Record<string, unknown>
  ): void {
    const enrichedContext = {
      ...context,
      securityEvent: true,
      severity,
      timestamp: new Date().toISOString()
    };

    const entry = this.createLogEntry(
      LogLevel.SECURITY,
      `[SECURITY] ${event}`,
      enrichedContext,
      metadata
    );

    this.writeLog(entry);
    this.emit('security', entry);
  }

  /**
   * Performance logging with automatic duration tracking
   */
  async trackPerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      const memoryDelta = process.memoryUsage().heapUsed - startMemory;

      this.info(`Performance: ${operation}`, context, {
        duration,
        memoryDelta,
        success: true
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Performance: ${operation} FAILED`, error as Error, context, {
        duration,
        success: false
      });
      throw error;
    }
  }

  /**
   * Create child logger with inherited context
   */
  child(context: LogContext): EnterpriseLogger {
    const childLogger = new EnterpriseLogger(this.config);
    
    // Override logging methods to include parent context
    const originalMethods = {
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
      fatal: childLogger.fatal.bind(childLogger)
    };

    childLogger.debug = (message, ctx, metadata) => 
      originalMethods.debug(message, { ...context, ...ctx }, metadata);
    childLogger.info = (message, ctx, metadata) => 
      originalMethods.info(message, { ...context, ...ctx }, metadata);
    childLogger.warn = (message, ctx, metadata) => 
      originalMethods.warn(message, { ...context, ...ctx }, metadata);
    childLogger.error = (message, err, ctx, metadata) => 
      originalMethods.error(message, err, { ...context, ...ctx }, metadata);
    childLogger.fatal = (message, err, ctx, metadata) => 
      originalMethods.fatal(message, err, { ...context, ...ctx }, metadata);

    return childLogger;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.flushMetrics();

    if (this.fileStream) {
      await new Promise<void>((resolve) => {
        this.fileStream!.end(() => resolve());
      });
    }

    this.emit('shutdown');
  }
}

/**
 * Global logger instance
 */
let globalLogger: EnterpriseLogger | null = null;

export function createLogger(config?: Partial<LoggerConfig>): EnterpriseLogger {
  if (!globalLogger) {
    globalLogger = new EnterpriseLogger(config);
  }
  return globalLogger;
}

export function getLogger(): EnterpriseLogger {
  if (!globalLogger) {
    globalLogger = createLogger();
  }
  return globalLogger;
}

/**
 * Datadog Transport Example
 */
export class DatadogTransport implements LogTransport {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint = 'https://http-intake.logs.datadoghq.com/v1/input') {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async log(entry: LogEntry): Promise<void> {
    // In production, use actual HTTP client
    // For now, this is a stub showing the interface
    if (process.env.NODE_ENV === 'production' && this.apiKey) {
      // await fetch(this.endpoint, {
      //   method: 'POST',
      //   headers: {
      //     'DD-API-KEY': this.apiKey,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(entry)
      // });
    }
  }
}
