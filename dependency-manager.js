/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 2/50: Dependency Manager                           ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description ML library version control and dependency management
 * @phase 1 - Enterprise Foundation
 * @step 2 of 50
 */

'use strict';

const EventEmitter = require('events');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// DEPENDENCY MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DependencyManager - Manages ML library versions and dependencies
 */
class DependencyManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            packageManager: options.packageManager || 'npm', // npm, yarn, pnpm
            pythonManager: options.pythonManager || 'pip', // pip, conda
            lockfileEnabled: options.lockfileEnabled !== false,
            autoUpdate: options.autoUpdate || false,
            cacheDir: options.cacheDir || path.join(process.cwd(), '.dep-cache'),
            ...options
        };
        
        // Track installed dependencies
        this.dependencies = {
            node: new Map(),
            python: new Map(),
            system: new Map()
        };
        
        // Required ML dependencies
        this.requiredDeps = {
            node: {
                // Core ML
                '@tensorflow/tfjs': '^4.0.0',
                '@tensorflow/tfjs-node': '^4.0.0',
                'onnxruntime-node': '^1.14.0',
                
                // Utilities
                'sharp': '^0.32.0',
                'jimp': '^0.22.0',
                'natural': '^6.0.0',
                
                // AI APIs
                'openai': '^4.0.0',
                '@anthropic-ai/sdk': '^0.6.0',
                '@google/generative-ai': '^0.1.0'
            },
            python: {
                // Core ML
                'numpy': '>=1.24.0',
                'pandas': '>=2.0.0',
                'scikit-learn': '>=1.3.0',
                'torch': '>=2.0.0',
                'tensorflow': '>=2.13.0',
                
                // NLP
                'transformers': '>=4.30.0',
                'tokenizers': '>=0.13.0',
                
                // Vision
                'opencv-python': '>=4.8.0',
                'pillow': '>=10.0.0'
            }
        };
        
        // Compatibility matrix
        this.compatibilityMatrix = new Map();
        this._initCompatibilityMatrix();
        
        // Load cached dependency info
        this._loadCache();
    }

    /**
     * Initialize compatibility matrix
     */
    _initCompatibilityMatrix() {
        // Node.js compatibility
        this.compatibilityMatrix.set('node', {
            '@tensorflow/tfjs-node': {
                '18.x': '^4.0.0',
                '20.x': '^4.0.0',
                '21.x': '^4.0.0'
            },
            'onnxruntime-node': {
                '18.x': '^1.14.0',
                '20.x': '^1.16.0',
                '21.x': '^1.16.0'
            }
        });
        
        // Python compatibility
        this.compatibilityMatrix.set('python', {
            'torch': {
                '3.9': '>=2.0.0',
                '3.10': '>=2.0.0',
                '3.11': '>=2.0.0',
                '3.12': '>=2.1.0'
            },
            'tensorflow': {
                '3.9': '>=2.13.0',
                '3.10': '>=2.13.0',
                '3.11': '>=2.14.0',
                '3.12': '>=2.15.0'
            }
        });
    }

    /**
     * Load dependency cache
     */
    _loadCache() {
        const cachePath = path.join(this.options.cacheDir, 'dependencies.json');
        
        if (fs.existsSync(cachePath)) {
            try {
                const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
                
                for (const [type, deps] of Object.entries(cache)) {
                    if (this.dependencies[type]) {
                        for (const [name, info] of Object.entries(deps)) {
                            this.dependencies[type].set(name, info);
                        }
                    }
                }
            } catch (e) {
                // Ignore cache errors
            }
        }
    }

    /**
     * Save dependency cache
     */
    _saveCache() {
        if (!fs.existsSync(this.options.cacheDir)) {
            fs.mkdirSync(this.options.cacheDir, { recursive: true });
        }
        
        const cachePath = path.join(this.options.cacheDir, 'dependencies.json');
        const cacheData = {};
        
        for (const [type, deps] of Object.entries(this.dependencies)) {
            cacheData[type] = Object.fromEntries(deps);
        }
        
        fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    }

    /**
     * Check if a Node.js package is installed
     */
    checkNodePackage(packageName) {
        try {
            const packagePath = require.resolve(packageName);
            const packageJson = require(`${packageName}/package.json`);
            
            return {
                installed: true,
                version: packageJson.version,
                path: packagePath
            };
        } catch (e) {
            return { installed: false, version: null, path: null };
        }
    }

    /**
     * Check if a Python package is installed
     */
    checkPythonPackage(packageName) {
        try {
            const result = execSync(
                `python -c "import ${packageName.replace('-', '_')}; print(${packageName.replace('-', '_')}.__version__)"`,
                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
            ).trim();
            
            return { installed: true, version: result };
        } catch (e) {
            return { installed: false, version: null };
        }
    }

    /**
     * Get Node.js version
     */
    getNodeVersion() {
        return process.version;
    }

    /**
     * Get Python version
     */
    getPythonVersion() {
        try {
            return execSync('python --version', { encoding: 'utf8' })
                .trim()
                .replace('Python ', '');
        } catch (e) {
            return null;
        }
    }

    /**
     * Install Node.js package
     */
    async installNodePackage(packageName, version = 'latest') {
        const packageSpec = version === 'latest' ? packageName : `${packageName}@${version}`;
        
        this.emit('install:start', { type: 'node', package: packageName });
        
        try {
            const cmd = {
                npm: `npm install ${packageSpec}`,
                yarn: `yarn add ${packageSpec}`,
                pnpm: `pnpm add ${packageSpec}`
            }[this.options.packageManager];
            
            execSync(cmd, { stdio: 'inherit' });
            
            const info = this.checkNodePackage(packageName);
            this.dependencies.node.set(packageName, {
                version: info.version,
                installedAt: Date.now(),
                requestedVersion: version
            });
            
            this._saveCache();
            this.emit('install:complete', { type: 'node', package: packageName, version: info.version });
            
            return info;
        } catch (e) {
            this.emit('install:error', { type: 'node', package: packageName, error: e.message });
            throw e;
        }
    }

    /**
     * Install Python package
     */
    async installPythonPackage(packageName, version = null) {
        const packageSpec = version ? `${packageName}==${version}` : packageName;
        
        this.emit('install:start', { type: 'python', package: packageName });
        
        try {
            const cmd = {
                pip: `pip install ${packageSpec}`,
                conda: `conda install -y ${packageSpec}`
            }[this.options.pythonManager];
            
            execSync(cmd, { stdio: 'inherit' });
            
            const info = this.checkPythonPackage(packageName);
            this.dependencies.python.set(packageName, {
                version: info.version,
                installedAt: Date.now(),
                requestedVersion: version
            });
            
            this._saveCache();
            this.emit('install:complete', { type: 'python', package: packageName, version: info.version });
            
            return info;
        } catch (e) {
            this.emit('install:error', { type: 'python', package: packageName, error: e.message });
            throw e;
        }
    }

    /**
     * Check all required dependencies
     */
    checkAllDependencies() {
        const report = {
            node: { installed: [], missing: [], outdated: [] },
            python: { installed: [], missing: [], outdated: [] }
        };
        
        // Check Node.js dependencies
        for (const [pkg, requiredVersion] of Object.entries(this.requiredDeps.node)) {
            const info = this.checkNodePackage(pkg);
            
            if (info.installed) {
                report.node.installed.push({ name: pkg, version: info.version, required: requiredVersion });
                
                // Simple version check (could be more sophisticated)
                if (!this._versionSatisfies(info.version, requiredVersion)) {
                    report.node.outdated.push({ name: pkg, current: info.version, required: requiredVersion });
                }
            } else {
                report.node.missing.push({ name: pkg, required: requiredVersion });
            }
        }
        
        // Check Python dependencies
        for (const [pkg, requiredVersion] of Object.entries(this.requiredDeps.python)) {
            const info = this.checkPythonPackage(pkg);
            
            if (info.installed) {
                report.python.installed.push({ name: pkg, version: info.version, required: requiredVersion });
            } else {
                report.python.missing.push({ name: pkg, required: requiredVersion });
            }
        }
        
        return report;
    }

    /**
     * Simple version satisfies check
     */
    _versionSatisfies(current, required) {
        if (!current || !required) return false;
        
        const cleanRequired = required.replace(/[\^~>=<]/g, '');
        const currentParts = current.split('.').map(Number);
        const requiredParts = cleanRequired.split('.').map(Number);
        
        // Major version must match or exceed
        if (currentParts[0] < requiredParts[0]) return false;
        if (currentParts[0] > requiredParts[0]) return true;
        
        // Minor version
        if (currentParts[1] < requiredParts[1]) return false;
        
        return true;
    }

    /**
     * Install all missing dependencies
     */
    async installMissing() {
        const report = this.checkAllDependencies();
        const results = { installed: [], failed: [] };
        
        // Install missing Node.js packages
        for (const dep of report.node.missing) {
            try {
                await this.installNodePackage(dep.name, dep.required);
                results.installed.push({ type: 'node', ...dep });
            } catch (e) {
                results.failed.push({ type: 'node', ...dep, error: e.message });
            }
        }
        
        // Install missing Python packages
        for (const dep of report.python.missing) {
            try {
                await this.installPythonPackage(dep.name);
                results.installed.push({ type: 'python', ...dep });
            } catch (e) {
                results.failed.push({ type: 'python', ...dep, error: e.message });
            }
        }
        
        return results;
    }

    /**
     * Generate requirements.txt for Python
     */
    generatePythonRequirements() {
        const lines = [];
        
        for (const [pkg, version] of Object.entries(this.requiredDeps.python)) {
            lines.push(`${pkg}${version}`);
        }
        
        return lines.join('\n');
    }

    /**
     * Generate package.json dependencies
     */
    generateNodeDependencies() {
        return { ...this.requiredDeps.node };
    }

    /**
     * Get dependency summary
     */
    getSummary() {
        const report = this.checkAllDependencies();
        
        return {
            nodeVersion: this.getNodeVersion(),
            pythonVersion: this.getPythonVersion(),
            packageManager: this.options.packageManager,
            pythonManager: this.options.pythonManager,
            node: {
                installed: report.node.installed.length,
                missing: report.node.missing.length,
                outdated: report.node.outdated.length
            },
            python: {
                installed: report.python.installed.length,
                missing: report.python.missing.length
            },
            ready: report.node.missing.length === 0 && report.python.missing.length === 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERSION RESOLVER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * VersionResolver - Resolves compatible versions across dependencies
 */
class VersionResolver {
    constructor() {
        this.conflicts = [];
    }

    /**
     * Resolve compatible versions
     */
    resolve(dependencies) {
        this.conflicts = [];
        const resolved = new Map();
        
        for (const [pkg, requestedVersion] of Object.entries(dependencies)) {
            resolved.set(pkg, {
                requested: requestedVersion,
                resolved: requestedVersion // Simplified - in production would check registry
            });
        }
        
        return {
            resolved: Object.fromEntries(resolved),
            conflicts: this.conflicts
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IOC CONTAINER - Dependency Injection Container
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Container - Inversion of Control (IoC) Container for Dependency Injection
 * 
 * @description Manages service registration and resolution with support for:
 * - Singleton and transient lifetimes
 * - Factory functions
 * - Constructor injection
 * - Lazy loading
 * 
 * @example
 * const container = new Container();
 * container.register('logger', LoggerService);
 * container.registerSingleton('config', ConfigService);
 * const logger = container.resolve('logger');
 */
class Container {
    constructor() {
        /**
         * @type {Map<string, {type: string, value: any, instance: any}>}
         * @description Registry of all registered services
         */
        this.services = new Map();
        
        /**
         * @type {Map<string, any>}
         * @description Cache for singleton instances
         */
        this.singletons = new Map();
        
        /**
         * @type {Set<string>}
         * @description Track resolution chain to detect circular dependencies
         */
        this.resolving = new Set();
    }

    /**
     * Register a service (transient - new instance each time)
     * 
     * @param {string} name - Service identifier
     * @param {Function|Object} implementation - Class constructor or factory function
     * @param {Object} options - Registration options
     * @param {Array<string>} options.dependencies - Names of dependencies to inject
     * @returns {Container} - Returns this for chaining
     * 
     * @example
     * container.register('userService', UserService, { dependencies: ['db', 'logger'] });
     */
    register(name, implementation, options = {}) {
        if (!name || typeof name !== 'string') {
            throw new Error('Service name must be a non-empty string');
        }
        
        this.services.set(name, {
            type: 'transient',
            value: implementation,
            dependencies: options.dependencies || [],
            factory: options.factory || false
        });
        
        return this;
    }

    /**
     * Register a singleton service (same instance always)
     * 
     * @param {string} name - Service identifier
     * @param {Function|Object} implementation - Class constructor or factory function
     * @param {Object} options - Registration options
     * @returns {Container} - Returns this for chaining
     * 
     * @example
     * container.registerSingleton('database', DatabaseConnection);
     */
    registerSingleton(name, implementation, options = {}) {
        if (!name || typeof name !== 'string') {
            throw new Error('Service name must be a non-empty string');
        }
        
        this.services.set(name, {
            type: 'singleton',
            value: implementation,
            dependencies: options.dependencies || [],
            factory: options.factory || false
        });
        
        return this;
    }

    /**
     * Register a factory function
     * 
     * @param {string} name - Service identifier
     * @param {Function} factory - Factory function that returns the service
     * @returns {Container} - Returns this for chaining
     * 
     * @example
     * container.registerFactory('config', () => loadConfig());
     */
    registerFactory(name, factory) {
        if (typeof factory !== 'function') {
            throw new Error('Factory must be a function');
        }
        
        this.services.set(name, {
            type: 'transient',
            value: factory,
            dependencies: [],
            factory: true
        });
        
        return this;
    }

    /**
     * Register an existing instance
     * 
     * @param {string} name - Service identifier
     * @param {Object} instance - Already created instance
     * @returns {Container} - Returns this for chaining
     * 
     * @example
     * container.registerInstance('logger', existingLoggerInstance);
     */
    registerInstance(name, instance) {
        this.services.set(name, {
            type: 'singleton',
            value: instance,
            dependencies: [],
            factory: false,
            isInstance: true
        });
        this.singletons.set(name, instance);
        
        return this;
    }

    /**
     * Resolve a service by name
     * 
     * @param {string} name - Service identifier to resolve
     * @returns {Object} - The resolved service instance
     * @throws {Error} - If service not found or circular dependency detected
     * 
     * @example
     * const userService = container.resolve('userService');
     */
    resolve(name) {
        if (!this.services.has(name)) {
            throw new Error(`Service '${name}' not registered in container`);
        }

        // Check for circular dependencies
        if (this.resolving.has(name)) {
            const chain = Array.from(this.resolving).join(' -> ');
            throw new Error(`Circular dependency detected: ${chain} -> ${name}`);
        }

        const registration = this.services.get(name);

        // Return cached singleton if available
        if (registration.type === 'singleton' && this.singletons.has(name)) {
            return this.singletons.get(name);
        }

        // Return pre-registered instance
        if (registration.isInstance) {
            return registration.value;
        }

        // Track resolution for circular dependency detection
        this.resolving.add(name);

        try {
            let instance;

            if (registration.factory) {
                // Call factory function
                instance = registration.value(this);
            } else if (typeof registration.value === 'function') {
                // Resolve dependencies
                const deps = registration.dependencies.map(dep => this.resolve(dep));
                // Create new instance with dependencies
                instance = new registration.value(...deps);
            } else {
                // Return value as-is
                instance = registration.value;
            }

            // Cache singleton
            if (registration.type === 'singleton') {
                this.singletons.set(name, instance);
            }

            return instance;
        } finally {
            this.resolving.delete(name);
        }
    }

    /**
     * Check if a service is registered
     * 
     * @param {string} name - Service identifier
     * @returns {boolean} - True if registered
     */
    has(name) {
        return this.services.has(name);
    }

    /**
     * Unregister a service
     * 
     * @param {string} name - Service identifier
     * @returns {boolean} - True if service was removed
     */
    unregister(name) {
        this.singletons.delete(name);
        return this.services.delete(name);
    }

    /**
     * Clear all registrations
     */
    clear() {
        this.services.clear();
        this.singletons.clear();
        this.resolving.clear();
    }

    /**
     * Get all registered service names
     * 
     * @returns {string[]} - Array of service names
     */
    getRegisteredServices() {
        return Array.from(this.services.keys());
    }

    /**
     * Create a child container that inherits from this container
     * 
     * @returns {Container} - New child container
     */
    createChild() {
        const child = new Container();
        child.parent = this;
        
        // Override resolve to check parent
        const originalResolve = child.resolve.bind(child);
        child.resolve = (name) => {
            if (child.services.has(name)) {
                return originalResolve(name);
            }
            if (child.parent) {
                return child.parent.resolve(name);
            }
            throw new Error(`Service '${name}' not registered`);
        };
        
        return child;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let _instance = null;

function getDependencyManager(options = {}) {
    if (!_instance) {
        _instance = new DependencyManager(options);
    }
    return _instance;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    DependencyManager,
    Container,
    VersionResolver,
    getDependencyManager,
    
    // Quick access
    checkAll: () => getDependencyManager().checkAllDependencies(),
    installMissing: () => getDependencyManager().installMissing(),
    getSummary: () => getDependencyManager().getSummary()
};

console.log('✅ Step 2/50: Dependency Manager loaded');
