// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  CYBERCODY v1.1.0 - BOLA TESTER                                              ║
// ║  "The Identity Thief" - Broken Object Level Authorization Testing            ║
// ║  Specialization: Autonomous API Security Architect & Logic Hunter            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';
import { generateUUID } from '../scripts/utils/crypto';
import type { HTTPMethod } from '../types/index';
import type {
  BOLATarget,
  APIMap,
  AuthenticationInfo,
} from '../modules/api-interceptor';

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 BOLA TESTER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BOLA test configuration
 */
export interface BOLATestConfig {
  /** API map from interceptor */
  apiMap: APIMap;
  /** Number of ID variations to test */
  variationsPerTarget?: number;
  /** Worker threads for parallel testing */
  workerCount?: number;
  /** Delay between requests (ms) */
  delayMs?: number;
  /** Request timeout (ms) */
  timeoutMs?: number;
  /** Authentication tokens to test with */
  authTokens?: AuthenticationInfo[];
  /** Test without auth as well */
  testUnauthenticated?: boolean;
  /** Custom ID values to test */
  customIds?: string[];
}

/**
 * Single BOLA test result
 */
export interface BOLATestResult {
  target: BOLATarget;
  testId: string;
  timestamp: Date;

  /** Original request */
  originalRequest: {
    url: string;
    method: HTTPMethod;
    authToken?: string;
  };

  /** Modified request (with swapped ID) */
  testedRequest: {
    url: string;
    method: HTTPMethod;
    testedValue: string;
    authToken?: string;
  };

  /** Original response */
  originalResponse: {
    statusCode: number;
    bodyHash: string;
    bodyLength: number;
    sensitiveFields: string[];
  };

  /** Tested response (with different ID) */
  testedResponse: {
    statusCode: number;
    bodyHash: string;
    bodyLength: number;
    sensitiveFields: string[];
    responseTime: number;
  };

  /** Vulnerability assessment */
  vulnerability: BOLAVulnerability;
}

/**
 * BOLA vulnerability details
 */
export interface BOLAVulnerability {
  detected: boolean;
  confidence: 'low' | 'medium' | 'high' | 'confirmed';
  type: BOLAType;
  evidence: string[];
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  dataExposed?: string[];
}

export type BOLAType =
  | 'horizontal_privilege_escalation'  // Access other user's data
  | 'vertical_privilege_escalation'    // Access higher privilege data
  | 'data_enumeration'                 // Can enumerate all records
  | 'unauthorized_access'              // Access without proper auth
  | 'none';

/**
 * ID mutation strategy
 */
export interface IDMutation {
  type: 'increment' | 'decrement' | 'random' | 'zero' | 'negative' | 'max' | 'uuid' | 'custom';
  value: string;
  description: string;
}

/**
 * Complete BOLA test report
 */
export interface BOLATestReport {
  target: string;
  startTime: Date;
  endTime: Date;
  totalTargets: number;
  totalTests: number;
  vulnerabilitiesFound: number;

  results: BOLATestResult[];

  summary: {
    criticalVulns: number;
    highVulns: number;
    mediumVulns: number;
    lowVulns: number;
    confirmedBOLA: BOLATestResult[];
    potentialBOLA: BOLATestResult[];
  };

  recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 ID MUTATION STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate ID mutations based on original value
 */
function generateIDMutations(originalValue: string, customIds: string[] = []): IDMutation[] {
  const mutations: IDMutation[] = [];

  // Numeric IDs
  if (/^\d+$/.test(originalValue)) {
    const numValue = parseInt(originalValue, 10);

    mutations.push(
      { type: 'increment', value: String(numValue + 1), description: 'ID + 1' },
      { type: 'decrement', value: String(numValue - 1), description: 'ID - 1' },
      { type: 'increment', value: String(numValue + 10), description: 'ID + 10' },
      { type: 'increment', value: String(numValue + 100), description: 'ID + 100' },
      { type: 'zero', value: '0', description: 'Zero ID' },
      { type: 'zero', value: '1', description: 'First ID' },
      { type: 'negative', value: '-1', description: 'Negative ID' },
      { type: 'max', value: '999999999', description: 'Large ID' },
      { type: 'random', value: String(Math.floor(Math.random() * 10000)), description: 'Random ID' },
    );
  }

  // UUID
  else if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(originalValue)) {
    // Generate similar UUIDs
    const parts = originalValue.split('-');
    mutations.push(
      {
        type: 'uuid',
        value: `${incrementHex(parts[0]!)}-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`,
        description: 'UUID first segment +1'
      },
      {
        type: 'uuid',
        value: `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${incrementHex(parts[4]!)}`,
        description: 'UUID last segment +1'
      },
      {
        type: 'uuid',
        value: '00000000-0000-0000-0000-000000000001',
        description: 'Common first UUID'
      },
      {
        type: 'random',
        value: generateRandomUUID(),
        description: 'Random UUID'
      },
    );
  }

  // MongoDB ObjectId
  else if (/^[a-f0-9]{24}$/i.test(originalValue)) {
    mutations.push(
      { type: 'increment', value: incrementHex(originalValue), description: 'ObjectId +1' },
      { type: 'decrement', value: decrementHex(originalValue), description: 'ObjectId -1' },
      { type: 'zero', value: '000000000000000000000001', description: 'First ObjectId' },
      { type: 'random', value: generateRandomObjectId(), description: 'Random ObjectId' },
    );
  }

  // String/slug
  else {
    mutations.push(
      { type: 'custom', value: 'admin', description: 'Admin user' },
      { type: 'custom', value: 'test', description: 'Test user' },
      { type: 'custom', value: 'user', description: 'Generic user' },
      { type: 'custom', value: '1', description: 'Numeric 1' },
    );
  }

  // Add custom IDs
  for (const customId of customIds) {
    if (customId !== originalValue) {
      mutations.push({ type: 'custom', value: customId, description: `Custom: ${customId}` });
    }
  }

  return mutations;
}

function incrementHex(hex: string): string {
  const num = BigInt('0x' + hex);
  return (num + 1n).toString(16).padStart(hex.length, '0');
}

function decrementHex(hex: string): string {
  const num = BigInt('0x' + hex);
  return (num - 1n).toString(16).padStart(hex.length, '0');
}

function generateRandomUUID(): string {
  return generateUUID();
}

function generateRandomObjectId(): string {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 SENSITIVE DATA DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const SENSITIVE_RESPONSE_FIELDS = [
  'email', 'phone', 'address', 'ssn', 'password', 'token', 'secret',
  'credit_card', 'card_number', 'cvv', 'bank_account', 'iban',
  'salary', 'income', 'balance', 'transaction', 'payment',
  'private', 'confidential', 'internal', 'admin', 'role',
  'permission', 'access_level', 'api_key', 'auth',
];

function detectSensitiveFields(body: string): string[] {
  const found: string[] = [];
  const lowerBody = body.toLowerCase();

  for (const field of SENSITIVE_RESPONSE_FIELDS) {
    if (lowerBody.includes(field)) {
      found.push(field);
    }
  }

  // Check for patterns
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(body)) {
    found.push('email_address');
  }
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(body)) {
    found.push('ssn_pattern');
  }
  if (/\b(?:\d{4}[- ]?){3}\d{4}\b/.test(body)) {
    found.push('credit_card_pattern');
  }

  return [...new Set(found)];
}

function hashBody(body: string): string {
  const { createHash } = require('crypto');
  return createHash('md5').update(body).digest('hex');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧵 WORKER THREAD CODE
// ═══════════════════════════════════════════════════════════════════════════════

interface BOLAWorkerData {
  target: BOLATarget;
  mutations: IDMutation[];
  authToken?: AuthenticationInfo;
  timeoutMs: number;
  delayMs: number;
}

interface BOLAWorkerResult {
  results: BOLATestResult[];
  error?: string;
}

// Worker thread execution
if (!isMainThread && parentPort) {
  const data = workerData as BOLAWorkerData;

  (async () => {
    const results: BOLATestResult[] = [];

    // First, get baseline response with original ID
    const originalUrl = buildUrl(data.target.endpoint, data.target.parameter, data.target.originalValue, data.target.parameterType);
    const baselineResponse = await makeRequest(originalUrl, data.target.method, data.authToken, data.timeoutMs);

    // Test each mutation
    for (const mutation of data.mutations) {
      try {
        const testedUrl = buildUrl(
          data.target.endpoint,
          data.target.parameter,
          mutation.value,
          data.target.parameterType
        );

        const testedResponse = await makeRequest(testedUrl, data.target.method, data.authToken, data.timeoutMs);

        // Analyze vulnerability
        const vulnerability = analyzeVulnerability(
          baselineResponse,
          testedResponse,
          data.target,
          mutation
        );

        results.push({
          target: data.target,
          testId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          originalRequest: {
            url: originalUrl,
            method: data.target.method,
            authToken: data.authToken?.token,
          },
          testedRequest: {
            url: testedUrl,
            method: data.target.method,
            testedValue: mutation.value,
            authToken: data.authToken?.token,
          },
          originalResponse: {
            statusCode: baselineResponse.statusCode,
            bodyHash: hashBody(baselineResponse.body),
            bodyLength: baselineResponse.body.length,
            sensitiveFields: detectSensitiveFields(baselineResponse.body),
          },
          testedResponse: {
            statusCode: testedResponse.statusCode,
            bodyHash: hashBody(testedResponse.body),
            bodyLength: testedResponse.body.length,
            sensitiveFields: detectSensitiveFields(testedResponse.body),
            responseTime: testedResponse.responseTime,
          },
          vulnerability,
        });

        // Rate limiting
        if (data.delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, data.delayMs));
        }
      } catch (error) {
        // Record failed test
        results.push({
          target: data.target,
          testId: `${Date.now()}-error`,
          timestamp: new Date(),
          originalRequest: { url: originalUrl, method: data.target.method },
          testedRequest: {
            url: data.target.endpoint,
            method: data.target.method,
            testedValue: mutation.value
          },
          originalResponse: { statusCode: 0, bodyHash: '', bodyLength: 0, sensitiveFields: [] },
          testedResponse: { statusCode: 0, bodyHash: '', bodyLength: 0, sensitiveFields: [], responseTime: 0 },
          vulnerability: {
            detected: false,
            confidence: 'low',
            type: 'none',
            evidence: [`Test failed: ${error instanceof Error ? error.message : 'Unknown'}`],
            severity: 'info',
          },
        });
      }
    }

    parentPort!.postMessage({ results } as BOLAWorkerResult);
  })();
}

function buildUrl(
  endpoint: string,
  parameter: string,
  value: string,
  paramType: 'path' | 'query' | 'body'
): string {
  if (paramType === 'query') {
    const url = new URL(endpoint, 'http://localhost');
    url.searchParams.set(parameter, value);
    return url.pathname + url.search;
  }

  // Path parameter - replace the value in the path
  // This is a simplified version - real implementation would need the full URL pattern
  return endpoint.replace(/\{[^}]+\}|\d+|[a-f0-9-]{36}|[a-f0-9]{24}/gi, value);
}

interface RequestResponse {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
  responseTime: number;
}

async function makeRequest(
  url: string,
  method: HTTPMethod,
  auth?: AuthenticationInfo,
  timeout: number = 10000
): Promise<RequestResponse> {
  const startTime = Date.now();
  const headers: Record<string, string> = {
    'User-Agent': 'CyberCody/1.1 BOLA-Tester',
    'Accept': 'application/json',
  };

  if (auth) {
    if (auth.type === 'bearer' && auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    } else if (auth.type === 'apikey' && auth.token && auth.headerName) {
      headers[auth.headerName] = auth.token;
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    });

    const body = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((v, k) => { responseHeaders[k] = v; });

    return {
      statusCode: response.status,
      body,
      headers: responseHeaders,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      statusCode: 0,
      body: error instanceof Error ? error.message : 'Unknown error',
      headers: {},
      responseTime: Date.now() - startTime,
    };
  }
}

function analyzeVulnerability(
  baseline: RequestResponse,
  tested: RequestResponse,
  target: BOLATarget,
  mutation: IDMutation
): BOLAVulnerability {
  const evidence: string[] = [];
  let detected = false;
  let confidence: BOLAVulnerability['confidence'] = 'low';
  let type: BOLAType = 'none';
  let severity: BOLAVulnerability['severity'] = 'info';
  const dataExposed: string[] = [];

  // Case 1: Both return 200 with DIFFERENT data = CONFIRMED BOLA
  if (baseline.statusCode === 200 && tested.statusCode === 200) {
    const baselineHash = hashBody(baseline.body);
    const testedHash = hashBody(tested.body);

    if (baselineHash !== testedHash && tested.body.length > 50) {
      detected = true;
      evidence.push('Different data returned for different ID with same authentication');

      // Check if sensitive data is exposed
      const testedSensitive = detectSensitiveFields(tested.body);
      if (testedSensitive.length > 0) {
        confidence = 'confirmed';
        type = 'horizontal_privilege_escalation';
        severity = 'critical';
        evidence.push(`Sensitive data exposed: ${testedSensitive.join(', ')}`);
        dataExposed.push(...testedSensitive);
      } else {
        confidence = 'high';
        type = 'horizontal_privilege_escalation';
        severity = 'high';
        evidence.push('Different non-sensitive data returned');
      }
    }
  }

  // Case 2: Tested returns 200 when baseline returns 403/404 = PRIVILEGE ESCALATION
  if ((baseline.statusCode === 403 || baseline.statusCode === 404) && tested.statusCode === 200) {
    detected = true;
    confidence = 'confirmed';
    type = 'vertical_privilege_escalation';
    severity = 'critical';
    evidence.push(`Bypassed authorization: ${baseline.statusCode} → 200`);
  }

  // Case 3: Can enumerate sequential IDs (200 responses)
  if (mutation.type === 'increment' || mutation.type === 'decrement') {
    if (tested.statusCode === 200 && tested.body.length > 50) {
      if (!detected) {
        detected = true;
        confidence = 'medium';
        type = 'data_enumeration';
        severity = 'medium';
      }
      evidence.push(`Sequential ID ${mutation.description} returns valid data`);
    }
  }

  // Case 4: Access without authentication
  if (!target.originalValue && tested.statusCode === 200) {
    detected = true;
    confidence = 'high';
    type = 'unauthorized_access';
    severity = 'high';
    evidence.push('Endpoint accessible without authentication');
  }

  return {
    detected,
    confidence,
    type,
    evidence,
    severity,
    dataExposed: dataExposed.length > 0 ? dataExposed : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 BOLA TESTER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BOLA Tester - The Identity Thief
 * 
 * Tests for Broken Object Level Authorization vulnerabilities by
 * systematically swapping object IDs and analyzing server responses.
 */
export class BOLATester extends EventEmitter {
  private config: Required<BOLATestConfig>;
  private results: BOLATestResult[] = [];

  constructor(config: BOLATestConfig) {
    super();

    this.config = {
      apiMap: config.apiMap,
      variationsPerTarget: config.variationsPerTarget ?? 10,
      workerCount: config.workerCount ?? 4,
      delayMs: config.delayMs ?? 200,
      timeoutMs: config.timeoutMs ?? 10000,
      authTokens: config.authTokens ?? config.apiMap.authTokens,
      testUnauthenticated: config.testUnauthenticated ?? true,
      customIds: config.customIds ?? [],
    };
  }

  /**
   * Run BOLA tests on all identified targets
   */
  async test(): Promise<BOLATestReport> {
    const startTime = new Date();
    console.log('\n🎯 [BOLA_TESTER] Starting BOLA vulnerability testing...');
    console.log(`   Targets: ${this.config.apiMap.bolaTargets.length}`);
    console.log(`   Auth tokens: ${this.config.authTokens.length}`);
    console.log(`   Workers: ${this.config.workerCount}\n`);

    const targets = this.config.apiMap.bolaTargets;

    if (targets.length === 0) {
      console.log('   ⚠️  No BOLA targets found in API map\n');
      return this.generateEmptyReport(startTime);
    }

    // Process targets
    for (const target of targets) {
      console.log(`   Testing: ${target.method} ${target.endpoint} [${target.parameter}]`);

      const mutations = generateIDMutations(target.originalValue, this.config.customIds)
        .slice(0, this.config.variationsPerTarget);

      // Test with each auth token
      for (const authToken of this.config.authTokens) {
        const results = await this.runWorker({
          target,
          mutations,
          authToken,
          timeoutMs: this.config.timeoutMs,
          delayMs: this.config.delayMs,
        });

        this.results.push(...results.results);

        // Emit events for found vulnerabilities
        for (const result of results.results) {
          if (result.vulnerability.detected) {
            this.emit('vulnerability', result);
          }
        }
      }

      // Test without auth if configured
      if (this.config.testUnauthenticated) {
        const results = await this.runWorker({
          target,
          mutations,
          authToken: undefined,
          timeoutMs: this.config.timeoutMs,
          delayMs: this.config.delayMs,
        });

        this.results.push(...results.results);
      }
    }

    const report = this.generateReport(startTime);
    this.printReport(report);

    return report;
  }

  /**
   * Run worker thread for BOLA testing
   */
  private runWorker(data: BOLAWorkerData): Promise<BOLAWorkerResult> {
    return new Promise((resolve, reject) => {
      // Use __dirname for CommonJS compatibility
      const workerPath = new URL('./bola-tester.ts', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
      const worker = new Worker(workerPath, {
        workerData: data,
        execArgv: ['--import', 'tsx/esm']
      });

      worker.on('message', (result: BOLAWorkerResult) => {
        resolve(result);
        worker.terminate();
      });

      worker.on('error', (error) => {
        reject(error);
        worker.terminate();
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Generate test report
   */
  private generateReport(startTime: Date): BOLATestReport {
    const vulnerabilities = this.results.filter(r => r.vulnerability.detected);

    const confirmedBOLA = vulnerabilities.filter(v =>
      v.vulnerability.confidence === 'confirmed' || v.vulnerability.confidence === 'high'
    );

    const potentialBOLA = vulnerabilities.filter(v =>
      v.vulnerability.confidence === 'medium' || v.vulnerability.confidence === 'low'
    );

    const recommendations: string[] = [];

    if (confirmedBOLA.length > 0) {
      recommendations.push('🔴 CRITICAL: Implement proper authorization checks on all API endpoints');
      recommendations.push('🔴 Validate that the authenticated user owns the requested resource');
      recommendations.push('🔴 Use UUIDs instead of sequential IDs to prevent enumeration');
    }

    if (potentialBOLA.length > 0) {
      recommendations.push('🟡 Review identified endpoints for potential authorization issues');
      recommendations.push('🟡 Implement rate limiting to prevent ID enumeration');
    }

    recommendations.push('💡 Consider using middleware to enforce object-level authorization');
    recommendations.push('💡 Log and monitor access patterns for anomaly detection');

    return {
      target: this.config.apiMap.target,
      startTime,
      endTime: new Date(),
      totalTargets: this.config.apiMap.bolaTargets.length,
      totalTests: this.results.length,
      vulnerabilitiesFound: vulnerabilities.length,
      results: this.results,
      summary: {
        criticalVulns: vulnerabilities.filter(v => v.vulnerability.severity === 'critical').length,
        highVulns: vulnerabilities.filter(v => v.vulnerability.severity === 'high').length,
        mediumVulns: vulnerabilities.filter(v => v.vulnerability.severity === 'medium').length,
        lowVulns: vulnerabilities.filter(v => v.vulnerability.severity === 'low').length,
        confirmedBOLA,
        potentialBOLA,
      },
      recommendations,
    };
  }

  /**
   * Generate empty report
   */
  private generateEmptyReport(startTime: Date): BOLATestReport {
    return {
      target: this.config.apiMap.target,
      startTime,
      endTime: new Date(),
      totalTargets: 0,
      totalTests: 0,
      vulnerabilitiesFound: 0,
      results: [],
      summary: {
        criticalVulns: 0,
        highVulns: 0,
        mediumVulns: 0,
        lowVulns: 0,
        confirmedBOLA: [],
        potentialBOLA: [],
      },
      recommendations: ['Run API Interceptor first to identify BOLA targets'],
    };
  }

  /**
   * Print report to console
   */
  private printReport(report: BOLATestReport): void {
    const duration = (report.endTime.getTime() - report.startTime.getTime()) / 1000;

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎯 BOLA TESTER REPORT                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Target: ${report.target.substring(0, 65).padEnd(65)}║
║ Duration: ${duration.toFixed(2)}s                                                          ║
║ Tests Executed: ${report.totalTests.toString().padStart(5)}                                                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ VULNERABILITIES FOUND: ${report.vulnerabilitiesFound.toString().padStart(3)}                                                 ║
║   🔴 Critical: ${report.summary.criticalVulns.toString().padStart(3)}                                                          ║
║   🟠 High:     ${report.summary.highVulns.toString().padStart(3)}                                                          ║
║   🟡 Medium:   ${report.summary.mediumVulns.toString().padStart(3)}                                                          ║
║   🟢 Low:      ${report.summary.lowVulns.toString().padStart(3)}                                                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ CONFIRMED BOLA VULNERABILITIES:                                              ║`);

    for (const vuln of report.summary.confirmedBOLA.slice(0, 5)) {
      const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', info: '⚪' }[vuln.vulnerability.severity];
      console.log(`║   ${emoji} ${vuln.target.method.padEnd(6)} ${vuln.target.endpoint.substring(0, 50).padEnd(52)}║`);
      console.log(`║      └─ ${vuln.vulnerability.evidence[0]?.substring(0, 60).padEnd(62)}║`);
    }

    if (report.summary.confirmedBOLA.length === 0) {
      console.log(`║   ✅ No confirmed BOLA vulnerabilities found                                 ║`);
    }

    console.log(`╠══════════════════════════════════════════════════════════════════════════════╣
║ RECOMMENDATIONS:                                                             ║`);

    for (const rec of report.recommendations.slice(0, 4)) {
      console.log(`║ ${rec.substring(0, 72).padEnd(72)}║`);
    }

    console.log(`╚══════════════════════════════════════════════════════════════════════════════╝`);
  }

  /**
   * Get all results
   */
  getResults(): BOLATestResult[] {
    return this.results;
  }

  /**
   * Get confirmed vulnerabilities only
   */
  getConfirmedVulnerabilities(): BOLATestResult[] {
    return this.results.filter(r =>
      r.vulnerability.detected &&
      (r.vulnerability.confidence === 'confirmed' || r.vulnerability.confidence === 'high')
    );
  }

  /**
   * Export results to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.results, null, 2);
  }
}

export default BOLATester;
