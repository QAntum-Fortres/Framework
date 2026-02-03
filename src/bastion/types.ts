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
// SECURITY SANDBOX TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Security policy for sandbox execution
 */
export interface SecurityPolicy {
  /** Allow file system access */
  allowFileSystem: boolean;
  /** Allowed file system paths (if enabled) */
  allowedPaths?: string[];
  /** Allow network access */
  allowNetwork: boolean;
  /** Allowed network hosts (if enabled) */
  allowedHosts?: string[];
  /** Allow process access */
  allowProcess: boolean;
  /** Max execution time in ms */
  maxExecutionTime: number;
  /** Max memory usage in bytes */
  maxMemory: number;
  /** Allow eval/Function constructor */
  allowEval: boolean;
  /** Allow require/import */
  allowRequire: boolean;
  /** Allowed modules (if require enabled) */
  allowedModules?: string[];
}

/**
 * Sandbox execution result
 */
export interface SandboxResult {
  /** Execution success */
  success: boolean;
  /** Return value from sandbox */
  result?: unknown;
  /** Execution time in ms */
  executionTime: number;
  /** Memory used in bytes */
  memoryUsed: number;
  /** Security violations detected */
  violations: SecurityViolation[];
  /** Error if failed */
  error?: string;
  /** Stack trace if error */
  stackTrace?: string;
}

/**
 * Security violation detected in sandbox
 */
export interface SecurityViolation {
  /** Violation type */
  type: 'filesystem' | 'network' | 'process' | 'memory' | 'timeout' | 'eval' | 'require';
  /** Attempted operation */
  operation: string;
  /** Additional details */
  details: string;
  /** Timestamp */
  timestamp: Date;
  /** Was blocked */
  blocked: boolean;
}

/**
 * Mutation validation result
 */
export interface MutationValidation {
  /** Mutation ID */
  mutationId: string;
  /** Is safe to apply */
  isSafe: boolean;
  /** Is malicious */
  isMalicious: boolean;
  /** Is unstable (crashes/hangs) */
  isUnstable: boolean;
  /** Sandbox result */
  sandboxResult: SandboxResult;
  /** Validation timestamp */
  validatedAt: Date;
  /** Recommendation */
  recommendation: 'apply' | 'reject' | 'review';
}

/**
 * Sandbox configuration
 */
export interface SandboxConfig {
  /** Enable sandbox */
  enabled?: boolean;
  /** Default security policy */
  defaultPolicy?: Partial<SecurityPolicy>;
  /** Log violations */
  logViolations?: boolean;
  /** Violation callback */
  onViolation?: (violation: SecurityViolation) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKER POOL TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Worker status
 */
export type WorkerStatus = 'idle' | 'busy' | 'error' | 'terminated';

/**
 * Worker task
 */
export interface WorkerTask<T = unknown, R = unknown> {
  /** Task ID */
  id: string;
  /** Task type */
  type: string;
  /** Task payload */
  payload: T;
  /** Task priority (0-10, higher = more important) */
  priority: number;
  /** Timeout in ms */
  timeout?: number;
  /** Callback on completion */
  resolve: (result: R) => void;
  /** Callback on error */
  reject: (error: Error) => void;
  /** Queued at */
  queuedAt: Date;
  /** Started at */
  startedAt?: Date;
}

/**
 * Worker info
 */
export interface WorkerInfo {
  /** Worker ID */
  id: number;
  /** Thread ID */
  threadId: number;
  /** Current status */
  status: WorkerStatus;
  /** Current task ID */
  currentTaskId?: string;
  /** Tasks completed */
  tasksCompleted: number;
  /** Total execution time */
  totalExecutionTime: number;
  /** Last active */
  lastActive: Date;
  /** Error count */
  errorCount: number;
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  /** Number of workers (default: CPU count) */
  workerCount?: number;
  /** Max tasks per worker before recycle */
  maxTasksPerWorker?: number;
  /** Task timeout in ms */
  taskTimeout?: number;
  /** Queue size limit */
  maxQueueSize?: number;
  /** Enable work stealing */
  enableWorkStealing?: boolean;
  /** Worker script path */
  workerScript?: string;
  /** Enable thermal throttling (v26.0) */
  enableThermalThrottling?: boolean;
  /** Temperature threshold in °C for throttling (default: 85) */
  thermalThresholdCelsius?: number;
  /** Enable dynamic load rebalancing (v26.0) */
  enableDynamicRebalancing?: boolean;
  /** Rebalancing interval in ms (default: 5000) */
  rebalanceIntervalMs?: number;
}

/**
 * Thermal state for worker pool
 */
export type ThermalState = 'cool' | 'warm' | 'hot' | 'critical';

/**
 * Worker pool statistics
 */
export interface WorkerPoolStats {
  /** Total workers */
  totalWorkers: number;
  /** Active workers */
  activeWorkers: number;
  /** Idle workers */
  idleWorkers: number;
  /** Queue size */
  queueSize: number;
  /** Tasks completed */
  tasksCompleted: number;
  /** Tasks failed */
  tasksFailed: number;
  /** Average task time */
  avgTaskTime: number;
  /** Uptime in ms */
  uptime: number;
  /** Current thermal state (v26.0) */
  thermalState?: ThermalState;
  /** Estimated CPU temperature in °C (v26.0) */
  estimatedTemperature?: number;
  /** Throttled tasks count (v26.0) */
  throttledTasks?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL VAULT TYPES (ENCRYPTED SYNC)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encryption algorithm
 */
export type EncryptionAlgorithm = 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';

/**
 * Encrypted payload
 */
export interface EncryptedPayload {
  /** Algorithm used */
  algorithm: EncryptionAlgorithm;
  /** Initialization vector (base64) */
  iv: string;
  /** Encrypted data (base64) */
  data: string;
  /** Authentication tag (base64, for GCM) */
  authTag?: string;
  /** Salt for key derivation (base64) */
  salt: string;
  /** Encryption timestamp */
  encryptedAt: Date;
  /** Version for future compatibility */
  version: number;
}

/**
 * Knowledge vault entry
 */
export interface VaultEntry {
  /** Entry ID */
  id: string;
  /** Entry type */
  type: 'ghost_knowledge' | 'predictions' | 'mutations' | 'versions' | 'metrics';
  /** Encrypted payload */
  payload: EncryptedPayload;
  /** SHA-256 checksum of original data */
  checksum: string;
  /** Last modified */
  lastModified: Date;
  /** Size in bytes (original) */
  originalSize: number;
}

/**
 * Vault manifest
 */
export interface VaultManifest {
  /** Manifest version */
  version: string;
  /** Machine ID */
  machineId: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last sync */
  lastSync?: Date;
  /** Entry count */
  entryCount: number;
  /** Total size */
  totalSize: number;
  /** Manifest checksum */
  manifestChecksum: string;
}

/**
 * Sync status
 */
export interface SyncStatus {
  /** Is syncing */
  isSyncing: boolean;
  /** Last successful sync */
  lastSuccessfulSync?: Date;
  /** Last error */
  lastError?: string;
  /** Pending changes */
  pendingChanges: number;
  /** Sync direction */
  direction?: 'upload' | 'download' | 'bidirectional';
}

/**
 * Neural vault configuration
 */
export interface NeuralVaultConfig {
  /** Enable encryption */
  enabled?: boolean;
  /** Encryption algorithm */
  algorithm?: EncryptionAlgorithm;
  /** Vault file path */
  vaultPath?: string;
  /** Auto-sync interval in ms (0 = disabled) */
  autoSyncInterval?: number;
  /** Cloud endpoint for sync */
  cloudEndpoint?: string;
  /** Compression enabled */
  compression?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Circuit breaker state
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Service provider type
 */
export type ServiceProvider = 'gemini' | 'claude' | 'openai' | 'ollama' | 'local';

/**
 * Service health status
 */
export interface ServiceHealth {
  /** Service name */
  service: ServiceProvider;
  /** Is healthy */
  healthy: boolean;
  /** Response time in ms */
  responseTime: number;
  /** Last check timestamp */
  lastCheck: Date;
  /** Consecutive failures */
  consecutiveFailures: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Circuit state */
  circuitState: CircuitState;
}

/**
 * Fallback chain
 */
export interface FallbackChain {
  /** Primary service */
  primary: ServiceProvider;
  /** Fallback services in order */
  fallbacks: ServiceProvider[];
  /** Current active service */
  activeService: ServiceProvider;
  /** Failover count */
  failoverCount: number;
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Enable circuit breaker */
  enabled?: boolean;
  /** Failure threshold to open circuit */
  failureThreshold?: number;
  /** Success threshold to close circuit */
  successThreshold?: number;
  /** Reset timeout in ms (half-open wait) */
  resetTimeout?: number;
  /** Health check interval in ms */
  healthCheckInterval?: number;
  /** Request timeout in ms */
  requestTimeout?: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Module name */
  module: string;
  /** Is healthy */
  healthy: boolean;
  /** Check duration in ms */
  duration: number;
  /** Status message */
  message: string;
  /** Additional metrics */
  metrics?: Record<string, number>;
  /** Timestamp */
  timestamp: Date;
}

/**
 * System health overview
 */
export interface SystemHealth {
  /** Overall healthy */
  healthy: boolean;
  /** Module health results */
  modules: HealthCheckResult[];
  /** Active services */
  activeServices: ServiceHealth[];
  /** Memory usage */
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  /** CPU usage (0-1) */
  cpuUsage: number;
  /** Uptime in ms */
  uptime: number;
  /** Check timestamp */
  checkedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY HARDENING TYPES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Browser instance metadata
 */
export interface BrowserMetadata {
  /** Instance ID */
  instanceId: string;
  /** Created at */
  createdAt: Date;
  /** Pages opened */
  pagesOpened: number;
  /** Memory usage estimate */
  memoryEstimate: number;
  /** Is active */
  isActive: boolean;
  /** Last activity */
  lastActivity: Date;
}

/**
 * Resource tracker
 */
export interface ResourceTracker {
  /** Active resources count */
  activeCount: number;
  /** Peak count */
  peakCount: number;
  /** Total created */
  totalCreated: number;
  /** Total cleaned */
  totalCleaned: number;
  /** Cleanup callbacks pending */
  pendingCleanups: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BASTION MAIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Security Bastion main configuration
 */
export interface BastionConfig {
  /** Enable bastion */
  enabled?: boolean;
  /** Sandbox configuration */
  sandbox?: SandboxConfig;
  /** Worker pool configuration */
  workerPool?: WorkerPoolConfig;
  /** Neural vault configuration */
  neuralVault?: NeuralVaultConfig;
  /** Circuit breaker configuration */
  circuitBreaker?: CircuitBreakerConfig;
  /** Health check interval in ms */
  healthCheckInterval?: number;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Bastion statistics
 */
export interface BastionStats {
  /** Sandbox executions */
  sandboxExecutions: number;
  /** Violations blocked */
  violationsBlocked: number;
  /** Worker tasks completed */
  workerTasksCompleted: number;
  /** Vault operations */
  vaultOperations: number;
  /** Circuit breaker trips */
  circuitBreakerTrips: number;
  /** Health checks performed */
  healthChecksPerformed: number;
  /** Uptime in ms */
  uptime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Types are exported above
};
