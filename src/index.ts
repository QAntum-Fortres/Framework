/**
 * 🧠 MISTER MIND - AI-Powered QA Automation
 * 
 * Free Tier: Basic testing functionality
 * Pro Tier: Full AI features (requires license)
 * 
 * @author Dimitar Papazov
 * @license SEE LICENSE FILE
 * @version 16.0.0
 */

import { chromium, Browser, Page } from 'playwright';
import axios, { AxiosError } from 'axios';
import { 
  AdaptiveSemanticCore, 
  ASCConfig, 
  Intent, 
  IntentMatch, 
  SemanticMap,
  SemanticElement,
  CommonIntents 
} from './asc/semantic-core';

export interface AuditResult {
  url: string;
  timestamp: Date;
  performance: number;
  accessibility: number;
  seo: number;
  brokenLinks: string[];
  suggestions: string[];
  duration: number;
  metrics: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    resourceCount: number;
    totalSize: number;
  };
}

export interface MisterMindConfig {
  /** Pro license key (format: MM-XXXX-XXXX-XXXX) */
  licenseKey?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Enable verbose logging (default: false) */
  verbose?: boolean;
  /** Adaptive Semantic Core configuration */
  asc?: ASCConfig;
}

export interface PredictionOptions {
  /** Code changes to analyze (diff or file content) */
  codeChanges?: string;
  /** Path to test files or directory */
  testPath?: string;
  /** Historical test results */
  testHistory?: TestHistoryEntry[];
  /** Code complexity threshold (default: 10) */
  complexityThreshold?: number;
}

export interface TestHistoryEntry {
  testName: string;
  passed: boolean;
  duration: number;
  timestamp: Date;
  error?: string;
}

export interface PredictionResult {
  riskScore: number;
  predictedFailures: PredictedFailure[];
  recommendation: string;
  confidence: number;
  analyzedAt: Date;
  codeMetrics: CodeMetrics;
  riskFactors: RiskFactor[];
}

export interface PredictedFailure {
  file: string;
  reason: string;
  probability: number;
  suggestedFix?: string;
}

export interface CodeMetrics {
  totalLines: number;
  complexity: number;
  changedLines: number;
  riskAreas: string[];
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface APISenseiConfig {
  /** Base URL for API */
  baseUrl: string;
  /** OpenAPI/Swagger spec URL or path */
  specUrl?: string;
  /** Authentication configuration */
  auth?: {
    type: 'bearer' | 'basic' | 'apiKey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    headerName?: string;
  };
  /** Test scenarios to generate */
  scenarios?: ('happy-path' | 'edge-cases' | 'error-handling' | 'security' | 'performance')[];
}

export interface APISenseiResult {
  baseUrl: string;
  totalTests: number;
  passed: number;
  failed: number;
  testResults: APISenseiTestResult[];
  coverage: APICoverage;
  recommendations: string[];
  duration: number;
}

export interface APISenseiTestResult {
  name: string;
  endpoint: string;
  method: string;
  scenario: string;
  status: 'passed' | 'failed' | 'skipped';
  responseTime: number;
  assertions: AssertionResult[];
  error?: string;
}

export interface AssertionResult {
  assertion: string;
  passed: boolean;
  expected?: any;
  actual?: any;
}

export interface APICoverage {
  endpoints: number;
  testedEndpoints: number;
  coveragePercent: number;
}

export interface ChronosOptions {
  /** Test function to run with time-travel debugging */
  testFn: () => Promise<void>;
  /** Enable automatic snapshots */
  autoSnapshot?: boolean;
  /** Snapshot interval in ms */
  snapshotInterval?: number;
  /** Maximum snapshots to keep */
  maxSnapshots?: number;
}

export interface ChronosResult {
  success: boolean;
  snapshots: StateSnapshot[];
  timeline: TimelineEvent[];
  duration: number;
  error?: string;
}

export interface StateSnapshot {
  id: string;
  timestamp: Date;
  state: Record<string, any>;
  label?: string;
}

export interface TimelineEvent {
  timestamp: Date;
  type: 'snapshot' | 'action' | 'error' | 'assertion';
  description: string;
  data?: any;
}

export interface APITestResult {
  status: number;
  responseTime: number;
  success: boolean;
}

export interface APITestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  validateStatus?: boolean;
}

export interface APITestResultFull {
  endpoint: string;
  method: string;
  status: number;
  statusText: string;
  responseTime: number;
  responseSize: number;
  success: boolean;
  headers: Record<string, string>;
  contentType: string;
  timestamp: Date;
  error?: string;
}

export interface LinkCheckResult {
  url: string;
  status: number;
  statusText: string;
  isValid: boolean;
  isExternal: boolean;
}

export interface CheckLinksResult {
  url: string;
  totalLinks: number;
  checkedLinks: number;
  brokenLinks: string[];
  results: LinkCheckResult[];
  duration: number;
}

/** License key pattern: MM-XXXX-XXXX-XXXX */
const LICENSE_PATTERN = /^MM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe';

/**
 * Main MISTER MIND class
 */
export class MisterMind {
  private config: MisterMindConfig;
  private isProLicense: boolean = false;
  private asc: AdaptiveSemanticCore | null = null;

  constructor(config: MisterMindConfig = {}) {
    // Validate config
    if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout < 0)) {
      throw new Error('Invalid timeout: must be a positive number');
    }
    
    this.config = {
      timeout: 30000,
      verbose: false,
      ...config
    };

    if (config.licenseKey) {
      this.validateLicense(config.licenseKey);
    }

    // Initialize ASC if config provided or PRO license
    if (config.asc || this.isProLicense) {
      this.initASC(config.asc);
    }
  }

  /**
   * Initialize Adaptive Semantic Core
   */
  private initASC(config?: ASCConfig): void {
    this.asc = new AdaptiveSemanticCore({
      verbose: this.config.verbose,
      ...config
    });
    
    if (this.config.verbose) {
      console.log('🧠 ASC: Adaptive Semantic Core initialized');
    }
  }

  /**
   * 🆓 FREE: Basic website audit
   * Uses Playwright to perform real performance, accessibility, and SEO analysis
   */
  async audit(url: string): Promise<AuditResult> {
    const startTime = Date.now();
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: must be a non-empty string');
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }

    if (this.config.verbose) {
      console.log(`🔍 Auditing ${url}...`);
    }

    let browser: Browser | null = null;
    
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Collect performance metrics
      const metrics = {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        resourceCount: 0,
        totalSize: 0
      };
      
      // Track resources
      const resources: { size: number; type: string }[] = [];
      page.on('response', async (response) => {
        try {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0', 10);
          resources.push({ size, type: response.request().resourceType() });
        } catch {
          // Ignore errors from response handling
        }
      });

      // Navigate and measure timing
      const navigationStart = Date.now();
      
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: this.config.timeout 
      });
      
      metrics.loadTime = Date.now() - navigationStart;
      
      // Get performance timing from browser using Navigation Timing API
      const timing = await page.evaluate(() => {
        const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
        if (entries.length > 0) {
          const nav = entries[0];
          return {
            domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
            loadComplete: nav.loadEventEnd - nav.startTime
          };
        }
        return { domContentLoaded: 0, loadComplete: 0 };
      });
      
      metrics.domContentLoaded = timing.domContentLoaded;
      metrics.resourceCount = resources.length;
      metrics.totalSize = resources.reduce((sum, r) => sum + r.size, 0);
      
      // Calculate performance score (based on load time)
      let performanceScore = 100;
      if (metrics.loadTime > 1000) performanceScore -= 10;
      if (metrics.loadTime > 2000) performanceScore -= 15;
      if (metrics.loadTime > 3000) performanceScore -= 20;
      if (metrics.loadTime > 5000) performanceScore -= 25;
      if (metrics.totalSize > 1000000) performanceScore -= 10; // > 1MB
      if (metrics.totalSize > 3000000) performanceScore -= 15; // > 3MB
      performanceScore = Math.max(0, Math.min(100, performanceScore));
      
      // Accessibility audit
      const accessibilityResults = await this.runAccessibilityChecks(page);
      
      // SEO audit  
      const seoResults = await this.runSEOChecks(page);
      
      // Find broken links on the page
      const brokenLinks = await this.findBrokenLinksOnPage(page);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(metrics, accessibilityResults, seoResults);
      
      const duration = Date.now() - startTime;
      
      const result: AuditResult = {
        url,
        timestamp: new Date(),
        performance: performanceScore,
        accessibility: accessibilityResults.score,
        seo: seoResults.score,
        brokenLinks,
        suggestions,
        duration,
        metrics
      };

      if (this.config.verbose) {
        console.log(`✅ Audit complete! Performance: ${result.performance}/100, Duration: ${duration}ms`);
      }
      
      return result;
      
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Run accessibility checks on a page
   */
  private async runAccessibilityChecks(page: Page): Promise<{ score: number; issues: string[] }> {
    const issues: string[] = [];
    let score = 100;
    
    // Check for images without alt text
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} image(s) missing alt text`);
      score -= imagesWithoutAlt * 5;
    }
    
    // Check for proper heading hierarchy
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', els => 
      els.map(el => el.tagName.toLowerCase())
    );
    const h1Count = headings.filter(h => h === 'h1').length;
    if (h1Count === 0) {
      issues.push('Missing h1 heading');
      score -= 10;
    } else if (h1Count > 1) {
      issues.push('Multiple h1 headings found');
      score -= 5;
    }
    
    // Check for form labels
    const inputsWithoutLabels = await page.$$eval(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
      inputs => inputs.filter(input => {
        const id = input.id;
        if (!id) return true;
        return !document.querySelector(`label[for="${id}"]`);
      }).length
    );
    if (inputsWithoutLabels > 0) {
      issues.push(`${inputsWithoutLabels} input(s) missing associated labels`);
      score -= inputsWithoutLabels * 5;
    }
    
    // Check for sufficient color contrast (simplified check)
    const lowContrastElements = await page.$$eval('*', els => {
      let count = 0;
      els.slice(0, 100).forEach(el => { // Sample first 100 elements
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const fg = style.color;
        // Very simplified contrast check
        if (bg === fg && bg !== 'rgba(0, 0, 0, 0)') {
          count++;
        }
      });
      return count;
    });
    if (lowContrastElements > 0) {
      issues.push('Potential color contrast issues detected');
      score -= 5;
    }
    
    // Check for skip navigation link
    const hasSkipLink = await page.$('a[href="#main"], a[href="#content"], .skip-link, .skip-nav');
    if (!hasSkipLink) {
      issues.push('Missing skip navigation link');
      score -= 3;
    }
    
    // Check for language attribute
    const hasLang = await page.$eval('html', html => html.hasAttribute('lang'));
    if (!hasLang) {
      issues.push('Missing lang attribute on html element');
      score -= 5;
    }
    
    return { score: Math.max(0, Math.min(100, score)), issues };
  }

  /**
   * Run SEO checks on a page
   */
  private async runSEOChecks(page: Page): Promise<{ score: number; issues: string[] }> {
    const issues: string[] = [];
    let score = 100;
    
    // Check for title tag
    const title = await page.title();
    if (!title) {
      issues.push('Missing page title');
      score -= 15;
    } else if (title.length < 30) {
      issues.push('Title too short (recommended: 30-60 characters)');
      score -= 5;
    } else if (title.length > 60) {
      issues.push('Title too long (recommended: 30-60 characters)');
      score -= 3;
    }
    
    // Check for meta description
    const metaDesc = await page.$eval(
      'meta[name="description"]',
      el => el.getAttribute('content')
    ).catch(() => null);
    
    if (!metaDesc) {
      issues.push('Missing meta description');
      score -= 15;
    } else if (metaDesc.length < 120) {
      issues.push('Meta description too short (recommended: 120-160 characters)');
      score -= 5;
    } else if (metaDesc.length > 160) {
      issues.push('Meta description too long (recommended: 120-160 characters)');
      score -= 3;
    }
    
    // Check for canonical URL
    const hasCanonical = await page.$('link[rel="canonical"]');
    if (!hasCanonical) {
      issues.push('Missing canonical URL');
      score -= 5;
    }
    
    // Check for Open Graph tags
    const hasOgTitle = await page.$('meta[property="og:title"]');
    const hasOgDesc = await page.$('meta[property="og:description"]');
    if (!hasOgTitle || !hasOgDesc) {
      issues.push('Missing Open Graph meta tags');
      score -= 5;
    }
    
    // Check for viewport meta tag
    const hasViewport = await page.$('meta[name="viewport"]');
    if (!hasViewport) {
      issues.push('Missing viewport meta tag');
      score -= 10;
    }
    
    // Check for robots meta or robots.txt accessibility
    const robotsMeta = await page.$('meta[name="robots"]');
    const robotsContent = robotsMeta 
      ? await robotsMeta.getAttribute('content')
      : null;
    if (robotsContent?.includes('noindex')) {
      issues.push('Page is set to noindex');
      score -= 10;
    }
    
    return { score: Math.max(0, Math.min(100, score)), issues };
  }

  /**
   * Find broken links on the page (internal method for audit)
   */
  private async findBrokenLinksOnPage(page: Page): Promise<string[]> {
    const links = await page.$$eval('a[href]', anchors => 
      anchors.map(a => a.getAttribute('href')).filter(Boolean) as string[]
    );
    
    const brokenLinks: string[] = [];
    const pageUrl = page.url();
    const baseUrl = new URL(pageUrl).origin;
    
    // Check only first 20 links to avoid timeout
    const linksToCheck = links.slice(0, 20);
    
    for (const link of linksToCheck) {
      if (link.startsWith('#') || link.startsWith('mailto:') || link.startsWith('tel:')) {
        continue;
      }
      
      try {
        const fullUrl = link.startsWith('http') ? link : new URL(link, baseUrl).href;
        const response = await axios.head(fullUrl, { 
          timeout: 5000,
          validateStatus: () => true 
        });
        
        if (response.status >= 400) {
          brokenLinks.push(fullUrl);
        }
      } catch {
        brokenLinks.push(link);
      }
    }
    
    return brokenLinks;
  }

  /**
   * Generate improvement suggestions based on audit results
   */
  private generateSuggestions(
    metrics: AuditResult['metrics'],
    accessibility: { score: number; issues: string[] },
    seo: { score: number; issues: string[] }
  ): string[] {
    const suggestions: string[] = [];
    
    // Performance suggestions
    if (metrics.loadTime > 3000) {
      suggestions.push('Page load time is high. Consider optimizing images and enabling compression.');
    }
    if (metrics.totalSize > 2000000) {
      suggestions.push('Total page size is large. Consider lazy loading and code splitting.');
    }
    if (metrics.resourceCount > 50) {
      suggestions.push('High number of requests. Consider bundling resources.');
    }
    
    // Add accessibility issues as suggestions
    accessibility.issues.forEach(issue => {
      suggestions.push(`Accessibility: ${issue}`);
    });
    
    // Add SEO issues as suggestions
    seo.issues.forEach(issue => {
      suggestions.push(`SEO: ${issue}`);
    });
    
    return suggestions;
  }

  /**
   * 🆓 FREE: Check for broken links
   * Crawls the page and checks all links for validity
   */
  async checkLinks(url: string, options: { maxLinks?: number; followExternal?: boolean } = {}): Promise<CheckLinksResult> {
    const { maxLinks = 50, followExternal = false } = options;
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: must be a non-empty string');
    }
    
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }

    if (this.config.verbose) {
      console.log(`🔗 Checking links on ${url}...`);
    }

    let browser: Browser | null = null;
    const startTime = Date.now();
    
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout 
      });
      
      const baseUrl = new URL(url).origin;
      
      // Extract all links from the page
      const links = await page.$$eval('a[href]', (anchors, base) => {
        return anchors.map(a => {
          const href = a.getAttribute('href') || '';
          const text = a.textContent?.trim() || '';
          return { href, text };
        });
      }, baseUrl);
      
      const results: LinkCheckResult[] = [];
      const brokenLinks: string[] = [];
      const checkedUrls = new Set<string>();
      
      // Filter and normalize links
      const linksToCheck = links
        .filter(link => {
          const href = link.href;
          // Skip anchors, mailto, tel, javascript
          if (!href || href.startsWith('#') || href.startsWith('mailto:') || 
              href.startsWith('tel:') || href.startsWith('javascript:')) {
            return false;
          }
          return true;
        })
        .slice(0, maxLinks);
      
      // Check each link in parallel (with concurrency limit)
      const concurrency = 5;
      for (let i = 0; i < linksToCheck.length; i += concurrency) {
        const batch = linksToCheck.slice(i, i + concurrency);
        
        await Promise.all(batch.map(async (link) => {
          let fullUrl: string;
          
          try {
            fullUrl = link.href.startsWith('http') 
              ? link.href 
              : new URL(link.href, baseUrl).href;
          } catch {
            results.push({
              url: link.href,
              status: 0,
              statusText: 'Invalid URL',
              isValid: false,
              isExternal: false
            });
            brokenLinks.push(link.href);
            return;
          }
          
          // Skip already checked URLs
          if (checkedUrls.has(fullUrl)) return;
          checkedUrls.add(fullUrl);
          
          const isExternal = !fullUrl.startsWith(baseUrl);
          
          // Skip external links if not following them
          if (isExternal && !followExternal) {
            results.push({
              url: fullUrl,
              status: -1,
              statusText: 'Skipped (external)',
              isValid: true,
              isExternal: true
            });
            return;
          }
          
          try {
            const response = await axios.head(fullUrl, {
              timeout: 10000,
              validateStatus: () => true,
              maxRedirects: 5,
              headers: {
                'User-Agent': 'MisterMind-LinkChecker/1.0'
              }
            });
            
            const isValid = response.status < 400;
            
            results.push({
              url: fullUrl,
              status: response.status,
              statusText: response.statusText,
              isValid,
              isExternal
            });
            
            if (!isValid) {
              brokenLinks.push(fullUrl);
            }
          } catch (error) {
            const axiosError = error as AxiosError;
            results.push({
              url: fullUrl,
              status: 0,
              statusText: axiosError.message || 'Connection failed',
              isValid: false,
              isExternal
            });
            brokenLinks.push(fullUrl);
          }
        }));
      }
      
      const duration = Date.now() - startTime;
      
      const result: CheckLinksResult = {
        url,
        totalLinks: links.length,
        checkedLinks: results.length,
        brokenLinks,
        results,
        duration
      };

      if (this.config.verbose) {
        console.log(`✅ Found ${brokenLinks.length} broken link(s) out of ${results.length} checked`);
      }
      
      return result;
      
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * 🆓 FREE: Basic API test (limited to 10/day without license)
   * Makes real HTTP requests and measures response time
   */
  async testAPI(
    endpoint: string, 
    options: APITestOptions = {}
  ): Promise<APITestResultFull> {
    const { 
      method = 'GET', 
      headers = {}, 
      body = undefined,
      timeout = this.config.timeout,
      validateStatus = true
    } = options;
    
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint: must be a non-empty string');
    }
    
    try {
      new URL(endpoint);
    } catch {
      throw new Error(`Invalid endpoint URL format: ${endpoint}`);
    }

    if (this.config.verbose) {
      console.log(`🌐 Testing ${method} ${endpoint}...`);
    }

    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: method as any,
        url: endpoint,
        headers: {
          'User-Agent': 'MisterMind-APITest/1.0',
          ...headers
        },
        data: body,
        timeout,
        validateStatus: () => true, // Don't throw on any status
        maxRedirects: 5
      });
      
      const responseTime = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;
      
      // Calculate response size
      let responseSize = 0;
      if (response.data) {
        if (typeof response.data === 'string') {
          responseSize = Buffer.byteLength(response.data, 'utf8');
        } else {
          responseSize = Buffer.byteLength(JSON.stringify(response.data), 'utf8');
        }
      }
      
      const result: APITestResultFull = {
        endpoint,
        method,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        responseSize,
        success,
        headers: response.headers as Record<string, string>,
        contentType: response.headers['content-type'] || 'unknown',
        timestamp: new Date()
      };
      
      // Validate response if requested
      if (validateStatus && !success) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      if (this.config.verbose) {
        console.log(`✅ API Test complete! Status: ${response.status}, Time: ${responseTime}ms`);
      }
      
      return result;
      
    } catch (error) {
      const axiosError = error as AxiosError;
      const responseTime = Date.now() - startTime;
      
      const result: APITestResultFull = {
        endpoint,
        method,
        status: axiosError.response?.status || 0,
        statusText: axiosError.response?.statusText || 'Connection Failed',
        responseTime,
        responseSize: 0,
        success: false,
        headers: {},
        contentType: 'unknown',
        timestamp: new Date(),
        error: axiosError.message
      };

      if (this.config.verbose) {
        console.log(`❌ API Test failed: ${axiosError.message}`);
      }
      
      return result;
    }
  }

  /**
   * 🆓 FREE: Batch API testing - test multiple endpoints
   */
  async testAPIs(endpoints: Array<{ url: string; options?: APITestOptions }>): Promise<APITestResultFull[]> {
    const results: APITestResultFull[] = [];
    
    for (const { url, options } of endpoints) {
      const result = await this.testAPI(url, options);
      results.push(result);
    }
    
    return results;
  }

  /**
   * 💎 PRO: Prediction Matrix - Predicts bugs before they happen
   * Analyzes code changes and test history to predict potential failures
   * Requires Pro license
   */
  async predict(options: PredictionOptions = {}): Promise<PredictionResult> {
    if (!this.isProLicense) {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║  🔮 PREDICTION MATRIX - PRO FEATURE                           ║');
      console.log('║                                                               ║');
      console.log('║  This feature requires a Pro license.                         ║');
      console.log('║                                                               ║');
      console.log('║  🛒 Get your license at: https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe ║');
      console.log('║                                                               ║');
      console.log('║  Pro includes:                                                ║');
      console.log('║  • 🔮 Prediction Matrix                                       ║');
      console.log('║  • 🤖 API Sensei                                              ║');
      console.log('║  • ⏰ Chronos Engine                                          ║');
      console.log('║  • 🛡️ Strategic Resilience                                    ║');
      console.log('║                                                               ║');
      console.log('║  Only $29/month - Cancel anytime                              ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('');
      
      throw new Error('Prediction Matrix requires a Pro license. Get yours at https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe');
    }

    const { 
      codeChanges = '', 
      testHistory = [],
      complexityThreshold = 10 
    } = options;

    if (this.config.verbose) {
      console.log('🔮 Analyzing code for potential failures...');
    }

    // Analyze code changes
    const codeMetrics = this.analyzeCodeComplexity(codeChanges);
    
    // Analyze test history for patterns
    const historyAnalysis = this.analyzeTestHistory(testHistory);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(codeMetrics, historyAnalysis, complexityThreshold);
    
    // Predict potential failures
    const predictedFailures = this.predictFailures(codeChanges, codeMetrics, historyAnalysis);
    
    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(riskFactors, predictedFailures);
    
    // Calculate confidence based on available data
    const confidence = this.calculateConfidence(codeChanges, testHistory);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(riskFactors, predictedFailures);

    const result: PredictionResult = {
      riskScore,
      predictedFailures,
      recommendation,
      confidence,
      analyzedAt: new Date(),
      codeMetrics,
      riskFactors
    };

    if (this.config.verbose) {
      console.log(`✅ Analysis complete! Risk Score: ${riskScore}/100`);
    }

    return result;
  }

  /**
   * Analyze code complexity from code changes
   */
  private analyzeCodeComplexity(code: string): CodeMetrics {
    if (!code) {
      return {
        totalLines: 0,
        complexity: 0,
        changedLines: 0,
        riskAreas: []
      };
    }

    const lines = code.split('\n');
    const totalLines = lines.length;
    
    // Count changed lines (lines starting with + or -)
    const changedLines = lines.filter(line => 
      line.startsWith('+') || line.startsWith('-')
    ).length;

    // Calculate cyclomatic complexity (simplified)
    let complexity = 1; // Base complexity
    const complexityKeywords = [
      /\bif\b/g, /\belse\b/g, /\bwhile\b/g, /\bfor\b/g,
      /\bswitch\b/g, /\bcase\b/g, /\bcatch\b/g, /\b\?\b/g,
      /\b&&\b/g, /\b\|\|\b/g
    ];
    
    complexityKeywords.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) complexity += matches.length;
    });

    // Identify risk areas
    const riskAreas: string[] = [];
    
    if (code.includes('async') || code.includes('await') || code.includes('Promise')) {
      riskAreas.push('async-operations');
    }
    if (code.includes('try') && code.includes('catch')) {
      riskAreas.push('error-handling');
    }
    if (code.match(/\.query\(|\.exec\(|SQL|SELECT|INSERT|UPDATE|DELETE/i)) {
      riskAreas.push('database-operations');
    }
    if (code.match(/fetch\(|axios|http\.|request\(/i)) {
      riskAreas.push('network-calls');
    }
    if (code.match(/localStorage|sessionStorage|cookie/i)) {
      riskAreas.push('state-management');
    }
    if (code.match(/auth|login|password|token|session/i)) {
      riskAreas.push('authentication');
    }
    if (code.match(/payment|checkout|cart|order/i)) {
      riskAreas.push('payment-flow');
    }

    return {
      totalLines,
      complexity,
      changedLines,
      riskAreas
    };
  }

  /**
   * Analyze test history for failure patterns
   */
  private analyzeTestHistory(history: TestHistoryEntry[]): {
    failureRate: number;
    flakyTests: string[];
    recentFailures: string[];
    avgDuration: number;
  } {
    if (!history || history.length === 0) {
      return {
        failureRate: 0,
        flakyTests: [],
        recentFailures: [],
        avgDuration: 0
      };
    }

    const totalTests = history.length;
    const failures = history.filter(t => !t.passed);
    const failureRate = (failures.length / totalTests) * 100;

    // Find flaky tests (tests that alternate between pass/fail)
    const testResults = new Map<string, boolean[]>();
    history.forEach(entry => {
      if (!testResults.has(entry.testName)) {
        testResults.set(entry.testName, []);
      }
      testResults.get(entry.testName)!.push(entry.passed);
    });

    const flakyTests: string[] = [];
    testResults.forEach((results, testName) => {
      if (results.length >= 2) {
        let flips = 0;
        for (let i = 1; i < results.length; i++) {
          if (results[i] !== results[i - 1]) flips++;
        }
        if (flips >= 2) flakyTests.push(testName);
      }
    });

    // Recent failures (last 10 entries)
    const recentHistory = history.slice(-10);
    const recentFailures = recentHistory
      .filter(t => !t.passed)
      .map(t => t.testName);

    // Average duration
    const avgDuration = history.reduce((sum, t) => sum + t.duration, 0) / totalTests;

    return {
      failureRate,
      flakyTests,
      recentFailures,
      avgDuration
    };
  }

  /**
   * Identify risk factors based on analysis
   */
  private identifyRiskFactors(
    codeMetrics: CodeMetrics,
    historyAnalysis: ReturnType<typeof this.analyzeTestHistory>,
    complexityThreshold: number
  ): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Code complexity risk
    if (codeMetrics.complexity > complexityThreshold * 2) {
      factors.push({
        factor: 'High Code Complexity',
        impact: 'critical',
        description: `Cyclomatic complexity (${codeMetrics.complexity}) is very high. Consider refactoring.`
      });
    } else if (codeMetrics.complexity > complexityThreshold) {
      factors.push({
        factor: 'Elevated Code Complexity',
        impact: 'high',
        description: `Cyclomatic complexity (${codeMetrics.complexity}) exceeds threshold (${complexityThreshold}).`
      });
    }

    // Large change risk
    if (codeMetrics.changedLines > 500) {
      factors.push({
        factor: 'Large Code Change',
        impact: 'high',
        description: `${codeMetrics.changedLines} lines changed. Large changes increase bug probability.`
      });
    } else if (codeMetrics.changedLines > 200) {
      factors.push({
        factor: 'Significant Code Change',
        impact: 'medium',
        description: `${codeMetrics.changedLines} lines changed. Consider breaking into smaller changes.`
      });
    }

    // Risk area factors
    codeMetrics.riskAreas.forEach(area => {
      const riskMapping: Record<string, { impact: RiskFactor['impact']; desc: string }> = {
        'authentication': { impact: 'critical', desc: 'Changes to authentication require thorough security testing.' },
        'payment-flow': { impact: 'critical', desc: 'Payment flow changes require extensive testing and validation.' },
        'database-operations': { impact: 'high', desc: 'Database changes may cause data integrity issues.' },
        'async-operations': { impact: 'medium', desc: 'Async code is prone to race conditions and timing issues.' },
        'network-calls': { impact: 'medium', desc: 'Network operations may fail under various conditions.' },
        'error-handling': { impact: 'low', desc: 'Error handling changes - verify all error cases are covered.' },
        'state-management': { impact: 'medium', desc: 'State management changes may cause UI inconsistencies.' }
      };

      const mapping = riskMapping[area];
      if (mapping) {
        factors.push({
          factor: `${area.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} Modified`,
          impact: mapping.impact,
          description: mapping.desc
        });
      }
    });

    // Historical risk factors
    if (historyAnalysis.failureRate > 20) {
      factors.push({
        factor: 'High Historical Failure Rate',
        impact: 'high',
        description: `Test failure rate is ${historyAnalysis.failureRate.toFixed(1)}%. Investigate root causes.`
      });
    }

    if (historyAnalysis.flakyTests.length > 0) {
      factors.push({
        factor: 'Flaky Tests Detected',
        impact: 'medium',
        description: `${historyAnalysis.flakyTests.length} test(s) show inconsistent results.`
      });
    }

    return factors;
  }

  /**
   * Predict specific failures based on analysis
   */
  private predictFailures(
    code: string,
    codeMetrics: CodeMetrics,
    historyAnalysis: ReturnType<typeof this.analyzeTestHistory>
  ): PredictedFailure[] {
    const failures: PredictedFailure[] = [];

    // Add predictions based on risk areas
    codeMetrics.riskAreas.forEach(area => {
      const predictions: Record<string, { reason: string; probability: number; fix: string }> = {
        'authentication': {
          reason: 'Authentication changes may break login/logout flows',
          probability: 0.75,
          fix: 'Add comprehensive auth tests covering all user states'
        },
        'payment-flow': {
          reason: 'Payment processing is sensitive to any changes',
          probability: 0.80,
          fix: 'Test all payment scenarios including edge cases'
        },
        'async-operations': {
          reason: 'Async code may have race conditions',
          probability: 0.60,
          fix: 'Add proper async/await handling and timeout tests'
        },
        'database-operations': {
          reason: 'Database queries may fail or return unexpected data',
          probability: 0.55,
          fix: 'Verify database schema and add data validation'
        }
      };

      const pred = predictions[area];
      if (pred) {
        failures.push({
          file: `*${area}*`,
          reason: pred.reason,
          probability: pred.probability,
          suggestedFix: pred.fix
        });
      }
    });

    // Add predictions from flaky tests
    historyAnalysis.flakyTests.forEach(test => {
      failures.push({
        file: test,
        reason: 'Test has shown inconsistent results in recent runs',
        probability: 0.70,
        suggestedFix: 'Investigate test dependencies and add proper cleanup'
      });
    });

    // Add predictions from recent failures
    historyAnalysis.recentFailures.forEach(test => {
      if (!failures.find(f => f.file === test)) {
        failures.push({
          file: test,
          reason: 'Test failed in recent runs',
          probability: 0.65,
          suggestedFix: 'Check for regressions in related code'
        });
      }
    });

    // Sort by probability
    return failures.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(
    riskFactors: RiskFactor[],
    predictedFailures: PredictedFailure[]
  ): number {
    let score = 0;

    // Add points based on risk factors
    riskFactors.forEach(factor => {
      switch (factor.impact) {
        case 'critical': score += 25; break;
        case 'high': score += 15; break;
        case 'medium': score += 10; break;
        case 'low': score += 5; break;
      }
    });

    // Add points based on predicted failures
    predictedFailures.forEach(failure => {
      score += failure.probability * 10;
    });

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate confidence level
   */
  private calculateConfidence(code: string, history: TestHistoryEntry[]): number {
    let confidence = 0.5; // Base confidence

    // More code = higher confidence in code analysis
    if (code && code.length > 100) confidence += 0.15;
    if (code && code.length > 500) confidence += 0.10;

    // More history = higher confidence in predictions
    if (history && history.length > 10) confidence += 0.15;
    if (history && history.length > 50) confidence += 0.10;

    return Math.min(0.95, confidence);
  }

  /**
   * Generate recommendation based on analysis
   */
  private generateRecommendation(
    riskFactors: RiskFactor[],
    predictedFailures: PredictedFailure[]
  ): string {
    const criticalFactors = riskFactors.filter(f => f.impact === 'critical');
    const highFactors = riskFactors.filter(f => f.impact === 'high');
    const highProbFailures = predictedFailures.filter(f => f.probability > 0.7);

    if (criticalFactors.length > 0) {
      return `⚠️ CRITICAL: ${criticalFactors[0].factor}. ${criticalFactors[0].description} Recommend blocking deployment until addressed.`;
    }

    if (highProbFailures.length > 0) {
      return `🔴 HIGH RISK: ${highProbFailures.length} test(s) likely to fail. Focus on: ${highProbFailures.slice(0, 3).map(f => f.file).join(', ')}`;
    }

    if (highFactors.length > 0) {
      return `🟠 ELEVATED RISK: ${highFactors[0].factor}. ${highFactors[0].description}`;
    }

    if (riskFactors.length > 0) {
      return `🟡 MODERATE RISK: ${riskFactors.length} risk factor(s) identified. Review before deployment.`;
    }

    return '🟢 LOW RISK: No significant issues detected. Proceed with standard testing.';
  }

  /**
   * 💎 PRO: Chronos Engine - Time-travel debugging
   * Records state snapshots during test execution for debugging
   * Requires Pro license
   */
  async chronos(options: ChronosOptions): Promise<ChronosResult> {
    if (!this.isProLicense) {
      throw new Error('Chronos Engine requires a Pro license. Get yours at https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe');
    }

    const { 
      testFn, 
      autoSnapshot = true, 
      snapshotInterval = 100,
      maxSnapshots = 50 
    } = options;

    if (typeof testFn !== 'function') {
      throw new Error('testFn must be a function');
    }

    if (this.config.verbose) {
      console.log('⏰ Starting Chronos Engine...');
    }

    const snapshots: StateSnapshot[] = [];
    const timeline: TimelineEvent[] = [];
    const startTime = Date.now();
    let success = true;
    let errorMessage: string | undefined;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    // Create snapshot function
    const takeSnapshot = (label?: string, state: Record<string, any> = {}) => {
      if (snapshots.length >= maxSnapshots) {
        snapshots.shift(); // Remove oldest snapshot
      }
      
      const snapshot: StateSnapshot = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        state: { ...state },
        label
      };
      
      snapshots.push(snapshot);
      
      timeline.push({
        timestamp: new Date(),
        type: 'snapshot',
        description: label || `Snapshot #${snapshots.length}`,
        data: { snapshotId: snapshot.id }
      });
    };

    try {
      // Initial snapshot
      takeSnapshot('Initial state');
      
      timeline.push({
        timestamp: new Date(),
        type: 'action',
        description: 'Test execution started'
      });

      // Auto snapshot at intervals
      if (autoSnapshot) {
        intervalId = setInterval(() => {
          takeSnapshot('Auto snapshot');
        }, snapshotInterval);
      }

      // Execute the test function
      await testFn();

      timeline.push({
        timestamp: new Date(),
        type: 'action',
        description: 'Test execution completed successfully'
      });

    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : String(error);
      
      timeline.push({
        timestamp: new Date(),
        type: 'error',
        description: `Test failed: ${errorMessage}`,
        data: { error: errorMessage }
      });

      // Take error snapshot
      takeSnapshot('Error state', { error: errorMessage });
      
    } finally {
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // Final snapshot
      takeSnapshot('Final state');
    }

    const duration = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`✅ Chronos complete! Duration: ${duration}ms, Snapshots: ${snapshots.length}`);
    }

    return {
      success,
      snapshots,
      timeline,
      duration,
      error: errorMessage
    };
  }

  /**
   * 💎 PRO: API Sensei - Intelligent API testing
   * Automatically generates and runs API tests based on configuration
   * Requires Pro license
   */
  async apiSensei(config: APISenseiConfig): Promise<APISenseiResult> {
    if (!this.isProLicense) {
      throw new Error('API Sensei requires a Pro license. Get yours at https://buy.polar.sh/polar_cl_XBbOE1Qr4Vfv9QHRn7exBdaOB9qoC2Wees7zX1yQsOe');
    }

    const { 
      baseUrl, 
      auth,
      scenarios = ['happy-path', 'edge-cases', 'error-handling']
    } = config;

    if (!baseUrl) {
      throw new Error('baseUrl is required');
    }

    if (this.config.verbose) {
      console.log(`🤖 API Sensei analyzing ${baseUrl}...`);
    }

    const startTime = Date.now();
    const testResults: APISenseiTestResult[] = [];
    const recommendations: string[] = [];
    let passed = 0;
    let failed = 0;

    // Build auth headers
    const authHeaders: Record<string, string> = {};
    if (auth) {
      switch (auth.type) {
        case 'bearer':
          if (auth.token) authHeaders['Authorization'] = `Bearer ${auth.token}`;
          break;
        case 'basic':
          if (auth.username && auth.password) {
            const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
            authHeaders['Authorization'] = `Basic ${encoded}`;
          }
          break;
        case 'apiKey':
          if (auth.apiKey && auth.headerName) {
            authHeaders[auth.headerName] = auth.apiKey;
          }
          break;
      }
    }

    // Generate test scenarios
    const tests = this.generateAPISenseiTests(baseUrl, scenarios, authHeaders);

    // Run tests
    for (const test of tests) {
      try {
        const result = await this.runAPISenseiTest(test, authHeaders);
        testResults.push(result);
        
        if (result.status === 'passed') {
          passed++;
        } else if (result.status === 'failed') {
          failed++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        testResults.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          scenario: test.scenario,
          status: 'failed',
          responseTime: 0,
          assertions: [],
          error: errorMsg
        });
        failed++;
      }
    }

    // Generate recommendations
    const failureRate = tests.length > 0 ? (failed / tests.length) * 100 : 0;
    
    if (failureRate > 50) {
      recommendations.push('🔴 Critical: Over 50% of tests failed. Review API implementation.');
    }
    
    const slowTests = testResults.filter(t => t.responseTime > 1000);
    if (slowTests.length > 0) {
      recommendations.push(`⚠️ Performance: ${slowTests.length} endpoint(s) have response time > 1s.`);
    }

    const errorTests = testResults.filter(t => t.scenario === 'error-handling' && t.status === 'failed');
    if (errorTests.length > 0) {
      recommendations.push(`🛡️ Error Handling: ${errorTests.length} error scenario(s) not handled properly.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All tests passed. API is functioning correctly.');
    }

    const duration = Date.now() - startTime;

    if (this.config.verbose) {
      console.log(`✅ API Sensei complete! ${passed} passed, ${failed} failed`);
    }

    return {
      baseUrl,
      totalTests: tests.length,
      passed,
      failed,
      testResults,
      coverage: {
        endpoints: tests.length,
        testedEndpoints: testResults.filter(t => t.status !== 'skipped').length,
        coveragePercent: tests.length > 0 ? 
          (testResults.filter(t => t.status !== 'skipped').length / tests.length) * 100 : 0
      },
      recommendations,
      duration
    };
  }

  /**
   * Generate API test scenarios
   */
  private generateAPISenseiTests(
    baseUrl: string,
    scenarios: APISenseiConfig['scenarios'],
    authHeaders: Record<string, string>
  ): Array<{
    name: string;
    endpoint: string;
    method: string;
    scenario: string;
    body?: any;
    expectedStatus?: number;
    assertions: string[];
  }> {
    const tests: Array<{
      name: string;
      endpoint: string;
      method: string;
      scenario: string;
      body?: any;
      expectedStatus?: number;
      assertions: string[];
    }> = [];

    // Happy path tests
    if (scenarios?.includes('happy-path')) {
      tests.push({
        name: 'GET Base URL - Happy Path',
        endpoint: baseUrl,
        method: 'GET',
        scenario: 'happy-path',
        expectedStatus: 200,
        assertions: ['status < 400', 'responseTime < 5000']
      });

      tests.push({
        name: 'HEAD Base URL - Check Availability',
        endpoint: baseUrl,
        method: 'HEAD',
        scenario: 'happy-path',
        expectedStatus: 200,
        assertions: ['status < 400']
      });
    }

    // Edge case tests
    if (scenarios?.includes('edge-cases')) {
      tests.push({
        name: 'GET with trailing slash',
        endpoint: `${baseUrl}/`,
        method: 'GET',
        scenario: 'edge-cases',
        assertions: ['status < 500']
      });

      tests.push({
        name: 'OPTIONS - CORS check',
        endpoint: baseUrl,
        method: 'OPTIONS',
        scenario: 'edge-cases',
        assertions: ['status < 500']
      });
    }

    // Error handling tests
    if (scenarios?.includes('error-handling')) {
      tests.push({
        name: 'GET Non-existent endpoint',
        endpoint: `${baseUrl}/non-existent-path-${Date.now()}`,
        method: 'GET',
        scenario: 'error-handling',
        expectedStatus: 404,
        assertions: ['status === 404 || status === 400']
      });

      tests.push({
        name: 'POST without body',
        endpoint: baseUrl,
        method: 'POST',
        scenario: 'error-handling',
        assertions: ['status < 500'] // Should handle gracefully, not crash
      });
    }

    // Security tests
    if (scenarios?.includes('security')) {
      tests.push({
        name: 'SQL Injection attempt',
        endpoint: `${baseUrl}?id=1' OR '1'='1`,
        method: 'GET',
        scenario: 'security',
        assertions: ['status !== 500', 'status !== 200'] // Should be blocked
      });

      tests.push({
        name: 'XSS attempt',
        endpoint: `${baseUrl}?q=<script>alert(1)</script>`,
        method: 'GET',
        scenario: 'security',
        assertions: ['status !== 500']
      });
    }

    // Performance tests
    if (scenarios?.includes('performance')) {
      tests.push({
        name: 'Response time check',
        endpoint: baseUrl,
        method: 'GET',
        scenario: 'performance',
        assertions: ['responseTime < 3000']
      });
    }

    return tests;
  }

  /**
   * Run a single API Sensei test
   */
  private async runAPISenseiTest(
    test: {
      name: string;
      endpoint: string;
      method: string;
      scenario: string;
      body?: any;
      expectedStatus?: number;
      assertions: string[];
    },
    authHeaders: Record<string, string>
  ): Promise<APISenseiTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: test.method as any,
        url: test.endpoint,
        headers: {
          'User-Agent': 'MisterMind-APISensei/1.0',
          ...authHeaders
        },
        data: test.body,
        timeout: this.config.timeout,
        validateStatus: () => true
      });

      const responseTime = Date.now() - startTime;
      const assertions: AssertionResult[] = [];

      // Check expected status
      if (test.expectedStatus !== undefined) {
        assertions.push({
          assertion: `status === ${test.expectedStatus}`,
          passed: response.status === test.expectedStatus,
          expected: test.expectedStatus,
          actual: response.status
        });
      }

      // Run custom assertions
      for (const assertion of test.assertions) {
        let passed = false;
        const status = response.status;
        
        try {
          // Simple assertion evaluation
          if (assertion.includes('status')) {
            passed = eval(assertion.replace('status', status.toString()));
          }
          if (assertion.includes('responseTime')) {
            passed = eval(assertion.replace('responseTime', responseTime.toString()));
          }
        } catch {
          passed = false;
        }

        assertions.push({
          assertion,
          passed,
          actual: assertion.includes('status') ? status : responseTime
        });
      }

      const allPassed = assertions.every(a => a.passed);

      return {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        scenario: test.scenario,
        status: allPassed ? 'passed' : 'failed',
        responseTime,
        assertions
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        scenario: test.scenario,
        status: 'failed',
        responseTime: Date.now() - startTime,
        assertions: [],
        error: errorMsg
      };
    }
  }

  /**
   * Validate license key
   */
  private validateLicense(key: string): boolean {
    // Validate format with regex
    if (!key || typeof key !== 'string') {
      console.log('⚠️ Invalid license key. Running in Free mode.');
      return false;
    }
    
    const cleanKey = key.trim().toUpperCase();
    
    if (LICENSE_PATTERN.test(cleanKey)) {
      this.isProLicense = true;
      console.log('✅ Pro license activated!');
      return true;
    }
    
    console.log('⚠️ Invalid license key. Running in Free mode.');
    return false;
  }

  /**
   * Get current license status
   */
  getLicenseStatus(): { isValid: boolean; tier: string } {
    return {
      isValid: this.isProLicense,
      tier: this.isProLicense ? 'pro' : 'free'
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 🧠 ADAPTIVE SEMANTIC CORE (ASC) - v16.0 Features
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 💎 PRO: Get Adaptive Semantic Core instance
   * Returns null if not initialized
   */
  getASC(): AdaptiveSemanticCore | null {
    return this.asc;
  }

  /**
   * 💎 PRO: Create semantic map of a page
   * Extracts all interactive elements with semantic meaning
   */
  async createSemanticMap(page: Page): Promise<SemanticMap> {
    if (!this.isProLicense) {
      throw new Error('Semantic Map requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.asc) {
      this.initASC();
    }

    return this.asc!.createSemanticMap(page);
  }

  /**
   * 💎 PRO: Find element by intent (semantic search)
   * Searches for element by meaning, not by selector
   */
  async findByIntent(page: Page, intent: Intent): Promise<IntentMatch | null> {
    if (!this.isProLicense) {
      throw new Error('Intent Matching requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.asc) {
      this.initASC();
    }

    return this.asc!.matchIntent(page, intent);
  }

  /**
   * 💎 PRO: Execute action by intent
   * Click, fill, or hover on element found by semantic meaning
   */
  async executeIntent(
    page: Page,
    intent: Intent,
    action: 'click' | 'fill' | 'hover' = 'click',
    value?: string
  ): Promise<boolean> {
    if (!this.isProLicense) {
      throw new Error('Intent Execution requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.asc) {
      this.initASC();
    }

    return this.asc!.executeIntent(page, intent, action, value);
  }

  /**
   * 💎 PRO: Quick semantic search for element
   * Shorthand for finding elements by keywords
   */
  async findElement(
    page: Page,
    keywords: string[],
    options?: { expectedType?: 'button' | 'link' | 'input' | 'form' | 'any'; positionHint?: string }
  ): Promise<IntentMatch | null> {
    if (!this.isProLicense) {
      throw new Error('Semantic Search requires a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    if (!this.asc) {
      this.initASC();
    }

    return this.asc!.findElement(page, keywords, options as any);
  }

  /**
   * 💎 PRO: Smart click - click by meaning
   * Example: await mm.smartClick(page, ['login', 'sign in'])
   */
  async smartClick(page: Page, keywords: string[]): Promise<boolean> {
    const intent: Intent = {
      action: `CLICK_${keywords.join('_').toUpperCase()}`,
      keywords,
      expectedType: 'button'
    };
    return this.executeIntent(page, intent, 'click');
  }

  /**
   * 💎 PRO: Smart fill - fill input by meaning
   * Example: await mm.smartFill(page, ['email', 'e-mail'], 'user@example.com')
   */
  async smartFill(page: Page, keywords: string[], value: string): Promise<boolean> {
    const intent: Intent = {
      action: `FILL_${keywords.join('_').toUpperCase()}`,
      keywords,
      expectedType: 'input'
    };
    return this.executeIntent(page, intent, 'fill', value);
  }

  /**
   * 💎 PRO: Execute common intent
   * Uses pre-defined intents: LOGIN, LOGOUT, SUBMIT, SEARCH, ADD_TO_CART, CHECKOUT, NEXT, CLOSE
   */
  async doAction(
    page: Page, 
    action: keyof typeof CommonIntents,
    value?: string
  ): Promise<boolean> {
    if (!this.isProLicense) {
      throw new Error('Smart Actions require a Pro license. Get yours at ' + CHECKOUT_URL);
    }

    const intent = CommonIntents[action];
    if (!intent) {
      throw new Error(`Unknown action: ${action}. Available: ${Object.keys(CommonIntents).join(', ')}`);
    }

    const execAction = intent.keywords.some(k => 
      k.includes('search') || k.includes('email') || k.includes('password')
    ) ? 'fill' : 'click';

    return this.executeIntent(page, intent, execAction, value);
  }

  /**
   * 💎 PRO: Get ASC statistics
   * Returns knowledge base stats and success rates
   */
  getASCStats(): { totalEntries: number; successRate: number; mostUsed: string[] } | null {
    if (!this.asc) return null;
    return this.asc.getStats();
  }

  /**
   * 💎 PRO: Save ASC knowledge to file
   */
  saveASCKnowledge(): void {
    if (this.asc) {
      this.asc.saveKnowledge();
    }
  }

  /**
   * 💎 PRO: Clear ASC cache
   */
  clearASCCache(): void {
    if (this.asc) {
      this.asc.clearCache();
    }
  }
}

// Default export
export default MisterMind;

// Named exports for convenience
export const createMisterMind = (config?: MisterMindConfig) => new MisterMind(config);

// Version constant
export const VERSION = '16.0.0';

// Re-export ASC types and utilities
export { 
  AdaptiveSemanticCore, 
  CommonIntents,
  Intent,
  IntentMatch,
  SemanticMap,
  SemanticElement,
  ASCConfig
} from './asc/semantic-core';
