<!-- 
═══════════════════════════════════════════════════════════════════════════════
QAntum | © 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

# 🧠 QANTUM - Examples

## Basic Usage (FREE Tier)

```javascript
import QAntum from 'qantum';

const mm = new QAntum();

// 🔍 Audit a page
const auditResult = await mm.audit('https://example.com');
console.log(auditResult);

// 🔗 Check for broken links
const links = await mm.checkLinks('https://example.com');
console.log(links);

// 🌐 Test API endpoint
const apiResult = await mm.testAPI('https://api.example.com/health');
console.log(apiResult);
```

## Pro Features (Requires License)

```javascript
import QAntum from 'qantum';

const mm = new QAntum({
  licenseKey: 'MM-XXXX-XXXX-XXXX'
});

// 🤖 AI Predictions
const prediction = await mm.predict({
  type: 'regression',
  target: 'pageLoadTime'
});

// ⏱️ Chronos - Time-based Analysis
const chronos = await mm.chronos({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

// 🥋 API Sensei - Smart API Testing
const apiSensei = await mm.apiSensei({
  endpoint: 'https://api.example.com',
  method: 'POST',
  body: { data: 'test' }
});
```

## Get Your Pro License

👉 [Buy Pro License ($29/month)](https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe)
