/**
 * 🏰 SECURITY BASTION & NEURAL GRID - Mister Mind v19.0
 * 
 * Enterprise-grade security and distributed intelligence module.
 * 
 * @author Dimitar Papazov
 * @version 19.0.0
 */

// Types
export * from './types';

// Core Controller
export { BastionController, default } from './bastion-controller';

// Security Components
export { SandboxExecutor } from './sandbox/sandbox-executor';
export { WorkerPoolManager, workerMain } from './workers/worker-pool';
export { MemoryHardeningManager, getGlobalMemoryManager } from './memory/memory-hardening';

// Neural Grid Components
export { NeuralVault } from './neural/neural-vault';
export { ChecksumValidator } from './neural/checksum-validator';

// Infrastructure Components
export { CircuitBreakerManager } from './circuit/circuit-breaker';
export { HealthCheckSystem } from './health/health-check';

// Re-export types for convenience
export type {
  SecurityPolicy,
  SandboxResult,
  SecurityViolation,
  MutationValidation,
  SandboxConfig,
  WorkerStatus,
  WorkerTask,
  WorkerInfo,
  WorkerPoolConfig,
  WorkerPoolStats,
  EncryptionAlgorithm,
  EncryptedPayload,
  VaultEntry,
  VaultManifest,
  SyncStatus,
  NeuralVaultConfig,
  CircuitState,
  ServiceProvider,
  ServiceHealth,
  FallbackChain,
  CircuitBreakerConfig,
  HealthCheckResult,
  SystemHealth,
  BrowserMetadata,
  ResourceTracker,
  BastionConfig,
  BastionStats
} from './types';
