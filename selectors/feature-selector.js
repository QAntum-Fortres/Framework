/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 14/50: Feature Selector                            ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Intelligent feature selection for ML models
 * @phase 1 - Enterprise Foundation
 * @step 14 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FeatureSelector - Select optimal features for ML
 */
class FeatureSelector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxFeatures: options.maxFeatures || null,
            minVariance: options.minVariance || 0.01,
            correlationThreshold: options.correlationThreshold || 0.95,
            ...options
        };
        
        this.featureStats = new Map();
        this.selectedFeatures = [];
    }

    /**
     * Analyze features
     */
    analyze(data, target = null) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Data must be a non-empty array');
        }
        
        const features = Object.keys(data[0]).filter(k => k !== target);
        const stats = {};
        
        for (const feature of features) {
            const values = data.map(row => row[feature]).filter(v => v !== null && v !== undefined);
            
            // Determine type
            const numericValues = values.filter(v => typeof v === 'number');
            const isNumeric = numericValues.length === values.length;
            
            if (isNumeric) {
                stats[feature] = this._analyzeNumericFeature(feature, numericValues, data, target);
            } else {
                stats[feature] = this._analyzeCategoricalFeature(feature, values, data, target);
            }
            
            this.featureStats.set(feature, stats[feature]);
        }
        
        this.emit('analyzed', { featureCount: features.length });
        
        return stats;
    }

    /**
     * Analyze numeric feature
     */
    _analyzeNumericFeature(name, values, data, target) {
        const n = values.length;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        const std = Math.sqrt(variance);
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        // Skewness
        const skewness = values.reduce((a, b) => a + Math.pow((b - mean) / std, 3), 0) / n;
        
        // Missing ratio
        const totalRows = data.length;
        const missingRatio = (totalRows - values.length) / totalRows;
        
        // Correlation with target if available
        let targetCorrelation = null;
        if (target && data[0].hasOwnProperty(target)) {
            const targetValues = data.map(row => row[target]).filter(v => typeof v === 'number');
            if (targetValues.length === values.length) {
                targetCorrelation = this._pearsonCorrelation(values, targetValues);
            }
        }
        
        return {
            name,
            type: 'numeric',
            count: n,
            mean,
            std,
            variance,
            min,
            max,
            skewness,
            missingRatio,
            targetCorrelation,
            importance: this._calculateImportance({ variance, targetCorrelation, missingRatio })
        };
    }

    /**
     * Analyze categorical feature
     */
    _analyzeCategoricalFeature(name, values, data, target) {
        const valueCounts = {};
        for (const v of values) {
            valueCounts[v] = (valueCounts[v] || 0) + 1;
        }
        
        const uniqueCount = Object.keys(valueCounts).length;
        const totalRows = data.length;
        const missingRatio = (totalRows - values.length) / totalRows;
        
        // Entropy
        const entropy = Object.values(valueCounts).reduce((e, count) => {
            const p = count / values.length;
            return e - p * Math.log2(p);
        }, 0);
        
        // Mode
        const mode = Object.entries(valueCounts)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        return {
            name,
            type: 'categorical',
            count: values.length,
            uniqueCount,
            entropy,
            mode,
            modeFrequency: valueCounts[mode] / values.length,
            missingRatio,
            valueCounts,
            importance: this._calculateImportance({ entropy, uniqueCount, missingRatio })
        };
    }

    /**
     * Pearson correlation
     */
    _pearsonCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
        const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);
        const sumY2 = y.reduce((a, yi) => a + yi * yi, 0);
        
        const num = n * sumXY - sumX * sumY;
        const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return den === 0 ? 0 : num / den;
    }

    /**
     * Calculate feature importance score
     */
    _calculateImportance({ variance, entropy, targetCorrelation, uniqueCount, missingRatio }) {
        let score = 1 - (missingRatio || 0); // Penalize missing values
        
        if (variance !== undefined) {
            score *= Math.min(variance, 1); // Prefer variance
        }
        
        if (entropy !== undefined) {
            score *= Math.min(entropy / 4, 1); // Normalize entropy
        }
        
        if (targetCorrelation !== undefined && targetCorrelation !== null) {
            score *= Math.abs(targetCorrelation); // Prefer correlated features
        }
        
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Select features by variance
     */
    selectByVariance(threshold = null) {
        const minVar = threshold || this.options.minVariance;
        
        const selected = [];
        
        for (const [name, stats] of this.featureStats) {
            if (stats.type === 'numeric' && stats.variance >= minVar) {
                selected.push(name);
            } else if (stats.type === 'categorical') {
                // Include categoricals with reasonable unique values
                if (stats.uniqueCount > 1 && stats.uniqueCount < 100) {
                    selected.push(name);
                }
            }
        }
        
        this.selectedFeatures = selected;
        this.emit('selected', { method: 'variance', count: selected.length });
        
        return selected;
    }

    /**
     * Select features by correlation with target
     */
    selectByCorrelation(threshold = 0.1) {
        const selected = [];
        
        for (const [name, stats] of this.featureStats) {
            if (stats.targetCorrelation !== null && 
                Math.abs(stats.targetCorrelation) >= threshold) {
                selected.push({
                    name,
                    correlation: stats.targetCorrelation
                });
            }
        }
        
        // Sort by absolute correlation
        selected.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        
        this.selectedFeatures = selected.map(s => s.name);
        this.emit('selected', { method: 'correlation', count: selected.length });
        
        return selected;
    }

    /**
     * Remove highly correlated features
     */
    removeHighCorrelation(data, threshold = null) {
        const corrThreshold = threshold || this.options.correlationThreshold;
        const features = Array.from(this.featureStats.keys())
            .filter(f => this.featureStats.get(f).type === 'numeric');
        
        const toRemove = new Set();
        
        for (let i = 0; i < features.length; i++) {
            if (toRemove.has(features[i])) continue;
            
            const valuesI = data.map(row => row[features[i]]).filter(v => typeof v === 'number');
            
            for (let j = i + 1; j < features.length; j++) {
                if (toRemove.has(features[j])) continue;
                
                const valuesJ = data.map(row => row[features[j]]).filter(v => typeof v === 'number');
                
                if (valuesI.length !== valuesJ.length) continue;
                
                const corr = Math.abs(this._pearsonCorrelation(valuesI, valuesJ));
                
                if (corr >= corrThreshold) {
                    // Remove feature with lower importance
                    const importanceI = this.featureStats.get(features[i]).importance;
                    const importanceJ = this.featureStats.get(features[j]).importance;
                    
                    if (importanceI >= importanceJ) {
                        toRemove.add(features[j]);
                    } else {
                        toRemove.add(features[i]);
                    }
                }
            }
        }
        
        this.selectedFeatures = this.selectedFeatures.filter(f => !toRemove.has(f));
        this.emit('filtered', { removed: toRemove.size, reason: 'high_correlation' });
        
        return Array.from(toRemove);
    }

    /**
     * Select top K features by importance
     */
    selectTopK(k = 10) {
        const ranked = Array.from(this.featureStats.entries())
            .map(([name, stats]) => ({ name, importance: stats.importance }))
            .sort((a, b) => b.importance - a.importance)
            .slice(0, k);
        
        this.selectedFeatures = ranked.map(r => r.name);
        this.emit('selected', { method: 'top_k', count: k });
        
        return ranked;
    }

    /**
     * Recursive Feature Elimination (simplified)
     */
    async rfe(data, target, model, nFeatures = 5) {
        let features = Object.keys(data[0]).filter(k => k !== target);
        
        while (features.length > nFeatures) {
            // Get feature importances from model (simulated)
            const importances = features.map(f => ({
                name: f,
                importance: this.featureStats.get(f)?.importance || Math.random()
            }));
            
            // Remove least important
            importances.sort((a, b) => a.importance - b.importance);
            const toRemove = importances[0].name;
            
            features = features.filter(f => f !== toRemove);
            
            this.emit('rfe:iteration', { remaining: features.length, removed: toRemove });
        }
        
        this.selectedFeatures = features;
        return features;
    }

    /**
     * Get selected features
     */
    getSelected() {
        return [...this.selectedFeatures];
    }

    /**
     * Transform data to selected features
     */
    transform(data) {
        if (this.selectedFeatures.length === 0) {
            throw new Error('No features selected. Run a selection method first.');
        }
        
        return data.map(row => {
            const transformed = {};
            for (const feature of this.selectedFeatures) {
                transformed[feature] = row[feature];
            }
            return transformed;
        });
    }

    /**
     * Fit and transform
     */
    fitTransform(data, target = null, method = 'variance') {
        this.analyze(data, target);
        
        switch (method) {
            case 'variance':
                this.selectByVariance();
                break;
            case 'correlation':
                this.selectByCorrelation();
                break;
            case 'top_k':
                this.selectTopK(this.options.maxFeatures || 10);
                break;
            default:
                this.selectByVariance();
        }
        
        return this.transform(data);
    }

    /**
     * Get feature importance ranking
     */
    getImportanceRanking() {
        return Array.from(this.featureStats.entries())
            .map(([name, stats]) => ({
                name,
                type: stats.type,
                importance: stats.importance,
                stats: {
                    mean: stats.mean,
                    variance: stats.variance,
                    targetCorrelation: stats.targetCorrelation,
                    missingRatio: stats.missingRatio
                }
            }))
            .sort((a, b) => b.importance - a.importance);
    }

    /**
     * Export selection config
     */
    exportConfig() {
        return {
            options: this.options,
            selectedFeatures: this.selectedFeatures,
            featureStats: Object.fromEntries(this.featureStats)
        };
    }

    /**
     * Import selection config
     */
    importConfig(config) {
        this.options = { ...this.options, ...config.options };
        this.selectedFeatures = config.selectedFeatures || [];
        
        if (config.featureStats) {
            this.featureStats = new Map(Object.entries(config.featureStats));
        }
        
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATIC FEATURE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AutoFeatureSelector - Automatic feature selection
 */
class AutoFeatureSelector extends FeatureSelector {
    constructor(options = {}) {
        super(options);
        
        this.autoConfig = {
            enableVarianceFilter: true,
            enableCorrelationFilter: true,
            enableImportanceFilter: true,
            targetRatio: options.targetRatio || 0.5, // Keep 50% of features
            ...options
        };
    }

    /**
     * Auto select features
     */
    autoSelect(data, target = null) {
        const steps = [];
        
        // Step 1: Analyze
        this.analyze(data, target);
        const originalCount = this.featureStats.size;
        steps.push({ step: 'analyze', features: originalCount });
        
        // Step 2: Variance filter
        if (this.autoConfig.enableVarianceFilter) {
            this.selectByVariance();
            steps.push({ step: 'variance_filter', features: this.selectedFeatures.length });
        } else {
            this.selectedFeatures = Array.from(this.featureStats.keys());
        }
        
        // Step 3: High correlation filter
        if (this.autoConfig.enableCorrelationFilter && this.selectedFeatures.length > 1) {
            this.removeHighCorrelation(data);
            steps.push({ step: 'correlation_filter', features: this.selectedFeatures.length });
        }
        
        // Step 4: Select top by importance
        if (this.autoConfig.enableImportanceFilter) {
            const targetCount = Math.ceil(originalCount * this.autoConfig.targetRatio);
            if (this.selectedFeatures.length > targetCount) {
                this.selectTopK(targetCount);
                steps.push({ step: 'importance_filter', features: this.selectedFeatures.length });
            }
        }
        
        this.emit('auto:complete', {
            original: originalCount,
            selected: this.selectedFeatures.length,
            steps
        });
        
        return {
            features: this.getSelected(),
            steps,
            summary: {
                original: originalCount,
                selected: this.selectedFeatures.length,
                reduction: 1 - (this.selectedFeatures.length / originalCount)
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    FeatureSelector,
    AutoFeatureSelector,
    
    // Factory
    createSelector: (options) => new FeatureSelector(options),
    createAutoSelector: (options) => new AutoFeatureSelector(options)
};

console.log('✅ Step 14/50: Feature Selector loaded');
