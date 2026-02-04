# Enterprise Core Infrastructure

## 🚀 God Mode Enterprise Systems

This directory contains enterprise-grade infrastructure that transforms QAntum SaaS Framework into a production-ready, self-healing, and secure platform.

---

## 📦 Components

### 1. **Enterprise Logging** (`logging/enterprise-logger.ts`)

Professional structured logging system with:

- ✅ **Structured JSON Logging** - Machine-parseable logs for ELK, Datadog, Splunk
- ✅ **Log Levels** - DEBUG, INFO, WARN, ERROR, FATAL, SECURITY
- ✅ **Correlation IDs** - Distributed tracing support
- ✅ **PII Masking** - Automatic redaction of sensitive data (SSN, credit cards, emails)
- ✅ **Performance Metrics** - Memory and CPU usage tracking
- ✅ **Multiple Transports** - Console, File, Custom (Datadog example included)
- ✅ **Log Rotation** - Automatic file rotation at configurable size
- ✅ **Security Audit Trail** - Dedicated security event logging

#### Usage

```typescript
import { getLogger } from './core/logging/enterprise-logger';

const logger = getLogger();

// Basic logging
logger.info('User logged in', { userId: '123', sessionId: 'abc' });
logger.error('Database connection failed', error, { component: 'Database' });

// Security events
logger.security('Unauthorized access attempt', 'high', 
  { userId: '123' }, 
  { resource: '/admin', ip: '192.168.1.1' }
);

// Performance tracking
await logger.trackPerformance('processPayment', async () => {
  return await processPayment(order);
});

// Child logger with inherited context
const requestLogger = logger.child({ requestId: 'req-123' });
requestLogger.info('Processing request'); // Automatically includes requestId
```

---

### 2. **Enterprise Error Handling** (`errors/enterprise-errors.ts`)

Comprehensive error management with:

- ✅ **Typed Error Hierarchy** - Specific error classes for different scenarios
- ✅ **HTTP Status Codes** - Automatic mapping to REST API responses
- ✅ **Recovery Strategies** - Exponential backoff, circuit breaker, timeout handling
- ✅ **Global Error Handlers** - Unhandled rejection and exception catching
- ✅ **Graceful Shutdown** - Proper cleanup on SIGTERM/SIGINT
- ✅ **Error Correlation** - Unique error IDs for tracking

#### Error Types

```typescript
// Validation errors (400)
throw new ValidationError('Invalid input', { email: ['Invalid format'] });

// Authentication errors (401)
throw new AuthenticationError('Invalid credentials');

// Authorization errors (403)
throw new AuthorizationError('Insufficient permissions');

// Not found errors (404)
throw new NotFoundError('User', 'user-123');

// Rate limit errors (429)
throw new RateLimitError('Too many requests', 60);

// Security errors
throw new SecurityError('SQL injection detected', 'critical');

// And more: TimeoutError, DatabaseError, NetworkError, etc.
```

#### Recovery Manager

```typescript
import { ErrorRecoveryManager } from './core/errors/enterprise-errors';

// Retry with exponential backoff
const result = await ErrorRecoveryManager.retryWithBackoff(
  async () => await fetchData(),
  { maxAttempts: 3, initialDelay: 1000 }
);

// Execute with timeout
const result = await ErrorRecoveryManager.withTimeout(
  async () => await longRunningOperation(),
  30000, // 30 seconds
  'longRunningOperation'
);

// Circuit breaker
const circuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 60s timeout
const result = await ErrorRecoveryManager.withCircuitBreaker(
  async () => await externalApiCall(),
  'externalApi',
  circuitBreaker
);
```

---

### 3. **Enterprise Security** (`security/enterprise-security.ts`)

OWASP-compliant security layer with:

- ✅ **Input Sanitization** - XSS prevention with HTML encoding
- ✅ **SQL Injection Detection** - Pattern-based detection and logging
- ✅ **Schema Validation** - Type-safe input validation
- ✅ **Rate Limiting** - DDoS protection with sliding window
- ✅ **Security Headers** - Helmet-style HTTP headers
- ✅ **Cryptographic Operations** - AES-256-GCM encryption, HMAC signatures
- ✅ **Password Hashing** - PBKDF2 with 100,000 iterations
- ✅ **Secret Management** - Encrypted in-memory storage

#### Input Sanitization

```typescript
import { InputSanitizer } from './core/security/enterprise-security';

// Sanitize XSS
const safe = InputSanitizer.sanitizeXSS('<script>alert("xss")</script>');
// Result: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

// Detect SQL injection
if (InputSanitizer.detectSQLInjection(userInput)) {
  throw new SecurityError('SQL injection attempt detected');
}

// Sanitize object recursively
const safeData = InputSanitizer.sanitizeObject(requestBody);
```

#### Schema Validation

```typescript
import { SchemaValidator } from './core/security/enterprise-security';

const schema = {
  username: { type: 'string', required: true, min: 3, max: 20 },
  email: { type: 'email', required: true },
  age: { type: 'number', required: false, min: 18, max: 120 }
};

const result = SchemaValidator.validate(data, schema);
if (!result.valid) {
  throw new ValidationError('Validation failed', result.errors);
}
```

#### Rate Limiting

```typescript
import { RateLimiter } from './core/security/enterprise-security';

const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per window
});

if (!rateLimiter.checkLimit(userId)) {
  throw new RateLimitError('Too many requests', rateLimiter.config.windowMs);
}
```

#### Cryptography

```typescript
import { CryptoService } from './core/security/enterprise-security';

// Generate secure token
const token = CryptoService.generateSecureToken(32);

// Hash password
const hash = await CryptoService.hashPassword('myPassword123');

// Verify password
const valid = await CryptoService.verifyPassword('myPassword123', hash);

// Encrypt/decrypt data
const encrypted = CryptoService.encrypt('sensitive data', secretKey);
const decrypted = CryptoService.decrypt(encrypted, secretKey);

// HMAC signatures
const signature = CryptoService.generateSignature(data, secret);
const isValid = CryptoService.verifySignature(data, signature, secret);
```

#### Secret Management

```typescript
import { SecretManager } from './core/security/enterprise-security';

// Initialize with encryption
SecretManager.initialize(process.env.MASTER_KEY);

// Store secret
SecretManager.setSecret('API_KEY', 'sk-1234567890');

// Retrieve secret
const apiKey = SecretManager.getSecret('API_KEY');

// Rotate secret
SecretManager.rotateSecret('API_KEY', 'sk-0987654321');
```

---

### 4. **Enterprise Configuration** (`config/enterprise-config.ts`)

Type-safe configuration management with:

- ✅ **Schema Validation** - Validate on startup with custom validators
- ✅ **Environment Variables** - Automatic ENV to config mapping
- ✅ **Secret Integration** - Sensitive values stored in SecretManager
- ✅ **Hot Reload** - Optional file watching for config changes
- ✅ **Type Safety** - Generic get() method for type-safe access
- ✅ **Change Notifications** - Watch for configuration updates

#### Usage

```typescript
import { createConfigManager, QAntumConfigSchema } from './core/config/enterprise-config';

// Initialize
const config = createConfigManager(QAntumConfigSchema, {
  configPath: './config/production.json',
  hotReload: true
});

await config.initialize();

// Get configuration
const port = config.get<number>('port'); // Type-safe
const apiKey = config.get<string>('openaiApiKey'); // Retrieves from SecretManager

// Set configuration
config.set('logLevel', 'debug');

// Watch for changes
const unwatch = config.watch((key, value) => {
  console.log(`Config ${key} changed to ${value}`);
});

// Custom schema
const customSchema = {
  appName: {
    type: 'string',
    required: true,
    default: 'QAntum',
    description: 'Application name'
  },
  dbPassword: {
    type: 'string',
    required: true,
    secret: true, // Stored in SecretManager
    description: 'Database password'
  }
};
```

---

## 🚀 Quick Start

### 1. Initialize All Systems

```typescript
import { initializeEnterpriseCore } from './src/core/index-enterprise';

await initializeEnterpriseCore({
  logLevel: 'info',
  enableFileLogging: true,
  enableMetrics: true,
  secretMasterKey: process.env.MASTER_KEY,
  configPath: './config/production.json'
});
```

### 2. Use in Your Application

```typescript
import {
  getLogger,
  GlobalErrorHandler,
  RateLimiter,
  InputSanitizer,
  getConfigManager
} from './src/core/index-enterprise';

// Logging
const logger = getLogger();
logger.info('Application started', { version: '1.0.0' });

// Error handling is automatic via GlobalErrorHandler

// Security
const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100
});

app.use((req, res, next) => {
  if (!rateLimiter.checkLimit(req.ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});

// Configuration
const config = getConfigManager();
const port = config.get<number>('port');
```

---

## 🔒 Security Features

### OWASP Top 10 Protection

1. ✅ **Injection** - Input sanitization, SQL injection detection
2. ✅ **Broken Authentication** - Secure password hashing, token management
3. ✅ **Sensitive Data Exposure** - Encryption at rest, PII masking
4. ✅ **XML External Entities (XXE)** - Input validation
5. ✅ **Broken Access Control** - Authorization error handling
6. ✅ **Security Misconfiguration** - Security headers, default configs
7. ✅ **XSS** - Input sanitization, HTML encoding
8. ✅ **Insecure Deserialization** - Schema validation
9. ✅ **Using Components with Known Vulnerabilities** - (Requires external scanning)
10. ✅ **Insufficient Logging & Monitoring** - Enterprise logging with audit trail

---

## 📊 Monitoring & Observability

### Log Aggregation

Logs are structured JSON format compatible with:
- **Elasticsearch** (ELK Stack)
- **Datadog**
- **Splunk**
- **New Relic**
- **CloudWatch**

### Metrics Collected

- Request count by endpoint
- Error rates by type
- Response times (p50, p95, p99)
- Memory usage
- CPU usage
- Rate limit violations
- Security events

### Sample Datadog Integration

```typescript
import { createLogger, DatadogTransport } from './core/logging/enterprise-logger';

const logger = createLogger({
  customTransports: [
    new DatadogTransport(process.env.DATADOG_API_KEY!)
  ]
});
```

---

## 🛠️ Best Practices

### 1. Always Initialize First

```typescript
// At application startup
await initializeEnterpriseCore();
```

### 2. Use Correlation IDs

```typescript
const logger = getLogger();
const correlationId = generateId();

logger.info('Request started', { correlationId, requestId });
// ... all subsequent logs inherit correlationId via child logger
```

### 3. Validate All Inputs

```typescript
import { SchemaValidator, InputSanitizer } from './core/security/enterprise-security';

// Sanitize first
const sanitizedData = InputSanitizer.sanitizeObject(req.body);

// Then validate
const result = SchemaValidator.validate(sanitizedData, schema);
```

### 4. Use Error Recovery

```typescript
import { ErrorRecoveryManager } from './core/errors/enterprise-errors';

// For external APIs
const data = await ErrorRecoveryManager.retryWithBackoff(
  () => api.fetchData(),
  { maxAttempts: 3 }
);
```

### 5. Rotate Secrets Regularly

```typescript
import { SecretManager } from './core/security/enterprise-security';

// Setup rotation job
setInterval(() => {
  const newToken = generateNewToken();
  SecretManager.rotateSecret('API_TOKEN', newToken);
}, 24 * 60 * 60 * 1000); // Daily
```

---

## 🧪 Testing

All enterprise components are designed for testability:

```typescript
import { EnterpriseLogger, LogLevel } from './core/logging/enterprise-logger';

// Create test logger
const testLogger = new EnterpriseLogger({
  level: LogLevel.DEBUG,
  enableConsole: false,
  enableFile: false
});

// Mock transport
testLogger.on('log', (entry) => {
  // Assert on log entries
});
```

---

## 📝 Migration Guide

### From Legacy Logging

**Before:**
```javascript
console.log('User logged in:', userId);
```

**After:**
```typescript
logger.info('User logged in', { userId });
```

### From Legacy Error Handling

**Before:**
```javascript
try {
  // code
} catch (error) {
  console.error(error);
}
```

**After:**
```typescript
try {
  // code
} catch (error) {
  logger.error('Operation failed', error, { component: 'MyComponent' });
  throw new InternalServerError('Operation failed');
}
```

---

## 🚀 Future Enhancements

Planned features:
- [ ] Integration with HashiCorp Vault
- [ ] APM integration (New Relic, DataDog APM)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Metrics export (Prometheus)
- [ ] Real-time alerting
- [ ] SLA monitoring
- [ ] Automatic security patching

---

## 📄 License

Part of QAntum SaaS Framework - Enterprise Edition
© 2025 Dimitar Prodromov

---

**Status**: ✅ Production Ready | 🔐 Enterprise Security | 📊 Full Observability | 🛡️ Self-Healing
