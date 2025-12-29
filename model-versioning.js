/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 5/50: Model Versioning                             ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Track model versions, artifacts, and experiment lineage
 * @phase 1 - Enterprise Foundation
 * @step 5 of 50
 */

'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// MODEL VERSION CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ModelVersionControl - Git-like versioning for ML models
 */
class ModelVersionControl extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            repositoryPath: options.repositoryPath || './models',
            metadataFile: options.metadataFile || 'models.json',
            artifactDir: options.artifactDir || 'artifacts',
            ...options
        };
        
        this.metadata = {
            models: {},
            experiments: {},
            tags: {},
            lineage: []
        };
        
        this._ensureRepository();
        this._loadMetadata();
    }

    /**
     * Ensure repository structure exists
     */
    _ensureRepository() {
        const dirs = [
            this.options.repositoryPath,
            path.join(this.options.repositoryPath, this.options.artifactDir),
            path.join(this.options.repositoryPath, 'checkpoints'),
            path.join(this.options.repositoryPath, 'exports')
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    /**
     * Load metadata from file
     */
    _loadMetadata() {
        const metaPath = path.join(this.options.repositoryPath, this.options.metadataFile);
        
        if (fs.existsSync(metaPath)) {
            try {
                this.metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            } catch (error) {
                console.warn('Failed to load metadata, starting fresh');
            }
        }
    }

    /**
     * Save metadata to file
     */
    _saveMetadata() {
        const metaPath = path.join(this.options.repositoryPath, this.options.metadataFile);
        fs.writeFileSync(metaPath, JSON.stringify(this.metadata, null, 2));
    }

    /**
     * Register new model
     */
    registerModel(name, description = '', schema = {}) {
        if (!this.metadata.models[name]) {
            this.metadata.models[name] = {
                name,
                description,
                schema,
                createdAt: new Date().toISOString(),
                versions: [],
                latestVersion: null
            };
            
            this._saveMetadata();
            this.emit('model:registered', { name });
        }
        
        return this.metadata.models[name];
    }

    /**
     * Create new version
     */
    async createVersion(modelName, data, options = {}) {
        const model = this.metadata.models[modelName];
        if (!model) {
            throw new Error(`Model '${modelName}' not registered`);
        }
        
        // Generate version ID
        const versionNum = model.versions.length + 1;
        const versionId = `v${versionNum}.0.0`;
        const hash = this._generateHash(data);
        
        const version = {
            id: versionId,
            hash,
            createdAt: new Date().toISOString(),
            createdBy: options.author || 'system',
            description: options.description || '',
            metrics: options.metrics || {},
            hyperparameters: options.hyperparameters || {},
            tags: options.tags || [],
            artifacts: [],
            parentVersion: model.latestVersion,
            status: 'draft'
        };
        
        // Save artifact
        const artifactPath = await this._saveArtifact(modelName, versionId, data);
        version.artifacts.push({
            type: 'model',
            path: artifactPath,
            size: Buffer.byteLength(JSON.stringify(data)),
            hash
        });
        
        // Update metadata
        model.versions.push(version);
        model.latestVersion = versionId;
        
        // Track lineage
        this.metadata.lineage.push({
            type: 'version_created',
            modelName,
            versionId,
            parentVersion: version.parentVersion,
            timestamp: version.createdAt
        });
        
        this._saveMetadata();
        this.emit('version:created', { modelName, versionId });
        
        return version;
    }

    /**
     * Save artifact to disk
     */
    async _saveArtifact(modelName, versionId, data) {
        const artifactDir = path.join(
            this.options.repositoryPath, 
            this.options.artifactDir,
            modelName
        );
        
        if (!fs.existsSync(artifactDir)) {
            fs.mkdirSync(artifactDir, { recursive: true });
        }
        
        const filename = `${versionId}.json`;
        const filepath = path.join(artifactDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        
        return filepath;
    }

    /**
     * Generate hash for artifact
     */
    _generateHash(data) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 12);
    }

    /**
     * Get version
     */
    getVersion(modelName, versionId = null) {
        const model = this.metadata.models[modelName];
        if (!model) return null;
        
        const version = versionId || model.latestVersion;
        return model.versions.find(v => v.id === version);
    }

    /**
     * Load model artifact
     */
    async loadVersion(modelName, versionId = null) {
        const version = this.getVersion(modelName, versionId);
        if (!version) {
            throw new Error(`Version not found`);
        }
        
        const artifact = version.artifacts.find(a => a.type === 'model');
        if (!artifact) {
            throw new Error('Model artifact not found');
        }
        
        const data = JSON.parse(fs.readFileSync(artifact.path, 'utf8'));
        return { version, data };
    }

    /**
     * Promote version to production
     */
    promoteVersion(modelName, versionId, stage = 'production') {
        const model = this.metadata.models[modelName];
        const version = model?.versions.find(v => v.id === versionId);
        
        if (!version) {
            throw new Error('Version not found');
        }
        
        // Demote current production version
        for (const v of model.versions) {
            if (v.status === stage) {
                v.status = 'archived';
            }
        }
        
        version.status = stage;
        version.promotedAt = new Date().toISOString();
        
        this.metadata.lineage.push({
            type: 'version_promoted',
            modelName,
            versionId,
            stage,
            timestamp: version.promotedAt
        });
        
        this._saveMetadata();
        this.emit('version:promoted', { modelName, versionId, stage });
        
        return version;
    }

    /**
     * Tag version
     */
    tagVersion(modelName, versionId, tag) {
        const key = `${modelName}:${tag}`;
        this.metadata.tags[key] = {
            modelName,
            versionId,
            tag,
            createdAt: new Date().toISOString()
        };
        
        this._saveMetadata();
        return this.metadata.tags[key];
    }

    /**
     * Get version by tag
     */
    getVersionByTag(modelName, tag) {
        const key = `${modelName}:${tag}`;
        const tagInfo = this.metadata.tags[key];
        
        if (!tagInfo) return null;
        return this.getVersion(modelName, tagInfo.versionId);
    }

    /**
     * Compare versions
     */
    compareVersions(modelName, versionA, versionB) {
        const verA = this.getVersion(modelName, versionA);
        const verB = this.getVersion(modelName, versionB);
        
        if (!verA || !verB) {
            throw new Error('One or both versions not found');
        }
        
        return {
            versionA: verA.id,
            versionB: verB.id,
            metrics: {
                versionA: verA.metrics,
                versionB: verB.metrics,
                diff: this._calculateMetricsDiff(verA.metrics, verB.metrics)
            },
            hyperparameters: {
                versionA: verA.hyperparameters,
                versionB: verB.hyperparameters,
                diff: this._diffObjects(verA.hyperparameters, verB.hyperparameters)
            }
        };
    }

    /**
     * Calculate metrics difference
     */
    _calculateMetricsDiff(metricsA, metricsB) {
        const diff = {};
        const allKeys = new Set([...Object.keys(metricsA), ...Object.keys(metricsB)]);
        
        for (const key of allKeys) {
            const a = metricsA[key] || 0;
            const b = metricsB[key] || 0;
            
            diff[key] = {
                absolute: b - a,
                relative: a !== 0 ? ((b - a) / a) * 100 : null,
                improved: b > a
            };
        }
        
        return diff;
    }

    /**
     * Diff two objects
     */
    _diffObjects(objA, objB) {
        const diff = { added: {}, removed: {}, changed: {} };
        
        for (const key of Object.keys(objB)) {
            if (!(key in objA)) {
                diff.added[key] = objB[key];
            } else if (objA[key] !== objB[key]) {
                diff.changed[key] = { from: objA[key], to: objB[key] };
            }
        }
        
        for (const key of Object.keys(objA)) {
            if (!(key in objB)) {
                diff.removed[key] = objA[key];
            }
        }
        
        return diff;
    }

    /**
     * Get model history
     */
    getHistory(modelName, limit = 10) {
        return this.metadata.lineage
            .filter(l => l.modelName === modelName)
            .slice(-limit)
            .reverse();
    }

    /**
     * List all models
     */
    listModels() {
        return Object.values(this.metadata.models).map(m => ({
            name: m.name,
            description: m.description,
            versionCount: m.versions.length,
            latestVersion: m.latestVersion,
            createdAt: m.createdAt
        }));
    }

    /**
     * Delete version
     */
    deleteVersion(modelName, versionId) {
        const model = this.metadata.models[modelName];
        const versionIndex = model?.versions.findIndex(v => v.id === versionId);
        
        if (versionIndex === -1) {
            throw new Error('Version not found');
        }
        
        const version = model.versions[versionIndex];
        
        // Don't delete production versions
        if (version.status === 'production') {
            throw new Error('Cannot delete production version');
        }
        
        // Delete artifacts
        for (const artifact of version.artifacts) {
            if (fs.existsSync(artifact.path)) {
                fs.unlinkSync(artifact.path);
            }
        }
        
        model.versions.splice(versionIndex, 1);
        
        if (model.latestVersion === versionId) {
            model.latestVersion = model.versions.length > 0 ? 
                model.versions[model.versions.length - 1].id : null;
        }
        
        this._saveMetadata();
        this.emit('version:deleted', { modelName, versionId });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIMENT TRACKER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ExperimentTracker - Track ML experiments
 */
class ExperimentTracker extends EventEmitter {
    constructor(mvc) {
        super();
        this.mvc = mvc;
        this.activeExperiment = null;
    }

    /**
     * Start new experiment
     */
    startExperiment(name, options = {}) {
        const id = `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        this.activeExperiment = {
            id,
            name,
            description: options.description || '',
            startedAt: new Date().toISOString(),
            endedAt: null,
            status: 'running',
            parameters: options.parameters || {},
            metrics: {},
            logs: [],
            artifacts: [],
            tags: options.tags || []
        };
        
        this.mvc.metadata.experiments[id] = this.activeExperiment;
        this.mvc._saveMetadata();
        
        this.emit('experiment:started', { id, name });
        return this.activeExperiment;
    }

    /**
     * Log parameter
     */
    logParam(key, value) {
        if (!this.activeExperiment) {
            throw new Error('No active experiment');
        }
        
        this.activeExperiment.parameters[key] = value;
        this.mvc._saveMetadata();
        
        return this;
    }

    /**
     * Log params (bulk)
     */
    logParams(params) {
        for (const [key, value] of Object.entries(params)) {
            this.logParam(key, value);
        }
        return this;
    }

    /**
     * Log metric
     */
    logMetric(key, value, step = null) {
        if (!this.activeExperiment) {
            throw new Error('No active experiment');
        }
        
        if (!this.activeExperiment.metrics[key]) {
            this.activeExperiment.metrics[key] = [];
        }
        
        this.activeExperiment.metrics[key].push({
            value,
            step,
            timestamp: new Date().toISOString()
        });
        
        this.emit('metric:logged', { key, value, step });
        return this;
    }

    /**
     * Log metrics (bulk)
     */
    logMetrics(metrics, step = null) {
        for (const [key, value] of Object.entries(metrics)) {
            this.logMetric(key, value, step);
        }
        return this;
    }

    /**
     * Log text message
     */
    log(message, level = 'info') {
        if (!this.activeExperiment) return this;
        
        this.activeExperiment.logs.push({
            message,
            level,
            timestamp: new Date().toISOString()
        });
        
        return this;
    }

    /**
     * Log artifact
     */
    logArtifact(name, data, type = 'json') {
        if (!this.activeExperiment) {
            throw new Error('No active experiment');
        }
        
        const artifactDir = path.join(
            this.mvc.options.repositoryPath,
            'experiments',
            this.activeExperiment.id
        );
        
        if (!fs.existsSync(artifactDir)) {
            fs.mkdirSync(artifactDir, { recursive: true });
        }
        
        const filename = `${name}.${type}`;
        const filepath = path.join(artifactDir, filename);
        
        if (type === 'json') {
            fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        } else {
            fs.writeFileSync(filepath, String(data));
        }
        
        this.activeExperiment.artifacts.push({
            name,
            path: filepath,
            type,
            timestamp: new Date().toISOString()
        });
        
        return this;
    }

    /**
     * End experiment
     */
    endExperiment(status = 'completed') {
        if (!this.activeExperiment) {
            throw new Error('No active experiment');
        }
        
        this.activeExperiment.endedAt = new Date().toISOString();
        this.activeExperiment.status = status;
        
        // Calculate final metrics
        for (const [key, values] of Object.entries(this.activeExperiment.metrics)) {
            const nums = values.map(v => v.value);
            this.activeExperiment.metrics[key] = {
                history: values,
                final: nums[nums.length - 1],
                best: Math.max(...nums),
                mean: nums.reduce((a, b) => a + b, 0) / nums.length
            };
        }
        
        this.mvc._saveMetadata();
        
        const exp = this.activeExperiment;
        this.activeExperiment = null;
        
        this.emit('experiment:ended', { id: exp.id, status });
        return exp;
    }

    /**
     * Get experiment
     */
    getExperiment(id) {
        return this.mvc.metadata.experiments[id];
    }

    /**
     * List experiments
     */
    listExperiments(filters = {}) {
        let experiments = Object.values(this.mvc.metadata.experiments);
        
        if (filters.status) {
            experiments = experiments.filter(e => e.status === filters.status);
        }
        
        if (filters.tag) {
            experiments = experiments.filter(e => e.tags.includes(filters.tag));
        }
        
        return experiments
            .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
            .slice(0, filters.limit || 50);
    }

    /**
     * Compare experiments
     */
    compareExperiments(expIds) {
        const experiments = expIds.map(id => this.getExperiment(id)).filter(Boolean);
        
        if (experiments.length < 2) {
            throw new Error('Need at least 2 experiments to compare');
        }
        
        const allMetrics = new Set();
        for (const exp of experiments) {
            for (const key of Object.keys(exp.metrics)) {
                allMetrics.add(key);
            }
        }
        
        const comparison = {
            experiments: experiments.map(e => ({
                id: e.id,
                name: e.name,
                status: e.status
            })),
            metrics: {}
        };
        
        for (const metric of allMetrics) {
            comparison.metrics[metric] = experiments.map(e => ({
                experimentId: e.id,
                value: e.metrics[metric]?.final || null
            }));
            
            // Find best
            const values = comparison.metrics[metric].filter(v => v.value !== null);
            if (values.length > 0) {
                const best = values.reduce((a, b) => a.value > b.value ? a : b);
                comparison.metrics[metric].forEach(v => {
                    v.isBest = v.experimentId === best.experimentId;
                });
            }
        }
        
        return comparison;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARTIFACT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ArtifactManager - Manage model artifacts
 */
class ArtifactManager {
    constructor(basePath = './artifacts') {
        this.basePath = basePath;
        
        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath, { recursive: true });
        }
    }

    /**
     * Save artifact
     */
    save(name, data, options = {}) {
        const { format = 'json', compress = false } = options;
        const filename = `${name}.${format}`;
        const filepath = path.join(this.basePath, filename);
        
        let content;
        if (format === 'json') {
            content = JSON.stringify(data, null, compress ? 0 : 2);
        } else {
            content = String(data);
        }
        
        fs.writeFileSync(filepath, content);
        
        return {
            name,
            path: filepath,
            size: Buffer.byteLength(content),
            hash: crypto.createHash('md5').update(content).digest('hex'),
            createdAt: new Date().toISOString()
        };
    }

    /**
     * Load artifact
     */
    load(name, format = 'json') {
        const filepath = path.join(this.basePath, `${name}.${format}`);
        
        if (!fs.existsSync(filepath)) {
            throw new Error(`Artifact not found: ${name}`);
        }
        
        const content = fs.readFileSync(filepath, 'utf8');
        
        if (format === 'json') {
            return JSON.parse(content);
        }
        
        return content;
    }

    /**
     * List artifacts
     */
    list(pattern = '*') {
        const files = fs.readdirSync(this.basePath);
        const regex = new RegExp(pattern.replace('*', '.*'));
        
        return files
            .filter(f => regex.test(f))
            .map(f => {
                const filepath = path.join(this.basePath, f);
                const stats = fs.statSync(filepath);
                
                return {
                    name: path.basename(f, path.extname(f)),
                    filename: f,
                    size: stats.size,
                    createdAt: stats.birthtime.toISOString()
                };
            });
    }

    /**
     * Delete artifact
     */
    delete(name, format = 'json') {
        const filepath = path.join(this.basePath, `${name}.${format}`);
        
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            return true;
        }
        
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    ModelVersionControl,
    ExperimentTracker,
    ArtifactManager,
    
    // Factory functions
    createMVC: (options) => {
        const mvc = new ModelVersionControl(options);
        const tracker = new ExperimentTracker(mvc);
        return { mvc, tracker };
    },
    
    createArtifactManager: (basePath) => new ArtifactManager(basePath)
};

console.log('✅ Step 5/50: Model Versioning loaded');
