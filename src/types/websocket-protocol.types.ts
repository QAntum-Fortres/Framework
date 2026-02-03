// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  QANTUM v23.3.0 - WebSocket Protocol Type Definitions                    ║
// ║  "Type-Safe Sovereign" - Neural HUD API Contract                              ║
// ║  SHARED BETWEEN FRONTEND & BACKEND - Single Source of Truth                   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════════════════════
// NEURAL HUD - BRAIN WAVES PROTOCOL
// Real-time cognitive metrics from AI agents
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Brain activity types representing different cognitive states
 */
export type BrainActivityType = 
  | 'IDLE'           // No active processing
  | 'ANALYZING'      // Analyzing input/page
  | 'PLANNING'       // Creating execution plan
  | 'EXECUTING'      // Running actions
  | 'LEARNING'       // Distillation/training
  | 'HEALING'        // Self-healing selectors
  | 'PREDICTING'     // Bug prediction
  | 'OPTIMIZING';    // Performance tuning

/**
 * Cognitive load levels (0-100 scale)
 */
export type CognitiveLoadLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Single brain wave data point
 */
export interface IBrainWave {
  /** Unique wave identifier */
  readonly id: string;
  /** Timestamp in milliseconds since epoch */
  readonly timestamp: number;
  /** Current activity type */
  readonly activity: BrainActivityType;
  /** Cognitive load percentage (0-100) */
  readonly cognitiveLoad: number;
  /** Load level classification */
  readonly loadLevel: CognitiveLoadLevel;
  /** Active agent ID if applicable */
  readonly agentId?: string;
  /** Current task being processed */
  readonly currentTask?: string;
  /** Processing confidence (0-1) */
  readonly confidence: number;
  /** Neural pathway activation map */
  readonly pathways: INeuralPathway[];
}

/**
 * Neural pathway activation data
 */
export interface INeuralPathway {
  /** Pathway identifier */
  readonly id: string;
  /** Pathway name (e.g., 'semantic-core', 'self-healing', 'prediction') */
  readonly name: string;
  /** Activation level (0-1) */
  readonly activation: number;
  /** Connections to other pathways */
  readonly connections: readonly string[];
}

/**
 * Brain waves batch for efficient transmission
 */
export interface IBrainWavesBatch {
  /** Batch ID */
  readonly batchId: string;
  /** Start timestamp */
  readonly startTime: number;
  /** End timestamp */
  readonly endTime: number;
  /** Wave data points */
  readonly waves: readonly IBrainWave[];
  /** Aggregated metrics */
  readonly aggregated: IBrainWavesAggregated;
}

/**
 * Aggregated brain waves metrics
 */
export interface IBrainWavesAggregated {
  /** Average cognitive load */
  readonly avgCognitiveLoad: number;
  /** Peak cognitive load */
  readonly peakCognitiveLoad: number;
  /** Dominant activity type */
  readonly dominantActivity: BrainActivityType;
  /** Activity distribution */
  readonly activityDistribution: Record<BrainActivityType, number>;
  /** Average confidence */
  readonly avgConfidence: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// NEURAL HUD - HARDWARE TELEMETRY PROTOCOL
// Real-time system metrics from the host machine
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Thermal state classification
 */
export type ThermalState = 'COOL' | 'WARM' | 'HOT' | 'CRITICAL';

/**
 * GPU vendor identification
 */
export type GPUVendor = 'NVIDIA' | 'AMD' | 'Intel' | 'Apple' | 'Unknown';

/**
 * CPU metrics snapshot
 */
export interface ICPUTelemetry {
  /** CPU model name */
  readonly model: string;
  /** Number of physical cores */
  readonly cores: number;
  /** Number of logical threads */
  readonly threads: number;
  /** Current clock speed in MHz */
  readonly clockSpeed: number;
  /** Base clock speed in MHz */
  readonly baseClockSpeed: number;
  /** Boost clock speed in MHz */
  readonly boostClockSpeed: number;
  /** CPU usage percentage per core */
  readonly usagePerCore: readonly number[];
  /** Overall CPU usage percentage */
  readonly totalUsage: number;
  /** CPU temperature in Celsius */
  readonly temperature: number;
  /** Thermal state */
  readonly thermalState: ThermalState;
}

/**
 * GPU metrics snapshot
 */
export interface IGPUTelemetry {
  /** GPU model name */
  readonly model: string;
  /** GPU vendor */
  readonly vendor: GPUVendor;
  /** VRAM total in MB */
  readonly vramTotal: number;
  /** VRAM used in MB */
  readonly vramUsed: number;
  /** VRAM usage percentage */
  readonly vramUsage: number;
  /** GPU core usage percentage */
  readonly coreUsage: number;
  /** GPU temperature in Celsius */
  readonly temperature: number;
  /** Thermal state */
  readonly thermalState: ThermalState;
  /** Power draw in Watts */
  readonly powerDraw: number;
  /** Fan speed percentage */
  readonly fanSpeed: number;
  /** CUDA/ROCm cores count */
  readonly computeCores?: number;
}

/**
 * Memory metrics snapshot
 */
export interface IMemoryTelemetry {
  /** Total RAM in MB */
  readonly totalRam: number;
  /** Used RAM in MB */
  readonly usedRam: number;
  /** Free RAM in MB */
  readonly freeRam: number;
  /** RAM usage percentage */
  readonly usage: number;
  /** Swap total in MB */
  readonly swapTotal: number;
  /** Swap used in MB */
  readonly swapUsed: number;
  /** Heap used by Node.js in MB */
  readonly heapUsed: number;
  /** Heap total for Node.js in MB */
  readonly heapTotal: number;
  /** External memory in MB */
  readonly external: number;
}

/**
 * Disk metrics snapshot
 */
export interface IDiskTelemetry {
  /** Disk identifier */
  readonly id: string;
  /** Mount point */
  readonly mountPoint: string;
  /** Filesystem type */
  readonly filesystem: string;
  /** Total size in GB */
  readonly total: number;
  /** Used space in GB */
  readonly used: number;
  /** Free space in GB */
  readonly free: number;
  /** Usage percentage */
  readonly usage: number;
  /** Is SSD */
  readonly isSSD: boolean;
  /** Read speed in MB/s (if available) */
  readonly readSpeed?: number;
  /** Write speed in MB/s (if available) */
  readonly writeSpeed?: number;
}

/**
 * Network metrics snapshot
 */
export interface INetworkTelemetry {
  /** Interface name */
  readonly interface: string;
  /** IP address */
  readonly ip: string;
  /** MAC address */
  readonly mac: string;
  /** Bytes received total */
  readonly bytesReceived: number;
  /** Bytes sent total */
  readonly bytesSent: number;
  /** Current download speed in KB/s */
  readonly downloadSpeed: number;
  /** Current upload speed in KB/s */
  readonly uploadSpeed: number;
  /** Packets received */
  readonly packetsReceived: number;
  /** Packets sent */
  readonly packetsSent: number;
  /** Errors count */
  readonly errors: number;
}

/**
 * Complete hardware telemetry snapshot
 */
export interface IHardwareTelemetry {
  /** Unique telemetry ID */
  readonly id: string;
  /** Timestamp in milliseconds */
  readonly timestamp: number;
  /** Host machine name */
  readonly hostname: string;
  /** Operating system */
  readonly os: string;
  /** OS version */
  readonly osVersion: string;
  /** CPU metrics */
  readonly cpu: ICPUTelemetry;
  /** GPU metrics (if available) */
  readonly gpu?: IGPUTelemetry;
  /** Memory metrics */
  readonly memory: IMemoryTelemetry;
  /** Disk metrics */
  readonly disks: readonly IDiskTelemetry[];
  /** Network metrics */
  readonly network: readonly INetworkTelemetry[];
  /** System uptime in seconds */
  readonly uptime: number;
  /** QAntum process metrics */
  readonly process: IProcessTelemetry;
}

/**
 * QAntum process metrics
 */
export interface IProcessTelemetry {
  /** Process ID */
  readonly pid: number;
  /** Process CPU usage percentage */
  readonly cpuUsage: number;
  /** Process memory usage in MB */
  readonly memoryUsage: number;
  /** Process uptime in seconds */
  readonly uptime: number;
  /** Active browser instances */
  readonly browserInstances: number;
  /** Active worker threads */
  readonly workerThreads: number;
  /** Pending tasks in queue */
  readonly pendingTasks: number;
  /** Completed tasks total */
  readonly completedTasks: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// WEBSOCKET MESSAGE PROTOCOL
// Bidirectional communication between Dashboard and Server
// ══════════════════════════════════════════════════════════════════════════════

/**
 * WebSocket message types
 */
export type WSMessageType =
  // Client → Server
  | 'SUBSCRIBE'
  | 'UNSUBSCRIBE'
  | 'REQUEST_SNAPSHOT'
  | 'EXECUTE_COMMAND'
  | 'PING'
  // Server → Client
  | 'BRAIN_WAVES'
  | 'HARDWARE_TELEMETRY'
  | 'TEST_UPDATE'
  | 'LOG_ENTRY'
  | 'ALERT'
  | 'SNAPSHOT'
  | 'COMMAND_RESULT'
  | 'PONG'
  | 'ERROR';

/**
 * Subscription channels
 */
export type WSChannel =
  | 'brain-waves'
  | 'hardware-telemetry'
  | 'test-execution'
  | 'logs'
  | 'alerts'
  | 'all';

/**
 * Base WebSocket message structure
 */
export interface IWSMessage<T = unknown> {
  /** Message type */
  readonly type: WSMessageType;
  /** Unique message ID */
  readonly id: string;
  /** Timestamp */
  readonly timestamp: number;
  /** Payload data */
  readonly payload: T;
  /** Correlation ID for request/response matching */
  readonly correlationId?: string;
}

/**
 * Subscribe message payload
 */
export interface IWSSubscribePayload {
  /** Channels to subscribe to */
  readonly channels: readonly WSChannel[];
  /** Update interval in milliseconds */
  readonly interval?: number;
  /** Include historical data */
  readonly includeHistory?: boolean;
}

/**
 * Unsubscribe message payload
 */
export interface IWSUnsubscribePayload {
  /** Channels to unsubscribe from */
  readonly channels: readonly WSChannel[];
}

/**
 * Execute command payload
 */
export interface IWSExecuteCommandPayload {
  /** Command name */
  readonly command: string;
  /** Command arguments */
  readonly args?: Record<string, unknown>;
  /** Timeout in milliseconds */
  readonly timeout?: number;
}

/**
 * Command result payload
 */
export interface IWSCommandResultPayload {
  /** Command that was executed */
  readonly command: string;
  /** Success status */
  readonly success: boolean;
  /** Result data */
  readonly result?: unknown;
  /** Error message if failed */
  readonly error?: string;
  /** Execution duration in ms */
  readonly duration: number;
}

/**
 * Alert payload
 */
export interface IWSAlertPayload {
  /** Alert severity */
  readonly severity: 'info' | 'warning' | 'error' | 'critical';
  /** Alert title */
  readonly title: string;
  /** Alert message */
  readonly message: string;
  /** Source component */
  readonly source: string;
  /** Additional data */
  readonly data?: Record<string, unknown>;
  /** Is dismissible */
  readonly dismissible: boolean;
  /** Auto-dismiss after ms (0 = never) */
  readonly autoDismiss: number;
}

/**
 * Log entry payload (matches existing Logger interface)
 */
export interface IWSLogPayload {
  /** Log level */
  readonly level: 'debug' | 'info' | 'warn' | 'error' | 'audit';
  /** Log message */
  readonly message: string;
  /** Component that logged */
  readonly component: string;
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
  /** Trace ID for correlation */
  readonly traceId?: string;
}

/**
 * Test execution update payload
 */
export interface IWSTestUpdatePayload {
  /** Test suite ID */
  readonly suiteId: string;
  /** Test case ID */
  readonly testId: string;
  /** Test name */
  readonly name: string;
  /** Current status */
  readonly status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  /** Duration so far in ms */
  readonly duration: number;
  /** Error message if failed */
  readonly error?: string;
  /** Screenshot path if available */
  readonly screenshot?: string;
  /** Progress percentage (0-100) */
  readonly progress: number;
  /** Current step description */
  readonly currentStep?: string;
}

/**
 * Error payload
 */
export interface IWSErrorPayload {
  /** Error code */
  readonly code: string;
  /** Error message */
  readonly message: string;
  /** Original message ID that caused error */
  readonly originalMessageId?: string;
  /** Stack trace (development only) */
  readonly stack?: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// TYPE-SAFE MESSAGE CONSTRUCTORS
// Helper types for creating properly typed messages
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Type-safe message map for payload types
 */
export interface WSMessagePayloadMap {
  'SUBSCRIBE': IWSSubscribePayload;
  'UNSUBSCRIBE': IWSUnsubscribePayload;
  'REQUEST_SNAPSHOT': { channel: WSChannel };
  'EXECUTE_COMMAND': IWSExecuteCommandPayload;
  'PING': { clientTime: number };
  'BRAIN_WAVES': IBrainWavesBatch;
  'HARDWARE_TELEMETRY': IHardwareTelemetry;
  'TEST_UPDATE': IWSTestUpdatePayload;
  'LOG_ENTRY': IWSLogPayload;
  'ALERT': IWSAlertPayload;
  'SNAPSHOT': { channel: WSChannel; data: unknown };
  'COMMAND_RESULT': IWSCommandResultPayload;
  'PONG': { serverTime: number; latency: number };
  'ERROR': IWSErrorPayload;
}

/**
 * Create a type-safe WebSocket message
 */
export type TypedWSMessage<T extends WSMessageType> = IWSMessage<WSMessagePayloadMap[T]>;

/**
 * WebSocket connection state
 */
export type WSConnectionState = 
  | 'CONNECTING'
  | 'CONNECTED'
  | 'AUTHENTICATED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

/**
 * WebSocket client configuration
 */
export interface IWSClientConfig {
  /** Server URL */
  readonly url: string;
  /** Reconnect automatically */
  readonly autoReconnect: boolean;
  /** Reconnect interval in ms */
  readonly reconnectInterval: number;
  /** Max reconnect attempts */
  readonly maxReconnectAttempts: number;
  /** Heartbeat interval in ms */
  readonly heartbeatInterval: number;
  /** Message timeout in ms */
  readonly messageTimeout: number;
}

/**
 * WebSocket server configuration
 */
export interface IWSServerConfig {
  /** Port number */
  readonly port: number;
  /** Host address */
  readonly host: string;
  /** Max connections */
  readonly maxConnections: number;
  /** Require authentication */
  readonly requireAuth: boolean;
  /** Allowed origins (CORS) */
  readonly allowedOrigins: readonly string[];
  /** Rate limit (messages per second) */
  readonly rateLimit: number;
  /** Compression enabled */
  readonly compression: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATE TYPES
// Frontend state management types
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Dashboard view modes
 */
export type DashboardView = 
  | 'overview'
  | 'brain-waves'
  | 'hardware'
  | 'tests'
  | 'logs'
  | 'settings';

/**
 * Dashboard theme
 */
export type DashboardTheme = 'dark' | 'light' | 'system';

/**
 * Dashboard state
 */
export interface IDashboardState {
  /** Current view */
  readonly view: DashboardView;
  /** Theme */
  readonly theme: DashboardTheme;
  /** WebSocket connection state */
  readonly connectionState: WSConnectionState;
  /** Active subscriptions */
  readonly subscriptions: readonly WSChannel[];
  /** Latest brain waves */
  readonly brainWaves: readonly IBrainWave[];
  /** Latest hardware telemetry */
  readonly hardwareTelemetry: IHardwareTelemetry | null;
  /** Test execution state */
  readonly tests: readonly IWSTestUpdatePayload[];
  /** Recent logs */
  readonly logs: readonly IWSLogPayload[];
  /** Active alerts */
  readonly alerts: readonly IWSAlertPayload[];
  /** Is sidebar collapsed */
  readonly sidebarCollapsed: boolean;
  /** Selected language */
  readonly language: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Message ID generator type
 */
export type MessageIdGenerator = () => string;

/**
 * Timestamp generator type
 */
export type TimestampGenerator = () => number;
