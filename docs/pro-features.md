<!-- 
═══════════════════════════════════════════════════════════════════════════════
QAntum v23.0.0 "The Local Sovereign" - Pro Features Guide
© 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

# ⭐ QAntum Pro Features

## v23.0.0 "The Local Sovereign"

---

## 📋 License Tiers Overview

| Feature | Trial | Professional | Enterprise | Sovereign |
|---------|:-----:|:------------:|:----------:|:---------:|
| **Max Instances** | 2 | 10 | 50 | 999 |
| **Browser Support** | Chrome | +Firefox | +Edge, Safari | All |
| **Thermal Pool** | ❌ | ✅ | ✅ | ✅ |
| **Docker Manager** | ❌ | ✅ | ✅ | ✅ |
| **Swarm Commander** | ❌ | ❌ | ✅ | ✅ |
| **Bulgarian TTS** | ❌ | ❌ | ✅ | ✅ |
| **Dashboard** | Basic | Full | Full | Full |
| **API Access** | ❌ | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **Source Access** | ❌ | ❌ | ❌ | ✅ |

---

## 🌡️ Thermal-Aware Pool (Professional+)

Intelligent resource management based on CPU temperature.

### Features

- **Auto-scaling**: Reduces instances when CPU heats up
- **Recovery**: Restores capacity when cooled
- **Bulgarian logs**: Native language status updates
- **Real-time graphs**: Dashboard integration

### Thermal States

| State | Temperature | Max Instances |
|-------|-------------|---------------|
| **COOL** | <60°C | 40 |
| **WARM** | 60-70°C | 30 |
| **HOT** | 70-80°C | 20 |
| **CRITICAL** | 80-90°C | 10 |
| **EMERGENCY** | >90°C | 4 |

### Benefits

- **Prevent thermal throttling**
- **Extend hardware lifespan**
- **Maintain consistent performance**
- **No manual intervention needed**

---

## 🐳 Docker Selenium Grid (Professional+)

Auto-generated Docker configurations for Selenium Grid.

### Generated Files

1. `selenium-grid/Dockerfile`
2. `selenium-grid/docker-compose.yml`
3. `selenium-grid/config.toml`

### Capabilities

- Chrome, Firefox, Edge nodes
- Video recording
- VNC access for debugging
- Auto-scaling nodes

---

## 🎖️ Swarm Commander (Enterprise+)

Commander-Soldier pattern for massive parallelism.

### Architecture

```
Commander (1)
    ├── Soldier #1 (Chrome)
    ├── Soldier #2 (Firefox)
    ├── Soldier #3 (Chrome)
    └── ... up to 999 soldiers
```

### Task Distribution

- Intelligent load balancing
- Priority queue support
- Automatic retry on failure
- Real-time status updates

---

## 🔊 Bulgarian TTS (Enterprise+)

Native Bulgarian text-to-speech feedback.

### Use Cases

- Accessibility support
- Hands-free testing
- Status announcements
- Error notifications

### Templates

| Event | Bulgarian Message |
|-------|-------------------|
| Test Pass | "Тестът премина успешно" |
| Test Fail | "Тестът се провали" |
| Error Found | "Открих грешка в {element}" |
| Healing | "Намерих нов селектор" |

---

## 🎛️ Dashboard Features

Real-time monitoring at `localhost:3847`.

### Basic (Trial)
- Activity logs
- Test status

### Full (Professional+)
- CPU temperature graph (20-point history)
- Memory usage monitoring
- Docker container status
- Swarm soldier count
- WebSocket real-time updates
- Bulgarian language UI

---

## 🔐 Hardware-Locked Licensing

Licenses are bound to your machine's hardware ID.

### Hardware ID Components

1. CPU ID
2. Motherboard Serial
3. MAC Address
4. Disk Serial

### Security

- SHA-256 hardware fingerprint
- SHA-512 license signature
- Tamper detection
- Offline validation

---

## 📦 Enterprise Build

Code protection with javascript-obfuscator.

### Obfuscation Features

- Variable renaming
- String encoding
- Control flow flattening
- Dead code injection
- Debug protection

### Output

```
dist-protected/
├── index.js (obfuscated)
├── core/
├── browser/
├── enterprise/
└── manifest.json (checksums)
```

---

## 🚀 Upgrading Your License

### Generate Development License

```bash
npm run license:generate
```

### Check License Status

```bash
npm run license:status
```

### Upgrade Process

Contact for license upgrades:
📧 dimitar@QAntum.bg

---

## 📞 Support Channels

| Tier | Support Channel | Response Time |
|------|-----------------|---------------|
| Trial | GitHub Issues | Best effort |
| Professional | Email | 48 hours |
| Enterprise | Priority Email | 24 hours |
| Sovereign | Dedicated | 4 hours |

---

## 💰 Pricing

| Tier | Price | Best For |
|------|-------|----------|
| **Trial** | Free | Evaluation |
| **Professional** | €49/month | Small teams |
| **Enterprise** | €199/month | Large teams |
| **Sovereign** | Contact us | Unlimited |

---

**© 2025 Димитър Продромов. All Rights Reserved.**
