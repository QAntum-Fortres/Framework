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
import { TraceSpan } from '../types';
import { generateTraceId, generateSpanId } from '../utils/id-generator';

/** Observability configuration */
export interface ObservabilityConfig {
  /** Service name */
  serviceName?: string;
  /** Service version */
  serviceVersion?: string;
  /** OTLP endpoint */
  endpoint?: string;
  /** Export interval in ms */
  exportInterval?: number;
  /** Max spans to buffer */
  maxSpans?: number;
  /** Enable console export (for debugging) */
  consoleExport?: boolean;
  /** Include detailed attributes */
  detailedAttributes?: boolean;
  /** Sampling rate (0-1) */
  samplingRate?: number;
  /** Verbose logging */
  verbose?: boolean;
}

/** Span status */
export type SpanStatus = 'ok' | 'error' | 'timeout';

/** Active span context */
interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

/**
 * Observability Bridge
 * 
 * Provides:
 * - Distributed tracing with W3C Trace Context
 * - Span creation and management
 * - Metric collection
 * - Export to OTLP backends
 */
export class ObservabilityBridge extends EventEmitter {
  /** Configuration */
  private config: ObservabilityConfig;
  
  /** Span buffer */
  private spanBuffer: TraceSpan[] = [];
  
  /** Active spans */
  private activeSpans: Map<string, TraceSpan> = new Map();
  
  /** Export timer */
  private exportTimer: ReturnType<typeof setInterval> | null = null;
  
  /** Statistics */
  private stats = {
    spansCreated: 0,
    spansExported: 0,
    spansDropped: 0,
    errors: 0,
  };
  
  /** Current trace context (for context propagation) */
  private currentContext: SpanContext | null = null;

  constructor(config?: ObservabilityConfig) {
    super();
    
    this.config = {
      serviceName: config?.serviceName || 'qantum-swarm',
      serviceVersion: config?.serviceVersion || '17.0.0',
      endpoint: config?.endpoint || 'http://localhost:4318/v1/traces',
      exportInterval: config?.exportInterval || 30000,
      maxSpans: config?.maxSpans || 1000,
      consoleExport: config?.consoleExport ?? false,
      detailedAttributes: config?.detailedAttributes ?? true,
      samplingRate: config?.samplingRate || 1.0,
      verbose: config?.verbose ?? false,
    };
    
    this.startExportTimer();
  }

  /**
   * Start a new trace
   */
  startTrace(operationName: string, attributes?: Record<string, string>): string {
    const traceId = generateTraceId();
    const spanId = generateSpanId();
    
    this.currentContext = { traceId, spanId };
    
    this.createSpan(traceId, spanId, undefined, operationName, attributes);
    
    this.log(`Started trace: ${traceId}`);
    return traceId;
  }

  /**
   * Start a span within current trace
   */
  startSpan(operationName: string, attributes?: Record<string, string>): string {
    if (!this.currentContext) {
      return this.startTrace(operationName, attributes);
    }
    
    const spanId = generateSpanId();
    const parentSpanId = this.currentContext.spanId;
    
    this.createSpan(
      this.currentContext.traceId,
      spanId,
      parentSpanId,
      operationName,
      attributes
    );
    
    // Update context
    this.currentContext = {
      ...this.currentContext,
      spanId,
      parentSpanId,
    };
    
    return spanId;
  }

  /**
   * Create a span
   */
  private createSpan(
    traceId: string,
    spanId: string,
    parentSpanId: string | undefined,
    operationName: string,
    attributes?: Record<string, string>
  ): TraceSpan {
    // Apply sampling
    if (Math.random() > this.config.samplingRate!) {
      this.stats.spansDropped++;
      return {} as TraceSpan;
    }
    
    const span: TraceSpan = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: new Date(),
      status: 'ok',
      tags: {
        'service.name': this.config.serviceName!,
        'service.version': this.config.serviceVersion!,
        ...attributes,
      },
      events: [],
    };
    
    this.activeSpans.set(spanId, span);
    this.stats.spansCreated++;
    
    this.emit('spanStarted', { traceId, spanId, operationName });
    
    return span;
  }

  /**
   * Add event to current span
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void {
    if (!this.currentContext) return;
    
    const span = this.activeSpans.get(this.currentContext.spanId);
    if (span) {
      span.events.push({
        timestamp: new Date(),
        name,
        attributes,
      });
    }
  }

  /**
   * Set span attribute
   */
  setAttribute(key: string, value: string): void {
    if (!this.currentContext) return;
    
    const span = this.activeSpans.get(this.currentContext.spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  /**
   * Set span status
   */
  setStatus(status: SpanStatus, message?: string): void {
    if (!this.currentContext) return;
    
    const span = this.activeSpans.get(this.currentContext.spanId);
    if (span) {
      span.status = status;
      if (message) {
        span.tags['status.message'] = message;
      }
    }
  }

  /**
   * End current span
   */
  endSpan(status?: SpanStatus): void {
    if (!this.currentContext) return;
    
    const span = this.activeSpans.get(this.currentContext.spanId);
    if (span) {
      span.endTime = new Date();
      span.duration = span.endTime.getTime() - span.startTime.getTime();
      
      if (status) {
        span.status = status;
      }
      
      // Move to buffer
      this.activeSpans.delete(this.currentContext.spanId);
      this.addToBuffer(span);
      
      // Restore parent context
      if (this.currentContext.parentSpanId) {
        this.currentContext = {
          traceId: this.currentContext.traceId,
          spanId: this.currentContext.parentSpanId,
        };
      } else {
        this.currentContext = null;
      }
      
      this.emit('spanEnded', { 
        traceId: span.traceId, 
        spanId: span.spanId, 
        duration: span.duration 
      });
    }
  }

  /**
   * End trace (ends all active spans)
   */
  endTrace(): void {
    while (this.currentContext) {
      this.endSpan();
    }
  }

  /**
   * Create a child span and execute function
   */
  async withSpan<T>(
    operationName: string,
    fn: () => Promise<T>,
    attributes?: Record<string, string>
  ): Promise<T> {
    const spanId = this.startSpan(operationName, attributes);
    
    try {
      const result = await fn();
      this.setStatus('ok');
      return result;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setStatus('error', err.message);
      this.recordException(err);
      throw error;
    } finally {
      this.endSpan();
    }
  }

  /**
   * Record exception
   */
  recordException(error: Error): void {
    this.addEvent('exception', {
      'exception.type': error.name,
      'exception.message': error.message,
      'exception.stacktrace': error.stack,
    });
    this.stats.errors++;
  }

  /**
   * Get current trace ID
   */
  getCurrentTraceId(): string | null {
    return this.currentContext?.traceId || null;
  }

  /**
   * Get current span ID
   */
  getCurrentSpanId(): string | null {
    return this.currentContext?.spanId || null;
  }

  /**
   * Get trace context for propagation
   */
  getTraceContext(): SpanContext | null {
    return this.currentContext ? { ...this.currentContext } : null;
  }

  /**
   * Set trace context (for cross-process propagation)
   */
  setTraceContext(context: SpanContext): void {
    this.currentContext = context;
  }

  /**
   * Get W3C traceparent header
   */
  getTraceparent(): string | null {
    if (!this.currentContext) return null;
    
    // Format: version-traceid-spanid-flags
    // version: 00, flags: 01 (sampled)
    return `00-${this.currentContext.traceId}-${this.currentContext.spanId}-01`;
  }

  /**
   * Parse W3C traceparent header
   */
  parseTraceparent(traceparent: string): SpanContext | null {
    const parts = traceparent.split('-');
    if (parts.length !== 4) return null;
    
    return {
      traceId: parts[1],
      spanId: parts[2],
    };
  }

  /**
   * Add span to buffer
   */
  private addToBuffer(span: TraceSpan): void {
    this.spanBuffer.push(span);
    
    // Export to console if enabled
    if (this.config.consoleExport) {
      this.logSpan(span);
    }
    
    // Check buffer size
    if (this.spanBuffer.length >= this.config.maxSpans!) {
      this.export();
    }
  }

  /**
   * Log span to console (for debugging)
   */
  private logSpan(span: TraceSpan): void {
    console.log(`[TRACE] ${span.operationName} (${span.duration}ms)`, {
      traceId: span.traceId,
      spanId: span.spanId,
      status: span.status,
      tags: span.tags,
    });
  }

  /**
   * Export spans to backend
   */
  async export(): Promise<number> {
    if (this.spanBuffer.length === 0) {
      return 0;
    }
    
    const spans = [...this.spanBuffer];
    this.spanBuffer = [];
    
    try {
      // In a real implementation, this would send to OTLP endpoint
      // For now, we just log the export
      this.log(`Exporting ${spans.length} spans to ${this.config.endpoint}`);
      
      // Simulate OTLP export
      await this.simulateExport(spans);
      
      this.stats.spansExported += spans.length;
      this.emit('exported', { count: spans.length });
      
      return spans.length;
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Export failed: ${message}`);
      // Put spans back in buffer
      this.spanBuffer.unshift(...spans);
      throw error;
    }
  }

  /**
   * Simulate OTLP export
   */
  private async simulateExport(spans: TraceSpan[]): Promise<void> {
    // Convert to OTLP format
    const otlpData = this.toOtlpFormat(spans);
    
    // In real implementation:
    // await fetch(this.config.endpoint!, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(otlpData),
    // });
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Convert spans to OTLP format
   */
  private toOtlpFormat(spans: TraceSpan[]): Record<string, unknown> {
    return {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: this.config.serviceName } },
            { key: 'service.version', value: { stringValue: this.config.serviceVersion } },
          ],
        },
        scopeSpans: [{
          spans: spans.map(span => ({
            traceId: span.traceId,
            spanId: span.spanId,
            parentSpanId: span.parentSpanId,
            name: span.operationName,
            startTimeUnixNano: span.startTime.getTime() * 1000000,
            endTimeUnixNano: span.endTime ? span.endTime.getTime() * 1000000 : 0,
            status: { code: span.status === 'ok' ? 1 : 2 },
            attributes: Object.entries(span.tags).map(([k, v]) => ({
              key: k,
              value: { stringValue: v },
            })),
            events: span.events.map(e => ({
              timeUnixNano: e.timestamp.getTime() * 1000000,
              name: e.name,
              attributes: e.attributes ? Object.entries(e.attributes).map(([k, v]) => ({
                key: k,
                value: { stringValue: String(v) },
              })) : [],
            })),
          })),
        }],
      }],
    };
  }

  /**
   * Start export timer
   */
  private startExportTimer(): void {
    this.stopExportTimer();
    this.exportTimer = setInterval(() => {
      this.export().catch(err => this.log(`Auto-export error: ${err.message}`));
    }, this.config.exportInterval);
  }

  /**
   * Stop export timer
   */
  private stopExportTimer(): void {
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = null;
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    spansCreated: number;
    spansExported: number;
    spansDropped: number;
    spansBuffered: number;
    spansActive: number;
    errors: number;
  } {
    return {
      ...this.stats,
      spansBuffered: this.spanBuffer.length,
      spansActive: this.activeSpans.size,
    };
  }

  /**
   * Get all active traces
   */
  getActiveTraces(): string[] {
    const traces = new Set<string>();
    for (const span of this.activeSpans.values()) {
      traces.add(span.traceId);
    }
    return Array.from(traces);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.spanBuffer = [];
    this.activeSpans.clear();
    this.currentContext = null;
    this.stats = {
      spansCreated: 0,
      spansExported: 0,
      spansDropped: 0,
      errors: 0,
    };
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    this.stopExportTimer();
    
    // End all active spans
    for (const span of this.activeSpans.values()) {
      span.endTime = new Date();
      span.duration = span.endTime.getTime() - span.startTime.getTime();
      span.status = 'timeout';
      this.spanBuffer.push(span);
    }
    this.activeSpans.clear();
    
    // Final export
    await this.export();
    
    this.log('Observability bridge shutdown');
  }

  /**
   * Log if verbose
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.verbose) {
      console.log(`[Observability] ${message}`, ...args);
    }
  }
}

export default ObservabilityBridge;
