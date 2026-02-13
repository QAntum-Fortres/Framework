/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: SECURITY TESTING
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * XSS, CSRF, SQL Injection detection, security scanner, penetration testing
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export type VulnerabilityType = 
  | 'xss' 
  | 'sqli' 
  | 'csrf' 
  | 'lfi' 
  | 'rfi' 
  | 'xxe' 
  | 'ssrf'
  | 'open-redirect'
  | 'header-injection'
  | 'command-injection'
  | 'path-traversal'
  | 'information-disclosure'
  | 'authentication-bypass'
  | 'insecure-deserialization';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: Severity;
  title: string;
  description: string;
  url: string;
  parameter?: string;
  payload?: string;
  evidence?: string;
  remediation: string;
  cwe?: string;
  owasp?: string;
  timestamp: Date;
}

export interface SecurityScanConfig {
  url: string;
  maxDepth?: number;
  maxPages?: number;
  timeout?: number;
  excludePatterns?: string[];
  includePatterns?: string[];
  scanTypes?: VulnerabilityType[];
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  authentication?: {
    type: 'basic' | 'bearer' | 'cookie' | 'form';
    credentials: Record<string, string>;
  };
}

export interface SecurityReport {
  scanId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  target: string;
  pagesScanned: number;
  vulnerabilities: Vulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  score: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// XSS PAYLOADS
// ═══════════════════════════════════════════════════════════════════════════════

const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  '"><script>alert("XSS")</script>',
  "'-alert('XSS')-'",
  '<body onload=alert("XSS")>',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<input onfocus=alert("XSS") autofocus>',
  '<marquee onstart=alert("XSS")>',
  '<video><source onerror="alert(\'XSS\')">',
  '{{constructor.constructor("alert(1)")()}}',
  '${alert("XSS")}',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert("XSS")>',
  '<a href="javascript:alert(\'XSS\')">click</a>',
  '<div style="background:url(javascript:alert(\'XSS\'))">',
  'data:text/html,<script>alert("XSS")</script>',
  '<object data="javascript:alert(\'XSS\')">',
  '<embed src="javascript:alert(\'XSS\')">',
  '<form action="javascript:alert(\'XSS\')"><input type=submit>',
  '<button onclick="alert(\'XSS\')">click</button>'
];

// ═══════════════════════════════════════════════════════════════════════════════
// SQL INJECTION PAYLOADS
// ═══════════════════════════════════════════════════════════════════════════════

const SQLI_PAYLOADS = [
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "1' OR '1'='1",
  "1 OR 1=1",
  "' UNION SELECT NULL--",
  "' UNION SELECT NULL,NULL--",
  "' UNION SELECT NULL,NULL,NULL--",
  "1'; DROP TABLE users--",
  "1; SELECT * FROM users",
  "admin'--",
  "admin' #",
  "' OR 1=1#",
  "' OR EXISTS(SELECT * FROM users)--",
  "1' AND '1'='1",
  "1' AND SLEEP(5)--",
  "1' WAITFOR DELAY '0:0:5'--",
  "1' AND (SELECT COUNT(*) FROM users) > 0--",
  "' HAVING 1=1--",
  "' GROUP BY columnname HAVING 1=1--"
];

// ═══════════════════════════════════════════════════════════════════════════════
// PATH TRAVERSAL PAYLOADS
// ═══════════════════════════════════════════════════════════════════════════════

const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '....//....//....//etc/passwd',
  '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd',
  '..%252f..%252f..%252fetc/passwd',
  '/etc/passwd%00',
  '..%c0%af..%c0%af..%c0%afetc/passwd',
  '....//....//....//windows/win.ini',
  '%252e%252e%252f%252e%252e%252f',
  '..%5c..%5c..%5cwindows%5cwin.ini'
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND INJECTION PAYLOADS
// ═══════════════════════════════════════════════════════════════════════════════

const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la',
  '| ls -la',
  '`ls -la`',
  '$(ls -la)',
  '; cat /etc/passwd',
  '| cat /etc/passwd',
  '& whoami',
  '&& whoami',
  '|| whoami',
  '; ping -c 5 127.0.0.1',
  '| ping -c 5 127.0.0.1',
  '; sleep 5',
  '| sleep 5',
  '`sleep 5`',
  '$(sleep 5)'
];

// ═══════════════════════════════════════════════════════════════════════════════
// XSS SCANNER
// ═══════════════════════════════════════════════════════════════════════════════

export class XSSScanner extends EventEmitter {
  private page: any;
  private vulnerabilities: Vulnerability[] = [];

  constructor(page: any) {
    super();
    this.page = page;
  }

  /**
   * Scan page for XSS vulnerabilities
   */
  async scan(url: string): Promise<Vulnerability[]> {
    this.vulnerabilities = [];
    
    await this.page.goto(url);

    // Find all input fields
    const inputs = await this.page.locator('input, textarea, [contenteditable="true"]').all();
    const forms = await this.page.locator('form').all();

    // Test each input
    for (const input of inputs) {
      await this.testInput(input, url);
    }

    // Test URL parameters
    await this.testURLParameters(url);

    // Test forms
    for (const form of forms) {
      await this.testForm(form, url);
    }

    return this.vulnerabilities;
  }

  private async testInput(input: any, url: string): Promise<void> {
    const inputName = await input.getAttribute('name') || await input.getAttribute('id') || 'unknown';

    for (const payload of XSS_PAYLOADS.slice(0, 5)) {
      try {
        await input.fill('');
        await input.fill(payload);
        
        // Check if payload is reflected
        const pageContent = await this.page.content();
        
        if (this.detectXSSInContent(pageContent, payload)) {
          this.addVulnerability({
            type: 'xss',
            severity: 'high',
            title: `Reflected XSS in input field: ${inputName}`,
            description: `The input field "${inputName}" is vulnerable to Cross-Site Scripting (XSS) attacks.`,
            url,
            parameter: inputName,
            payload,
            evidence: `Payload was reflected in page content`,
            remediation: 'Implement proper input validation and output encoding. Use Content-Security-Policy headers.',
            cwe: 'CWE-79',
            owasp: 'A7:2017-Cross-Site Scripting (XSS)'
          });
          break;
        }
      } catch {
        // Input might not be fillable
      }
    }
  }

  private async testURLParameters(url: string): Promise<void> {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    for (const [key] of params) {
      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        const testUrl = new URL(url);
        testUrl.searchParams.set(key, payload);

        try {
          await this.page.goto(testUrl.toString());
          const content = await this.page.content();

          if (this.detectXSSInContent(content, payload)) {
            this.addVulnerability({
              type: 'xss',
              severity: 'high',
              title: `Reflected XSS in URL parameter: ${key}`,
              description: `The URL parameter "${key}" is vulnerable to XSS.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: 'Payload reflected in response',
              remediation: 'Sanitize and encode URL parameters before rendering.',
              cwe: 'CWE-79',
              owasp: 'A7:2017-Cross-Site Scripting (XSS)'
            });
            break;
          }
        } catch {
          // URL might be invalid
        }
      }
    }
  }

  private async testForm(form: any, url: string): Promise<void> {
    const action = await form.getAttribute('action');
    const method = await form.getAttribute('method') || 'GET';
    const inputs = await form.locator('input, textarea').all();

    for (const input of inputs) {
      const name = await input.getAttribute('name');
      if (!name) continue;

      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        try {
          await input.fill(payload);
        } catch {
          // Skip non-fillable inputs
        }
      }
    }

    // Submit form and check
    try {
      await form.locator('button[type="submit"], input[type="submit"]').first().click();
      await this.page.waitForLoadState('networkidle');
      
      const content = await this.page.content();
      
      for (const payload of XSS_PAYLOADS.slice(0, 3)) {
        if (this.detectXSSInContent(content, payload)) {
          this.addVulnerability({
            type: 'xss',
            severity: 'high',
            title: `Stored/Reflected XSS via form submission`,
            description: `Form with action "${action}" is vulnerable to XSS.`,
            url,
            payload,
            evidence: 'Payload executed after form submission',
            remediation: 'Validate and sanitize all form inputs.',
            cwe: 'CWE-79',
            owasp: 'A7:2017-Cross-Site Scripting (XSS)'
          });
          break;
        }
      }
    } catch {
      // Form might not be submittable
    }
  }

  private detectXSSInContent(content: string, payload: string): boolean {
    // Check for unencoded payload
    if (content.includes(payload)) return true;

    // Check for script execution indicators
    const scriptPatterns = [
      /<script[^>]*>.*alert.*<\/script>/i,
      /onerror\s*=\s*["']?alert/i,
      /onload\s*=\s*["']?alert/i,
      /javascript:\s*alert/i
    ];

    return scriptPatterns.some(pattern => pattern.test(content));
  }

  private addVulnerability(vuln: Omit<Vulnerability, 'id' | 'timestamp'>): void {
    this.vulnerabilities.push({
      ...vuln,
      id: `xss-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date()
    });
    this.emit('vulnerability', this.vulnerabilities[this.vulnerabilities.length - 1]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SQL INJECTION SCANNER
// ═══════════════════════════════════════════════════════════════════════════════

export class SQLInjectionScanner extends EventEmitter {
  private page: any;
  private vulnerabilities: Vulnerability[] = [];

  constructor(page: any) {
    super();
    this.page = page;
  }

  /**
   * Scan for SQL Injection vulnerabilities
   */
  async scan(url: string): Promise<Vulnerability[]> {
    this.vulnerabilities = [];

    // Test URL parameters
    await this.testURLParameters(url);

    // Test form inputs
    await this.page.goto(url);
    await this.testForms();

    return this.vulnerabilities;
  }

  private async testURLParameters(url: string): Promise<void> {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    for (const [key] of params) {
      for (const payload of SQLI_PAYLOADS) {
        const testUrl = new URL(url);
        testUrl.searchParams.set(key, payload);

        try {
          const startTime = Date.now();
          const response = await this.page.goto(testUrl.toString());
          const duration = Date.now() - startTime;
          const content = await this.page.content();

          // Check for SQL error messages
          if (this.detectSQLError(content)) {
            this.addVulnerability({
              type: 'sqli',
              severity: 'critical',
              title: `SQL Injection in parameter: ${key}`,
              description: `The parameter "${key}" is vulnerable to SQL Injection.`,
              url: testUrl.toString(),
              parameter: key,
              payload,
              evidence: 'SQL error message detected in response',
              remediation: 'Use parameterized queries or prepared statements.',
              cwe: 'CWE-89',
              owasp: 'A1:2017-Injection'
            });
            break;
          }

          // Check for time-based blind injection
          if (payload.includes('SLEEP') || payload.includes('WAITFOR')) {
            if (duration > 5000) {
              this.addVulnerability({
                type: 'sqli',
                severity: 'critical',
                title: `Time-based Blind SQL Injection in: ${key}`,
                description: `Time-based blind SQL injection detected in "${key}".`,
                url: testUrl.toString(),
                parameter: key,
                payload,
                evidence: `Response delayed by ${duration}ms`,
                remediation: 'Use parameterized queries.',
                cwe: 'CWE-89',
                owasp: 'A1:2017-Injection'
              });
              break;
            }
          }
        } catch {
          // Request might fail
        }
      }
    }
  }

  private async testForms(): Promise<void> {
    const forms = await this.page.locator('form').all();

    for (const form of forms) {
      const inputs = await form.locator('input[type="text"], input[type="search"], input[type="email"], input:not([type])').all();

      for (const input of inputs) {
        const name = await input.getAttribute('name');
        if (!name) continue;

        for (const payload of SQLI_PAYLOADS.slice(0, 5)) {
          try {
            await input.fill(payload);
            await form.locator('button[type="submit"], input[type="submit"]').first().click();
            
            const content = await this.page.content();
            
            if (this.detectSQLError(content)) {
              this.addVulnerability({
                type: 'sqli',
                severity: 'critical',
                title: `SQL Injection in form input: ${name}`,
                description: `Form input "${name}" is vulnerable to SQL Injection.`,
                url: this.page.url(),
                parameter: name,
                payload,
                evidence: 'SQL error in response',
                remediation: 'Use parameterized queries.',
                cwe: 'CWE-89',
                owasp: 'A1:2017-Injection'
              });
              break;
            }

            await this.page.goBack();
          } catch {
            // Form might not work
          }
        }
      }
    }
  }

  private detectSQLError(content: string): boolean {
    const errorPatterns = [
      /SQL syntax.*MySQL/i,
      /Warning.*mysql_/i,
      /MySqlException/i,
      /valid MySQL result/i,
      /PostgreSQL.*ERROR/i,
      /Warning.*pg_/i,
      /ORA-\d{5}/i,
      /Oracle error/i,
      /SQLite.*error/i,
      /Microsoft.*ODBC.*SQL Server/i,
      /Unclosed quotation mark/i,
      /SQLSTATE\[/i,
      /syntax error at or near/i,
      /quoted string not properly terminated/i,
      /You have an error in your SQL syntax/i
    ];

    return errorPatterns.some(pattern => pattern.test(content));
  }

  private addVulnerability(vuln: Omit<Vulnerability, 'id' | 'timestamp'>): void {
    this.vulnerabilities.push({
      ...vuln,
      id: `sqli-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date()
    });
    this.emit('vulnerability', this.vulnerabilities[this.vulnerabilities.length - 1]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

export class SecurityHeadersAnalyzer {
  private requiredHeaders: Record<string, { description: string; severity: Severity }> = {
    'Content-Security-Policy': {
      description: 'Prevents XSS and injection attacks',
      severity: 'high'
    },
    'X-Content-Type-Options': {
      description: 'Prevents MIME-type sniffing',
      severity: 'medium'
    },
    'X-Frame-Options': {
      description: 'Prevents clickjacking attacks',
      severity: 'medium'
    },
    'Strict-Transport-Security': {
      description: 'Enforces HTTPS connections',
      severity: 'high'
    },
    'X-XSS-Protection': {
      description: 'Legacy XSS protection',
      severity: 'low'
    },
    'Referrer-Policy': {
      description: 'Controls referrer information',
      severity: 'low'
    },
    'Permissions-Policy': {
      description: 'Controls browser features',
      severity: 'low'
    }
  };

  /**
   * Analyze security headers
   */
  async analyze(url: string): Promise<HeaderAnalysis> {
    const response = await fetch(url);
    const headers: Record<string, string> = {};
    
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    const missingHeaders: Array<{
      header: string;
      severity: Severity;
      description: string;
      recommendation: string;
    }> = [];

    const presentHeaders: Array<{
      header: string;
      value: string;
      isSecure: boolean;
      notes: string[];
    }> = [];

    for (const [header, info] of Object.entries(this.requiredHeaders)) {
      const headerLower = header.toLowerCase();
      
      if (!headers[headerLower]) {
        missingHeaders.push({
          header,
          severity: info.severity,
          description: info.description,
          recommendation: `Add ${header} header to your responses`
        });
      } else {
        const analysis = this.analyzeHeader(header, headers[headerLower]);
        presentHeaders.push(analysis);
      }
    }

    const score = this.calculateScore(missingHeaders, presentHeaders);

    return {
      url,
      headers,
      missingHeaders,
      presentHeaders,
      score,
      grade: this.calculateGrade(score)
    };
  }

  private analyzeHeader(header: string, value: string): {
    header: string;
    value: string;
    isSecure: boolean;
    notes: string[];
  } {
    const notes: string[] = [];
    let isSecure = true;

    switch (header) {
      case 'Content-Security-Policy':
        if (value.includes("'unsafe-inline'")) {
          notes.push("Warning: 'unsafe-inline' allows inline scripts");
          isSecure = false;
        }
        if (value.includes("'unsafe-eval'")) {
          notes.push("Warning: 'unsafe-eval' allows eval()");
          isSecure = false;
        }
        break;

      case 'Strict-Transport-Security':
        if (!value.includes('max-age')) {
          notes.push('Missing max-age directive');
          isSecure = false;
        }
        if (!value.includes('includeSubDomains')) {
          notes.push('Consider adding includeSubDomains');
        }
        break;

      case 'X-Frame-Options':
        if (value.toUpperCase() === 'ALLOW-FROM') {
          notes.push('ALLOW-FROM is deprecated');
        }
        break;
    }

    return { header, value, isSecure, notes };
  }

  private calculateScore(missing: any[], present: any[]): number {
    const totalHeaders = Object.keys(this.requiredHeaders).length;
    const presentSecure = present.filter(h => h.isSecure).length;
    return Math.round((presentSecure / totalHeaders) * 100);
  }

  private calculateGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

export interface HeaderAnalysis {
  url: string;
  headers: Record<string, string>;
  missingHeaders: Array<{
    header: string;
    severity: Severity;
    description: string;
    recommendation: string;
  }>;
  presentHeaders: Array<{
    header: string;
    value: string;
    isSecure: boolean;
    notes: string[];
  }>;
  score: number;
  grade: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSRF SCANNER
// ═══════════════════════════════════════════════════════════════════════════════

export class CSRFScanner extends EventEmitter {
  private page: any;
  private vulnerabilities: Vulnerability[] = [];

  constructor(page: any) {
    super();
    this.page = page;
  }

  /**
   * Scan for CSRF vulnerabilities
   */
  async scan(url: string): Promise<Vulnerability[]> {
    this.vulnerabilities = [];
    await this.page.goto(url);

    const forms = await this.page.locator('form').all();

    for (const form of forms) {
      const method = await form.getAttribute('method');
      
      // Only check POST/PUT/DELETE forms
      if (!method || method.toUpperCase() === 'GET') continue;

      const hasCSRFToken = await this.checkForCSRFToken(form);
      const hasSameSiteCookie = await this.checkSameSiteCookie();

      if (!hasCSRFToken && !hasSameSiteCookie) {
        const action = await form.getAttribute('action') || url;
        
        this.addVulnerability({
          type: 'csrf',
          severity: 'high',
          title: 'Missing CSRF Protection',
          description: `Form with action "${action}" lacks CSRF token protection.`,
          url,
          evidence: 'No CSRF token found in form',
          remediation: 'Implement CSRF tokens for all state-changing operations.',
          cwe: 'CWE-352',
          owasp: 'A8:2013-Cross-Site Request Forgery (CSRF)'
        });
      }
    }

    return this.vulnerabilities;
  }

  private async checkForCSRFToken(form: any): Promise<boolean> {
    const csrfPatterns = [
      'csrf',
      '_token',
      'authenticity_token',
      'anti-forgery',
      '__RequestVerificationToken',
      'X-CSRF-TOKEN',
      'XSRF-TOKEN'
    ];

    for (const pattern of csrfPatterns) {
      const token = await form.locator(`input[name*="${pattern}" i], input[id*="${pattern}" i]`).count();
      if (token > 0) return true;
    }

    return false;
  }

  private async checkSameSiteCookie(): Promise<boolean> {
    const cookies = await this.page.context().cookies();
    return cookies.some((cookie: any) => 
      cookie.sameSite === 'Strict' || cookie.sameSite === 'Lax'
    );
  }

  private addVulnerability(vuln: Omit<Vulnerability, 'id' | 'timestamp'>): void {
    this.vulnerabilities.push({
      ...vuln,
      id: `csrf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: new Date()
    });
    this.emit('vulnerability', this.vulnerabilities[this.vulnerabilities.length - 1]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY SCANNER (MAIN)
// ═══════════════════════════════════════════════════════════════════════════════

export class SecurityScanner extends EventEmitter {
  private config: SecurityScanConfig;
  private page: any;
  private vulnerabilities: Vulnerability[] = [];

  constructor(page: any, config: SecurityScanConfig) {
    super();
    this.page = page;
    this.config = {
      maxDepth: 3,
      maxPages: 50,
      timeout: 30000,
      scanTypes: ['xss', 'sqli', 'csrf'],
      ...config
    };
  }

  /**
   * Run full security scan
   */
  async scan(): Promise<SecurityReport> {
    const startTime = new Date();
    this.vulnerabilities = [];
    const scannedUrls = new Set<string>();

    this.emit('start', { url: this.config.url });

    // Scan main URL
    await this.scanUrl(this.config.url, scannedUrls, 0);

    const endTime = new Date();

    const report: SecurityReport = {
      scanId: `scan-${Date.now()}`,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      target: this.config.url,
      pagesScanned: scannedUrls.size,
      vulnerabilities: this.vulnerabilities,
      summary: this.calculateSummary(),
      score: this.calculateScore()
    };

    this.emit('complete', report);
    return report;
  }

  private async scanUrl(url: string, scanned: Set<string>, depth: number): Promise<void> {
    if (scanned.has(url)) return;
    if (scanned.size >= this.config.maxPages!) return;
    if (depth > this.config.maxDepth!) return;

    scanned.add(url);
    this.emit('scanning', { url, depth });

    try {
      await this.page.goto(url, { timeout: this.config.timeout });

      // Run configured scanners
      if (this.config.scanTypes?.includes('xss')) {
        const xssScanner = new XSSScanner(this.page);
        const xssVulns = await xssScanner.scan(url);
        this.vulnerabilities.push(...xssVulns);
      }

      if (this.config.scanTypes?.includes('sqli')) {
        const sqlScanner = new SQLInjectionScanner(this.page);
        const sqlVulns = await sqlScanner.scan(url);
        this.vulnerabilities.push(...sqlVulns);
      }

      if (this.config.scanTypes?.includes('csrf')) {
        const csrfScanner = new CSRFScanner(this.page);
        const csrfVulns = await csrfScanner.scan(url);
        this.vulnerabilities.push(...csrfVulns);
      }

      // Crawl links
      const links = await this.page.locator('a[href]').all();
      
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (!href) continue;

        try {
          const absoluteUrl = new URL(href, url).toString();
          
          if (this.shouldCrawl(absoluteUrl)) {
            await this.scanUrl(absoluteUrl, scanned, depth + 1);
          }
        } catch {
          // Invalid URL
        }
      }
    } catch (error) {
      this.emit('error', { url, error: (error as Error).message });
    }
  }

  private shouldCrawl(url: string): boolean {
    const baseOrigin = new URL(this.config.url).origin;
    const urlOrigin = new URL(url).origin;

    if (urlOrigin !== baseOrigin) return false;

    if (this.config.excludePatterns) {
      for (const pattern of this.config.excludePatterns) {
        if (new RegExp(pattern).test(url)) return false;
      }
    }

    return true;
  }

  private calculateSummary(): SecurityReport['summary'] {
    const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };

    for (const vuln of this.vulnerabilities) {
      summary[vuln.severity]++;
      summary.total++;
    }

    return summary;
  }

  private calculateScore(): number {
    const weights = { critical: 25, high: 15, medium: 8, low: 3, info: 1 };
    let deductions = 0;

    for (const vuln of this.vulnerabilities) {
      deductions += weights[vuln.severity];
    }

    return Math.max(0, 100 - deductions);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createSecurityScanner(page: any, config: SecurityScanConfig): SecurityScanner {
  return new SecurityScanner(page, config);
}

export default {
  SecurityScanner,
  XSSScanner,
  SQLInjectionScanner,
  CSRFScanner,
  SecurityHeadersAnalyzer,
  XSS_PAYLOADS,
  SQLI_PAYLOADS,
  PATH_TRAVERSAL_PAYLOADS,
  COMMAND_INJECTION_PAYLOADS,
  createSecurityScanner
};
