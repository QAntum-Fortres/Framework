<!-- 
═══════════════════════════════════════════════════════════════════════════════
MisterMind | © 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

# Getting Started with MISTER MIND

## Installation

```bash
npm install mister-mind
```

## Quick Start

### 1. Basic Audit (Free)

```javascript
const { MisterMind } = require('mister-mind');

const mm = new MisterMind();

// Audit a website
const result = await mm.audit('https://your-site.com');

console.log(result);
// {
//   performance: 87,
//   accessibility: 92,
//   seo: 78,
//   brokenLinks: [],
//   suggestions: [...]
// }
```

### 2. Check Links (Free)

```javascript
const brokenLinks = await mm.checkLinks('https://your-site.com');
console.log(`Found ${brokenLinks.length} broken links`);
```

### 3. API Testing (Free - 10/day)

```javascript
const apiResult = await mm.testAPI('https://api.example.com/users', 'GET');
console.log(apiResult);
// { status: 200, responseTime: 145, success: true }
```

## Pro Features

Upgrade to Pro for advanced AI-powered features:

```javascript
const mm = new MisterMind({
  licenseKey: 'YOUR_LICENSE_KEY'
});

// Now you can use:
// - Prediction Matrix
// - API Sensei
// - Chronos Engine
// - Strategic Resilience
```

### Get Your License

🛒 **[Buy Pro License →](https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe)**

## Next Steps

- [API Reference](api-reference.md)
- [Pro Features Guide](pro-features.md)
- [Enterprise Setup](enterprise.md)
