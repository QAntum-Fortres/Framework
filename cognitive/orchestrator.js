/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 12/50: API Orchestrator                            ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Orchestrate multiple AI/API calls with smart routing
 * @phase 1 - Enterprise Foundation
 * @step 12 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RequestQueue - Priority queue for API requests
 */
class RequestQueue extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxConcurrent: options.maxConcurrent || 5,
            rateLimit: options.rateLimit || 60, // requests per minute
            retryAttempts: options.retryAttempts || 3,
            ...options
        };
        
        this.queue = [];
        this.active = 0;
        this.processed = 0;
        this.lastMinuteRequests = [];
    }

    /**
     * Add request to queue
     */
    enqueue(request, priority = 0) {
        const queueItem = {
            id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            request,
            priority,
            attempts: 0,
            enqueuedAt: Date.now(),
            status: 'queued'
        };
        
        this.queue.push(queueItem);
        this.queue.sort((a, b) => b.priority - a.priority);
        
        this.emit('enqueued', { id: queueItem.id, priority });
        
        this._processQueue();
        
        return new Promise((resolve, reject) => {
            queueItem.resolve = resolve;
            queueItem.reject = reject;
        });
    }

    /**
     * Process queue
     */
    async _processQueue() {
        if (this.active >= this.options.maxConcurrent) {
            return;
        }
        
        if (!this._checkRateLimit()) {
            setTimeout(() => this._processQueue(), 1000);
            return;
        }
        
        const item = this.queue.find(i => i.status === 'queued');
        if (!item) return;
        
        item.status = 'processing';
        this.active++;
        
        try {
            this.lastMinuteRequests.push(Date.now());
            
            const result = await item.request();
            
            item.status = 'completed';
            this.processed++;
            
            this.emit('completed', { id: item.id });
            item.resolve(result);
            
        } catch (error) {
            item.attempts++;
            
            if (item.attempts < this.options.retryAttempts) {
                item.status = 'queued';
                this.emit('retry', { id: item.id, attempt: item.attempts });
            } else {
                item.status = 'failed';
                this.emit('failed', { id: item.id, error: error.message });
                item.reject(error);
            }
        } finally {
            this.active--;
            this._removeOldRequests();
        }
        
        // Remove completed/failed items
        this.queue = this.queue.filter(i => !['completed', 'failed'].includes(i.status));
        
        // Continue processing
        if (this.queue.length > 0) {
            setImmediate(() => this._processQueue());
        }
    }

    /**
     * Check rate limit
     */
    _checkRateLimit() {
        const oneMinuteAgo = Date.now() - 60000;
        this.lastMinuteRequests = this.lastMinuteRequests.filter(t => t > oneMinuteAgo);
        return this.lastMinuteRequests.length < this.options.rateLimit;
    }

    /**
     * Remove old requests from tracking
     */
    _removeOldRequests() {
        const oneMinuteAgo = Date.now() - 60000;
        this.lastMinuteRequests = this.lastMinuteRequests.filter(t => t > oneMinuteAgo);
    }

    /**
     * Get queue stats
     */
    getStats() {
        return {
            queued: this.queue.filter(i => i.status === 'queued').length,
            active: this.active,
            processed: this.processed,
            rateUsage: this.lastMinuteRequests.length / this.options.rateLimit
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD BALANCER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LoadBalancer - Balance load across providers
 */
class LoadBalancer extends EventEmitter {
    constructor() {
        super();
        
        this.providers = new Map();
        this.strategy = 'round-robin';
        this.currentIndex = 0;
    }

    /**
     * Register provider
     */
    register(name, config) {
        this.providers.set(name, {
            name,
            weight: config.weight || 1,
            maxRPS: config.maxRPS || 60,
            currentLoad: 0,
            totalRequests: 0,
            errors: 0,
            healthy: true,
            lastUsed: 0,
            ...config
        });
        
        return this;
    }

    /**
     * Set balancing strategy
     */
    setStrategy(strategy) {
        const valid = ['round-robin', 'least-connections', 'weighted', 'random'];
        if (!valid.includes(strategy)) {
            throw new Error(`Invalid strategy: ${strategy}`);
        }
        this.strategy = strategy;
        return this;
    }

    /**
     * Get next provider
     */
    getNext() {
        const healthyProviders = Array.from(this.providers.values())
            .filter(p => p.healthy);
        
        if (healthyProviders.length === 0) {
            throw new Error('No healthy providers available');
        }
        
        switch (this.strategy) {
            case 'round-robin':
                return this._roundRobin(healthyProviders);
            case 'least-connections':
                return this._leastConnections(healthyProviders);
            case 'weighted':
                return this._weighted(healthyProviders);
            case 'random':
                return this._random(healthyProviders);
            default:
                return healthyProviders[0];
        }
    }

    /**
     * Round-robin selection
     */
    _roundRobin(providers) {
        const provider = providers[this.currentIndex % providers.length];
        this.currentIndex++;
        return provider;
    }

    /**
     * Least connections selection
     */
    _leastConnections(providers) {
        return providers.reduce((min, p) => 
            p.currentLoad < min.currentLoad ? p : min
        );
    }

    /**
     * Weighted selection
     */
    _weighted(providers) {
        const totalWeight = providers.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const provider of providers) {
            random -= provider.weight;
            if (random <= 0) return provider;
        }
        
        return providers[0];
    }

    /**
     * Random selection
     */
    _random(providers) {
        return providers[Math.floor(Math.random() * providers.length)];
    }

    /**
     * Mark request start
     */
    startRequest(providerName) {
        const provider = this.providers.get(providerName);
        if (provider) {
            provider.currentLoad++;
            provider.totalRequests++;
            provider.lastUsed = Date.now();
        }
    }

    /**
     * Mark request end
     */
    endRequest(providerName, success = true) {
        const provider = this.providers.get(providerName);
        if (provider) {
            provider.currentLoad = Math.max(0, provider.currentLoad - 1);
            if (!success) {
                provider.errors++;
                this._checkHealth(provider);
            }
        }
    }

    /**
     * Check provider health
     */
    _checkHealth(provider) {
        // Mark unhealthy if error rate > 50% in last 10 requests
        if (provider.totalRequests >= 10) {
            const errorRate = provider.errors / provider.totalRequests;
            provider.healthy = errorRate < 0.5;
            
            if (!provider.healthy) {
                this.emit('unhealthy', { provider: provider.name, errorRate });
                
                // Schedule health check
                setTimeout(() => {
                    provider.healthy = true;
                    provider.errors = 0;
                    provider.totalRequests = 0;
                    this.emit('recovered', { provider: provider.name });
                }, 30000);
            }
        }
    }

    /**
     * Get stats
     */
    getStats() {
        const stats = {};
        
        for (const [name, provider] of this.providers) {
            stats[name] = {
                healthy: provider.healthy,
                currentLoad: provider.currentLoad,
                totalRequests: provider.totalRequests,
                errorRate: provider.totalRequests > 0 ? 
                    provider.errors / provider.totalRequests : 0
            };
        }
        
        return stats;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CircuitBreaker - Prevent cascade failures
 */
class CircuitBreaker extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            failureThreshold: options.failureThreshold || 5,
            successThreshold: options.successThreshold || 2,
            timeout: options.timeout || 30000,
            ...options
        };
        
        this.state = 'closed'; // closed, open, half-open
        this.failures = 0;
        this.successes = 0;
        this.lastFailure = null;
        this.nextRetry = null;
    }

    /**
     * Execute through circuit breaker
     */
    async execute(fn) {
        if (this.state === 'open') {
            if (Date.now() < this.nextRetry) {
                throw new Error('Circuit breaker is OPEN');
            }
            
            // Try half-open
            this.state = 'half-open';
            this.emit('half-open');
        }
        
        try {
            const result = await fn();
            this._onSuccess();
            return result;
        } catch (error) {
            this._onFailure(error);
            throw error;
        }
    }

    /**
     * Handle success
     */
    _onSuccess() {
        this.failures = 0;
        
        if (this.state === 'half-open') {
            this.successes++;
            
            if (this.successes >= this.options.successThreshold) {
                this.state = 'closed';
                this.successes = 0;
                this.emit('closed');
            }
        }
    }

    /**
     * Handle failure
     */
    _onFailure(error) {
        this.failures++;
        this.lastFailure = Date.now();
        
        if (this.state === 'half-open') {
            this._open();
        } else if (this.failures >= this.options.failureThreshold) {
            this._open();
        }
        
        this.emit('failure', { error: error.message, failures: this.failures });
    }

    /**
     * Open circuit
     */
    _open() {
        this.state = 'open';
        this.nextRetry = Date.now() + this.options.timeout;
        this.successes = 0;
        this.emit('open');
    }

    /**
     * Force reset
     */
    reset() {
        this.state = 'closed';
        this.failures = 0;
        this.successes = 0;
        this.emit('reset');
    }

    /**
     * Get state
     */
    getState() {
        return {
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailure: this.lastFailure,
            nextRetry: this.nextRetry
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE CACHE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ResponseCache - Cache API responses
 */
class ResponseCache extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxSize: options.maxSize || 1000,
            defaultTTL: options.defaultTTL || 3600000, // 1 hour
            ...options
        };
        
        this.cache = new Map();
        this.stats = { hits: 0, misses: 0 };
    }

    /**
     * Generate cache key
     */
    _generateKey(request) {
        const hash = require('crypto')
            .createHash('md5')
            .update(JSON.stringify(request))
            .digest('hex');
        return hash;
    }

    /**
     * Get from cache
     */
    get(request) {
        const key = this._generateKey(request);
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            this.stats.misses++;
            return null;
        }
        
        this.stats.hits++;
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        
        this.emit('hit', { key });
        
        return entry.data;
    }

    /**
     * Set in cache
     */
    set(request, data, ttl = null) {
        const key = this._generateKey(request);
        const actualTTL = ttl || this.options.defaultTTL;
        
        // Evict if at capacity
        if (this.cache.size >= this.options.maxSize) {
            this._evict();
        }
        
        this.cache.set(key, {
            data,
            createdAt: Date.now(),
            expiresAt: Date.now() + actualTTL,
            lastAccessed: Date.now(),
            accessCount: 0
        });
        
        this.emit('set', { key });
    }

    /**
     * Evict least recently used entries
     */
    _evict() {
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        // Remove oldest 10%
        const toRemove = Math.ceil(this.cache.size * 0.1);
        
        for (let i = 0; i < toRemove; i++) {
            this.cache.delete(entries[i][0]);
        }
        
        this.emit('evicted', { count: toRemove });
    }

    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
        this.emit('cleared');
    }

    /**
     * Get stats
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        
        return {
            ...this.stats,
            hitRate: total > 0 ? this.stats.hits / total : 0,
            size: this.cache.size,
            maxSize: this.options.maxSize
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * APIOrchestrator - Main orchestration class
 */
class APIOrchestrator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.queue = new RequestQueue(options.queue);
        this.loadBalancer = new LoadBalancer();
        this.cache = new ResponseCache(options.cache);
        this.circuitBreakers = new Map();
        
        this.middleware = [];
        this.hooks = {
            beforeRequest: [],
            afterRequest: [],
            onError: []
        };
        
        // Forward events
        this.queue.on('failed', (data) => this.emit('request:failed', data));
        this.loadBalancer.on('unhealthy', (data) => this.emit('provider:unhealthy', data));
    }

    /**
     * Register provider
     */
    registerProvider(name, config) {
        this.loadBalancer.register(name, config);
        this.circuitBreakers.set(name, new CircuitBreaker(config.circuitBreaker));
        return this;
    }

    /**
     * Add middleware
     */
    use(middleware) {
        this.middleware.push(middleware);
        return this;
    }

    /**
     * Add hook
     */
    addHook(type, fn) {
        if (this.hooks[type]) {
            this.hooks[type].push(fn);
        }
        return this;
    }

    /**
     * Execute request
     */
    async execute(request, options = {}) {
        // Check cache
        if (!options.noCache) {
            const cached = this.cache.get(request);
            if (cached) return cached;
        }
        
        // Run before hooks
        for (const hook of this.hooks.beforeRequest) {
            await hook(request);
        }
        
        // Run middleware
        let modifiedRequest = request;
        for (const mw of this.middleware) {
            modifiedRequest = await mw(modifiedRequest) || modifiedRequest;
        }
        
        // Get provider
        const provider = this.loadBalancer.getNext();
        const circuitBreaker = this.circuitBreakers.get(provider.name);
        
        // Execute with circuit breaker
        const executeRequest = async () => {
            this.loadBalancer.startRequest(provider.name);
            
            try {
                const result = await this._executeWithProvider(provider, modifiedRequest, options);
                
                this.loadBalancer.endRequest(provider.name, true);
                
                // Cache response
                if (!options.noCache) {
                    this.cache.set(request, result, options.cacheTTL);
                }
                
                // Run after hooks
                for (const hook of this.hooks.afterRequest) {
                    await hook(request, result);
                }
                
                return result;
                
            } catch (error) {
                this.loadBalancer.endRequest(provider.name, false);
                
                // Run error hooks
                for (const hook of this.hooks.onError) {
                    await hook(request, error);
                }
                
                throw error;
            }
        };
        
        if (circuitBreaker) {
            return circuitBreaker.execute(executeRequest);
        }
        
        return executeRequest();
    }

    /**
     * Execute with specific provider
     */
    async _executeWithProvider(provider, request, options) {
        // Simulate provider execution
        return {
            provider: provider.name,
            request,
            response: `[Response from ${provider.name}]`,
            timestamp: Date.now()
        };
    }

    /**
     * Batch execute
     */
    async executeBatch(requests, options = {}) {
        const priority = options.priority || 0;
        
        const promises = requests.map(request => 
            this.queue.enqueue(
                () => this.execute(request, options),
                priority
            )
        );
        
        return Promise.all(promises);
    }

    /**
     * Execute with retry
     */
    async executeWithRetry(request, options = {}) {
        const maxRetries = options.retries || 3;
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.execute(request, options);
            } catch (error) {
                lastError = error;
                await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
            }
        }
        
        throw lastError;
    }

    /**
     * Get all stats
     */
    getStats() {
        const cbStats = {};
        for (const [name, cb] of this.circuitBreakers) {
            cbStats[name] = cb.getState();
        }
        
        return {
            queue: this.queue.getStats(),
            loadBalancer: this.loadBalancer.getStats(),
            cache: this.cache.getStats(),
            circuitBreakers: cbStats
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let orchestratorInstance = null;

module.exports = {
    RequestQueue,
    LoadBalancer,
    CircuitBreaker,
    ResponseCache,
    APIOrchestrator,
    
    // Singleton getter
    getOrchestrator: (options = {}) => {
        if (!orchestratorInstance) {
            orchestratorInstance = new APIOrchestrator(options);
        }
        return orchestratorInstance;
    },
    
    // Factory
    createOrchestrator: (options) => new APIOrchestrator(options)
};

console.log('✅ Step 12/50: API Orchestrator loaded');
