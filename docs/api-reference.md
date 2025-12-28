<!-- 
═══════════════════════════════════════════════════════════════════════════════
MisterMind | © 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
═══════════════════════════════════════════════════════════════════════════════
-->

# API Reference

## MisterMind Class

### Constructor

```typescript
new MisterMind(config?: MisterMindConfig)
```

#### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `licenseKey` | `string` | `undefined` | Pro license key for premium features |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `verbose` | `boolean` | `false` | Enable verbose logging |

---

## Free Methods

### `audit(url: string): Promise<AuditResult>`

Performs a comprehensive website audit.

```javascript
const result = await mm.audit('https://example.com');
```

**Returns:**
```typescript
interface AuditResult {
  url: string;
  timestamp: Date;
  performance: number;    // 0-100
  accessibility: number;  // 0-100
  seo: number;           // 0-100
  brokenLinks: string[];
  suggestions: string[];
}
```

---

### `checkLinks(url: string): Promise<string[]>`

Scans a webpage for broken links.

```javascript
const brokenLinks = await mm.checkLinks('https://example.com');
```

**Returns:** Array of broken link URLs

---

### `testAPI(endpoint: string, method?: string): Promise<APIResult>`

Performs a basic API health check.

```javascript
const result = await mm.testAPI('https://api.example.com/health', 'GET');
```

**Returns:**
```typescript
{
  status: number;      // HTTP status code
  responseTime: number; // in milliseconds
  success: boolean;
}
```

---

## Pro Methods (License Required)

### `predict(options): Promise<PredictionResult>`

🔮 **Prediction Matrix** - AI-powered bug prediction.

```javascript
const predictions = await mm.predict({
  codeChanges: './src',
  testHistory: './test-results'
});
```

**Returns:**
```typescript
interface PredictionResult {
  riskScore: number;           // 0-100
  predictedFailures: string[]; // Test files likely to fail
  recommendation: string;      // AI recommendation
  confidence: number;          // 0-1
}
```

---

### `chronos(options): Promise<ChronosResult>`

⏰ **Chronos Engine** - Time-travel debugging.

```javascript
const result = await mm.chronos({
  testFile: './tests/login.spec.js',
  timeRange: '24h'
});
```

---

### `apiSensei(config): Promise<APISenseiResult>`

🤖 **API Sensei** - Intelligent API testing.

```javascript
const result = await mm.apiSensei({
  baseURL: 'https://api.example.com',
  discover: true
});
```

---

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import { MisterMind, AuditResult, PredictionResult } from 'mister-mind';

const mm = new MisterMind();
const result: AuditResult = await mm.audit('https://example.com');
```

---

## Error Handling

```javascript
try {
  const result = await mm.predict({ codeChanges: './src' });
} catch (error) {
  if (error.message.includes('Pro license')) {
    console.log('Upgrade to Pro for this feature');
  }
}
```
