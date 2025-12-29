/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 33/50: Autonomous Decisions                        ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Autonomous Decision Making System
 * @phase 2 - Autonomous Intelligence
 * @step 33 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// DECISION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DecisionStrategy - Decision strategies
 */
const DecisionStrategy = {
    GREEDY: 'greedy',
    EPSILON_GREEDY: 'epsilon_greedy',
    UCB: 'ucb',
    THOMPSON: 'thompson',
    SOFTMAX: 'softmax',
    BAYESIAN: 'bayesian'
};

/**
 * DecisionPriority - Priority levels
 */
const DecisionPriority = {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
};

// ═══════════════════════════════════════════════════════════════════════════════
// OPTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Option - Decision option with tracking
 */
class Option {
    constructor(id, name, metadata = {}) {
        this.id = id;
        this.name = name;
        this.metadata = metadata;
        
        this.trials = 0;
        this.successes = 0;
        this.totalReward = 0;
        this.rewards = [];
        
        // Bayesian prior (Beta distribution)
        this.alpha = 1;  // Prior successes
        this.beta = 1;   // Prior failures
    }

    /**
     * Record outcome
     */
    record(reward, success = null) {
        this.trials++;
        this.totalReward += reward;
        this.rewards.push(reward);
        
        if (success !== null) {
            if (success) {
                this.successes++;
                this.alpha++;
            } else {
                this.beta++;
            }
        }
        
        return this;
    }

    /**
     * Get average reward
     */
    getAverageReward() {
        return this.trials > 0 ? this.totalReward / this.trials : 0;
    }

    /**
     * Get success rate
     */
    getSuccessRate() {
        return this.trials > 0 ? this.successes / this.trials : 0.5;
    }

    /**
     * Sample from Beta distribution (Thompson Sampling)
     */
    sampleBeta() {
        // Simple approximation using gamma samples
        const x = this._sampleGamma(this.alpha);
        const y = this._sampleGamma(this.beta);
        return x / (x + y);
    }

    /**
     * Sample from Gamma distribution
     */
    _sampleGamma(shape) {
        if (shape < 1) {
            return this._sampleGamma(1 + shape) * Math.pow(Math.random(), 1 / shape);
        }
        
        const d = shape - 1/3;
        const c = 1 / Math.sqrt(9 * d);
        
        while (true) {
            let x, v;
            do {
                x = this._normalSample();
                v = 1 + c * x;
            } while (v <= 0);
            
            v = v * v * v;
            const u = Math.random();
            
            if (u < 1 - 0.0331 * x * x * x * x) return d * v;
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
        }
    }

    /**
     * Standard normal sample
     */
    _normalSample() {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    /**
     * Get UCB score
     */
    getUCB(totalTrials, explorationConstant = 2) {
        if (this.trials === 0) return Infinity;
        
        const exploitation = this.getAverageReward();
        const exploration = explorationConstant * Math.sqrt(
            Math.log(totalTrials) / this.trials
        );
        
        return exploitation + exploration;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECISION MAKER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DecisionMaker - Core decision engine
 */
class DecisionMaker extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            strategy: options.strategy || DecisionStrategy.UCB,
            epsilon: options.epsilon || 0.1,
            temperature: options.temperature || 1.0,
            explorationConstant: options.explorationConstant || 2,
            ...options
        };
        
        this.options_ = new Map();
        this.totalTrials = 0;
        this.decisions = [];
    }

    /**
     * Add option
     */
    addOption(id, name, metadata = {}) {
        this.options_.set(id, new Option(id, name, metadata));
        return this;
    }

    /**
     * Remove option
     */
    removeOption(id) {
        this.options_.delete(id);
        return this;
    }

    /**
     * Select option
     */
    select() {
        if (this.options_.size === 0) {
            throw new Error('No options available');
        }
        
        let selected;
        
        switch (this.options.strategy) {
            case DecisionStrategy.GREEDY:
                selected = this._selectGreedy();
                break;
            case DecisionStrategy.EPSILON_GREEDY:
                selected = this._selectEpsilonGreedy();
                break;
            case DecisionStrategy.UCB:
                selected = this._selectUCB();
                break;
            case DecisionStrategy.THOMPSON:
                selected = this._selectThompson();
                break;
            case DecisionStrategy.SOFTMAX:
                selected = this._selectSoftmax();
                break;
            default:
                selected = this._selectUCB();
        }
        
        this.decisions.push({
            timestamp: Date.now(),
            optionId: selected.id,
            strategy: this.options.strategy
        });
        
        this.emit('selected', { option: selected });
        
        return selected;
    }

    /**
     * Greedy selection
     */
    _selectGreedy() {
        let best = null;
        let bestValue = -Infinity;
        
        for (const option of this.options_.values()) {
            const value = option.getAverageReward();
            if (value > bestValue) {
                bestValue = value;
                best = option;
            }
        }
        
        return best;
    }

    /**
     * Epsilon-greedy selection
     */
    _selectEpsilonGreedy() {
        if (Math.random() < this.options.epsilon) {
            // Random exploration
            const options = Array.from(this.options_.values());
            return options[Math.floor(Math.random() * options.length)];
        }
        return this._selectGreedy();
    }

    /**
     * UCB selection
     */
    _selectUCB() {
        let best = null;
        let bestScore = -Infinity;
        
        for (const option of this.options_.values()) {
            const score = option.getUCB(this.totalTrials + 1, this.options.explorationConstant);
            if (score > bestScore) {
                bestScore = score;
                best = option;
            }
        }
        
        return best;
    }

    /**
     * Thompson Sampling selection
     */
    _selectThompson() {
        let best = null;
        let bestSample = -Infinity;
        
        for (const option of this.options_.values()) {
            const sample = option.sampleBeta();
            if (sample > bestSample) {
                bestSample = sample;
                best = option;
            }
        }
        
        return best;
    }

    /**
     * Softmax selection
     */
    _selectSoftmax() {
        const options = Array.from(this.options_.values());
        const values = options.map(o => o.getAverageReward() / this.options.temperature);
        const maxValue = Math.max(...values);
        const expValues = values.map(v => Math.exp(v - maxValue));
        const sumExp = expValues.reduce((a, b) => a + b, 0);
        const probabilities = expValues.map(e => e / sumExp);
        
        let random = Math.random();
        for (let i = 0; i < options.length; i++) {
            random -= probabilities[i];
            if (random <= 0) return options[i];
        }
        
        return options[options.length - 1];
    }

    /**
     * Record outcome
     */
    recordOutcome(optionId, reward, success = null) {
        const option = this.options_.get(optionId);
        if (option) {
            option.record(reward, success);
            this.totalTrials++;
            this.emit('outcome', { optionId, reward, success });
        }
        return this;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const stats = {
            totalTrials: this.totalTrials,
            options: {}
        };
        
        for (const [id, option] of this.options_) {
            stats.options[id] = {
                trials: option.trials,
                averageReward: option.getAverageReward(),
                successRate: option.getSuccessRate()
            };
        }
        
        return stats;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMOUS DECISION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AutonomousDecisionEngine - Full autonomous decision system
 */
class AutonomousDecisionEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            confidenceThreshold: options.confidenceThreshold || 0.8,
            minTrialsForAuto: options.minTrialsForAuto || 10,
            ...options
        };
        
        this.decisionMaker = new DecisionMaker(options);
        this.context = {};
        this.rules = [];
        this.history = [];
    }

    /**
     * Set context
     */
    setContext(context) {
        this.context = { ...this.context, ...context };
        return this;
    }

    /**
     * Add decision rule
     */
    addRule(condition, action, priority = DecisionPriority.MEDIUM) {
        this.rules.push({ condition, action, priority });
        this.rules.sort((a, b) => a.priority - b.priority);
        return this;
    }

    /**
     * Make autonomous decision
     */
    decide(situation = {}) {
        const mergedContext = { ...this.context, ...situation };
        
        // Check rules first
        for (const rule of this.rules) {
            if (rule.condition(mergedContext)) {
                const decision = {
                    type: 'rule_based',
                    action: rule.action(mergedContext),
                    confidence: 1.0,
                    timestamp: Date.now()
                };
                
                this.history.push(decision);
                this.emit('decision', decision);
                
                return decision;
            }
        }
        
        // Fall back to learned decision
        if (this.decisionMaker.totalTrials >= this.options.minTrialsForAuto) {
            const option = this.decisionMaker.select();
            
            const decision = {
                type: 'learned',
                action: option.id,
                confidence: this._calculateConfidence(option),
                option: option,
                timestamp: Date.now()
            };
            
            this.history.push(decision);
            this.emit('decision', decision);
            
            return decision;
        }
        
        // Not enough data, explore
        const options = Array.from(this.decisionMaker.options_.values());
        if (options.length === 0) {
            return { type: 'no_options', action: null, confidence: 0 };
        }
        
        const randomOption = options[Math.floor(Math.random() * options.length)];
        
        const decision = {
            type: 'exploration',
            action: randomOption.id,
            confidence: 0.5,
            timestamp: Date.now()
        };
        
        this.history.push(decision);
        this.emit('decision', decision);
        
        return decision;
    }

    /**
     * Calculate confidence
     */
    _calculateConfidence(option) {
        if (option.trials < 5) return 0.5;
        
        // Based on success rate and number of trials
        const successConfidence = option.getSuccessRate();
        const trialConfidence = Math.min(1, option.trials / 50);
        
        return (successConfidence * 0.7 + trialConfidence * 0.3);
    }

    /**
     * Learn from outcome
     */
    learn(action, reward, success = null) {
        this.decisionMaker.recordOutcome(action, reward, success);
        
        this.emit('learned', { action, reward, success });
        
        return this;
    }

    /**
     * Should act autonomously
     */
    shouldActAutonomously() {
        if (this.decisionMaker.totalTrials < this.options.minTrialsForAuto) {
            return false;
        }
        
        const option = this.decisionMaker._selectGreedy();
        const confidence = this._calculateConfidence(option);
        
        return confidence >= this.options.confidenceThreshold;
    }

    /**
     * Get summary
     */
    getSummary() {
        return {
            totalDecisions: this.history.length,
            autonomousCapable: this.shouldActAutonomously(),
            stats: this.decisionMaker.getStatistics(),
            recentDecisions: this.history.slice(-10)
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine = null;

module.exports = {
    // Classes
    Option,
    DecisionMaker,
    AutonomousDecisionEngine,
    
    // Types
    DecisionStrategy,
    DecisionPriority,
    
    // Factory
    createEngine: (options = {}) => new AutonomousDecisionEngine(options),
    createDecisionMaker: (options = {}) => new DecisionMaker(options),
    
    // Singleton
    getEngine: (options = {}) => {
        if (!defaultEngine) {
            defaultEngine = new AutonomousDecisionEngine(options);
        }
        return defaultEngine;
    }
};

console.log('✅ Step 33/50: Autonomous Decisions loaded');
