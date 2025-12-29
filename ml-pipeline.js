/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 4/50: ML Pipeline Core                             ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Data ingestion, preprocessing, and ML pipeline fundamentals
 * @phase 1 - Enterprise Foundation
 * @step 4 of 50
 */

'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// DATA PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DataPipeline - Core data processing pipeline
 */
class DataPipeline extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            batchSize: options.batchSize || 32,
            shuffleBuffer: options.shuffleBuffer || 1000,
            prefetchSize: options.prefetchSize || 2,
            cacheEnabled: options.cacheEnabled !== false,
            ...options
        };
        
        this.stages = [];
        this.stats = {
            samplesProcessed: 0,
            batchesProcessed: 0,
            errors: 0,
            avgProcessingTime: 0
        };
    }

    /**
     * Add transformation stage
     */
    addStage(name, transformFn, options = {}) {
        this.stages.push({
            name,
            transform: transformFn,
            options: {
                parallel: options.parallel || false,
                retryOnError: options.retryOnError || false,
                timeout: options.timeout || 30000
            }
        });
        return this;
    }

    /**
     * Map transformation
     */
    map(fn) {
        return this.addStage('map', async (data) => {
            if (Array.isArray(data)) {
                return Promise.all(data.map(fn));
            }
            return fn(data);
        });
    }

    /**
     * Filter transformation
     */
    filter(predicate) {
        return this.addStage('filter', async (data) => {
            if (Array.isArray(data)) {
                const results = await Promise.all(data.map(async (item) => ({
                    item,
                    keep: await predicate(item)
                })));
                return results.filter(r => r.keep).map(r => r.item);
            }
            return (await predicate(data)) ? data : null;
        });
    }

    /**
     * Batch transformation
     */
    batch(size = null) {
        const batchSize = size || this.options.batchSize;
        let buffer = [];
        
        return this.addStage('batch', async (data) => {
            if (Array.isArray(data)) {
                buffer.push(...data);
            } else {
                buffer.push(data);
            }
            
            const batches = [];
            while (buffer.length >= batchSize) {
                batches.push(buffer.splice(0, batchSize));
            }
            
            return batches.length > 0 ? batches : null;
        });
    }

    /**
     * Shuffle transformation
     */
    shuffle(bufferSize = null) {
        const size = bufferSize || this.options.shuffleBuffer;
        let buffer = [];
        
        return this.addStage('shuffle', async (data) => {
            if (Array.isArray(data)) {
                buffer.push(...data);
            } else {
                buffer.push(data);
            }
            
            if (buffer.length >= size) {
                // Fisher-Yates shuffle
                for (let i = buffer.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [buffer[i], buffer[j]] = [buffer[j], buffer[i]];
                }
                
                const output = buffer.slice();
                buffer = [];
                return output;
            }
            
            return null;
        });
    }

    /**
     * Normalize numerical data
     */
    normalize(options = {}) {
        const { method = 'minmax', axis = null } = options;
        let stats = null;
        
        return this.addStage('normalize', async (data) => {
            if (!Array.isArray(data)) return data;
            
            // Calculate stats if not done
            if (!stats) {
                stats = this._calculateNormStats(data, method);
            }
            
            return data.map(sample => this._normalizeValue(sample, stats, method));
        });
    }

    /**
     * Calculate normalization statistics
     */
    _calculateNormStats(data, method) {
        const flattened = data.flat(Infinity).filter(v => typeof v === 'number');
        
        if (method === 'minmax') {
            return {
                min: Math.min(...flattened),
                max: Math.max(...flattened)
            };
        } else if (method === 'zscore') {
            const mean = flattened.reduce((a, b) => a + b, 0) / flattened.length;
            const variance = flattened.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / flattened.length;
            return {
                mean,
                std: Math.sqrt(variance)
            };
        }
        
        return {};
    }

    /**
     * Apply normalization
     */
    _normalizeValue(value, stats, method) {
        if (typeof value === 'number') {
            if (method === 'minmax') {
                return (value - stats.min) / (stats.max - stats.min || 1);
            } else if (method === 'zscore') {
                return (value - stats.mean) / (stats.std || 1);
            }
        }
        
        if (Array.isArray(value)) {
            return value.map(v => this._normalizeValue(v, stats, method));
        }
        
        return value;
    }

    /**
     * Process data through pipeline
     */
    async process(data) {
        const startTime = Date.now();
        let current = data;
        
        try {
            for (const stage of this.stages) {
                this.emit('stage:start', { name: stage.name });
                
                const stageStart = Date.now();
                current = await this._executeStage(stage, current);
                
                this.emit('stage:complete', {
                    name: stage.name,
                    duration: Date.now() - stageStart,
                    outputSize: Array.isArray(current) ? current.length : 1
                });
                
                if (current === null || (Array.isArray(current) && current.length === 0)) {
                    break;
                }
            }
            
            const duration = Date.now() - startTime;
            this.stats.samplesProcessed += Array.isArray(data) ? data.length : 1;
            this.stats.avgProcessingTime = (this.stats.avgProcessingTime + duration) / 2;
            
            this.emit('complete', { duration, output: current });
            return current;
            
        } catch (error) {
            this.stats.errors++;
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Execute single stage
     */
    async _executeStage(stage, data) {
        if (stage.options.timeout) {
            return Promise.race([
                stage.transform(data),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error(`Stage ${stage.name} timeout`)), stage.options.timeout)
                )
            ]);
        }
        
        return stage.transform(data);
    }

    /**
     * Create generator for streaming
     */
    async *stream(dataSource) {
        for await (const chunk of dataSource) {
            const result = await this.process(chunk);
            if (result !== null) {
                if (Array.isArray(result)) {
                    for (const item of result) {
                        yield item;
                    }
                } else {
                    yield result;
                }
            }
        }
    }

    /**
     * Reset pipeline
     */
    reset() {
        this.stages = [];
        return this;
    }

    /**
     * Get pipeline summary
     */
    getSummary() {
        return {
            stages: this.stages.map(s => s.name),
            stats: { ...this.stats },
            options: { ...this.options }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA LOADER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DataLoader - Load data from various sources
 */
class DataLoader extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        this.loaders = new Map();
        
        // Register default loaders
        this._registerDefaultLoaders();
    }

    /**
     * Register default file loaders
     */
    _registerDefaultLoaders() {
        // JSON loader
        this.register('json', async (filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        });
        
        // CSV loader (simple)
        this.register('csv', async (filePath, options = {}) => {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n');
            const delimiter = options.delimiter || ',';
            
            const headers = options.headers === false ? 
                null : 
                lines[0].split(delimiter).map(h => h.trim());
            
            const startIndex = headers ? 1 : 0;
            const data = [];
            
            for (let i = startIndex; i < lines.length; i++) {
                const values = lines[i].split(delimiter).map(v => {
                    const trimmed = v.trim();
                    const num = Number(trimmed);
                    return isNaN(num) ? trimmed : num;
                });
                
                if (headers) {
                    const row = {};
                    headers.forEach((h, idx) => {
                        row[h] = values[idx];
                    });
                    data.push(row);
                } else {
                    data.push(values);
                }
            }
            
            return data;
        });
        
        // JSONL (JSON Lines) loader
        this.register('jsonl', async (filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.trim().split('\n').map(line => JSON.parse(line));
        });
        
        // Text loader
        this.register('txt', async (filePath) => {
            return fs.readFileSync(filePath, 'utf8');
        });
        
        // Numpy-like (simple binary)
        this.register('npy', async (filePath) => {
            // Simplified - would need proper numpy parsing in production
            const buffer = fs.readFileSync(filePath);
            return Array.from(new Float32Array(buffer.buffer));
        });
    }

    /**
     * Register custom loader
     */
    register(format, loader) {
        this.loaders.set(format, loader);
        return this;
    }

    /**
     * Load data from file
     */
    async load(filePath, options = {}) {
        const ext = path.extname(filePath).slice(1).toLowerCase();
        const loader = this.loaders.get(options.format || ext);
        
        if (!loader) {
            throw new Error(`No loader registered for format: ${ext}`);
        }
        
        this.emit('load:start', { filePath });
        
        const startTime = Date.now();
        const data = await loader(filePath, options);
        
        this.emit('load:complete', {
            filePath,
            duration: Date.now() - startTime,
            size: Array.isArray(data) ? data.length : 1
        });
        
        return data;
    }

    /**
     * Load multiple files
     */
    async loadMany(filePaths, options = {}) {
        const results = await Promise.all(
            filePaths.map(fp => this.load(fp, options))
        );
        
        return options.flatten ? results.flat() : results;
    }

    /**
     * Load directory
     */
    async loadDirectory(dirPath, options = {}) {
        const { pattern = '*', recursive = false } = options;
        const files = this._getFiles(dirPath, pattern, recursive);
        return this.loadMany(files, options);
    }

    /**
     * Get files matching pattern
     */
    _getFiles(dirPath, pattern, recursive) {
        const files = [];
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory() && recursive) {
                files.push(...this._getFiles(fullPath, pattern, recursive));
            } else if (entry.isFile()) {
                if (pattern === '*' || entry.name.match(new RegExp(pattern.replace('*', '.*')))) {
                    files.push(fullPath);
                }
            }
        }
        
        return files;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE ENGINEERING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FeatureEngineer - Automated feature engineering
 */
class FeatureEngineer extends EventEmitter {
    constructor() {
        super();
        this.transformers = new Map();
        this.fittedParams = new Map();
    }

    /**
     * One-hot encoding
     */
    oneHotEncode(data, column) {
        const uniqueValues = [...new Set(data.map(row => row[column]))];
        
        return data.map(row => {
            const encoded = { ...row };
            delete encoded[column];
            
            for (const value of uniqueValues) {
                encoded[`${column}_${value}`] = row[column] === value ? 1 : 0;
            }
            
            return encoded;
        });
    }

    /**
     * Label encoding
     */
    labelEncode(data, column) {
        const uniqueValues = [...new Set(data.map(row => row[column]))];
        const mapping = Object.fromEntries(uniqueValues.map((v, i) => [v, i]));
        
        this.fittedParams.set(`label_${column}`, mapping);
        
        return data.map(row => ({
            ...row,
            [column]: mapping[row[column]]
        }));
    }

    /**
     * Polynomial features
     */
    polynomialFeatures(data, columns, degree = 2) {
        return data.map(row => {
            const newRow = { ...row };
            
            // Add polynomial terms
            for (const col of columns) {
                for (let d = 2; d <= degree; d++) {
                    newRow[`${col}^${d}`] = Math.pow(row[col], d);
                }
            }
            
            // Add interaction terms
            for (let i = 0; i < columns.length; i++) {
                for (let j = i + 1; j < columns.length; j++) {
                    newRow[`${columns[i]}*${columns[j]}`] = row[columns[i]] * row[columns[j]];
                }
            }
            
            return newRow;
        });
    }

    /**
     * Binning/Discretization
     */
    binning(data, column, bins = 10, labels = null) {
        const values = data.map(row => row[column]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = (max - min) / bins;
        
        return data.map(row => {
            const binIndex = Math.min(
                Math.floor((row[column] - min) / binWidth),
                bins - 1
            );
            
            return {
                ...row,
                [`${column}_bin`]: labels ? labels[binIndex] : binIndex
            };
        });
    }

    /**
     * Date/Time features
     */
    dateTimeFeatures(data, column) {
        return data.map(row => {
            const date = new Date(row[column]);
            
            return {
                ...row,
                [`${column}_year`]: date.getFullYear(),
                [`${column}_month`]: date.getMonth() + 1,
                [`${column}_day`]: date.getDate(),
                [`${column}_dayOfWeek`]: date.getDay(),
                [`${column}_hour`]: date.getHours(),
                [`${column}_isWeekend`]: date.getDay() === 0 || date.getDay() === 6 ? 1 : 0
            };
        });
    }

    /**
     * Text features (basic)
     */
    textFeatures(data, column) {
        return data.map(row => {
            const text = String(row[column] || '');
            
            return {
                ...row,
                [`${column}_length`]: text.length,
                [`${column}_wordCount`]: text.split(/\s+/).filter(w => w).length,
                [`${column}_sentenceCount`]: text.split(/[.!?]+/).filter(s => s.trim()).length,
                [`${column}_hasNumbers`]: /\d/.test(text) ? 1 : 0,
                [`${column}_avgWordLength`]: text.length / (text.split(/\s+/).length || 1)
            };
        });
    }

    /**
     * Aggregation features
     */
    aggregateFeatures(data, groupColumn, valueColumn, aggs = ['mean', 'sum', 'count']) {
        // Group data
        const groups = new Map();
        for (const row of data) {
            const key = row[groupColumn];
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(row[valueColumn]);
        }
        
        // Calculate aggregates
        const aggregates = new Map();
        for (const [key, values] of groups) {
            const agg = {};
            
            if (aggs.includes('mean')) {
                agg.mean = values.reduce((a, b) => a + b, 0) / values.length;
            }
            if (aggs.includes('sum')) {
                agg.sum = values.reduce((a, b) => a + b, 0);
            }
            if (aggs.includes('count')) {
                agg.count = values.length;
            }
            if (aggs.includes('min')) {
                agg.min = Math.min(...values);
            }
            if (aggs.includes('max')) {
                agg.max = Math.max(...values);
            }
            if (aggs.includes('std')) {
                const mean = values.reduce((a, b) => a + b, 0) / values.length;
                agg.std = Math.sqrt(
                    values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
                );
            }
            
            aggregates.set(key, agg);
        }
        
        // Add to data
        return data.map(row => {
            const agg = aggregates.get(row[groupColumn]) || {};
            const newRow = { ...row };
            
            for (const [aggName, value] of Object.entries(agg)) {
                newRow[`${valueColumn}_${aggName}_by_${groupColumn}`] = value;
            }
            
            return newRow;
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAIN/TEST SPLIT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Split data into train/test sets
 */
function trainTestSplit(data, options = {}) {
    const { testSize = 0.2, shuffle = true, randomState = null } = options;
    
    let indices = Array.from({ length: data.length }, (_, i) => i);
    
    if (shuffle) {
        // Simple shuffle (could use seedable random for reproducibility)
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
    }
    
    const splitIndex = Math.floor(data.length * (1 - testSize));
    
    const trainIndices = indices.slice(0, splitIndex);
    const testIndices = indices.slice(splitIndex);
    
    return {
        train: trainIndices.map(i => data[i]),
        test: testIndices.map(i => data[i]),
        trainIndices,
        testIndices
    };
}

/**
 * K-Fold cross validation splits
 */
function kFoldSplit(data, k = 5, shuffle = true) {
    let indices = Array.from({ length: data.length }, (_, i) => i);
    
    if (shuffle) {
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
    }
    
    const foldSize = Math.ceil(data.length / k);
    const folds = [];
    
    for (let i = 0; i < k; i++) {
        const testStart = i * foldSize;
        const testEnd = Math.min(testStart + foldSize, data.length);
        
        const testIndices = indices.slice(testStart, testEnd);
        const trainIndices = [...indices.slice(0, testStart), ...indices.slice(testEnd)];
        
        folds.push({
            fold: i + 1,
            train: trainIndices.map(idx => data[idx]),
            test: testIndices.map(idx => data[idx]),
            trainIndices,
            testIndices
        });
    }
    
    return folds;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    DataPipeline,
    DataLoader,
    FeatureEngineer,
    trainTestSplit,
    kFoldSplit,
    
    // Factory functions
    createPipeline: (options) => new DataPipeline(options),
    createLoader: (options) => new DataLoader(options),
    createFeatureEngineer: () => new FeatureEngineer()
};

console.log('✅ Step 4/50: ML Pipeline Core loaded');
