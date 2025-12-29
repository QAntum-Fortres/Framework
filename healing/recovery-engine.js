/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 18/50: Recovery Engine                             ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Self-healing recovery mechanisms
 * @phase 1 - Enterprise Foundation
 * @step 18 of 50
 */

'use strict';

const EventEmitter = require('events');
const { ErrorType, ErrorSeverity } = require('./error-detector');

// ═══════════════════════════════════════════════════════════════════════════════
// RECOVERY STRATEGY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RecoveryStrategy - Base strategy for recovery
 */
class RecoveryStrategy {
    constructor(config) {
        this.name = config.name;
        this.description = config.description || '';
        this.errorTypes = config.errorTypes || [];
        this.priority = config.priority || 50;
        this.maxAttempts = config.maxAttempts || 3;
    }

    /**
     * Check if strategy applies to error
     */
    appliesTo(errorType) {
        return this.errorTypes.length === 0 || this.errorTypes.includes(errorType);
    }

    /**
     * Execute recovery
     */
    async execute(context) {
        throw new Error('Strategy must implement execute()');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RetryStrategy - Simple retry
 */
class RetryRecoveryStrategy extends RecoveryStrategy {
    constructor(options = {}) {
        super({
            name: 'retry',
            description: 'Simple retry of failed action',
            errorTypes: [],
            priority: 10,
            ...options
        });
        
        this.delay = options.delay || 1000;
    }

    async execute(context) {
        await this._sleep(this.delay);
        return context.retry();
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * RefreshStrategy - Refresh page/state
 */
class RefreshRecoveryStrategy extends RecoveryStrategy {
    constructor(options = {}) {
        super({
            name: 'refresh',
            description: 'Refresh page or application state',
            errorTypes: [ErrorType.ELEMENT_STALE, ErrorType.STATE_MISMATCH],
            priority: 30,
            ...options
        });
    }

    async execute(context) {
        if (context.driver?.refresh) {
            await context.driver.refresh();
            await this._waitForLoad(context);
        }
        return context.retry();
    }

    async _waitForLoad(context) {
        // Wait for page to be ready
        return new Promise(resolve => setTimeout(resolve, 2000));
    }
}

/**
 * WaitAndRetryStrategy - Wait longer then retry
 */
class WaitAndRetryStrategy extends RecoveryStrategy {
    constructor(options = {}) {
        super({
            name: 'waitAndRetry',
            description: 'Wait longer for element/condition',
            errorTypes: [ErrorType.TIMEOUT, ErrorType.ELEMENT_NOT_FOUND, ErrorType.ELEMENT_NOT_VISIBLE],
            priority: 20,
            ...options
        });
        
        this.waitTime = options.waitTime || 3000;
    }

    async execute(context) {
        await new Promise(resolve => setTimeout(resolve, this.waitTime));
        return context.retry();
    }
}

/**
 * AlternativeSelectorStrategy - Try alternative selectors
 */
class AlternativeSelectorStrategy extends RecoveryStrategy {
    constructor(options = {}) {
        super({
            name: 'alternativeSelector',
            description: 'Try alternative element selectors',
            errorTypes: [ErrorType.ELEMENT_NOT_FOUND, ErrorType.ELEMENT_STALE],
            priority: 40,
            ...options
        });
    }

    async execute(context) {
        const alternatives = this._generateAlternatives(context.selector);
        
        for (const alt of alternatives) {
            try {
                context.currentSelector = alt;
                const result = await context.retry();
                if (result.success) {
                    return result;
                }
            } catch (e) {
                // Try next alternative
            }
        }
        
        return { success: false, reason: 'No alternatives worked' };
    }

    _generateAlternatives(selector) {
        const alternatives = [];
        
        // Generate ID-based alternatives
        if (selector.includes('#')) {
            const id = selector.match(/#([a-zA-Z0-9_-]+)/)?.[1];
            if (id) {
                alternatives.push(`[id="${id}"]`);
                alternatives.push(`[id*="${id}"]`);
            }
        }
        
        // Generate class-based alternatives
        if (selector.includes('.')) {
            const className = selector.match(/\.([a-zA-Z0-9_-]+)/)?.[1];
            if (className) {
                alternatives.push(`[class*="${className}"]`);
            }
        }
        
        // Text-based alternative
        if (selector.includes('text')) {
            alternatives.push(selector.replace(/text/g, 'contains'));
        }
        
        return alternatives;
    }
}

/**
 * ScrollIntoViewStrategy - Scroll element into view
 */
class ScrollIntoViewStrategy extends RecoveryStrategy {
    constructor(options = {}) {
        super({
            name: 'scrollIntoView',
            description: 'Scroll to make element visible',
            errorTypes: [ErrorType.ELEMENT_NOT_VISIBLE, ErrorType.ELEMENT_NOT_CLICKABLE, ErrorType.ELEMENT_OBSCURED],
            priority: 35,
            ...options
        });
    }

    async execute(context) {
        if (context.element && context.driver?.executeScript) {
            await context.driver.executeScript(
                'arguments[0].scrollIntoView({ behavior: "smooth", block: "center" })',
                context.element
            );
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        return context.retry();
    }
}

/**
 * DismissOverlayStrategy - Dismiss blocking overlays
 */
class DismissOverlayStrategy extends RecoveryStrategy {
    constructor(options = {}) {
        super({
            name: 'dismissOverlay',
            description: 'Dismiss blocking overlays/modals',
            errorTypes: [ErrorType.ELEMENT_OBSCURED, ErrorType.ELEMENT_NOT_CLICKABLE, ErrorType.UNEXPECTED_DIALOG],
            priority: 45,
            ...options
        });
        
        this.overlaySelectors = options.overlaySelectors || [
            '.modal', '.overlay', '.popup', '.dialog',
            '[role="dialog"]', '[role="alertdialog"]'
        ];
        
        this.closeSelectors = options.closeSelectors || [
            '.close', '.dismiss', '[aria-label="close"]',
            'button[class*="close"]', '.modal-close'
        ];
    }

    async execute(context) {
        // Try to find and close overlay
        for (const overlaySelector of this.overlaySelectors) {
            try {
                const overlay = await context.driver?.findElement?.(overlaySelector);
                if (overlay) {
                    // Find close button
                    for (const closeSelector of this.closeSelectors) {
                        try {
                            const closeBtn = await overlay.findElement?.(closeSelector);
                            if (closeBtn) {
                                await closeBtn.click();
                                await new Promise(resolve => setTimeout(resolve, 500));
                                break;
                            }
                        } catch (e) {
                            // Try next selector
                        }
                    }
                    
                    // Try escape key
                    await context.driver?.sendKeys?.('Escape');
                }
            } catch (e) {
                // No overlay found
            }
        }
        
        return context.retry();
    }
}

/**
 * JavaScriptClickStrategy - Use JS to click
 */
class JavaScriptClickStrategy extends RecoveryStrategy {
    constructor(options = {}) {
        super({
            name: 'javascriptClick',
            description: 'Use JavaScript to perform click',
            errorTypes: [ErrorType.ELEMENT_NOT_CLICKABLE, ErrorType.ELEMENT_OBSCURED],
            priority: 50,
            ...options
        });
    }

    async execute(context) {
        if (context.element && context.driver?.executeScript) {
            await context.driver.executeScript(
                'arguments[0].click()',
                context.element
            );
            return { success: true, method: 'javascript_click' };
        }
        return context.retry();
    }
}

/**
 * NetworkRetryStrategy - Handle network errors
 */
class NetworkRetryStrategy extends RecoveryStrategy {
    constructor(options = {}) {
        super({
            name: 'networkRetry',
            description: 'Retry with network error handling',
            errorTypes: [ErrorType.NETWORK_ERROR, ErrorType.API_ERROR],
            priority: 25,
            maxAttempts: 5,
            ...options
        });
        
        this.baseDelay = options.baseDelay || 1000;
        this.maxDelay = options.maxDelay || 10000;
    }

    async execute(context) {
        const attempt = context.attempt || 1;
        const delay = Math.min(this.baseDelay * Math.pow(2, attempt - 1), this.maxDelay);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return context.retry();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOVERY ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RecoveryEngine - Orchestrates recovery strategies
 */
class RecoveryEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxRecoveryAttempts: options.maxRecoveryAttempts || 5,
            enableLearning: options.enableLearning !== false,
            ...options
        };
        
        this.strategies = [];
        this.history = [];
        this.successRates = new Map();
        
        // Register built-in strategies
        this._registerBuiltInStrategies();
    }

    /**
     * Register built-in strategies
     */
    _registerBuiltInStrategies() {
        this.registerStrategy(new RetryRecoveryStrategy());
        this.registerStrategy(new WaitAndRetryStrategy());
        this.registerStrategy(new RefreshRecoveryStrategy());
        this.registerStrategy(new AlternativeSelectorStrategy());
        this.registerStrategy(new ScrollIntoViewStrategy());
        this.registerStrategy(new DismissOverlayStrategy());
        this.registerStrategy(new JavaScriptClickStrategy());
        this.registerStrategy(new NetworkRetryStrategy());
    }

    /**
     * Register strategy
     */
    registerStrategy(strategy) {
        this.strategies.push(strategy);
        this.strategies.sort((a, b) => a.priority - b.priority);
        return this;
    }

    /**
     * Attempt recovery
     */
    async recover(error, context = {}) {
        const errorType = error.type || ErrorType.UNKNOWN;
        const applicableStrategies = this._getApplicableStrategies(errorType);
        
        this.emit('recovery:start', { error, strategies: applicableStrategies.length });
        
        let recoveryAttempt = 0;
        let lastResult = { success: false };
        
        for (const strategy of applicableStrategies) {
            if (recoveryAttempt >= this.options.maxRecoveryAttempts) {
                break;
            }
            
            recoveryAttempt++;
            
            const strategyContext = {
                ...context,
                error,
                attempt: recoveryAttempt,
                retry: context.retry || (() => ({ success: false }))
            };
            
            this.emit('strategy:start', {
                strategy: strategy.name,
                attempt: recoveryAttempt
            });
            
            try {
                const result = await strategy.execute(strategyContext);
                
                this._recordResult(strategy.name, errorType, result.success);
                
                if (result.success) {
                    this.emit('recovery:success', {
                        strategy: strategy.name,
                        attempts: recoveryAttempt
                    });
                    
                    return {
                        success: true,
                        strategy: strategy.name,
                        attempts: recoveryAttempt,
                        result
                    };
                }
                
                lastResult = result;
            } catch (recoveryError) {
                this._recordResult(strategy.name, errorType, false);
                
                this.emit('strategy:failed', {
                    strategy: strategy.name,
                    error: recoveryError
                });
            }
        }
        
        this.emit('recovery:failed', {
            attempts: recoveryAttempt,
            error
        });
        
        return {
            success: false,
            attempts: recoveryAttempt,
            result: lastResult
        };
    }

    /**
     * Get applicable strategies
     */
    _getApplicableStrategies(errorType) {
        let strategies = this.strategies.filter(s => s.appliesTo(errorType));
        
        // Sort by success rate if learning enabled
        if (this.options.enableLearning) {
            strategies = strategies.sort((a, b) => {
                const rateA = this._getSuccessRate(a.name, errorType);
                const rateB = this._getSuccessRate(b.name, errorType);
                return rateB - rateA;
            });
        }
        
        return strategies;
    }

    /**
     * Record result for learning
     */
    _recordResult(strategyName, errorType, success) {
        const key = `${strategyName}:${errorType}`;
        
        if (!this.successRates.has(key)) {
            this.successRates.set(key, { successes: 0, total: 0 });
        }
        
        const record = this.successRates.get(key);
        record.total++;
        if (success) record.successes++;
        
        // Also add to history
        this.history.push({
            strategy: strategyName,
            errorType,
            success,
            timestamp: Date.now()
        });
        
        // Trim history
        if (this.history.length > 1000) {
            this.history = this.history.slice(-500);
        }
    }

    /**
     * Get success rate
     */
    _getSuccessRate(strategyName, errorType) {
        const key = `${strategyName}:${errorType}`;
        const record = this.successRates.get(key);
        
        if (!record || record.total === 0) {
            return 0.5; // Default rate for unknown
        }
        
        return record.successes / record.total;
    }

    /**
     * Get statistics
     */
    getStats() {
        const stats = {
            strategies: this.strategies.map(s => ({
                name: s.name,
                priority: s.priority,
                errorTypes: s.errorTypes
            })),
            successRates: {},
            recentHistory: this.history.slice(-20)
        };
        
        for (const [key, record] of this.successRates) {
            stats.successRates[key] = {
                rate: record.total > 0 ? record.successes / record.total : 0,
                total: record.total
            };
        }
        
        return stats;
    }

    /**
     * Reset learning
     */
    resetLearning() {
        this.successRates.clear();
        this.history = [];
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALING CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * HealingContext - Wraps operations with recovery
 */
class HealingContext {
    constructor(engine, options = {}) {
        this.engine = engine;
        this.options = options;
        this.errorDetector = options.errorDetector || null;
    }

    /**
     * Execute with recovery
     */
    async execute(operation, context = {}) {
        let lastError = null;
        let attempts = 0;
        
        const retry = async () => {
            attempts++;
            try {
                return { success: true, result: await operation() };
            } catch (error) {
                lastError = error;
                return { success: false, error };
            }
        };
        
        // First attempt
        const firstResult = await retry();
        if (firstResult.success) {
            return firstResult.result;
        }
        
        // Detect and recover
        const detectedError = this.errorDetector ?
            this.errorDetector.detect(lastError) :
            { type: ErrorType.UNKNOWN, original: lastError };
        
        const recoveryResult = await this.engine.recover(detectedError, {
            ...context,
            retry
        });
        
        if (recoveryResult.success) {
            return recoveryResult.result.result;
        }
        
        throw lastError;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine = null;

module.exports = {
    // Classes
    RecoveryStrategy,
    RecoveryEngine,
    HealingContext,
    
    // Built-in strategies
    RetryRecoveryStrategy,
    RefreshRecoveryStrategy,
    WaitAndRetryStrategy,
    AlternativeSelectorStrategy,
    ScrollIntoViewStrategy,
    DismissOverlayStrategy,
    JavaScriptClickStrategy,
    NetworkRetryStrategy,
    
    // Singleton
    getRecoveryEngine: (options = {}) => {
        if (!defaultEngine) {
            defaultEngine = new RecoveryEngine(options);
        }
        return defaultEngine;
    },
    
    // Factory
    createRecoveryEngine: (options = {}) => new RecoveryEngine(options),
    createHealingContext: (engine, options = {}) => new HealingContext(engine, options)
};

console.log('✅ Step 18/50: Recovery Engine loaded');
