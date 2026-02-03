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
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/** Agent roles in the swarm */
export type AgentRole = 'planner' | 'executor' | 'critic' | 'orchestrator';

/** Agent status */
export type AgentStatus = 'idle' | 'working' | 'waiting' | 'error' | 'completed';

/** Message priority levels */
export type MessagePriority = 'critical' | 'high' | 'normal' | 'low';

/** Execution environment */
export type ExecutionEnv = 'cloud' | 'local' | 'hybrid';

/** Agent configuration */
export interface AgentConfig {
  /** Unique agent identifier */
  id: string;
  /** Agent role */
  role: AgentRole;
  /** Model to use (e.g., 'claude-opus', 'gemma-7b', 'gemini-flash') */
  model: string;
  /** Execution environment */
  env: ExecutionEnv;
  /** API endpoint (for cloud) or model path (for local) */
  endpoint?: string;
  /** API key (for cloud agents) */
  apiKey?: string;
  /** Max tokens per request */
  maxTokens?: number;
  /** Temperature for sampling */
  temperature?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/** Message between agents */
export interface SwarmMessage {
  /** Unique message ID */
  id: string;
  /** Trace ID for observability */
  traceId: string;
  /** Span ID within trace */
  spanId: string;
  /** Parent span ID */
  parentSpanId?: string;
  /** Sender agent ID */
  from: string;
  /** Recipient agent ID */
  to: string;
  /** Message type */
  type: 'task' | 'result' | 'feedback' | 'error' | 'heartbeat';
  /** Message priority */
  priority: MessagePriority;
  /** Message payload */
  payload: unknown;
  /** Timestamp */
  timestamp: Date;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/** Task definition */
export interface SwarmTask {
  /** Task ID */
  id: string;
  /** Trace ID for observability */
  traceId: string;
  /** Task type */
  type: 'navigate' | 'click' | 'fill' | 'extract' | 'validate' | 'custom';
  /** Target URL or element */
  target: string;
  /** Task parameters */
  params?: Record<string, unknown>;
  /** Context from previous tasks */
  context?: Record<string, unknown>;
  /** Expected outcome */
  expectedOutcome?: string;
  /** Retry count */
  retries?: number;
  /** Priority */
  priority: MessagePriority;
  /** Created at */
  createdAt: Date;
}

/** Task result */
export interface TaskResult {
  /** Task ID */
  taskId: string;
  /** Trace ID */
  traceId: string;
  /** Success status */
  success: boolean;
  /** Result data */
  data?: unknown;
  /** Error if failed */
  error?: string;
  /** Execution duration in ms */
  duration: number;
  /** Agent that executed */
  executedBy: string;
  /** Reasoning steps taken */
  reasoning?: string[];
  /** Selector used (for learning) */
  selectorUsed?: string;
  /** Confidence score */
  confidence?: number;
  /** Completed at */
  completedAt: Date;
}

/** Plan from Planner agent */
export interface ExecutionPlan {
  /** Plan ID */
  id: string;
  /** Trace ID */
  traceId: string;
  /** Goal description */
  goal: string;
  /** Ordered list of tasks */
  tasks: SwarmTask[];
  /** Estimated duration */
  estimatedDuration?: number;
  /** Dependencies between tasks */
  dependencies?: Record<string, string[]>;
  /** Fallback plan if main fails */
  fallbackPlan?: SwarmTask[];
  /** Created at */
  createdAt: Date;
}

/** Critic feedback */
export interface CriticFeedback {
  /** Feedback ID */
  id: string;
  /** Task ID being reviewed */
  taskId: string;
  /** Trace ID */
  traceId: string;
  /** Approval status */
  approved: boolean;
  /** Issue description if not approved */
  issue?: string;
  /** Suggested correction */
  correction?: string;
  /** Severity */
  severity?: 'minor' | 'major' | 'critical';
  /** Created at */
  createdAt: Date;
}

/** Distillation data point for fine-tuning */
export interface DistillationEntry {
  /** Entry ID */
  id: string;
  /** Trace ID */
  traceId: string;
  /** Timestamp */
  timestamp: Date;
  /** Input prompt/context */
  prompt: string;
  /** Successful completion/response */
  completion: string;
  /** Task type */
  taskType: string;
  /** URL domain */
  domain: string;
  /** Reasoning chain */
  reasoning: string[];
  /** Selector that worked */
  selector?: string;
  /** Confidence score */
  confidence: number;
  /** Tags for categorization */
  tags: string[];
  /** Quality score (0-1) */
  quality: number;
}

/** Swarm configuration */
export interface SwarmConfig {
  /** Swarm name */
  name?: string;
  /** Agents configuration */
  agents: AgentConfig[];
  /** Enable distillation logging */
  enableDistillation?: boolean;
  /** Distillation file path */
  distillationPath?: string;
  /** Enable OpenTelemetry */
  enableTracing?: boolean;
  /** Tracing endpoint */
  tracingEndpoint?: string;
  /** Max parallel browsers */
  maxParallelBrowsers?: number;
  /** Enable auto-learning */
  enableLearning?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

/** Trace span for observability */
export interface TraceSpan {
  /** Trace ID */
  traceId: string;
  /** Span ID */
  spanId: string;
  /** Parent span ID */
  parentSpanId?: string;
  /** Operation name */
  operationName: string;
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Duration in ms */
  duration?: number;
  /** Status */
  status: 'ok' | 'error' | 'timeout';
  /** Tags */
  tags: Record<string, string>;
  /** Events/logs */
  events: Array<{
    timestamp: Date;
    name: string;
    attributes?: Record<string, unknown>;
  }>;
}

/** Browser context for parallelism */
export interface BrowserContext {
  /** Context ID */
  id: string;
  /** Browser instance ID */
  browserId: string;
  /** Current URL */
  currentUrl?: string;
  /** Status */
  status: 'available' | 'busy' | 'error';
  /** Assigned agent */
  assignedAgent?: string;
  /** Created at */
  createdAt: Date;
  /** Last used */
  lastUsed?: Date;
}

/** Swarm statistics */
export interface SwarmStats {
  /** Total tasks executed */
  totalTasks: number;
  /** Successful tasks */
  successfulTasks: number;
  /** Failed tasks */
  failedTasks: number;
  /** Average execution time */
  avgExecutionTime: number;
  /** Distillation entries collected */
  distillationEntries: number;
  /** Active agents */
  activeAgents: number;
  /** Active browser contexts */
  activeBrowsers: number;
  /** Success rate */
  successRate: number;
  /** Uptime in ms */
  uptime: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Types are exported above
};
