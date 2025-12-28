<!-- 
═══════════════════════════════════════════════════════════════════════════════
MisterMind v23.0.0 "The Local Sovereign"
© 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

<div align="center">

# 🧠 MISTER MIND

### **AI-Powered QA Automation Framework**
### *v23.0.0 "The Local Sovereign"*

[![Version](https://img.shields.io/badge/version-23.0.0-blue?style=for-the-badge)](https://github.com/papica777-eng/MrMindQATool/releases)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-492%20Passing-brightgreen?style=for-the-badge)]()
[![Lines](https://img.shields.io/badge/Lines%20of%20Code-45,895-orange?style=for-the-badge)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

**The QA Framework That Predicts Bugs Before They Happen**

[🚀 Quick Start](#-quick-start) •
[🎛️ Dashboard](#-real-time-dashboard) •
[💡 Features](#-features) •
[📖 Docs](#-documentation) •
[🤝 Consulting](#-looking-for-partners)

</div>

---

## 🎯 What is MisterMind?

**MisterMind** is an enterprise-grade, AI-powered QA automation framework built entirely in TypeScript. It doesn't just find bugs — it **predicts and prevents them** using local AI models, thermal-aware execution, and intelligent test orchestration.

### 🌟 Key Highlights:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🧠 LOCAL AI         - Ollama + Whisper, no cloud dependency                │
│  🌡️ THERMAL AWARE    - CPU throttling based on hardware temperature        │
│  🐳 DOCKER GRID      - Auto-orchestrated Selenium/Playwright containers    │
│  🎖️ SWARM EXECUTION  - Commander-Soldier parallel architecture             │
│  🇧🇬 BULGARIAN NATIVE - First QA framework with Bulgarian TTS & NLP        │
│  🛡️ IP PROTECTED     - Hardware-locked licensing & code obfuscation        │
│  📊 REAL-TIME        - WebSocket dashboard at localhost:3847               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Lines of Code** | 45,895 |
| **Test Coverage** | 492 tests (100% passing) |
| **TypeScript Modules** | 91 files |
| **Core Modules** | 35+ |
| **Version** | v23.0.0 |
| **Codename** | "The Local Sovereign" |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) Docker for Selenium Grid
- (Optional) Ollama for local AI

### Installation

```bash
# Clone the repository
git clone https://github.com/papica777-eng/MrMindQATool.git
cd MrMindQATool

# Install dependencies
npm install

# Run tests
npm test

# Start the dashboard
npm run dashboard
```

### Open Dashboard

Navigate to **http://localhost:3847** to see:
- 🌡️ Real-time CPU temperature
- 🐳 Docker container status
- 📋 Live activity logs (Bulgarian)
- 🎖️ Swarm execution status

---

## 🎛️ Real-Time Dashboard

MisterMind includes a beautiful, real-time monitoring dashboard:

```bash
npm run dashboard
# Opens at http://localhost:3847
```

### Dashboard Features:
- **CPU Temperature Graph** - Live hardware telemetry
- **Docker Containers** - Status of Selenium Grid nodes
- **Activity Logs** - Bulgarian language feedback
- **Swarm Status** - Soldiers, queue, completed tasks
- **Memory Usage** - Real-time RAM monitoring

---

## 💡 Features

### 🧠 AI & Machine Learning

| Feature | Description |
|---------|-------------|
| **🔮 Prediction Matrix** | AI predicts where bugs will appear based on code changes |
| **🎤 Whisper Bridge** | Local speech-to-text for voice commands |
| **👁️ Hybrid Vision** | Gemini + Ollama fallback for visual testing |
| **🇧🇬 Bulgarian NLP** | Native semantic mapping for Bulgarian language |

### 🏗️ Architecture

| Feature | Description |
|---------|-------------|
| **🎖️ Swarm Commander** | Commander-Soldier hierarchy for parallel execution |
| **🌡️ Thermal Pool** | CPU temperature-aware thread management |
| **🐳 Docker Manager** | Auto-generate Dockerfile & docker-compose for Selenium Grid |
| **🔊 Bulgarian TTS** | Text-to-speech feedback in Bulgarian |

### 🛡️ Security & Protection

| Feature | Description |
|---------|-------------|
| **🔐 License Manager** | Hardware ID-locked licensing system |
| **🛡️ Code Obfuscation** | javascript-obfuscator for IP protection |
| **🧱 Bastion Security** | Multi-layer input validation & sandboxing |
| **🔒 Encryption** | AES-256 for sensitive data |

### 📊 Observability

| Feature | Description |
|---------|-------------|
| **📡 Real-time Dashboard** | WebSocket streaming at localhost:3847 |
| **📈 Telemetry** | CPU, memory, and system metrics |
| **📝 Activity Logging** | Timestamped logs with Bulgarian messages |
| **🔍 Error Tracking** | Comprehensive error handling system |

---

## 🏛️ Architecture Overview

```
MisterMind v23.0.0 "The Local Sovereign"
├── 📁 src/
│   ├── 📁 core/           # DI Container, Error Handling, Streams
│   ├── 📁 enterprise/     # License, Dashboard, Thermal, Docker, Swarm, TTS
│   ├── 📁 local/          # Whisper, Hybrid Vision Controller
│   ├── 📁 multimodal/     # Voice Commander, Video Analyzer, Neural HUD
│   ├── 📁 agents/         # AI Agents, Test Orchestration
│   ├── 📁 bastion/        # Security, Validation, Sandbox
│   ├── 📁 neural/         # ML Models, Prediction Engine
│   ├── 📁 persona/        # User Behavior Simulation
│   ├── 📁 segc/           # Self-Evolving Genetic Code
│   └── 📁 telemetry/      # Metrics, Monitoring
├── 📁 tests/              # 492 tests (Vitest)
├── 📁 docs/               # Documentation
└── 📁 scripts/            # Build & utility scripts
```

---

## 🔧 Available Scripts

```bash
# Development
npm run build              # Compile TypeScript
npm run test               # Run all 492 tests
npm run test:watch         # Watch mode
npm run lint               # ESLint check

# Dashboard & Monitoring
npm run dashboard          # Start real-time dashboard

# License Management
npm run license:generate   # Generate development license
npm run license:status     # Check license status

# Enterprise Build
npm run build:enterprise   # Build with obfuscation
```

---

## 🌡️ Thermal-Aware Execution

MisterMind monitors your CPU temperature and automatically adjusts parallelism:

```typescript
// Thermal states and their effects:
// COOL    (<60°C)  → Max 40 parallel instances
// WARM    (60-70°C) → Max 30 parallel instances  
// HOT     (70-80°C) → Max 20 parallel instances
// CRITICAL (80-90°C) → Max 10 parallel instances
// EMERGENCY (>90°C)  → Max 4 parallel instances
```

---

## 🐳 Docker Selenium Grid

Auto-generate and manage Selenium Grid:

```typescript
import { DockerManager } from './src/enterprise/docker-manager';

const docker = new DockerManager({
    chromeNodes: 4,
    firefoxNodes: 2,
    enableVideo: true
});

// Generates Dockerfile + docker-compose.yml
await docker.generateDockerfile();
await docker.generateDockerCompose();
await docker.startGrid();
```

---

## 🇧🇬 Bulgarian Language Support

MisterMind is the **first QA framework with native Bulgarian support**:

```typescript
// TTS Feedback
"Тестът премина успешно"
"Открих грешка в {element}"
"Агентът анализира Shadow DOM..."

// Dashboard UI
"CPU Температура", "Войници", "В Опашка", "Термално Състояние"
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Installation & first steps |
| [API Reference](docs/api-reference.md) | Complete API documentation |
| [Enterprise Guide](docs/enterprise.md) | Enterprise features & licensing |
| [Consultant Brief](docs/CONSULTANT_JOB_POST.md) | Looking for partners |

---

## 🤝 Looking for Partners

We're looking for **experienced consultants** to help commercialize MisterMind:

- QA Architecture expertise (10+ years)
- Product development & go-to-market strategy  
- TypeScript / Docker / AI experience

📧 **Contact:** dimitar.prodromov@mistermind.dev

See [CONSULTANT_JOB_POST.md](docs/CONSULTANT_JOB_POST.md) for details.

---

## 📜 Version History

| Version | Codename | Highlights |
|---------|----------|------------|
| **v23.0.0** | The Local Sovereign | Dashboard, License Manager, Full Documentation |
| v23.0.0-beta | Phase 2 | Thermal Pool, Docker Manager, Swarm, Bulgarian TTS |
| v23.0.0-alpha | Phase 1 | Whisper Bridge, Hybrid Vision, Bulgarian Mapping |
| v22.0.0 | - | Core framework, Security, Neural Network |

---

## 🔐 License

**© 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.**

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use is strictly prohibited without express written permission.

For licensing inquiries: **dimitar.prodromov@mistermind.dev**

---

<div align="center">

### **Made with ❤️ in Bulgaria 🇧🇬**

**Димитър Продромов** | QA Architect & Creator

[GitHub](https://github.com/papica777-eng) • [Email](mailto:dimitar.prodromov@mistermind.dev)

---

*"ГАЗ ДО ДУПКА! СИНГУЛЯРНОСТТА Е ТУК!"* 🚀

</div>
