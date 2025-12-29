/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 21/50: NLU Engine                                  ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Natural Language Understanding for semantic intent mapping
 * @phase 2 - Autonomous Intelligence
 * @step 21 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// NLU TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IntentCategory - Main intent categories
 */
const IntentCategory = {
    NAVIGATION: 'navigation',
    FORM_INTERACTION: 'form_interaction',
    DATA_VALIDATION: 'data_validation',
    ASSERTION: 'assertion',
    API_CALL: 'api_call',
    WAIT: 'wait',
    SCREENSHOT: 'screenshot',
    UNKNOWN: 'unknown'
};

/**
 * EntityType - Entity types
 */
const EntityType = {
    ELEMENT: 'element',
    VALUE: 'value',
    URL: 'url',
    SELECTOR: 'selector',
    ATTRIBUTE: 'attribute',
    TIME: 'time',
    NUMBER: 'number',
    BOOLEAN: 'boolean'
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOKENIZER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tokenizer - Text tokenization
 */
class Tokenizer {
    constructor(options = {}) {
        this.options = {
            lowercase: options.lowercase !== false,
            removeStopwords: options.removeStopwords !== false,
            stemming: options.stemming || false,
            ...options
        };
        
        this.stopwords = new Set([
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by',
            'for', 'with', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
            'on', 'off', 'over', 'under', 'again', 'further', 'once'
        ]);
    }

    /**
     * Tokenize text
     */
    tokenize(text) {
        let tokens = text
            .replace(/[^\w\s'".-]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 0);
        
        if (this.options.lowercase) {
            tokens = tokens.map(t => t.toLowerCase());
        }
        
        if (this.options.removeStopwords) {
            tokens = tokens.filter(t => !this.stopwords.has(t.toLowerCase()));
        }
        
        return tokens;
    }

    /**
     * Extract n-grams
     */
    ngrams(tokens, n) {
        const result = [];
        for (let i = 0; i <= tokens.length - n; i++) {
            result.push(tokens.slice(i, i + n).join(' '));
        }
        return result;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IntentPattern - Pattern for intent matching
 */
class IntentPattern {
    constructor(config) {
        this.intent = config.intent;
        this.category = config.category;
        this.patterns = config.patterns || [];
        this.keywords = config.keywords || [];
        this.entityRules = config.entityRules || [];
        this.priority = config.priority || 50;
        this.confidence = config.confidence || 0.8;
    }

    /**
     * Match text
     */
    match(text, tokens) {
        let score = 0;
        let matches = [];
        
        // Pattern matching
        for (const pattern of this.patterns) {
            const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
            const match = text.match(regex);
            if (match) {
                score += 0.4;
                matches.push({ type: 'pattern', match: match[0] });
            }
        }
        
        // Keyword matching
        const lowTokens = tokens.map(t => t.toLowerCase());
        const keywordMatches = this.keywords.filter(k => 
            lowTokens.includes(k.toLowerCase())
        );
        
        if (keywordMatches.length > 0) {
            score += (keywordMatches.length / this.keywords.length) * 0.3;
            matches.push({ type: 'keywords', match: keywordMatches });
        }
        
        return {
            matched: score > 0,
            score: Math.min(score, 1),
            matches
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN INTENTS
// ═══════════════════════════════════════════════════════════════════════════════

const BuiltInIntents = [
    // Navigation intents
    new IntentPattern({
        intent: 'navigate_to',
        category: IntentCategory.NAVIGATION,
        patterns: [
            /go\s+to\s+(.+)/i,
            /navigate\s+to\s+(.+)/i,
            /open\s+(.+)/i,
            /visit\s+(.+)/i
        ],
        keywords: ['go', 'navigate', 'open', 'visit', 'url', 'page'],
        priority: 80
    }),
    
    new IntentPattern({
        intent: 'click',
        category: IntentCategory.NAVIGATION,
        patterns: [
            /click\s+(?:on\s+)?(.+)/i,
            /press\s+(?:the\s+)?(.+)/i,
            /tap\s+(?:on\s+)?(.+)/i
        ],
        keywords: ['click', 'press', 'tap', 'button', 'link'],
        priority: 85
    }),
    
    new IntentPattern({
        intent: 'scroll',
        category: IntentCategory.NAVIGATION,
        patterns: [
            /scroll\s+(up|down|to)/i,
            /scroll\s+to\s+(.+)/i
        ],
        keywords: ['scroll', 'up', 'down', 'top', 'bottom'],
        priority: 60
    }),
    
    // Form intents
    new IntentPattern({
        intent: 'type_text',
        category: IntentCategory.FORM_INTERACTION,
        patterns: [
            /type\s+["']?(.+?)["']?\s+(?:in|into)\s+(.+)/i,
            /enter\s+["']?(.+?)["']?\s+(?:in|into)\s+(.+)/i,
            /fill\s+(?:in\s+)?(.+)\s+with\s+["']?(.+?)["']?/i,
            /input\s+["']?(.+?)["']?\s+(?:in|into)\s+(.+)/i
        ],
        keywords: ['type', 'enter', 'fill', 'input', 'text', 'field'],
        priority: 85
    }),
    
    new IntentPattern({
        intent: 'select_option',
        category: IntentCategory.FORM_INTERACTION,
        patterns: [
            /select\s+["']?(.+?)["']?\s+(?:from|in)\s+(.+)/i,
            /choose\s+["']?(.+?)["']?/i
        ],
        keywords: ['select', 'choose', 'dropdown', 'option'],
        priority: 80
    }),
    
    new IntentPattern({
        intent: 'check_checkbox',
        category: IntentCategory.FORM_INTERACTION,
        patterns: [
            /check\s+(?:the\s+)?(.+)/i,
            /enable\s+(?:the\s+)?(.+)/i,
            /tick\s+(?:the\s+)?(.+)/i
        ],
        keywords: ['check', 'checkbox', 'enable', 'tick'],
        priority: 75
    }),
    
    new IntentPattern({
        intent: 'submit_form',
        category: IntentCategory.FORM_INTERACTION,
        patterns: [
            /submit\s+(?:the\s+)?(.+)?/i,
            /send\s+(?:the\s+)?form/i
        ],
        keywords: ['submit', 'send', 'form'],
        priority: 70
    }),
    
    // Assertion intents
    new IntentPattern({
        intent: 'verify_text',
        category: IntentCategory.ASSERTION,
        patterns: [
            /verify\s+(?:that\s+)?(.+)\s+(?:contains|has|shows)\s+["']?(.+?)["']?/i,
            /check\s+(?:that\s+)?(.+)\s+(?:contains|has|shows)\s+["']?(.+?)["']?/i,
            /assert\s+(?:that\s+)?(.+)\s+(?:contains|has|shows)\s+["']?(.+?)["']?/i
        ],
        keywords: ['verify', 'check', 'assert', 'contains', 'text', 'should'],
        priority: 85
    }),
    
    new IntentPattern({
        intent: 'verify_visible',
        category: IntentCategory.ASSERTION,
        patterns: [
            /verify\s+(?:that\s+)?(.+)\s+is\s+visible/i,
            /check\s+(?:that\s+)?(.+)\s+is\s+(?:displayed|shown)/i,
            /(.+)\s+should\s+be\s+visible/i
        ],
        keywords: ['visible', 'displayed', 'shown', 'see', 'appear'],
        priority: 80
    }),
    
    new IntentPattern({
        intent: 'verify_url',
        category: IntentCategory.ASSERTION,
        patterns: [
            /verify\s+url\s+(?:is|contains|matches)\s+(.+)/i,
            /check\s+(?:the\s+)?url/i,
            /url\s+should\s+(?:be|contain)\s+(.+)/i
        ],
        keywords: ['url', 'address', 'location'],
        priority: 75
    }),
    
    // Wait intents
    new IntentPattern({
        intent: 'wait_for',
        category: IntentCategory.WAIT,
        patterns: [
            /wait\s+for\s+(.+)/i,
            /wait\s+until\s+(.+)/i,
            /wait\s+(\d+)\s*(?:ms|seconds?|s)/i
        ],
        keywords: ['wait', 'until', 'loading', 'appear'],
        priority: 70
    }),
    
    // API intents
    new IntentPattern({
        intent: 'api_request',
        category: IntentCategory.API_CALL,
        patterns: [
            /(?:make|send)\s+(?:a\s+)?(GET|POST|PUT|DELETE)\s+request\s+to\s+(.+)/i,
            /call\s+(?:the\s+)?api\s+(.+)/i
        ],
        keywords: ['api', 'request', 'get', 'post', 'put', 'delete', 'endpoint'],
        priority: 75
    }),
    
    // Screenshot
    new IntentPattern({
        intent: 'take_screenshot',
        category: IntentCategory.SCREENSHOT,
        patterns: [
            /take\s+(?:a\s+)?screenshot/i,
            /capture\s+(?:the\s+)?screen/i
        ],
        keywords: ['screenshot', 'capture', 'screen', 'image'],
        priority: 60
    })
];

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * EntityExtractor - Extract entities from text
 */
class EntityExtractor {
    constructor(options = {}) {
        this.options = options;
        
        this.rules = [
            // URL
            {
                type: EntityType.URL,
                pattern: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?/g
            },
            // Quoted string
            {
                type: EntityType.VALUE,
                pattern: /["']([^"']+)["']/g,
                group: 1
            },
            // Selector patterns
            {
                type: EntityType.SELECTOR,
                pattern: /#[a-zA-Z][a-zA-Z0-9_-]*/g
            },
            {
                type: EntityType.SELECTOR,
                pattern: /\.[a-zA-Z][a-zA-Z0-9_-]*/g
            },
            // Numbers
            {
                type: EntityType.NUMBER,
                pattern: /\b\d+(?:\.\d+)?\b/g
            },
            // Time durations
            {
                type: EntityType.TIME,
                pattern: /\d+\s*(?:ms|milliseconds?|s|seconds?|m|minutes?)/gi
            }
        ];
    }

    /**
     * Extract entities
     */
    extract(text) {
        const entities = [];
        
        for (const rule of this.rules) {
            const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                const value = rule.group !== undefined ? match[rule.group] : match[0];
                
                entities.push({
                    type: rule.type,
                    value,
                    start: match.index,
                    end: match.index + match[0].length,
                    raw: match[0]
                });
            }
        }
        
        // Sort by position
        entities.sort((a, b) => a.start - b.start);
        
        return entities;
    }

    /**
     * Extract element references
     */
    extractElementReferences(text) {
        const elements = [];
        
        // Common element patterns
        const patterns = [
            /(?:the\s+)?["']([^"']+)["']\s+(?:button|link|input|field|element)/gi,
            /(?:button|link|input|field)\s+(?:labeled|named|called)\s+["']?([^"'\s]+)["']?/gi,
            /(?:the\s+)?(\w+)\s+(?:button|link|input)/gi
        ];
        
        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                elements.push({
                    type: EntityType.ELEMENT,
                    reference: match[1],
                    raw: match[0]
                });
            }
        }
        
        return elements;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NLU ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NLUEngine - Natural Language Understanding
 */
class NLUEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            confidenceThreshold: options.confidenceThreshold || 0.5,
            enableAI: options.enableAI || false,
            ...options
        };
        
        this.tokenizer = new Tokenizer(options);
        this.entityExtractor = new EntityExtractor(options);
        this.intents = [...BuiltInIntents];
        this.aiClient = options.aiClient || null;
        
        this.stats = {
            processed: 0,
            matched: 0,
            fallback: 0
        };
    }

    /**
     * Register custom intent
     */
    registerIntent(intent) {
        if (intent instanceof IntentPattern) {
            this.intents.push(intent);
        } else {
            this.intents.push(new IntentPattern(intent));
        }
        return this;
    }

    /**
     * Understand text
     */
    async understand(text) {
        this.stats.processed++;
        const startTime = Date.now();
        
        // Tokenize
        const tokens = this.tokenizer.tokenize(text);
        
        // Extract entities
        const entities = this.entityExtractor.extract(text);
        const elementRefs = this.entityExtractor.extractElementReferences(text);
        
        // Match intents
        const intentResults = this._matchIntents(text, tokens);
        
        // Get best match
        const bestMatch = intentResults.length > 0 ? intentResults[0] : null;
        
        let result = {
            text,
            tokens,
            entities,
            elementReferences: elementRefs,
            intent: null,
            confidence: 0,
            alternatives: [],
            processingTime: 0
        };
        
        if (bestMatch && bestMatch.score >= this.options.confidenceThreshold) {
            result.intent = bestMatch.intent;
            result.confidence = bestMatch.score;
            result.category = bestMatch.category;
            this.stats.matched++;
        } else if (this.options.enableAI && this.aiClient) {
            // Fallback to AI
            const aiResult = await this._aiUnderstand(text);
            result = { ...result, ...aiResult };
            this.stats.fallback++;
        } else {
            result.intent = 'unknown';
            result.category = IntentCategory.UNKNOWN;
        }
        
        // Add alternatives
        result.alternatives = intentResults.slice(1, 4).map(r => ({
            intent: r.intent,
            confidence: r.score
        }));
        
        result.processingTime = Date.now() - startTime;
        
        this.emit('understood', result);
        
        return result;
    }

    /**
     * Match intents
     */
    _matchIntents(text, tokens) {
        const results = [];
        
        for (const intent of this.intents) {
            const match = intent.match(text, tokens);
            
            if (match.matched) {
                results.push({
                    intent: intent.intent,
                    category: intent.category,
                    score: match.score * (intent.priority / 100),
                    matches: match.matches
                });
            }
        }
        
        // Sort by score
        results.sort((a, b) => b.score - a.score);
        
        return results;
    }

    /**
     * AI fallback understanding
     */
    async _aiUnderstand(text) {
        const prompt = `
            Analyze this test step and extract:
            1. Intent (what action to perform)
            2. Target element (if any)
            3. Values/data (if any)
            
            Step: "${text}"
            
            Respond with JSON:
            {
                "intent": "click|type|verify|navigate|wait|...",
                "target": "element description",
                "values": ["any values"],
                "confidence": 0.0-1.0
            }
        `;
        
        try {
            const response = await this.aiClient.complete(prompt);
            return JSON.parse(response);
        } catch {
            return { intent: 'unknown', confidence: 0 };
        }
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            ...this.stats,
            matchRate: this.stats.processed > 0 ?
                this.stats.matched / this.stats.processed : 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine = null;

module.exports = {
    // Classes
    Tokenizer,
    IntentPattern,
    EntityExtractor,
    NLUEngine,
    
    // Types
    IntentCategory,
    EntityType,
    
    // Built-in intents
    BuiltInIntents,
    
    // Factory
    createNLU: (options = {}) => new NLUEngine(options),
    
    // Singleton
    getNLUEngine: (options = {}) => {
        if (!defaultEngine) {
            defaultEngine = new NLUEngine(options);
        }
        return defaultEngine;
    }
};

console.log('✅ Step 21/50: NLU Engine loaded');
