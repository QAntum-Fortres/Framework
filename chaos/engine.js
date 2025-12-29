/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 45/50: Chaos Engineering                           ║
 * ║  Part of: Phase 3 - Domination                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Chaos Engineering for Resilience Testing
 * @phase 3 - Domination
 * @step 45 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// CHAOS TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ChaosType - Types of chaos experiments
 */
const ChaosType = {
    NETWORK: 'network',
    RESOURCE: 'resource',
    STATE: 'state',
    TIME: 'time',
    DEPENDENCY: 'dependency'
};

/**
 * FailureMode - Failure modes
 */
const FailureMode = {
    LATENCY: 'latency',
    ERROR: 'error',
    TIMEOUT: 'timeout',
    CRASH: 'crash',
    CORRUPTION: 'corruption',
    PARTITION: 'partition'
};

/**
 * ExperimentState - Experiment states
 */
const ExperimentState = {
    PENDING: 'pending',
    RUNNING: 'running',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    ABORTED: 'aborted'
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHAOS ATTACK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ChaosAttack - Individual chaos attack
 */
class ChaosAttack extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.id = config.id || `attack-${Date.now()}`;
        this.name = config.name || 'Unnamed Attack';
        this.type = config.type || ChaosType.NETWORK;
        this.mode = config.mode || FailureMode.ERROR;
        
        this.config = {
            probability: config.probability || 0.5,
            duration: config.duration || 5000,
            intensity: config.intensity || 0.5,
            target: config.target || '*',
            ...config.config
        };
        
        this.active = false;
        this.stats = {
            executions: 0,
            failures: 0,
            avgDuration: 0
        };
    }

    /**
     * Execute attack
     */
    async execute(context = {}) {
        if (this.active) {
            throw new Error('Attack already in progress');
        }
        
        this.active = true;
        const startTime = Date.now();
        
        this.emit('started', { attack: this });
        
        try {
            const result = await this._applyAttack(context);
            
            this.stats.executions++;
            this.stats.avgDuration = 
                (this.stats.avgDuration * (this.stats.executions - 1) + (Date.now() - startTime)) / 
                this.stats.executions;
            
            this.emit('completed', { attack: this, result });
            
            return result;
        } catch (error) {
            this.stats.failures++;
            this.emit('failed', { attack: this, error });
            throw error;
        } finally {
            this.active = false;
        }
    }

    /**
     * Apply specific attack
     */
    async _applyAttack(context) {
        switch (this.mode) {
            case FailureMode.LATENCY:
                return this._applyLatency(context);
            case FailureMode.ERROR:
                return this._applyError(context);
            case FailureMode.TIMEOUT:
                return this._applyTimeout(context);
            case FailureMode.CRASH:
                return this._applyCrash(context);
            default:
                return { applied: false };
        }
    }

    /**
     * Apply latency injection
     */
    async _applyLatency(context) {
        const delay = this.config.duration * this.config.intensity;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return {
            applied: true,
            type: 'latency',
            delay
        };
    }

    /**
     * Apply error injection
     */
    async _applyError(context) {
        if (Math.random() < this.config.probability) {
            return {
                applied: true,
                type: 'error',
                shouldFail: true
            };
        }
        return { applied: false };
    }

    /**
     * Apply timeout
     */
    async _applyTimeout(context) {
        await new Promise(resolve => setTimeout(resolve, this.config.duration + 1000));
        
        return {
            applied: true,
            type: 'timeout',
            timedOut: true
        };
    }

    /**
     * Apply crash simulation
     */
    async _applyCrash(context) {
        return {
            applied: true,
            type: 'crash',
            crashed: true,
            shouldRestart: true
        };
    }

    /**
     * Stop attack
     */
    stop() {
        this.active = false;
        this.emit('stopped', { attack: this });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAOS EXPERIMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ChaosExperiment - Multi-attack experiment
 */
class ChaosExperiment extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.id = config.id || `exp-${Date.now()}`;
        this.name = config.name || 'Chaos Experiment';
        this.description = config.description || '';
        this.state = ExperimentState.PENDING;
        
        this.hypothesis = config.hypothesis || 'System remains stable';
        this.attacks = [];
        this.steadyState = config.steadyState || {};
        
        this.results = {
            started: null,
            completed: null,
            hypothesisValid: null,
            observations: [],
            metrics: {}
        };
    }

    /**
     * Add attack
     */
    addAttack(attack) {
        this.attacks.push(attack);
    }

    /**
     * Run experiment
     */
    async run(context = {}) {
        this.state = ExperimentState.RUNNING;
        this.results.started = new Date();
        
        this.emit('started', { experiment: this });
        
        try {
            // Capture initial steady state
            const initialState = await this._captureState(context);
            this.results.observations.push({
                type: 'initial',
                state: initialState,
                timestamp: new Date()
            });
            
            // Run attacks
            for (const attack of this.attacks) {
                if (this.state !== ExperimentState.RUNNING) break;
                
                try {
                    const result = await attack.execute(context);
                    this.results.observations.push({
                        type: 'attack',
                        attack: attack.id,
                        result,
                        timestamp: new Date()
                    });
                } catch (error) {
                    this.results.observations.push({
                        type: 'attack_error',
                        attack: attack.id,
                        error: error.message,
                        timestamp: new Date()
                    });
                }
                
                // Check steady state after each attack
                const currentState = await this._captureState(context);
                this.results.observations.push({
                    type: 'state_check',
                    state: currentState,
                    timestamp: new Date()
                });
            }
            
            // Final state capture
            const finalState = await this._captureState(context);
            this.results.observations.push({
                type: 'final',
                state: finalState,
                timestamp: new Date()
            });
            
            // Validate hypothesis
            this.results.hypothesisValid = this._validateHypothesis(initialState, finalState);
            
            this.state = ExperimentState.COMPLETED;
            this.results.completed = new Date();
            
            this.emit('completed', { experiment: this, results: this.results });
            
            return this.results;
        } catch (error) {
            this.state = ExperimentState.ABORTED;
            this.emit('aborted', { experiment: this, error });
            throw error;
        }
    }

    /**
     * Capture system state
     */
    async _captureState(context) {
        return {
            healthy: context.health?.() ?? true,
            latency: context.getLatency?.() ?? 0,
            errorRate: context.getErrorRate?.() ?? 0,
            throughput: context.getThroughput?.() ?? 0,
            capturedAt: new Date()
        };
    }

    /**
     * Validate hypothesis
     */
    _validateHypothesis(initial, final) {
        // Simple validation: error rate should not exceed threshold
        const errorRateDiff = (final.errorRate || 0) - (initial.errorRate || 0);
        const latencyIncrease = (final.latency || 0) / (initial.latency || 1);
        
        return errorRateDiff < 0.1 && latencyIncrease < 2;
    }

    /**
     * Abort experiment
     */
    abort() {
        this.state = ExperimentState.ABORTED;
        
        for (const attack of this.attacks) {
            attack.stop();
        }
        
        this.emit('aborted', { experiment: this });
    }

    /**
     * Pause experiment
     */
    pause() {
        this.state = ExperimentState.PAUSED;
        this.emit('paused', { experiment: this });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME DAY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GameDay - Coordinated chaos event
 */
class GameDay extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.id = config.id || `gameday-${Date.now()}`;
        this.name = config.name || 'Game Day';
        this.description = config.description || '';
        
        this.experiments = [];
        this.schedule = config.schedule || [];
        
        this.state = 'planned';
        this.results = [];
    }

    /**
     * Add experiment
     */
    addExperiment(experiment, scheduledTime = null) {
        this.experiments.push(experiment);
        
        if (scheduledTime) {
            this.schedule.push({
                experiment: experiment.id,
                time: scheduledTime
            });
        }
    }

    /**
     * Execute game day
     */
    async execute(context = {}) {
        this.state = 'running';
        this.emit('started', { gameDay: this });
        
        for (const experiment of this.experiments) {
            try {
                const result = await experiment.run(context);
                this.results.push({
                    experiment: experiment.id,
                    result,
                    success: result.hypothesisValid
                });
            } catch (error) {
                this.results.push({
                    experiment: experiment.id,
                    error: error.message,
                    success: false
                });
            }
        }
        
        this.state = 'completed';
        this.emit('completed', { gameDay: this, results: this.results });
        
        return this._generateReport();
    }

    /**
     * Generate report
     */
    _generateReport() {
        const successful = this.results.filter(r => r.success).length;
        
        return {
            gameDay: this.name,
            totalExperiments: this.experiments.length,
            successful,
            failed: this.experiments.length - successful,
            successRate: (successful / this.experiments.length) * 100,
            results: this.results
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAOS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ChaosEngine - Main chaos engineering orchestrator
 */
class ChaosEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            enabled: options.enabled !== false,
            safeMode: options.safeMode !== false,
            maxConcurrent: options.maxConcurrent || 3,
            ...options
        };
        
        this.attacks = new Map();
        this.experiments = new Map();
        this.gameDays = new Map();
        
        this.activeAttacks = new Set();
        
        this._initDefaultAttacks();
    }

    /**
     * Initialize default attacks
     */
    _initDefaultAttacks() {
        // Network attacks
        this.registerAttack(new ChaosAttack({
            id: 'network-latency',
            name: 'Network Latency',
            type: ChaosType.NETWORK,
            mode: FailureMode.LATENCY,
            config: { duration: 3000, intensity: 0.5 }
        }));

        this.registerAttack(new ChaosAttack({
            id: 'network-partition',
            name: 'Network Partition',
            type: ChaosType.NETWORK,
            mode: FailureMode.PARTITION,
            config: { duration: 5000 }
        }));

        // Resource attacks
        this.registerAttack(new ChaosAttack({
            id: 'cpu-stress',
            name: 'CPU Stress',
            type: ChaosType.RESOURCE,
            mode: FailureMode.ERROR,
            config: { intensity: 0.8, duration: 10000 }
        }));

        this.registerAttack(new ChaosAttack({
            id: 'memory-pressure',
            name: 'Memory Pressure',
            type: ChaosType.RESOURCE,
            mode: FailureMode.ERROR,
            config: { intensity: 0.7, duration: 5000 }
        }));

        // Dependency attacks
        this.registerAttack(new ChaosAttack({
            id: 'dependency-failure',
            name: 'Dependency Failure',
            type: ChaosType.DEPENDENCY,
            mode: FailureMode.ERROR,
            config: { probability: 0.5, target: 'database' }
        }));
    }

    /**
     * Register attack
     */
    registerAttack(attack) {
        this.attacks.set(attack.id, attack);
    }

    /**
     * Create experiment
     */
    createExperiment(config = {}) {
        const experiment = new ChaosExperiment(config);
        this.experiments.set(experiment.id, experiment);
        
        return experiment;
    }

    /**
     * Run attack
     */
    async runAttack(attackId, context = {}) {
        if (!this.options.enabled) {
            throw new Error('Chaos engine is disabled');
        }
        
        const attack = this.attacks.get(attackId);
        if (!attack) {
            throw new Error(`Attack ${attackId} not found`);
        }
        
        if (this.activeAttacks.size >= this.options.maxConcurrent) {
            throw new Error('Max concurrent attacks reached');
        }
        
        this.activeAttacks.add(attackId);
        
        try {
            const result = await attack.execute(context);
            this.emit('attackCompleted', { attackId, result });
            return result;
        } finally {
            this.activeAttacks.delete(attackId);
        }
    }

    /**
     * Run experiment
     */
    async runExperiment(experimentId, context = {}) {
        if (!this.options.enabled) {
            throw new Error('Chaos engine is disabled');
        }
        
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }
        
        return experiment.run(context);
    }

    /**
     * Create game day
     */
    createGameDay(config = {}) {
        const gameDay = new GameDay(config);
        this.gameDays.set(gameDay.id, gameDay);
        
        return gameDay;
    }

    /**
     * Stop all chaos
     */
    stopAll() {
        for (const attackId of this.activeAttacks) {
            const attack = this.attacks.get(attackId);
            if (attack) {
                attack.stop();
            }
        }
        
        this.activeAttacks.clear();
        this.emit('allStopped');
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            enabled: this.options.enabled,
            registeredAttacks: this.attacks.size,
            experiments: this.experiments.size,
            gameDays: this.gameDays.size,
            activeAttacks: this.activeAttacks.size
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    ChaosAttack,
    ChaosExperiment,
    GameDay,
    ChaosEngine,
    
    // Types
    ChaosType,
    FailureMode,
    ExperimentState,
    
    // Factory
    createEngine: (options = {}) => new ChaosEngine(options),
    createAttack: (config = {}) => new ChaosAttack(config),
    createExperiment: (config = {}) => new ChaosExperiment(config)
};

console.log('✅ Step 45/50: Chaos Engineering loaded');
