/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 23/50: Shadow DOM Penetration                      ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Advanced Shadow DOM traversal and interaction
 * @phase 2 - Autonomous Intelligence
 * @step 23 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW DOM TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShadowMode - Shadow DOM modes
 */
const ShadowMode = {
    OPEN: 'open',
    CLOSED: 'closed'
};

/**
 * TraversalStrategy - How to traverse shadow trees
 */
const TraversalStrategy = {
    DEEP_FIRST: 'deep_first',
    BREADTH_FIRST: 'breadth_first',
    PIERCE: 'pierce'
};

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW PATH
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShadowPath - Path through shadow DOM
 */
class ShadowPath {
    constructor() {
        this.segments = [];
    }

    /**
     * Add segment
     */
    addSegment(selector, shadowRoot = false) {
        this.segments.push({ selector, shadowRoot });
        return this;
    }

    /**
     * Build from string (>>> notation)
     */
    static fromString(pathStr) {
        const path = new ShadowPath();
        const parts = pathStr.split('>>>').map(p => p.trim());
        
        for (let i = 0; i < parts.length; i++) {
            const isLast = i === parts.length - 1;
            path.addSegment(parts[i], !isLast);
        }
        
        return path;
    }

    /**
     * Convert to string
     */
    toString() {
        return this.segments.map(s => s.selector).join(' >>> ');
    }

    /**
     * Get depth
     */
    getDepth() {
        return this.segments.filter(s => s.shadowRoot).length;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW DOM NAVIGATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShadowDOMNavigator - Navigate through shadow DOM
 */
class ShadowDOMNavigator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxDepth: options.maxDepth || 10,
            timeout: options.timeout || 5000,
            pollingInterval: options.pollingInterval || 100,
            ...options
        };
        
        this.cache = new Map();
        this.stats = {
            traversals: 0,
            shadowRootsFound: 0,
            cachHits: 0
        };
    }

    /**
     * Find element through shadow DOM
     */
    async findElement(root, path, options = {}) {
        const shadowPath = typeof path === 'string' ? ShadowPath.fromString(path) : path;
        
        this.stats.traversals++;
        this.emit('find:start', { path: shadowPath.toString() });
        
        let current = root;
        
        for (let i = 0; i < shadowPath.segments.length; i++) {
            const segment = shadowPath.segments[i];
            
            // Find element
            current = await this._findInContext(current, segment.selector, options);
            
            if (!current) {
                this.emit('find:notfound', { segment: segment.selector, index: i });
                return null;
            }
            
            // Enter shadow root if needed
            if (segment.shadowRoot) {
                const shadowRoot = await this._getShadowRoot(current);
                
                if (!shadowRoot) {
                    this.emit('find:noshadow', { element: segment.selector });
                    return null;
                }
                
                this.stats.shadowRootsFound++;
                current = shadowRoot;
            }
        }
        
        this.emit('find:success', { path: shadowPath.toString() });
        
        return current;
    }

    /**
     * Find all elements through shadow DOM
     */
    async findElements(root, path, options = {}) {
        const shadowPath = typeof path === 'string' ? ShadowPath.fromString(path) : path;
        const lastSegment = shadowPath.segments[shadowPath.segments.length - 1];
        
        // Navigate to parent context
        if (shadowPath.segments.length > 1) {
            const parentPath = new ShadowPath();
            parentPath.segments = shadowPath.segments.slice(0, -1);
            parentPath.segments[parentPath.segments.length - 1].shadowRoot = true;
            
            const parent = await this.findElement(root, parentPath, options);
            
            if (!parent) {
                return [];
            }
            
            return this._findAllInContext(parent, lastSegment.selector);
        }
        
        return this._findAllInContext(root, lastSegment.selector);
    }

    /**
     * Find in context
     */
    async _findInContext(context, selector, options = {}) {
        const timeout = options.timeout || this.options.timeout;
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const element = await this._querySelector(context, selector);
                
                if (element) {
                    return element;
                }
            } catch (e) {
                // Continue polling
            }
            
            await this._sleep(this.options.pollingInterval);
        }
        
        return null;
    }

    /**
     * Find all in context
     */
    async _findAllInContext(context, selector) {
        return this._querySelectorAll(context, selector);
    }

    /**
     * Get shadow root
     */
    async _getShadowRoot(element) {
        // Try open shadow root
        if (element.shadowRoot) {
            return element.shadowRoot;
        }
        
        // For closed shadow roots, try workarounds
        // Note: This requires the element to be from a browser context
        return null;
    }

    /**
     * Query selector (abstracted for different contexts)
     */
    async _querySelector(context, selector) {
        if (context.querySelector) {
            return context.querySelector(selector);
        }
        return null;
    }

    /**
     * Query selector all
     */
    async _querySelectorAll(context, selector) {
        if (context.querySelectorAll) {
            return Array.from(context.querySelectorAll(selector));
        }
        return [];
    }

    /**
     * Sleep helper
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Deep traversal - find all shadow roots
     */
    async traverseShadowTree(root, callback, depth = 0) {
        if (depth > this.options.maxDepth) {
            return;
        }
        
        // Call callback for current element
        await callback(root, depth);
        
        // Get shadow root if exists
        const shadowRoot = await this._getShadowRoot(root);
        
        if (shadowRoot) {
            await callback(shadowRoot, depth, true);
            
            // Traverse shadow root children
            const children = shadowRoot.children || [];
            for (const child of children) {
                await this.traverseShadowTree(child, callback, depth + 1);
            }
        }
        
        // Traverse regular children
        const children = root.children || [];
        for (const child of children) {
            await this.traverseShadowTree(child, callback, depth);
        }
    }

    /**
     * Find all shadow hosts
     */
    async findShadowHosts(root) {
        const hosts = [];
        
        await this.traverseShadowTree(root, async (element, depth, isShadowRoot) => {
            if (!isShadowRoot && element.shadowRoot) {
                hosts.push({
                    element,
                    depth,
                    mode: element.shadowRoot.mode || 'open'
                });
            }
        });
        
        return hosts;
    }

    /**
     * Get stats
     */
    getStats() {
        return { ...this.stats };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW SELECTOR BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShadowSelectorBuilder - Build shadow-piercing selectors
 */
class ShadowSelectorBuilder {
    constructor() {
        this.parts = [];
    }

    /**
     * Add regular selector
     */
    select(selector) {
        this.parts.push({ type: 'select', selector });
        return this;
    }

    /**
     * Pierce shadow DOM
     */
    shadow(hostSelector) {
        if (hostSelector) {
            this.parts.push({ type: 'select', selector: hostSelector });
        }
        this.parts.push({ type: 'shadow' });
        return this;
    }

    /**
     * Build selector path
     */
    build() {
        const segments = [];
        let currentSelector = '';
        
        for (const part of this.parts) {
            if (part.type === 'select') {
                currentSelector += (currentSelector ? ' ' : '') + part.selector;
            } else if (part.type === 'shadow') {
                if (currentSelector) {
                    segments.push(currentSelector);
                    currentSelector = '';
                }
            }
        }
        
        if (currentSelector) {
            segments.push(currentSelector);
        }
        
        return segments.join(' >>> ');
    }

    /**
     * Build ShadowPath
     */
    buildPath() {
        return ShadowPath.fromString(this.build());
    }

    /**
     * Reset builder
     */
    reset() {
        this.parts = [];
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PIERCING LOCATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PiercingLocator - Locator that pierces shadow DOM
 */
class PiercingLocator {
    constructor(navigator, selector) {
        this.navigator = navigator;
        this.selector = selector;
        this.path = ShadowPath.fromString(selector);
    }

    /**
     * Find single element
     */
    async find(root) {
        return this.navigator.findElement(root, this.path);
    }

    /**
     * Find all elements
     */
    async findAll(root) {
        return this.navigator.findElements(root, this.path);
    }

    /**
     * Wait and find
     */
    async waitFor(root, timeout = 5000) {
        return this.navigator.findElement(root, this.path, { timeout });
    }

    /**
     * Click element
     */
    async click(root) {
        const element = await this.find(root);
        if (element && element.click) {
            await element.click();
            return true;
        }
        return false;
    }

    /**
     * Get text
     */
    async getText(root) {
        const element = await this.find(root);
        return element?.textContent || element?.innerText || '';
    }

    /**
     * Set value
     */
    async setValue(root, value) {
        const element = await this.find(root);
        if (element) {
            element.value = value;
            return true;
        }
        return false;
    }

    /**
     * Get attribute
     */
    async getAttribute(root, attr) {
        const element = await this.find(root);
        return element?.getAttribute?.(attr);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW DOM INTERACTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ShadowDOMInteractor - High-level shadow DOM interactions
 */
class ShadowDOMInteractor extends EventEmitter {
    constructor(navigator, options = {}) {
        super();
        
        this.navigator = navigator;
        this.options = options;
        this.locators = new Map();
    }

    /**
     * Register locator
     */
    register(name, selector) {
        this.locators.set(name, new PiercingLocator(this.navigator, selector));
        return this;
    }

    /**
     * Get locator
     */
    locator(nameOrSelector) {
        if (this.locators.has(nameOrSelector)) {
            return this.locators.get(nameOrSelector);
        }
        return new PiercingLocator(this.navigator, nameOrSelector);
    }

    /**
     * Click through shadow
     */
    async click(root, selector) {
        const locator = this.locator(selector);
        return locator.click(root);
    }

    /**
     * Type through shadow
     */
    async type(root, selector, text) {
        const element = await this.locator(selector).find(root);
        if (element) {
            element.value = '';
            for (const char of text) {
                element.value += char;
                await this._sleep(10);
            }
            return true;
        }
        return false;
    }

    /**
     * Get text through shadow
     */
    async getText(root, selector) {
        return this.locator(selector).getText(root);
    }

    /**
     * Check exists through shadow
     */
    async exists(root, selector) {
        const element = await this.locator(selector).find(root);
        return element !== null;
    }

    /**
     * Wait for element through shadow
     */
    async waitFor(root, selector, timeout = 5000) {
        return this.locator(selector).waitFor(root, timeout);
    }

    /**
     * Sleep helper
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultNavigator = null;

module.exports = {
    // Classes
    ShadowPath,
    ShadowDOMNavigator,
    ShadowSelectorBuilder,
    PiercingLocator,
    ShadowDOMInteractor,
    
    // Types
    ShadowMode,
    TraversalStrategy,
    
    // Factory
    createNavigator: (options = {}) => new ShadowDOMNavigator(options),
    createInteractor: (navigator, options = {}) => new ShadowDOMInteractor(navigator, options),
    
    // Builder
    selector: () => new ShadowSelectorBuilder(),
    
    // Singleton
    getShadowNavigator: (options = {}) => {
        if (!defaultNavigator) {
            defaultNavigator = new ShadowDOMNavigator(options);
        }
        return defaultNavigator;
    }
};

console.log('✅ Step 23/50: Shadow DOM Penetration loaded');
