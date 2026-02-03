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

// ═══════════════════════════════════════════════════════════════════════════
// STATE VERSIONING TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Version identifier for A/B testing of agent logic */
export interface StateVersion {
  /** Unique version ID */
  id: string;
  /** Version name */
  name: string;
  /** Description */
  description?: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Strategy configuration */
  strategy: object;
  /** Whether this version is active */
  isActive: boolean;
  /** Whether this is the baseline */
  isBaseline: boolean;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/** State versioning configuration */
export interface StateVersionConfig {
  /** Enable versioning */
  enabled?: boolean;
  /** Minimum sample size for statistical significance */
  minSampleSize?: number;
  /** Confidence level (0-1) */
  confidenceLevel?: number;
  /** Max concurrent versions */
  maxConcurrentVersions?: number;
  /** Auto-promote winners */
  autoPromote?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// GHOST EXECUTION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Ghost execution path */
export interface GhostPath {
  /** Path ID */
  id: string;
  /** Path name (e.g., 'Path A', 'Path B') */
  name: string;
  /** Selector or strategy used */
  selector: string;
  /** Strategy type */
  strategy: 'semantic' | 'css' | 'xpath' | 'text' | 'visual';
  /** Confidence in this path */
  confidence: number;
  /** Estimated execution time */
  estimatedTime?: number;
  /** Historical success rate */
  historicalSuccessRate?: number;
}

/** Ghost execution result */
export interface GhostExecutionResult {
  /** Path that was tested */
  path: GhostPath;
  /** Success status */
  success: boolean;
  /** Execution time in ms */
  executionTime: number;
  /** Error if failed */
  error?: string;
  /** Element found */
  elementFound: boolean;
  /** Element state (visible, enabled, etc.) */
  elementState?: {
    visible: boolean;
    enabled: boolean;
    interactable: boolean;
  };
  /** Screenshot hash (for visual comparison) */
  screenshotHash?: string;
  /** Timestamp */
  timestamp: Date;
}

/** Ghost execution session */
export interface GhostSession {
  /** Session ID */
  id: string;
  /** Real execution path */
  realPath: GhostPath;
  /** Ghost paths tested */
  ghostPaths: GhostPath[];
  /** Results for each path */
  results: Map<string, GhostExecutionResult>;
  /** Winner path (best performing) */
  winnerPath?: GhostPath;
  /** Started at */
  startedAt: Date;
  /** Completed at */
  completedAt?: Date;
  /** Whether results should update knowledge base */
  shouldUpdateKnowledge: boolean;
}

/** Ghost execution configuration */
export interface GhostExecutionConfig {
  /** Enable ghost execution */
  enabled?: boolean;
  /** Max parallel ghost threads */
  maxGhostThreads?: number;
  /** Ghost execution timeout in ms */
  ghostTimeout?: number;
  /** Min confidence delta to update knowledge */
  minConfidenceDelta?: number;
  /** Enable screenshot comparison */
  enableScreenshots?: boolean;
  /** Run ghosts only on first encounter */
  onlyOnFirstEncounter?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// PREDICTIVE PRE-LOADING TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Predicted next state */
export interface PredictedState {
  /** State ID */
  stateId: string;
  /** Probability (0-1) */
  probability: number;
  /** Estimated transition time */
  estimatedTime: number;
  /** Required selectors */
  requiredSelectors: PrecomputedSelector[];
  /** When precomputed */
  precomputedAt: Date;
}

/** Pre-computed selector */
export interface PrecomputedSelector {
  /** Original selector */
  original: string;
  /** Alternative selectors */
  alternatives: string[];
  /** Last validated timestamp */
  lastValidated: Date;
  /** Success rate */
  successRate: number;
}

/** State transition */
export interface StateTransition {
  /** From state */
  from: string;
  /** To state */
  to: string;
  /** Probability */
  probability: number;
  /** Average duration */
  avgDuration: number;
  /** Sample count */
  sampleCount: number;
}

/** Predictive pre-loader configuration */
export interface PredictiveConfig {
  /** Enable predictive pre-loading */
  enabled?: boolean;
  /** Max cache size */
  maxCacheSize?: number;
  /** Prediction threshold */
  predictionThreshold?: number;
  /** Look-ahead depth */
  lookAheadDepth?: number;
  /** Cache expiration (ms) */
  cacheExpiration?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// GENETIC MUTATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Genetic mutation type */
export enum MutationType {
  TIMEOUT_ADJUSTMENT = 'timeout_adjustment',
  WAIT_INJECTION = 'wait_injection',
  RETRY_LOGIC = 'retry_logic',
  ANIMATION_WAIT = 'animation_wait',
  SELECTOR_SIMPLIFICATION = 'selector_simplification',
  FALLBACK_ADDITION = 'fallback_addition',
  ERROR_HANDLING = 'error_handling',
}

/** Genetic mutation */
export interface GeneticMutation {
  /** Mutation ID */
  id: string;
  /** Mutation type */
  type: MutationType;
  /** Target selector */
  targetSelector: string;
  /** Original code */
  originalCode: string;
  /** Mutated code */
  mutatedCode: string;
  /** Confidence (0-1) */
  confidence: number;
  /** Generated at */
  generatedAt: Date;
  /** Applied at */
  appliedAt?: Date;
  /** Status */
  status: 'pending' | 'applied' | 'successful' | 'failed' | 'rolled_back';
  /** Parent failure pattern ID */
  parentPattern: string;
}

/** Failure pattern for mutation analysis */
export interface FailurePattern {
  /** Pattern ID */
  id: string;
  /** Pattern signature hash */
  signature: string;
  /** Error type */
  errorType: string;
  /** Selector involved */
  selector?: string;
  /** Occurrence count */
  occurrences: number;
  /** First seen */
  firstSeen: Date;
  /** Last seen */
  lastSeen: Date;
  /** Affected test names */
  testNames: string[];
  /** Suggested mutation ID */
  suggestedMutation?: string;
}

/** Mutation engine configuration */
export interface MutationEngineConfig {
  /** Enable automatic mutations */
  enabled?: boolean;
  /** Auto-apply mutations */
  autoApply?: boolean;
  /** Max mutations per hour */
  maxMutationsPerHour?: number;
  /** Cooldown between mutations (ms) */
  mutationCooldown?: number;
  /** Rollback on failure */
  rollbackOnFailure?: boolean;
  /** Min pattern occurrences to trigger mutation */
  minPatternOccurrences?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOT-SWAP TYPES
// ═══════════════════════════════════════════════════════════════════════════

/** Swappable module definition */
export interface SwappableModule {
  /** Module ID */
  id: string;
  /** Module name */
  name: string;
  /** Methods map */
  methods: Map<string, SwappableMethod>;
  /** Registration time */
  registeredAt: Date;
  /** Description */
  description?: string;
}

/** Swappable method */
export interface SwappableMethod {
  /** Method ID */
  id: string;
  /** Method name */
  name: string;
  /** Module ID */
  moduleId: string;
  /** Current implementation */
  currentImplementation: Function;
  /** Active alternative ID */
  activeAlternativeId?: string;
  /** Alternative implementations */
  alternatives: MethodAlternative[];
  /** Call count */
  callCount: number;
  /** Average execution time */
  avgExecutionTime: number;
  /** Error count */
  errorCount: number;
}

/** Method alternative implementation */
export interface MethodAlternative {
  /** Alternative ID */
  id: string;
  /** Name */
  name: string;
  /** Implementation function */
  implementation: Function;
  /** Added at */
  addedAt: Date;
  /** Call count */
  callCount: number;
  /** Average execution time */
  avgExecutionTime: number;
  /** Error count */
  errorCount: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Priority */
  priority: number;
  /** Description */
  description?: string;
}

/** Hot-swap event */
export interface HotSwapEvent {
  /** Event ID */
  id: string;
  /** Method ID */
  methodId: string;
  /** From alternative ID */
  fromAlternativeId?: string;
  /** To alternative ID */
  toAlternativeId: string;
  /** Timestamp */
  timestamp: Date;
  /** Success */
  success: boolean;
  /** Error if failed */
  error?: string;
}

/** Hot-swap configuration */
export interface HotSwapConfig {
  /** Enable hot-swapping */
  enabled?: boolean;
  /** Preserve state on swap */
  preserveState?: boolean;
  /** Track performance */
  trackPerformance?: boolean;
  /** Max alternatives per method */
  maxAlternatives?: number;
  /** Auto-rollback on error */
  autoRollbackOnError?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// SEGC MAIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/** Self-Evolving Genetic Core configuration */
export interface SEGCConfig {
  /** Enable SEGC */
  enabled?: boolean;
  /** State versioning config */
  stateVersioning?: StateVersionConfig;
  /** Ghost execution config */
  ghostExecution?: GhostExecutionConfig;
  /** Predictive pre-loading config */
  predictive?: PredictiveConfig;
  /** Mutation engine config */
  mutationEngine?: MutationEngineConfig;
  /** Hot-swap config */
  hotSwap?: HotSwapConfig;
  /** Data storage path */
  dataPath?: string;
  /** Learning rate (0-1) */
  learningRate?: number;
  /** Verbose logging */
  verbose?: boolean;
}

/** SEGC statistics */
export interface SEGCStats {
  /** Total ghost executions */
  ghostExecutions: number;
  /** Ghost improvements found */
  ghostImprovements: number;
  /** Predictions made */
  predictionsMade: number;
  /** Prediction accuracy */
  predictionAccuracy: number;
  /** Mutations proposed */
  mutationsProposed: number;
  /** Mutations applied */
  mutationsApplied: number;
  /** Hot-swaps performed */
  hotSwapsPerformed: number;
  /** Overall fitness improvement */
  overallFitnessImprovement: number;
  /** Active version count */
  activeVersions: number;
  /** Uptime in ms */
  uptime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Types are exported above
};
