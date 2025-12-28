/**
 * 🐝 SOVEREIGN SWARM - Main Module Exports
 * 
 * Mister Mind v17.0 - Multi-Agent Architecture
 * 
 * @author Dimitar Papazov
 * @version 17.0.0
 */

// Types
export * from './types';

// Utilities
export * from './utils/id-generator';

// Agents
export { BaseAgent } from './agents/base-agent';
export { PlannerAgent } from './agents/planner-agent';
export { ExecutorAgent } from './agents/executor-agent';
export { CriticAgent } from './agents/critic-agent';

// Orchestrator
export { AgenticOrchestrator, OrchestratorStatus } from './orchestrator/agentic-orchestrator';
export { WebSocketBridge, ConnectionStatus, WsBridgeConfig } from './orchestrator/websocket-bridge';

// Distillation
export { DistillationLogger, DistillationConfig } from './distillation/distillation-logger';

// Observability
export { ObservabilityBridge, ObservabilityConfig, SpanStatus } from './observability/observability-bridge';

// Parallelism
export { BrowserPoolManager, BrowserPoolConfig } from './parallelism/browser-pool';
