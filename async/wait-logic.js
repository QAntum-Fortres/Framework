/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 15/50: Explicit Wait Logic                         ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Intelligent async waiting and synchronization
 * @phase 1 - Enterprise Foundation
 * @step 15 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// WAIT CONDITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Condition - Base condition class
 */
class Condition {
    constructor(name, checkFn) {
        this.name = name;
        this.check = checkFn;
    }

    async evaluate(context) {
        return this.check(context);
    }
}

/**
 * Built-in conditions
 */
const Conditions = {
    /**
     * Element visible
     */
    visible: (element) => new Condition('visible', async (ctx) => {
        if (typeof element === 'function') {
            return await element(ctx);
        }
        return element?.visible !== false;
    }),

    /**
     * Element exists
     */
    exists: (element) => new Condition('exists', async (ctx) => {
        if (typeof element === 'function') {
            return await element(ctx) !== null;
        }
        return element !== null && element !== undefined;
    }),

    /**
     * Element enabled
     */
    enabled: (element) => new Condition('enabled', async (ctx) => {
        if (typeof element === 'function') {
            const el = await element(ctx);
            return el?.enabled !== false;
        }
        return element?.enabled !== false;
    }),

    /**
     * Element clickable
     */
    clickable: (element) => new Condition('clickable', async (ctx) => {
        const visible = await Conditions.visible(element).evaluate(ctx);
        const enabled = await Conditions.enabled(element).evaluate(ctx);
        return visible && enabled;
    }),

    /**
     * Text contains
     */
    textContains: (element, text) => new Condition('textContains', async (ctx) => {
        const el = typeof element === 'function' ? await element(ctx) : element;
        const elText = el?.text || el?.textContent || '';
        return elText.includes(text);
    }),

    /**
     * Text matches
     */
    textMatches: (element, pattern) => new Condition('textMatches', async (ctx) => {
        const el = typeof element === 'function' ? await element(ctx) : element;
        const text = el?.text || el?.textContent || '';
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        return regex.test(text);
    }),

    /**
     * Attribute equals
     */
    attributeEquals: (element, attr, value) => new Condition('attributeEquals', async (ctx) => {
        const el = typeof element === 'function' ? await element(ctx) : element;
        return el?.getAttribute?.(attr) === value || el?.[attr] === value;
    }),

    /**
     * URL contains
     */
    urlContains: (substring) => new Condition('urlContains', async (ctx) => {
        const url = ctx.url || ctx.currentUrl || '';
        return url.includes(substring);
    }),

    /**
     * URL matches
     */
    urlMatches: (pattern) => new Condition('urlMatches', async (ctx) => {
        const url = ctx.url || ctx.currentUrl || '';
        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        return regex.test(url);
    }),

    /**
     * Title contains
     */
    titleContains: (text) => new Condition('titleContains', async (ctx) => {
        const title = ctx.title || '';
        return title.includes(text);
    }),

    /**
     * Number of elements
     */
    numberOfElements: (elements, count, comparator = '==') => new Condition('numberOfElements', async (ctx) => {
        const els = typeof elements === 'function' ? await elements(ctx) : elements;
        const len = Array.isArray(els) ? els.length : 0;
        
        switch (comparator) {
            case '==': return len === count;
            case '>': return len > count;
            case '<': return len < count;
            case '>=': return len >= count;
            case '<=': return len <= count;
            default: return len === count;
        }
    }),

    /**
     * Loading complete
     */
    loadingComplete: () => new Condition('loadingComplete', async (ctx) => {
        return ctx.readyState === 'complete' || ctx.loaded === true;
    }),

    /**
     * Network idle
     */
    networkIdle: (maxConnections = 0, timeout = 500) => new Condition('networkIdle', async (ctx) => {
        const connections = ctx.activeConnections || 0;
        return connections <= maxConnections;
    }),

    /**
     * Animation complete
     */
    animationComplete: (element) => new Condition('animationComplete', async (ctx) => {
        const el = typeof element === 'function' ? await element(ctx) : element;
        return el?.animating !== true;
    }),

    /**
     * Custom condition
     */
    custom: (name, checkFn) => new Condition(name, checkFn),

    /**
     * Combine conditions (AND)
     */
    and: (...conditions) => new Condition('and', async (ctx) => {
        for (const condition of conditions) {
            if (!await condition.evaluate(ctx)) {
                return false;
            }
        }
        return true;
    }),

    /**
     * Combine conditions (OR)
     */
    or: (...conditions) => new Condition('or', async (ctx) => {
        for (const condition of conditions) {
            if (await condition.evaluate(ctx)) {
                return true;
            }
        }
        return false;
    }),

    /**
     * Negate condition
     */
    not: (condition) => new Condition('not', async (ctx) => {
        return !await condition.evaluate(ctx);
    })
};

// ═══════════════════════════════════════════════════════════════════════════════
// WAIT ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WaitEngine - Core wait functionality
 */
class WaitEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            defaultTimeout: options.defaultTimeout || 30000,
            pollingInterval: options.pollingInterval || 100,
            throwOnTimeout: options.throwOnTimeout !== false,
            ...options
        };
        
        this.stats = {
            waits: 0,
            successes: 0,
            timeouts: 0,
            totalWaitTime: 0
        };
    }

    /**
     * Wait for condition
     */
    async waitFor(condition, options = {}) {
        const timeout = options.timeout || this.options.defaultTimeout;
        const interval = options.interval || this.options.pollingInterval;
        const message = options.message || `Condition: ${condition.name}`;
        
        const startTime = Date.now();
        this.stats.waits++;
        
        this.emit('wait:start', { condition: condition.name, timeout });
        
        const context = options.context || {};
        
        while (Date.now() - startTime < timeout) {
            try {
                const result = await condition.evaluate(context);
                
                if (result) {
                    const elapsed = Date.now() - startTime;
                    this.stats.successes++;
                    this.stats.totalWaitTime += elapsed;
                    
                    this.emit('wait:success', {
                        condition: condition.name,
                        elapsed
                    });
                    
                    return { success: true, result, elapsed };
                }
            } catch (error) {
                // Condition threw - continue polling
            }
            
            await this._sleep(interval);
        }
        
        // Timeout
        const elapsed = Date.now() - startTime;
        this.stats.timeouts++;
        this.stats.totalWaitTime += elapsed;
        
        this.emit('wait:timeout', {
            condition: condition.name,
            timeout
        });
        
        if (this.options.throwOnTimeout) {
            throw new Error(`Wait timeout: ${message} (${timeout}ms)`);
        }
        
        return { success: false, elapsed, timeout: true };
    }

    /**
     * Wait for multiple conditions (all)
     */
    async waitForAll(conditions, options = {}) {
        const combined = Conditions.and(...conditions);
        return this.waitFor(combined, options);
    }

    /**
     * Wait for any condition
     */
    async waitForAny(conditions, options = {}) {
        const combined = Conditions.or(...conditions);
        return this.waitFor(combined, options);
    }

    /**
     * Wait for element
     */
    async waitForElement(element, options = {}) {
        return this.waitFor(Conditions.exists(element), {
            message: 'Element to exist',
            ...options
        });
    }

    /**
     * Wait for element visible
     */
    async waitForVisible(element, options = {}) {
        return this.waitFor(Conditions.visible(element), {
            message: 'Element to be visible',
            ...options
        });
    }

    /**
     * Wait for element clickable
     */
    async waitForClickable(element, options = {}) {
        return this.waitFor(Conditions.clickable(element), {
            message: 'Element to be clickable',
            ...options
        });
    }

    /**
     * Wait for text
     */
    async waitForText(element, text, options = {}) {
        return this.waitFor(Conditions.textContains(element, text), {
            message: `Text "${text}" to appear`,
            ...options
        });
    }

    /**
     * Wait for URL
     */
    async waitForUrl(pattern, options = {}) {
        const condition = typeof pattern === 'string' ?
            Conditions.urlContains(pattern) :
            Conditions.urlMatches(pattern);
        
        return this.waitFor(condition, {
            message: `URL to match ${pattern}`,
            ...options
        });
    }

    /**
     * Wait for loading
     */
    async waitForLoading(options = {}) {
        return this.waitFor(Conditions.loadingComplete(), {
            message: 'Page to finish loading',
            ...options
        });
    }

    /**
     * Wait for network idle
     */
    async waitForNetworkIdle(maxConnections = 0, options = {}) {
        return this.waitFor(Conditions.networkIdle(maxConnections), {
            message: 'Network to be idle',
            ...options
        });
    }

    /**
     * Wait with exponential backoff
     */
    async waitWithBackoff(condition, options = {}) {
        const maxAttempts = options.maxAttempts || 5;
        const baseDelay = options.baseDelay || 100;
        const maxDelay = options.maxDelay || 10000;
        
        let delay = baseDelay;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const result = await condition.evaluate(options.context || {});
                
                if (result) {
                    return { success: true, attempts: attempt };
                }
            } catch (error) {
                // Continue
            }
            
            this.emit('wait:backoff', { attempt, delay });
            
            await this._sleep(delay);
            delay = Math.min(delay * 2, maxDelay);
        }
        
        if (this.options.throwOnTimeout) {
            throw new Error(`Wait failed after ${maxAttempts} attempts`);
        }
        
        return { success: false, attempts: maxAttempts };
    }

    /**
     * Wait until stable (no changes)
     */
    async waitUntilStable(getValue, options = {}) {
        const stableTime = options.stableTime || 1000;
        const timeout = options.timeout || this.options.defaultTimeout;
        const interval = options.interval || 100;
        
        const startTime = Date.now();
        let lastValue = await getValue();
        let stableSince = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const currentValue = await getValue();
            
            if (JSON.stringify(currentValue) !== JSON.stringify(lastValue)) {
                lastValue = currentValue;
                stableSince = Date.now();
            }
            
            if (Date.now() - stableSince >= stableTime) {
                return { success: true, value: lastValue };
            }
            
            await this._sleep(interval);
        }
        
        if (this.options.throwOnTimeout) {
            throw new Error('Value did not stabilize');
        }
        
        return { success: false, value: lastValue };
    }

    /**
     * Fixed delay
     */
    async sleep(ms) {
        return this._sleep(ms);
    }

    /**
     * Internal sleep
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.waits > 0 ? 
                this.stats.successes / this.stats.waits : 0,
            avgWaitTime: this.stats.waits > 0 ?
                this.stats.totalWaitTime / this.stats.waits : 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FLUENT WAIT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FluentWait - Fluent interface for waiting
 */
class FluentWait {
    constructor(engine) {
        this.engine = engine;
        this._timeout = null;
        this._interval = null;
        this._message = null;
        this._ignoring = [];
        this._context = {};
    }

    /**
     * Set timeout
     */
    withTimeout(ms) {
        this._timeout = ms;
        return this;
    }

    /**
     * Set polling interval
     */
    pollingEvery(ms) {
        this._interval = ms;
        return this;
    }

    /**
     * Set message
     */
    withMessage(message) {
        this._message = message;
        return this;
    }

    /**
     * Set context
     */
    withContext(context) {
        this._context = context;
        return this;
    }

    /**
     * Ignore exceptions
     */
    ignoring(...exceptions) {
        this._ignoring = exceptions;
        return this;
    }

    /**
     * Wait until condition
     */
    async until(condition) {
        return this.engine.waitFor(condition, {
            timeout: this._timeout,
            interval: this._interval,
            message: this._message,
            context: this._context
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAIT FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create wait engine
 */
function createWait(options = {}) {
    const engine = new WaitEngine(options);
    
    // Add fluent interface
    engine.fluent = () => new FluentWait(engine);
    
    return engine;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine = null;

module.exports = {
    // Classes
    Condition,
    WaitEngine,
    FluentWait,
    
    // Conditions
    Conditions,
    
    // Shortcuts
    visible: Conditions.visible,
    exists: Conditions.exists,
    enabled: Conditions.enabled,
    clickable: Conditions.clickable,
    textContains: Conditions.textContains,
    urlContains: Conditions.urlContains,
    
    // Factory
    createWait,
    
    // Default engine
    getWaitEngine: (options = {}) => {
        if (!defaultEngine) {
            defaultEngine = createWait(options);
        }
        return defaultEngine;
    }
};

console.log('✅ Step 15/50: Explicit Wait Logic loaded');
