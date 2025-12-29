/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 34/50: Meta-Learning                               ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Learning to Learn - Meta-Learning System
 * @phase 2 - Autonomous Intelligence
 * @step 34 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// META-LEARNING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MetaStrategy - Meta-learning strategies
 */
const MetaStrategy = {
    MAML: 'maml',           // Model-Agnostic Meta-Learning
    REPTILE: 'reptile',     // Scalable meta-learning
    PROTOTYPICAL: 'proto',  // Prototypical networks
    MATCHING: 'matching',   // Matching networks
    MEMORY: 'memory'        // Memory-augmented
};

/**
 * TaskType - Types of learning tasks
 */
const TaskType = {
    CLASSIFICATION: 'classification',
    REGRESSION: 'regression',
    REINFORCEMENT: 'reinforcement',
    GENERATION: 'generation'
};

// ═══════════════════════════════════════════════════════════════════════════════
// TASK DISTRIBUTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TaskDistribution - Generate meta-learning tasks
 */
class TaskDistribution {
    constructor(options = {}) {
        this.options = {
            nWay: options.nWay || 5,      // Classes per task
            kShot: options.kShot || 1,     // Examples per class
            querySize: options.querySize || 15,
            ...options
        };
        
        this.tasks = [];
    }

    /**
     * Create N-way K-shot task
     */
    createTask(data, labels) {
        const uniqueClasses = [...new Set(labels)];
        
        // Sample N classes
        const selectedClasses = this._sampleClasses(uniqueClasses, this.options.nWay);
        
        // Sample K examples per class (support set)
        const support = this._sampleExamples(data, labels, selectedClasses, this.options.kShot);
        
        // Sample query set
        const query = this._sampleExamples(data, labels, selectedClasses, this.options.querySize / this.options.nWay);
        
        const task = {
            id: `task_${Date.now()}`,
            classes: selectedClasses,
            support,
            query,
            nWay: this.options.nWay,
            kShot: this.options.kShot
        };
        
        this.tasks.push(task);
        
        return task;
    }

    /**
     * Sample classes
     */
    _sampleClasses(classes, n) {
        const shuffled = [...classes].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n);
    }

    /**
     * Sample examples
     */
    _sampleExamples(data, labels, classes, k) {
        const examples = [];
        
        for (const cls of classes) {
            const classIndices = labels.map((l, i) => l === cls ? i : -1).filter(i => i >= 0);
            const shuffled = classIndices.sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < Math.min(k, shuffled.length); i++) {
                examples.push({
                    data: data[shuffled[i]],
                    label: cls,
                    index: shuffled[i]
                });
            }
        }
        
        return examples;
    }

    /**
     * Create batch of tasks
     */
    createBatch(data, labels, batchSize = 4) {
        return Array(batchSize).fill(null).map(() => this.createTask(data, labels));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAML (Model-Agnostic Meta-Learning)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MAML - Model-Agnostic Meta-Learning
 */
class MAML extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            innerLR: options.innerLR || 0.01,
            outerLR: options.outerLR || 0.001,
            innerSteps: options.innerSteps || 5,
            firstOrderApprox: options.firstOrderApprox !== false,
            ...options
        };
        
        this.metaParameters = null;
        this.history = [];
    }

    /**
     * Initialize meta-parameters
     */
    initialize(parameterShape) {
        // Initialize with random values
        this.metaParameters = this._initializeParameters(parameterShape);
        return this;
    }

    /**
     * Initialize parameters
     */
    _initializeParameters(shape) {
        if (Array.isArray(shape)) {
            return shape.map(s => this._initializeParameters(s));
        }
        return (Math.random() - 0.5) * 0.1;
    }

    /**
     * Inner loop (task adaptation)
     */
    innerLoop(task, parameters) {
        let adapted = this._cloneParameters(parameters);
        
        for (let step = 0; step < this.options.innerSteps; step++) {
            // Compute gradients on support set
            const gradients = this._computeGradients(adapted, task.support);
            
            // Update parameters
            adapted = this._updateParameters(adapted, gradients, this.options.innerLR);
        }
        
        return adapted;
    }

    /**
     * Outer loop (meta-update)
     */
    metaUpdate(tasks) {
        const metaGradients = this._initializeGradients(this.metaParameters);
        
        for (const task of tasks) {
            // Inner loop adaptation
            const adapted = this.innerLoop(task, this.metaParameters);
            
            // Compute gradients on query set
            const queryGradients = this._computeGradients(adapted, task.query);
            
            // Accumulate meta-gradients
            this._accumulateGradients(metaGradients, queryGradients);
        }
        
        // Average gradients
        this._scaleGradients(metaGradients, 1 / tasks.length);
        
        // Update meta-parameters
        this.metaParameters = this._updateParameters(
            this.metaParameters, 
            metaGradients, 
            this.options.outerLR
        );
        
        const loss = this._computeMetaLoss(tasks);
        this.history.push({ loss, tasks: tasks.length });
        
        this.emit('updated', { loss });
        
        return loss;
    }

    /**
     * Clone parameters
     */
    _cloneParameters(params) {
        if (Array.isArray(params)) {
            return params.map(p => this._cloneParameters(p));
        }
        return params;
    }

    /**
     * Compute gradients (simulated)
     */
    _computeGradients(parameters, examples) {
        // Placeholder - in real implementation, this would do backprop
        const gradients = this._initializeGradients(parameters);
        
        for (const example of examples) {
            // Simulate gradient computation
            const sampleGrad = this._sampleGradient(parameters, example);
            this._accumulateGradients(gradients, sampleGrad);
        }
        
        this._scaleGradients(gradients, 1 / examples.length);
        
        return gradients;
    }

    /**
     * Initialize gradients
     */
    _initializeGradients(params) {
        if (Array.isArray(params)) {
            return params.map(p => this._initializeGradients(p));
        }
        return 0;
    }

    /**
     * Sample gradient (simulated)
     */
    _sampleGradient(params, example) {
        if (Array.isArray(params)) {
            return params.map(p => this._sampleGradient(p, example));
        }
        return (Math.random() - 0.5) * 0.01;
    }

    /**
     * Accumulate gradients
     */
    _accumulateGradients(target, source) {
        if (Array.isArray(target)) {
            for (let i = 0; i < target.length; i++) {
                this._accumulateGradients(target[i], source[i]);
            }
        } else {
            // For numbers, we can't mutate directly, so this is a placeholder
        }
    }

    /**
     * Scale gradients
     */
    _scaleGradients(gradients, scale) {
        if (Array.isArray(gradients)) {
            for (let i = 0; i < gradients.length; i++) {
                this._scaleGradients(gradients[i], scale);
            }
        }
    }

    /**
     * Update parameters
     */
    _updateParameters(params, gradients, lr) {
        if (Array.isArray(params)) {
            return params.map((p, i) => this._updateParameters(p, gradients[i], lr));
        }
        return params - lr * gradients;
    }

    /**
     * Compute meta-loss
     */
    _computeMetaLoss(tasks) {
        let totalLoss = 0;
        
        for (const task of tasks) {
            const adapted = this.innerLoop(task, this.metaParameters);
            totalLoss += this._evaluateLoss(adapted, task.query);
        }
        
        return totalLoss / tasks.length;
    }

    /**
     * Evaluate loss (simulated)
     */
    _evaluateLoss(parameters, examples) {
        return Math.random() * 0.5; // Placeholder
    }

    /**
     * Adapt to new task
     */
    adapt(task) {
        return this.innerLoop(task, this.metaParameters);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPTILE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Reptile - Scalable Meta-Learning
 */
class Reptile extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            innerSteps: options.innerSteps || 10,
            epsilon: options.epsilon || 0.1,
            ...options
        };
        
        this.parameters = null;
        this.history = [];
    }

    /**
     * Initialize parameters
     */
    initialize(shape) {
        this.parameters = this._initializeParameters(shape);
        return this;
    }

    /**
     * Initialize parameters
     */
    _initializeParameters(shape) {
        if (Array.isArray(shape)) {
            return shape.map(s => this._initializeParameters(s));
        }
        return (Math.random() - 0.5) * 0.1;
    }

    /**
     * Meta-update (Reptile algorithm)
     */
    metaUpdate(task) {
        // Clone parameters
        let taskParams = this._cloneParameters(this.parameters);
        
        // SGD on task
        for (let step = 0; step < this.options.innerSteps; step++) {
            const gradients = this._computeGradients(taskParams, task.support);
            taskParams = this._updateParameters(taskParams, gradients, 0.01);
        }
        
        // Reptile update: move towards task-optimized parameters
        this.parameters = this._interpolate(
            this.parameters,
            taskParams,
            this.options.epsilon
        );
        
        const loss = this._evaluateLoss(this.parameters, task.query);
        this.history.push({ loss });
        
        this.emit('updated', { loss });
        
        return loss;
    }

    /**
     * Clone parameters
     */
    _cloneParameters(params) {
        if (Array.isArray(params)) {
            return params.map(p => this._cloneParameters(p));
        }
        return params;
    }

    /**
     * Interpolate parameters
     */
    _interpolate(current, target, epsilon) {
        if (Array.isArray(current)) {
            return current.map((c, i) => this._interpolate(c, target[i], epsilon));
        }
        return current + epsilon * (target - current);
    }

    /**
     * Compute gradients (simulated)
     */
    _computeGradients(params, examples) {
        if (Array.isArray(params)) {
            return params.map(p => this._computeGradients(p, examples));
        }
        return (Math.random() - 0.5) * 0.01;
    }

    /**
     * Update parameters
     */
    _updateParameters(params, gradients, lr) {
        if (Array.isArray(params)) {
            return params.map((p, i) => this._updateParameters(p, gradients[i], lr));
        }
        return params - lr * gradients;
    }

    /**
     * Evaluate loss (simulated)
     */
    _evaluateLoss(params, examples) {
        return Math.random() * 0.5;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// META-LEARNING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MetaLearningEngine - Unified meta-learning system
 */
class MetaLearningEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            strategy: options.strategy || MetaStrategy.MAML,
            ...options
        };
        
        this.taskDistribution = new TaskDistribution(options);
        this.learner = this._createLearner(this.options.strategy);
        
        this.metrics = {
            tasksLearned: 0,
            adaptationSpeed: [],
            generalizationScores: []
        };
    }

    /**
     * Create learner
     */
    _createLearner(strategy) {
        switch (strategy) {
            case MetaStrategy.MAML:
                return new MAML(this.options);
            case MetaStrategy.REPTILE:
                return new Reptile(this.options);
            default:
                return new MAML(this.options);
        }
    }

    /**
     * Initialize
     */
    initialize(parameterShape) {
        this.learner.initialize(parameterShape);
        return this;
    }

    /**
     * Train on task batch
     */
    train(data, labels, epochs = 100) {
        for (let epoch = 0; epoch < epochs; epoch++) {
            const tasks = this.taskDistribution.createBatch(data, labels);
            
            if (this.options.strategy === MetaStrategy.MAML) {
                this.learner.metaUpdate(tasks);
            } else {
                for (const task of tasks) {
                    this.learner.metaUpdate(task);
                }
            }
            
            this.metrics.tasksLearned += tasks.length;
            
            if (epoch % 10 === 0) {
                this.emit('progress', { epoch, tasksLearned: this.metrics.tasksLearned });
            }
        }
        
        return this;
    }

    /**
     * Adapt to new task
     */
    adapt(task) {
        const startTime = Date.now();
        const adapted = this.learner.adapt ? this.learner.adapt(task) : this.learner.parameters;
        const adaptTime = Date.now() - startTime;
        
        this.metrics.adaptationSpeed.push(adaptTime);
        
        return {
            parameters: adapted,
            adaptTime
        };
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            avgAdaptTime: this.metrics.adaptationSpeed.length > 0
                ? this.metrics.adaptationSpeed.reduce((a, b) => a + b, 0) / this.metrics.adaptationSpeed.length
                : 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine = null;

module.exports = {
    // Classes
    TaskDistribution,
    MAML,
    Reptile,
    MetaLearningEngine,
    
    // Types
    MetaStrategy,
    TaskType,
    
    // Factory
    createEngine: (options = {}) => new MetaLearningEngine(options),
    createMAML: (options = {}) => new MAML(options),
    createReptile: (options = {}) => new Reptile(options),
    createTaskDistribution: (options = {}) => new TaskDistribution(options),
    
    // Singleton
    getEngine: (options = {}) => {
        if (!defaultEngine) {
            defaultEngine = new MetaLearningEngine(options);
        }
        return defaultEngine;
    }
};

console.log('✅ Step 34/50: Meta-Learning loaded');
