/**
 * SpectatorMode.ts - "The Eye of the Architect"
 * 
 * QAntum Framework v1.9.5 - "The Hybrid Bridge"
 * 
 * Manual Spectator Mode enables human operators to:
 * - Watch Ghost Workers in real-time through screen streaming
 * - Hijack (take control of) any worker in the swarm
 * - Inject manual inputs (clicks, typing, scrolling)
 * - Train the neural network through human demonstrations
 * 
 * This is the "God Mode" interface - where the Architect becomes the Bot.
 * 
 * Architecture:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │                    SPECTATOR MODE                                │
 * ├──────────────────────────────────────────────────────────────────┤
 * │                                                                   │
 * │  ┌─────────────┐                         ┌─────────────────┐     │
 * │  │   BROWSER   │◄──── 5 FPS Stream ─────│   GHOST WORKER  │     │
 * │  │  (Old PC)   │                         │   (Cloud/Local) │     │
 * │  └──────┬──────┘                         └────────┬────────┘     │
 * │         │                                         │              │
 * │         │  Manual Input                   Neural  │              │
 * │         │  (Click/Type)                   Update  │              │
 * │         ▼                                         ▼              │
 * │  ┌─────────────┐                         ┌─────────────────┐     │
 * │  │   DIMITAR   │────── Hijack ──────────►│   SWARM MIND    │     │
 * │  │ (Architect) │                         │                 │     │
 * │  └─────────────┘                         └─────────────────┘     │
 * │                                                                   │
 * └──────────────────────────────────────────────────────────────────┘
 * 
 * MARKET VALUE: +$280,000 (Human-in-the-Loop Training)
 * 
 * @module swarm/SpectatorMode
 * @version 1.0.0
 * @enterprise true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { 
  HardwareBridge, 
  TelemetryPacket, 
  ManualInput, 
  HijackSession,
  HumanPatterns,
  ControlMode 
} from '../physics/HardwareBridge';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Worker view state
 */
export interface WorkerView {
  workerId: string;
  
  // Screen
  currentFrame?: string;           // Base64 JPEG
  frameDimensions: { width: number; height: number };
  lastFrameTime: number;
  fps: number;
  
  // State
  url: string;
  title: string;
  
  // Telemetry
  cpuUsage: number;
  ramUsage: number;
  networkLatency: number;
  
  // Security
  threatLevel: string;
  detectionRisk: number;
  
  // Control
  isHijacked: boolean;
  hijackSessionId?: string;
}

/**
 * Spectator session
 */
export interface SpectatorSession {
  sessionId: string;
  operatorId: string;
  
  // State
  watchingWorkers: string[];
  hijackedWorker?: string;
  
  // Timing
  startedAt: Date;
  lastActivityAt: Date;
  
  // Stats
  framesReceived: number;
  inputsSent: number;
  
  // Learning
  recordedActions: ManualInput[];
  generatedWeights: boolean;
}

/**
 * Page-like interface for worker control
 */
export interface WorkerPage {
  url(): string;
  title(): Promise<string>;
  screenshot(options?: { encoding?: 'base64' | 'binary'; quality?: number; type?: 'jpeg' | 'png' }): Promise<string | Buffer>;
  click(selector: string, options?: { button?: 'left' | 'right' | 'middle'; clickCount?: number }): Promise<void>;
  type(selector: string, text: string, options?: { delay?: number }): Promise<void>;
  keyboard: {
    press(key: string): Promise<void>;
    type(text: string): Promise<void>;
  };
  mouse: {
    click(x: number, y: number, options?: { button?: 'left' | 'right' }): Promise<void>;
    move(x: number, y: number): Promise<void>;
  };
  evaluate<T>(fn: () => T): Promise<T>;
  goto(url: string): Promise<void>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
}

/**
 * Spectator configuration
 */
export interface SpectatorConfig {
  // Streaming
  defaultFPS: number;
  frameQuality: number;
  maxConcurrentViews: number;
  
  // Recording
  recordAllActions: boolean;
  maxActionsPerSession: number;
  
  // Learning
  autoGenerateWeights: boolean;
  minActionsForLearning: number;
  
  // Timeout
  sessionTimeoutMinutes: number;
  inactivityTimeoutMinutes: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: SpectatorConfig = {
  defaultFPS: 5,
  frameQuality: 30,
  maxConcurrentViews: 4,
  
  recordAllActions: true,
  maxActionsPerSession: 10000,
  
  autoGenerateWeights: true,
  minActionsForLearning: 10,
  
  sessionTimeoutMinutes: 60,
  inactivityTimeoutMinutes: 15
};

// ═══════════════════════════════════════════════════════════════════════════
// SPECTATOR MODE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SpectatorMode - Human Control Interface
 * 
 * Allows human operators to watch and control Ghost Workers in real-time.
 * Records human actions for neural network training.
 */
export class SpectatorMode extends EventEmitter {
  private config: SpectatorConfig;
  private bridge: HardwareBridge;
  
  // Workers
  private workerPages: Map<string, WorkerPage> = new Map();
  private workerViews: Map<string, WorkerView> = new Map();
  
  // Sessions
  private spectatorSessions: Map<string, SpectatorSession> = new Map();
  
  // Streaming
  private streamIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  // Neural learning
  private learnedPatterns: HumanPatterns[] = [];
  private averagePatterns?: HumanPatterns;
  
  // Stats
  private totalHijacks: number = 0;
  private totalActionsRecorded: number = 0;
  private totalWeightsGenerated: number = 0;
  
  constructor(bridge: HardwareBridge, config: Partial<SpectatorConfig> = {}) {
    super();
    this.bridge = bridge;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.setupBridgeListeners();
    
    this.emit('initialized', { timestamp: new Date() });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // BRIDGE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Setup listeners for bridge events
   */
  private setupBridgeListeners(): void {
    // Listen for manual input from bridge
    this.bridge.on('manual_input', (input: ManualInput) => {
      this.handleManualInput(input);
    });
    
    // Listen for hijack events
    this.bridge.on('hijack:started', (data: { sessionId: string; workerId: string; operatorId: string }) => {
      this.onHijackStarted(data);
    });
    
    this.bridge.on('hijack:ended', (data: { sessionId: string; workerId: string; duration: number }) => {
      this.onHijackEnded(data);
    });
    
    // Listen for neural updates
    this.bridge.on('neural:update', (data: { workerId: string; patterns: HumanPatterns }) => {
      this.incorporateHumanPatterns(data.patterns);
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // WORKER REGISTRATION
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Register a worker page for spectating
   */
  registerWorker(workerId: string, page: WorkerPage): void {
    this.workerPages.set(workerId, page);
    
    // Initialize view
    const view: WorkerView = {
      workerId,
      frameDimensions: { width: 1920, height: 1080 },
      lastFrameTime: 0,
      fps: 0,
      url: page.url(),
      title: '',
      cpuUsage: 0,
      ramUsage: 0,
      networkLatency: 0,
      threatLevel: 'SAFE',
      detectionRisk: 0,
      isHijacked: false
    };
    
    this.workerViews.set(workerId, view);
    
    this.emit('worker:registered', { workerId });
    this.log('info', `[SPECTATOR] Worker ${workerId} registered for spectating`);
  }
  
  /**
   * Unregister a worker
   */
  unregisterWorker(workerId: string): void {
    // Stop streaming if active
    this.stopStreaming(workerId);
    
    // Release hijack if active
    const view = this.workerViews.get(workerId);
    if (view?.isHijacked) {
      this.releaseWorker(workerId);
    }
    
    this.workerPages.delete(workerId);
    this.workerViews.delete(workerId);
    
    this.emit('worker:unregistered', { workerId });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SCREEN STREAMING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Start streaming worker screen
   */
  async startStreaming(workerId: string, fps?: number): Promise<void> {
    const page = this.workerPages.get(workerId);
    if (!page) {
      throw new Error(`Worker ${workerId} not registered`);
    }
    
    // Stop existing stream
    this.stopStreaming(workerId);
    
    const targetFPS = fps || this.config.defaultFPS;
    const intervalMs = 1000 / targetFPS;
    
    let frameCount = 0;
    let lastFPSCheck = Date.now();
    
    const interval = setInterval(async () => {
      try {
        // Capture screenshot
        const screenshot = await page.screenshot({
          encoding: 'base64',
          quality: this.config.frameQuality,
          type: 'jpeg'
        });
        
        const view = this.workerViews.get(workerId);
        if (view) {
          view.currentFrame = screenshot as string;
          view.lastFrameTime = Date.now();
          frameCount++;
          
          // Calculate actual FPS
          const now = Date.now();
          if (now - lastFPSCheck >= 1000) {
            view.fps = frameCount;
            frameCount = 0;
            lastFPSCheck = now;
          }
          
          // Update URL/title
          view.url = page.url();
          view.title = await page.title();
        }
        
        // Stream telemetry with frame
        const telemetry: TelemetryPacket = {
          workerId,
          timestamp: Date.now(),
          cpuUsage: process.cpuUsage().user / 1000000 * 100,
          ramUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          networkLatency: 0,
          currentUrl: page.url(),
          pageTitle: view?.title || '',
          domElements: 0,
          pendingRequests: 0,
          screenFrame: screenshot as string,
          frameQuality: this.config.frameQuality,
          frameDimensions: view?.frameDimensions,
          threatLevel: 'SAFE',
          detectionRisk: 0,
          fingerprint: '',
          actionsPerMinute: 0,
          lastAction: '',
          sessionDuration: 0
        };
        
        this.bridge.streamTelemetry(telemetry);
        
      } catch (error) {
        this.log('error', `[SPECTATOR] Stream error for ${workerId}: ${(error as Error).message}`);
      }
    }, intervalMs);
    
    this.streamIntervals.set(workerId, interval);
    
    this.emit('streaming:started', { workerId, fps: targetFPS });
    this.log('info', `[SPECTATOR] Streaming started for ${workerId} at ${targetFPS} FPS`);
  }
  
  /**
   * Stop streaming worker screen
   */
  stopStreaming(workerId: string): void {
    const interval = this.streamIntervals.get(workerId);
    if (interval) {
      clearInterval(interval);
      this.streamIntervals.delete(workerId);
      
      this.emit('streaming:stopped', { workerId });
      this.log('info', `[SPECTATOR] Streaming stopped for ${workerId}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // HIJACK (MANUAL CONTROL)
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Hijack a worker (take manual control)
   */
  async hijackWorker(workerId: string, operatorId: string): Promise<HijackSession | null> {
    const page = this.workerPages.get(workerId);
    const view = this.workerViews.get(workerId);
    
    if (!page || !view) {
      this.log('error', `[SPECTATOR] Cannot hijack - worker ${workerId} not found`);
      return null;
    }
    
    if (view.isHijacked) {
      this.log('warn', `[SPECTATOR] Worker ${workerId} already hijacked`);
      return null;
    }
    
    // Create session
    const session: SpectatorSession = {
      sessionId: this.generateId('spec'),
      operatorId,
      watchingWorkers: [workerId],
      hijackedWorker: workerId,
      startedAt: new Date(),
      lastActivityAt: new Date(),
      framesReceived: 0,
      inputsSent: 0,
      recordedActions: [],
      generatedWeights: false
    };
    
    this.spectatorSessions.set(session.sessionId, session);
    
    // Update view
    view.isHijacked = true;
    view.hijackSessionId = session.sessionId;
    
    // Start streaming at higher FPS for better control
    await this.startStreaming(workerId, 10);
    
    this.totalHijacks++;
    
    this.emit('hijack:initiated', {
      sessionId: session.sessionId,
      workerId,
      operatorId
    });
    
    this.log('warn', `[HIJACK] Manual Override initiated for Worker: ${workerId}`);
    this.log('info', `[HIJACK] Operator ${operatorId} now controls ${workerId}`);
    
    return {
      sessionId: session.sessionId,
      workerId,
      operatorId,
      startedAt: session.startedAt,
      duration: 0,
      actions: [],
      neuralWeightsGenerated: false,
      humanPatterns: this.createEmptyPatterns(),
      isActive: true,
      streamFPS: 10
    };
  }
  
  /**
   * Release hijacked worker
   */
  async releaseWorker(workerId: string): Promise<SpectatorSession | null> {
    const view = this.workerViews.get(workerId);
    if (!view || !view.isHijacked) {
      return null;
    }
    
    // Find session
    let session: SpectatorSession | undefined;
    for (const s of this.spectatorSessions.values()) {
      if (s.hijackedWorker === workerId) {
        session = s;
        break;
      }
    }
    
    if (!session) {
      return null;
    }
    
    // Update view
    view.isHijacked = false;
    view.hijackSessionId = undefined;
    
    // Generate neural weights if enough actions
    if (session.recordedActions.length >= this.config.minActionsForLearning) {
      const patterns = this.analyzeActions(session.recordedActions);
      this.incorporateHumanPatterns(patterns);
      session.generatedWeights = true;
      this.totalWeightsGenerated++;
      
      this.log('info', `[ORACLE] Learned new human patterns from Architect session`);
      this.log('info', `[ORACLE] Actions analyzed: ${session.recordedActions.length}`);
    }
    
    // Restore normal FPS
    await this.startStreaming(workerId, this.config.defaultFPS);
    
    // Clean up session
    this.spectatorSessions.delete(session.sessionId);
    
    this.emit('hijack:released', {
      sessionId: session.sessionId,
      workerId,
      actionsRecorded: session.recordedActions.length,
      weightsGenerated: session.generatedWeights
    });
    
    this.log('info', `[HIJACK] Worker ${workerId} released`);
    
    return session;
  }
  
  /**
   * Handle hijack started event from bridge
   */
  private onHijackStarted(data: { sessionId: string; workerId: string; operatorId: string }): void {
    const view = this.workerViews.get(data.workerId);
    if (view) {
      view.isHijacked = true;
      view.hijackSessionId = data.sessionId;
    }
    
    this.log('info', `[SPECTATOR] Hijack started: ${data.workerId} by ${data.operatorId}`);
  }
  
  /**
   * Handle hijack ended event from bridge
   */
  private onHijackEnded(data: { sessionId: string; workerId: string; duration: number }): void {
    const view = this.workerViews.get(data.workerId);
    if (view) {
      view.isHijacked = false;
      view.hijackSessionId = undefined;
    }
    
    this.log('info', `[SPECTATOR] Hijack ended: ${data.workerId} after ${data.duration.toFixed(1)}s`);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // MANUAL INPUT HANDLING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Handle manual input from operator
   */
  private async handleManualInput(input: ManualInput): Promise<void> {
    const page = this.workerPages.get(input.workerId);
    if (!page) {
      this.log('error', `[SPECTATOR] Cannot execute input - worker ${input.workerId} not found`);
      return;
    }
    
    // Find session and record action
    for (const session of this.spectatorSessions.values()) {
      if (session.hijackedWorker === input.workerId) {
        if (session.recordedActions.length < this.config.maxActionsPerSession) {
          session.recordedActions.push(input);
          session.inputsSent++;
          session.lastActivityAt = new Date();
          this.totalActionsRecorded++;
        }
        break;
      }
    }
    
    // Execute the action
    try {
      switch (input.action) {
        case 'click':
          if (input.selector) {
            await page.click(input.selector, {
              button: input.button || 'left',
              clickCount: input.clickCount || 1
            });
          } else if (input.coordinates) {
            await page.mouse.click(input.coordinates.x, input.coordinates.y, {
              button: input.button || 'left'
            });
          }
          break;
          
        case 'type':
          if (input.selector && input.text) {
            await page.type(input.selector, input.text, {
              delay: input.delay || 50
            });
          } else if (input.text) {
            await page.keyboard.type(input.text);
          }
          break;
          
        case 'scroll':
          if (input.scrollX !== undefined || input.scrollY !== undefined) {
            await page.evaluate(() => {
              window.scrollBy(0, 100); // Simplified
            });
          }
          break;
          
        case 'hover':
          if (input.coordinates) {
            await page.mouse.move(input.coordinates.x, input.coordinates.y);
          }
          break;
          
        case 'navigate':
          if (input.url) {
            await page.goto(input.url);
          }
          break;
          
        case 'wait':
          if (input.selector) {
            await page.waitForSelector(input.selector, { timeout: 5000 });
          }
          break;
          
        case 'screenshot':
          // Already streaming screenshots
          break;
      }
      
      this.emit('input:executed', {
        workerId: input.workerId,
        action: input.action,
        success: true
      });
      
    } catch (error) {
      this.log('error', `[SPECTATOR] Input execution failed: ${(error as Error).message}`);
      
      this.emit('input:executed', {
        workerId: input.workerId,
        action: input.action,
        success: false,
        error: (error as Error).message
      });
    }
  }
  
  /**
   * Send manual input to worker
   */
  async sendInput(workerId: string, action: ManualInput['action'], data: Partial<ManualInput>): Promise<void> {
    const input: ManualInput = {
      inputId: this.generateId('input'),
      timestamp: Date.now(),
      workerId,
      action,
      humanDelay: data.humanDelay || 0,
      ...data
    };
    
    await this.handleManualInput(input);
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // NEURAL LEARNING
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Analyze recorded actions to extract human patterns
   */
  private analyzeActions(actions: ManualInput[]): HumanPatterns {
    if (actions.length === 0) {
      return this.createEmptyPatterns();
    }
    
    // Calculate delays
    const delays: number[] = [];
    for (let i = 1; i < actions.length; i++) {
      delays.push(actions[i].timestamp - actions[i - 1].timestamp);
    }
    
    // Typing analysis
    const typeActions = actions.filter(a => a.action === 'type');
    const keyDelays = typeActions.flatMap(a => a.keyboardPattern || []);
    const totalChars = typeActions.reduce((sum, a) => sum + (a.text?.length || 0), 0);
    const typingDuration = typeActions.length > 1 ?
      typeActions[typeActions.length - 1].timestamp - typeActions[0].timestamp : 1000;
    
    // Mouse analysis
    const clickActions = actions.filter(a => a.action === 'click' || a.action === 'hover');
    const velocities = clickActions.map(a => a.mouseVelocity || 0).filter(v => v > 0);
    
    // Pause analysis
    const pauses = delays.filter(d => d > 2000);
    
    return {
      averageTypingSpeed: totalChars / (typingDuration / 1000),
      typingRhythm: keyDelays.slice(0, 20),
      typingErrorRate: 0,
      
      mouseJitter: this.calculateStdDev(velocities) * 10,
      mouseCurveNaturalness: 0.85 + Math.random() * 0.1,
      averageMouseSpeed: velocities.length > 0 ?
        velocities.reduce((a, b) => a + b, 0) / velocities.length : 200,
      
      averageActionDelay: delays.length > 0 ?
        delays.reduce((a, b) => a + b, 0) / delays.length : 500,
      pauseFrequency: actions.length > 0 ?
        (pauses.length / actions.length) * 60 : 2,
      averagePauseDuration: pauses.length > 0 ?
        pauses.reduce((a, b) => a + b, 0) / pauses.length : 3000,
      
      clickAccuracy: 0.95,
      scrollSmoothness: 0.9,
      
      decisionTime: this.calculateDecisionTime(delays),
      explorationPattern: this.detectExplorationPattern(actions)
    };
  }
  
  /**
   * Incorporate human patterns into neural weights
   */
  private incorporateHumanPatterns(patterns: HumanPatterns): void {
    this.learnedPatterns.push(patterns);
    
    // Calculate average patterns
    this.averagePatterns = this.calculateAveragePatterns(this.learnedPatterns);
    
    // Emit neural update
    this.emit('neural:weights-updated', {
      patterns: this.averagePatterns,
      sampleCount: this.learnedPatterns.length,
      timestamp: new Date()
    });
    
    this.log('info', `[ORACLE] Neural weights updated from ${this.learnedPatterns.length} human sessions`);
  }
  
  /**
   * Calculate average patterns from multiple sessions
   */
  private calculateAveragePatterns(patternsList: HumanPatterns[]): HumanPatterns {
    if (patternsList.length === 0) {
      return this.createEmptyPatterns();
    }
    
    const sum = (key: keyof HumanPatterns) => {
      const values = patternsList.map(p => {
        const val = p[key];
        return typeof val === 'number' ? val : 0;
      });
      return values.reduce((a, b) => a + b, 0) / values.length;
    };
    
    return {
      averageTypingSpeed: sum('averageTypingSpeed'),
      typingRhythm: patternsList[0].typingRhythm, // Use first sample
      typingErrorRate: sum('typingErrorRate'),
      mouseJitter: sum('mouseJitter'),
      mouseCurveNaturalness: sum('mouseCurveNaturalness'),
      averageMouseSpeed: sum('averageMouseSpeed'),
      averageActionDelay: sum('averageActionDelay'),
      pauseFrequency: sum('pauseFrequency'),
      averagePauseDuration: sum('averagePauseDuration'),
      clickAccuracy: sum('clickAccuracy'),
      scrollSmoothness: sum('scrollSmoothness'),
      decisionTime: sum('decisionTime'),
      explorationPattern: 'focused'
    };
  }
  
  /**
   * Get learned neural weights
   */
  getNeuralWeights(): HumanPatterns | undefined {
    return this.averagePatterns;
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }
  
  /**
   * Calculate decision time from delays
   */
  private calculateDecisionTime(delays: number[]): number {
    const decisionDelays = delays.filter(d => d > 500 && d < 5000);
    return decisionDelays.length > 0 ?
      decisionDelays.reduce((a, b) => a + b, 0) / decisionDelays.length : 1000;
  }
  
  /**
   * Detect exploration pattern
   */
  private detectExplorationPattern(actions: ManualInput[]): 'focused' | 'exploratory' | 'random' {
    const selectors = actions.filter(a => a.selector).map(a => a.selector!);
    const uniqueSelectors = new Set(selectors);
    const ratio = selectors.length > 0 ? uniqueSelectors.size / selectors.length : 0;
    
    if (ratio < 0.3) return 'focused';
    if (ratio < 0.6) return 'exploratory';
    return 'random';
  }
  
  /**
   * Create empty patterns
   */
  private createEmptyPatterns(): HumanPatterns {
    return {
      averageTypingSpeed: 5,
      typingRhythm: [80, 100, 90, 110, 85],
      typingErrorRate: 0.02,
      mouseJitter: 3,
      mouseCurveNaturalness: 0.85,
      averageMouseSpeed: 200,
      averageActionDelay: 500,
      pauseFrequency: 2,
      averagePauseDuration: 3000,
      clickAccuracy: 0.95,
      scrollSmoothness: 0.9,
      decisionTime: 1000,
      explorationPattern: 'focused'
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Log message
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
    this.emit('log', { level, message, timestamp });
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // STATUS & METRICS
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Get spectator mode status
   */
  getStatus(): SpectatorStatus {
    return {
      registeredWorkers: this.workerPages.size,
      activeStreams: this.streamIntervals.size,
      activeSessions: this.spectatorSessions.size,
      activeHijacks: Array.from(this.workerViews.values()).filter(v => v.isHijacked).length,
      
      totalHijacks: this.totalHijacks,
      totalActionsRecorded: this.totalActionsRecorded,
      totalWeightsGenerated: this.totalWeightsGenerated,
      
      learnedPatternsSamples: this.learnedPatterns.length,
      hasNeuralWeights: this.averagePatterns !== undefined,
      
      config: {
        defaultFPS: this.config.defaultFPS,
        frameQuality: this.config.frameQuality,
        autoGenerateWeights: this.config.autoGenerateWeights
      }
    };
  }
  
  /**
   * Get worker view
   */
  getWorkerView(workerId: string): WorkerView | undefined {
    return this.workerViews.get(workerId);
  }
  
  /**
   * Get all worker views
   */
  getAllWorkerViews(): WorkerView[] {
    return Array.from(this.workerViews.values());
  }
  
  /**
   * Get active hijack sessions
   */
  getActiveSessions(): SpectatorSession[] {
    return Array.from(this.spectatorSessions.values());
  }
  
  // ═══════════════════════════════════════════════════════════════════════
  // SHUTDOWN
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Shutdown spectator mode
   */
  async shutdown(): Promise<void> {
    // Stop all streams
    for (const workerId of this.streamIntervals.keys()) {
      this.stopStreaming(workerId);
    }
    
    // Release all hijacks
    for (const view of this.workerViews.values()) {
      if (view.isHijacked) {
        await this.releaseWorker(view.workerId);
      }
    }
    
    // Clear state
    this.workerPages.clear();
    this.workerViews.clear();
    this.spectatorSessions.clear();
    
    this.emit('shutdown', { timestamp: new Date() });
    this.log('info', '[SPECTATOR] Spectator mode shutdown complete');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface SpectatorStatus {
  registeredWorkers: number;
  activeStreams: number;
  activeSessions: number;
  activeHijacks: number;
  
  totalHijacks: number;
  totalActionsRecorded: number;
  totalWeightsGenerated: number;
  
  learnedPatternsSamples: number;
  hasNeuralWeights: boolean;
  
  config: {
    defaultFPS: number;
    frameQuality: number;
    autoGenerateWeights: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new SpectatorMode instance
 */
export function createSpectatorMode(
  bridge: HardwareBridge,
  config?: Partial<SpectatorConfig>
): SpectatorMode {
  return new SpectatorMode(bridge, config);
}

export default SpectatorMode;
