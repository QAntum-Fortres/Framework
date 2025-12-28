
/**
 * 💎 CORE MODULE EXPORTS - Mister Mind v20.0
 * 
 * The Flawless Diamond Protocol: All core infrastructure in one place.
 * 
 * @author Dimitar Papazov
 * @version 20.0.0
 * @license SEE LICENSE IN LICENSE
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCY INJECTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  DIContainer,
  ServiceToken,
  ServiceTokens,
  ServiceLifetime,
  globalContainer,
  
  // Interfaces
  type IBrowserEngine,
  type IBrowserPool,
  type IAIProvider,
  type IModelRouter,
  type IDatabase,
  type ICacheProvider,
  type INeuralVault,
  type IWorkerPool,
  type ITaskScheduler,
  type ISandbox,
  type ICircuitBreaker,
  type ILogger,
  type IMetricsCollector,
  type IHealthChecker,
  type IConfig,
  type IEnvironment,
  type IErrorHandler,
  type IRetryStrategy,
  type ISemanticCore,
  type IMutationEngine,
  type IGhostExecutor,
  type ISwarmOrchestrator,
  type IAgentFactory,
  
  // Supporting types
  type AIGenerateOptions,
  type AIChatOptions,
  type AIResponse,
  type ChatMessage,
  type RouteOptions,
  type ITransaction,
  type WorkerTask,
  type WorkerPoolStats,
  type ScheduledTask,
  type SandboxResult,
  type ValidationResult,
  type SecurityViolation,
  type HealthStatus,
  type CheckResult,
  type ErrorContext,
  type NeuralSnapshot,
  type ErrorHandleResult,
  type ErrorStrategy,
  type RetryOptions,
  type SemanticAnalysis,
  type PredictionResult,
  type MutationProposal,
  type MutationResult,
  type GhostResult,
  type AgentStatus
} from './di/container';

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  CentralizedErrorHandler,
  ExponentialBackoffRetry,
  AggregateRetryError,
  createNeuralSnapshot,
  
  // Error types
  MisterMindError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ConfigurationError,
  AIServiceError,
  BrowserError,
  SecurityError,
  MutationError,
  WorkerError,
  CircuitOpenError,
  
  // Supporting types
  type AlternativeStrategy
} from './errors/error-handler';

// ═══════════════════════════════════════════════════════════════════════════════
// AI LOGIC GATE (COGNITIVE AUDIT)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  AILogicGate,
  
  // Types
  type SyntaxValidationResult,
  type SyntaxError,
  type LogicValidationResult,
  type LogicIssue,
  type CodeMetrics,
  type SandboxExecutionResult,
  type ValidationReport,
  type LogicGateConfig
} from './validation/logic-gate';

// ═══════════════════════════════════════════════════════════════════════════════
// STREAM PROCESSING (MEMORY OPTIMIZATION)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  StreamProcessor,
  JSONLineParser,
  JSONArrayParser,
  BatchProcessor,
  MemoryThrottleTransform,
  
  // Types
  type StreamProcessorOptions,
  type JSONStreamOptions,
  type BatchOptions,
  type StreamStats
} from './streams/stream-processor';

// ═══════════════════════════════════════════════════════════════════════════════
// HEAVY TASK DELEGATION (WORKER THREADS)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  HeavyTaskDelegator,
  HeavyTaskType,
  
  // Types
  type HeavyTask,
  type TaskResult,
  type WorkerInfo,
  type DelegatorConfig,
  type TaskHandler
} from './workers/heavy-task-delegator';
