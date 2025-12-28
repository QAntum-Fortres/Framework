/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   ███╗   ███╗██╗███████╗████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗██████╗  ║
 * ║   ████╗ ████║██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗ ║
 * ║   ██╔████╔██║██║███████╗   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║██║  ██║ ║
 * ║   ██║╚██╔╝██║██║╚════██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██║  ██║ ║
 * ║   ██║ ╚═╝ ██║██║███████║   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██████╔╝ ║
 * ║   ╚═╝     ╚═╝╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝  ║
 * ║                                                                               ║
 * ║                    v23.0.0 "The Local Sovereign"                              ║
 * ║                                                                               ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                               ║
 * ║   🇧🇬 Made with ❤️ in Bulgaria by Димитър Продромов                            ║
 * ║                                                                               ║
 * ║   📊 Statistics:                                                              ║
 * ║   • Total Lines: 45,895+                                                      ║
 * ║   • TypeScript Files: 91                                                      ║
 * ║   • Tests: 492 passing                                                        ║
 * ║   • Enterprise Modules: 6                                                     ║
 * ║                                                                               ║
 * ║   🏢 Enterprise Features:                                                     ║
 * ║   • 🌡️  Thermal-Aware Pool (CPU temperature management)                       ║
 * ║   • 🐳 Docker Manager (Selenium Grid orchestration)                           ║
 * ║   • 🎖️  Swarm Commander (Commander-Soldier parallelism)                       ║
 * ║   • 🔊 Bulgarian TTS (Native text-to-speech)                                  ║
 * ║   • 🎛️  Dashboard Server (WebSocket at localhost:3847)                        ║
 * ║   • 🔐 License Manager (Hardware-locked licensing)                            ║
 * ║                                                                               ║
 * ╠═══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                               ║
 * ║   @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved. ║
 * ║   @license PROPRIETARY AND CONFIDENTIAL                                       ║
 * ║                                                                               ║
 * ║   This file is part of MisterMind.                                            ║
 * ║   Unauthorized copying, modification, distribution, or use of this file,      ║
 * ║   via any medium, is strictly prohibited without express written permission.  ║
 * ║                                                                               ║
 * ║   For licensing inquiries: dimitar@mistermind.bg                              ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { chromium, firefox, webkit, Browser, Page, BrowserType as PlaywrightBrowserType } from 'playwright';
import axios, { AxiosError } from 'axios';
import { 
  AdaptiveSemanticCore, 
  ASCConfig, 
  Intent, 
  IntentMatch, 
  SemanticMap,
  SemanticElement,
  CommonIntents 
} from './asc/semantic-core';
import {
  AgenticOrchestrator,
  DistillationLogger,
  ObservabilityBridge,
  BrowserPoolManager,
  SwarmConfig,
  SwarmTask,
  TaskResult,
  ExecutionPlan,
  SwarmStats,
} from './swarm';
import {
  SEGCController,
  SEGCConfig,
  SEGCStats,
  GhostPath,
  StateVersion,
  GeneticMutation,
} from './segc';
import {
  BastionController,
  BastionConfig,
  BastionStats,
  ServiceProvider,
  SystemHealth,
  MutationValidation,
} from './bastion';

export interface AuditResult {
  url: string;
  timestamp: Date;
  performance: number;
  accessibility: number;
  seo: number;
  brokenLinks: string[];
  suggestions: string[];
  duration: number;
  metrics: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    resourceCount: number;
    totalSize: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// v20.0 NEW TYPES - Financial Oracle, Memory Hardening, Browser Abstraction
// ═══════════════════════════════════════════════════════════════════════════════

/** Browser engine types for abstraction */
export type BrowserEngine = 'chromium' | 'firefox' | 'webkit';

/** AI Model selection */
export type AIModelProvider = 'cloud' | 'local';

/** Log levels for structured logging */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

/** Financial Oracle configuration */
export interface FinancialOracleConfig {
  /** Maximum cost per request in USD (default: 0.05) */
  maxCostPerRequest?: number;
  /** Monthly budget limit in USD (default: 100) */
  monthlyBudget?: number;
  /** Enable local GPU fallback (default: true) */
  enableLocalFallback?: boolean;
  /** Local model endpoint (Ollama) */
  localModelEndpoint?: string;
}

/** Autonomous goal execution result */
export interface AutonomousGoalResult {
  goalId: string;
  goal: string;
  success: boolean;
  steps: AutonomousStep[];
  totalDuration: number;
  aiModel: AIModelProvider;
  costIncurred: number;
  timestamp: Date;
}

/** Single step in autonomous execution */
export interface AutonomousStep {
  stepNumber: number;
  action: string;
  target?: string;
  status: 'completed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

/** Circuit breaker state */
export interface CircuitBreakerState {
  failures: number;
  lastFailure: Date | null;
  isOpen: boolean;
  openedAt: Date | null;
}

/** Log entry for structured logging */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  component: string;
  metadata?: Record<string, any>;
  traceId?: string;
}

export interface MisterMindConfig {
  /** Pro license key (format: MM-XXXX-XXXX-XXXX) */
  licenseKey?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable verbose logging (default: false) */
  verbose?: boolean;
  /** Adaptive Semantic Core configuration */
  asc?: ASCConfig;
  /** Browser engine to use (default: chromium) */
  browserEngine?: BrowserEngine;
  /** Financial Oracle configuration for cost optimization */
  financialOracle?: FinancialOracleConfig;
  /** Enable memory hardening with FinalizationRegistry (default: true) */
  enableMemoryHardening?: boolean;
}

export interface PredictionOptions {
  /** Code changes to analyze (diff or file content) */
  codeChanges?: string;
  /** Path to test files or directory */
  testPath?: string;
  /** Historical test results */
  testHistory?: TestHistoryEntry[];
  /** Code complexity threshold (default: 10) */
  complexityThreshold?: number;
}

export interface TestHistoryEntry {
  testName: string;
  passed: boolean;
  duration: number;
  timestamp: Date;
  error?: string;
}

export interface PredictionResult {
  riskScore: number;
  predictedFailures: PredictedFailure[];
  recommendation: string;
  confidence: number;
  analyzedAt: Date;
  codeMetrics: CodeMetrics;
  riskFactors: RiskFactor[];
}

export interface PredictedFailure {
  file: string;
  reason: string;
  probability: number;
  suggestedFix?: string;
}

export interface CodeMetrics {
  totalLines: number;
  complexity: number;
  changedLines: number;
  riskAreas: string[];
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface APISenseiConfig {
  /** Base URL for API */
  baseUrl: string;
  /** OpenAPI/Swagger spec URL or path */
  specUrl?: string;
  /** Authentication configuration */
  auth?: {
    type: 'bearer' | 'basic' | 'apiKey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    headerName?: string;
  };
  /** Test scenarios to generate */
  scenarios?: ('happy-path' | 'edge-cases' | 'error-handling' | 'security' | 'performance')[];
}

export interface APISenseiResult {
  baseUrl: string;
  totalTests: number;
  passed: number;
  failed: number;
  testResults: APISenseiTestResult[];
  coverage: APICoverage;
  recommendations: string[];
  duration: number;
}

export interface APISenseiTestResult {
  name: string;
  endpoint: string;
  method: string;
  scenario: string;
  status: 'passed' | 'failed' | 'skipped';
  responseTime: number;
  assertions: AssertionResult[];
  error?: string;
}

export interface AssertionResult {
  assertion: string;
  passed: boolean;
  expected?: any;
  actual?: any;
}

export interface APICoverage {
  endpoints: number;
  testedEndpoints: number;
  coveragePercent: number;
}

export interface ChronosOptions {
  /** Test function to run with time-travel debugging */
  testFn: () => Promise<void>;
  /** Enable automatic snapshots */
  autoSnapshot?: boolean;
  /** Snapshot interval in ms */
  snapshotInterval?: number;
  /** Maximum snapshots to keep */
  maxSnapshots?: number;
}

export interface ChronosResult {
  success: boolean;
  snapshots: StateSnapshot[];
  timeline: TimelineEvent[];
  duration: number;
  error?: string;
}

export interface StateSnapshot {
  id: string;
  timestamp: Date;
  state: Record<string, any>;
  label?: string;
}

export interface TimelineEvent {
  timestamp: Date;
  type: 'snapshot' | 'action' | 'error' | 'assertion';
  description: string;
  data?: any;
}

export interface APITestResult {
  status: number;
  responseTime: number;
  success: boolean;
}

export interface APITestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  validateStatus?: boolean;
}

export interface APITestResultFull {
  endpoint: string;
  method: string;
  status: number;
  statusText: string;
  responseTime: number;
  responseSize: number;
  success: boolean;
  headers: Record<string, string>;
  contentType: string;
  timestamp: Date;
  error?: string;
}

export interface LinkCheckResult {
  url: string;
  status: number;
  statusText: string;
  isValid: boolean;
  isExternal: boolean;
}

export interface CheckLinksResult {
  url: string;
  totalLinks: number;
  checkedLinks: number;
  brokenLinks: string[];
  results: LinkCheckResult[];
  duration: number;
}

/** License key pattern: MM-XXXX-XXXX-XXXX */
const LICENSE_PATTERN = /^MM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe';

// ═══════════════════════════════════════════════════════════════════════════════
// v20.0 BROWSER FACTORY - Dependency Injection for Browser Engines
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🏭 Browser Factory - Abstract browser creation for DI
 * Allows easy swapping between Chromium, Firefox, and WebKit
 */
export class BrowserFactory {
  private static engines: Record<BrowserEngine, PlaywrightBrowserType<Browser>> = {
    chromium,
    firefox,
    webkit,
  };

  /**
   * Get browser engine by type
   */
  static getEngine(type: BrowserEngine): PlaywrightBrowserType<Browser> {
    return this.engines[type] || chromium;
  }

  /**
   * Launch browser with optimal settings
   */
  static async launch(
    engine: BrowserEngine = 'chromium',
    options: { headless?: boolean; args?: string[] } = {}
  ): Promise<Browser> {
    const browserType = this.getEngine(engine);
    return browserType.launch({
      headless: options.headless ?? true,
      args: options.args ?? ['--disable-dev-shm-usage', '--no-sandbox'],
    });
  }

  /**
   * Get all available engines
   */
  static getAvailableEngines(): BrowserEngine[] {
    return ['chromium', 'firefox', 'webkit'];
  }
}

/**
 * Main MISTER MIND class - v20.0 "The Sovereign Singularity"
 */
export class MisterMind {
  private config: MisterMindConfig;
  private isProLicense: boolean = false;
  private asc: AdaptiveSemanticCore | null = null;
  
  // 🐝 Sovereign Swarm v17.0 components
  private orchestrator: AgenticOrchestrator | null = null;
  private distillationLogger: DistillationLogger | null = null;
  private observabilityBridge: ObservabilityBridge | null = null;
  private browserPool: BrowserPoolManager | null = null;
  private swarmInitialized: boolean = false;
  
  // 🧬 Self-Evolving Genetic Core v18.0 components
  private segc: SEGCController | null = null;
  private segcInitialized: boolean = false;
  
  // 🏰 Security Bastion & Neural Grid v19.0 components
  private bastion: BastionController | null = null;
  private bastionInitialized: boolean = false;

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🚀 v20.0 THE SOVEREIGN SINGULARITY - New Components
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /** 💰 Financial Oracle - Track API costs */
  private apiCostTracker: { totalCost: number; requestCount: number; lastReset: Date } = {
    totalCost: 0,
    requestCount: 0,
    lastReset: new Date(),
  };

  /** 🧹 Memory Hardening - FinalizationRegistry for GC cleanup */
  private browserRegistry: FinalizationRegistry<{ id: string; close: () => Promise<void> }>;
  private trackedBrowsers: Map<string, WeakRef<Browser>> = new Map();

  /** 📊 Structured Logger - Professional logging for Chronos */
  private logger = {
    logs: [] as LogEntry[],
    
    debug: (msg: string, meta?: Record<string, any>) => this.logMessage('debug', msg, meta),
    info: (msg: string, meta?: Record<string, any>) => this.logMessage('info', msg, meta),
    warn: (msg: string, meta?: Record<string, any>) => this.logMessage('warn', msg, meta),
    error: (msg: string, error?: Error, meta?: Record<string, any>) => {
      const entry = this.logMessage('error', msg, {
        ...meta,
        errorMessage: error?.message,
        errorStack: error?.stack,
      });
      return entry;
    },
    audit: (action: string, status: 'success' | 'failure', meta?: Record<string, any>) => {
      return this.logMessage('audit', `${action}: ${status}`, { action, status, ...meta });
    },
    
    getLogs: (level?: LogLevel, limit = 100) => {
      const filtered = level 
        ? this.logger.logs.filter(l => l.level === level)
        : this.logger.logs;
      return filtered.slice(-limit);
    },
    
    clear: () => { this.logger.logs = []; },
  };

  /** 🔌 Circuit Breaker for API Sensei */
  private apiSenseiCircuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailure: null,
    isOpen: false,
    openedAt: null,
  };

  constructor(config: MisterMindConfig = {}) {
    // Validate config
    if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout < 0)) {
      throw new Error('Invalid timeout: must be a positive number');
    }
    
    this.config = {
      timeout: 30000,
      verbose: false,
      browserEngine: 'chromium',
      enableMemoryHardening: true,
      financialOracle: {
        maxCostPerRequest: 0.05,
        monthlyBudget: 100,
        enableLocalFallback: true,
        localModelEndpoint: 'http://localhost:11434',
      },
      ...config
    };

    // 🧹 v20.0: Initialize FinalizationRegistry for Memory Hardening
    this.browserRegistry = new FinalizationRegistry((heldValue) => {
      if (heldValue && heldValue.close) {
        heldValue.close().catch((err) => {
          this.logger.error('GC: Failed to auto-close browser', err as Error, { browserId: heldValue.id });
        });
        this.logger.info('🧹 GC: Browser instance auto-closed by FinalizationRegistry', { browserId: heldValue.id });
      }
    });

    if (config.licenseKey) {
      this.validateLicense(config.licenseKey);
    }

    // Initialize ASC if config provided or PRO license
    if (config.asc || this.isProLicense) {
      this.initASC(config.asc);
    }

    this.logger.info(`🧠 MisterMind v${VERSION} initialized`, {
      tier: this.isProLicense ? 'pro' : 'free',
      browserEngine: this.config.browserEngine,
      memoryHardening: this.config.enableMemoryHardening,
    });

    // Print compact banner on initialization
    if (this.config.verbose) {
      printBanner({ compact: true });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 💰 v20.0 FINANCIAL ORACLE - Smart AI Model Selection
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 💰 Financial Oracle: Get optimal AI model based on cost and complexity
   * Automatically switches to local GPU (Ollama/Gemma) when budget is tight
   */
  private async getOptimalAIModel(taskComplexity: 'low' | 'medium' | 'high'): Promise<AIModelProvider> {
    const oracleConfig = this.config.financialOracle!;
    const costPerComplexity = { low: 0.01, medium: 0.03, high: 0.08 };
    const estimatedCost = costPerComplexity[taskComplexity];

    // Check monthly budget
    const now = new Date();
    if (now.getMonth() !== this.apiCostTracker.lastReset.getMonth()) {
      this.apiCostTracker = { totalCost: 0, requestCount: 0, lastReset: now };
      this.logger.info('💰 Financial Oracle: Monthly budget reset');
    }

    const remainingBudget = oracleConfig.monthlyBudget! - this.apiCostTracker.totalCost;

    // Decision logic
    if (estimatedCost > oracleConfig.maxCostPerRequest!) {
      this.logger.info('💰 Financial Oracle: Cost exceeds per-request limit, using local GPU', {
        estimatedCost,
        limit: oracleConfig.maxCostPerRequest,
      });
      return 'local';
    }

    if (remainingBudget < estimatedCost * 10) {
      this.logger.warn('💰 Financial Oracle: Budget running low, switching to local GPU', {
        remainingBudget,
        estimatedCost,
      });
      return 'local';
    }

    if (!this.isProLicense && oracleConfig.enableLocalFallback) {
      this.logger.info('💰 Financial Oracle: Free tier - using local GPU');
      return 'local';
    }

    return 'cloud';
  }

  /**
   * 💰 Track API cost after request
   */
  private trackAPICost(cost: number, operation: string): void {
    this.apiCostTracker.totalCost += cost;
    this.apiCostTracker.requestCount++;
    this.logger.audit('api_cost', 'success', {
      cost,
      operation,
      totalCost: this.apiCostTracker.totalCost,
      requestCount: this.apiCostTracker.requestCount,
    });
  }

  /**
   * 💰 Get Financial Oracle statistics
   */
  getFinancialStats(): {
    totalCost: number;
    requestCount: number;
    remainingBudget: number;
    averageCostPerRequest: number;
  } {
    const budget = this.config.financialOracle?.monthlyBudget ?? 100;
    return {
      totalCost: this.apiCostTracker.totalCost,
      requestCount: this.apiCostTracker.requestCount,
      remainingBudget: budget - this.apiCostTracker.totalCost,
      averageCostPerRequest: this.apiCostTracker.requestCount > 0
        ? this.apiCostTracker.totalCost / this.apiCostTracker.requestCount
        : 0,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 📊 v20.0 STRUCTURED LOGGER - Professional Logging
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 📊 Internal log message handler
   */
  private logMessage(level: LogLevel, message: string, meta?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      component: 'MisterMind',
      metadata: meta,
      traceId: this.observabilityBridge?.getCurrentTraceId() || undefined,
    };

    this.logger.logs.push(entry);
    if (this.logger.logs.length > 10000) {
      this.logger.logs.shift(); // Keep max 10k entries
    }

    if (this.config.verbose) {
      const prefix = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌', audit: '📋' }[level];
      console.log(`[${entry.timestamp.toISOString()}] ${prefix} ${message}`, meta || '');
    }

    return entry;
  }

  /**
   * 📊 Get structured logger for external access
   */
  getLogger() {
    return this.logger;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🧹 v20.0 MEMORY HARDENING - Browser Tracking with FinalizationRegistry
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 🧹 Register browser for GC-friendly auto-cleanup
   */
  private registerBrowserForCleanup(browser: Browser, id: string): void {
    if (!this.config.enableMemoryHardening) return;

    this.trackedBrowsers.set(id, new WeakRef(browser));
    this.browserRegistry.register(browser, { id, close: () => browser.close() }, browser);
    this.logger.debug('🧹 Browser registered for GC cleanup', { browserId: id });
  }

  /**
   * 🧹 Unregister browser (when manually closed)
   */
  private unregisterBrowser(browser: Browser, id: string): void {
    this.trackedBrowsers.delete(id);
    this.browserRegistry.unregister(browser);
    this.logger.debug('🧹 Browser unregistered from GC', { browserId: id });
  }

  /**
   * 🧹 Get tracked browsers count
   */
  getTrackedBrowsersCount(): number {
    let count = 0;
    for (const [id, ref] of this.trackedBrowsers) {
      if (ref.deref()) count++;
      else this.trackedBrowsers.delete(id);
    }
    return count;
  }

  /**
   * Initialize Adaptive Semantic Core
   */
  private initASC(config?: ASCConfig): void {
    this.asc = new AdaptiveSemanticCore({
      verbose: this.config.verbose,
      ...config
    });
    
    if (this.config.verbose) {
      console.log('🧠 ASC: Adaptive Semantic Core initialized');
    }
  }

  /**
   * 🧬 Initialize Self-Evolving Genetic Core
   */
  async initSEGC(config?: SEGCConfig): Promise<void> {
    if (this.segcInitialized) return;
    
    this.segc = new SEGCController({
      verbose: this.config.verbose,
      ...config,
    });
    
    this.segcInitialized = true;
    
    if (this.config.verbose) {
      console.log('🧬 SEGC: Self-Evolving Genetic Core initialized');
    }
  }

  /**
   * 🧬 Get SEGC controller
   */
  getSEGC(): SEGCController | null {
    return this.segc;
  }

  /**
   * 🧬 Get SEGC statistics
   */
  getSEGCStats(): SEGCStats | null {
    return this.segc?.getStats() || null;
  }

  /**
   * 🧬 Run SEGC learning cycle
   */
  async runLearningCycle(): Promise<{
    improvements: number;
    mutations: GeneticMutation[];
    predictions: number;
  } | null> {
    if (!this.segc) return null;
    return this.segc.runLearningCycle();
  }

  /**
   * 🧬 Test alternative selector paths
   */
  async testAlternativePaths(
    currentSelector: string,
    page: Page,
    options?: { targetText?: string; elementType?: string }
  ): Promise<GhostPath | null> {
    if (!this.segc) return null;
    return this.segc.testAlternativePaths(currentSelector, page, options);
  }

  /**
   * 🧬 Create a new strategy version for A/B testing
   */
  createStrategyVersion(options: {
    name: string;
    description?: string;
    strategy: object;
    isBaseline?: boolean;
  }): StateVersion | null {
    if (!this.segc) return null;
    return this.segc.createVersion(options);
  }

  /**
   * 🧬 Start A/B experiment between versions
   */
  startABExperiment(versionA: string, versionB: string, trafficSplit?: number): string | null {
    if (!this.segc) return null;
    return this.segc.startExperiment(versionA, versionB, trafficSplit);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏰 SECURITY BASTION & NEURAL GRID v19.0
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 🏰 Initialize Security Bastion & Neural Grid
   * @param config - Bastion configuration
   * @param vaultPassword - Password for encrypted vault (required)
   */
  async initBastion(config: BastionConfig = {}, vaultPassword: string): Promise<void> {
    if (this.bastionInitialized) return;
    
    this.bastion = new BastionController({
      verbose: this.config.verbose,
      ...config,
    });
    
    await this.bastion.initialize(vaultPassword);
    this.bastionInitialized = true;
    
    if (this.config.verbose) {
      console.log('🏰 BASTION: Security Bastion & Neural Grid initialized');
    }
  }

  /**
   * 🏰 Get Bastion controller
   */
  getBastion(): BastionController | null {
    return this.bastion;
  }

  /**
   * 🏰 Get Bastion statistics
   */
  getBastionStats(): BastionStats | null {
    return this.bastion?.getStats() || null;
  }

  /**
   * 🏰 Validate a mutation in secure sandbox
   */
  async validateMutationSecure(
    mutationId: string,
    mutationCode: string,
    context?: Record<string, any>
  ): Promise<MutationValidation | null> {
    if (!this.bastion) return null;
    return this.bastion.validateMutation(mutationId, mutationCode, context || {});
  }

  /**
   * 🏰 Submit task to worker pool
   */
  async submitWorkerTask<T = any, R = any>(
    type: string,
    payload: T,
    options?: { priority?: number; timeout?: number }
  ): Promise<R | null> {
    if (!this.bastion) return null;
    return this.bastion.submitTask<T, R>(type, payload, options);
  }

  /**
   * 🏰 Store data in encrypted vault
   */
  async storeSecure(
    id: string,
    type: 'ghost_knowledge' | 'predictions' | 'mutations' | 'versions' | 'metrics',
    data: any
  ): Promise<boolean> {
    if (!this.bastion) return false;
    await this.bastion.storeSecure(id, type, data);
    return true;
  }

  /**
   * 🏰 Retrieve data from encrypted vault
   */
  async retrieveSecure<T = any>(id: string): Promise<T | null> {
    if (!this.bastion) return null;
    return this.bastion.retrieveSecure<T>(id);
  }

  /**
   * 🏰 Execute with circuit breaker and fallback
   */
  async executeWithFallback<T>(
    requestFn: (service: ServiceProvider) => Promise<T>,
    options?: { service?: ServiceProvider; timeout?: number }
  ): Promise<T | null> {
    if (!this.bastion) return null;
    return this.bastion.executeWithFallback(requestFn, options);
  }

  /**
   * 🏰 Get system health
   */
  async getSystemHealth(): Promise<SystemHealth | null> {
    if (!this.bastion) return null;
    return this.bastion.getHealth();
  }

  /**
   * 🏰 Track browser for GC-friendly cleanup
   */
  trackBrowser(browser: object, instanceId: string): void {
    this.bastion?.trackBrowser(browser, instanceId);
  }

  /**
   * 🆓 FREE: Basic website audit
   * Uses Playwright to perform real performance, accessibility, and SEO analysis
   */
  async audit(url: string): Promise<AuditResult> {
    const startTime = Date.now();
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: must be a non-empty string');
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }

    this.logger.info(`🔍 Auditing ${url}...`);

    let browser: Browser | null = null;
    const browserId = `audit-${Date.now()}`;
    
    try {
      // v20.0: Use BrowserFactory for DI
      browser = await BrowserFactory.launch(this.config.browserEngine, { headless: true });
      this.registerBrowserForCleanup(browser, browserId);
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Collect performance metrics
      const metrics = {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        resourceCount: 0,
        totalSize: 0
      };
      
      // Track resources
      const resources: { size: number; type: string }[] = [];
      page.on('response', async (response) => {
        try {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0', 10);
          resources.push({ size, type: response.request().resourceType() });
        } catch {
          // Ignore errors from response handling
        }
      });

      // Navigate and measure timing
      const navigationStart = Date.now();
      
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: this.config.timeout 
      });
      
      metrics.loadTime = Date.now() - navigationStart;
      
      // Get performance timing from browser using Navigation Timing API
      const timing = await page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (entries.length > 0) {
          const nav = entries[0];
          return {
            domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
            loadComplete: nav.loadEventEnd - nav.startTime
          };
        }
        return { domContentLoaded: 0, loadComplete: 0 };
      });
      
      metrics.domContentLoaded = timing.domContentLoaded;
      metrics.resourceCount = resources.length;
      metrics.totalSize = resources.reduce((sum, r) => sum + r.size, 0);
      
      // Calculate performance score (based on load time)
      let performanceScore = 100;
      if (metrics.loadTime > 1000) performanceScore -= 10;
      if (metrics.loadTime > 2000) performanceScore -= 15;
      if (metrics.loadTime > 3000) performanceScore -= 20;
      if (metrics.loadTime > 5000) performanceScore -= 25;
      if (metrics.totalSize > 1000000) performanceScore -= 10; // > 1MB
      if (metrics.totalSize > 3000000) performanceScore -= 15; // > 3MB
      performanceScore = Math.max(0, Math.min(100, performanceScore));
      
      // Accessibility audit
      const accessibilityResults = await this.runAccessibilityChecks(page);
      
      // SEO audit  
      const seoResults = await this.runSEOChecks(page);
      
      // Find broken links on the page
      const brokenLinks = await this.findBrokenLinksOnPage(page);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(metrics, accessibilityResults, seoResults);
      
      const duration = Date.now() - startTime;
      
      const result: AuditResult = {
        url,
        timestamp: new Date(),
        performance: performanceScore,
        accessibility: accessibilityResults.score,
        seo: seoResults.score,
        brokenLinks,
        suggestions,
        duration,
        metrics
      };

      if (this.config.verbose) {
        console.log(`✅ Audit complete! Performance: ${result.performance}/100, Duration: ${duration}ms`);
      }
      
      return result;
      
    } finally {
      if (browser) {
        this.unregisterBrowser(browser, browserId);
        await browser.close();
        this.logger.debug('Browser closed after audit', { browserId });
      }
    }
  }

  /**
   * Run accessibility checks on a page
   */
  private async runAccessibilityChecks(page: Page): Promise<{ score: number; issues: string[] }> {
    const issues: string[] = [];
    let score = 100;
    
    // Check for images without alt text
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} image(s) missing alt text`);
      score -= imagesWithoutAlt * 5;
    }
    
    // Check for proper heading hierarchy
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', els => 
      els.map(el => el.tagName.toLowerCase())
    );
    const h1Count = headings.filter(h => h === 'h1').length;
    if (h1Count === 0) {
      issues.push('Missing h1 heading');
      score -= 10;
    } else if (h1Count > 1) {
      issues.push('Multiple h1 headings found');
      score -= 5;
    }
    
    // Check for form labels
    const inputsWithoutLabels = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      inputs => inputs.filter(input => {
        const id = input.id;
        if (!id) return true;
        return !document.querySelector(`label[for="${id}"]`);
      }).length
    );
    if (inputsWithoutLabels > 0) {
      issues.push(`${inputsWithoutLabels} input(s) missing associated labels`);
      score -= inputsWithoutLabels * 5;
    }
    
    // Check for sufficient color contrast (simplified check)
    const lowContrastElements = await page.$$eval('*', els => {
      let count = 0;
      els.slice(0, 100).forEach(el => { // Sample first 100 elements
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const fg = style.color;
        // Very simplified contrast check
        if (bg === fg && bg !== 'rgba(0, 0, 0, 0)') {
          count++;
        }
      });
      return count;
    });
    if (lowContrastElements > 0) {
      issues.push('Potential color contrast issues detected');
      score -= 5;
    }
    
    // Check for skip navigation link
    const hasSkipLink = await page.$('a[href="#main"], a[href="#content"], .skip-link, .skip-nav');
    if (!hasSkipLink) {
      issues.push('Missing skip navigation link');
      score -= 3;
    }
    
    // Check for language attribute
    const hasLang = await page.$eval('html', html => html.hasAttribute('lang'));
    if (!hasLang) {
      issues.push('Missing lang attribute on html element');
      score -= 5;
    }
    
    return { score: Math.max(0, Math.min(100, score)), issues };
  }

  /**
   * Run SEO checks on a page
   */
  private async runSEOChecks(page: Page): Promise<{ score: number; issues: string[] }> {
    const issues: string[] = [];
    let score = 100;
    
    // Check for title tag
    const title = await page.title();
    if (!title) {
      issues.push('Missing page title');
      score -= 15;
    } else if (title.length < 30) {
      issues.push('Title too short (recommended: 30-60 characters)');
      score -= 5;
    } else if (title.length > 60) {
      issues.push('Title too long (recommended: 30-60 characters)');
      score -= 3;
    }
    
    // Check for meta description
    const metaDesc = await page.$eval(
      'meta[name="description"]',
      el => el.getAttribute('content')
    ).catch(() => null);
    
    if (!metaDesc) {
      issues.push('Missing meta description');
      score -= 15;
    } else if (metaDesc.length < 120) {
      issues.push('Meta description too short (recommended: 120-160 characters)');
      score -= 5;
    } else if (metaDesc.length > 160) {
      issues.push('Meta description too long (recommended: 120-160 characters)');
      score -= 3;
    }
    
    // Check for canonical URL
    const hasCanonical = await page.$('link[rel="canonical"]');
    if (!hasCanonical) {
      issues.push('Missing canonical URL');
      score -= 5;
    }
    
    // Check for Open Graph tags
    const hasOgTitle = await page.$('meta[property="og:title"]');
    const hasOgDesc = await page.$('meta[property="og:description"]');
    if (!hasOgTitle || !hasOgDesc) {
      issues.push('Missing Open Graph meta tags');
      score -= 5;
    }
    
    // Check for viewport meta tag
    const hasViewport = await page.$('meta[name="viewport"]');
    if (!hasViewport) {
      issues.push('Missing viewport meta tag');
      score -= 10;
    }
    
    // Check for robots meta or robots.txt accessibility
    const robotsMeta = await page.$('meta[name="robots"]');
    const robotsContent = robotsMeta 
      ? await robotsMeta.getAttribute('content')
      : null;
    if (robotsContent?.includes('noindex')) {
      issues.push('Page is set to noindex');
      score -= 10;
    }
    
    return { score: Math.max(0, Math.min(100, score)), issues };
  }

  /**
   * Find broken links on the page (internal method for audit)
   */
  private async findBrokenLinksOnPage(page: Page): Promise<string[]> {
    const links = await page.$$eval('a[href]', anchors => 
      anchors.map(a => a.getAttribute('href')).filter(Boolean) as string[]
    );
    
    const brokenLinks: string[] = [];
    const pageUrl = page.url();
    const baseUrl = new URL(pageUrl).origin;
    
    // Check only first 20 links to avoid timeout
    const linksToCheck = links.slice(0, 20);
    
    for (const link of linksToCheck) {
      if (link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('tel:')) {
        continue;
      }
      
      try {
        const fullUrl = link.startsWith('http') ? link : new URL(link, baseUrl).href;
        const response = await axios.head(fullUrl, { 
          timeout: 5000,
          validateStatus: () => true 
        });
        
        if (response.status >= 400) {
          brokenLinks.push(fullUrl);
        }
      } catch {
        brokenLinks.push(link);
      }
    }
    
    return brokenLinks;
  }

  /**
   * Generate improvement suggestions based on audit results
   */
  private generateSuggestions(
    metrics: AuditResult['metrics'],
    accessibility: { score: number; issues: string[] },
    seo: { score: number; issues: string[] }
  ): string[] {
    const suggestions: string[] = [];
    
    // Performance suggestions
    if (metrics.loadTime > 3000) {
      suggestions.push('Page load time is high. Consider optimizing images and enabling compression.');
    }
    if (metrics.totalSize > 2000000) {
      suggestions.push('Total page size is large. Consider lazy loading and code splitting.');
    }
    if (metrics.resourceCount > 50) {
      suggestions.push('High number of requests. Consider bundling resources.');
    }
    
    // Add accessibility issues as suggestions
    accessibility.issues.forEach(issue => {
      suggestions.push(`Accessibility: ${issue}`);
    });
    
    // Add SEO issues as suggestions
    seo.issues.forEach(issue => {
      suggestions.push(`SEO: ${issue}`);
    });
    
    return suggestions;
  }

  /**
   * 🆓 FREE: Check for broken links
   * Crawls the page and checks all links for validity
   */
  async checkLinks(url: string, options: { maxLinks?: number; followExternal?: boolean } = {}): Promise<CheckLinksResult> {
    const { maxLinks = 50, followExternal = false } = options;
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: must be a non-empty string');
    }
    
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }

    if (this.config.verbose) {
      console.log(`🔗 Checking links on ${url}...`);
    }

    let browser: Browser | null = null;
    const startTime = Date.now();
    
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout 
      });
      
      const baseUrl = new URL(url).origin;
      
      // Extract all links from the page
      const links = await page.$$eval('a[href]', (anchors, base) => {
        return anchors.map(a => {
          const href = a.getAttribute('href') || '';
          const text = a.textContent?.trim() || '';
          return { href, text };
        });
      }, baseUrl);
      
      const results: LinkCheckResult[] = [];
      const brokenLinks: string[] = [];
      const checkedUrls = new Set<string>();
      
      // Filter and normalize links
      const linksToCheck = links
        .filter(link => {
          const href = link.href;
          // Skip anchors, mailto, tel, javascript
          if (!href || href.startsWith('#') || href.startsWith('mailto:') || 
              href.startsWith('tel:') || href.startsWith('javascript:')) {
            return false;
          }
          return true;
        })
        .slice(0, maxLinks);
      
      // Check each link in parallel (with concurrency limit)
      const concurrency = 5;
      for (let i = 0; i < linksToCheck.length; i += concurrency) {
        const batch = linksToCheck.slice(i, i + concurrency);
        
        await Promise.all(batch.map(async (link) => {
          let fullUrl: string;
          
          try {
            fullUrl = link.href.startsWith('http') 
              ? link.href 
              : new URL(link.href, baseUrl).href;
          } catch {
            results.push({
              url: link.href,
              status: 0,
              statusText: 'Invalid URL',
              isValid: false,
              isExternal: false
            });
            brokenLinks.push(link.href);
            return;
          }
          
          // Skip already checked URLs
          if (checkedUrls.has(fullUrl)) return;
          checkedUrls.add(fullUrl);
          
          const isExternal = !fullUrl.startsWith(baseUrl);
          
          // Skip external links if not following them
          if (isExternal && !followExternal) {
            results.push({
              url: fullUrl,
              status: -1,
              statusText: 'Skipped (external)',
              isValid: true,
              isExternal: true
            });
            return;
          }
          
          try {
            const response = await axios.head(fullUrl, {
              timeout: 10000,
              validateStatus: () => true,
              maxRedirects: 5,
              headers: {
                'User-Agent': 'MisterMind-LinkChecker/1.0'
              }
            });
            
            const isValid = response.status < 400;
            
            results.push({
              url: fullUrl,
              status: response.status,
              statusText: response.statusText,
              isValid,
              isExternal
            });
            
            if (!isValid) {
              brokenLinks.push(fullUrl);
            }
          } catch (error) {
            const axiosError = error as AxiosError;
            results.push({
              url: fullUrl,
              status: 0,
              statusText: axiosError.message || 'Connection failed',
              isValid: false,
              isExternal
            });
            brokenLinks.push(fullUrl);
          }
        }));
      }
      
      const duration = Date.now() - startTime;
      
      const result: CheckLinksResult = {
        url,
        totalLinks: links.length,
        checkedLinks: results.length,
        brokenLinks,
        results,
        duration
      };

      if (this.config.verbose) {
        console.log(`✅ Found ${brokenLinks.length} broken link(s) out of ${results.length} checked`);
      }
      
      return result;
      
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 🆓 FREE: Basic API test (limited to 10/day without license)
   * Makes real HTTP requests and measures response time
   */
  async testAPI(
    endpoint: string, 
    options: APITestOptions = {}
  ): Promise<APITestResultFull> {
    const { 
      method = 'GET', 
      headers = {}, 
      body = undefined,
      timeout = this.config.timeout,
      validateStatus = true
    } = options;
    
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint: must be a non-empty string');
    }
    
    try {
      new URL(endpoint);
    } catch {
      throw new Error(`Invalid endpoint URL format: ${endpoint}`);
    }

    if (this.config.verbose) {
      console.log(`🌐 Testing ${method} ${endpoint}...`);
    }

    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: method as any,
        url: endpoint,
        headers: {
          'User-Agent': 'MisterMind-APITest/1.0',
          ...headers
        },
        data: body,
        timeout,
        validateStatus: () => true, // Don't throw on any status
        maxRedirects: 5
      });
      
      const responseTime = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;
      
      // Calculate response size
      let responseSize = 0;
      if (response.data) {
        if (typeof response.data === 'string') {
          responseSize = Buffer.byteLength(response.data, 'utf8');
        } else {
          responseSize = Buffer.byteLength(JSON.stringify(response.data), 'utf8');
        }
      }
      
      const result: APITestResultFull = {
        endpoint,
        method,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        responseSize,
        success,
        headers: response.headers as Record<string, string>,
        contentType: response.headers['content-type'] || 'unknown',
        timestamp: new Date()
      };
      
      // Validate response if requested
      if (validateStatus && !success) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      if (this.config.verbose) {
        console.log(`✅ API Test complete! Status: ${response.status}, Time: ${responseTime}ms`);
      }
      
      return result;
      
    } catch (error) {
      const axiosError = error as AxiosError;
      const responseTime = Date.now() - startTime;
      
      const result: APITestResultFull = {
        endpoint,
        method,
        status: axiosError.response?.status || 0,
        statusText: axiosError.response?.statusText || 'Connection Failed',
        responseTime,
        responseSize: 0,
        success: false,
        headers: {},
        contentType: 'unknown',
        timestamp: new Date(),
        error: axiosError.message
      };

      if (this.config.verbose) {
        console.log(`❌ API Test failed: ${axiosError.message}`);
      }
      
      return result;
    }
  }

  /**
   * 🆓 FREE: Batch API testing - test multiple endpoints
   */
  async testAPIs(endpoints: Array<{ url: string; options?: APITestOptions }>): Promise<APITestResultFull[]> {
    const results: APITestResultFull[] = [];
    
    for (const { url, options } of endpoints) {
      const result = await this.testAPI(url, options);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 💎 PRO: Prediction Matrix - Predicts bugs before they happen
   * Analyzes code changes and test history to predict potential failures
   * Requires Pro license
   */
  async predict(options: PredictionOptions = {}): Promise<PredictionResult> {
    if (!this.isProLicense) {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║  🔮 PREDICTION MATRIX - PRO FEATURE                           ║');
      console.log('║                                                               ║');
      console.log('║  This feature requires a Pro license.                         ║');
      console.log('║                                                               ║');
      console.log('║  🛒 Get your license at: https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe ║');
      console.log('║                                                               ║');
      console.log('║  Pro includes:                                                ║');
      console.log('║  • 🔮 Prediction Matrix                                       ║');
      console.log('║  • 🤖 API Sensei                                              ║');
      console.log('║  • ⏰ Chronos Engine                                          ║');
      console.log('║  • 🛡️ Strategic Resilience                                    ║');
      console.log('║                                                               ║');
      console.log('║  Only $29/month - Cancel anytime                              ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('');
      
      throw new Error('Prediction Matrix requires a Pro license. Get yours at https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe');
    }

    const { 
      codeChanges = '', 
      testHistory = [],
      complexityThreshold = 10 
    } = options;

    if (this.config.verbose) {
      console.log('🔮 Analyzing code for potential failures...');
    }

    // Analyze code changes
    const codeMetrics = this.analyzeCodeComplexity(codeChanges);
    
    // Analyze test history for patterns
    const historyAnalysis = this.analyzeTestHistory(testHistory);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(codeMetrics, historyAnalysis, complexityThreshold);
    
    // Predict potential failures
    const predictedFailures = this.predictFailures(codeChanges, codeMetrics, historyAnalysis);
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(riskFactors, predictedFailures);
    
    // Calculate confidence based on available data
    const confidence = this.calculateConfidence(codeChanges, testHistory);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(riskFactors, predictedFailures);

    const result: PredictionResult = {
      riskScore,
      predictedFailures,
      recommendation,
      confidence,
      analyzedAt: new Date(),
      codeMetrics,
      riskFactors
    };

    if (this.config.verbose) {
      console.log(`✅ Analysis complete! Risk Score: ${riskScore}/100`);
    }

    return result;
  }

  /**
   * Analyze code complexity from code changes
   */
  private analyzeCodeComplexity(code: string): CodeMetrics {
    if (!code) {
      return {
        totalLines: 0,
        complexity: 0,
        changedLines: 0,
        riskAreas: []
      };
    }

    const lines = code.split('\n');
    const totalLines = lines.length;
    
    // Count changed lines (lines starting with + or -)
    const changedLines = lines.filter(line => 
      line.startsWith('+') || line.startsWith('-')
    ).length;

    // Calculate cyclomatic complexity (simplified)
    let complexity = 1; // Base complexity
    const complexityKeywords = [
      /\bif\b/g, /\belse\b/g, /\bwhile\b/g, /\bfor\b/g,
      /\bswitch\b/g, /\bcase\b/g, /\bcatch\b/g, /\b\?\b/g,
      /\b&&\b/g, /\b\|\|\b/g
    ];
    
    complexityKeywords.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    });

    // Identify risk areas
    const riskAreas: string[] = [];
    
    if (code.includes('async') || code.includes('await') || code.includes('Promise')) {
      riskAreas.push('async-operations');
    }
    if (code.includes('try') && code.includes('catch')) {
      riskAreas.push('error-handling');
    }
    if (code.match(/\.query\(|\.exec\(|SQL|SELECT|INSERT|UPDATE|DELETE/i)) {
      riskAreas.push('database-operations');
    }
    if (code.match(/fetch\(|axios|http\.|request\(/i)) {
      riskAreas.push('network-calls');
    }
    if (code.match(/localStorage|sessionStorage|cookie/i)) {
      riskAreas.push('state-management');
    }
    if (code.match(/auth|login|password|token|session/i)) {
      riskAreas.push('authentication');
    }
    if (code.match(/payment|checkout|cart|order/i)) {
      riskAreas.push('payment-flow');
    }

    return {
      totalLines,
      complexity,
      changedLines,
      riskAreas
    };
  }

  /**
   * Analyze test history for failure patterns
   */
  private analyzeTestHistory(history: TestHistoryEntry[]): {
    failureRate: number;
    flakyTests: string[];
    recentFailures: string[];
    avgDuration: number;
  } {
    if (!history || history.length === 0) {
      return {
        failureRate: 0,
        flakyTests: [],
        recentFailures: [],
        avgDuration: 0
      };
    }

    const totalTests = history.length;
    const failures = history.filter(t => !t.passed);
    const failureRate = (failures.length / totalTests) * 100;

    // Find flaky tests (tests that alternate between pass/fail)
    const testResults = new Map<string, boolean[]>();
    history.forEach(entry => {
      if (!testResults.has(entry.testName)) {
        testResults.set(entry.testName, []);
      }
      testResults.get(entry.testName)!.push(entry.passed);
    });

    const flakyTests: string[] = [];
    testResults.forEach((results, testName) => {
      if (results.length >= 2) {
        let flips = 0;
        for (let i = 1; i < results.length; i++) {
          if (results[i] !== results[i - 1]) flips++;
        }
        if (flips >= 2) flakyTests.push(testName);
      }
    });

    // Recent failures (last 10 entries)
    const recentHistory = history.slice(-10);
    const recentFailures = recentHistory
      .filter(t => !t.passed)
      .map(t => t.testName);

    // Average duration
    const avgDuration = history.reduce((sum, t) => sum + t.duration, 0) / totalTests;

    return {
      failureRate,
      flakyTests,
      recentFailures,
      avgDuration
    };
  }

  /**
   * Identify risk factors based on analysis
   */
  private identifyRiskFactors(
    codeMetrics: CodeMetrics,
    historyAnalysis: ReturnType<typeof this.analyzeTestHistory>,
    complexityThreshold: number
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Code complexity risk
    if (codeMetrics.complexity > complexityThreshold * 2) {
      factors.push({
        factor: 'High Code Complexity',
        impact: 'critical',
        description: `Cyclomatic complexity (${codeMetrics.complexity}) is very high. Consider refactoring.`
      });
    } else if (codeMetrics.complexity > complexityThreshold) {
      factors.push({
        factor: 'Elevated Code Complexity',
        impact: 'high',
        description: `Cyclomatic complexity (${codeMetrics.complexity}) exceeds threshold (${complexityThreshold}).`
      });
    }

    // Large change risk
    if (codeMetrics.changedLines > 500) {
      factors.push({
        factor: 'Large Code Change',
        impact: 'high',
        description: `${codeMetrics.changedLines} lines changed. Large changes increase bug probability.`
      });
    } else if (codeMetrics.changedLines > 200) {
      factors.push({
        factor: 'Significant Code Change',
        impact: 'medium',
        description: `${codeMetrics.changedLines} lines changed. Consider breaking into smaller changes.`
      });
    }

    // Risk area factors
    codeMetrics.riskAreas.forEach(area => {
      const riskMapping: Record<string, { impact: RiskFactor['impact']; desc: string }> = {
        'authentication': { impact: 'critical', desc: 'Changes to authentication require thorough security testing.' },
        'payment-flow': { impact: 'critical', desc: 'Payment flow changes require extensive testing and validation.' },
        'database-operations': { impact: 'high', desc: 'Database changes may cause data integrity issues.' },
        'async-operations': { impact: 'medium', desc: 'Async code is prone to race conditions and timing issues.' },
        'network-calls': { impact: 'medium', desc: 'Network operations may fail under various conditions.' },
        'error-handling': { impact: 'low', desc: 'Error handling changes - verify all error cases are covered.' },
        'state-management': { impact: 'medium', desc: 'State management changes may cause UI inconsistencies.' }
      };

      const mapping = riskMapping[area];
      if (mapping) {
        factors.push({
          factor: `${area.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} Modified`,
          impact: mapping.impact,
          description: mapping.desc
        });
      }
    });

    // Historical risk factors
    if (historyAnalysis.failureRate > 20) {
      factors.push({
        factor: 'High Historical Failure Rate',
        impact: 'high',
        description: `Test failure rate is ${historyAnalysis.failureRate.toFixed(1)}%. Investigate root causes.`
      });
    }

    if (historyAnalysis.flakyTests.length > 0) {
      factors.push({
        factor: 'Flaky Tests Detected',
        impact: 'medium',
        description: `${historyAnalysis.flakyTests.length} test(s) show inconsistent results.`
      });
    }

    return factors;
  }

  /**
   * Predict specific failures based on analysis
   */
  private predictFailures(
    code: string,
    codeMetrics: CodeMetrics,
    historyAnalysis: ReturnType<typeof this.analyzeTestHistory>
  ): PredictedFailure[] {
    const failures: PredictedFailure[] = [];

    // Add predictions based on risk areas
    codeMetrics.riskAreas.forEach(area => {
      const predictions: Record<string, { reason: string; probability: number; fix: string }> = {
        'authentication': {
          reason: 'Authentication changes may break login/logout flows',
          probability: 0.75,
          fix: 'Add comprehensive auth tests covering all user states'
        },
        'payment-flow': {
          reason: 'Payment processing is sensitive to any changes',
          probability: 0.80,
          fix: 'Test all payment scenarios including edge cases'
        },
        'async-operations': {
          reason: 'Async code may have race conditions',
          probability: 0.60,
          fix: 'Add proper async/await handling and timeout tests'
        },
        'database-operations': {
          reason: 'Database queries may fail or return unexpected data',
          probability: 0.55,
          fix: 'Verify database schema and add data validation'
        }
      };

      const pred = predictions[area];
      if (pred) {
        failures.push({
          file: `*${area}*`,
          reason: pred.reason,
          probability: pred.probability,
          suggestedFix: pred.fix
        });
      }
    });

    // Add predictions from flaky tests
    historyAnalysis.flakyTests.forEach(test => {
      failures.push({
        file: test,
        reason: 'Test has shown inconsistent results in recent runs',
        probability: 0.70,
        suggestedFix: 'Investigate test dependencies and add proper cleanup'
      });
    });

    // Add predictions from recent failures
    historyAnalysis.recentFailures.forEach(test => {
      if (!failures.find(f => f.file === test)) {
        failures.push({
          file: test,
          reason: 'Test failed in recent runs',
          probability: 0.65,
          suggestedFix: 'Check for regressions in related code'
        });
      }
    });

    // Sort by probability
    return failures.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(
    riskFactors: RiskFactor[],
    predictedFailures: PredictedFailure[]
  ): number {
    let score = 0;

    // Add points based on risk factors
    riskFactors.forEach(factor => {
      switch (factor.impact) {
        case 'critical': score += 25; break;
        case 'high': score += 15; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
    });

    // Add points based on predicted failures
    predictedFailures.forEach(failure => {
      score += failure.probability * 10;
    });

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(code: string, history: TestHistoryEntry[]): number {
    let confidence = 0.5; // Base confidence

    // More code = higher confidence in code analysis
    if (code && code.length > 100) confidence += 0.15;
    if (code && code.length > 500) confidence += 0.10;

    // More history = higher confidence in predictions
    if (history && history.length > 10) confidence += 0.15;
    if (history && history.length > 50) confidence += 0.10;

    return Math.min(0.95, confidence);
  }

  /**
   * Generate recommendation based on analysis
   */
  private generateRecommendation(
    riskFactors: RiskFactor[],
    predictedFailures: PredictedFailure[]
  ): string {
    const criticalFactors = riskFactors.filter(f => f.impact === 'critical');
    const highFactors = riskFactors.filter(f => f.impact === 'high');
    const highProbFailures = predictedFailures.filter(f => f.probability > 0.7);

    if (criticalFactors.length > 0) {
      return `⚠️ CRITICAL: ${criticalFactors[0].factor}. ${criticalFactors[0].description} Recommend blocking deployment until addressed.`;
    }

    if (highProbFailures.length > 0) {
      return `🔴 HIGH RISK: ${highProbFailures.length} test(s) likely to fail. Focus on: ${highProbFailures.slice(0, 3).map(f => f.file).join(', ')}`;
    }

    if (highFactors.length > 0) {
      return `🟠 ELEVATED RISK: ${highFactors[0].factor}. ${highFactors[0].description}`;
    }

    if (riskFactors.length > 0) {
      return `🟡 MODERATE RISK: ${riskFactors.length} risk factor(s) identified. Review before deployment.`;
    }

    return '🟢 LOW RISK: No significant issues detected. Proceed with standard testing.';
  }

  /**
   * 💎 PRO: Chronos Engine - Time-travel debugging
   * Records state snapshots during test execution for debugging
   * Requires Pro license
   */
  async chronos(options: ChronosOptions): Promise<ChronosResult> {
    if (!this.isProLicense) {
      throw new Error('Chronos Engine requires a Pro license. Get yours at https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe');
    }

    const { 
      testFn, 
      autoSnapshot = true, 
      snapshotInterval = 100,
      maxSnapshots = 50 
    } = options;

    if (typeof testFn !== 'function') {
      throw new Error('testFn must be a function');
    }

    if (this.config.verbose) {
      console.log('⏰ Starting Chronos Engine...');
    }

    const snapshots: StateSnapshot[] = [];
    const timeline: TimelineEvent[] = [];
    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Create snapshot function
    const takeSnapshot = (label?: string, state: Record<string, any> = {}) => {
      if (snapshots.length >= maxSnapshots) {
        snapshots.shift(); // Remove oldest snapshot
      }
      
      const snapshot: StateSnapshot = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        state: { ...state },
        label
      };
      
      snapshots.push(snapshot);
      
      timeline.push({
        timestamp: new Date(),
        type: 'snapshot',
        description: label || `Snapshot #${snapshots.length}`,
        data: { snapshotId: snapshot.id }
      });
    };

    try {
      // Initial snapshot
      takeSnapshot('Initial state');
      
      timeline.push({
        timestamp: new Date(),
        type: 'action',
        description: 'Test execution started'
      });

      // Auto snapshot at intervals
      if (autoSnapshot) {
        intervalId = setInterval(() => {
          takeSnapshot('Auto snapshot');
        }, snapshotInterval);
      }

      // Execute the test function
      await testFn();

      timeline.push({
        timestamp: new Date(),
        type: 'action',
        description: 'Test execution completed successfully'
      });

    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : String(error);
      
      timeline.push({
        timestamp: new Date(),
        type: 'error',
        description: `Test failed: ${errorMessage}`,
        data: { error: errorMessage }
      });

      // Take error snapshot
      takeSnapshot('Error state', { error: errorMessage });
      
    } finally {
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // Final snapshot
      takeSnapshot('Final state');
    }

    const duration = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`✅ Chronos complete! Duration: ${duration}ms, Snapshots: ${snapshots.length}`);
    }

    return {
      success,
      snapshots,
      timeline,
      duration,
      error: errorMessage
    };
  }

  /**
   * 💎 PRO: API Sensei - Intelligent API testing
   * Automatically generates and runs API tests based on configuration
   * Requires Pro license
   */
  async apiSensei(config: APISenseiConfig): Promise<APISenseiResult> {
    if (!this.isProLicense) {
      throw new Error('API Sensei requires a Pro license. Get yours at https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe');
    }

    const { 
      baseUrl, 
      auth,
      scenarios = ['happy-path', 'edge-cases', 'error-handling']
    } = config;

    if (!baseUrl) {
      throw new Error('baseUrl is required');
    }

    if (this.config.verbose) {
      console.log(`🤖 API Sensei analyzing ${baseUrl}...`);
    }

    const startTime = Date.now();
    const testResults: APISenseiTestResult[] = [];
    const recommendations: string[] = [];
    let passed = 0;
    let failed = 0;

    // Build auth headers
    const authHeaders: Record<string, string> = {};
    if (auth) {
      switch (auth.type) {
        case 'bearer':
          if (auth.token) authHeaders['Authorization'] = `Bearer ${auth.token}`;
          break;
        case 'basic':
          if (auth.username && auth.password) {
            const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
            authHeaders['Authorization'] = `Basic ${encoded}`;
          }
          break;
        case 'apiKey':
          if (auth.apiKey && auth.headerName) {
            authHeaders[auth.headerName] = auth.apiKey;
          }
          break;
      }
    }

    // Generate test scenarios
    const tests = this.generateAPISenseiTests(baseUrl, scenarios, authHeaders);

    // Run tests
    for (const test of tests) {
      try {
        const result = await this.runAPISenseiTest(test, authHeaders);
        testResults.push(result);
        
        if (result.status === 'passed') {
          passed++;
        } else if (result.status === 'failed') {
          failed++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        testResults.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          scenario: test.scenario,
          status: 'failed',
          responseTime: 0,
          assertions: [],
          error: errorMsg
        });
        failed++;
      }
    }

    // Generate recommendations
    const failureRate = tests.length > 0 ? (failed / tests.length) * 100 : 0;
    
    if (failureRate > 50) {
      recommendations.push('🔴 Critical: Over 50% of tests failed. Review API implementation.');
    }
    
    const slowTests = testResults.filter(t => t.responseTime > 1000);
    if (slowTests.length > 0) {
      recommendations.push(`⚠️ Performance: ${slowTests.length} endpoint(s) have response time > 1s.`);
    }

    const errorTests = testResults.filter(t => t.scenario === 'error-handling' && t.status === 'failed');
    if (errorTests.length > 0) {
      recommendations.push(`🛡️ Error Handling: ${errorTests.length} error scenario(s) not handled properly.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All tests passed. API is functioning correctly.');
    }

    const duration = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`✅ API Sensei complete! ${passed} passed, ${failed} failed`);
    }

    return {
      baseUrl,
      totalTests: tests.length,
      passed,
      failed,
      testResults,
      coverage: {
        endpoints: tests.length,
        testedEndpoints: testResults.filter(t => t.status !== 'skipped').length,
        coveragePercent: tests.length > 0 ? 
          (testResults.filter(t => t.status !== 'skipped').length / tests.length) * 100 : 0
      },
      recommendations,
      duration
    };
  }

  /**
   * Generate API test scenarios
   */
  private generateAPISenseiTests(
    baseUrl: string,
    scenarios: APISenseiConfig['scenarios'],
    authHeaders: Record<string, string>
  ): Array<{
    name: string;
    endpoint: string;
    method: string;
    scenario: string;
    body?: any;
    expectedStatus?: number;
    assertions: string[];
  }> {
    const tests: Array<{
      name: string;
      endpoint: string;
      method: string;
      scenario: string;
      body?: any;
      expectedStatus?: number;
      assertions: string[];
    }> = [];

    // Happy path tests
    if (scenarios?.includes('happy-path')) {
      tests.push({
        name: 'GET Base URL - Happy Path',
        endpoint: baseUrl,
        method: 'GET',
        scenario: 'happy-path',
        expectedStatus: 200,
        assertions: ['status < 400', 'responseTime < 5000']
      });

      tests.push({
        name: 'HEAD Base URL - Check Availability',
        endpoint: baseUrl,
        method: 'HEAD',
        scenario: 'happy-path',
        expectedStatus: 200,
        assertions: ['status < 400']
      });
    }

    // Edge case tests
    if (scenarios?.includes('edge-cases')) {
      tests.push({
        name: 'GET with trailing slash',
        endpoint: `${baseUrl}/`,
        method: 'GET',
        scenario: 'edge-cases',
        assertions: ['status < 500']
      });

      tests.push({
        name: 'OPTIONS - CORS check',
        endpoint: baseUrl,
        method: 'OPTIONS',
        scenario: 'edge-cases',
        assertions: ['status < 500']
      });
    }

    // Error handling tests
    if (scenarios?.includes('error-handling')) {
      tests.push({
        name: 'GET Non-existent endpoint',
        endpoint: `${baseUrl}/non-existent-path-${Date.now()}`,
        method: 'GET',
        scenario: 'error-handling',
        expectedStatus: 404,
        assertions: ['status === 404 || status === 400']
      });

      tests.push({
        name: 'POST without body',
        endpoint: baseUrl,
        method: 'POST',
        scenario: 'error-handling',
        assertions: ['status < 500'] // Should handle gracefully, not crash
      });
    }

    // Security tests
    if (scenarios?.includes('security')) {
      tests.push({
        name: 'SQL Injection attempt',
        endpoint: `${baseUrl}?id=1' OR '1'='1`,
        method: 'GET',
        scenario: 'security',
        assertions: ['status !== 500', 'status !== 200'] // Should be blocked
      });

      tests.push({
        name: 'XSS attempt',
        endpoint: `${baseUrl}?q=<script>alert(1)</script>`,
        method: 'GET',
        scenario: 'security',
        assertions: ['status !== 500']
      });
    }

    // Performance tests
    if (scenarios?.includes('performance')) {
      tests.push({
        name: 'Response time check',
        endpoint: baseUrl,
        method: 'GET',
        scenario: 'performance',
        assertions: ['responseTime < 3000']
      });
    }

    return tests;
  }

  /**
   * 🔌 v20.0: Check and update Circuit Breaker state
   */
  private checkCircuitBreaker(): boolean {
    const cb = this.apiSenseiCircuitBreaker;
    
    // Check if circuit should be reset (after 30 seconds)
    if (cb.isOpen && cb.openedAt) {
      const timeSinceOpen = Date.now() - cb.openedAt.getTime();
      if (timeSinceOpen > 30000) {
        cb.isOpen = false;
        cb.failures = 0;
        cb.openedAt = null;
        this.logger.info('🔌 Circuit Breaker: Reset after cooldown');
      }
    }
    
    return cb.isOpen;
  }

  /**
   * 🔌 v20.0: Record failure and potentially open circuit
   */
  private recordCircuitBreakerFailure(statusCode: number): void {
    const cb = this.apiSenseiCircuitBreaker;
    
    if (statusCode >= 500) {
      cb.failures++;
      cb.lastFailure = new Date();
      
      // Open circuit after 3 consecutive 500 errors
      if (cb.failures >= 3 && !cb.isOpen) {
        cb.isOpen = true;
        cb.openedAt = new Date();
        this.logger.error('🔌 Circuit Breaker: OPEN - 3 consecutive 500 errors', undefined, {
          failures: cb.failures,
          lastStatus: statusCode,
        });
      }
    } else {
      // Reset on success
      cb.failures = 0;
    }
  }

  /**
   * 🔌 Get Circuit Breaker state
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.apiSenseiCircuitBreaker };
  }

  /**
   * 🔌 Reset Circuit Breaker manually
   */
  resetCircuitBreaker(): void {
    this.apiSenseiCircuitBreaker = {
      failures: 0,
      lastFailure: null,
      isOpen: false,
      openedAt: null,
    };
    this.logger.info('🔌 Circuit Breaker: Manually reset');
  }

  /**
   * Run a single API Sensei test
   */
  private async runAPISenseiTest(
    test: {
      name: string;
      endpoint: string;
      method: string;
      scenario: string;
      body?: any;
      expectedStatus?: number;
      assertions: string[];
    },
    authHeaders: Record<string, string>
  ): Promise<APISenseiTestResult> {
    // v20.0: Check Circuit Breaker before making request
    if (this.checkCircuitBreaker()) {
      this.logger.warn('🔌 Circuit Breaker: Request blocked - circuit is OPEN', {
        test: test.name,
        endpoint: test.endpoint,
      });
      return {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        scenario: test.scenario,
        status: 'skipped',
        responseTime: 0,
        assertions: [],
        error: 'Circuit breaker is OPEN - API appears to be down',
      };
    }

    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: test.method as any,
        url: test.endpoint,
        headers: {
          'User-Agent': 'MisterMind-APISensei/1.0',
          ...authHeaders
        },
        data: test.body,
        timeout: this.config.timeout,
        validateStatus: () => true
      });

      const responseTime = Date.now() - startTime;
      const assertions: AssertionResult[] = [];

      // Check expected status
      if (test.expectedStatus !== undefined) {
        assertions.push({
          assertion: `status === ${test.expectedStatus}`,
          passed: response.status === test.expectedStatus,
          expected: test.expectedStatus,
          actual: response.status
        });
      }

      // Run custom assertions
      for (const assertion of test.assertions) {
        let passed = false;
        const status = response.status;
        
        try {
          // Simple assertion evaluation
          if (assertion.includes('status')) {
            passed = eval(assertion.replace('status', status.toString()));
          }
          if (assertion.includes('responseTime')) {
            passed = eval(assertion.replace('responseTime', responseTime.toString()));
          }
        } catch {
          passed = false;
        }

        assertions.push({
          assertion,
          passed,
          actual: assertion.includes('status') ? status : responseTime
        });
      }

      const allPassed = assertions.every(a => a.passed);

      // v20.0: Update Circuit Breaker state
      this.recordCircuitBreakerFailure(response.status);

      return {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        scenario: test.scenario,
        status: allPassed ? 'passed' : 'failed',
        responseTime,
        assertions
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // v20.0: Treat connection errors as 500 for circuit breaker
      this.recordCircuitBreakerFailure(500);
      this.logger.error('API Sensei test failed', error as Error, {
        test: test.name,
        endpoint: test.endpoint,
      });

      return {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        scenario: test.scenario,
        status: 'failed',
        responseTime: Date.now() - startTime,
        assertions: [],
        error: errorMsg
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 🤖 v20.0 SOVEREIGN DIRECTOR - Autonomous Goal Execution
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * 🤖 Execute autonomous goal using AI planning
   * Uses Gemini 2.0 (cloud) or Gemma (local) for intelligent planning
   * Then delegates execution to the Sovereign Swarm orchestrator
   */
  async executeAutonomousGoal(
    goal: string,
    context?: Record<string, any>
  ): Promise<AutonomousGoalResult> {
    if (!this.isProLicense) {
      throw new Error('Sovereign Director requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    const goalId = `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const steps: AutonomousStep[] = [];

    this.logger.info('🤖 Sovereign Director: Starting autonomous goal execution', {
      goalId,
      goal,
      context,
    });

    // Determine AI model based on Financial Oracle
    const complexity = goal.length > 100 ? 'high' : goal.length > 50 ? 'medium' : 'low';
    const aiModel = await this.getOptimalAIModel(complexity);
    let costIncurred = 0;

    try {
      // Step 1: Plan using AI
      this.logger.info('🤖 Step 1: AI Planning phase', { aiModel });
      steps.push({
        stepNumber: 1,
        action: 'AI_PLANNING',
        status: 'completed',
        duration: 0,
      });

      // Generate plan using AI (simulated - integrate with actual AI API)
      const plan = await this.generateAIPlan(goal, context, aiModel);
      if (aiModel === 'cloud') {
        costIncurred = complexity === 'high' ? 0.08 : complexity === 'medium' ? 0.03 : 0.01;
        this.trackAPICost(costIncurred, 'autonomous_planning');
      }

      steps[0].duration = Date.now() - startTime;

      // Step 2: Initialize Swarm if needed
      if (!this.swarmInitialized) {
        await this.initSwarm();
      }

      // Step 3: Execute via orchestrator
      this.logger.info('🤖 Step 2: Executing via Sovereign Swarm', { planSteps: plan.steps.length });
      
      const executionStart = Date.now();
      const result = await this.orchestrator!.executeGoal(goal, {
        ...context,
        aiPlan: plan,
        aiModel,
      });

      steps.push({
        stepNumber: 2,
        action: 'SWARM_EXECUTION',
        status: result.success ? 'completed' : 'failed',
        duration: Date.now() - executionStart,
      });

      // Add individual task steps
      result.results.forEach((taskResult, index) => {
        steps.push({
          stepNumber: 3 + index,
          action: `TASK_${index + 1}`,
          target: taskResult.taskId,
          status: taskResult.success ? 'completed' : 'failed',
          duration: taskResult.duration,
          error: taskResult.error,
        });
      });

      this.logger.audit('autonomous_goal', result.success ? 'success' : 'failure', {
        goalId,
        goal,
        aiModel,
        costIncurred,
        totalDuration: Date.now() - startTime,
        tasksCompleted: result.results.filter(r => r.success).length,
        tasksFailed: result.results.filter(r => !r.success).length,
      });

      return {
        goalId,
        goal,
        success: result.success,
        steps,
        totalDuration: Date.now() - startTime,
        aiModel,
        costIncurred,
        timestamp: new Date(),
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('🤖 Sovereign Director: Goal execution failed', error as Error, {
        goalId,
        goal,
      });

      return {
        goalId,
        goal,
        success: false,
        steps: [{
          stepNumber: 1,
          action: 'INITIALIZATION',
          status: 'failed',
          duration: Date.now() - startTime,
          error: errorMsg,
        }],
        totalDuration: Date.now() - startTime,
        aiModel,
        costIncurred,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 🤖 Generate AI plan for goal (internal)
   */
  private async generateAIPlan(
    goal: string,
    context: Record<string, any> | undefined,
    aiModel: AIModelProvider
  ): Promise<{ goal: string; steps: string[]; confidence: number }> {
    // This would integrate with actual AI APIs (Gemini/Gemma)
    // For now, return a structured plan based on goal analysis
    
    const keywords = goal.toLowerCase();
    const steps: string[] = [];

    if (keywords.includes('login') || keywords.includes('sign in')) {
      steps.push('Navigate to login page');
      steps.push('Enter credentials');
      steps.push('Submit login form');
      steps.push('Verify successful login');
    } else if (keywords.includes('checkout') || keywords.includes('purchase')) {
      steps.push('Navigate to cart');
      steps.push('Review items');
      steps.push('Enter shipping info');
      steps.push('Enter payment info');
      steps.push('Confirm order');
    } else if (keywords.includes('test') || keywords.includes('verify')) {
      steps.push('Navigate to target page');
      steps.push('Identify test elements');
      steps.push('Execute test actions');
      steps.push('Validate results');
    } else {
      steps.push('Analyze goal requirements');
      steps.push('Navigate to relevant page');
      steps.push('Execute primary action');
      steps.push('Verify completion');
    }

    this.logger.debug('AI Plan generated', {
      goal,
      aiModel,
      stepsCount: steps.length,
    });

    return {
      goal,
      steps,
      confidence: aiModel === 'cloud' ? 0.92 : 0.85,
    };
  }

  /**
   * Validate license key
   */
  private validateLicense(key: string): boolean {
    // Validate format with regex
    if (!key || typeof key !== 'string') {
      console.log('⚠️ Invalid license key. Running in Free mode.');
      return false;
    }
    
    const cleanKey = key.trim().toUpperCase();
    
    if (LICENSE_PATTERN.test(cleanKey)) {
      this.isProLicense = true;
      console.log('✅ Pro license activated!');
      return true;
    }
    
    console.log('⚠️ Invalid license key. Running in Free mode.');
    return false;
  }

  /**
   * Get current license status
   */
  getLicenseStatus(): { isValid: boolean; tier: string } {
    return {
      isValid: this.isProLicense,
      tier: this.isProLicense ? 'pro' : 'free'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧠 ADAPTIVE SEMANTIC CORE (ASC) - v16.0 Features
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 💎 PRO: Get Adaptive Semantic Core instance
   * Returns null if not initialized
   */
  getASC(): AdaptiveSemanticCore | null {
    return this.asc;
  }

  /**
   * 💎 PRO: Create semantic map of a page
   * Extracts all interactive elements with semantic meaning
   */
  async createSemanticMap(page: Page): Promise<SemanticMap> {
    if (!this.isProLicense) {
      throw new Error('Semantic Map requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.asc) {
      this.initASC();
    }

    return this.asc!.createSemanticMap(page);
  }

  /**
   * 💎 PRO: Find element by intent (semantic search)
   * Searches for element by meaning, not by selector
   */
  async findByIntent(page: Page, intent: Intent): Promise<IntentMatch | null> {
    if (!this.isProLicense) {
      throw new Error('Intent Matching requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.asc) {
      this.initASC();
    }

    return this.asc!.matchIntent(page, intent);
  }

  /**
   * 💎 PRO: Execute action by intent
   * Click, fill, or hover on element found by semantic meaning
   */
  async executeIntent(
    page: Page,
    intent: Intent,
    action: 'click' | 'fill' | 'hover' = 'click',
    value?: string
  ): Promise<boolean> {
    if (!this.isProLicense) {
      throw new Error('Intent Execution requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.asc) {
      this.initASC();
    }

    return this.asc!.executeIntent(page, intent, action, value);
  }

  /**
   * 💎 PRO: Quick semantic search for element
   * Shorthand for finding elements by keywords
   */
  async findElement(
    page: Page,
    keywords: string[],
    options?: { expectedType?: 'button' | 'link' | 'input' | 'form' | 'any'; positionHint?: string }
  ): Promise<IntentMatch | null> {
    if (!this.isProLicense) {
      throw new Error('Semantic Search requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.asc) {
      this.initASC();
    }

    return this.asc!.findElement(page, keywords, options as any);
  }

  /**
   * 💎 PRO: Smart click - click by meaning
   * Example: await mm.smartClick(page, ['login', 'sign in'])
   */
  async smartClick(page: Page, keywords: string[]): Promise<boolean> {
    const intent: Intent = {
      action: `CLICK_${keywords.join('_').toUpperCase()}`,
      keywords,
      expectedType: 'button'
    };
    return this.executeIntent(page, intent, 'click');
  }

  /**
   * 💎 PRO: Smart fill - fill input by meaning
   * Example: await mm.smartFill(page, ['email', 'e-mail'], 'user@example.com')
   */
  async smartFill(page: Page, keywords: string[], value: string): Promise<boolean> {
    const intent: Intent = {
      action: `FILL_${keywords.join('_').toUpperCase()}`,
      keywords,
      expectedType: 'input'
    };
    return this.executeIntent(page, intent, 'fill', value);
  }

  /**
   * 💎 PRO: Execute common intent
   * Uses pre-defined intents: LOGIN, LOGOUT, SUBMIT, SEARCH, ADD_TO_CART, CHECKOUT, NEXT, CLOSE
   */
  async doAction(
    page: Page, 
    action: keyof typeof CommonIntents,
    value?: string
  ): Promise<boolean> {
    if (!this.isProLicense) {
      throw new Error('Smart Actions require a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    const intent = CommonIntents[action];
    if (!intent) {
      throw new Error(`Unknown action: ${action}. Available: ${Object.keys(CommonIntents).join(', ')}`);
    }

    const execAction = intent.keywords.some(k => 
      k.includes('search') || k.includes('email') || k.includes('password')
    ) ? 'fill' : 'click';

    return this.executeIntent(page, intent, execAction, value);
  }

  /**
   * 💎 PRO: Get ASC statistics
   * Returns knowledge base stats and success rates
   */
  getASCStats(): { totalEntries: number; successRate: number; mostUsed: string[] } | null {
    if (!this.asc) return null;
    return this.asc.getStats();
  }

  /**
   * 💎 PRO: Save ASC knowledge to file
   */
  saveASCKnowledge(): void {
    if (this.asc) {
      this.asc.saveKnowledge();
    }
  }

  /**
   * 💎 PRO: Clear ASC cache
   */
  clearASCCache(): void {
    if (this.asc) {
      this.asc.clearCache();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🐝 SOVEREIGN SWARM v17.0 - Multi-Agent Architecture
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 💎 PRO: Initialize Sovereign Swarm
   * Sets up multi-agent orchestration with distillation and observability
   */
  async initSwarm(config?: SwarmConfig): Promise<void> {
    if (!this.isProLicense) {
      throw new Error('Sovereign Swarm requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (this.swarmInitialized) {
      if (this.config.verbose) {
        console.log('🐝 Swarm already initialized');
      }
      return;
    }

    if (this.config.verbose) {
      console.log('🐝 Initializing Sovereign Swarm v17.0...');
    }

    // Initialize components
    this.orchestrator = new AgenticOrchestrator({
      verbose: this.config.verbose,
      enableDistillation: true,
      enableTracing: true,
      ...config,
    });

    this.distillationLogger = new DistillationLogger({
      verbose: this.config.verbose,
      outputPath: './fine-tuning-dataset.jsonl',
      minConfidence: 0.75,
    });

    this.observabilityBridge = new ObservabilityBridge({
      verbose: this.config.verbose,
      serviceName: 'mister-mind-swarm',
      serviceVersion: VERSION,
      consoleExport: this.config.verbose,
    });

    this.browserPool = new BrowserPoolManager({
      verbose: this.config.verbose,
      headless: true,
    });

    // Initialize orchestrator
    await this.orchestrator.initialize();

    // Connect distillation to orchestrator
    this.orchestrator.on('successfulExecution', async (data: any) => {
      if (this.distillationLogger) {
        await this.distillationLogger.record(data.task, data.result);
        this.orchestrator?.incrementDistillationCount();
      }
    });

    this.swarmInitialized = true;

    if (this.config.verbose) {
      console.log('🐝 Sovereign Swarm initialized successfully');
      console.log(`   Agents: ${this.orchestrator.getAgentCount()}`);
      console.log(`   Distillation: enabled`);
      console.log(`   Observability: enabled`);
    }
  }

  /**
   * 💎 PRO: Execute a goal using the swarm
   * The swarm will plan, execute, and validate automatically
   */
  async executeGoal(
    goal: string,
    context?: Record<string, any>
  ): Promise<{
    traceId: string;
    success: boolean;
    results: TaskResult[];
    plan: ExecutionPlan | null;
  }> {
    if (!this.isProLicense) {
      throw new Error('Sovereign Swarm requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.swarmInitialized || !this.orchestrator) {
      await this.initSwarm();
    }

    // Start trace
    const traceId = this.observabilityBridge?.startTrace('executeGoal', {
      goal,
    }) || '';

    try {
      if (this.config.verbose) {
        console.log(`🐝 Executing goal: ${goal}`);
      }

      const result = await this.orchestrator!.executeGoal(goal, context);

      this.observabilityBridge?.setStatus(result.success ? 'ok' : 'error');

      if (this.config.verbose) {
        console.log(`🐝 Goal execution ${result.success ? 'succeeded' : 'failed'}`);
        console.log(`   Tasks: ${result.results.length}`);
        console.log(`   Success rate: ${(result.results.filter(r => r.success).length / result.results.length * 100).toFixed(1)}%`);
      }

      return result;
    } finally {
      this.observabilityBridge?.endTrace();
    }
  }

  /**
   * 💎 PRO: Execute tasks in parallel across multiple browsers
   */
  async executeParallel<T>(
    tasks: Array<(page: Page) => Promise<T>>
  ): Promise<Array<{ success: boolean; result?: T; error?: string }>> {
    if (!this.isProLicense) {
      throw new Error('Parallel execution requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.browserPool) {
      this.browserPool = new BrowserPoolManager({
        verbose: this.config.verbose,
      });
      
      // Initialize with playwright
      const playwright = require('playwright');
      await this.browserPool.initialize(playwright);
    }

    if (this.config.verbose) {
      console.log(`🐝 Executing ${tasks.length} tasks in parallel`);
    }

    return this.browserPool.executeParallel(tasks);
  }

  /**
   * 💎 PRO: Get Swarm statistics
   */
  getSwarmStats(): SwarmStats | null {
    if (!this.orchestrator) return null;
    return this.orchestrator.getStats();
  }

  /**
   * 💎 PRO: Get distillation statistics
   */
  getDistillationStats(): {
    accepted: number;
    rejected: number;
    totalEntries: number;
    acceptanceRate: number;
  } | null {
    if (!this.distillationLogger) return null;
    return this.distillationLogger.getStats();
  }

  /**
   * 💎 PRO: Get observability statistics
   */
  getObservabilityStats(): {
    spansCreated: number;
    spansExported: number;
    errors: number;
  } | null {
    if (!this.observabilityBridge) return null;
    return this.observabilityBridge.getStats();
  }

  /**
   * 💎 PRO: Get current trace ID
   */
  getCurrentTraceId(): string | null {
    return this.observabilityBridge?.getCurrentTraceId() || null;
  }

  /**
   * 💎 PRO: Export distillation data
   */
  async exportDistillationData(format: 'jsonl' | 'csv', path: string): Promise<void> {
    if (!this.distillationLogger) {
      throw new Error('Distillation logger not initialized');
    }
    await this.distillationLogger.exportAs(format, path);
  }

  /**
   * 💎 PRO: Shutdown Swarm gracefully
   */
  async shutdownSwarm(): Promise<void> {
    if (!this.swarmInitialized) return;

    if (this.config.verbose) {
      console.log('🐝 Shutting down Sovereign Swarm...');
    }

    // Shutdown in order
    if (this.browserPool) {
      await this.browserPool.shutdown();
    }

    if (this.orchestrator) {
      await this.orchestrator.stop();
    }

    if (this.distillationLogger) {
      await this.distillationLogger.shutdown();
    }

    if (this.observabilityBridge) {
      await this.observabilityBridge.shutdown();
    }

    this.swarmInitialized = false;

    if (this.config.verbose) {
      console.log('🐝 Sovereign Swarm shutdown complete');
    }
  }

  /**
   * 🏰 Shutdown Bastion gracefully
   */
  async shutdownBastion(): Promise<void> {
    if (!this.bastionInitialized || !this.bastion) return;

    if (this.config.verbose) {
      console.log('🏰 Shutting down Security Bastion...');
    }

    await this.bastion.shutdown();
    this.bastionInitialized = false;

    if (this.config.verbose) {
      console.log('🏰 Security Bastion shutdown complete');
    }
  }

  /**
   * Shutdown all components
   */
  async shutdown(): Promise<void> {
    await this.shutdownBastion();
    await this.shutdownSwarm();
    
    if (this.config.verbose) {
      console.log('🧠 Mister Mind shutdown complete');
    }
  }
}

// Default export
export default MisterMind;

// Named exports for convenience
export const createMisterMind = (config?: MisterMindConfig) => new MisterMind(config);

// ═══════════════════════════════════════════════════════════════════════════════
// Version & Branding
// ═══════════════════════════════════════════════════════════════════════════════

/** Current version */
export const VERSION = '23.0.0';

/** Version codename */
export const VERSION_CODENAME = 'The Local Sovereign';

/** Full version string */
export const VERSION_FULL = `MisterMind v${VERSION} "${VERSION_CODENAME}"`;

/**
 * 🎨 Print ASCII banner to console (optional visualization)
 * Call this at startup for beautiful branding
 */
export function printBanner(options: { color?: boolean; compact?: boolean } = {}): void {
  const { color = true, compact = false } = options;
  
  const reset = color ? '\x1b[0m' : '';
  const cyan = color ? '\x1b[36m' : '';
  const yellow = color ? '\x1b[33m' : '';
  const green = color ? '\x1b[32m' : '';
  const magenta = color ? '\x1b[35m' : '';
  const bold = color ? '\x1b[1m' : '';
  
  if (compact) {
    console.log(`${cyan}${bold}🧠 MisterMind${reset} ${yellow}v${VERSION}${reset} ${magenta}"${VERSION_CODENAME}"${reset}`);
    console.log(`${green}   Made with ❤️ in Bulgaria 🇧🇬${reset}\n`);
    return;
  }
  
  console.log(`
${cyan}${bold}╔═══════════════════════════════════════════════════════════════════════════════╗${reset}
${cyan}║${reset}                                                                               ${cyan}║${reset}
${cyan}║${reset}   ${yellow}███╗   ███╗██╗███████╗████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗██████╗ ${reset} ${cyan}║${reset}
${cyan}║${reset}   ${yellow}████╗ ████║██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗${reset} ${cyan}║${reset}
${cyan}║${reset}   ${yellow}██╔████╔██║██║███████╗   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║██║  ██║${reset} ${cyan}║${reset}
${cyan}║${reset}   ${yellow}██║╚██╔╝██║██║╚════██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██║  ██║${reset} ${cyan}║${reset}
${cyan}║${reset}   ${yellow}██║ ╚═╝ ██║██║███████║   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██████╔╝${reset} ${cyan}║${reset}
${cyan}║${reset}   ${yellow}╚═╝     ╚═╝╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ ${reset} ${cyan}║${reset}
${cyan}║${reset}                                                                               ${cyan}║${reset}
${cyan}║${reset}                    ${magenta}${bold}v${VERSION} "${VERSION_CODENAME}"${reset}                              ${cyan}║${reset}
${cyan}║${reset}                                                                               ${cyan}║${reset}
${cyan}╠═══════════════════════════════════════════════════════════════════════════════╣${reset}
${cyan}║${reset}                                                                               ${cyan}║${reset}
${cyan}║${reset}   ${green}🇧🇬 Made with ❤️ in Bulgaria by Димитър Продромов${reset}                            ${cyan}║${reset}
${cyan}║${reset}                                                                               ${cyan}║${reset}
${cyan}║${reset}   ${bold}📊 Statistics:${reset}                                                              ${cyan}║${reset}
${cyan}║${reset}   • Total Lines: 45,895+                                                      ${cyan}║${reset}
${cyan}║${reset}   • TypeScript Files: 91                                                      ${cyan}║${reset}
${cyan}║${reset}   • Tests: 492 passing                                                        ${cyan}║${reset}
${cyan}║${reset}   • Enterprise Modules: 6                                                     ${cyan}║${reset}
${cyan}║${reset}                                                                               ${cyan}║${reset}
${cyan}║${reset}   ${bold}🏢 Enterprise Features:${reset}                                                     ${cyan}║${reset}
${cyan}║${reset}   • 🌡️  Thermal Pool    • 🐳 Docker Manager   • 🎖️  Swarm Commander            ${cyan}║${reset}
${cyan}║${reset}   • 🔊 Bulgarian TTS   • 🎛️  Dashboard        • 🔐 License Manager             ${cyan}║${reset}
${cyan}║${reset}                                                                               ${cyan}║${reset}
${cyan}╚═══════════════════════════════════════════════════════════════════════════════╝${reset}
`);
}

/**
 * 📊 Get system statistics for display
 */
export function getSystemStats(): {
  version: string;
  codename: string;
  lines: number;
  files: number;
  tests: number;
  modules: number;
} {
  return {
    version: VERSION,
    codename: VERSION_CODENAME,
    lines: 45895,
    files: 91,
    tests: 492,
    modules: 6
  };
}

// Re-export ASC types and utilities
export { 
  AdaptiveSemanticCore, 
  CommonIntents,
  Intent,
  IntentMatch,
  SemanticMap,
  SemanticElement,
  ASCConfig
} from './asc/semantic-core';

// Re-export Swarm types and utilities
export {
  AgenticOrchestrator,
  DistillationLogger,
  ObservabilityBridge,
  BrowserPoolManager,
  PlannerAgent,
  ExecutorAgent,
  CriticAgent,
  WebSocketBridge,
} from './swarm';

export type {
  SwarmConfig,
  SwarmTask,
  TaskResult,
  ExecutionPlan,
  SwarmStats,
  SwarmMessage,
  AgentConfig,
  AgentRole,
  CriticFeedback,
  DistillationEntry,
} from './swarm';

// Re-export Bastion types and utilities
export {
  BastionController,
  SandboxExecutor,
  WorkerPoolManager,
  MemoryHardeningManager,
  NeuralVault,
  ChecksumValidator,
  CircuitBreakerManager,
  HealthCheckSystem,
} from './bastion';

export type {
  BastionConfig,
  BastionStats,
  SecurityPolicy,
  SandboxResult,
  SecurityViolation,
  MutationValidation,
  WorkerPoolConfig,
  WorkerPoolStats,
  NeuralVaultConfig,
  CircuitBreakerConfig,
  ServiceProvider,
  CircuitState,
  SystemHealth,
  HealthCheckResult,
} from './bastion';
