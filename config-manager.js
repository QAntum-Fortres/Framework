/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 6/50: Configuration Manager                        ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Centralized configuration management with validation, hot-reload
 * @phase 1 - Enterprise Foundation
 * @step 6 of 50
 */

'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ConfigSchema - Define and validate configuration
 */
class ConfigSchema {
    constructor() {
        this.schema = {};
        this.validators = {
            string: (v) => typeof v === 'string',
            number: (v) => typeof v === 'number' && !isNaN(v),
            boolean: (v) => typeof v === 'boolean',
            array: (v) => Array.isArray(v),
            object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
            integer: (v) => Number.isInteger(v),
            float: (v) => typeof v === 'number' && !Number.isInteger(v),
            email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
            url: (v) => /^https?:\/\//.test(v),
            path: (v) => typeof v === 'string' && v.length > 0,
            enum: (v, opts) => opts.includes(v),
            range: (v, min, max) => v >= min && v <= max
        };
    }

    /**
     * Define configuration field
     */
    define(key, options = {}) {
        this.schema[key] = {
            type: options.type || 'string',
            required: options.required !== false,
            default: options.default,
            validator: options.validator,
            description: options.description || '',
            options: options.options, // For enum type
            min: options.min,
            max: options.max,
            sensitive: options.sensitive || false, // For masking in logs
            env: options.env // Environment variable mapping
        };
        
        return this;
    }

    /**
     * Define nested configuration
     */
    defineNested(prefix, fields) {
        for (const [key, options] of Object.entries(fields)) {
            this.define(`${prefix}.${key}`, options);
        }
        return this;
    }

    /**
     * Validate configuration
     */
    validate(config) {
        const errors = [];
        const warnings = [];
        
        for (const [key, spec] of Object.entries(this.schema)) {
            const value = this._getNestedValue(config, key);
            
            // Check required
            if (spec.required && value === undefined) {
                // Check if env var is set
                if (spec.env && process.env[spec.env]) {
                    continue;
                }
                errors.push({ key, message: 'Required field missing' });
                continue;
            }
            
            if (value === undefined) continue;
            
            // Type validation
            const typeValidator = this.validators[spec.type];
            if (typeValidator) {
                let isValid;
                
                if (spec.type === 'enum') {
                    isValid = typeValidator(value, spec.options || []);
                } else if (spec.type === 'range') {
                    isValid = typeValidator(value, spec.min, spec.max);
                } else {
                    isValid = typeValidator(value);
                }
                
                if (!isValid) {
                    errors.push({
                        key,
                        message: `Invalid type: expected ${spec.type}, got ${typeof value}`
                    });
                }
            }
            
            // Custom validator
            if (spec.validator && typeof spec.validator === 'function') {
                const result = spec.validator(value);
                if (result !== true) {
                    errors.push({
                        key,
                        message: result || 'Custom validation failed'
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Get nested value from object
     */
    _getNestedValue(obj, key) {
        return key.split('.').reduce((o, k) => o?.[k], obj);
    }

    /**
     * Apply defaults
     */
    applyDefaults(config) {
        const result = JSON.parse(JSON.stringify(config));
        
        for (const [key, spec] of Object.entries(this.schema)) {
            const current = this._getNestedValue(result, key);
            
            if (current === undefined) {
                // Check env var first
                if (spec.env && process.env[spec.env]) {
                    this._setNestedValue(result, key, this._parseEnvValue(process.env[spec.env], spec.type));
                } else if (spec.default !== undefined) {
                    this._setNestedValue(result, key, spec.default);
                }
            }
        }
        
        return result;
    }

    /**
     * Set nested value
     */
    _setNestedValue(obj, key, value) {
        const parts = key.split('.');
        const last = parts.pop();
        let current = obj;
        
        for (const part of parts) {
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        
        current[last] = value;
    }

    /**
     * Parse environment variable value
     */
    _parseEnvValue(value, type) {
        switch (type) {
            case 'number':
            case 'integer':
            case 'float':
                return Number(value);
            case 'boolean':
                return value.toLowerCase() === 'true';
            case 'array':
                return value.split(',').map(v => v.trim());
            case 'object':
                try { return JSON.parse(value); }
                catch { return {}; }
            default:
                return value;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ConfigurationManager - Central config management
 */
class ConfigurationManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            configPath: options.configPath || './config',
            watchForChanges: options.watchForChanges !== false,
            reloadInterval: options.reloadInterval || 30000, // 30 seconds
            ...options
        };
        
        this.configs = new Map();
        this.schemas = new Map();
        this.watchers = new Map();
        this.cache = new Map();
        this.history = [];
    }

    /**
     * Register configuration schema
     */
    registerSchema(name, schema) {
        if (!(schema instanceof ConfigSchema)) {
            const configSchema = new ConfigSchema();
            for (const [key, options] of Object.entries(schema)) {
                configSchema.define(key, options);
            }
            schema = configSchema;
        }
        
        this.schemas.set(name, schema);
        return this;
    }

    /**
     * Load configuration from file
     */
    load(name, filePath = null) {
        const configFile = filePath || path.join(this.options.configPath, `${name}.json`);
        
        if (!fs.existsSync(configFile)) {
            console.warn(`Config file not found: ${configFile}`);
            return this._getDefaultConfig(name);
        }
        
        try {
            const content = fs.readFileSync(configFile, 'utf8');
            let config = JSON.parse(content);
            
            // Apply schema defaults
            const schema = this.schemas.get(name);
            if (schema) {
                config = schema.applyDefaults(config);
            }
            
            this.configs.set(name, config);
            this.cache.set(name, {
                data: config,
                loadedAt: Date.now(),
                source: configFile
            });
            
            // Setup watcher
            if (this.options.watchForChanges) {
                this._setupWatcher(name, configFile);
            }
            
            this.emit('config:loaded', { name, source: configFile });
            return config;
            
        } catch (error) {
            this.emit('config:error', { name, error: error.message });
            throw error;
        }
    }

    /**
     * Get default config from schema
     */
    _getDefaultConfig(name) {
        const schema = this.schemas.get(name);
        if (!schema) return {};
        
        return schema.applyDefaults({});
    }

    /**
     * Setup file watcher for hot-reload
     */
    _setupWatcher(name, filePath) {
        if (this.watchers.has(name)) {
            this.watchers.get(name).close();
        }
        
        try {
            const watcher = fs.watch(filePath, (event) => {
                if (event === 'change') {
                    this._onConfigChange(name, filePath);
                }
            });
            
            this.watchers.set(name, watcher);
        } catch (error) {
            console.warn(`Failed to setup watcher for ${name}:`, error.message);
        }
    }

    /**
     * Handle config file change
     */
    _onConfigChange(name, filePath) {
        const oldConfig = this.configs.get(name);
        
        try {
            const newConfig = this.load(name, filePath);
            
            // Track history
            this.history.push({
                name,
                timestamp: Date.now(),
                changes: this._diffConfigs(oldConfig, newConfig)
            });
            
            // Keep history limited
            if (this.history.length > 100) {
                this.history = this.history.slice(-100);
            }
            
            this.emit('config:changed', { 
                name, 
                oldConfig, 
                newConfig,
                changes: this._diffConfigs(oldConfig, newConfig)
            });
            
        } catch (error) {
            this.emit('config:reload-error', { name, error: error.message });
        }
    }

    /**
     * Diff two configs
     */
    _diffConfigs(oldConfig, newConfig) {
        const changes = { added: [], removed: [], modified: [] };
        
        const flatten = (obj, prefix = '') => {
            const result = {};
            for (const [key, value] of Object.entries(obj || {})) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    Object.assign(result, flatten(value, fullKey));
                } else {
                    result[fullKey] = value;
                }
            }
            return result;
        };
        
        const flatOld = flatten(oldConfig);
        const flatNew = flatten(newConfig);
        
        for (const key of Object.keys(flatNew)) {
            if (!(key in flatOld)) {
                changes.added.push({ key, value: flatNew[key] });
            } else if (JSON.stringify(flatOld[key]) !== JSON.stringify(flatNew[key])) {
                changes.modified.push({
                    key,
                    oldValue: flatOld[key],
                    newValue: flatNew[key]
                });
            }
        }
        
        for (const key of Object.keys(flatOld)) {
            if (!(key in flatNew)) {
                changes.removed.push({ key, value: flatOld[key] });
            }
        }
        
        return changes;
    }

    /**
     * Get configuration
     */
    get(name, key = null) {
        const config = this.configs.get(name);
        
        if (!config) {
            return key ? undefined : {};
        }
        
        if (!key) return config;
        
        return key.split('.').reduce((obj, k) => obj?.[k], config);
    }

    /**
     * Set configuration value
     */
    set(name, key, value) {
        let config = this.configs.get(name) || {};
        
        const parts = key.split('.');
        const last = parts.pop();
        let current = config;
        
        for (const part of parts) {
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        
        const oldValue = current[last];
        current[last] = value;
        
        this.configs.set(name, config);
        
        this.emit('config:updated', { name, key, oldValue, newValue: value });
        
        return this;
    }

    /**
     * Save configuration to file
     */
    save(name, filePath = null) {
        const config = this.configs.get(name);
        if (!config) {
            throw new Error(`No config loaded for: ${name}`);
        }
        
        const targetPath = filePath || path.join(this.options.configPath, `${name}.json`);
        const dir = path.dirname(targetPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(targetPath, JSON.stringify(config, null, 2));
        
        this.emit('config:saved', { name, path: targetPath });
        return targetPath;
    }

    /**
     * Validate configuration
     */
    validate(name) {
        const config = this.configs.get(name);
        const schema = this.schemas.get(name);
        
        if (!schema) {
            return { valid: true, errors: [], warnings: ['No schema defined'] };
        }
        
        return schema.validate(config);
    }

    /**
     * Merge configurations
     */
    merge(name, override, deep = true) {
        const base = this.configs.get(name) || {};
        
        const merged = deep ?
            this._deepMerge(base, override) :
            { ...base, ...override };
        
        this.configs.set(name, merged);
        
        return merged;
    }

    /**
     * Deep merge objects
     */
    _deepMerge(target, source) {
        const result = { ...target };
        
        for (const key of Object.keys(source)) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Export configuration (with sensitive values masked)
     */
    export(name, maskSensitive = true) {
        const config = this.configs.get(name);
        const schema = this.schemas.get(name);
        
        if (!config) return {};
        
        if (!maskSensitive || !schema) {
            return JSON.parse(JSON.stringify(config));
        }
        
        const exported = JSON.parse(JSON.stringify(config));
        
        for (const [key, spec] of Object.entries(schema.schema)) {
            if (spec.sensitive) {
                const parts = key.split('.');
                let current = exported;
                
                for (let i = 0; i < parts.length - 1; i++) {
                    current = current?.[parts[i]];
                }
                
                if (current && parts[parts.length - 1] in current) {
                    const value = current[parts[parts.length - 1]];
                    current[parts[parts.length - 1]] = value ? '****' : null;
                }
            }
        }
        
        return exported;
    }

    /**
     * Get configuration history
     */
    getHistory(name = null, limit = 20) {
        let history = this.history;
        
        if (name) {
            history = history.filter(h => h.name === name);
        }
        
        return history.slice(-limit);
    }

    /**
     * Reset configuration to defaults
     */
    reset(name) {
        const schema = this.schemas.get(name);
        if (schema) {
            this.configs.set(name, schema.applyDefaults({}));
        } else {
            this.configs.delete(name);
        }
        
        this.emit('config:reset', { name });
        return this;
    }

    /**
     * List all configurations
     */
    list() {
        return Array.from(this.configs.keys());
    }

    /**
     * Cleanup watchers
     */
    destroy() {
        for (const watcher of this.watchers.values()) {
            watcher.close();
        }
        this.watchers.clear();
        this.removeAllListeners();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * EnvironmentProfiles - Manage configs per environment
 */
class EnvironmentProfiles {
    constructor(configManager) {
        this.configManager = configManager;
        this.profiles = new Map();
        this.activeProfile = process.env.NODE_ENV || 'development';
    }

    /**
     * Define profile
     */
    defineProfile(name, config) {
        this.profiles.set(name, config);
        return this;
    }

    /**
     * Load profiles from directory
     */
    loadProfiles(dir) {
        const envFiles = ['development', 'staging', 'production', 'test'];
        
        for (const env of envFiles) {
            const filePath = path.join(dir, `${env}.json`);
            if (fs.existsSync(filePath)) {
                const config = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                this.profiles.set(env, config);
            }
        }
        
        return this;
    }

    /**
     * Switch to profile
     */
    switchProfile(name) {
        if (!this.profiles.has(name)) {
            throw new Error(`Profile not found: ${name}`);
        }
        
        this.activeProfile = name;
        return this.getActiveConfig();
    }

    /**
     * Get active config
     */
    getActiveConfig() {
        return this.profiles.get(this.activeProfile) || {};
    }

    /**
     * Get profile
     */
    getProfile(name) {
        return this.profiles.get(name);
    }

    /**
     * Apply profile to config manager
     */
    applyToManager(configName) {
        const profileConfig = this.getActiveConfig();
        this.configManager.merge(configName, profileConfig);
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Singleton instance
let instance = null;

module.exports = {
    // Primary Classes
    ConfigSchema,
    ConfigurationManager,
    EnvironmentProfiles,
    
    // Aliases for compatibility
    ConfigManager: ConfigurationManager,
    SchemaValidator: ConfigSchema,
    
    // Factory
    createManager: (options) => new ConfigurationManager(options),
    createSchema: () => new ConfigSchema(),
    
    // Singleton getter
    getConfigManager: (options = {}) => {
        if (!instance) {
            instance = new ConfigurationManager(options);
        }
        return instance;
    }
};

console.log('✅ Step 6/50: Configuration Manager loaded');
