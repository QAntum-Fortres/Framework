/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 8/50: Interface Standardization                    ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Standardized interfaces for framework components
 * @phase 1 - Enterprise Foundation
 * @step 8 of 50
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Interface validator - ensures implementations follow contracts
 */
class InterfaceValidator {
    static validate(instance, interfaceDef) {
        const errors = [];
        
        for (const [methodName, methodSpec] of Object.entries(interfaceDef.methods || {})) {
            if (typeof instance[methodName] !== 'function') {
                errors.push(`Missing method: ${methodName}`);
            }
        }
        
        for (const [propName, propSpec] of Object.entries(interfaceDef.properties || {})) {
            if (!(propName in instance)) {
                if (propSpec.required !== false) {
                    errors.push(`Missing property: ${propName}`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    static assert(instance, interfaceDef) {
        const result = this.validate(instance, interfaceDef);
        if (!result.valid) {
            throw new Error(
                `Interface validation failed for ${interfaceDef.name}:\n` +
                result.errors.map(e => `  - ${e}`).join('\n')
            );
        }
        return instance;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IDriver - Browser/automation driver interface
 */
const IDriver = {
    name: 'IDriver',
    methods: {
        navigate: { params: ['url'], returns: 'Promise' },
        getCurrentUrl: { params: [], returns: 'Promise<string>' },
        getTitle: { params: [], returns: 'Promise<string>' },
        findElement: { params: ['locator'], returns: 'Promise<Element>' },
        findElements: { params: ['locator'], returns: 'Promise<Element[]>' },
        executeScript: { params: ['script', '...args'], returns: 'Promise' },
        screenshot: { params: ['path?'], returns: 'Promise<Buffer>' },
        quit: { params: [], returns: 'Promise' }
    },
    properties: {
        capabilities: { type: 'object', required: true }
    }
};

/**
 * IElement - Element interaction interface
 */
const IElement = {
    name: 'IElement',
    methods: {
        click: { params: [], returns: 'Promise' },
        type: { params: ['text'], returns: 'Promise' },
        clear: { params: [], returns: 'Promise' },
        getText: { params: [], returns: 'Promise<string>' },
        getAttribute: { params: ['name'], returns: 'Promise<string>' },
        isVisible: { params: [], returns: 'Promise<boolean>' },
        isEnabled: { params: [], returns: 'Promise<boolean>' },
        hover: { params: [], returns: 'Promise' },
        scrollIntoView: { params: [], returns: 'Promise' }
    },
    properties: {
        locator: { type: 'object', required: true }
    }
};

/**
 * IModel - ML Model interface
 */
const IModel = {
    name: 'IModel',
    methods: {
        train: { params: ['data', 'options?'], returns: 'Promise' },
        predict: { params: ['input'], returns: 'Promise' },
        evaluate: { params: ['testData'], returns: 'Promise<Metrics>' },
        save: { params: ['path'], returns: 'Promise' },
        load: { params: ['path'], returns: 'Promise' },
        getConfig: { params: [], returns: 'object' }
    },
    properties: {
        name: { type: 'string', required: true },
        version: { type: 'string', required: true },
        type: { type: 'string', required: true }
    }
};

/**
 * IDataSource - Data source interface
 */
const IDataSource = {
    name: 'IDataSource',
    methods: {
        connect: { params: [], returns: 'Promise' },
        disconnect: { params: [], returns: 'Promise' },
        read: { params: ['query?'], returns: 'Promise<Data>' },
        write: { params: ['data'], returns: 'Promise' },
        stream: { params: ['options?'], returns: 'AsyncGenerator' },
        getSchema: { params: [], returns: 'Schema' }
    },
    properties: {
        name: { type: 'string', required: true },
        connected: { type: 'boolean', required: true }
    }
};

/**
 * ILogger - Logging interface
 */
const ILogger = {
    name: 'ILogger',
    methods: {
        debug: { params: ['message', 'data?'], returns: 'void' },
        info: { params: ['message', 'data?'], returns: 'void' },
        warn: { params: ['message', 'data?'], returns: 'void' },
        error: { params: ['message', 'data?'], returns: 'void' },
        setLevel: { params: ['level'], returns: 'void' },
        child: { params: ['context'], returns: 'ILogger' }
    },
    properties: {
        level: { type: 'string', required: true }
    }
};

/**
 * ICache - Caching interface
 */
const ICache = {
    name: 'ICache',
    methods: {
        get: { params: ['key'], returns: 'Promise<any>' },
        set: { params: ['key', 'value', 'ttl?'], returns: 'Promise' },
        delete: { params: ['key'], returns: 'Promise<boolean>' },
        has: { params: ['key'], returns: 'Promise<boolean>' },
        clear: { params: [], returns: 'Promise' },
        keys: { params: ['pattern?'], returns: 'Promise<string[]>' }
    },
    properties: {
        name: { type: 'string', required: true }
    }
};

/**
 * IQueue - Queue interface
 */
const IQueue = {
    name: 'IQueue',
    methods: {
        enqueue: { params: ['item'], returns: 'Promise' },
        dequeue: { params: [], returns: 'Promise<any>' },
        peek: { params: [], returns: 'Promise<any>' },
        size: { params: [], returns: 'Promise<number>' },
        isEmpty: { params: [], returns: 'Promise<boolean>' },
        clear: { params: [], returns: 'Promise' }
    },
    properties: {
        name: { type: 'string', required: true }
    }
};

/**
 * IReporter - Test/metrics reporter interface
 */
const IReporter = {
    name: 'IReporter',
    methods: {
        start: { params: ['context'], returns: 'void' },
        pass: { params: ['testName', 'data?'], returns: 'void' },
        fail: { params: ['testName', 'error', 'data?'], returns: 'void' },
        skip: { params: ['testName', 'reason?'], returns: 'void' },
        end: { params: [], returns: 'Promise<Report>' },
        addAttachment: { params: ['name', 'content', 'type'], returns: 'void' }
    },
    properties: {
        name: { type: 'string', required: true }
    }
};

/**
 * IAgent - AI Agent interface
 */
const IAgent = {
    name: 'IAgent',
    methods: {
        initialize: { params: ['config'], returns: 'Promise' },
        execute: { params: ['task'], returns: 'Promise<Result>' },
        plan: { params: ['goal'], returns: 'Promise<Plan>' },
        observe: { params: ['state'], returns: 'Promise<Observation>' },
        learn: { params: ['experience'], returns: 'Promise' },
        reset: { params: [], returns: 'Promise' }
    },
    properties: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        state: { type: 'string', required: true }
    }
};

/**
 * IOrchestrator - Multi-agent orchestrator interface
 */
const IOrchestrator = {
    name: 'IOrchestrator',
    methods: {
        registerAgent: { params: ['agent'], returns: 'void' },
        unregisterAgent: { params: ['agentId'], returns: 'void' },
        dispatch: { params: ['task'], returns: 'Promise<Result>' },
        coordinate: { params: ['tasks'], returns: 'Promise<Results>' },
        broadcast: { params: ['message'], returns: 'Promise' },
        getStatus: { params: [], returns: 'Status' }
    },
    properties: {
        agents: { type: 'Map', required: true }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACE MIXINS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Observable mixin - adds event capabilities
 */
const ObservableMixin = {
    name: 'ObservableMixin',
    methods: {
        on: { params: ['event', 'handler'], returns: 'void' },
        off: { params: ['event', 'handler'], returns: 'void' },
        emit: { params: ['event', 'data?'], returns: 'void' },
        once: { params: ['event', 'handler'], returns: 'void' }
    }
};

/**
 * Serializable mixin - adds serialization
 */
const SerializableMixin = {
    name: 'SerializableMixin',
    methods: {
        toJSON: { params: [], returns: 'object' },
        fromJSON: { params: ['json'], returns: 'instance' },
        serialize: { params: [], returns: 'string' },
        deserialize: { params: ['data'], returns: 'instance' }
    }
};

/**
 * Lifecycle mixin - adds lifecycle hooks
 */
const LifecycleMixin = {
    name: 'LifecycleMixin',
    methods: {
        onCreate: { params: [], returns: 'Promise' },
        onStart: { params: [], returns: 'Promise' },
        onStop: { params: [], returns: 'Promise' },
        onDestroy: { params: [], returns: 'Promise' },
        onError: { params: ['error'], returns: 'Promise' }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACE FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * InterfaceFactory - Create interface-compliant objects
 */
class InterfaceFactory {
    constructor() {
        this.interfaces = new Map();
        this.implementations = new Map();
        
        // Register built-in interfaces
        this._registerBuiltInInterfaces();
    }

    /**
     * Register built-in interfaces
     */
    _registerBuiltInInterfaces() {
        const builtIn = {
            IDriver, IElement, IModel, IDataSource,
            ILogger, ICache, IQueue, IReporter,
            IAgent, IOrchestrator,
            ObservableMixin, SerializableMixin, LifecycleMixin
        };
        
        for (const [name, def] of Object.entries(builtIn)) {
            this.interfaces.set(name, def);
        }
    }

    /**
     * Register custom interface
     */
    registerInterface(name, definition) {
        this.interfaces.set(name, {
            name,
            ...definition
        });
        return this;
    }

    /**
     * Get interface definition
     */
    getInterface(name) {
        return this.interfaces.get(name);
    }

    /**
     * Register implementation
     */
    registerImplementation(interfaceName, implementationClass, name = null) {
        const key = name || implementationClass.name;
        
        if (!this.implementations.has(interfaceName)) {
            this.implementations.set(interfaceName, new Map());
        }
        
        this.implementations.get(interfaceName).set(key, implementationClass);
        return this;
    }

    /**
     * Create implementation
     */
    create(interfaceName, implName = null, ...args) {
        const impls = this.implementations.get(interfaceName);
        
        if (!impls || impls.size === 0) {
            throw new Error(`No implementations for interface: ${interfaceName}`);
        }
        
        const ImplementationClass = implName ? 
            impls.get(implName) : 
            impls.values().next().value;
        
        if (!ImplementationClass) {
            throw new Error(`Implementation not found: ${implName}`);
        }
        
        const instance = new ImplementationClass(...args);
        
        // Validate against interface
        const interfaceDef = this.interfaces.get(interfaceName);
        if (interfaceDef) {
            InterfaceValidator.assert(instance, interfaceDef);
        }
        
        return instance;
    }

    /**
     * List interfaces
     */
    listInterfaces() {
        return Array.from(this.interfaces.keys());
    }

    /**
     * List implementations
     */
    listImplementations(interfaceName) {
        const impls = this.implementations.get(interfaceName);
        return impls ? Array.from(impls.keys()) : [];
    }

    /**
     * Extend interface
     */
    extendInterface(baseName, newName, extensions) {
        const base = this.interfaces.get(baseName);
        if (!base) {
            throw new Error(`Base interface not found: ${baseName}`);
        }
        
        this.registerInterface(newName, {
            methods: { ...base.methods, ...extensions.methods },
            properties: { ...base.properties, ...extensions.properties }
        });
        
        return this;
    }

    /**
     * Compose interfaces
     */
    composeInterfaces(name, ...interfaceNames) {
        const composed = {
            name,
            methods: {},
            properties: {}
        };
        
        for (const interfaceName of interfaceNames) {
            const iface = this.interfaces.get(interfaceName);
            if (iface) {
                Object.assign(composed.methods, iface.methods);
                Object.assign(composed.properties, iface.properties);
            }
        }
        
        this.interfaces.set(name, composed);
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT DECORATORS (Simulated)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Implements decorator - marks class as implementing interface
 */
function Implements(...interfaceNames) {
    return function(target) {
        target._implements = interfaceNames;
        
        // Add validation method
        target.prototype.validateInterfaces = function() {
            const factory = new InterfaceFactory();
            const errors = [];
            
            for (const name of interfaceNames) {
                const iface = factory.getInterface(name);
                if (iface) {
                    const result = InterfaceValidator.validate(this, iface);
                    if (!result.valid) {
                        errors.push({ interface: name, errors: result.errors });
                    }
                }
            }
            
            return { valid: errors.length === 0, errors };
        };
        
        return target;
    };
}

/**
 * Contract decorator - enforces preconditions/postconditions
 */
function Contract(config) {
    return function(target, key, descriptor) {
        const original = descriptor.value;
        
        descriptor.value = async function(...args) {
            // Check preconditions
            if (config.pre) {
                const preResult = config.pre.call(this, ...args);
                if (!preResult) {
                    throw new Error(`Precondition failed for ${key}`);
                }
            }
            
            // Execute
            const result = await original.apply(this, args);
            
            // Check postconditions
            if (config.post) {
                const postResult = config.post.call(this, result, ...args);
                if (!postResult) {
                    throw new Error(`Postcondition failed for ${key}`);
                }
            }
            
            return result;
        };
        
        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Singleton factory
let factoryInstance = null;

module.exports = {
    // Validator
    InterfaceValidator,
    InterfaceFactory,
    
    // Core Interfaces
    IDriver,
    IElement,
    IModel,
    IDataSource,
    ILogger,
    ICache,
    IQueue,
    IReporter,
    IAgent,
    IOrchestrator,
    
    // Mixins
    ObservableMixin,
    SerializableMixin,
    LifecycleMixin,
    
    // Decorators
    Implements,
    Contract,
    
    // Factory singleton
    getFactory: () => {
        if (!factoryInstance) {
            factoryInstance = new InterfaceFactory();
        }
        return factoryInstance;
    }
};

console.log('✅ Step 8/50: Interface Standardization loaded');
