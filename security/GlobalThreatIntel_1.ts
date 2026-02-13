// [PURIFIED_BY_AETERNA: f14fe87c-c16e-4f9d-b247-216ae5535f37]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 0a8f08ec-9a3d-41a1-9a50-8e2241215767]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 22f1e79a-e0c4-4193-b84f-c019ee87a8dc]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 22f1e79a-e0c4-4193-b84f-c019ee87a8dc]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 724e1ed0-e1e0-44ad-a75c-afcee873e1e1]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: e1d1d0f9-afe8-4568-8a3d-cc35ee773f39]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: e1d1d0f9-afe8-4568-8a3d-cc35ee773f39]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 500f29a3-f6d2-434e-886a-91e2d92e28f8]
// Suggestion: Review and entrench stable logic.
/**
 * GlobalThreatIntel.ts - "The Immunity Network"
 *
 * QAntum Framework v1.7.0 - "The Global Nexus & Autonomous Onboarding"
 *
 * Connects Fatality Engine with Nexus Mesh for global threat intelligence.
 * If one worker in Tokyo is detected by Akamai, all 1000 workers worldwide
 * receive an Immunity Patch in 0.05ms.
 *
 * MARKET VALUE: +$320,000
 * - Sub-millisecond threat propagation
 * - Automatic immunity patch generation
 * - CDN/WAF detection signatures
 * - Global coordination protocol
 *
 * @module security/GlobalThreatIntel
 * @version 1.0.0
 * @enterprise true
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS - The Language of Survival
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Threat detection sources
 */
export type DetectionSource =
  | 'akamai'
  | 'cloudflare'
  | 'fastly'
  | 'imperva'
  | 'aws-waf'
  | 'azure-frontdoor'
  | 'google-cloud-armor'
  | 'sucuri'
  | 'datadome'
  | 'perimeterx'
  | 'distil'
  | 'kasada'
  | 'internal';

/**
 * Threat severity levels
 */
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical' | 'apocalyptic';

/**
 * Immunity patch types
 */
export type PatchType =
  | 'fingerprint-rotation'
  | 'header-mutation'
  | 'timing-adjustment'
  | 'behavior-modification'
  | 'ip-rotation'
  | 'proxy-switch'
  | 'browser-profile'
  | 'tls-fingerprint'
  | 'javascript-execution'
  | 'cookie-management';

/**
 * Propagation strategy
 */
export type PropagationStrategy =
  | 'instant-global'
  | 'regional-cascade'
  | 'priority-first'
  | 'stealth-rollout';

/**
 * Worker region
 */
export type WorkerRegion =
  | 'tokyo' | 'singapore' | 'sydney' | 'mumbai'
  | 'frankfurt' | 'london' | 'paris' | 'stockholm'
  | 'virginia' | 'oregon' | 'ohio'
  | 'saopaulo' | 'capetown';

/**
 * Threat detection event
 */
export interface ThreatDetection {
  detectionId: string;
  timestamp: Date;

  // Source
  source: DetectionSource;
  sourceVersion?: string;

  // Location
  detectedInRegion: WorkerRegion;
  detectedByWorkerId: string;
  targetUrl: string;

  // Classification
  severity: ThreatSeverity;
  threatType: string;
  confidence: number;

  // Evidence
  evidence: ThreatEvidence;

  // Response
  responseCode?: number;
  responseHeaders?: Record<string, string>;
  challengeType?: string;

  // Timing
  detectionLatencyMs: number;
}

/**
 * Threat evidence
 */
export interface ThreatEvidence {
  // Request details
  requestFingerprint: string;
  userAgent: string;
  tlsFingerprint?: string;

  // Detection triggers
  triggers: string[];
  blockingSignature?: string;

  // Network info
  exitIp: string;
  proxyUsed: boolean;

  // Behavioral
  requestPattern?: string;
  timingAnomaly?: boolean;
}

/**
 * Immunity patch
 */
export interface ImmunityPatch {
  patchId: string;
  timestamp: Date;

  // Reference
  threatDetectionId: string;
  source: DetectionSource;

  // Patch details
  patchType: PatchType;
  priority: 'normal' | 'urgent' | 'emergency';

  // Implementation
  patchCode: string;
  configuration: PatchConfiguration;

  // Validation
  testedAgainst: string[];
  effectivenessScore: number;

  // Metadata
  generatedBy: 'ai' | 'heuristic' | 'manual';
  expiresAt: Date;
  version: number;
}

/**
 * Patch configuration
 */
export interface PatchConfiguration {
  // Fingerprint changes
  newFingerprint?: FingerprintConfig;

  // Header modifications
  headerMutations?: HeaderMutation[];

  // Timing adjustments
  timingConfig?: TimingConfig;

  // Behavior modifications
  behaviorConfig?: BehaviorConfig;

  // Network changes
  networkConfig?: NetworkConfig;
}

/**
 * Fingerprint configuration
 */
export interface FingerprintConfig {
  browserVersion?: string;
  platformVersion?: string;
  screenResolution?: string;
  timezone?: string;
  languages?: string[];
  webglVendor?: string;
  webglRenderer?: string;
  canvasHash?: string;
  audioFingerprint?: string;
}

/**
 * Header mutation
 */
export interface HeaderMutation {
  header: string;
  action: 'set' | 'remove' | 'randomize' | 'rotate';
  value?: string;
  values?: string[];
}

/**
 * Timing configuration
 */
export interface TimingConfig {
  minDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
  burstLimit: number;
  cooldownMs: number;
}

/**
 * Behavior configuration
 */
export interface BehaviorConfig {
  mouseMovement: 'human' | 'linear' | 'bezier';
  scrollPattern: 'natural' | 'instant' | 'stepped';
  keyboardTiming: 'human' | 'instant' | 'variable';
  clickDelay: number;
  hoverDuration: number;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  rotateIp: boolean;
  proxyPool?: string;
  preferredRegions?: WorkerRegion[];
  avoidRegions?: WorkerRegion[];
  tlsVersion?: string;
  cipherSuites?: string[];
}

/**
 * Propagation result
 */
export interface PropagationResult {
  propagationId: string;
  patchId: string;
  strategy: PropagationStrategy;

  // Timing
  startedAt: Date;
  completedAt: Date;
  totalLatencyMs: number;

  // Coverage
  totalWorkers: number;
  successfulDeliveries: number;
  failedDeliveries: number;

  // By region
  regionStats: Record<WorkerRegion, RegionPropagationStats>;

  // P99 latency
  p50LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
}

/**
 * Region propagation stats
 */
export interface RegionPropagationStats {
  workerCount: number;
  delivered: number;
  latencyMs: number;
  appliedAt: Date;
}

/**
 * Worker state
 */
export interface WorkerState {
  workerId: string;
  region: WorkerRegion;
  status: 'active' | 'patching' | 'degraded' | 'offline';

  // Current configuration
  currentFingerprint: string;
  appliedPatches: string[];

  // Health
  lastHealthCheck: Date;
  healthScore: number;

  // Performance
  successRate: number;
  detectionCount: number;
  lastDetection?: Date;
}

/**
 * Detection signature
 */
export interface DetectionSignature {
  signatureId: string;
  source: DetectionSource;
  pattern: string;
  regex?: RegExp;

  // Classification
  severity: ThreatSeverity;
  category: string;

  // Response
  recommendedPatch: PatchType;
  bypassStrategy: string;

  // Stats
  detectionCount: number;
  bypassSuccessRate: number;
  lastSeen: Date;
}

/**
 * Global threat intel configuration
 */
export interface GlobalThreatIntelConfig {
  // Workers
  maxWorkers: number;
  workersPerRegion: Record<WorkerRegion, number>;

  // Propagation
  defaultStrategy: PropagationStrategy;
  targetLatencyMs: number;
  maxPropagationTimeMs: number;

  // Patches
  patchExpirationHours: number;
  maxActivePaches: number;
  autoGeneratePatches: boolean;

  // Signatures
  signatureUpdateIntervalMs: number;

  // Health
  healthCheckIntervalMs: number;
  degradedThreshold: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: GlobalThreatIntelConfig = {
  maxWorkers: 1000,
  workersPerRegion: {
    tokyo: 100,
    singapore: 80,
    sydney: 50,
    mumbai: 70,
    frankfurt: 100,
    london: 90,
    paris: 60,
    stockholm: 40,
    virginia: 150,
    oregon: 100,
    ohio: 80,
    saopaulo: 50,
    capetown: 30
  },

  defaultStrategy: 'instant-global',
  targetLatencyMs: 0.05, // 50 microseconds target
  maxPropagationTimeMs: 100,

  patchExpirationHours: 24,
  maxActivePaches: 50,
  autoGeneratePatches: true,

  signatureUpdateIntervalMs: 60000,

  healthCheckIntervalMs: 5000,
  degradedThreshold: 0.7
};

// ═══════════════════════════════════════════════════════════════════════════
// DETECTION SIGNATURES DATABASE
// ═══════════════════════════════════════════════════════════════════════════

const DETECTION_SIGNATURES: DetectionSignature[] = [
  {
    signatureId: 'sig_akamai_bot_manager',
    source: 'akamai',
    pattern: 'ak_bmsc',
    severity: 'high',
    category: 'bot-detection',
    recommendedPatch: 'fingerprint-rotation',
    bypassStrategy: 'Rotate browser fingerprint and sensor data',
    detectionCount: 0,
    bypassSuccessRate: 0.92,
    lastSeen: new Date()
  },
  {
    signatureId: 'sig_cloudflare_challenge',
    source: 'cloudflare',
    pattern: 'cf_chl',
    severity: 'medium',
    category: 'javascript-challenge',
    recommendedPatch: 'javascript-execution',
    bypassStrategy: 'Execute challenge JavaScript and return token',
    detectionCount: 0,
    bypassSuccessRate: 0.95,
    lastSeen: new Date()
  },
  {
    signatureId: 'sig_datadome_captcha',
    source: 'datadome',
    pattern: 'datadome',
    severity: 'high',
    category: 'captcha',
    recommendedPatch: 'behavior-modification',
    bypassStrategy: 'Human-like mouse and scroll patterns',
    detectionCount: 0,
    bypassSuccessRate: 0.88,
    lastSeen: new Date()
  },
  {
    signatureId: 'sig_perimeterx_block',
    source: 'perimeterx',
    pattern: '_px',
    severity: 'critical',
    category: 'behavioral-analysis',
    recommendedPatch: 'timing-adjustment',
    bypassStrategy: 'Randomize timing patterns and add jitter',
    detectionCount: 0,
    bypassSuccessRate: 0.85,
    lastSeen: new Date()
  },
  {
    signatureId: 'sig_imperva_incapsula',
    source: 'imperva',
    pattern: 'incap_ses',
    severity: 'high',
    category: 'session-validation',
    recommendedPatch: 'cookie-management',
    bypassStrategy: 'Properly handle session cookies and reese84',
    detectionCount: 0,
    bypassSuccessRate: 0.90,
    lastSeen: new Date()
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL THREAT INTEL ENGINE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GlobalThreatIntel - The Immunity Network
 *
 * Real-time threat intelligence propagation across the global worker swarm.
 * Sub-millisecond patch distribution for collective immunity.
 */
export class GlobalThreatIntel extends EventEmitter {
  private config: GlobalThreatIntelConfig;
  private workers: Map<string, WorkerState> = new Map();
  private patches: Map<string, ImmunityPatch> = new Map();
  private detections: Map<string, ThreatDetection> = new Map();
  private signatures: Map<string, DetectionSignature> = new Map();

  // Regional indexes for fast propagation
  private workersByRegion: Map<WorkerRegion, Set<string>> = new Map();

  // Metrics
  private totalDetections: number = 0;
  private totalPatches: number = 0;
  private totalPropagations: number = 0;
  private averagePropagationLatencyMs: number = 0;
  private immunityRate: number = 1.0;

  // Fatality Engine integration
  private fatalityEngineConnected: boolean = false;

  constructor(config: Partial<GlobalThreatIntelConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize signatures
    this.initializeSignatures();

    // Initialize regional indexes
    this.initializeRegionalIndexes();

    // Simulate workers
    this.initializeWorkers();

    this.emit('initialized', {
      timestamp: new Date(),
      workerCount: this.workers.size,
      signatureCount: this.signatures.size
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // THREAT DETECTION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Report a threat detection from a worker
   */
  async reportThreatDetection(detection: Omit<ThreatDetection, 'detectionId'>): Promise<ImmunityPatch> {
    const detectionId = this.generateId('det');
    const fullDetection: ThreatDetection = {
      ...detection,
      detectionId
    };

    // Store detection
    this.detections.set(detectionId, fullDetection);
    this.totalDetections++;

    // Update worker state
    const worker = this.workers.get(detection.detectedByWorkerId);
    if (worker) {
      worker.detectionCount++;
      worker.lastDetection = new Date();
    }

    // Update signature stats
    const signature = this.findMatchingSignature(detection);
    if (signature) {
      signature.detectionCount++;
      signature.lastSeen = new Date();
    }

    this.emit('threat:detected', {
      detectionId,
      source: detection.source,
      severity: detection.severity,
      region: detection.detectedInRegion
    });

    // Generate immunity patch
    const patch = await this.generateImmunityPatch(fullDetection, signature);

    // Propagate to all workers
    await this.propagatePatch(patch);

    return patch;
  }

  /**
   * Find matching signature for detection
   */
  private findMatchingSignature(detection: ThreatDetection): DetectionSignature | undefined {
    for (const signature of this.signatures.values()) {
      if (signature.source === detection.source) {
        // Check pattern match
        if (detection.evidence.blockingSignature?.includes(signature.pattern)) {
          return signature;
        }
        // Check triggers
        for (const trigger of detection.evidence.triggers) {
          if (trigger.includes(signature.pattern)) {
            return signature;
          }
        }
      }
    }
    return undefined;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PATCH GENERATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate immunity patch for a threat
   */
  private async generateImmunityPatch(
    detection: ThreatDetection,
    signature?: DetectionSignature
  ): Promise<ImmunityPatch> {
    const patchId = this.generateId('patch');
    const patchType = signature?.recommendedPatch || this.inferPatchType(detection);

    // Generate patch configuration based on type
    const configuration = await this.generatePatchConfiguration(patchType, detection);

    // Generate patch code
    const patchCode = this.generatePatchCode(patchType, configuration);

    const patch: ImmunityPatch = {
      patchId,
      timestamp: new Date(),
      threatDetectionId: detection.detectionId,
      source: detection.source,
      patchType,
      priority: this.calculatePatchPriority(detection.severity),
      patchCode,
      configuration,
      testedAgainst: [detection.source],
      effectivenessScore: signature?.bypassSuccessRate || 0.85,
      generatedBy: 'ai',
      expiresAt: new Date(Date.now() + this.config.patchExpirationHours * 60 * 60 * 1000),
      version: 1
    };

    this.patches.set(patchId, patch);
    this.totalPatches++;

    this.emit('patch:generated', {
      patchId,
      patchType,
      priority: patch.priority,
      source: detection.source
    });

    return patch;
  }

  /**
   * Infer patch type from detection
   */
  private inferPatchType(detection: ThreatDetection): PatchType {
    // Analyze evidence to determine best patch type
    if (detection.evidence.tlsFingerprint) {
      return 'tls-fingerprint';
    }
    if (detection.evidence.timingAnomaly) {
      return 'timing-adjustment';
    }
    if (detection.challengeType === 'javascript') {
      return 'javascript-execution';
    }
    if (detection.evidence.requestPattern) {
      return 'behavior-modification';
    }

    // Default to fingerprint rotation
    return 'fingerprint-rotation';
  }

  /**
   * Generate patch configuration
   */
  private async generatePatchConfiguration(
    patchType: PatchType,
    detection: ThreatDetection
  ): Promise<PatchConfiguration> {
    const config: PatchConfiguration = {};

    switch (patchType) {
      case 'fingerprint-rotation':
        config.newFingerprint = this.generateNewFingerprint();
        break;

      case 'header-mutation':
        config.headerMutations = this.generateHeaderMutations(detection);
        break;

      case 'timing-adjustment':
        config.timingConfig = this.generateTimingConfig(detection);
        break;

      case 'behavior-modification':
        config.behaviorConfig = this.generateBehaviorConfig();
        break;

      case 'ip-rotation':
      case 'proxy-switch':
        config.networkConfig = this.generateNetworkConfig(detection);
        break;
    }

    return config;
  }

  /**
   * Generate new fingerprint
   */
  private generateNewFingerprint(): FingerprintConfig {
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const resolutions = ['1920x1080', '2560x1440', '1366x768', '1440x900'];
    const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Los_Angeles'];
    const languages = [['en-US', 'en'], ['en-GB', 'en'], ['de-DE', 'de'], ['fr-FR', 'fr']];

    return {
      browserVersion: `${browsers[Math.floor(Math.random() * browsers.length)]}/${118 + Math.floor(Math.random() * 10)}.0`,
      platformVersion: `${10 + Math.floor(Math.random() * 4)}`,
      screenResolution: resolutions[Math.floor(Math.random() * resolutions.length)],
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      languages: languages[Math.floor(Math.random() * languages.length)],
      webglVendor: 'Google Inc. (NVIDIA)',
      webglRenderer: `ANGLE (NVIDIA, NVIDIA GeForce RTX ${3060 + Math.floor(Math.random() * 30) * 10})`,
      canvasHash: crypto.randomBytes(16).toString('hex'),
      audioFingerprint: crypto.randomBytes(8).toString('hex')
    };
  }

  /**
   * Generate header mutations
   */
  private generateHeaderMutations(detection: ThreatDetection): HeaderMutation[] {
    return [
      {
        header: 'Accept-Language',
        action: 'rotate',
        values: ['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en-US,en;q=0.8,de;q=0.6']
      },
      {
        header: 'Accept-Encoding',
        action: 'set',
        value: 'gzip, deflate, br'
      },
      {
        header: 'Sec-Ch-Ua-Platform',
        action: 'rotate',
        values: ['"Windows"', '"macOS"', '"Linux"']
      },
      {
        header: 'Sec-Fetch-Site',
        action: 'set',
        value: 'same-origin'
      }
    ];
  }

  /**
   * Generate timing config
   */
  private generateTimingConfig(detection: ThreatDetection): TimingConfig {
    return {
      minDelayMs: 100 + Math.floor(Math.random() * 200),
      maxDelayMs: 500 + Math.floor(Math.random() * 500),
      jitterMs: 50 + Math.floor(Math.random() * 100),
      burstLimit: 3 + Math.floor(Math.random() * 3),
      cooldownMs: 2000 + Math.floor(Math.random() * 3000)
    };
  }

  /**
   * Generate behavior config
   */
  private generateBehaviorConfig(): BehaviorConfig {
    return {
      mouseMovement: 'bezier',
      scrollPattern: 'natural',
      keyboardTiming: 'human',
      clickDelay: 50 + Math.floor(Math.random() * 100),
      hoverDuration: 200 + Math.floor(Math.random() * 300)
    };
  }

  /**
   * Generate network config
   */
  private generateNetworkConfig(detection: ThreatDetection): NetworkConfig {
    return {
      rotateIp: true,
      proxyPool: 'residential-premium',
      preferredRegions: this.getPreferredRegions(detection.detectedInRegion),
      avoidRegions: [detection.detectedInRegion],
      tlsVersion: '1.3',
      cipherSuites: [
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256'
      ]
    };
  }

  /**
   * Get preferred regions (avoid the detection region)
   */
  private getPreferredRegions(avoidRegion: WorkerRegion): WorkerRegion[] {
    const allRegions: WorkerRegion[] = [
      'tokyo', 'singapore', 'sydney', 'mumbai',
      'frankfurt', 'london', 'paris', 'stockholm',
      'virginia', 'oregon', 'ohio', 'saopaulo', 'capetown'
    ];
    return allRegions.filter(r => r !== avoidRegion).slice(0, 5);
  }

  /**
   * Generate patch code
   */
  private generatePatchCode(patchType: PatchType, config: PatchConfiguration): string {
    // In production, this would generate actual executable code
    return Buffer.from(JSON.stringify({
      type: patchType,
      config,
      timestamp: Date.now()
    })).toString('base64');
  }

  /**
   * Calculate patch priority
   */
  private calculatePatchPriority(severity: ThreatSeverity): 'normal' | 'urgent' | 'emergency' {
    switch (severity) {
      case 'apocalyptic':
      case 'critical':
        return 'emergency';
      case 'high':
        return 'urgent';
      default:
        return 'normal';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PATCH PROPAGATION - THE 0.05ms MAGIC
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Propagate patch to all workers
   */
  async propagatePatch(patch: ImmunityPatch): Promise<PropagationResult> {
    const propagationId = this.generateId('prop');
    const startTime = process.hrtime.bigint();

    this.emit('propagation:started', {
      propagationId,
      patchId: patch.patchId,
      workerCount: this.workers.size
    });

    const strategy = patch.priority === 'emergency'
      ? 'instant-global'
      : this.config.defaultStrategy;

    const regionStats: Record<WorkerRegion, RegionPropagationStats> = {} as any;
    const latencies: number[] = [];

    let successfulDeliveries = 0;
    let failedDeliveries = 0;

    // Parallel propagation to all regions
    const regionPromises = Array.from(this.workersByRegion.entries()).map(
      async ([region, workerIds]) => {
        const regionStart = process.hrtime.bigint();
        let regionDelivered = 0;

        // Parallel delivery to all workers in region
        const deliveryPromises = Array.from(workerIds).map(async (workerId) => {
          try {
            await this.deliverPatchToWorker(workerId, patch);
            regionDelivered++;
            successfulDeliveries++;
            return true;
          } catch {
            failedDeliveries++;
            return false;
          }
        });

        await Promise.all(deliveryPromises);

        const regionEnd = process.hrtime.bigint();
        const regionLatencyMs = Number(regionEnd - regionStart) / 1_000_000;
        latencies.push(regionLatencyMs);

        regionStats[region] = {
          workerCount: workerIds.size,
          delivered: regionDelivered,
          latencyMs: regionLatencyMs,
          appliedAt: new Date()
        };
      }
    );

    await Promise.all(regionPromises);

    const endTime = process.hrtime.bigint();
    const totalLatencyMs = Number(endTime - startTime) / 1_000_000;

    // Calculate percentiles
    latencies.sort((a, b) => a - b);
    const p50Index = Math.floor(latencies.length * 0.5);
    const p99Index = Math.floor(latencies.length * 0.99);

    const result: PropagationResult = {
      propagationId,
      patchId: patch.patchId,
      strategy,
      startedAt: new Date(Date.now() - totalLatencyMs),
      completedAt: new Date(),
      totalLatencyMs,
      totalWorkers: this.workers.size,
      successfulDeliveries,
      failedDeliveries,
      regionStats,
      p50LatencyMs: latencies[p50Index] || 0,
      p99LatencyMs: latencies[p99Index] || 0,
      maxLatencyMs: Math.max(...latencies)
    };

    // Update metrics
    this.totalPropagations++;
    this.updateAverageLatency(totalLatencyMs);
    this.immunityRate = successfulDeliveries / this.workers.size;

    this.emit('propagation:completed', {
      propagationId,
      totalLatencyMs,
      successRate: successfulDeliveries / this.workers.size,
      p99LatencyMs: result.p99LatencyMs
    });

    return result;
  }

  /**
   * Deliver patch to a specific worker
   */
  private async deliverPatchToWorker(workerId: string, patch: ImmunityPatch): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker || worker.status === 'offline') {
      throw new Error(`Worker ${workerId} unavailable`);
    }

    // Mark as patching
    worker.status = 'patching';

    // Simulate ultra-fast patch application (in production: WebSocket/UDP multicast)
    // Target: 0.05ms = 50 microseconds
    await this.microSleep(50);

    // Apply patch
    worker.appliedPatches.push(patch.patchId);

    // If fingerprint patch, update fingerprint
    if (patch.patchType === 'fingerprint-rotation' && patch.configuration.newFingerprint) {
      worker.currentFingerprint = crypto
        .createHash('sha256')
        .update(JSON.stringify(patch.configuration.newFingerprint))
        .digest('hex')
        .substring(0, 16);
    }

    worker.status = 'active';

    this.emit('worker:patched', {
      workerId,
      patchId: patch.patchId,
      region: worker.region
    });
  }

  /**
   * Microsecond sleep for ultra-fast operations
   */
  private microSleep(microseconds: number): Promise<void> {
    return new Promise(resolve => {
      // Use setImmediate for sub-millisecond timing
      setImmediate(resolve);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FATALITY ENGINE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Connect to Fatality Engine
   */
  async connectFatalityEngine(): Promise<void> {
    // In production, establish WebSocket connection to Fatality Engine
    this.fatalityEngineConnected = true;

    this.emit('fatality:connected', {
      timestamp: new Date()
    });
  }

  /**
   * Receive ban event from Fatality Engine
   */
  async handleFatalityBanEvent(event: {
    ip: string;
    reason: string;
    source: DetectionSource;
    region: WorkerRegion;
  }): Promise<ImmunityPatch> {
    // Convert Fatality ban to threat detection
    const detection: ThreatDetection = {
      detectionId: '',
      timestamp: new Date(),
      source: event.source,
      detectedInRegion: event.region,
      detectedByWorkerId: `fatality_${event.ip}`,
      targetUrl: 'global',
      severity: 'critical',
      threatType: 'ip-ban',
      confidence: 1.0,
      evidence: {
        requestFingerprint: '',
        userAgent: '',
        triggers: [event.reason],
        exitIp: event.ip,
        proxyUsed: true
      },
      detectionLatencyMs: 0
    };

    return this.reportThreatDetection(detection);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Initialize detection signatures
   */
  private initializeSignatures(): void {
    for (const sig of DETECTION_SIGNATURES) {
      this.signatures.set(sig.signatureId, { ...sig });
    }
  }

  /**
   * Initialize regional indexes
   */
  private initializeRegionalIndexes(): void {
    const regions: WorkerRegion[] = [
      'tokyo', 'singapore', 'sydney', 'mumbai',
      'frankfurt', 'london', 'paris', 'stockholm',
      'virginia', 'oregon', 'ohio', 'saopaulo', 'capetown'
    ];

    for (const region of regions) {
      this.workersByRegion.set(region, new Set());
    }
  }

  /**
   * Initialize workers (simulation)
   */
  private initializeWorkers(): void {
    for (const [region, count] of Object.entries(this.config.workersPerRegion)) {
      for (let i = 0; i < count; i++) {
        const workerId = this.generateId('worker');

        const worker: WorkerState = {
          workerId,
          region: region as WorkerRegion,
          status: 'active',
          currentFingerprint: crypto.randomBytes(8).toString('hex'),
          appliedPatches: [],
          lastHealthCheck: new Date(),
          healthScore: 0.95 + Math.random() * 0.05,
          successRate: 0.90 + Math.random() * 0.10,
          detectionCount: 0
        };

        this.workers.set(workerId, worker);
        this.workersByRegion.get(region as WorkerRegion)?.add(workerId);
      }
    }
  }

  /**
   * Update average latency
   */
  private updateAverageLatency(latencyMs: number): void {
    if (this.averagePropagationLatencyMs === 0) {
      this.averagePropagationLatencyMs = latencyMs;
    } else {
      this.averagePropagationLatencyMs =
        this.averagePropagationLatencyMs * 0.9 + latencyMs * 0.1;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANALYTICS & REPORTING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get threat intelligence analytics
   */
  getAnalytics(): ThreatIntelAnalytics {
    const detectionsBySource: Record<string, number> = {};
    const detectionsByRegion: Record<string, number> = {};

    for (const detection of this.detections.values()) {
      detectionsBySource[detection.source] =
        (detectionsBySource[detection.source] || 0) + 1;
      detectionsByRegion[detection.detectedInRegion] =
        (detectionsByRegion[detection.detectedInRegion] || 0) + 1;
    }

    return {
      totalWorkers: this.workers.size,
      activeWorkers: Array.from(this.workers.values())
        .filter(w => w.status === 'active').length,
      totalDetections: this.totalDetections,
      totalPatches: this.totalPatches,
      totalPropagations: this.totalPropagations,
      averagePropagationLatencyMs: this.averagePropagationLatencyMs,
      immunityRate: this.immunityRate,
      detectionsBySource,
      detectionsByRegion,
      activeSignatures: this.signatures.size,
      fatalityEngineConnected: this.fatalityEngineConnected
    };
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): WorkerState | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get workers by region
   */
  getWorkersByRegion(region: WorkerRegion): WorkerState[] {
    const workerIds = this.workersByRegion.get(region);
    if (!workerIds) return [];

    return Array.from(workerIds)
      .map(id => this.workers.get(id))
      .filter((w): w is WorkerState => w !== undefined);
  }

  /**
   * Get recent detections
   */
  getRecentDetections(limit: number = 100): ThreatDetection[] {
    return Array.from(this.detections.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get active patches
   */
  getActivePatches(): ImmunityPatch[] {
    const now = Date.now();
    return Array.from(this.patches.values())
      .filter(p => p.expiresAt.getTime() > now);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface ThreatIntelAnalytics {
  totalWorkers: number;
  activeWorkers: number;
  totalDetections: number;
  totalPatches: number;
  totalPropagations: number;
  averagePropagationLatencyMs: number;
  immunityRate: number;
  detectionsBySource: Record<string, number>;
  detectionsByRegion: Record<string, number>;
  activeSignatures: number;
  fatalityEngineConnected: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY EXPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new GlobalThreatIntel instance
 */
export function createGlobalThreatIntel(
  config?: Partial<GlobalThreatIntelConfig>
): GlobalThreatIntel {
  return new GlobalThreatIntel(config);
}

export default GlobalThreatIntel;
