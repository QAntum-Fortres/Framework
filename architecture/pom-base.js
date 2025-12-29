/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 7/50: POM Base Architecture                        ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Page Object Model base classes with AI enhancement
 * @phase 1 - Enterprise Foundation
 * @step 7 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// BASE ELEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BaseElement - Foundation for all page elements
 */
class BaseElement extends EventEmitter {
    constructor(locator, options = {}) {
        super();
        
        this.locator = locator;
        this.options = {
            timeout: options.timeout || 30000,
            retries: options.retries || 3,
            waitBetweenRetries: options.waitBetweenRetries || 500,
            selfHealing: options.selfHealing !== false,
            cacheEnabled: options.cacheEnabled !== false,
            ...options
        };
        
        this.alternativeLocators = [];
        this.metadata = {
            name: options.name || 'unnamed',
            type: options.type || 'generic',
            description: options.description || '',
            createdAt: Date.now()
        };
        
        this.state = {
            lastInteraction: null,
            interactionCount: 0,
            errors: [],
            healingHistory: []
        };
    }

    /**
     * Add alternative locator for self-healing
     */
    addAlternative(locator, priority = 0) {
        this.alternativeLocators.push({ locator, priority });
        this.alternativeLocators.sort((a, b) => b.priority - a.priority);
        return this;
    }

    /**
     * Get all locators (primary + alternatives)
     */
    getAllLocators() {
        return [
            { locator: this.locator, priority: 100 },
            ...this.alternativeLocators
        ];
    }

    /**
     * Find element with self-healing
     */
    async find(context) {
        const locators = this.getAllLocators();
        let lastError = null;
        
        for (const { locator, priority } of locators) {
            try {
                const element = await this._findWithLocator(context, locator);
                
                if (element) {
                    // If healed (not primary locator), record it
                    if (locator !== this.locator) {
                        this._recordHealing(locator);
                    }
                    
                    return element;
                }
            } catch (error) {
                lastError = error;
            }
        }
        
        throw lastError || new Error(`Element not found: ${this.metadata.name}`);
    }

    /**
     * Find with single locator
     */
    async _findWithLocator(context, locator) {
        // Abstract - to be implemented by specific frameworks
        if (typeof locator === 'function') {
            return locator(context);
        }
        
        // Simulate element finding
        return { locator, found: true };
    }

    /**
     * Record healing event
     */
    _recordHealing(usedLocator) {
        const event = {
            timestamp: Date.now(),
            originalLocator: this.locator,
            usedLocator,
            successful: true
        };
        
        this.state.healingHistory.push(event);
        this.emit('healed', event);
        
        console.log(`🔧 Self-healed: ${this.metadata.name}`);
    }

    /**
     * Wait for element with condition
     */
    async waitFor(condition, timeout = null) {
        const actualTimeout = timeout || this.options.timeout;
        const startTime = Date.now();
        
        while (Date.now() - startTime < actualTimeout) {
            try {
                const result = await condition();
                if (result) return result;
            } catch (e) {
                // Continue waiting
            }
            
            await this._sleep(100);
        }
        
        throw new Error(`Wait timeout for ${this.metadata.name}: ${actualTimeout}ms`);
    }

    /**
     * Retry operation
     */
    async retry(operation, retries = null) {
        const maxRetries = retries || this.options.retries;
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                this.state.errors.push({
                    timestamp: Date.now(),
                    attempt: i + 1,
                    error: error.message
                });
                
                await this._sleep(this.options.waitBetweenRetries);
            }
        }
        
        throw lastError;
    }

    /**
     * Sleep helper
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Record interaction
     */
    _recordInteraction(type, details = {}) {
        this.state.lastInteraction = {
            type,
            timestamp: Date.now(),
            ...details
        };
        this.state.interactionCount++;
        
        this.emit('interaction', this.state.lastInteraction);
    }

    /**
     * Get element state
     */
    getState() {
        return {
            ...this.state,
            metadata: this.metadata,
            locatorCount: this.getAllLocators().length
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE PAGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BasePage - Foundation for all page objects
 */
class BasePage extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            url: options.url || '',
            urlPattern: options.urlPattern || null,
            loadTimeout: options.loadTimeout || 30000,
            ...options
        };
        
        this.elements = new Map();
        this.components = new Map();
        this.actions = new Map();
        
        this.metadata = {
            name: options.name || this.constructor.name,
            description: options.description || '',
            version: options.version || '1.0.0'
        };
        
        this.state = {
            loaded: false,
            lastVisit: null,
            visitCount: 0
        };
        
        // Define elements in subclass
        this._defineElements();
        this._defineComponents();
        this._defineActions();
    }

    /**
     * Define page elements (override in subclass)
     */
    _defineElements() {
        // Override in subclass
    }

    /**
     * Define page components (override in subclass)
     */
    _defineComponents() {
        // Override in subclass
    }

    /**
     * Define page actions (override in subclass)
     */
    _defineActions() {
        // Override in subclass
    }

    /**
     * Register element
     */
    element(name, locator, options = {}) {
        const element = new BaseElement(locator, {
            name,
            ...options
        });
        
        this.elements.set(name, element);
        return element;
    }

    /**
     * Get element
     */
    $(name) {
        const element = this.elements.get(name);
        if (!element) {
            throw new Error(`Element not found: ${name}`);
        }
        return element;
    }

    /**
     * Register component
     */
    component(name, componentClass, options = {}) {
        const component = new componentClass(options);
        this.components.set(name, component);
        return component;
    }

    /**
     * Get component
     */
    getComponent(name) {
        return this.components.get(name);
    }

    /**
     * Register action
     */
    action(name, handler) {
        this.actions.set(name, handler);
        return this;
    }

    /**
     * Execute action
     */
    async executeAction(name, ...args) {
        const handler = this.actions.get(name);
        if (!handler) {
            throw new Error(`Action not found: ${name}`);
        }
        
        this.emit('action:start', { name, args });
        
        try {
            const result = await handler.call(this, ...args);
            this.emit('action:complete', { name, result });
            return result;
        } catch (error) {
            this.emit('action:error', { name, error });
            throw error;
        }
    }

    /**
     * Navigate to page
     */
    async navigate(driver) {
        if (!this.options.url) {
            throw new Error('No URL defined for page');
        }
        
        this.emit('navigate:start', { url: this.options.url });
        
        // Simulated navigation (real implementation depends on driver)
        this.state.lastVisit = Date.now();
        this.state.visitCount++;
        
        this.emit('navigate:complete', { url: this.options.url });
        
        return this;
    }

    /**
     * Wait for page to load
     */
    async waitForLoad(timeout = null) {
        const actualTimeout = timeout || this.options.loadTimeout;
        
        // Override with actual load detection logic
        this.state.loaded = true;
        
        return this;
    }

    /**
     * Check if on this page
     */
    async isCurrentPage(driver) {
        if (this.options.urlPattern) {
            // Check URL pattern
            return true; // Simulated
        }
        return false;
    }

    /**
     * Get page info
     */
    getInfo() {
        return {
            metadata: this.metadata,
            state: this.state,
            elements: Array.from(this.elements.keys()),
            components: Array.from(this.components.keys()),
            actions: Array.from(this.actions.keys())
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BaseComponent - Reusable UI component
 */
class BaseComponent extends BasePage {
    constructor(options = {}) {
        super(options);
        
        this.rootLocator = options.rootLocator || null;
        this.parent = options.parent || null;
    }

    /**
     * Find root element
     */
    async findRoot(context) {
        if (!this.rootLocator) {
            return context;
        }
        
        return this._findElement(context, this.rootLocator);
    }

    /**
     * Find element within component
     */
    async _findElement(context, locator) {
        // Abstract - implementation depends on framework
        return { locator, context };
    }

    /**
     * Check if component is visible
     */
    async isVisible(context) {
        try {
            const root = await this.findRoot(context);
            return root !== null;
        } catch {
            return false;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATOR FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LocatorFactory - Create various locator types
 */
class LocatorFactory {
    static css(selector) {
        return { type: 'css', selector };
    }

    static xpath(expression) {
        return { type: 'xpath', expression };
    }

    static id(id) {
        return { type: 'id', id };
    }

    static name(name) {
        return { type: 'name', name };
    }

    static className(className) {
        return { type: 'className', className };
    }

    static tagName(tagName) {
        return { type: 'tagName', tagName };
    }

    static text(text, exact = false) {
        return { type: 'text', text, exact };
    }

    static testId(testId) {
        return { type: 'testId', testId };
    }

    static role(role, options = {}) {
        return { type: 'role', role, ...options };
    }

    static label(label) {
        return { type: 'label', label };
    }

    static custom(finder) {
        return { type: 'custom', finder };
    }

    /**
     * Chain locators
     */
    static chain(...locators) {
        return { type: 'chain', locators };
    }

    /**
     * Create from AI suggestion
     */
    static fromAI(suggestions) {
        return {
            type: 'ai',
            suggestions: Array.isArray(suggestions) ? suggestions : [suggestions]
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PageFactory - Create and manage page objects
 */
class PageFactory {
    constructor() {
        this.pages = new Map();
        this.instances = new Map();
    }

    /**
     * Register page class
     */
    register(name, PageClass) {
        this.pages.set(name, PageClass);
        return this;
    }

    /**
     * Get page instance
     */
    get(name, options = {}) {
        // Check for cached instance
        const cacheKey = `${name}:${JSON.stringify(options)}`;
        
        if (!options.fresh && this.instances.has(cacheKey)) {
            return this.instances.get(cacheKey);
        }
        
        // Create new instance
        const PageClass = this.pages.get(name);
        if (!PageClass) {
            throw new Error(`Page not registered: ${name}`);
        }
        
        const instance = new PageClass(options);
        this.instances.set(cacheKey, instance);
        
        return instance;
    }

    /**
     * Create page from definition
     */
    createFromDefinition(definition) {
        const page = new BasePage({
            name: definition.name,
            url: definition.url,
            description: definition.description
        });
        
        // Add elements from definition
        for (const [name, elementDef] of Object.entries(definition.elements || {})) {
            page.element(name, elementDef.locator, elementDef);
        }
        
        return page;
    }

    /**
     * Clear instances
     */
    clear() {
        this.instances.clear();
    }

    /**
     * List registered pages
     */
    list() {
        return Array.from(this.pages.keys());
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    BaseElement,
    BasePage,
    BaseComponent,
    LocatorFactory,
    PageFactory,
    
    // Shortcuts
    By: LocatorFactory,
    
    // Factory functions
    createElement: (locator, options) => new BaseElement(locator, options),
    createPage: (options) => new BasePage(options),
    createComponent: (options) => new BaseComponent(options),
    createPageFactory: () => new PageFactory()
};

console.log('✅ Step 7/50: POM Base Architecture loaded');
