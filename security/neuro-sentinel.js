/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 27/50: Neuro Sentinel Security                     ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description AI-Powered Security and Threat Detection
 * @phase 2 - Autonomous Intelligence
 * @step 27 of 50
 */

'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// THREAT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ThreatLevel - Security threat levels
 */
const ThreatLevel = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info'
};

/**
 * ThreatType - Types of threats
 */
const ThreatType = {
    INJECTION: 'injection',
    XSS: 'xss',
    CSRF: 'csrf',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    DATA_LEAK: 'data_leak',
    RATE_LIMIT: 'rate_limit',
    ANOMALY: 'anomaly',
    MALWARE: 'malware',
    DDOS: 'ddos'
};

// ═══════════════════════════════════════════════════════════════════════════════
// THREAT DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ThreatDetector - Detect security threats
 */
class ThreatDetector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            sensitivePatterns: options.sensitivePatterns || [],
            ...options
        };
        
        this.patterns = this._loadPatterns();
        this.stats = {
            scanned: 0,
            threats: 0,
            blocked: 0
        };
    }

    /**
     * Load detection patterns
     */
    _loadPatterns() {
        return {
            // SQL Injection patterns
            sqlInjection: [
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b.*\b(FROM|INTO|WHERE|TABLE)\b)/i,
                /('|")\s*(OR|AND)\s*('|")\s*=/i,
                /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
                /CHAR\s*\(\d+\)/i
            ],
            
            // XSS patterns
            xss: [
                /<script[^>]*>[\s\S]*?<\/script>/gi,
                /javascript\s*:/i,
                /on\w+\s*=/gi,
                /<iframe[^>]*>/gi,
                /eval\s*\(/gi,
                /document\.(cookie|write|location)/gi
            ],
            
            // Path traversal
            pathTraversal: [
                /\.\.\//g,
                /\.\.\\|/g,
                /%2e%2e/gi,
                /%252e%252e/gi
            ],
            
            // Command injection
            commandInjection: [
                /;\s*(ls|cat|rm|mv|cp|wget|curl|bash|sh)\s/gi,
                /\|\s*(ls|cat|rm|mv|cp|wget|curl|bash|sh)\s/gi,
                /`[^`]*`/g,
                /\$\([^)]*\)/g
            ],
            
            // Sensitive data patterns
            sensitiveData: [
                /\b\d{3}-\d{2}-\d{4}\b/,  // SSN
                /\b\d{16}\b/,              // Credit card
                /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
                /password\s*[:=]\s*[^\s]+/i,
                /api[_-]?key\s*[:=]\s*[^\s]+/i,
                /secret\s*[:=]\s*[^\s]+/i
            ]
        };
    }

    /**
     * Scan input for threats
     */
    scan(input, context = {}) {
        this.stats.scanned++;
        const threats = [];
        const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
        
        // Check SQL Injection
        for (const pattern of this.patterns.sqlInjection) {
            if (pattern.test(inputStr)) {
                threats.push({
                    type: ThreatType.INJECTION,
                    subtype: 'sql',
                    level: ThreatLevel.CRITICAL,
                    pattern: pattern.toString(),
                    evidence: inputStr.match(pattern)?.[0]
                });
            }
        }
        
        // Check XSS
        for (const pattern of this.patterns.xss) {
            if (pattern.test(inputStr)) {
                threats.push({
                    type: ThreatType.XSS,
                    level: ThreatLevel.HIGH,
                    pattern: pattern.toString(),
                    evidence: inputStr.match(pattern)?.[0]
                });
            }
        }
        
        // Check Path Traversal
        for (const pattern of this.patterns.pathTraversal) {
            if (pattern.test(inputStr)) {
                threats.push({
                    type: ThreatType.INJECTION,
                    subtype: 'path_traversal',
                    level: ThreatLevel.HIGH,
                    pattern: pattern.toString()
                });
            }
        }
        
        // Check Command Injection
        for (const pattern of this.patterns.commandInjection) {
            if (pattern.test(inputStr)) {
                threats.push({
                    type: ThreatType.INJECTION,
                    subtype: 'command',
                    level: ThreatLevel.CRITICAL,
                    pattern: pattern.toString()
                });
            }
        }
        
        // Check Sensitive Data Exposure
        for (const pattern of this.patterns.sensitiveData) {
            if (pattern.test(inputStr)) {
                threats.push({
                    type: ThreatType.DATA_LEAK,
                    level: ThreatLevel.HIGH,
                    pattern: pattern.toString()
                });
            }
        }
        
        if (threats.length > 0) {
            this.stats.threats += threats.length;
            this.emit('threats:detected', { threats, input: inputStr.substring(0, 100) });
        }
        
        return {
            safe: threats.length === 0,
            threats,
            highestLevel: this._getHighestLevel(threats)
        };
    }

    /**
     * Get highest threat level
     */
    _getHighestLevel(threats) {
        const levels = [ThreatLevel.CRITICAL, ThreatLevel.HIGH, ThreatLevel.MEDIUM, ThreatLevel.LOW, ThreatLevel.INFO];
        
        for (const level of levels) {
            if (threats.some(t => t.level === level)) {
                return level;
            }
        }
        
        return null;
    }

    /**
     * Sanitize input
     */
    sanitize(input) {
        let sanitized = String(input);
        
        // Remove script tags
        sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        
        // Encode HTML entities
        sanitized = sanitized
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
        
        return sanitized;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANOMALY DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AnomalyDetector - Detect behavioral anomalies
 */
class AnomalyDetector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            windowSize: options.windowSize || 100,
            threshold: options.threshold || 3, // Standard deviations
            ...options
        };
        
        this.metrics = new Map();
        this.baselines = new Map();
    }

    /**
     * Record metric
     */
    record(metricName, value) {
        if (!this.metrics.has(metricName)) {
            this.metrics.set(metricName, []);
        }
        
        const values = this.metrics.get(metricName);
        values.push({ value, timestamp: Date.now() });
        
        // Keep window size
        if (values.length > this.options.windowSize) {
            values.shift();
        }
        
        // Check for anomaly
        return this._checkAnomaly(metricName, value);
    }

    /**
     * Check for anomaly
     */
    _checkAnomaly(metricName, value) {
        const values = this.metrics.get(metricName);
        
        if (values.length < 10) {
            return { isAnomaly: false, reason: 'insufficient_data' };
        }
        
        // Calculate statistics
        const numbers = values.map(v => v.value);
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
        const stdDev = Math.sqrt(variance);
        
        // Store baseline
        this.baselines.set(metricName, { mean, stdDev });
        
        // Calculate z-score
        const zScore = stdDev > 0 ? Math.abs(value - mean) / stdDev : 0;
        
        const isAnomaly = zScore > this.options.threshold;
        
        if (isAnomaly) {
            this.emit('anomaly:detected', {
                metric: metricName,
                value,
                zScore,
                mean,
                stdDev,
                threshold: this.options.threshold
            });
        }
        
        return {
            isAnomaly,
            zScore,
            mean,
            stdDev,
            deviation: value - mean
        };
    }

    /**
     * Get baseline
     */
    getBaseline(metricName) {
        return this.baselines.get(metricName);
    }

    /**
     * Clear metrics
     */
    clear() {
        this.metrics.clear();
        this.baselines.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RateLimiter - Rate limiting protection
 */
class RateLimiter extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            windowMs: options.windowMs || 60000, // 1 minute
            maxRequests: options.maxRequests || 100,
            ...options
        };
        
        this.requests = new Map();
    }

    /**
     * Check rate limit
     */
    check(identifier) {
        const now = Date.now();
        const windowStart = now - this.options.windowMs;
        
        if (!this.requests.has(identifier)) {
            this.requests.set(identifier, []);
        }
        
        // Clean old requests
        const requests = this.requests.get(identifier)
            .filter(ts => ts > windowStart);
        
        this.requests.set(identifier, requests);
        
        // Check limit
        if (requests.length >= this.options.maxRequests) {
            this.emit('rate:exceeded', { identifier, requests: requests.length });
            
            return {
                allowed: false,
                remaining: 0,
                resetIn: Math.ceil((requests[0] + this.options.windowMs - now) / 1000)
            };
        }
        
        // Record request
        requests.push(now);
        
        return {
            allowed: true,
            remaining: this.options.maxRequests - requests.length,
            resetIn: Math.ceil(this.options.windowMs / 1000)
        };
    }

    /**
     * Reset limit for identifier
     */
    reset(identifier) {
        this.requests.delete(identifier);
    }

    /**
     * Clear all limits
     */
    clear() {
        this.requests.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEURO SENTINEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NeuroSentinel - AI-Powered Security System
 */
class NeuroSentinel extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            mode: options.mode || 'monitor', // 'monitor' | 'enforce'
            learningEnabled: options.learningEnabled !== false,
            ...options
        };
        
        this.threatDetector = new ThreatDetector(options);
        this.anomalyDetector = new AnomalyDetector(options);
        this.rateLimiter = new RateLimiter(options);
        
        this.incidents = [];
        this.blocklist = new Set();
        this.allowlist = new Set();
        
        this._setupListeners();
    }

    /**
     * Setup internal listeners
     */
    _setupListeners() {
        this.threatDetector.on('threats:detected', (data) => {
            this._handleThreats(data);
        });
        
        this.anomalyDetector.on('anomaly:detected', (data) => {
            this._handleAnomaly(data);
        });
        
        this.rateLimiter.on('rate:exceeded', (data) => {
            this._handleRateExceeded(data);
        });
    }

    /**
     * Analyze request
     */
    analyze(request) {
        const analysis = {
            timestamp: Date.now(),
            request: {
                method: request.method,
                path: request.path,
                ip: request.ip
            },
            checks: {},
            decision: 'allow'
        };
        
        // Check allowlist
        if (this.allowlist.has(request.ip)) {
            analysis.decision = 'allow';
            analysis.reason = 'allowlisted';
            return analysis;
        }
        
        // Check blocklist
        if (this.blocklist.has(request.ip)) {
            analysis.decision = 'block';
            analysis.reason = 'blocklisted';
            return analysis;
        }
        
        // Rate limit check
        const rateCheck = this.rateLimiter.check(request.ip);
        analysis.checks.rateLimit = rateCheck;
        
        if (!rateCheck.allowed) {
            analysis.decision = 'block';
            analysis.reason = 'rate_limit_exceeded';
            return analysis;
        }
        
        // Threat detection
        const threatCheck = this.threatDetector.scan(
            JSON.stringify(request.body || {}) + JSON.stringify(request.query || {}),
            { path: request.path }
        );
        analysis.checks.threats = threatCheck;
        
        if (!threatCheck.safe) {
            if (threatCheck.highestLevel === ThreatLevel.CRITICAL ||
                threatCheck.highestLevel === ThreatLevel.HIGH) {
                analysis.decision = this.options.mode === 'enforce' ? 'block' : 'warn';
                analysis.reason = 'threat_detected';
            }
        }
        
        // Record for anomaly detection
        this.anomalyDetector.record(`requests:${request.path}`, 1);
        
        this.emit('analyzed', analysis);
        
        return analysis;
    }

    /**
     * Handle detected threats
     */
    _handleThreats(data) {
        const incident = {
            id: `incident_${Date.now()}`,
            type: 'threat',
            timestamp: Date.now(),
            data
        };
        
        this.incidents.push(incident);
        this.emit('incident', incident);
    }

    /**
     * Handle anomaly
     */
    _handleAnomaly(data) {
        const incident = {
            id: `incident_${Date.now()}`,
            type: 'anomaly',
            timestamp: Date.now(),
            data
        };
        
        this.incidents.push(incident);
        this.emit('incident', incident);
    }

    /**
     * Handle rate exceeded
     */
    _handleRateExceeded(data) {
        const incident = {
            id: `incident_${Date.now()}`,
            type: 'rate_limit',
            timestamp: Date.now(),
            data
        };
        
        this.incidents.push(incident);
        this.emit('incident', incident);
        
        // Auto-block if too many violations
        if (this.options.mode === 'enforce') {
            // Could implement auto-blocking here
        }
    }

    /**
     * Add to blocklist
     */
    block(identifier) {
        this.blocklist.add(identifier);
        this.emit('blocked', { identifier });
        return this;
    }

    /**
     * Add to allowlist
     */
    allow(identifier) {
        this.allowlist.add(identifier);
        this.emit('allowed', { identifier });
        return this;
    }

    /**
     * Get security report
     */
    getReport() {
        return {
            mode: this.options.mode,
            stats: {
                scanned: this.threatDetector.stats.scanned,
                threats: this.threatDetector.stats.threats,
                incidents: this.incidents.length,
                blocked: this.blocklist.size
            },
            recentIncidents: this.incidents.slice(-20),
            blocklist: Array.from(this.blocklist),
            allowlist: Array.from(this.allowlist)
        };
    }

    /**
     * Clear incidents
     */
    clearIncidents() {
        this.incidents = [];
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultSentinel = null;

module.exports = {
    // Classes
    ThreatDetector,
    AnomalyDetector,
    RateLimiter,
    NeuroSentinel,
    
    // Types
    ThreatLevel,
    ThreatType,
    
    // Factory
    createSentinel: (options = {}) => new NeuroSentinel(options),
    
    // Singleton
    getSentinel: (options = {}) => {
        if (!defaultSentinel) {
            defaultSentinel = new NeuroSentinel(options);
        }
        return defaultSentinel;
    }
};

console.log('✅ Step 27/50: Neuro Sentinel Security loaded');
