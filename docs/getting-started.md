<!-- 
═══════════════════════════════════════════════════════════════════════════════
QAntum v23.0.0 "The Local Sovereign" - Getting Started Guide
© 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

# 🚀 Getting Started with QAntum

## v23.0.0 "The Local Sovereign"

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Installation](#-installation)
3. [Quick Start](#-quick-start)
4. [Basic Usage](#-basic-usage)
5. [Writing Tests](#-writing-tests)
6. [Running Tests](#-running-tests)
7. [Dashboard](#-dashboard)
8. [Next Steps](#-next-steps)

---

## 📦 Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| **Node.js** | 18+ | `node -v` |
| **npm** | 9+ | `npm -v` |
| **TypeScript** | 5.3+ | `npx tsc -v` |
| **Chrome** | Latest | `chrome --version` |
| **Docker** | 24+ (optional) | `docker -v` |

### Recommended Hardware

- **CPU**: 8+ cores (AMD Ryzen 7 / Intel i7)
- **RAM**: 16GB+
- **Storage**: SSD with 10GB free

---

## 📥 Installation

### 1. Clone Repository

```bash
git clone https://github.com/dimitar-prodromov/QAntumQATool.git
cd QAntumQATool
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Project

```bash
npm run build
```

### 4. Verify Installation

```bash
npm test
```

---

## ⚡ Quick Start

### 5-Minute Setup

```bash
# Install and build
npm install && npm run build

# Generate development license
npm run license:generate

# Start dashboard
npm run dashboard

# Run tests
npm test
```

Visit **http://localhost:3847** for the dashboard.

---

## 💻 Basic Usage

### Running Built-in Tests

```bash
# All tests
npm test

# Specific test file
npm test -- --grep "StepRecorder"

# With coverage
npm run test:coverage
```

### Using the Dashboard

```bash
npm run dashboard
```

Features:
- 📊 Real-time CPU graph
- 🐳 Docker container status
- 🎖️ Swarm soldier count
- 📜 Bulgarian activity logs

---

## ✍️ Writing Tests

### Example: Basic Test

```typescript
import { TestFramework } from './src/core/test-framework';

const test = new TestFramework();

describe('My Test Suite', () => {
    it('should visit homepage', async () => {
        const result = await test.run({
            url: 'https://example.com',
            actions: [
                { type: 'click', selector: 'button' },
                { type: 'wait', duration: 1000 }
            ]
        });
        expect(result.passed).toBe(true);
    });
});
```

### Example: With Browser

```typescript
import { BrowserController } from './src/browser/browser-controller';

const browser = new BrowserController({ browser: 'chrome' });
await browser.launch();
await browser.navigate('https://example.com');
await browser.click('#submit');
await browser.close();
```

---

## 🏃 Running Tests

### Development Mode

```bash
# Watch mode
npm run dev

# Debug mode
npm run test:debug
```

### Production Mode

```bash
# Full test run
npm test

# With HTML report
npm run test:report
```

### Parallel Execution

```typescript
import { ThermalAwarePool } from './src/enterprise/thermal-aware-pool';

const pool = new ThermalAwarePool({ maxInstances: 20 });
await pool.start();
// Pool auto-adjusts based on CPU temperature
```

---

## 🎛️ Dashboard

### Starting the Dashboard

```bash
npm run dashboard
```

### Dashboard URL

```
http://localhost:3847
```

### Features

| Feature | Description |
|---------|-------------|
| **CPU Graph** | 20-point temperature history |
| **Docker Status** | Running containers count |
| **Swarm Status** | Active soldiers count |
| **Activity Logs** | Bulgarian-language events |

---

## 📖 Next Steps

1. 📘 Read [Enterprise Guide](enterprise.md)
2. 📚 Explore [API Reference](api-reference.md)
3. 💡 Check [Examples](../examples/)
4. 🎯 Try [Advanced Usage](../examples/advanced-usage.ts)

---

## 🆘 Support

- **Issues**: GitHub Issues
- **Email**: dimitar@QAntum.bg
- **Documentation**: `/docs/` folder

---

**© 2025 Димитър Продромов. All Rights Reserved.**
