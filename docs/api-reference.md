<!-- 
═══════════════════════════════════════════════════════════════════════════════
QAntum v23.0.0 "The Local Sovereign" - API Reference
© 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

# 📚 QAntum API Reference

## v23.0.0 "The Local Sovereign"

---

## 📋 Table of Contents

1. [Core Classes](#-core-classes)
2. [Browser Module](#️-browser-module)
3. [AI Module](#-ai-module)
4. [Locators Module](#-locators-module)
5. [Enterprise Module](#-enterprise-module)
6. [Utils Module](#-utils-module)
7. [Types Reference](#-types-reference)

---

## 🎯 Core Classes

### TestFramework

Main test orchestration class.

```typescript
import { TestFramework } from './src/core/test-framework';

const framework = new TestFramework(config?: TestConfig);

// Methods
await framework.run(test: TestDefinition): Promise<TestResult>;
await framework.runSuite(suite: TestSuite): Promise<SuiteResult>;
framework.setReporter(reporter: Reporter): void;
framework.getMetrics(): TestMetrics;
```

### StepRecorder

Records user interactions for playback.

```typescript
import { StepRecorder } from './src/core/step-recorder';

const recorder = new StepRecorder(options?: RecorderOptions);

await recorder.start(url: string): Promise<void>;
await recorder.stop(): Promise<Step[]>;
await recorder.export(format: 'json' | 'ts'): Promise<string>;
```

### SelfHealingEngine

AI-powered element healing.

```typescript
import { SelfHealingEngine } from './src/core/self-healing-engine';

const engine = new SelfHealingEngine(config?: HealingConfig);

await engine.heal(brokenLocator: string): Promise<HealResult>;
engine.setStrategy(strategy: HealingStrategy): void;
engine.getHealingHistory(): HealingRecord[];
```

---

## 🖥️ Browser Module

### BrowserController

Browser automation controller.

```typescript
import { BrowserController } from './src/browser/browser-controller';

const browser = new BrowserController(config: BrowserConfig);

// Lifecycle
await browser.launch(): Promise<void>;
await browser.close(): Promise<void>;

// Navigation
await browser.navigate(url: string): Promise<void>;
await browser.refresh(): Promise<void>;
await browser.back(): Promise<void>;

// Actions
await browser.click(selector: string): Promise<void>;
await browser.type(selector: string, text: string): Promise<void>;
await browser.select(selector: string, value: string): Promise<void>;

// Screenshots
await browser.screenshot(path: string): Promise<string>;
await browser.pdf(path: string): Promise<string>;
```

### BrowserConfig

```typescript
interface BrowserConfig {
    browser: 'chrome' | 'firefox' | 'edge' | 'safari';
    headless?: boolean;
    timeout?: number;
    viewport?: { width: number; height: number };
    args?: string[];
}
```

---

## 🤖 AI Module

### AIReasoningCore

Multi-model AI orchestration.

```typescript
import { AIReasoningCore } from './src/ai/ai-reasoning-core';

const ai = new AIReasoningCore(config?: AIConfig);

await ai.analyze(context: AnalysisContext): Promise<AIInsight>;
await ai.suggest(problem: Problem): Promise<Suggestion[]>;
await ai.explain(result: TestResult): Promise<string>;
```

### UniversalPatternMatcher

Pattern matching for test generation.

```typescript
import { UniversalPatternMatcher } from './src/ai/universal-pattern-matcher';

const matcher = new UniversalPatternMatcher();

const patterns = matcher.analyze(html: string): Pattern[];
const locators = matcher.generateLocators(element: Element): LocatorSet;
```

---

## 🎯 Locators Module

### LocatorGenerator

Generate robust locators for elements.

```typescript
import { LocatorGenerator } from './src/locators/locator-generator';

const generator = new LocatorGenerator();

const locator = generator.generate(element: Element): Locator;
const ranked = generator.rank(locators: Locator[]): RankedLocator[];
```

### Supported Locator Types

| Type | Example | Reliability |
|------|---------|-------------|
| **ID** | `#submit-btn` | ⭐⭐⭐⭐⭐ |
| **Data-testid** | `[data-testid="submit"]` | ⭐⭐⭐⭐⭐ |
| **CSS** | `.btn.primary` | ⭐⭐⭐⭐ |
| **XPath** | `//button[@type='submit']` | ⭐⭐⭐ |
| **Text** | `text=Submit` | ⭐⭐⭐ |

---

## 🏢 Enterprise Module

### ThermalAwarePool

Temperature-based parallelism manager.

```typescript
import { ThermalAwarePool } from './src/enterprise/thermal-aware-pool';

const pool = new ThermalAwarePool(options: ThermalPoolOptions);

await pool.start(): Promise<void>;
await pool.stop(): Promise<void>;
pool.getInstance(): BrowserInstance | null;
pool.releaseInstance(instance: BrowserInstance): void;
pool.getState(): ThermalState;
pool.getMetrics(): ThermalMetrics;
```

### DockerManager

Docker Selenium Grid orchestration.

```typescript
import { DockerManager } from './src/enterprise/docker-manager';

const docker = new DockerManager(config: DockerConfig);

await docker.generateDockerfile(): Promise<string>;
await docker.generateDockerCompose(): Promise<string>;
await docker.startGrid(): Promise<void>;
await docker.stopGrid(): Promise<void>;
docker.getContainerStatus(): ContainerStatus[];
```

### SwarmCommander

Commander-Soldier parallel execution.

```typescript
import { SwarmCommander } from './src/enterprise/swarm-commander';

const commander = new SwarmCommander(options: SwarmOptions);

await commander.initialize(): Promise<void>;
await commander.shutdown(): Promise<void>;
await commander.queueTask(task: SwarmTask): Promise<string>;
commander.onTaskComplete(handler: TaskHandler): void;
commander.getSoldierCount(): number;
commander.getActiveTaskCount(): number;
```

### BulgarianTTS

Bulgarian text-to-speech.

```typescript
import { BulgarianTTS } from './src/enterprise/bulgarian-tts';

const tts = new BulgarianTTS(config?: TTSConfig);

await tts.initialize(): Promise<void>;
await tts.speak(text: string): Promise<void>;
await tts.speakTemplate(template: string, params?: object): Promise<void>;
tts.setVolume(volume: number): void;
tts.stop(): void;
```

### DashboardServer

Real-time WebSocket dashboard.

```typescript
import { DashboardServer } from './src/enterprise/dashboard-server';

const dashboard = new DashboardServer(config?: DashboardConfig);

await dashboard.start(): Promise<void>;
await dashboard.stop(): Promise<void>;
dashboard.logActivity(message: string): void;
dashboard.logSuccess(message: string): void;
dashboard.logWarning(message: string): void;
dashboard.logError(message: string): void;
dashboard.updateState(partial: Partial<DashboardState>): void;
```

### LicenseManager

Hardware-locked licensing.

```typescript
import { LicenseManager } from './src/enterprise/license-manager';

const license = new LicenseManager();

const hwId = license.generateHardwareId(): string;
license.loadLicense(path: string): void;
const result = license.validate(): ValidationResult;
const hasFeature = license.checkFeature(feature: string): boolean;
license.getLicenseInfo(): LicenseInfo | null;
```

---

## 🛠️ Utils Module

### Logger

Structured logging with levels.

```typescript
import { Logger } from './src/utils/logger';

const logger = new Logger('ModuleName');

logger.info('Message', data?: object);
logger.warn('Message', data?: object);
logger.error('Message', error?: Error);
logger.debug('Message', data?: object);
```

### ConfigManager

Configuration management.

```typescript
import { ConfigManager } from './src/utils/config-manager';

const config = ConfigManager.load('.QAntumrc');
const value = config.get<T>('key', defaultValue);
config.set('key', value);
config.save();
```

---

## 📦 Types Reference

### Core Types

```typescript
interface TestDefinition {
    name: string;
    url: string;
    actions: Action[];
    assertions?: Assertion[];
    timeout?: number;
}

interface TestResult {
    passed: boolean;
    duration: number;
    steps: StepResult[];
    error?: Error;
    screenshots?: string[];
}

interface Step {
    type: 'click' | 'type' | 'wait' | 'navigate' | 'assert';
    target?: string;
    value?: string;
    duration?: number;
}
```

### Enterprise Types

```typescript
interface ThermalPoolOptions {
    maxInstances: number;
    updateInterval: number;
    coolThreshold: number;
    warmThreshold: number;
    hotThreshold: number;
    criticalThreshold: number;
}

interface SwarmTask {
    id: string;
    type: string;
    payload: unknown;
    priority?: number;
}

interface LicenseInfo {
    type: 'trial' | 'professional' | 'enterprise' | 'sovereign';
    owner: string;
    hardwareId: string;
    expiresAt: Date;
    features: string[];
}
```

---

## 🔧 Configuration Files

### .QAntumrc

```json
{
    "browser": "chrome",
    "headless": false,
    "timeout": 30000,
    "parallel": 4,
    "dashboard": {
        "port": 3847
    },
    "thermal": {
        "maxInstances": 40,
        "coolThreshold": 60
    }
}
```

### tsconfig.json

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "module": "NodeNext",
        "strict": true,
        "outDir": "dist"
    }
}
```

---

**© 2025 Димитър Продромов. All Rights Reserved.**
