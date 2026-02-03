/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of QAntum.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited without express written permission.
 * 
 * For licensing inquiries: dimitar.papazov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  BastionController,
  SandboxExecutor,
  WorkerPoolManager,
  MemoryHardeningManager,
  NeuralVault,
  ChecksumValidator,
  CircuitBreakerManager,
  HealthCheckSystem,
  SecurityPolicy,
  BastionConfig,
} from '../src/bastion';

// ═══════════════════════════════════════════════════════════════════════════
// SANDBOX EXECUTOR TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🔒 SandboxExecutor', () => {
  let sandbox: SandboxExecutor;

  beforeEach(() => {
    sandbox = new SandboxExecutor({ enabled: true, logViolations: false });
  });

  describe('Safe Code Execution', () => {
    it('should execute safe JavaScript code', async () => {
      const result = await sandbox.execute('1 + 2');
      expect(result.success).toBe(true);
      expect(result.result).toBe(3);
    });

    it('should execute code with context variables', async () => {
      const result = await sandbox.execute('x * y', { x: 4, y: 5 });
      expect(result.success).toBe(true);
      expect(result.result).toBe(20);
    });

    it('should allow safe Math operations', async () => {
      const result = await sandbox.execute('Math.sqrt(16) + Math.pow(2, 3)');
      expect(result.success).toBe(true);
      expect(result.result).toBe(12); // 4 + 8
    });

    it('should allow JSON operations', async () => {
      const result = await sandbox.execute('JSON.stringify({ a: 1, b: 2 })');
      expect(result.success).toBe(true);
      expect(result.result).toBe('{"a":1,"b":2}');
    });
  });

  describe('Security Violations', () => {
    it('should block process access', async () => {
      const result = await sandbox.execute('process.exit(1)');
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].type).toBe('process');
    });

    it('should block filesystem access', async () => {
      const result = await sandbox.execute('fs.readFileSync("/etc/passwd")');
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].type).toBe('filesystem');
    });

    it('should block network access', async () => {
      // The fetch call itself is blocked and records a violation
      const result = await sandbox.execute('fetch("http://evil.com")');
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].type).toBe('network');
    });

    it('should block eval', async () => {
      // eval is undefined in sandbox
      const result = await sandbox.execute('typeof eval');
      expect(result.result).toBe('undefined');
    });
  });

  describe('Mutation Validation', () => {
    it('should validate safe mutation as safe', async () => {
      const validation = await sandbox.validateMutation(
        'mut-001',
        'x + 1',  // Expression, not return statement (vm doesn't allow bare return)
        { x: 5 }
      );
      expect(validation.isSafe).toBe(true);
      expect(validation.isMalicious).toBe(false);
      expect(validation.recommendation).toBe('apply');
    });

    it('should reject malicious mutation', async () => {
      const validation = await sandbox.validateMutation(
        'mut-002',
        'process.env.SECRET_KEY',
        {}
      );
      expect(validation.isMalicious).toBe(true);
      expect(validation.recommendation).toBe('reject');
    });

    it('should flag unstable mutation for review', async () => {
      // Code that would cause timeout or memory issues
      const validation = await sandbox.validateMutation(
        'mut-003',
        'throw new Error("test error")',
        {}
      );
      expect(validation.isUnstable).toBe(true);
      expect(validation.recommendation).toBe('review');
    });
  });

  describe('Statistics', () => {
    it('should track execution count', async () => {
      await sandbox.execute('1');
      await sandbox.execute('2');
      await sandbox.execute('3');
      
      const stats = sandbox.getStats();
      expect(stats.executionCount).toBe(3);
    });

    it('should track violations', async () => {
      await sandbox.execute('process.exit()');
      
      const violations = sandbox.getViolations();
      expect(violations.length).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// WORKER POOL TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🧵 WorkerPoolManager', () => {
  let pool: WorkerPoolManager;

  beforeEach(() => {
    pool = new WorkerPoolManager({
      workerCount: 2,
      taskTimeout: 5000
    });
  });

  afterEach(async () => {
    await pool.shutdown(false);
  });

  describe('Pool Management', () => {
    it('should initialize with configured worker count', () => {
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(2);
    });

    it('should report worker info', () => {
      const workers = pool.getWorkerInfo();
      expect(workers.length).toBe(2);
      expect(workers[0].status).toBeDefined();
    });

    it('should scale workers up', () => {
      pool.scale(4);
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(4);
    });

    it('should scale workers down', () => {
      pool.scale(1);
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should track uptime', () => {
      const stats = pool.getStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track queue size', () => {
      const stats = pool.getStats();
      expect(stats.queueSize).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY HARDENING TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🧠 MemoryHardeningManager', () => {
  let memory: MemoryHardeningManager;

  beforeEach(() => {
    memory = new MemoryHardeningManager();
  });

  afterEach(() => {
    memory.shutdown();
  });

  describe('Browser Tracking', () => {
    it('should register browser with metadata', () => {
      const mockBrowser = { id: 'test-browser' };
      memory.registerBrowser(mockBrowser, 'browser-001');
      
      const metadata = memory.getBrowserMetadata(mockBrowser);
      expect(metadata).toBeDefined();
      expect(metadata?.instanceId).toBe('browser-001');
      expect(metadata?.isActive).toBe(true);
    });

    it('should update browser activity', () => {
      const mockBrowser = { id: 'test-browser' };
      memory.registerBrowser(mockBrowser, 'browser-002');
      memory.updateBrowserActivity(mockBrowser, 5, 1024 * 1024);
      
      const metadata = memory.getBrowserMetadata(mockBrowser);
      expect(metadata?.pagesOpened).toBe(5);
      expect(metadata?.memoryEstimate).toBe(1024 * 1024);
    });

    it('should deactivate browser', () => {
      const mockBrowser = { id: 'test-browser' };
      memory.registerBrowser(mockBrowser, 'browser-003');
      memory.deactivateBrowser(mockBrowser);
      
      const metadata = memory.getBrowserMetadata(mockBrowser);
      expect(metadata?.isActive).toBe(false);
    });
  });

  describe('Resource Tracking', () => {
    it('should track resources with WeakRef', () => {
      const resource = { type: 'ghost' };
      memory.trackResource('ghost', resource, 'ghost-001');
      
      expect(memory.isResourceAlive('ghost-001')).toBe(true);
    });

    it('should retrieve tracked resource', () => {
      const resource = { type: 'page', url: 'https://test.com' };
      memory.trackResource('page', resource, 'page-001');
      
      const retrieved = memory.getResource('page-001');
      expect(retrieved).toBe(resource);
    });

    it('should attach metadata to objects', () => {
      const obj = { id: 'test' };
      memory.attachMetadata(obj, { custom: 'value' });
      
      const metadata = memory.getMetadata(obj);
      expect(metadata?.custom).toBe('value');
    });
  });

  describe('Statistics', () => {
    it('should track memory stats', () => {
      const stats = memory.getMemoryStats();
      expect(stats.heapUsed).toBeGreaterThan(0);
      expect(stats.heapTotal).toBeGreaterThan(0);
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should track resource counts', () => {
      const resource = { id: 'test' };
      memory.trackResource('ghost', resource, 'ghost-stats');
      
      const tracker = memory.getTrackerStats('ghost');
      expect((tracker as any).totalCreated).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// NEURAL VAULT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🔐 NeuralVault', () => {
  let vault: NeuralVault;
  const testPassword = 'test-secure-password-123!';

  beforeEach(async () => {
    vault = new NeuralVault({
      enabled: true,
      vaultPath: './test-vault.encrypted',
      compression: true
    });
    await vault.initialize(testPassword, false);
  });

  afterEach(async () => {
    await vault.close();
  });

  describe('Encryption/Decryption', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalData = { secret: 'classified', value: 42 };
      const encrypted = await vault.encrypt(originalData);
      
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      
      const decrypted = await vault.decrypt(encrypted);
      expect(decrypted).toEqual(originalData);
    });

    it('should generate unique IVs for each encryption', async () => {
      const data = { test: 'data' };
      const encrypted1 = await vault.encrypt(data);
      const encrypted2 = await vault.encrypt(data);
      
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });
  });

  describe('Storage Operations', () => {
    it('should store and retrieve data', async () => {
      const testData = { predictions: [1, 2, 3], confidence: 0.95 };
      await vault.store('test-entry', 'predictions', testData);
      
      const retrieved = await vault.retrieve('test-entry');
      expect(retrieved).toEqual(testData);
    });

    it('should check entry existence', async () => {
      await vault.store('exists-entry', 'metrics', { count: 1 });
      
      expect(vault.has('exists-entry')).toBe(true);
      expect(vault.has('nonexistent')).toBe(false);
    });

    it('should delete entries', async () => {
      await vault.store('delete-me', 'mutations', { code: 'test' });
      expect(vault.has('delete-me')).toBe(true);
      
      vault.delete('delete-me');
      expect(vault.has('delete-me')).toBe(false);
    });

    it('should list all entries', async () => {
      await vault.store('entry-1', 'ghost_knowledge', { a: 1 });
      await vault.store('entry-2', 'predictions', { b: 2 });
      
      const entries = vault.listEntries();
      expect(entries.length).toBe(2);
      expect(entries.some(e => e.id === 'entry-1')).toBe(true);
      expect(entries.some(e => e.id === 'entry-2')).toBe(true);
    });
  });

  describe('Integrity Verification', () => {
    it('should verify data integrity with checksum', async () => {
      await vault.store('integrity-test', 'versions', { version: 1 });
      const isValid = await vault.verifyIntegrity('integrity-test');
      expect(isValid).toBe(true);
    });

    it('should calculate SHA-256 checksums', () => {
      const checksum1 = vault.calculateChecksum('test data');
      const checksum2 = vault.calculateChecksum('test data');
      const checksum3 = vault.calculateChecksum('different data');
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).not.toBe(checksum3);
      expect(checksum1.length).toBe(64); // SHA-256 hex length
    });
  });

  describe('Statistics', () => {
    it('should track operations', async () => {
      await vault.encrypt({ test: 1 });
      await vault.encrypt({ test: 2 });
      
      const stats = vault.getStats();
      expect(stats.operationCount).toBeGreaterThanOrEqual(2);
    });

    it('should report sync status', () => {
      const status = vault.getSyncStatus();
      expect(status.isSyncing).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CHECKSUM VALIDATOR TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🔍 ChecksumValidator', () => {
  let validator: ChecksumValidator;

  beforeEach(() => {
    validator = new ChecksumValidator({ cacheEnabled: true });
  });

  describe('Hash Generation', () => {
    it('should hash strings consistently', () => {
      const hash1 = validator.hashString('hello world');
      const hash2 = validator.hashString('hello world');
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256
    });

    it('should hash buffers', () => {
      const buffer = Buffer.from('test data', 'utf-8');
      const hash = validator.hashBuffer(buffer);
      
      expect(hash.length).toBe(64);
    });

    it('should hash data objects', () => {
      const record = validator.hashData({ key: 'value', num: 42 });
      
      expect(record.hash).toBeDefined();
      expect(record.algorithm).toBe('sha256');
      expect(record.size).toBeGreaterThan(0);
    });
  });

  describe('Verification', () => {
    it('should verify matching data', () => {
      const data = { test: 'value' };
      const hash = validator.hashString(JSON.stringify(data));
      
      expect(validator.verifyData(data, hash)).toBe(true);
    });

    it('should reject mismatched data', () => {
      const data = { test: 'value' };
      const wrongHash = validator.hashString('wrong data');
      
      expect(validator.verifyData(data, wrongHash)).toBe(false);
    });

    it('should compare hashes securely (timing-safe)', () => {
      const hash1 = validator.hashString('data');
      const hash2 = validator.hashString('data');
      const hash3 = validator.hashString('different');
      
      expect(validator.compareHashes(hash1, hash2)).toBe(true);
      expect(validator.compareHashes(hash1, hash3)).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache checksums', () => {
      const record = validator.hashData({ cached: true });
      const cached = validator.getCached(record.id);
      
      expect(cached).toBeDefined();
      expect(cached?.hash).toBe(record.hash);
    });

    it('should clear cache', () => {
      const record = validator.hashData({ clear: true });
      validator.clearCache();
      
      expect(validator.getCached(record.id)).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    it('should track operations', () => {
      validator.hashString('a');
      validator.hashString('b');
      validator.hashBuffer(Buffer.from('c'));
      
      const stats = validator.getStats();
      expect(stats.operationCount).toBe(3);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('⚡ CircuitBreakerManager', () => {
  let breaker: CircuitBreakerManager;

  beforeEach(() => {
    breaker = new CircuitBreakerManager({
      enabled: true,
      failureThreshold: 3,
      successThreshold: 2,
      resetTimeout: 1000,
      healthCheckInterval: 60000 // Long interval to avoid interference
    });
  });

  afterEach(() => {
    breaker.shutdown();
  });

  describe('Circuit States', () => {
    it('should start in closed state', () => {
      expect(breaker.getCircuitState('gemini')).toBe('closed');
    });

    it('should allow requests when closed', () => {
      expect(breaker.canRequest('gemini')).toBe(true);
    });

    it('should force circuit state', () => {
      breaker.forceState('gemini', 'open');
      expect(breaker.getCircuitState('gemini')).toBe('open');
      expect(breaker.canRequest('gemini')).toBe(false);
    });

    it('should reset all circuits', () => {
      breaker.forceState('gemini', 'open');
      breaker.forceState('claude', 'open');
      
      breaker.resetAll();
      
      expect(breaker.getCircuitState('gemini')).toBe('closed');
      expect(breaker.getCircuitState('claude')).toBe('closed');
    });
  });

  describe('Fallback Chain', () => {
    it('should have default fallback chain', () => {
      const chain = breaker.getFallbackChain();
      expect(chain.primary).toBe('gemini');
      expect(chain.fallbacks).toContain('ollama');
    });

    it('should set primary service', () => {
      breaker.setPrimary('claude');
      const chain = breaker.getFallbackChain();
      expect(chain.primary).toBe('claude');
    });
  });

  describe('Execute with Protection', () => {
    it('should execute successful requests', async () => {
      const result = await breaker.execute(async () => 'success');
      expect(result).toBe('success');
    });

    it('should track statistics', async () => {
      await breaker.execute(async () => 'ok');
      await breaker.execute(async () => 'ok');
      
      const stats = breaker.getStats();
      expect(stats.requestCount).toBe(2);
    });
  });

  describe('Service Health', () => {
    it('should report all service health', () => {
      const health = breaker.getAllServiceHealth();
      expect(health.length).toBeGreaterThan(0);
      expect(health.some(h => h.service === 'gemini')).toBe(true);
    });

    it('should get active service', () => {
      expect(breaker.getActiveService()).toBe('gemini');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK SYSTEM TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('💓 HealthCheckSystem', () => {
  let health: HealthCheckSystem;

  beforeEach(() => {
    health = new HealthCheckSystem({
      enabled: true,
      interval: 60000, // Long interval to control manually
      historyRetention: 50
    });
  });

  afterEach(() => {
    health.shutdown();
  });

  describe('Built-in Checks', () => {
    it('should have memory check registered', async () => {
      const results = await health.runAllChecks();
      const memoryCheck = results.find(r => r.module === 'memory');
      expect(memoryCheck).toBeDefined();
    });

    it('should have CPU check registered', async () => {
      const results = await health.runAllChecks();
      const cpuCheck = results.find(r => r.module === 'cpu');
      expect(cpuCheck).toBeDefined();
    });

    it('should have event loop check', async () => {
      const results = await health.runAllChecks();
      const eventLoopCheck = results.find(r => r.module === 'event-loop');
      expect(eventLoopCheck).toBeDefined();
    });
  });

  describe('Custom Checks', () => {
    it('should register custom health check', async () => {
      health.register('custom', async () => ({
        module: 'custom',
        healthy: true,
        duration: 0,
        message: 'Custom check OK',
        timestamp: new Date()
      }));

      const results = await health.runAllChecks();
      const customCheck = results.find(r => r.module === 'custom');
      expect(customCheck).toBeDefined();
      expect(customCheck?.healthy).toBe(true);
    });

    it('should unregister checks', () => {
      health.register('temp', async () => ({
        module: 'temp',
        healthy: true,
        duration: 0,
        message: 'Temp',
        timestamp: new Date()
      }));

      const removed = health.unregister('temp');
      expect(removed).toBe(true);
    });
  });

  describe('Health Status', () => {
    it('should get overall health', async () => {
      const systemHealth = await health.getHealth();
      expect(systemHealth.healthy).toBeDefined();
      expect(systemHealth.modules.length).toBeGreaterThan(0);
      expect(systemHealth.memoryUsage.heapUsed).toBeGreaterThan(0);
    });

    it('should get last results', async () => {
      await health.runAllChecks();
      const last = health.getLastResults();
      expect(last.length).toBeGreaterThan(0);
    });
  });

  describe('Alerts', () => {
    it('should have no active alerts initially', () => {
      const alerts = health.getActiveAlerts();
      expect(alerts.length).toBe(0);
    });

    it('should get all alerts', () => {
      const alerts = health.getAllAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('Trends', () => {
    it('should calculate health trend', async () => {
      // Run multiple checks to generate history
      await health.runAllChecks();
      await health.runAllChecks();
      
      const trend = health.getHealthTrend();
      expect(['improving', 'stable', 'degrading']).toContain(trend.trend);
      expect(trend.avgHealth).toBeGreaterThanOrEqual(0);
      expect(trend.avgHealth).toBeLessThanOrEqual(1);
    });
  });

  describe('Statistics', () => {
    it('should track stats', async () => {
      await health.runAllChecks();
      
      const stats = health.getStats();
      expect(stats.checksPerformed).toBeGreaterThan(0);
      expect(stats.registeredChecks).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BASTION CONTROLLER TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🏰 BastionController', () => {
  let bastion: BastionController;
  const testPassword = 'bastion-test-password-456!';

  beforeEach(async () => {
    bastion = new BastionController({
      enabled: true,
      verbose: false,
      healthCheckInterval: 60000,
      sandbox: { logViolations: false },
      workerPool: { workerCount: 1 },
      neuralVault: { vaultPath: './test-bastion-vault.encrypted' }
    });
    await bastion.initialize(testPassword);
  });

  afterEach(async () => {
    await bastion.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(bastion.isReady()).toBe(true);
    });

    it('should not initialize twice', async () => {
      await bastion.initialize(testPassword);
      expect(bastion.isReady()).toBe(true);
    });
  });

  describe('Sandbox Integration', () => {
    it('should validate mutations', async () => {
      const result = await bastion.validateMutation(
        'test-mut',
        '1 + 1',  // Expression, not return statement (vm doesn't allow bare return)
        {}
      );
      expect(result.isSafe).toBe(true);
    });

    it('should get violations', () => {
      const violations = bastion.getViolations();
      expect(Array.isArray(violations)).toBe(true);
    });
  });

  describe('Memory Integration', () => {
    it('should track browser', () => {
      const mockBrowser = { id: 'bastion-browser' };
      bastion.trackBrowser(mockBrowser, 'browser-bastion-001');
      // No error means success
    });

    it('should get memory stats', () => {
      const stats = bastion.getMemoryStats();
      expect(stats.heapUsed).toBeGreaterThan(0);
    });
  });

  describe('Vault Integration', () => {
    it('should store and retrieve secure data', async () => {
      await bastion.storeSecure('bastion-test', 'metrics', { count: 100 });
      const retrieved = await bastion.retrieveSecure('bastion-test');
      expect(retrieved).toEqual({ count: 100 });
    });

    it('should generate checksums', () => {
      const checksum = bastion.generateChecksum({ data: 'test' });
      expect(checksum.length).toBe(64);
    });

    it('should verify checksums', () => {
      const data = { verify: 'me' };
      const checksum = bastion.generateChecksum(data);
      expect(bastion.verifyChecksum(data, checksum)).toBe(true);
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should get active service', () => {
      const service = bastion.getActiveService();
      expect(service).toBe('gemini');
    });

    it('should set primary service', () => {
      bastion.setPrimaryService('ollama');
      expect(bastion.getActiveService()).toBe('ollama');
    });

    it('should get circuit stats', () => {
      const stats = bastion.getCircuitStats();
      expect(stats.requestCount).toBeDefined();
    });
  });

  describe('Health Integration', () => {
    it('should get system health', async () => {
      const health = await bastion.getHealth();
      expect(health.healthy).toBeDefined();
      expect(health.modules.length).toBeGreaterThan(0);
    });

    it('should get health trend', () => {
      const trend = bastion.getHealthTrend();
      expect(['improving', 'stable', 'degrading']).toContain(trend.trend);
    });

    it('should register custom health check', async () => {
      bastion.registerHealthCheck('custom-bastion', async () => ({
        healthy: true,
        message: 'Custom OK'
      }));
      
      const health = await bastion.getHealth();
      expect(health.modules.some(m => m.module === 'custom-bastion')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should get comprehensive stats', () => {
      const stats = bastion.getStats();
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
      expect(stats.sandboxExecutions).toBeDefined();
      expect(stats.workerTasksCompleted).toBeDefined();
    });
  });

  describe('Components Access', () => {
    it('should expose all components', () => {
      const components = bastion.getComponents();
      expect(components.sandbox).toBeDefined();
      expect(components.workerPool).toBeDefined();
      expect(components.memoryManager).toBeDefined();
      expect(components.vault).toBeDefined();
      expect(components.checksum).toBeDefined();
      expect(components.circuitBreaker).toBeDefined();
      expect(components.healthCheck).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('🔗 Integration Tests', () => {
  let bastion: BastionController;

  beforeEach(async () => {
    bastion = new BastionController({
      enabled: true,
      verbose: false
    });
    await bastion.initialize('integration-test-password');
  });

  afterEach(async () => {
    await bastion.shutdown();
  });

  it('should validate mutation and store result', async () => {
    const validation = await bastion.validateMutation(
      'integration-mut-001',
      'return x * 2',
      { x: 5 }
    );
    
    await bastion.storeSecure(
      'mutation-result-001',
      'mutations',
      validation
    );
    
    const stored = await bastion.retrieveSecure('mutation-result-001');
    expect(stored?.mutationId).toBe('integration-mut-001');
  });

  it('should track resource and verify health', async () => {
    const resource = { type: 'integration-test' };
    bastion.trackResource('ghost', resource, 'ghost-integration');
    
    const health = await bastion.getHealth();
    expect(health.healthy).toBeDefined();
  });

  it('should maintain data integrity with checksums', async () => {
    const originalData = { important: 'data', value: 42 };
    const checksum = bastion.generateChecksum(originalData);
    
    await bastion.storeSecure('integrity-test', 'metrics', {
      data: originalData,
      checksum
    });
    
    const stored = await bastion.retrieveSecure('integrity-test');
    expect(bastion.verifyChecksum(stored?.data, stored?.checksum)).toBe(true);
  });
});
