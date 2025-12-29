/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 16/50: Timeout Manager                             ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Advanced timeout management with retry strategies
 * @phase 1 - Enterprise Foundation
 * @step 16 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEOUT PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TimeoutProfile - Predefined timeout configurations
 */
const TimeoutProfiles = {
    INSTANT: {
        name: 'instant',
        timeout: 1000,
        retries: 0,
        description: 'Immediate operations'
    },
    
    SHORT: {
        name: 'short',
        timeout: 5000,
        retries: 1,
        description: 'Quick operations'
    },
    
    MEDIUM: {
        name: 'medium',
        timeout: 15000,
        retries: 2,
        description: 'Standard operations'
    },
    
    LONG: {
        name: 'long',
        timeout: 30000,
        retries: 3,
        description: 'Extended operations'
    },
    
    VERY_LONG: {
        name: 'veryLong',
        timeout: 60000,
        retries: 3,
        description: 'Long-running operations'
    },
    
    INFINITE: {
        name: 'infinite',
        timeout: 0,
        retries: 0,
        description: 'No timeout'
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// RETRY STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RetryStrategy - Base retry strategy
 */
class RetryStrategy {
    constructor(name, options = {}) {
        this.name = name;
        this.maxRetries = options.maxRetries || 3;
        this.baseDelay = options.baseDelay || 1000;
    }

    getDelay(attempt) {
        return this.baseDelay;
    }

    shouldRetry(attempt, error) {
        return attempt < this.maxRetries;
    }
}

/**
 * FixedRetryStrategy - Fixed delay between retries
 */
class FixedRetryStrategy extends RetryStrategy {
    constructor(options = {}) {
        super('fixed', options);
        this.delay = options.delay || 1000;
    }

    getDelay(attempt) {
        return this.delay;
    }
}

/**
 * ExponentialRetryStrategy - Exponential backoff
 */
class ExponentialRetryStrategy extends RetryStrategy {
    constructor(options = {}) {
        super('exponential', options);
        this.multiplier = options.multiplier || 2;
        this.maxDelay = options.maxDelay || 30000;
    }

    getDelay(attempt) {
        const delay = this.baseDelay * Math.pow(this.multiplier, attempt - 1);
        return Math.min(delay, this.maxDelay);
    }
}

/**
 * LinearRetryStrategy - Linear increase in delay
 */
class LinearRetryStrategy extends RetryStrategy {
    constructor(options = {}) {
        super('linear', options);
        this.increment = options.increment || 1000;
    }

    getDelay(attempt) {
        return this.baseDelay + (this.increment * (attempt - 1));
    }
}

/**
 * JitterRetryStrategy - Adds randomness to prevent thundering herd
 */
class JitterRetryStrategy extends RetryStrategy {
    constructor(options = {}) {
        super('jitter', options);
        this.inner = options.inner || new ExponentialRetryStrategy(options);
        this.jitterFactor = options.jitterFactor || 0.3;
    }

    getDelay(attempt) {
        const baseDelay = this.inner.getDelay(attempt);
        const jitter = baseDelay * this.jitterFactor * Math.random();
        return Math.floor(baseDelay + jitter);
    }
}

/**
 * SmartRetryStrategy - Adapts based on error type
 */
class SmartRetryStrategy extends RetryStrategy {
    constructor(options = {}) {
        super('smart', options);
        
        this.errorStrategies = options.errorStrategies || {
            'network': new ExponentialRetryStrategy({ maxRetries: 5 }),
            'timeout': new LinearRetryStrategy({ maxRetries: 3 }),
            'server': new JitterRetryStrategy({ maxRetries: 4 }),
            'default': new FixedRetryStrategy({ maxRetries: 2 })
        };
    }

    getStrategyForError(error) {
        const errorType = this._classifyError(error);
        return this.errorStrategies[errorType] || this.errorStrategies.default;
    }

    getDelay(attempt, error) {
        const strategy = this.getStrategyForError(error);
        return strategy.getDelay(attempt);
    }

    shouldRetry(attempt, error) {
        const strategy = this.getStrategyForError(error);
        return strategy.shouldRetry(attempt, error);
    }

    _classifyError(error) {
        if (!error) return 'default';
        
        const message = error.message?.toLowerCase() || '';
        const code = error.code?.toLowerCase() || '';
        
        if (code.includes('network') || message.includes('network') || 
            code === 'econnreset' || code === 'econnrefused') {
            return 'network';
        }
        
        if (code.includes('timeout') || message.includes('timeout')) {
            return 'timeout';
        }
        
        if (error.status >= 500 || message.includes('server')) {
            return 'server';
        }
        
        return 'default';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEOUT HANDLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TimeoutHandle - Manages a single timeout
 */
class TimeoutHandle {
    constructor(id, timeout, callback, options = {}) {
        this.id = id;
        this.timeout = timeout;
        this.callback = callback;
        this.options = options;
        
        this.startedAt = null;
        this.timer = null;
        this.cancelled = false;
        this.completed = false;
        this.timedOut = false;
    }

    /**
     * Start timeout
     */
    start() {
        if (this.timeout <= 0) return this; // No timeout
        
        this.startedAt = Date.now();
        
        this.timer = setTimeout(() => {
            this.timedOut = true;
            if (this.callback) {
                this.callback(this);
            }
        }, this.timeout);

        return this;
    }

    /**
     * Cancel timeout
     */
    cancel() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.cancelled = true;
        return this;
    }

    /**
     * Complete (clear timeout)
     */
    complete() {
        this.cancel();
        this.completed = true;
        return this;
    }

    /**
     * Get remaining time
     */
    getRemainingTime() {
        if (!this.startedAt || this.timeout <= 0) return Infinity;
        const elapsed = Date.now() - this.startedAt;
        return Math.max(0, this.timeout - elapsed);
    }

    /**
     * Get elapsed time
     */
    getElapsedTime() {
        if (!this.startedAt) return 0;
        return Date.now() - this.startedAt;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEOUT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TimeoutManager - Central timeout management
 */
class TimeoutManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            defaultTimeout: options.defaultTimeout || 30000,
            defaultRetries: options.defaultRetries || 3,
            defaultStrategy: options.defaultStrategy || 'exponential',
            ...options
        };
        
        this.handles = new Map();
        this.nextId = 1;
        
        this.stats = {
            created: 0,
            completed: 0,
            timedOut: 0,
            cancelled: 0,
            retried: 0
        };
    }

    /**
     * Create timeout
     */
    create(timeout, callback, options = {}) {
        const id = options.id || `timeout_${this.nextId++}`;
        
        const handle = new TimeoutHandle(id, timeout, (handle) => {
            this.stats.timedOut++;
            this.emit('timeout', { id, handle });
            
            if (callback) {
                callback(handle);
            }
        }, options);
        
        this.handles.set(id, handle);
        this.stats.created++;
        
        this.emit('create', { id, timeout });
        
        return handle.start();
    }

    /**
     * Cancel timeout
     */
    cancel(id) {
        const handle = this.handles.get(id);
        if (handle) {
            handle.cancel();
            this.stats.cancelled++;
            this.emit('cancel', { id });
        }
        return this;
    }

    /**
     * Complete timeout
     */
    complete(id) {
        const handle = this.handles.get(id);
        if (handle) {
            handle.complete();
            this.stats.completed++;
            this.emit('complete', { id });
        }
        return this;
    }

    /**
     * Cancel all timeouts
     */
    cancelAll() {
        for (const [id, handle] of this.handles) {
            handle.cancel();
        }
        this.handles.clear();
        return this;
    }

    /**
     * Execute with timeout
     */
    async executeWithTimeout(fn, timeout, options = {}) {
        const timeoutMs = timeout || this.options.defaultTimeout;
        const id = options.id || `exec_${this.nextId++}`;
        
        if (timeoutMs <= 0) {
            // No timeout
            return fn();
        }
        
        return new Promise((resolve, reject) => {
            let completed = false;
            
            const handle = this.create(timeoutMs, () => {
                if (!completed) {
                    completed = true;
                    reject(new Error(`Timeout: ${id} (${timeoutMs}ms)`));
                }
            }, { id });
            
            Promise.resolve(fn())
                .then(result => {
                    if (!completed) {
                        completed = true;
                        handle.complete();
                        resolve(result);
                    }
                })
                .catch(error => {
                    if (!completed) {
                        completed = true;
                        handle.cancel();
                        reject(error);
                    }
                });
        });
    }

    /**
     * Execute with retry
     */
    async executeWithRetry(fn, options = {}) {
        const strategy = this._getStrategy(options.strategy);
        const timeout = options.timeout || this.options.defaultTimeout;
        
        let lastError;
        let attempt = 0;
        
        while (attempt <= strategy.maxRetries) {
            attempt++;
            
            try {
                this.emit('attempt', { attempt, maxRetries: strategy.maxRetries });
                
                const result = await this.executeWithTimeout(fn, timeout, {
                    id: `${options.id || 'retry'}_attempt_${attempt}`
                });
                
                return { success: true, result, attempts: attempt };
            } catch (error) {
                lastError = error;
                
                if (!strategy.shouldRetry(attempt, error)) {
                    break;
                }
                
                const delay = strategy.getDelay(attempt, error);
                this.stats.retried++;
                
                this.emit('retry', { attempt, delay, error });
                
                await this._sleep(delay);
            }
        }
        
        this.emit('failed', { attempts: attempt, error: lastError });
        
        return {
            success: false,
            error: lastError,
            attempts: attempt
        };
    }

    /**
     * Get retry strategy
     */
    _getStrategy(strategy) {
        if (strategy instanceof RetryStrategy) {
            return strategy;
        }
        
        switch (strategy) {
            case 'fixed':
                return new FixedRetryStrategy({ maxRetries: this.options.defaultRetries });
            case 'linear':
                return new LinearRetryStrategy({ maxRetries: this.options.defaultRetries });
            case 'exponential':
                return new ExponentialRetryStrategy({ maxRetries: this.options.defaultRetries });
            case 'jitter':
                return new JitterRetryStrategy({ maxRetries: this.options.defaultRetries });
            case 'smart':
                return new SmartRetryStrategy({ maxRetries: this.options.defaultRetries });
            default:
                return new ExponentialRetryStrategy({ maxRetries: this.options.defaultRetries });
        }
    }

    /**
     * Sleep helper
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
            active: this.handles.size,
            successRate: this.stats.created > 0 ?
                this.stats.completed / this.stats.created : 0
        };
    }

    /**
     * Cleanup completed handles
     */
    cleanup() {
        for (const [id, handle] of this.handles) {
            if (handle.completed || handle.cancelled || handle.timedOut) {
                this.handles.delete(id);
            }
        }
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Timeout decorator
 */
function withTimeout(timeout, options = {}) {
    const manager = getTimeoutManager();
    
    return function(target, propertyKey, descriptor) {
        const original = descriptor.value;
        
        descriptor.value = async function(...args) {
            return manager.executeWithTimeout(
                () => original.apply(this, args),
                timeout,
                options
            );
        };
        
        return descriptor;
    };
}

/**
 * Retry decorator
 */
function withRetry(options = {}) {
    const manager = getTimeoutManager();
    
    return function(target, propertyKey, descriptor) {
        const original = descriptor.value;
        
        descriptor.value = async function(...args) {
            const result = await manager.executeWithRetry(
                () => original.apply(this, args),
                options
            );
            
            if (!result.success) {
                throw result.error;
            }
            
            return result.result;
        };
        
        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultManager = null;

function getTimeoutManager(options = {}) {
    if (!defaultManager) {
        defaultManager = new TimeoutManager(options);
    }
    return defaultManager;
}

module.exports = {
    // Classes
    TimeoutHandle,
    TimeoutManager,
    
    // Strategies
    RetryStrategy,
    FixedRetryStrategy,
    ExponentialRetryStrategy,
    LinearRetryStrategy,
    JitterRetryStrategy,
    SmartRetryStrategy,
    
    // Profiles
    TimeoutProfiles,
    
    // Decorators
    withTimeout,
    withRetry,
    
    // Factory
    getTimeoutManager,
    
    // Create new manager
    createTimeoutManager: (options) => new TimeoutManager(options)
};

console.log('✅ Step 16/50: Timeout Manager loaded');
