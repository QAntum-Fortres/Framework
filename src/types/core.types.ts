// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  QANTUM v23.2.0 - Core Type Definitions                                  ║
// ║  "The Local Sovereign" - TypeScript Migration                                 ║
// ║  ZERO TOLERANCE for `any` - Full Type Safety                                  ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// ══════════════════════════════════════════════════════════════════════════════
// CHRONOS ENGINE - Time-Travel Debugging
// ══════════════════════════════════════════════════════════════════════════════

export interface IChronosSnapshot {
  readonly id: string;
  readonly timestamp: number;
  readonly state: Record<string, unknown>;
  readonly domSnapshot?: string;
  readonly networkRequests: INetworkRequest[];
  readonly consoleOutput: IConsoleEntry[];
  readonly metadata: ISnapshotMetadata;
}

export interface INetworkRequest {
  readonly url: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  readonly status: number;
  readonly duration: number;
  readonly requestHeaders: Record<string, string>;
  readonly responseHeaders: Record<string, string>;
  readonly requestBody?: unknown;
  readonly responseBody?: unknown;
}

export interface IConsoleEntry {
  readonly level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  readonly message: string;
  readonly timestamp: number;
  readonly stack?: string;
}

export interface ISnapshotMetadata {
  readonly url: string;
  readonly title: string;
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly scrollX: number;
  readonly scrollY: number;
}

export interface IChronosOptions {
  readonly snapshotInterval?: number;
  readonly maxSnapshots?: number;
  readonly captureNetwork?: boolean;
  readonly captureConsole?: boolean;
  readonly captureDom?: boolean;
}

export interface IChronosEngine {
  start(options?: IChronosOptions): Promise<void>;
  stop(): Promise<IChronosSnapshot[]>;
  pause(): void;
  resume(): void;
  getSnapshots(): IChronosSnapshot[];
  getSnapshotById(id: string): IChronosSnapshot | undefined;
  rewindTo(snapshotId: string): Promise<void>;
  exportTimeline(): string;
  readonly isRecording: boolean;
  readonly snapshotCount: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// SELF-HEALING SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

export type SelectorStrategy = 
  | 'id'
  | 'css'
  | 'xpath'
  | 'text'
  | 'aria-label'
  | 'data-testid'
  | 'shadow-dom'
  | 'visual';

export interface IHealingAttempt {
  readonly originalSelector: string;
  readonly newSelector: string;
  readonly strategy: SelectorStrategy;
  readonly confidence: number;
  readonly timestamp: number;
  readonly success: boolean;
}

export interface IHealingConfig {
  readonly maxAttempts?: number;
  readonly confidenceThreshold?: number;
  readonly strategies?: SelectorStrategy[];
  readonly learningEnabled?: boolean;
  readonly visualMatchingEnabled?: boolean;
}

export interface ISelfHealing {
  heal(selector: string, context?: HTMLElement): Promise<IHealingResult>;
  addKnownPattern(selector: string, element: HTMLElement): void;
  getHealingHistory(): IHealingAttempt[];
  exportPatterns(): string;
  importPatterns(data: string): void;
  configure(config: IHealingConfig): void;
  readonly healingCount: number;
  readonly successRate: number;
}

export interface IHealingResult {
  readonly found: boolean;
  readonly element?: HTMLElement;
  readonly newSelector?: string;
  readonly strategy?: SelectorStrategy;
  readonly confidence: number;
  readonly alternatives: IAlternativeSelector[];
}

export interface IAlternativeSelector {
  readonly selector: string;
  readonly strategy: SelectorStrategy;
  readonly confidence: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN DIRECTOR - Autonomous Test Orchestration
// ══════════════════════════════════════════════════════════════════════════════

export type TestPriority = 'critical' | 'high' | 'medium' | 'low';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'flaky';

export interface ITestCase {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly priority: TestPriority;
  readonly tags: readonly string[];
  readonly timeout?: number;
  readonly retries?: number;
  readonly dependencies?: readonly string[];
  execute(): Promise<ITestResult>;
}

export interface ITestResult {
  readonly testId: string;
  readonly status: TestStatus;
  readonly duration: number;
  readonly error?: Error;
  readonly screenshots?: readonly string[];
  readonly logs?: readonly string[];
  readonly assertions: readonly IAssertion[];
}

export interface IAssertion {
  readonly description: string;
  readonly passed: boolean;
  readonly expected?: unknown;
  readonly actual?: unknown;
  readonly message?: string;
}

export interface ISovereignDirectorConfig {
  readonly parallelism?: number;
  readonly retryStrategy?: 'none' | 'immediate' | 'exponential';
  readonly failFast?: boolean;
  readonly smartOrdering?: boolean;
  readonly thermalAware?: boolean;
}

export interface ISovereignDirector {
  addTest(test: ITestCase): void;
  removeTest(testId: string): boolean;
  execute(filter?: ITestFilter): Promise<ITestSuiteResult>;
  pause(): void;
  resume(): void;
  abort(): void;
  getStatus(): ISuiteStatus;
  configure(config: ISovereignDirectorConfig): void;
  on(event: SovereignEvent, handler: SovereignEventHandler): void;
  off(event: SovereignEvent, handler: SovereignEventHandler): void;
}

export interface ITestFilter {
  readonly tags?: readonly string[];
  readonly priority?: TestPriority;
  readonly pattern?: string | RegExp;
}

export interface ITestSuiteResult {
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly skipped: number;
  readonly flaky: number;
  readonly duration: number;
  readonly results: readonly ITestResult[];
}

export interface ISuiteStatus {
  readonly running: boolean;
  readonly paused: boolean;
  readonly progress: number;
  readonly currentTest?: string;
  readonly eta?: number;
}

export type SovereignEvent = 
  | 'test:start'
  | 'test:pass'
  | 'test:fail'
  | 'test:skip'
  | 'suite:start'
  | 'suite:complete';

export type SovereignEventHandler = (data: unknown) => void;

// ══════════════════════════════════════════════════════════════════════════════
// ACTION EXECUTOR - Browser Automation
// ══════════════════════════════════════════════════════════════════════════════

export type ActionType = 
  | 'click'
  | 'doubleClick'
  | 'rightClick'
  | 'type'
  | 'clear'
  | 'select'
  | 'hover'
  | 'scroll'
  | 'drag'
  | 'upload'
  | 'screenshot'
  | 'wait'
  | 'navigate'
  | 'evaluate';

export interface IAction {
  readonly type: ActionType;
  readonly selector?: string;
  readonly value?: unknown;
  readonly options?: IActionOptions;
}

export interface IActionOptions {
  readonly timeout?: number;
  readonly force?: boolean;
  readonly noWait?: boolean;
  readonly modifiers?: readonly ('Alt' | 'Control' | 'Meta' | 'Shift')[];
  readonly position?: { x: number; y: number };
  readonly delay?: number;
}

export interface IActionResult {
  readonly success: boolean;
  readonly action: IAction;
  readonly duration: number;
  readonly error?: Error;
  readonly screenshot?: string;
  readonly elementInfo?: IElementInfo;
}

export interface IElementInfo {
  readonly tagName: string;
  readonly id?: string;
  readonly className?: string;
  readonly textContent?: string;
  readonly attributes: Record<string, string>;
  readonly boundingBox: IBoundingBox;
  readonly isVisible: boolean;
  readonly isEnabled: boolean;
}

export interface IBoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface IActionExecutor {
  execute(action: IAction): Promise<IActionResult>;
  executeSequence(actions: readonly IAction[]): Promise<readonly IActionResult[]>;
  
  // Convenience methods
  click(selector: string, options?: IActionOptions): Promise<IActionResult>;
  type(selector: string, text: string, options?: IActionOptions): Promise<IActionResult>;
  select(selector: string, value: string | string[], options?: IActionOptions): Promise<IActionResult>;
  hover(selector: string, options?: IActionOptions): Promise<IActionResult>;
  scroll(selector: string, options?: IScrollOptions): Promise<IActionResult>;
  screenshot(options?: IScreenshotOptions): Promise<string>;
  waitFor(selector: string, options?: IWaitOptions): Promise<boolean>;
  navigate(url: string, options?: INavigateOptions): Promise<IActionResult>;
  evaluate<T>(fn: () => T): Promise<T>;
}

export interface IScrollOptions extends IActionOptions {
  readonly direction?: 'up' | 'down' | 'left' | 'right';
  readonly distance?: number;
  readonly behavior?: 'auto' | 'smooth';
}

export interface IScreenshotOptions {
  readonly fullPage?: boolean;
  readonly clip?: IBoundingBox;
  readonly format?: 'png' | 'jpeg' | 'webp';
  readonly quality?: number;
}

export interface IWaitOptions {
  readonly timeout?: number;
  readonly state?: 'visible' | 'hidden' | 'attached' | 'detached';
  readonly polling?: 'raf' | 'mutation' | number;
}

export interface INavigateOptions {
  readonly timeout?: number;
  readonly waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
}

// ══════════════════════════════════════════════════════════════════════════════
// THERMAL AWARE POOL
// ══════════════════════════════════════════════════════════════════════════════

export type ThermalState = 'COOL' | 'WARM' | 'HOT' | 'CRITICAL';

export interface IThermalConfig {
  readonly maxInstances: number;
  readonly coolThreshold: number;
  readonly warmThreshold: number;
  readonly hotThreshold: number;
  readonly criticalThreshold: number;
  readonly checkInterval?: number;
}

export interface IThermalStatus {
  readonly temperature: number;
  readonly state: ThermalState;
  readonly activeInstances: number;
  readonly maxAllowed: number;
  readonly cpuUsage: number;
}

export interface IThermalAwarePool<T> {
  acquire(): Promise<T>;
  release(instance: T): void;
  destroy(instance: T): void;
  getStatus(): IThermalStatus;
  resize(newMax: number): void;
  drain(): Promise<void>;
  on(event: 'thermal-change', handler: (status: IThermalStatus) => void): void;
  readonly size: number;
  readonly available: number;
}

// ══════════════════════════════════════════════════════════════════════════════
// SWARM COMMANDER - Parallel Execution
// ══════════════════════════════════════════════════════════════════════════════

export interface ISwarmTask {
  readonly id: string;
  readonly type: string;
  readonly payload: unknown;
  readonly priority?: number;
  readonly timeout?: number;
}

export interface ISwarmResult {
  readonly taskId: string;
  readonly success: boolean;
  readonly result?: unknown;
  readonly error?: Error;
  readonly duration: number;
  readonly soldierId: string;
}

export interface ISwarmConfig {
  readonly minSoldiers: number;
  readonly maxSoldiers: number;
  readonly taskTimeout: number;
  readonly healthCheckInterval?: number;
}

export interface ISwarmCommander {
  initialize(): Promise<void>;
  queueTask(task: ISwarmTask): Promise<string>;
  getTaskStatus(taskId: string): ITaskStatus | undefined;
  cancelTask(taskId: string): boolean;
  getStats(): ISwarmStats;
  shutdown(): Promise<void>;
  on(event: SwarmEvent, handler: (data: unknown) => void): void;
}

export interface ITaskStatus {
  readonly status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  readonly progress?: number;
  readonly startTime?: number;
  readonly endTime?: number;
}

export interface ISwarmStats {
  readonly activeSoldiers: number;
  readonly queuedTasks: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly avgTaskDuration: number;
}

export type SwarmEvent = 'task:queued' | 'task:started' | 'task:completed' | 'task:failed' | 'soldier:spawned' | 'soldier:terminated';

// ══════════════════════════════════════════════════════════════════════════════
// API SENSEI - Intelligent API Testing
// ══════════════════════════════════════════════════════════════════════════════

export interface IAPISenseiConfig {
  readonly baseUrl: string;
  readonly scenarios: readonly APISenseiScenario[];
  readonly timeout?: number;
  readonly retries?: number;
  readonly headers?: Record<string, string>;
}

export type APISenseiScenario = 
  | 'happy-path'
  | 'edge-cases'
  | 'error-handling'
  | 'security'
  | 'performance';

export interface IAPITestCase {
  readonly name: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly endpoint: string;
  readonly body?: unknown;
  readonly expectedStatus: number;
  readonly assertions?: readonly IAPIAssertion[];
}

export interface IAPIAssertion {
  readonly path: string;
  readonly operator: 'equals' | 'contains' | 'matches' | 'exists' | 'type';
  readonly value: unknown;
}

export interface IAPISenseiResult {
  readonly totalTests: number;
  readonly passed: number;
  readonly failed: number;
  readonly coverage: number;
  readonly tests: readonly IAPITestResult[];
  readonly suggestions: readonly string[];
}

export interface IAPITestResult {
  readonly testCase: IAPITestCase;
  readonly passed: boolean;
  readonly responseTime: number;
  readonly statusCode: number;
  readonly response?: unknown;
  readonly error?: string;
}

export interface IAPISensei {
  configure(config: IAPISenseiConfig): void;
  generateTests(): Promise<readonly IAPITestCase[]>;
  runTests(tests?: readonly IAPITestCase[]): Promise<IAPISenseiResult>;
  analyzeOpenAPI(spec: unknown): Promise<readonly IAPITestCase[]>;
}

// ══════════════════════════════════════════════════════════════════════════════
// PREDICTION MATRIX - Bug Prediction
// ══════════════════════════════════════════════════════════════════════════════

export interface IPredictionInput {
  readonly codeChanges: string;
  readonly fileHistory?: readonly IFileHistory[];
  readonly testResults?: readonly ITestResult[];
}

export interface IFileHistory {
  readonly path: string;
  readonly changes: number;
  readonly bugCount: number;
  readonly lastModified: Date;
}

export interface IPredictionResult {
  readonly riskScore: number;
  readonly affectedAreas: readonly IAffectedArea[];
  readonly suggestedTests: readonly string[];
  readonly confidence: number;
}

export interface IAffectedArea {
  readonly module: string;
  readonly risk: 'low' | 'medium' | 'high' | 'critical';
  readonly reason: string;
}

export interface IPredictionMatrix {
  analyze(input: IPredictionInput): Promise<IPredictionResult>;
  train(historicalData: readonly IHistoricalBug[]): Promise<void>;
  getModelInfo(): IModelInfo;
}

export interface IHistoricalBug {
  readonly commit: string;
  readonly files: readonly string[];
  readonly severity: 'minor' | 'major' | 'critical';
  readonly resolved: boolean;
}

export interface IModelInfo {
  readonly version: string;
  readonly trainedOn: number;
  readonly accuracy: number;
  readonly lastUpdated: Date;
}

// ══════════════════════════════════════════════════════════════════════════════
// LICENSE MANAGER
// ══════════════════════════════════════════════════════════════════════════════

export type LicenseType = 'trial' | 'professional' | 'enterprise' | 'sovereign';

export interface ILicenseInfo {
  readonly type: LicenseType;
  readonly valid: boolean;
  readonly expiresAt?: Date;
  readonly maxInstances: number;
  readonly features: readonly string[];
  readonly hardwareId: string;
}

export interface ILicenseManager {
  validate(): Promise<ILicenseInfo>;
  activate(key: string): Promise<boolean>;
  deactivate(): Promise<void>;
  getStatus(): ILicenseInfo;
  checkFeature(feature: string): boolean;
  readonly isActivated: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// FINANCIAL ORACLE
// ══════════════════════════════════════════════════════════════════════════════

export interface IFinancialStats {
  readonly totalCost: number;
  readonly totalRequests: number;
  readonly budgetRemaining: number;
  readonly costByProvider: Record<string, number>;
  readonly costByModel: Record<string, number>;
  readonly averageCostPerRequest: number;
}

export interface IFinancialOracle {
  trackRequest(provider: string, model: string, cost: number): void;
  setBudget(amount: number): void;
  getStats(): IFinancialStats;
  reset(): void;
  on(event: 'budget-warning' | 'budget-exceeded', handler: (stats: IFinancialStats) => void): void;
}

// ══════════════════════════════════════════════════════════════════════════════
// QANTUM - Main Interface
// ══════════════════════════════════════════════════════════════════════════════

export interface IQAntumConfig {
  readonly verbose?: boolean;
  readonly headless?: boolean;
  readonly browser?: 'chromium' | 'firefox' | 'webkit';
  readonly timeout?: number;
  readonly retries?: number;
  readonly screenshots?: boolean;
  readonly video?: boolean;
  readonly tracing?: boolean;
}

export interface IQAntum {
  // Core Methods
  audit(url: string): Promise<IAuditResult>;
  testAPI(endpoint: string, options?: IAPITestOptions): Promise<IAPITestResult>;
  checkLinks(url: string, options?: ILinkCheckOptions): Promise<ILinkCheckResult>;
  
  // Pro Methods
  predict(options: IPredictionInput): Promise<IPredictionResult>;
  chronos(options?: IChronosOptions): IChronosEngine;
  apiSensei(config: IAPISenseiConfig): IAPISensei;
  
  // Semantic Actions
  smartClick(description: string): Promise<IActionResult>;
  smartFill(description: string, value: string): Promise<IActionResult>;
  executeGoal(goal: string): Promise<IGoalResult>;
  
  // Status
  getLicenseStatus(): ILicenseInfo;
  getFinancialStats(): IFinancialStats;
  getCircuitBreakerState(): ICircuitBreakerState;
  
  // Logger
  getLogger(): ILogger;
}

export interface IAuditResult {
  readonly url: string;
  readonly performance: number;
  readonly accessibility: number;
  readonly seo: number;
  readonly bestPractices: number;
  readonly loadTime: number;
  readonly resourceCount: number;
  readonly issues: readonly IAuditIssue[];
}

export interface IAuditIssue {
  readonly category: 'performance' | 'accessibility' | 'seo' | 'best-practices';
  readonly severity: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly selector?: string;
}

export interface IAPITestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly timeout?: number;
}

export interface ILinkCheckOptions {
  readonly maxLinks?: number;
  readonly followRedirects?: boolean;
  readonly timeout?: number;
  readonly checkExternal?: boolean;
}

export interface ILinkCheckResult {
  readonly url: string;
  readonly totalLinks: number;
  readonly validLinks: number;
  readonly brokenLinks: readonly IBrokenLink[];
  readonly redirects: readonly IRedirect[];
}

export interface IBrokenLink {
  readonly url: string;
  readonly status: number;
  readonly source: string;
}

export interface IRedirect {
  readonly from: string;
  readonly to: string;
  readonly status: number;
}

export interface IGoalResult {
  readonly success: boolean;
  readonly steps: readonly IGoalStep[];
  readonly duration: number;
  readonly screenshot?: string;
}

export interface IGoalStep {
  readonly description: string;
  readonly action: IAction;
  readonly result: IActionResult;
}

export interface ICircuitBreakerState {
  readonly state: 'closed' | 'open' | 'half-open';
  readonly failures: number;
  readonly lastFailure?: Date;
  readonly nextAttempt?: Date;
}

export interface ILogger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: Error): void;
  audit(action: string, result: string, data?: unknown): void;
  getLogs(level?: string, limit?: number): readonly ILogEntry[];
  clear(): void;
}

export interface ILogEntry {
  readonly timestamp: Date;
  readonly level: 'debug' | 'info' | 'warn' | 'error' | 'audit';
  readonly message: string;
  readonly data?: unknown;
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ══════════════════════════════════════════════════════════════════════════════

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export type Nullable<T> = T | null;

export type AsyncResult<T> = Promise<{ success: true; data: T } | { success: false; error: Error }>;
