/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 1/50: Environment Setup Base                       ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Base configuration for AI Training Framework
 * @phase 1 - Enterprise Foundation
 * @step 1 of 50
 */

'use strict';

const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * EnvironmentConfig - Central environment configuration manager
 */
class EnvironmentConfig extends EventEmitter {
    constructor() {
        super();
        
        // Default configurations
        this.config = {
            // ─────────────────────────────────────────────────────────────────
            // Core Paths
            // ─────────────────────────────────────────────────────────────────
            paths: {
                root: process.cwd(),
                models: path.join(process.cwd(), 'models'),
                data: path.join(process.cwd(), 'data'),
                logs: path.join(process.cwd(), 'logs'),
                cache: path.join(process.cwd(), '.cache'),
                artifacts: path.join(process.cwd(), 'artifacts'),
                checkpoints: path.join(process.cwd(), 'checkpoints'),
                exports: path.join(process.cwd(), 'exports')
            },
            
            // ─────────────────────────────────────────────────────────────────
            // Environment Settings
            // ─────────────────────────────────────────────────────────────────
            environment: {
                mode: process.env.NODE_ENV || 'development',
                debug: process.env.DEBUG === 'true',
                silent: process.env.SILENT === 'true',
                logLevel: process.env.LOG_LEVEL || 'info'
            },
            
            // ─────────────────────────────────────────────────────────────────
            // Cloud Configuration
            // ─────────────────────────────────────────────────────────────────
            cloud: {
                provider: process.env.CLOUD_PROVIDER || 'local', // aws, azure, gcp, local
                region: process.env.CLOUD_REGION || 'us-east-1',
                bucket: process.env.CLOUD_BUCKET || null,
                credentials: {
                    accessKey: process.env.CLOUD_ACCESS_KEY || null,
                    secretKey: process.env.CLOUD_SECRET_KEY || null
                }
            },
            
            // ─────────────────────────────────────────────────────────────────
            // Compute Resources
            // ─────────────────────────────────────────────────────────────────
            compute: {
                maxWorkers: parseInt(process.env.MAX_WORKERS) || require('os').cpus().length,
                maxMemory: process.env.MAX_MEMORY || '4gb',
                gpuEnabled: process.env.GPU_ENABLED === 'true',
                gpuDevices: process.env.GPU_DEVICES ? process.env.GPU_DEVICES.split(',') : [],
                batchSize: parseInt(process.env.BATCH_SIZE) || 32
            },
            
            // ─────────────────────────────────────────────────────────────────
            // API Keys (from .env)
            // ─────────────────────────────────────────────────────────────────
            api: {
                openai: process.env.OPENAI_API_KEY || null,
                anthropic: process.env.ANTHROPIC_API_KEY || null,
                google: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null,
                huggingface: process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || null,
                azure: process.env.AZURE_API_KEY || null
            },
            
            // ─────────────────────────────────────────────────────────────────
            // Training Defaults
            // ─────────────────────────────────────────────────────────────────
            training: {
                defaultEpochs: parseInt(process.env.DEFAULT_EPOCHS) || 100,
                learningRate: parseFloat(process.env.LEARNING_RATE) || 0.001,
                validationSplit: parseFloat(process.env.VALIDATION_SPLIT) || 0.2,
                earlyStopping: process.env.EARLY_STOPPING !== 'false',
                patience: parseInt(process.env.PATIENCE) || 10,
                checkpointFrequency: parseInt(process.env.CHECKPOINT_FREQ) || 5
            },
            
            // ─────────────────────────────────────────────────────────────────
            // Database Connections
            // ─────────────────────────────────────────────────────────────────
            database: {
                type: process.env.DB_TYPE || 'sqlite', // sqlite, postgres, mongodb
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT) || 5432,
                name: process.env.DB_NAME || 'training_framework',
                user: process.env.DB_USER || null,
                password: process.env.DB_PASSWORD || null
            },
            
            // ─────────────────────────────────────────────────────────────────
            // Feature Flags
            // ─────────────────────────────────────────────────────────────────
            features: {
                autoScaling: process.env.AUTO_SCALING === 'true',
                distributedTraining: process.env.DISTRIBUTED === 'true',
                experimentTracking: process.env.EXPERIMENT_TRACKING !== 'false',
                modelRegistry: process.env.MODEL_REGISTRY !== 'false',
                autoML: process.env.AUTO_ML === 'true'
            }
        };
        
        // Initialize directories
        this._ensureDirectories();
        
        // Load custom config if exists
        this._loadCustomConfig();
    }

    /**
     * Ensure all required directories exist
     */
    _ensureDirectories() {
        for (const [name, dirPath] of Object.entries(this.config.paths)) {
            if (name !== 'root' && !fs.existsSync(dirPath)) {
                try {
                    fs.mkdirSync(dirPath, { recursive: true });
                } catch (e) {
                    // Ignore errors in read-only environments
                }
            }
        }
    }

    /**
     * Load custom configuration from file
     */
    _loadCustomConfig() {
        const customConfigPath = path.join(this.config.paths.root, 'training.config.json');
        
        if (fs.existsSync(customConfigPath)) {
            try {
                const custom = JSON.parse(fs.readFileSync(customConfigPath, 'utf8'));
                this.config = this._deepMerge(this.config, custom);
                this.emit('config:loaded', customConfigPath);
            } catch (e) {
                this.emit('config:error', e);
            }
        }
    }

    /**
     * Deep merge objects
     */
    _deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Get configuration value by path
     * @example config.get('cloud.provider')
     */
    get(keyPath, defaultValue = null) {
        const keys = keyPath.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * Set configuration value by path
     * @example config.set('training.learningRate', 0.0001)
     */
    set(keyPath, value) {
        const keys = keyPath.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        const oldValue = current[keys[keys.length - 1]];
        current[keys[keys.length - 1]] = value;
        
        this.emit('config:changed', { path: keyPath, oldValue, newValue: value });
        return this;
    }

    /**
     * Check if API key is available
     */
    hasAPIKey(provider) {
        return !!this.config.api[provider];
    }

    /**
     * Get all available API providers
     */
    getAvailableProviders() {
        return Object.entries(this.config.api)
            .filter(([_, key]) => !!key)
            .map(([provider]) => provider);
    }

    /**
     * Validate configuration
     */
    validate() {
        const errors = [];
        const warnings = [];
        
        // Check required paths
        for (const [name, dirPath] of Object.entries(this.config.paths)) {
            if (name !== 'root' && !fs.existsSync(dirPath)) {
                warnings.push(`Directory not found: ${name} (${dirPath})`);
            }
        }
        
        // Check compute resources
        if (this.config.compute.maxWorkers < 1) {
            errors.push('maxWorkers must be at least 1');
        }
        
        // Check training params
        if (this.config.training.learningRate <= 0) {
            errors.push('learningRate must be positive');
        }
        
        if (this.config.training.validationSplit < 0 || this.config.training.validationSplit > 1) {
            errors.push('validationSplit must be between 0 and 1');
        }
        
        // Check API keys
        if (this.getAvailableProviders().length === 0) {
            warnings.push('No API keys configured - AI features will be limited');
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Export configuration
     */
    export() {
        return JSON.parse(JSON.stringify(this.config));
    }

    /**
     * Get environment summary
     */
    getSummary() {
        return {
            mode: this.config.environment.mode,
            cloud: this.config.cloud.provider,
            workers: this.config.compute.maxWorkers,
            gpu: this.config.compute.gpuEnabled,
            apiProviders: this.getAvailableProviders(),
            features: Object.entries(this.config.features)
                .filter(([_, enabled]) => enabled)
                .map(([feature]) => feature)
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

const config = new EnvironmentConfig();

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    config,
    EnvironmentConfig,
    
    // Convenience getters
    get: (path, defaultValue) => config.get(path, defaultValue),
    set: (path, value) => config.set(path, value),
    validate: () => config.validate(),
    getSummary: () => config.getSummary()
};

// ═══════════════════════════════════════════════════════════════════════════════
// STARTUP LOG
// ═══════════════════════════════════════════════════════════════════════════════

if (!config.get('environment.silent')) {
    console.log(`
┌─────────────────────────────────────────────────────────────────┐
│  📦 Training Framework - Step 1/50: Environment Config          │
│  ─────────────────────────────────────────────────────────────  │
│  Mode: ${config.get('environment.mode').padEnd(15)} Cloud: ${config.get('cloud.provider').padEnd(10)} │
│  Workers: ${String(config.get('compute.maxWorkers')).padEnd(12)} GPU: ${config.get('compute.gpuEnabled') ? 'Yes' : 'No '}          │
│  API Providers: ${config.getAvailableProviders().join(', ') || 'None'}
└─────────────────────────────────────────────────────────────────┘
`);
}
