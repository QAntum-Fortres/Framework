<!-- 
═══════════════════════════════════════════════════════════════════════════════
MisterMind v23.0.0 "The Local Sovereign"
© 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

<div align="center">

```
███╗   ███╗██╗███████╗████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗██████╗ 
████╗ ████║██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗
██╔████╔██║██║███████╗   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║██║  ██║
██║╚██╔╝██║██║╚════██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██║  ██║
██║ ╚═╝ ██║██║███████║   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██████╔╝
╚═╝     ╚═╝╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ 
```

### **v23.0.0 "The Local Sovereign"**

[![Version](https://img.shields.io/badge/version-23.0.0-blue?style=for-the-badge)](https://github.com/papica777-eng/MrMindQATool)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-492%20Passing-brightgreen?style=for-the-badge)]()
[![Lines](https://img.shields.io/badge/Lines-45,895-orange?style=for-the-badge)]()

**AI-Powered QA Automation Framework**

*The framework that predicts bugs before they happen*

[Quick Start](#-quick-start) • [Features](#-features) • [Dashboard](#-dashboard) • [Enterprise](#-enterprise-modules) • [API](#-api-reference)

---

**🇧🇬 Създадено с ❤️ в България | Made with ❤️ in Bulgaria**

</div>

---

## 📋 Table of Contents

- [What is MisterMind?](#-what-is-mistermind)
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Enterprise Modules](#-enterprise-modules)
- [Dashboard](#-dashboard)
- [API Reference](#-api-reference)
- [Statistics](#-statistics)
- [License](#-license)

---

## 🧠 What is MisterMind?

MisterMind is an **enterprise-grade QA automation framework** built in TypeScript that uses local AI models, thermal-aware execution, and intelligent test orchestration.

> *🇧🇬 MisterMind е професионална QA рамка с изкуствен интелект, която работи локално без облачни зависимости.*

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **🤖 Local AI** | Ollama + Whisper integration, no cloud dependency |
| **🌡️ Thermal Aware** | CPU throttling based on hardware temperature |
| **🐳 Docker Grid** | Auto-orchestrated Selenium/Playwright containers |
| **🎖️ Swarm Execution** | Commander-Soldier parallel architecture |
| **🔊 Bulgarian TTS** | Native text-to-speech in Bulgarian |
| **🎛️ Real-time Dashboard** | WebSocket monitoring at localhost:3847 |
| **🔐 Hardware Licensing** | SHA-256 hardware-locked license keys |

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+
npm 9+
Docker (optional)
Ollama (optional)
```

### Installation

```bash
# Clone
git clone https://github.com/papica777-eng/MrMindQATool.git
cd MrMindQATool

# Install
npm install

# Build
npm run build

# Test
npm test

# Dashboard
npm run dashboard
```

> *🇧🇬 След npm run dashboard отвори http://localhost:3847 за да видиш таблото.*

### Basic Usage

```typescript
import { MisterMind, printBanner } from './src/index';

// Show banner
printBanner({ compact: true });

// Create instance
const mm = new MisterMind({ verbose: true });

// Audit a website
const result = await mm.audit('https://example.com');
console.log(`Performance: ${result.performance}/100`);
console.log(`Accessibility: ${result.accessibility}/100`);
console.log(`SEO: ${result.seo}/100`);

// Test an API
const api = await mm.testAPI('https://api.example.com/health');
console.log(`Status: ${api.status}, Time: ${api.responseTime}ms`);
```

---

## ✨ Features

### 🆓 Free Features

| Feature | Description |
|---------|-------------|
| **Website Audit** | Performance, accessibility, SEO analysis |
| **API Testing** | HTTP request testing with timing |
| **Link Checker** | Find broken links on any page |
| **Browser Factory** | Chromium, Firefox, WebKit support |

### 💎 Pro Features

| Feature | Description |
|---------|-------------|
| **Prediction Matrix** | AI-powered bug prediction |
| **API Sensei** | Intelligent API test generation |
| **Chronos Engine** | Time-travel debugging |
| **Sovereign Swarm** | Multi-agent orchestration |
| **Semantic Core** | Intent-based element finding |

> *🇧🇬 Pro функциите изискват лицензен ключ. Безплатните работят веднага.*

---

## 🏢 Enterprise Modules

MisterMind v23.0.0 includes 6 enterprise-grade modules:

### 1. 🌡️ Thermal-Aware Pool

Automatically adjusts parallelism based on CPU temperature.

```typescript
import { ThermalAwarePool } from './src/enterprise/thermal-aware-pool';

const pool = new ThermalAwarePool({
  maxInstances: 40,
  coolThreshold: 60,
  hotThreshold: 80
});

await pool.start();
```

| State | Temperature | Instances |
|-------|-------------|-----------|
| COOL | <60°C | 40 |
| WARM | 60-70°C | 30 |
| HOT | 70-80°C | 20 |
| CRITICAL | >80°C | 10 |

> *🇧🇬 Термалният контрол пази хардуера ти от прегряване при масивни тестове.*

---

### 2. 🐳 Docker Manager

Auto-generates Selenium Grid configuration.

```typescript
import { DockerManager } from './src/enterprise/docker-manager';

const docker = new DockerManager({
  hubPort: 4444,
  chromeNodes: 4,
  firefoxNodes: 2
});

await docker.generateDockerCompose();
await docker.startGrid();
```

---

### 3. 🎖️ Swarm Commander

Commander-Soldier pattern for parallel execution.

```typescript
import { SwarmCommander } from './src/enterprise/swarm-commander';

const commander = new SwarmCommander({
  minSoldiers: 4,
  maxSoldiers: 40
});

await commander.initialize();
await commander.queueTask({
  id: 'test-001',
  type: 'browser-test',
  payload: { url: 'https://example.com' }
});
```

> *🇧🇬 Командирът разпределя задачите между войниците (browser instances).*

---

### 4. 🔊 Bulgarian TTS

Native Bulgarian text-to-speech feedback.

```typescript
import { BulgarianTTS } from './src/enterprise/bulgarian-tts';

const tts = new BulgarianTTS();
await tts.initialize();

await tts.speak('Тестът премина успешно');
await tts.speakTemplate('error_found', { element: 'бутон' });
```

| Template | Text |
|----------|------|
| `test_passed` | "Тестът премина успешно" |
| `test_failed` | "Тестът се провали" |
| `error_found` | "Открих грешка в {element}" |

---

### 5. 🎛️ Dashboard Server

Real-time WebSocket dashboard.

```bash
npm run dashboard
# Open http://localhost:3847
```

**Features:**
- 📊 CPU temperature graph (20-point history)
- 🐳 Docker container count
- 🎖️ Active soldiers count
- 📜 Bulgarian activity logs
- ⚡ WebSocket real-time updates

> *🇧🇬 Таблото показва всичко на живо - температура, Docker, Swarm.*

---

### 6. 🔐 License Manager

Hardware-locked licensing system.

```bash
npm run license:generate   # Generate dev license
npm run license:status     # Check status
```

```typescript
import { LicenseManager } from './src/enterprise/license-manager';

const license = new LicenseManager();
const hwId = license.generateHardwareId();
const validation = license.validate();
```

**License Types:**

| Type | Instances | Features |
|------|-----------|----------|
| Trial | 2 | Basic |
| Professional | 10 | + Thermal, Docker |
| Enterprise | 50 | + Swarm, TTS |
| Sovereign | 999 | All features |

> *🇧🇬 Лицензът се привързва към хардуера ти с SHA-256 отпечатък.*

---

## 🎛️ Dashboard

The dashboard provides real-time monitoring of your test execution.

### Screenshot Preview

```
┌─────────────────────────────────────────────────────────────────────┐
│  🎛️ MISTER MIND DASHBOARD          v23.0.0 "The Local Sovereign"   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  🌡️ CPU Temperature        🐳 Docker         🎖️ Swarm               │
│  ████████░░ 65°C           4 containers     12 soldiers            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  📊 Activity Log                                                    │
│  ─────────────────────────────────────────────────────────────────  │
│  15:46:54 ℹ️ Агентът анализира Shadow DOM...                       │
│  15:46:55 ✅ Тестът премина успешно                                │
│  15:46:56 🔍 Намерих 3 нови селектора                              │
│  15:46:57 ⚠️ CPU температура: 72°C                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📚 API Reference

### MisterMind Class

```typescript
const mm = new MisterMind(config?: MisterMindConfig);

// Free methods
await mm.audit(url: string): Promise<AuditResult>;
await mm.testAPI(endpoint: string, options?): Promise<APITestResult>;
await mm.checkLinks(url: string): Promise<CheckLinksResult>;

// Pro methods
await mm.predict(options): Promise<PredictionResult>;
await mm.chronos(options): Promise<ChronosResult>;
await mm.apiSensei(config): Promise<APISenseiResult>;

// Utilities
mm.getLicenseStatus(): { isValid: boolean; tier: string };
mm.getFinancialStats(): FinancialStats;
mm.getLogger(): Logger;
```

### Exports

```typescript
import {
  MisterMind,
  printBanner,
  VERSION,
  VERSION_CODENAME,
  VERSION_FULL,
  getSystemStats,
  BrowserFactory,
  createMisterMind
} from './src/index';
```

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| **Lines of Code** | 45,895 |
| **TypeScript Files** | 91 |
| **Tests** | 492 passing |
| **Enterprise Modules** | 6 |
| **Version** | 23.0.0 |
| **Codename** | The Local Sovereign |

### npm Scripts

```bash
npm test              # Run all tests
npm run build         # Build TypeScript
npm run dashboard     # Start dashboard
npm run license:generate  # Generate license
npm run license:status    # Check license
npm run build:enterprise  # Build with obfuscation
```

---

## 🗂️ Project Structure

```
MrMindQATool/
├── src/
│   ├── index.ts              # Main entry (3,300+ lines)
│   ├── core/                 # Core modules
│   ├── browser/              # Browser automation
│   ├── ai/                   # AI & ML modules
│   ├── enterprise/           # Enterprise features
│   │   ├── thermal-aware-pool.ts
│   │   ├── docker-manager.ts
│   │   ├── swarm-commander.ts
│   │   ├── bulgarian-tts.ts
│   │   ├── dashboard-server.ts
│   │   └── license-manager.ts
│   └── utils/                # Utilities
├── tests/                    # Test files
├── docs/                     # Documentation
├── scripts/                  # Build scripts
└── package.json
```

---

## 🔧 Configuration

### .mistermindrc

```json
{
  "browser": "chromium",
  "headless": true,
  "timeout": 30000,
  "dashboard": {
    "port": 3847
  },
  "thermal": {
    "maxInstances": 40,
    "coolThreshold": 60
  }
}
```

### Environment Variables

```bash
MISTERMIND_LICENSE=MM-XXXX-XXXX-XXXX
MISTERMIND_VERBOSE=true
OLLAMA_ENDPOINT=http://localhost:11434
```

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

**Proprietary License** - All Rights Reserved

© 2025 Димитър Продромов (Dimitar Prodromov)

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use is strictly prohibited.

For licensing inquiries: dimitar@mistermind.bg

---

## 👤 Author

**Димитър Продромов (Dimitar Prodromov)**

- 🇧🇬 Sofia, Bulgaria
- 💼 QA Architect
- 📧 dimitar@mistermind.bg
- 🐙 [@papica777-eng](https://github.com/papica777-eng)

---

<div align="center">

### 🇧🇬 Made with ❤️ in Bulgaria

**MisterMind v23.0.0 "The Local Sovereign"**

*The QA framework that thinks ahead*

</div>
