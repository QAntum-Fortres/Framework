/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 30/50: Knowledge Distillation                      ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Model Knowledge Transfer and Distillation
 * @phase 2 - Autonomous Intelligence
 * @step 30 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * KnowledgeType - Types of transferable knowledge
 */
const KnowledgeType = {
    SOFT_LABELS: 'soft_labels',
    FEATURE_MAPS: 'feature_maps',
    ATTENTION: 'attention',
    LOGITS: 'logits',
    EMBEDDINGS: 'embeddings',
    BEHAVIOR: 'behavior'
};

/**
 * DistillationMode - Distillation modes
 */
const DistillationMode = {
    OFFLINE: 'offline',
    ONLINE: 'online',
    SELF: 'self'
};

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * KnowledgeExtractor - Extract knowledge from teacher model
 */
class KnowledgeExtractor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            temperature: options.temperature || 3.0,
            extractionTypes: options.extractionTypes || [KnowledgeType.SOFT_LABELS],
            ...options
        };
        
        this.extractedKnowledge = [];
    }

    /**
     * Extract soft labels (softmax with temperature)
     */
    extractSoftLabels(logits) {
        const temperature = this.options.temperature;
        
        // Apply temperature scaling
        const scaledLogits = logits.map(l => l / temperature);
        
        // Softmax
        const maxLogit = Math.max(...scaledLogits);
        const expLogits = scaledLogits.map(l => Math.exp(l - maxLogit));
        const sumExp = expLogits.reduce((a, b) => a + b, 0);
        
        const softLabels = expLogits.map(e => e / sumExp);
        
        return {
            type: KnowledgeType.SOFT_LABELS,
            data: softLabels,
            temperature
        };
    }

    /**
     * Extract feature maps
     */
    extractFeatureMaps(activations) {
        // Normalize activations
        const normalized = this._normalizeActivations(activations);
        
        return {
            type: KnowledgeType.FEATURE_MAPS,
            data: normalized,
            shape: activations.length
        };
    }

    /**
     * Extract attention patterns
     */
    extractAttention(attentionWeights) {
        return {
            type: KnowledgeType.ATTENTION,
            data: attentionWeights,
            heads: attentionWeights.length
        };
    }

    /**
     * Extract all knowledge
     */
    extract(teacherOutput) {
        const knowledge = {};
        
        if (this.options.extractionTypes.includes(KnowledgeType.SOFT_LABELS) && teacherOutput.logits) {
            knowledge.softLabels = this.extractSoftLabels(teacherOutput.logits);
        }
        
        if (this.options.extractionTypes.includes(KnowledgeType.FEATURE_MAPS) && teacherOutput.activations) {
            knowledge.featureMaps = this.extractFeatureMaps(teacherOutput.activations);
        }
        
        if (this.options.extractionTypes.includes(KnowledgeType.ATTENTION) && teacherOutput.attention) {
            knowledge.attention = this.extractAttention(teacherOutput.attention);
        }
        
        if (this.options.extractionTypes.includes(KnowledgeType.EMBEDDINGS) && teacherOutput.embeddings) {
            knowledge.embeddings = {
                type: KnowledgeType.EMBEDDINGS,
                data: teacherOutput.embeddings
            };
        }
        
        this.extractedKnowledge.push({
            timestamp: Date.now(),
            knowledge
        });
        
        this.emit('extracted', knowledge);
        
        return knowledge;
    }

    /**
     * Normalize activations
     */
    _normalizeActivations(activations) {
        const mean = activations.reduce((a, b) => a + b, 0) / activations.length;
        const variance = activations.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / activations.length;
        const std = Math.sqrt(variance + 1e-8);
        
        return activations.map(a => (a - mean) / std);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISTILLATION LOSS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DistillationLoss - Loss functions for distillation
 */
class DistillationLoss {
    /**
     * KL Divergence loss
     */
    static klDivergence(studentProbs, teacherProbs) {
        let loss = 0;
        
        for (let i = 0; i < teacherProbs.length; i++) {
            if (teacherProbs[i] > 0) {
                loss += teacherProbs[i] * Math.log(teacherProbs[i] / (studentProbs[i] + 1e-8));
            }
        }
        
        return loss;
    }

    /**
     * Mean Squared Error
     */
    static mse(studentOutput, teacherOutput) {
        let sum = 0;
        
        for (let i = 0; i < teacherOutput.length; i++) {
            sum += Math.pow(studentOutput[i] - teacherOutput[i], 2);
        }
        
        return sum / teacherOutput.length;
    }

    /**
     * Cosine similarity loss
     */
    static cosineSimilarity(studentVec, teacherVec) {
        let dot = 0, normS = 0, normT = 0;
        
        for (let i = 0; i < teacherVec.length; i++) {
            dot += studentVec[i] * teacherVec[i];
            normS += studentVec[i] ** 2;
            normT += teacherVec[i] ** 2;
        }
        
        const similarity = dot / (Math.sqrt(normS) * Math.sqrt(normT) + 1e-8);
        return 1 - similarity; // Convert to loss
    }

    /**
     * Combined distillation loss
     */
    static combined(studentOutput, teacherKnowledge, alpha = 0.5, temperature = 3.0) {
        const losses = {};
        let totalLoss = 0;
        
        // Soft label loss
        if (teacherKnowledge.softLabels && studentOutput.logits) {
            const studentProbs = DistillationLoss._softmax(studentOutput.logits, temperature);
            losses.softLabel = DistillationLoss.klDivergence(studentProbs, teacherKnowledge.softLabels.data);
            totalLoss += losses.softLabel * alpha * (temperature ** 2);
        }
        
        // Feature map loss
        if (teacherKnowledge.featureMaps && studentOutput.activations) {
            losses.featureMap = DistillationLoss.mse(studentOutput.activations, teacherKnowledge.featureMaps.data);
            totalLoss += losses.featureMap * (1 - alpha);
        }
        
        // Attention loss
        if (teacherKnowledge.attention && studentOutput.attention) {
            losses.attention = DistillationLoss.mse(
                studentOutput.attention.flat(),
                teacherKnowledge.attention.data.flat()
            );
            totalLoss += losses.attention * 0.1;
        }
        
        return {
            total: totalLoss,
            components: losses
        };
    }

    /**
     * Softmax with temperature
     */
    static _softmax(logits, temperature) {
        const scaledLogits = logits.map(l => l / temperature);
        const maxLogit = Math.max(...scaledLogits);
        const expLogits = scaledLogits.map(l => Math.exp(l - maxLogit));
        const sumExp = expLogits.reduce((a, b) => a + b, 0);
        
        return expLogits.map(e => e / sumExp);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// KNOWLEDGE DISTILLER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * KnowledgeDistiller - Main distillation engine
 */
class KnowledgeDistiller extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            mode: options.mode || DistillationMode.OFFLINE,
            temperature: options.temperature || 3.0,
            alpha: options.alpha || 0.5, // Balance between soft and hard labels
            ...options
        };
        
        this.extractor = new KnowledgeExtractor({ temperature: this.options.temperature });
        
        this.trainingHistory = [];
        this.currentEpoch = 0;
    }

    /**
     * Distill knowledge from teacher to student
     */
    async distill(teacherModel, studentModel, dataLoader, epochs = 10) {
        this.emit('start', { epochs, mode: this.options.mode });
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            this.currentEpoch = epoch;
            const epochLosses = [];
            
            for (const batch of dataLoader) {
                // Get teacher predictions
                const teacherOutput = await this._getTeacherOutput(teacherModel, batch);
                
                // Extract knowledge
                const knowledge = this.extractor.extract(teacherOutput);
                
                // Get student predictions
                const studentOutput = await this._getStudentOutput(studentModel, batch);
                
                // Calculate distillation loss
                const loss = DistillationLoss.combined(
                    studentOutput,
                    knowledge,
                    this.options.alpha,
                    this.options.temperature
                );
                
                epochLosses.push(loss.total);
                
                // Update student (simulated)
                await this._updateStudent(studentModel, loss);
            }
            
            const avgLoss = epochLosses.reduce((a, b) => a + b, 0) / epochLosses.length;
            
            this.trainingHistory.push({
                epoch,
                loss: avgLoss,
                timestamp: Date.now()
            });
            
            this.emit('epoch', { epoch, loss: avgLoss });
        }
        
        this.emit('complete', { history: this.trainingHistory });
        
        return {
            history: this.trainingHistory,
            finalLoss: this.trainingHistory[this.trainingHistory.length - 1]?.loss
        };
    }

    /**
     * Get teacher output (simulated)
     */
    async _getTeacherOutput(teacher, batch) {
        // Simulate teacher forward pass
        return {
            logits: batch.inputs.map(() => Array(10).fill(0).map(() => Math.random() * 2 - 1)),
            activations: batch.inputs.map(() => Array(128).fill(0).map(() => Math.random())),
            attention: batch.inputs.map(() => Array(8).fill(0).map(() => 
                Array(64).fill(0).map(() => Math.random())
            ))
        };
    }

    /**
     * Get student output (simulated)
     */
    async _getStudentOutput(student, batch) {
        // Simulate student forward pass
        return {
            logits: batch.inputs.map(() => Array(10).fill(0).map(() => Math.random() * 2 - 1)),
            activations: batch.inputs.map(() => Array(128).fill(0).map(() => Math.random())),
            attention: batch.inputs.map(() => Array(4).fill(0).map(() => 
                Array(64).fill(0).map(() => Math.random())
            ))
        };
    }

    /**
     * Update student (simulated)
     */
    async _updateStudent(student, loss) {
        // Placeholder for actual gradient update
        return loss.total;
    }

    /**
     * Self-distillation
     */
    async selfDistill(model, dataLoader, epochs = 5) {
        // Use older version of model as teacher
        return this.distill(model, model, dataLoader, epochs);
    }

    /**
     * Online distillation
     */
    async onlineDistill(models, dataLoader, epochs = 10) {
        this.emit('start', { epochs, mode: 'online', numModels: models.length });
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            for (const batch of dataLoader) {
                // Get predictions from all models
                const outputs = await Promise.all(
                    models.map(m => this._getTeacherOutput(m, batch))
                );
                
                // Ensemble knowledge
                const ensembleKnowledge = this._ensembleKnowledge(outputs);
                
                // Update each model
                for (const model of models) {
                    const studentOutput = await this._getStudentOutput(model, batch);
                    const loss = DistillationLoss.combined(
                        studentOutput,
                        ensembleKnowledge,
                        this.options.alpha,
                        this.options.temperature
                    );
                    await this._updateStudent(model, loss);
                }
            }
            
            this.emit('epoch', { epoch });
        }
        
        return { epochs };
    }

    /**
     * Ensemble knowledge from multiple models
     */
    _ensembleKnowledge(outputs) {
        // Average soft labels
        const numOutputs = outputs.length;
        const firstOutput = outputs[0];
        
        const avgLogits = firstOutput.logits[0].map((_, i) => {
            return outputs.reduce((sum, o) => sum + o.logits[0][i], 0) / numOutputs;
        });
        
        const softLabels = this.extractor.extractSoftLabels(avgLogits);
        
        return { softLabels };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultDistiller = null;

module.exports = {
    // Classes
    KnowledgeExtractor,
    DistillationLoss,
    KnowledgeDistiller,
    
    // Types
    KnowledgeType,
    DistillationMode,
    
    // Factory
    createDistiller: (options = {}) => new KnowledgeDistiller(options),
    createExtractor: (options = {}) => new KnowledgeExtractor(options),
    
    // Singleton
    getDistiller: (options = {}) => {
        if (!defaultDistiller) {
            defaultDistiller = new KnowledgeDistiller(options);
        }
        return defaultDistiller;
    }
};

console.log('✅ Step 30/50: Knowledge Distillation loaded');
