/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 17/50: Error Detector                              ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Intelligent error detection and classification
 * @phase 1 - Enterprise Foundation
 * @step 17 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ErrorType - Error classification
 */
const ErrorType = {
    // Element errors
    ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
    ELEMENT_NOT_VISIBLE: 'ELEMENT_NOT_VISIBLE',
    ELEMENT_NOT_CLICKABLE: 'ELEMENT_NOT_CLICKABLE',
    ELEMENT_STALE: 'ELEMENT_STALE',
    ELEMENT_OBSCURED: 'ELEMENT_OBSCURED',
    
    // Timeout errors
    TIMEOUT: 'TIMEOUT',
    WAIT_TIMEOUT: 'WAIT_TIMEOUT',
    LOAD_TIMEOUT: 'LOAD_TIMEOUT',
    
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    API_ERROR: 'API_ERROR',
    CONNECTION_REFUSED: 'CONNECTION_REFUSED',
    DNS_ERROR: 'DNS_ERROR',
    
    // Application errors
    APP_CRASH: 'APP_CRASH',
    UNEXPECTED_DIALOG: 'UNEXPECTED_DIALOG',
    PAGE_CHANGED: 'PAGE_CHANGED',
    STATE_MISMATCH: 'STATE_MISMATCH',
    
    // Data errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DATA_MISMATCH: 'DATA_MISMATCH',
    ASSERTION_ERROR: 'ASSERTION_ERROR',
    
    // System errors
    MEMORY_ERROR: 'MEMORY_ERROR',
    RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    
    // Unknown
    UNKNOWN: 'UNKNOWN'
};

/**
 * ErrorSeverity - Severity levels
 */
const ErrorSeverity = {
    CRITICAL: 'critical',   // Test cannot continue
    HIGH: 'high',           // Major functionality affected
    MEDIUM: 'medium',       // Functionality affected but recoverable
    LOW: 'low',             // Minor issue
    INFO: 'info'            // Informational only
};

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR PATTERN
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ErrorPattern - Pattern for matching errors
 */
class ErrorPattern {
    constructor(config) {
        this.name = config.name;
        this.type = config.type || ErrorType.UNKNOWN;
        this.severity = config.severity || ErrorSeverity.MEDIUM;
        this.patterns = config.patterns || [];
        this.matcher = config.matcher || null;
        this.recoverable = config.recoverable !== false;
        this.recoveryHints = config.recoveryHints || [];
    }

    /**
     * Check if error matches pattern
     */
    matches(error) {
        // Custom matcher
        if (this.matcher) {
            return this.matcher(error);
        }
        
        // Pattern matching
        const message = error.message || String(error);
        const stack = error.stack || '';
        
        for (const pattern of this.patterns) {
            if (pattern instanceof RegExp) {
                if (pattern.test(message) || pattern.test(stack)) {
                    return true;
                }
            } else if (typeof pattern === 'string') {
                if (message.includes(pattern) || stack.includes(pattern)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BuiltInPatterns - Common error patterns
 */
const BuiltInPatterns = [
    // Element not found
    new ErrorPattern({
        name: 'elementNotFound',
        type: ErrorType.ELEMENT_NOT_FOUND,
        severity: ErrorSeverity.HIGH,
        patterns: [
            /element not found/i,
            /no such element/i,
            /unable to locate element/i,
            /cannot find element/i,
            /element does not exist/i
        ],
        recoverable: true,
        recoveryHints: ['Try alternative selector', 'Wait for element', 'Check page loaded']
    }),
    
    // Element not visible
    new ErrorPattern({
        name: 'elementNotVisible',
        type: ErrorType.ELEMENT_NOT_VISIBLE,
        severity: ErrorSeverity.MEDIUM,
        patterns: [
            /element not visible/i,
            /element is not visible/i,
            /visibility hidden/i,
            /display none/i
        ],
        recoverable: true,
        recoveryHints: ['Scroll to element', 'Wait for visibility', 'Check CSS']
    }),
    
    // Element not clickable
    new ErrorPattern({
        name: 'elementNotClickable',
        type: ErrorType.ELEMENT_NOT_CLICKABLE,
        severity: ErrorSeverity.MEDIUM,
        patterns: [
            /element not clickable/i,
            /element is not clickable/i,
            /other element would receive the click/i,
            /click intercepted/i
        ],
        recoverable: true,
        recoveryHints: ['Wait for clickability', 'Remove overlay', 'Use JavaScript click']
    }),
    
    // Stale element
    new ErrorPattern({
        name: 'staleElement',
        type: ErrorType.ELEMENT_STALE,
        severity: ErrorSeverity.MEDIUM,
        patterns: [
            /stale element/i,
            /element is stale/i,
            /element reference is stale/i
        ],
        recoverable: true,
        recoveryHints: ['Re-find element', 'Refresh page reference']
    }),
    
    // Timeout
    new ErrorPattern({
        name: 'timeout',
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.HIGH,
        patterns: [
            /timeout/i,
            /timed out/i,
            /exceeded.*time/i
        ],
        recoverable: true,
        recoveryHints: ['Increase timeout', 'Check network', 'Verify page loaded']
    }),
    
    // Network error
    new ErrorPattern({
        name: 'networkError',
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.HIGH,
        patterns: [
            /network error/i,
            /fetch failed/i,
            /ECONNREFUSED/i,
            /ENOTFOUND/i,
            /ETIMEDOUT/i
        ],
        recoverable: true,
        recoveryHints: ['Retry request', 'Check connectivity', 'Verify endpoint']
    }),
    
    // Connection refused
    new ErrorPattern({
        name: 'connectionRefused',
        type: ErrorType.CONNECTION_REFUSED,
        severity: ErrorSeverity.CRITICAL,
        patterns: [
            /connection refused/i,
            /ECONNREFUSED/i
        ],
        recoverable: false,
        recoveryHints: ['Check server running', 'Verify port', 'Check firewall']
    }),
    
    // API error
    new ErrorPattern({
        name: 'apiError',
        type: ErrorType.API_ERROR,
        severity: ErrorSeverity.HIGH,
        patterns: [
            /api error/i,
            /status 4\d\d/i,
            /status 5\d\d/i,
            /bad request/i,
            /unauthorized/i,
            /forbidden/i
        ],
        recoverable: true,
        recoveryHints: ['Check API key', 'Verify endpoint', 'Check request format']
    }),
    
    // Assertion error
    new ErrorPattern({
        name: 'assertionError',
        type: ErrorType.ASSERTION_ERROR,
        severity: ErrorSeverity.HIGH,
        patterns: [
            /assertion.*fail/i,
            /expect.*to/i,
            /expected.*but got/i
        ],
        recoverable: false,
        recoveryHints: ['Verify test data', 'Check application state']
    }),
    
    // Memory error
    new ErrorPattern({
        name: 'memoryError',
        type: ErrorType.MEMORY_ERROR,
        severity: ErrorSeverity.CRITICAL,
        patterns: [
            /out of memory/i,
            /heap.*memory/i,
            /memory allocation/i
        ],
        recoverable: false,
        recoveryHints: ['Increase memory limit', 'Check memory leaks']
    })
];

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ErrorDetector - Detects and classifies errors
 */
class ErrorDetector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxHistory: options.maxHistory || 100,
            enableAnalytics: options.enableAnalytics !== false,
            ...options
        };
        
        this.patterns = [...BuiltInPatterns];
        this.history = [];
        this.analytics = {
            total: 0,
            byType: {},
            bySeverity: {}
        };
    }

    /**
     * Register custom pattern
     */
    registerPattern(pattern) {
        if (pattern instanceof ErrorPattern) {
            this.patterns.push(pattern);
        } else {
            this.patterns.push(new ErrorPattern(pattern));
        }
        return this;
    }

    /**
     * Detect and classify error
     */
    detect(error) {
        const result = {
            original: error,
            message: error.message || String(error),
            stack: error.stack || null,
            type: ErrorType.UNKNOWN,
            severity: ErrorSeverity.MEDIUM,
            recoverable: true,
            pattern: null,
            recoveryHints: [],
            timestamp: new Date().toISOString(),
            context: {}
        };
        
        // Find matching pattern
        for (const pattern of this.patterns) {
            if (pattern.matches(error)) {
                result.type = pattern.type;
                result.severity = pattern.severity;
                result.recoverable = pattern.recoverable;
                result.pattern = pattern.name;
                result.recoveryHints = pattern.recoveryHints;
                break;
            }
        }
        
        // Extract additional context
        result.context = this._extractContext(error);
        
        // Update analytics
        this._updateAnalytics(result);
        
        // Add to history
        this._addToHistory(result);
        
        // Emit event
        this.emit('detected', result);
        
        if (result.severity === ErrorSeverity.CRITICAL) {
            this.emit('critical', result);
        }
        
        return result;
    }

    /**
     * Extract context from error
     */
    _extractContext(error) {
        const context = {};
        
        // Extract URL if present
        if (error.url) {
            context.url = error.url;
        }
        
        // Extract selector if present
        if (error.selector) {
            context.selector = error.selector;
        }
        
        // Extract HTTP status
        if (error.status) {
            context.httpStatus = error.status;
        }
        
        // Extract stack frames
        if (error.stack) {
            const frames = error.stack.split('\n').slice(1, 5);
            context.stackSummary = frames.map(f => f.trim());
        }
        
        return context;
    }

    /**
     * Update analytics
     */
    _updateAnalytics(result) {
        if (!this.options.enableAnalytics) return;
        
        this.analytics.total++;
        
        this.analytics.byType[result.type] = 
            (this.analytics.byType[result.type] || 0) + 1;
        
        this.analytics.bySeverity[result.severity] = 
            (this.analytics.bySeverity[result.severity] || 0) + 1;
    }

    /**
     * Add to history
     */
    _addToHistory(result) {
        this.history.push(result);
        
        if (this.history.length > this.options.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Get recent errors
     */
    getRecentErrors(count = 10) {
        return this.history.slice(-count);
    }

    /**
     * Get errors by type
     */
    getErrorsByType(type) {
        return this.history.filter(e => e.type === type);
    }

    /**
     * Get errors by severity
     */
    getErrorsBySeverity(severity) {
        return this.history.filter(e => e.severity === severity);
    }

    /**
     * Get analytics
     */
    getAnalytics() {
        return {
            ...this.analytics,
            mostCommonType: this._getMostCommon(this.analytics.byType),
            mostCommonSeverity: this._getMostCommon(this.analytics.bySeverity)
        };
    }

    /**
     * Get most common from object
     */
    _getMostCommon(obj) {
        let max = 0;
        let result = null;
        
        for (const [key, count] of Object.entries(obj)) {
            if (count > max) {
                max = count;
                result = key;
            }
        }
        
        return result;
    }

    /**
     * Check if error is recoverable
     */
    isRecoverable(error) {
        const result = this.detect(error);
        return result.recoverable;
    }

    /**
     * Get recovery hints
     */
    getRecoveryHints(error) {
        const result = error.type ? error : this.detect(error);
        return result.recoveryHints;
    }

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        return this;
    }

    /**
     * Reset analytics
     */
    resetAnalytics() {
        this.analytics = {
            total: 0,
            byType: {},
            bySeverity: {}
        };
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR AGGREGATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ErrorAggregator - Aggregates errors for reporting
 */
class ErrorAggregator {
    constructor(options = {}) {
        this.errors = [];
        this.groups = new Map();
        this.options = options;
    }

    /**
     * Add error
     */
    add(error) {
        const entry = {
            error,
            timestamp: Date.now(),
            group: this._getGroup(error)
        };
        
        this.errors.push(entry);
        
        // Add to group
        if (!this.groups.has(entry.group)) {
            this.groups.set(entry.group, []);
        }
        this.groups.get(entry.group).push(entry);
        
        return this;
    }

    /**
     * Get group key
     */
    _getGroup(error) {
        return error.type || ErrorType.UNKNOWN;
    }

    /**
     * Get summary
     */
    getSummary() {
        const summary = {
            total: this.errors.length,
            groups: {},
            timeline: []
        };
        
        for (const [group, errors] of this.groups) {
            summary.groups[group] = {
                count: errors.length,
                firstSeen: errors[0]?.timestamp,
                lastSeen: errors[errors.length - 1]?.timestamp
            };
        }
        
        // Create timeline (grouped by minute)
        const timeline = new Map();
        for (const entry of this.errors) {
            const minute = Math.floor(entry.timestamp / 60000) * 60000;
            timeline.set(minute, (timeline.get(minute) || 0) + 1);
        }
        
        summary.timeline = Array.from(timeline.entries()).map(([time, count]) => ({
            time: new Date(time).toISOString(),
            count
        }));
        
        return summary;
    }

    /**
     * Clear
     */
    clear() {
        this.errors = [];
        this.groups.clear();
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultDetector = null;

module.exports = {
    // Classes
    ErrorPattern,
    ErrorDetector,
    ErrorAggregator,
    
    // Types
    ErrorType,
    ErrorSeverity,
    
    // Built-in patterns
    BuiltInPatterns,
    
    // Singleton
    getErrorDetector: (options = {}) => {
        if (!defaultDetector) {
            defaultDetector = new ErrorDetector(options);
        }
        return defaultDetector;
    },
    
    // Factory
    createErrorDetector: (options = {}) => new ErrorDetector(options)
};

console.log('✅ Step 17/50: Error Detector loaded');
