/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum - Evidence Collector Module
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 🛡️ CyberCody "Safe Hunter" Mode - Automated Evidence Collection
 * 
 * Features:
 * • EVENT_DRIVEN_CAPTURE: Automatic screenshots on security events
 * • AI_ANNOTATION: Gemini 2.0 Vision integration for vulnerability highlighting
 * • SECURE_STORAGE: Timestamped evidence with metadata
 * • PRIVACY_MASKING: GDPR-compliant PII/credit card masking
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { Page, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/** Security event types that trigger automatic capture */
export type SecurityEventType = 
  | 'IDOR_CANDIDATE'
  | 'PII_LEAK'
  | 'URL_CHANGE'
  | 'AUTH_BYPASS'
  | 'BOLA_DETECTED'
  | 'XSS_REFLECTION'
  | 'SENSITIVE_DATA_EXPOSURE'
  | 'CSRF_TOKEN_MISSING'
  | 'SESSION_FIXATION'
  | 'CLICKJACKING_RISK';

/** Evidence capture mode */
export type CaptureMode = 'safe-hunter' | 'aggressive' | 'stealth' | 'manual';

/** Image format for storage */
export type ImageFormat = 'webp' | 'png' | 'jpeg';

/** Privacy masking level */
export type MaskingLevel = 'strict' | 'standard' | 'minimal' | 'none';

/** AI annotation provider */
export type AIAnnotationProvider = 'gemini' | 'local-vision' | 'disabled';

/** Evidence metadata structure */
export interface EvidenceMetadata {
  readonly id: string;
  readonly timestamp: Date;
  readonly eventType: SecurityEventType;
  readonly url: string;
  readonly sessionId: string;
  readonly userId?: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  readonly description: string;
  readonly aiAnnotations?: AIAnnotation[];
  readonly maskingApplied: boolean;
  readonly maskedFields: string[];
  readonly checksum: string;
  readonly captureMode: CaptureMode;
  readonly browserInfo: BrowserInfo;
  readonly networkContext?: NetworkContext;
}

/** AI annotation from Gemini Vision */
export interface AIAnnotation {
  readonly region: BoundingBox;
  readonly label: string;
  readonly confidence: number;
  readonly vulnType?: string;
  readonly recommendation?: string;
}

/** Bounding box for annotations */
export interface BoundingBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Browser information */
export interface BrowserInfo {
  readonly name: string;
  readonly version: string;
  readonly userAgent: string;
  readonly viewport: { width: number; height: number };
  readonly deviceScaleFactor: number;
}

/** Network context at capture time */
export interface NetworkContext {
  readonly lastRequest?: {
    url: string;
    method: string;
    status?: number;
    headers?: Record<string, string>;
  };
  readonly cookies?: { name: string; domain: string }[];
  readonly localStorage?: Record<string, string>;
}

/** Evidence Collector configuration */
export interface EvidenceCollectorConfig {
  /** Base directory for evidence storage */
  outputDir: string;
  /** Target application name (e.g., 'revolut') */
  targetApp: string;
  /** Capture mode */
  mode: CaptureMode;
  /** Image format */
  imageFormat: ImageFormat;
  /** Image quality (1-100) */
  imageQuality: number;
  /** Enable AI annotations */
  aiAnnotations: AIAnnotationProvider;
  /** Gemini API key (if using Gemini) */
  geminiApiKey?: string;
  /** Privacy masking level */
  maskingLevel: MaskingLevel;
  /** Auto-capture on security events */
  autoCaptureEvents: SecurityEventType[];
  /** Compress images */
  compress: boolean;
  /** Max storage size in MB */
  maxStorageMB: number;
  /** Encryption key for evidence files */
  encryptionKey?: string;
  /** Verbose logging */
  verbose: boolean;
}

/** Evidence capture result */
export interface CaptureResult {
  readonly success: boolean;
  readonly evidenceId: string;
  readonly filePath: string;
  readonly metadata: EvidenceMetadata;
  readonly annotatedPath?: string;
  readonly error?: string;
  readonly duration: number;
}

/** Evidence session statistics */
export interface SessionStats {
  readonly sessionId: string;
  readonly startTime: Date;
  readonly totalCaptures: number;
  readonly capturesByType: Record<SecurityEventType, number>;
  readonly storageUsedMB: number;
  readonly aiAnnotationsCount: number;
  readonly maskedFieldsCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENSITIVE DATA PATTERNS (GDPR Compliant Masking)
// ═══════════════════════════════════════════════════════════════════════════════

const SENSITIVE_PATTERNS = {
  // Credit Card Numbers (Visa, MC, Amex, etc.)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g,
  
  // CVV/CVC
  cvv: /\b\d{3,4}\b(?=\s*(?:cvv|cvc|security|код|код за сигурност))/gi,
  
  // IBAN
  iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b/g,
  
  // Bulgarian EGN (Personal ID)
  egn: /\b\d{10}\b/g,
  
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone numbers (Bulgarian + International)
  phone: /(?:\+359|0)[\s-]?\d{2,3}[\s-]?\d{3}[\s-]?\d{3,4}/g,
  
  // Passwords (in visible form fields)
  password: /password|парола|pin|пин/gi,
  
  // SSN patterns
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  
  // API Keys / Tokens
  apiKey: /\b(?:api[_-]?key|token|bearer|auth)[=:\s]+[a-zA-Z0-9_-]{20,}\b/gi,
};

// ═══════════════════════════════════════════════════════════════════════════════
// EVIDENCE COLLECTOR CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class EvidenceCollector {
  private config: EvidenceCollectorConfig;
  private sessionId: string;
  private sessionStats: SessionStats;
  private page: Page | null = null;
  private isCapturing = false;
  private eventListeners: Map<SecurityEventType, ((data: unknown) => void)[]> = new Map();

  constructor(config: Partial<EvidenceCollectorConfig> = {}) {
    this.sessionId = this.generateSessionId();
    
    this.config = {
      outputDir: config.outputDir ?? './evidence',
      targetApp: config.targetApp ?? 'unknown',
      mode: config.mode ?? 'safe-hunter',
      imageFormat: config.imageFormat ?? 'webp',
      imageQuality: config.imageQuality ?? 85,
      aiAnnotations: config.aiAnnotations ?? 'disabled',
      geminiApiKey: config.geminiApiKey,
      maskingLevel: config.maskingLevel ?? 'standard',
      autoCaptureEvents: config.autoCaptureEvents ?? [
        'IDOR_CANDIDATE',
        'PII_LEAK',
        'URL_CHANGE',
        'BOLA_DETECTED',
        'SENSITIVE_DATA_EXPOSURE'
      ],
      compress: config.compress ?? true,
      maxStorageMB: config.maxStorageMB ?? 1024,
      encryptionKey: config.encryptionKey,
      verbose: config.verbose ?? false,
    };

    this.sessionStats = {
      sessionId: this.sessionId,
      startTime: new Date(),
      totalCaptures: 0,
      capturesByType: {} as Record<SecurityEventType, number>,
      storageUsedMB: 0,
      aiAnnotationsCount: 0,
      maskedFieldsCount: 0,
    };

    this.initializeStorage();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Initialize the collector with a Playwright page
   */
  async initialize(page: Page): Promise<void> {
    this.page = page;
    
    if (this.config.mode === 'safe-hunter') {
      await this.setupEventDrivenCapture();
    }

    this.log('info', `🎯 Evidence Collector initialized for ${this.config.targetApp}`);
    this.log('info', `📁 Storage: ${this.getEvidencePath()}`);
    this.log('info', `🔒 Masking Level: ${this.config.maskingLevel}`);
    this.log('info', `🤖 AI Annotations: ${this.config.aiAnnotations}`);
  }

  /**
   * Capture evidence for a security event
   */
  async captureEvidence(
    eventType: SecurityEventType,
    description: string,
    severity: EvidenceMetadata['severity'] = 'medium',
    additionalContext?: Partial<NetworkContext>
  ): Promise<CaptureResult> {
    if (!this.page) {
      throw new Error('Evidence Collector not initialized. Call initialize(page) first.');
    }

    if (this.isCapturing) {
      this.log('warn', '⏳ Capture already in progress, queuing...');
      await this.waitForCapture();
    }

    this.isCapturing = true;
    const startTime = Date.now();
    const evidenceId = this.generateEvidenceId(eventType);

    try {
      this.log('info', `📸 Capturing evidence: ${eventType} - ${description}`);

      // 1. Take screenshot
      const rawScreenshot = await this.takeScreenshot();

      // 2. Apply privacy masking
      const { maskedScreenshot, maskedFields } = await this.applyPrivacyMasking(rawScreenshot);

      // 3. Get browser info
      const browserInfo = await this.getBrowserInfo();

      // 4. Get network context
      const networkContext = additionalContext ?? await this.getNetworkContext();

      // 5. Build metadata
      const metadata: EvidenceMetadata = {
        id: evidenceId,
        timestamp: new Date(),
        eventType,
        url: this.page.url(),
        sessionId: this.sessionId,
        severity,
        description,
        maskingApplied: maskedFields.length > 0,
        maskedFields,
        checksum: this.calculateChecksum(maskedScreenshot),
        captureMode: this.config.mode,
        browserInfo,
        networkContext,
      };

      // 6. Save evidence
      const filePath = await this.saveEvidence(evidenceId, maskedScreenshot, metadata);

      // 7. AI Annotation (if enabled)
      let annotatedPath: string | undefined;
      let aiAnnotations: AIAnnotation[] | undefined;

      if (this.config.aiAnnotations !== 'disabled') {
        const annotationResult = await this.annotateWithAI(maskedScreenshot, eventType, description);
        if (annotationResult) {
          annotatedPath = await this.saveAnnotatedImage(evidenceId, annotationResult.image);
          aiAnnotations = annotationResult.annotations;
          
          // Update metadata with annotations
          (metadata as { aiAnnotations: AIAnnotation[] }).aiAnnotations = aiAnnotations;
        }
      }

      // 8. Update stats
      this.updateStats(eventType, maskedFields.length, aiAnnotations?.length ?? 0);

      const duration = Date.now() - startTime;
      this.log('info', `✅ Evidence captured: ${filePath} (${duration}ms)`);

      return {
        success: true,
        evidenceId,
        filePath,
        metadata,
        annotatedPath,
        duration,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', `❌ Capture failed: ${errorMessage}`);
      
      return {
        success: false,
        evidenceId,
        filePath: '',
        metadata: {} as EvidenceMetadata,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    } finally {
      this.isCapturing = false;
    }
  }

  /**
   * Emit a security event (triggers auto-capture if configured)
   */
  emitSecurityEvent(eventType: SecurityEventType, data: unknown): void {
    if (this.config.autoCaptureEvents.includes(eventType)) {
      const description = this.formatEventDescription(eventType, data);
      this.captureEvidence(eventType, description).catch(err => {
        this.log('error', `Auto-capture failed: ${err}`);
      });
    }

    // Notify listeners
    const listeners = this.eventListeners.get(eventType) ?? [];
    listeners.forEach(listener => listener(data));
  }

  /**
   * Subscribe to security events
   */
  onSecurityEvent(eventType: SecurityEventType, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(eventType) ?? [];
    listeners.push(callback);
    this.eventListeners.set(eventType, listeners);
  }

  /**
   * Get session statistics
   */
  getStats(): SessionStats {
    return { ...this.sessionStats };
  }

  /**
   * Get evidence directory path
   */
  getEvidencePath(): string {
    return path.join(this.config.outputDir, this.config.targetApp);
  }

  /**
   * Export evidence report
   */
  async exportReport(): Promise<string> {
    const reportPath = path.join(
      this.getEvidencePath(),
      `report-${this.sessionId}.json`
    );

    const report = {
      session: this.sessionStats,
      config: {
        ...this.config,
        geminiApiKey: this.config.geminiApiKey ? '[REDACTED]' : undefined,
        encryptionKey: this.config.encryptionKey ? '[REDACTED]' : undefined,
      },
      evidence: await this.listEvidence(),
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log('info', `📊 Report exported: ${reportPath}`);
    
    return reportPath;
  }

  /**
   * List all collected evidence
   */
  async listEvidence(): Promise<EvidenceMetadata[]> {
    const evidenceDir = this.getEvidencePath();
    const metadataFiles = fs.readdirSync(evidenceDir)
      .filter(f => f.endsWith('.metadata.json'));

    return metadataFiles.map(file => {
      const content = fs.readFileSync(path.join(evidenceDir, file), 'utf-8');
      return JSON.parse(content) as EvidenceMetadata;
    });
  }

  /**
   * Cleanup old evidence files
   */
  async cleanup(maxAgeDays: number = 30): Promise<number> {
    const evidenceDir = this.getEvidencePath();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    let deletedCount = 0;
    const files = fs.readdirSync(evidenceDir);

    for (const file of files) {
      const filePath = path.join(evidenceDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    this.log('info', `🧹 Cleanup: ${deletedCount} files deleted`);
    return deletedCount;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  private initializeStorage(): void {
    const evidenceDir = this.getEvidencePath();
    
    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
      this.log('info', `📁 Created evidence directory: ${evidenceDir}`);
    }

    // Create session subdirectory
    const sessionDir = path.join(evidenceDir, this.sessionId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
  }

  private async setupEventDrivenCapture(): Promise<void> {
    if (!this.page) return;

    // URL change detection
    this.page.on('framenavigated', async (frame) => {
      if (frame === this.page?.mainFrame()) {
        this.emitSecurityEvent('URL_CHANGE', { url: frame.url() });
      }
    });

    // Response monitoring for sensitive data
    this.page.on('response', async (response) => {
      try {
        const contentType = response.headers()['content-type'] ?? '';
        if (contentType.includes('application/json')) {
          const body = await response.text().catch(() => '');
          
          // Check for PII in response
          if (this.detectSensitiveData(body)) {
            this.emitSecurityEvent('PII_LEAK', {
              url: response.url(),
              status: response.status(),
            });
          }

          // Check for IDOR indicators
          if (this.detectIDORIndicators(body, response.url())) {
            this.emitSecurityEvent('IDOR_CANDIDATE', {
              url: response.url(),
              method: response.request().method(),
            });
          }
        }
      } catch {
        // Ignore response processing errors
      }
    });

    this.log('info', '🎣 Event-driven capture hooks installed');
  }

  private async takeScreenshot(): Promise<Buffer> {
    if (!this.page) throw new Error('Page not available');

    // Playwright doesn't support webp, so we always use png (quality not supported for png)
    // For jpeg, quality is supported
    const screenshotType = this.config.imageFormat === 'jpeg' ? 'jpeg' : 'png';
    
    const screenshot = await this.page.screenshot({
      type: screenshotType,
      fullPage: false,
      ...(screenshotType === 'jpeg' ? { quality: this.config.imageQuality } : {}),
    });

    return screenshot;
  }

  private async applyPrivacyMasking(
    screenshot: Buffer
  ): Promise<{ maskedScreenshot: Buffer; maskedFields: string[] }> {
    if (this.config.maskingLevel === 'none') {
      return { maskedScreenshot: screenshot, maskedFields: [] };
    }

    const maskedFields: string[] = [];

    // In-browser masking for sensitive form fields
    if (this.page) {
      try {
        const sensitiveSelectors = [
          'input[type="password"]',
          'input[name*="card"]',
          'input[name*="cvv"]',
          'input[name*="cvc"]',
          'input[name*="expir"]',
          'input[autocomplete="cc-number"]',
          'input[autocomplete="cc-csc"]',
          '[data-testid*="card"]',
          '[data-testid*="cvv"]',
          '.credit-card-input',
          '.card-number',
          '.cvv-input',
        ];

        for (const selector of sensitiveSelectors) {
          const elements = await this.page.$$(selector);
          for (const element of elements) {
            await element.evaluate((el) => {
              const htmlEl = el as HTMLElement;
              htmlEl.style.filter = 'blur(10px)';
              htmlEl.style.backgroundColor = '#000';
            });
            maskedFields.push(selector);
          }
        }

        // Take new screenshot with masked fields
        if (maskedFields.length > 0) {
          screenshot = await this.takeScreenshot();
          
          // Restore original appearance
          for (const selector of sensitiveSelectors) {
            const elements = await this.page.$$(selector);
            for (const element of elements) {
              await element.evaluate((el) => {
                const htmlEl = el as HTMLElement;
                htmlEl.style.filter = '';
                htmlEl.style.backgroundColor = '';
              });
            }
          }
        }
      } catch {
        this.log('warn', '⚠️ Could not apply in-browser masking');
      }
    }

    return { maskedScreenshot: screenshot, maskedFields };
  }

  private async getBrowserInfo(): Promise<BrowserInfo> {
    if (!this.page) {
      return {
        name: 'unknown',
        version: 'unknown',
        userAgent: 'unknown',
        viewport: { width: 0, height: 0 },
        deviceScaleFactor: 1,
      };
    }

    const viewport = this.page.viewportSize() ?? { width: 1920, height: 1080 };
    const userAgent = await this.page.evaluate(() => navigator.userAgent);
    
    // Parse browser from user agent
    let browserName = 'unknown';
    if (userAgent.includes('Chrome')) browserName = 'Chromium';
    else if (userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (userAgent.includes('Safari')) browserName = 'WebKit';

    return {
      name: browserName,
      version: userAgent.match(/Chrome\/(\d+)/)?.[1] ?? 'unknown',
      userAgent,
      viewport,
      deviceScaleFactor: 1,
    };
  }

  private async getNetworkContext(): Promise<NetworkContext> {
    if (!this.page) return {};

    try {
      const cookies = await this.page.context().cookies();
      
      return {
        cookies: cookies.map(c => ({ name: c.name, domain: c.domain })),
      };
    } catch {
      return {};
    }
  }

  private async saveEvidence(
    evidenceId: string,
    screenshot: Buffer,
    metadata: EvidenceMetadata
  ): Promise<string> {
    const sessionDir = path.join(this.getEvidencePath(), this.sessionId);
    
    // Save screenshot
    const ext = this.config.imageFormat;
    const imagePath = path.join(sessionDir, `${evidenceId}.${ext}`);
    
    let imageData = screenshot;
    
    // Encrypt if configured
    if (this.config.encryptionKey) {
      imageData = this.encryptData(screenshot, this.config.encryptionKey);
      fs.writeFileSync(imagePath + '.encrypted', imageData);
    } else {
      fs.writeFileSync(imagePath, imageData);
    }

    // Save metadata
    const metadataPath = path.join(sessionDir, `${evidenceId}.metadata.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return imagePath;
  }

  private async saveAnnotatedImage(evidenceId: string, annotatedImage: Buffer): Promise<string> {
    const sessionDir = path.join(this.getEvidencePath(), this.sessionId);
    const annotatedPath = path.join(sessionDir, `${evidenceId}.annotated.${this.config.imageFormat}`);
    
    fs.writeFileSync(annotatedPath, annotatedImage);
    return annotatedPath;
  }

  private async annotateWithAI(
    screenshot: Buffer,
    eventType: SecurityEventType,
    description: string
  ): Promise<{ image: Buffer; annotations: AIAnnotation[] } | null> {
    if (this.config.aiAnnotations === 'disabled') {
      return null;
    }

    if (this.config.aiAnnotations === 'gemini' && this.config.geminiApiKey) {
      return this.annotateWithGemini(screenshot, eventType, description);
    }

    if (this.config.aiAnnotations === 'local-vision') {
      return this.annotateWithLocalVision(screenshot, eventType, description);
    }

    return null;
  }

  private async annotateWithGemini(
    screenshot: Buffer,
    eventType: SecurityEventType,
    description: string
  ): Promise<{ image: Buffer; annotations: AIAnnotation[] } | null> {
    try {
      const base64Image = screenshot.toString('base64');
      
      const prompt = `
You are a security analyst reviewing a screenshot for potential vulnerabilities.

Event Type: ${eventType}
Description: ${description}

Analyze this screenshot and identify:
1. Any visible security vulnerabilities
2. Sensitive data that should be masked
3. UI elements that indicate security risks

For each finding, provide:
- The region (x, y, width, height as percentages 0-100)
- A label describing the issue
- Confidence score (0-1)
- Vulnerability type
- Recommendation

Respond in JSON format:
{
  "annotations": [
    {
      "region": {"x": 10, "y": 20, "width": 30, "height": 10},
      "label": "Exposed user ID in URL",
      "confidence": 0.95,
      "vulnType": "IDOR",
      "recommendation": "Use indirect references instead of direct IDs"
    }
  ]
}
`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.config.geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: base64Image
                  }
                }
              ]
            }]
          })
        }
      );

      if (!response.ok) {
        this.log('warn', `Gemini API error: ${response.status}`);
        return null;
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      const annotations: AIAnnotation[] = parsed.annotations ?? [];

      // For now, return original image (annotation drawing would require canvas)
      // In production, use Sharp or Canvas to draw rectangles
      return {
        image: screenshot,
        annotations,
      };

    } catch (error) {
      this.log('warn', `Gemini annotation failed: ${error}`);
      return null;
    }
  }

  private async annotateWithLocalVision(
    screenshot: Buffer,
    _eventType: SecurityEventType,
    _description: string
  ): Promise<{ image: Buffer; annotations: AIAnnotation[] } | null> {
    // Placeholder for local vision model (e.g., Ollama with llava)
    this.log('info', '🔍 Local vision annotation not yet implemented');
    return { image: screenshot, annotations: [] };
  }

  private detectSensitiveData(content: string): boolean {
    for (const [key, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
      if (pattern.test(content)) {
        this.log('warn', `⚠️ Sensitive data detected: ${key}`);
        return true;
      }
    }
    return false;
  }

  private detectIDORIndicators(responseBody: string, url: string): boolean {
    // Check for user IDs in response that differ from expected
    const idPatterns = [
      /"user_?id":\s*"?(\d+)"?/i,
      /"account_?id":\s*"?(\d+)"?/i,
      /"customer_?id":\s*"?(\d+)"?/i,
      /\/users\/(\d+)/i,
      /\/accounts\/(\d+)/i,
    ];

    for (const pattern of idPatterns) {
      if (pattern.test(responseBody) || pattern.test(url)) {
        return true;
      }
    }

    return false;
  }

  private formatEventDescription(eventType: SecurityEventType, data: unknown): string {
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return `[AUTO] ${eventType}: ${dataStr.substring(0, 200)}`;
  }

  private updateStats(
    eventType: SecurityEventType,
    maskedCount: number,
    annotationCount: number
  ): void {
    this.sessionStats = {
      ...this.sessionStats,
      totalCaptures: this.sessionStats.totalCaptures + 1,
      capturesByType: {
        ...this.sessionStats.capturesByType,
        [eventType]: (this.sessionStats.capturesByType[eventType] ?? 0) + 1,
      },
      maskedFieldsCount: this.sessionStats.maskedFieldsCount + maskedCount,
      aiAnnotationsCount: this.sessionStats.aiAnnotationsCount + annotationCount,
    };

    // Update storage size
    this.updateStorageStats();
  }

  private updateStorageStats(): void {
    try {
      const sessionDir = path.join(this.getEvidencePath(), this.sessionId);
      const files = fs.readdirSync(sessionDir);
      
      let totalSize = 0;
      for (const file of files) {
        const stat = fs.statSync(path.join(sessionDir, file));
        totalSize += stat.size;
      }

      this.sessionStats = {
        ...this.sessionStats,
        storageUsedMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
      };
    } catch {
      // Ignore stat errors
    }
  }

  private generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `session-${timestamp}-${random}`;
  }

  private generateEvidenceId(eventType: SecurityEventType): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `${eventType.toLowerCase()}-${timestamp}-${random}`;
  }

  private calculateChecksum(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private encryptData(data: Buffer, key: string): Buffer {
    const algorithm = 'aes-256-gcm';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, keyHash, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Prepend IV and auth tag
    return Buffer.concat([iv, authTag, encrypted]);
  }

  private async waitForCapture(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (!this.isCapturing) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  private log(level: 'info' | 'warn' | 'error', message: string): void {
    if (this.config.verbose || level === 'error') {
      const prefix = {
        info: '🔍',
        warn: '⚠️',
        error: '❌',
      }[level];
      console.log(`[EvidenceCollector] ${prefix} ${message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY & UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a pre-configured Evidence Collector for Revolut testing
 */
export function createRevolutEvidenceCollector(
  geminiApiKey?: string
): EvidenceCollector {
  return new EvidenceCollector({
    outputDir: './evidence',
    targetApp: 'revolut',
    mode: 'safe-hunter',
    imageFormat: 'webp',
    imageQuality: 85,
    aiAnnotations: geminiApiKey ? 'gemini' : 'disabled',
    geminiApiKey,
    maskingLevel: 'strict',
    autoCaptureEvents: [
      'IDOR_CANDIDATE',
      'PII_LEAK',
      'URL_CHANGE',
      'BOLA_DETECTED',
      'SENSITIVE_DATA_EXPOSURE',
      'AUTH_BYPASS',
    ],
    compress: true,
    maxStorageMB: 2048,
    verbose: true,
  });
}

/**
 * Quick capture utility
 */
export async function quickCapture(
  page: Page,
  eventType: SecurityEventType,
  description: string
): Promise<CaptureResult> {
  const collector = new EvidenceCollector({ verbose: false });
  await collector.initialize(page);
  return collector.captureEvidence(eventType, description);
}

// Export default
export default EvidenceCollector;
