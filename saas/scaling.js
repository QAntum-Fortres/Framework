/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 37/50: Scale Engine                                ║
 * ║  Part of: Phase 3 - Domination                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Horizontal and Vertical Scaling Engine
 * @phase 3 - Domination
 * @step 37 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// SCALE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ScaleDirection - Scaling directions
 */
const ScaleDirection = {
    UP: 'up',
    DOWN: 'down',
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical'
};

/**
 * ScaleStrategy - Scaling strategies
 */
const ScaleStrategy = {
    REACTIVE: 'reactive',
    PREDICTIVE: 'predictive',
    SCHEDULED: 'scheduled',
    MANUAL: 'manual'
};

/**
 * InstanceStatus - Instance status
 */
const InstanceStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    TERMINATING: 'terminating',
    TERMINATED: 'terminated'
};

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Instance - Compute instance
 */
class Instance {
    constructor(data = {}) {
        this.id = data.id || `inst_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        this.type = data.type || 'worker';
        this.size = data.size || 'medium';
        this.status = data.status || InstanceStatus.PENDING;
        
        this.cpu = data.cpu || 2;
        this.memory = data.memory || 4096; // MB
        
        this.metrics = {
            cpuUsage: 0,
            memoryUsage: 0,
            requestCount: 0,
            latencyAvg: 0
        };
        
        this.startedAt = null;
        this.createdAt = new Date();
    }

    /**
     * Start instance
     */
    start() {
        this.status = InstanceStatus.RUNNING;
        this.startedAt = new Date();
        return this;
    }

    /**
     * Stop instance
     */
    stop() {
        this.status = InstanceStatus.TERMINATING;
        return this;
    }

    /**
     * Update metrics
     */
    updateMetrics(metrics) {
        Object.assign(this.metrics, metrics);
        return this;
    }

    /**
     * Get uptime
     */
    getUptime() {
        if (!this.startedAt) return 0;
        return Date.now() - this.startedAt.getTime();
    }

    /**
     * Is healthy
     */
    isHealthy() {
        return this.status === InstanceStatus.RUNNING &&
               this.metrics.cpuUsage < 90 &&
               this.metrics.memoryUsage < 90;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCE POOL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * InstancePool - Pool of compute instances
 */
class InstancePool extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            minInstances: options.minInstances || 1,
            maxInstances: options.maxInstances || 10,
            defaultSize: options.defaultSize || 'medium',
            ...options
        };
        
        this.instances = new Map();
        this.pendingScaleOps = [];
    }

    /**
     * Add instance
     */
    addInstance(config = {}) {
        if (this.instances.size >= this.options.maxInstances) {
            throw new Error('Maximum instances reached');
        }
        
        const instance = new Instance({
            size: config.size || this.options.defaultSize,
            ...config
        });
        
        this.instances.set(instance.id, instance);
        
        // Simulate startup
        setTimeout(() => {
            instance.start();
            this.emit('instance:started', { instance });
        }, 1000);
        
        return instance;
    }

    /**
     * Remove instance
     */
    removeInstance(instanceId) {
        if (this.instances.size <= this.options.minInstances) {
            throw new Error('Minimum instances required');
        }
        
        const instance = this.instances.get(instanceId);
        if (instance) {
            instance.stop();
            
            setTimeout(() => {
                instance.status = InstanceStatus.TERMINATED;
                this.instances.delete(instanceId);
                this.emit('instance:terminated', { instanceId });
            }, 500);
        }
        
        return instance;
    }

    /**
     * Get running instances
     */
    getRunningInstances() {
        return Array.from(this.instances.values())
            .filter(i => i.status === InstanceStatus.RUNNING);
    }

    /**
     * Get instance count
     */
    getCount() {
        return this.instances.size;
    }

    /**
     * Get aggregate metrics
     */
    getAggregateMetrics() {
        const running = this.getRunningInstances();
        
        if (running.length === 0) {
            return { avgCpu: 0, avgMemory: 0, totalRequests: 0 };
        }
        
        return {
            avgCpu: running.reduce((sum, i) => sum + i.metrics.cpuUsage, 0) / running.length,
            avgMemory: running.reduce((sum, i) => sum + i.metrics.memoryUsage, 0) / running.length,
            totalRequests: running.reduce((sum, i) => sum + i.metrics.requestCount, 0)
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO SCALER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AutoScaler - Automatic scaling engine
 */
class AutoScaler extends EventEmitter {
    constructor(pool, options = {}) {
        super();
        
        this.pool = pool;
        this.options = {
            strategy: options.strategy || ScaleStrategy.REACTIVE,
            scaleUpThreshold: options.scaleUpThreshold || 70,
            scaleDownThreshold: options.scaleDownThreshold || 30,
            cooldownPeriod: options.cooldownPeriod || 60000, // 1 minute
            evaluationPeriod: options.evaluationPeriod || 5000, // 5 seconds
            ...options
        };
        
        this.lastScaleTime = 0;
        this.enabled = false;
        this.intervalId = null;
        this.history = [];
    }

    /**
     * Start auto-scaling
     */
    start() {
        this.enabled = true;
        this.intervalId = setInterval(() => {
            this._evaluate();
        }, this.options.evaluationPeriod);
        
        this.emit('started');
        return this;
    }

    /**
     * Stop auto-scaling
     */
    stop() {
        this.enabled = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        this.emit('stopped');
        return this;
    }

    /**
     * Evaluate scaling needs
     */
    _evaluate() {
        if (!this.enabled) return;
        
        const now = Date.now();
        if (now - this.lastScaleTime < this.options.cooldownPeriod) {
            return; // In cooldown
        }
        
        const metrics = this.pool.getAggregateMetrics();
        let decision = null;
        
        if (metrics.avgCpu > this.options.scaleUpThreshold ||
            metrics.avgMemory > this.options.scaleUpThreshold) {
            decision = this._scaleUp();
        } else if (metrics.avgCpu < this.options.scaleDownThreshold &&
                   metrics.avgMemory < this.options.scaleDownThreshold) {
            decision = this._scaleDown();
        }
        
        if (decision) {
            this.lastScaleTime = now;
            this.history.push({
                timestamp: now,
                decision,
                metrics
            });
            
            this.emit('scaled', { decision, metrics });
        }
    }

    /**
     * Scale up
     */
    _scaleUp() {
        try {
            const instance = this.pool.addInstance();
            return {
                direction: ScaleDirection.UP,
                instanceId: instance.id
            };
        } catch (e) {
            return null;
        }
    }

    /**
     * Scale down
     */
    _scaleDown() {
        const running = this.pool.getRunningInstances();
        
        if (running.length <= this.pool.options.minInstances) {
            return null;
        }
        
        // Find least utilized instance
        const sorted = running.sort((a, b) => {
            const aUtil = a.metrics.cpuUsage + a.metrics.memoryUsage;
            const bUtil = b.metrics.cpuUsage + b.metrics.memoryUsage;
            return aUtil - bUtil;
        });
        
        try {
            const instance = this.pool.removeInstance(sorted[0].id);
            return {
                direction: ScaleDirection.DOWN,
                instanceId: sorted[0].id
            };
        } catch (e) {
            return null;
        }
    }

    /**
     * Get history
     */
    getHistory() {
        return this.history.slice(-100);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD BALANCER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LoadBalancer - Distribute load across instances
 */
class LoadBalancer extends EventEmitter {
    constructor(pool, options = {}) {
        super();
        
        this.pool = pool;
        this.options = {
            algorithm: options.algorithm || 'round_robin', // 'round_robin' | 'least_connections' | 'weighted'
            healthCheckInterval: options.healthCheckInterval || 10000,
            ...options
        };
        
        this.currentIndex = 0;
        this.connectionCounts = new Map();
    }

    /**
     * Get next instance
     */
    getNext() {
        const instances = this.pool.getRunningInstances().filter(i => i.isHealthy());
        
        if (instances.length === 0) {
            throw new Error('No healthy instances available');
        }
        
        let selected;
        
        switch (this.options.algorithm) {
            case 'round_robin':
                selected = instances[this.currentIndex % instances.length];
                this.currentIndex++;
                break;
                
            case 'least_connections':
                selected = instances.reduce((min, inst) => {
                    const minConns = this.connectionCounts.get(min.id) || 0;
                    const instConns = this.connectionCounts.get(inst.id) || 0;
                    return instConns < minConns ? inst : min;
                });
                break;
                
            case 'weighted':
                selected = this._weightedSelection(instances);
                break;
                
            default:
                selected = instances[0];
        }
        
        // Track connection
        const current = this.connectionCounts.get(selected.id) || 0;
        this.connectionCounts.set(selected.id, current + 1);
        
        return selected;
    }

    /**
     * Release connection
     */
    release(instanceId) {
        const current = this.connectionCounts.get(instanceId) || 0;
        if (current > 0) {
            this.connectionCounts.set(instanceId, current - 1);
        }
    }

    /**
     * Weighted selection
     */
    _weightedSelection(instances) {
        // Weight by available capacity (inverse of utilization)
        const weights = instances.map(i => {
            const utilization = (i.metrics.cpuUsage + i.metrics.memoryUsage) / 2;
            return Math.max(1, 100 - utilization);
        });
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < instances.length; i++) {
            random -= weights[i];
            if (random <= 0) return instances[i];
        }
        
        return instances[instances.length - 1];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCALE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ScaleEngine - Main scaling orchestrator
 */
class ScaleEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        
        this.pool = new InstancePool(options);
        this.autoScaler = new AutoScaler(this.pool, options);
        this.loadBalancer = new LoadBalancer(this.pool, options);
        
        // Initialize minimum instances
        for (let i = 0; i < (options.minInstances || 1); i++) {
            this.pool.addInstance();
        }
    }

    /**
     * Start auto-scaling
     */
    startAutoScaling() {
        this.autoScaler.start();
        return this;
    }

    /**
     * Stop auto-scaling
     */
    stopAutoScaling() {
        this.autoScaler.stop();
        return this;
    }

    /**
     * Manual scale
     */
    scale(direction, count = 1) {
        for (let i = 0; i < count; i++) {
            if (direction === ScaleDirection.UP) {
                this.pool.addInstance();
            } else if (direction === ScaleDirection.DOWN) {
                const running = this.pool.getRunningInstances();
                if (running.length > 0) {
                    this.pool.removeInstance(running[running.length - 1].id);
                }
            }
        }
        return this;
    }

    /**
     * Get instance for request
     */
    getInstance() {
        return this.loadBalancer.getNext();
    }

    /**
     * Update instance metrics
     */
    updateMetrics(instanceId, metrics) {
        const instance = this.pool.instances.get(instanceId);
        if (instance) {
            instance.updateMetrics(metrics);
        }
        return this;
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            instances: this.pool.getCount(),
            running: this.pool.getRunningInstances().length,
            autoScaling: this.autoScaler.enabled,
            metrics: this.pool.getAggregateMetrics(),
            limits: {
                min: this.pool.options.minInstances,
                max: this.pool.options.maxInstances
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine = null;

module.exports = {
    // Classes
    Instance,
    InstancePool,
    AutoScaler,
    LoadBalancer,
    ScaleEngine,
    
    // Types
    ScaleDirection,
    ScaleStrategy,
    InstanceStatus,
    
    // Factory
    createEngine: (options = {}) => new ScaleEngine(options),
    createPool: (options = {}) => new InstancePool(options),
    
    // Singleton
    getEngine: (options = {}) => {
        if (!defaultEngine) {
            defaultEngine = new ScaleEngine(options);
        }
        return defaultEngine;
    }
};

console.log('✅ Step 37/50: Scale Engine loaded');
