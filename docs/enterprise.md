<!-- 
═══════════════════════════════════════════════════════════════════════════════
QAntum v23.0.0 "The Local Sovereign" - Enterprise Documentation
© 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

# 🏢 QAntum Enterprise Guide

## v23.0.0 "The Local Sovereign"

---

## 📋 Table of Contents

1. [Enterprise Modules](#-enterprise-modules)
2. [Thermal-Aware Pool](#️-thermal-aware-pool)
3. [Docker Manager](#-docker-manager)
4. [Swarm Commander](#️-swarm-commander)
5. [Bulgarian TTS](#-bulgarian-tts)
6. [Dashboard Server](#️-dashboard-server)
7. [License Manager](#-license-manager)
8. [Build System](#-build-system)

---

## 🎯 Enterprise Modules

| Module | File | Description |
|--------|------|-------------|
| **Thermal Pool** | `thermal-aware-pool.ts` | CPU temperature-aware parallelism |
| **Docker Manager** | `docker-manager.ts` | Selenium Grid orchestration |
| **Swarm Commander** | `swarm-commander.ts` | Commander-Soldier hierarchy |
| **Bulgarian TTS** | `bulgarian-tts.ts` | Text-to-speech feedback |
| **Dashboard Server** | `dashboard-server.ts` | Real-time WebSocket dashboard |
| **License Manager** | `license-manager.ts` | Hardware-locked licensing |

---

## 🌡️ Thermal-Aware Pool

Automatically adjusts parallelism based on CPU temperature.

```typescript
import { ThermalAwarePool } from './src/enterprise/thermal-aware-pool';

const pool = new ThermalAwarePool({
    maxInstances: 40,
    updateInterval: 2000,
    coolThreshold: 60,
    warmThreshold: 70,
    hotThreshold: 80,
    criticalThreshold: 90
});

await pool.start();
```

### Thermal States

| State | Temperature | Max Instances |
|-------|-------------|---------------|
| **COOL** | <60°C | 40 |
| **WARM** | 60-70°C | 30 |
| **HOT** | 70-80°C | 20 |
| **CRITICAL** | 80-90°C | 10 |
| **EMERGENCY** | >90°C | 4 |

---

## 🐳 Docker Manager

Auto-generates Dockerfile and docker-compose.yml for Selenium Grid.

```typescript
import { DockerManager } from './src/enterprise/docker-manager';

const docker = new DockerManager({
    hubPort: 4444,
    chromeNodes: 4,
    firefoxNodes: 2,
    enableVideo: true
});

await docker.generateDockerfile();
await docker.generateDockerCompose();
await docker.startGrid();
```

---

## 🎖️ Swarm Commander

Commander-Soldier pattern for parallel test execution.

```typescript
import { SwarmCommander } from './src/enterprise/swarm-commander';

const commander = new SwarmCommander({
    minSoldiers: 4,
    maxSoldiers: 40,
    taskTimeout: 30000
});

await commander.initialize();
await commander.queueTask({
    id: 'test-001',
    type: 'browser-test',
    payload: { url: 'https://example.com' }
});
```

---

## 🔊 Bulgarian TTS

Text-to-speech with native Bulgarian support.

```typescript
import { BulgarianTTS } from './src/enterprise/bulgarian-tts';

const tts = new BulgarianTTS({ engine: 'auto' });
await tts.initialize();

await tts.speak('Тестът премина успешно');
await tts.speakTemplate('error_found', { element: 'бутон' });
```

### Templates

| Template | Bulgarian Text |
|----------|---------------|
| `test_passed` | "Тестът премина успешно" |
| `test_failed` | "Тестът се провали" |
| `error_found` | "Открих грешка в {element}" |

---

## 🎛️ Dashboard Server

Real-time WebSocket dashboard at `http://localhost:3847`.

```bash
npm run dashboard
```

```typescript
import { DashboardServer } from './src/enterprise/dashboard-server';

const dashboard = new DashboardServer({ port: 3847 });
await dashboard.start();

dashboard.logActivity('Агентът анализира Shadow DOM...');
dashboard.logSuccess('Тестът премина успешно');
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Dashboard HTML |
| `GET /api/state` | Full state JSON |
| `GET /api/telemetry` | CPU/memory metrics |
| `GET /api/logs` | Activity logs |

---

## 🔐 License Manager

Hardware-locked licensing system.

```bash
npm run license:generate   # Generate dev license
npm run license:status     # Check status
```

```typescript
import { LicenseManager } from './src/enterprise/license-manager';

const license = new LicenseManager();
const hwId = license.generateHardwareId();

license.loadLicense('./.QAntum.license');
const validation = license.validate();
```

### License Types

| Type | Max Instances | Features |
|------|---------------|----------|
| **Trial** | 2 | Basic |
| **Professional** | 10 | + Thermal, Docker |
| **Enterprise** | 50 | + Swarm, TTS |
| **Sovereign** | 999 | All features |

---

## 📦 Build System

Enterprise build with code obfuscation.

```bash
npm run build:enterprise
```

Output in `dist-protected/` with:
- Obfuscated JavaScript
- Build manifest with checksums
- Distribution package

---

**© 2025 Димитър Продромов. All Rights Reserved.**
