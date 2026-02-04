/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum v23.0 - PHASE GAMMA: Shadow-Execution Pattern                         ║
 * ║  Part of: Corporate Integration - Seamless Migration                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Shadow-Execution pattern for zero-downtime integration
 *              with legacy systems. Parallel execution with CRC validation
 *              for 100% match before takeover.
 * @phase GAMMA - Seamless Migration
 */

'use strict';

const EventEmitter = require('events');
const { CRCValidator } = require('./failover');

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW EXECUTION STATES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShadowState - States for shadow execution lifecycle
 */
const ShadowState = {
    INITIALIZING: 'initializing',
    OBSERVING: 'observing',          // Passively ingesting telemetry
    SHADOWING: 'shadowing',          // Running parallel execution
    VALIDATING: 'validating',        // Comparing outputs via CRC
    CONVERGING: 'converging',        // Outputs matching, preparing takeover
    TAKING_OVER: 'taking_over',      // Active takeover in progress
    ACTIVE: 'active',                // Full takeover complete
    ROLLBACK: 'rollback',            // Reverting to legacy
    TERMINATED: 'terminated'
};

/**
 * ConvergenceMetric - Metrics for convergence validation
 */
const ConvergenceMetric = {
    CRC_MATCH: 'crc_match',
    OUTPUT_IDENTICAL: 'output_identical',
    TIMING_ACCEPTABLE: 'timing_acceptable',
    RESOURCE_ACCEPTABLE: 'resource_acceptable'
};

// ═══════════════════════════════════════════════════════════════════════════════
// TELEMETRY INGESTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TelemetryIngester - Ingests telemetry from legacy systems
 */
class TelemetryIngester extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            bufferSize: options.bufferSize || 10000,
            flushInterval: options.flushInterval || 1000,
            ...options
        };

        this.buffer = [];
        this.stats = {
            received: 0,
            processed: 0,
            dropped: 0
        };

        this.flushTimer = null;
        this.running = false;
    }

    /**
     * Start ingestion
     */
    start() {
        this.running = true;
        this.flushTimer = setInterval(() => this._flush(), this.options.flushInterval);
        this.emit('started');
        return this;
    }

    /**
     * Stop ingestion
     */
    stop() {
        this.running = false;
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this._flush(); // Final flush
        this.emit('stopped');
        return this;
    }

    /**
     * Ingest telemetry data point
     */
    ingest(data) {
        if (!this.running) return false;

        this.stats.received++;

        if (this.buffer.length >= this.options.bufferSize) {
            this.stats.dropped++;
            return false;
        }

        this.buffer.push({
            data,
            timestamp: Date.now(),
            sequence: this.stats.received
        });

        return true;
    }

    /**
     * Flush buffer
     */
    _flush() {
        if (this.buffer.length === 0) return;

        const batch = [...this.buffer];
        this.buffer = [];
        this.stats.processed += batch.length;

        this.emit('batch', { data: batch, count: batch.length });
    }

    /**
     * Get current buffer state
     */
    getBufferState() {
        return {
            size: this.buffer.length,
            maxSize: this.options.bufferSize,
            utilization: this.buffer.length / this.options.bufferSize
        };
    }

    /**
     * Get statistics
     */
    getStats() {
        return { ...this.stats, running: this.running };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShadowExecutor - Executes operations in shadow mode
 * Runs QAntum parallel to legacy without affecting production
 */
class ShadowExecutor extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            convergenceThreshold: options.convergenceThreshold || 0.99, // 99% match
            requiredConsecutiveMatches: options.requiredConsecutiveMatches || 100,
            maxValidationAttempts: options.maxValidationAttempts || 1000,
            takeoverDelayMs: options.takeoverDelayMs || 5000,
            ...options
        };

        this.crcValidator = new CRCValidator();
        this.telemetryIngester = new TelemetryIngester(options);

        this.state = ShadowState.INITIALIZING;
        this.validationHistory = [];
        this.consecutiveMatches = 0;
        this.totalValidations = 0;
        this.matchRate = 0;

        this.legacyHandler = null;
        this.qantumHandler = null;

        this._setupIngesterHandlers();
    }

    /**
     * Setup telemetry ingester event handlers
     */
    _setupIngesterHandlers() {
        this.telemetryIngester.on('batch', ({ data }) => {
            this.emit('telemetry:batch', { count: data.length });
        });
    }

    /**
     * Register legacy system handler
     */
    registerLegacyHandler(handler) {
        this.legacyHandler = handler;
        this.emit('legacy:registered');
        return this;
    }

    /**
     * Register QAntum handler
     */
    registerQAntumHandler(handler) {
        this.qantumHandler = handler;
        this.emit('qantum:registered');
        return this;
    }

    /**
     * Start shadow execution
     */
    async start() {
        if (!this.legacyHandler || !this.qantumHandler) {
            throw new Error('Both legacy and QAntum handlers must be registered');
        }

        this._transitionState(ShadowState.OBSERVING);
        this.telemetryIngester.start();
        this.emit('started');
        return this;
    }

    /**
     * Execute operation in shadow mode
     * Runs both legacy and QAntum, compares outputs
     */
    async execute(operation, input) {
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const startTime = process.hrtime.bigint();

        let legacyResult = null;
        let qantumResult = null;
        let legacyError = null;
        let qantumError = null;

        // Execute on legacy system
        try {
            legacyResult = await this.legacyHandler(operation, input);
        } catch (err) {
            legacyError = err;
        }

        // Execute on QAntum (shadow)
        try {
            qantumResult = await this.qantumHandler(operation, input);
        } catch (err) {
            qantumError = err;
        }

        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number(endTime - startTime) / 1000000;

        // Validate outputs
        const validation = this._validateOutputs(legacyResult, qantumResult);
        this._recordValidation(validation);

        // Ingest telemetry
        this.telemetryIngester.ingest({
            executionId,
            operation,
            executionTimeMs,
            validation,
            legacyError: legacyError?.message,
            qantumError: qantumError?.message
        });

        // Check for convergence
        if (this.state === ShadowState.SHADOWING || this.state === ShadowState.VALIDATING) {
            this._checkConvergence();
        }

        // Return based on current state
        const result = {
            executionId,
            operation,
            executionTimeMs,
            validation,
            state: this.state
        };

        // In shadow/validating mode, always return legacy result
        if (this.state !== ShadowState.ACTIVE) {
            result.result = legacyResult;
            result.source = 'legacy';
        } else {
            // In active mode, return QAntum result
            result.result = qantumResult;
            result.source = 'qantum';
        }

        if (legacyError && this.state !== ShadowState.ACTIVE) {
            result.error = legacyError;
        } else if (qantumError && this.state === ShadowState.ACTIVE) {
            result.error = qantumError;
        }

        this.emit('executed', result);

        return result;
    }

    /**
     * Validate outputs using CRC comparison
     */
    _validateOutputs(legacyResult, qantumResult) {
        const validation = {
            timestamp: Date.now(),
            metrics: {}
        };

        // CRC comparison
        const crcComparison = this.crcValidator.compare(
            legacyResult || {},
            qantumResult || {}
        );
        validation.metrics[ConvergenceMetric.CRC_MATCH] = crcComparison.match;
        validation.crcLegacy = crcComparison.crcA;
        validation.crcQAntum = crcComparison.crcB;

        // Deep equality check
        const outputIdentical = JSON.stringify(legacyResult) === JSON.stringify(qantumResult);
        validation.metrics[ConvergenceMetric.OUTPUT_IDENTICAL] = outputIdentical;

        // Overall match
        validation.match = crcComparison.match && outputIdentical;

        return validation;
    }

    /**
     * Record validation result
     */
    _recordValidation(validation) {
        this.totalValidations++;
        this.validationHistory.push(validation);

        // Trim history
        if (this.validationHistory.length > this.options.maxValidationAttempts) {
            this.validationHistory = this.validationHistory.slice(-this.options.maxValidationAttempts);
        }

        // Update consecutive matches
        if (validation.match) {
            this.consecutiveMatches++;
        } else {
            this.consecutiveMatches = 0;
        }

        // Calculate match rate (from recent history)
        const recentHistory = this.validationHistory.slice(-100);
        const recentMatches = recentHistory.filter(v => v.match).length;
        this.matchRate = recentMatches / recentHistory.length;
    }

    /**
     * Check if convergence criteria are met
     */
    _checkConvergence() {
        // Transition to validating state once we have enough data
        if (this.state === ShadowState.SHADOWING && this.totalValidations >= 10) {
            this._transitionState(ShadowState.VALIDATING);
        }

        // Check convergence criteria
        const meetsMatchRate = this.matchRate >= this.options.convergenceThreshold;
        const meetsConsecutive = this.consecutiveMatches >= this.options.requiredConsecutiveMatches;

        if (meetsMatchRate && meetsConsecutive) {
            this._transitionState(ShadowState.CONVERGING);
            this.emit('convergence:achieved', {
                matchRate: this.matchRate,
                consecutiveMatches: this.consecutiveMatches
            });
        }
    }

    /**
     * Initiate takeover
     */
    async initiateTakeover() {
        if (this.state !== ShadowState.CONVERGING) {
            return {
                success: false,
                reason: `Cannot takeover from state: ${this.state}`
            };
        }

        this._transitionState(ShadowState.TAKING_OVER);
        this.emit('takeover:initiated');

        // Delay for safety (configurable)
        await new Promise(resolve => setTimeout(resolve, this.options.takeoverDelayMs));

        // Final validation
        if (this.matchRate >= this.options.convergenceThreshold) {
            this._transitionState(ShadowState.ACTIVE);
            this.emit('takeover:complete');
            return {
                success: true,
                matchRate: this.matchRate,
                totalValidations: this.totalValidations
            };
        } else {
            this._transitionState(ShadowState.ROLLBACK);
            this.emit('takeover:aborted', { matchRate: this.matchRate });
            return {
                success: false,
                reason: 'Match rate dropped below threshold during takeover'
            };
        }
    }

    /**
     * Rollback to legacy
     */
    rollback() {
        if (this.state === ShadowState.ACTIVE || this.state === ShadowState.TAKING_OVER) {
            this._transitionState(ShadowState.ROLLBACK);
            
            // Reset to shadowing state
            setTimeout(() => {
                this._transitionState(ShadowState.SHADOWING);
                this.consecutiveMatches = 0;
            }, 1000);

            this.emit('rollback:complete');
            return true;
        }
        return false;
    }

    /**
     * Transition state
     */
    _transitionState(newState) {
        const oldState = this.state;
        this.state = newState;
        this.emit('state:changed', { from: oldState, to: newState });
    }

    /**
     * Begin active shadowing
     */
    beginShadowing() {
        if (this.state === ShadowState.OBSERVING) {
            this._transitionState(ShadowState.SHADOWING);
            return true;
        }
        return false;
    }

    /**
     * Get convergence status
     */
    getConvergenceStatus() {
        return {
            state: this.state,
            totalValidations: this.totalValidations,
            consecutiveMatches: this.consecutiveMatches,
            matchRate: this.matchRate,
            meetsThreshold: this.matchRate >= this.options.convergenceThreshold,
            meetsConsecutive: this.consecutiveMatches >= this.options.requiredConsecutiveMatches,
            recentHistory: this.validationHistory.slice(-10)
        };
    }

    /**
     * Get full status
     */
    getStatus() {
        return {
            state: this.state,
            convergence: this.getConvergenceStatus(),
            telemetry: this.telemetryIngester.getStats(),
            options: this.options
        };
    }

    /**
     * Stop shadow executor
     */
    stop() {
        this.telemetryIngester.stop();
        this._transitionState(ShadowState.TERMINATED);
        this.emit('stopped');
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOT-STANDBY COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * HotStandbyCoordinator - Coordinates hot-standby instances for zero-downtime
 */
class HotStandbyCoordinator extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            minStandbys: options.minStandbys || 2,
            maxStandbys: options.maxStandbys || 10,
            healthCheckInterval: options.healthCheckInterval || 1000,
            ...options
        };

        this.instances = new Map();
        this.primary = null;
        this.standbys = [];
        this.healthCheckTimer = null;
    }

    /**
     * Register instance
     */
    registerInstance(instanceId, config = {}) {
        const instance = {
            id: instanceId,
            role: config.role || 'standby',
            state: 'ready',
            registeredAt: Date.now(),
            lastHeartbeat: Date.now(),
            metadata: config.metadata || {}
        };

        this.instances.set(instanceId, instance);

        if (config.role === 'primary') {
            this.primary = instanceId;
        } else {
            this.standbys.push(instanceId);
        }

        this.emit('instance:registered', { instanceId, role: instance.role });
        return instance;
    }

    /**
     * Promote standby to primary
     */
    promoteToPrimary(instanceId) {
        const instance = this.instances.get(instanceId);
        if (!instance || !this.standbys.includes(instanceId)) {
            return { success: false, reason: 'Invalid standby instance' };
        }

        // Demote current primary
        if (this.primary) {
            const oldPrimary = this.instances.get(this.primary);
            if (oldPrimary) {
                oldPrimary.role = 'standby';
                this.standbys.push(this.primary);
            }
        }

        // Promote new primary
        instance.role = 'primary';
        this.primary = instanceId;
        this.standbys = this.standbys.filter(id => id !== instanceId);

        this.emit('instance:promoted', { instanceId });

        return { success: true, newPrimary: instanceId };
    }

    /**
     * Handle primary failure
     */
    handlePrimaryFailure() {
        if (!this.primary) {
            return { success: false, reason: 'No primary to fail over from' };
        }

        if (this.standbys.length === 0) {
            this.emit('failover:no_standby');
            return { success: false, reason: 'No standbys available' };
        }

        const failedPrimary = this.primary;
        const newPrimary = this.standbys[0];

        const result = this.promoteToPrimary(newPrimary);

        if (result.success) {
            // Remove failed primary
            this.instances.delete(failedPrimary);
            this.emit('failover:complete', { failed: failedPrimary, new: newPrimary });
        }

        return result;
    }

    /**
     * Record heartbeat
     */
    heartbeat(instanceId) {
        const instance = this.instances.get(instanceId);
        if (instance) {
            instance.lastHeartbeat = Date.now();
            return true;
        }
        return false;
    }

    /**
     * Start health monitoring
     */
    startHealthCheck() {
        this.healthCheckTimer = setInterval(() => {
            const now = Date.now();
            const timeout = this.options.healthCheckInterval * 3;

            for (const [instanceId, instance] of this.instances) {
                if (now - instance.lastHeartbeat > timeout) {
                    instance.state = 'unhealthy';
                    this.emit('instance:unhealthy', { instanceId });

                    if (instanceId === this.primary) {
                        this.handlePrimaryFailure();
                    }
                }
            }
        }, this.options.healthCheckInterval);

        return this;
    }

    /**
     * Stop health monitoring
     */
    stopHealthCheck() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        return this;
    }

    /**
     * Get coordinator status
     */
    getStatus() {
        return {
            primary: this.primary,
            standbys: [...this.standbys],
            totalInstances: this.instances.size,
            instances: Array.from(this.instances.values()).map(i => ({
                id: i.id,
                role: i.role,
                state: i.state,
                uptimeMs: Date.now() - i.registeredAt
            }))
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    ShadowExecutor,
    TelemetryIngester,
    HotStandbyCoordinator,

    // Enums
    ShadowState,
    ConvergenceMetric,

    // Factory functions
    createShadowExecutor: (options = {}) => new ShadowExecutor(options),
    createTelemetryIngester: (options = {}) => new TelemetryIngester(options),
    createHotStandbyCoordinator: (options = {}) => new HotStandbyCoordinator(options)
};

console.log('✅ PHASE GAMMA: Shadow-Execution Pattern loaded');
