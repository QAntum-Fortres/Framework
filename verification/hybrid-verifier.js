/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 19/50: Hybrid Verifier                             ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Multi-layer verification system (AI + Rule-based)
 * @phase 1 - Enterprise Foundation
 * @step 19 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * VerificationType - Types of verification
 */
const VerificationType = {
    RULE_BASED: 'rule_based',
    AI_POWERED: 'ai_powered',
    VISUAL: 'visual',
    SEMANTIC: 'semantic',
    HYBRID: 'hybrid'
};

/**
 * VerificationStatus - Verification result status
 */
const VerificationStatus = {
    PASSED: 'passed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
    WARNING: 'warning',
    ERROR: 'error'
};

// ═══════════════════════════════════════════════════════════════════════════════
// RULE-BASED VERIFIER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Rule - Base verification rule
 */
class VerificationRule {
    constructor(config) {
        this.name = config.name;
        this.description = config.description || '';
        this.severity = config.severity || 'medium';
        this.enabled = config.enabled !== false;
    }

    async verify(context) {
        throw new Error('Rule must implement verify()');
    }
}

/**
 * RuleBasedVerifier - Traditional rule verification
 */
class RuleBasedVerifier extends EventEmitter {
    constructor(options = {}) {
        super();
        this.rules = [];
        this.options = options;
    }

    /**
     * Add rule
     */
    addRule(rule) {
        this.rules.push(rule);
        return this;
    }

    /**
     * Verify against all rules
     */
    async verify(context) {
        const results = [];
        
        for (const rule of this.rules) {
            if (!rule.enabled) {
                results.push({
                    rule: rule.name,
                    status: VerificationStatus.SKIPPED
                });
                continue;
            }
            
            try {
                const result = await rule.verify(context);
                results.push({
                    rule: rule.name,
                    status: result.passed ? VerificationStatus.PASSED : VerificationStatus.FAILED,
                    details: result.details || {}
                });
            } catch (error) {
                results.push({
                    rule: rule.name,
                    status: VerificationStatus.ERROR,
                    error: error.message
                });
            }
        }
        
        return {
            type: VerificationType.RULE_BASED,
            results,
            passed: results.every(r => 
                r.status === VerificationStatus.PASSED || 
                r.status === VerificationStatus.SKIPPED
            )
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN RULES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ElementExistsRule
 */
class ElementExistsRule extends VerificationRule {
    constructor(selector, options = {}) {
        super({
            name: options.name || `element_exists_${selector}`,
            description: `Verify element exists: ${selector}`,
            ...options
        });
        this.selector = selector;
    }

    async verify(context) {
        const element = await context.findElement?.(this.selector);
        return { passed: !!element };
    }
}

/**
 * ElementVisibleRule
 */
class ElementVisibleRule extends VerificationRule {
    constructor(selector, options = {}) {
        super({
            name: options.name || `element_visible_${selector}`,
            description: `Verify element visible: ${selector}`,
            ...options
        });
        this.selector = selector;
    }

    async verify(context) {
        const element = await context.findElement?.(this.selector);
        const visible = element?.visible !== false;
        return { passed: visible };
    }
}

/**
 * TextContainsRule
 */
class TextContainsRule extends VerificationRule {
    constructor(selector, expectedText, options = {}) {
        super({
            name: options.name || `text_contains`,
            description: `Verify text contains: "${expectedText}"`,
            ...options
        });
        this.selector = selector;
        this.expectedText = expectedText;
    }

    async verify(context) {
        const element = await context.findElement?.(this.selector);
        const text = element?.text || element?.textContent || '';
        const contains = text.includes(this.expectedText);
        return {
            passed: contains,
            details: { actual: text, expected: this.expectedText }
        };
    }
}

/**
 * URLMatchesRule
 */
class URLMatchesRule extends VerificationRule {
    constructor(pattern, options = {}) {
        super({
            name: options.name || 'url_matches',
            description: `Verify URL matches: ${pattern}`,
            ...options
        });
        this.pattern = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    }

    async verify(context) {
        const url = context.url || '';
        const matches = this.pattern.test(url);
        return {
            passed: matches,
            details: { url, pattern: this.pattern.toString() }
        };
    }
}

/**
 * ValueEqualsRule
 */
class ValueEqualsRule extends VerificationRule {
    constructor(getValue, expected, options = {}) {
        super({
            name: options.name || 'value_equals',
            description: `Verify value equals expected`,
            ...options
        });
        this.getValue = getValue;
        this.expected = expected;
        this.comparator = options.comparator || '==';
    }

    async verify(context) {
        const actual = typeof this.getValue === 'function' ?
            await this.getValue(context) : this.getValue;
        
        let passed;
        switch (this.comparator) {
            case '==': passed = actual == this.expected; break;
            case '===': passed = actual === this.expected; break;
            case '!=': passed = actual != this.expected; break;
            case '>': passed = actual > this.expected; break;
            case '<': passed = actual < this.expected; break;
            case '>=': passed = actual >= this.expected; break;
            case '<=': passed = actual <= this.expected; break;
            case 'includes': passed = actual?.includes?.(this.expected); break;
            case 'matches': passed = new RegExp(this.expected).test(actual); break;
            default: passed = actual === this.expected;
        }
        
        return {
            passed,
            details: { actual, expected: this.expected, comparator: this.comparator }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI-POWERED VERIFIER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AIVerifier - AI-powered verification
 */
class AIVerifier extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            provider: options.provider || 'openai',
            model: options.model || 'gpt-4',
            threshold: options.threshold || 0.8,
            ...options
        };
        
        this.client = options.client || null;
    }

    /**
     * Verify using AI
     */
    async verify(context, query) {
        const prompt = this._buildPrompt(context, query);
        
        try {
            const response = await this._callAI(prompt);
            const result = this._parseResponse(response);
            
            return {
                type: VerificationType.AI_POWERED,
                passed: result.confidence >= this.options.threshold,
                confidence: result.confidence,
                explanation: result.explanation,
                details: result
            };
        } catch (error) {
            return {
                type: VerificationType.AI_POWERED,
                passed: false,
                status: VerificationStatus.ERROR,
                error: error.message
            };
        }
    }

    /**
     * Verify visual
     */
    async verifyVisual(screenshot, expectations) {
        const prompt = `
            Analyze this screenshot and verify:
            ${expectations.map(e => `- ${e}`).join('\n')}
            
            Respond with JSON: { "passed": boolean, "confidence": number, "findings": [] }
        `;
        
        try {
            const response = await this._callAIWithImage(prompt, screenshot);
            return {
                type: VerificationType.VISUAL,
                ...this._parseResponse(response)
            };
        } catch (error) {
            return {
                type: VerificationType.VISUAL,
                passed: false,
                status: VerificationStatus.ERROR,
                error: error.message
            };
        }
    }

    /**
     * Verify semantic meaning
     */
    async verifySemantic(actual, expected, context = '') {
        const prompt = `
            Compare these two values semantically:
            Actual: "${actual}"
            Expected: "${expected}"
            Context: ${context}
            
            Are they semantically equivalent (same meaning)? 
            Respond with JSON: { "equivalent": boolean, "confidence": number, "explanation": string }
        `;
        
        try {
            const response = await this._callAI(prompt);
            const result = JSON.parse(response);
            
            return {
                type: VerificationType.SEMANTIC,
                passed: result.equivalent && result.confidence >= this.options.threshold,
                confidence: result.confidence,
                explanation: result.explanation
            };
        } catch (error) {
            // Fallback to string comparison
            return {
                type: VerificationType.SEMANTIC,
                passed: actual.toLowerCase() === expected.toLowerCase(),
                confidence: 1.0,
                explanation: 'Exact match fallback'
            };
        }
    }

    /**
     * Build verification prompt
     */
    _buildPrompt(context, query) {
        return `
            Verification Request:
            ${query}
            
            Context:
            ${JSON.stringify(context, null, 2)}
            
            Respond with JSON format:
            {
                "passed": boolean,
                "confidence": number (0-1),
                "explanation": string,
                "suggestions": []
            }
        `;
    }

    /**
     * Call AI
     */
    async _callAI(prompt) {
        if (this.client) {
            return this.client.complete(prompt);
        }
        
        // Simulation for testing
        return JSON.stringify({
            passed: true,
            confidence: 0.85,
            explanation: 'Verification passed based on AI analysis'
        });
    }

    /**
     * Call AI with image
     */
    async _callAIWithImage(prompt, image) {
        if (this.client?.vision) {
            return this.client.vision(prompt, image);
        }
        
        return JSON.stringify({
            passed: true,
            confidence: 0.9,
            findings: []
        });
    }

    /**
     * Parse AI response
     */
    _parseResponse(response) {
        try {
            return JSON.parse(response);
        } catch {
            return {
                passed: false,
                confidence: 0,
                explanation: 'Failed to parse AI response'
            };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HYBRID VERIFIER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * HybridVerifier - Combines rule-based and AI verification
 */
class HybridVerifier extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            ruleWeight: options.ruleWeight || 0.6,
            aiWeight: options.aiWeight || 0.4,
            parallelExecution: options.parallelExecution !== false,
            failFast: options.failFast || false,
            aiEnabled: options.aiEnabled !== false,
            ...options
        };
        
        this.ruleVerifier = new RuleBasedVerifier(options);
        this.aiVerifier = new AIVerifier(options);
        
        this.stats = {
            verifications: 0,
            passed: 0,
            failed: 0,
            avgConfidence: 0
        };
    }

    /**
     * Add rule
     */
    addRule(rule) {
        this.ruleVerifier.addRule(rule);
        return this;
    }

    /**
     * Verify with hybrid approach
     */
    async verify(context, options = {}) {
        this.stats.verifications++;
        const startTime = Date.now();
        
        this.emit('verify:start', { context });
        
        let ruleResult, aiResult;
        
        if (this.options.parallelExecution) {
            // Execute in parallel
            const promises = [
                this.ruleVerifier.verify(context)
            ];
            
            if (this.options.aiEnabled && options.aiQuery) {
                promises.push(this.aiVerifier.verify(context, options.aiQuery));
            }
            
            [ruleResult, aiResult] = await Promise.all(promises);
        } else {
            // Sequential execution
            ruleResult = await this.ruleVerifier.verify(context);
            
            if (this.options.failFast && !ruleResult.passed) {
                return this._buildResult(ruleResult, null, startTime);
            }
            
            if (this.options.aiEnabled && options.aiQuery) {
                aiResult = await this.aiVerifier.verify(context, options.aiQuery);
            }
        }
        
        return this._buildResult(ruleResult, aiResult, startTime);
    }

    /**
     * Build combined result
     */
    _buildResult(ruleResult, aiResult, startTime) {
        const result = {
            type: VerificationType.HYBRID,
            duration: Date.now() - startTime,
            rule: ruleResult,
            ai: aiResult,
            passed: false,
            confidence: 0,
            details: {}
        };
        
        // Calculate combined result
        if (aiResult) {
            const ruleScore = ruleResult.passed ? 1 : 0;
            const aiScore = aiResult.confidence || 0;
            
            result.confidence = 
                (ruleScore * this.options.ruleWeight) + 
                (aiScore * this.options.aiWeight);
            
            result.passed = result.confidence >= 0.5 && ruleResult.passed;
        } else {
            result.passed = ruleResult.passed;
            result.confidence = ruleResult.passed ? 1 : 0;
        }
        
        // Update stats
        if (result.passed) {
            this.stats.passed++;
        } else {
            this.stats.failed++;
        }
        
        this.stats.avgConfidence = 
            (this.stats.avgConfidence * (this.stats.verifications - 1) + result.confidence) / 
            this.stats.verifications;
        
        this.emit('verify:complete', result);
        
        return result;
    }

    /**
     * Verify semantic
     */
    async verifySemantic(actual, expected, context = '') {
        return this.aiVerifier.verifySemantic(actual, expected, context);
    }

    /**
     * Verify visual
     */
    async verifyVisual(screenshot, expectations) {
        return this.aiVerifier.verifyVisual(screenshot, expectations);
    }

    /**
     * Get stats
     */
    getStats() {
        return {
            ...this.stats,
            passRate: this.stats.verifications > 0 ?
                this.stats.passed / this.stats.verifications : 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFICATION BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * VerificationBuilder - Fluent builder for verifications
 */
class VerificationBuilder {
    constructor(verifier) {
        this.verifier = verifier;
        this.rules = [];
        this._aiQuery = null;
        this._context = {};
    }

    /**
     * Element exists
     */
    elementExists(selector, options = {}) {
        this.rules.push(new ElementExistsRule(selector, options));
        return this;
    }

    /**
     * Element visible
     */
    elementVisible(selector, options = {}) {
        this.rules.push(new ElementVisibleRule(selector, options));
        return this;
    }

    /**
     * Text contains
     */
    textContains(selector, text, options = {}) {
        this.rules.push(new TextContainsRule(selector, text, options));
        return this;
    }

    /**
     * URL matches
     */
    urlMatches(pattern, options = {}) {
        this.rules.push(new URLMatchesRule(pattern, options));
        return this;
    }

    /**
     * Custom value check
     */
    value(getValue, expected, options = {}) {
        this.rules.push(new ValueEqualsRule(getValue, expected, options));
        return this;
    }

    /**
     * AI query
     */
    aiVerify(query) {
        this._aiQuery = query;
        return this;
    }

    /**
     * Set context
     */
    withContext(context) {
        this._context = { ...this._context, ...context };
        return this;
    }

    /**
     * Execute verification
     */
    async execute() {
        // Add rules to verifier
        for (const rule of this.rules) {
            this.verifier.addRule(rule);
        }
        
        return this.verifier.verify(this._context, { aiQuery: this._aiQuery });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultVerifier = null;

module.exports = {
    // Classes
    VerificationRule,
    RuleBasedVerifier,
    AIVerifier,
    HybridVerifier,
    VerificationBuilder,
    
    // Built-in rules
    ElementExistsRule,
    ElementVisibleRule,
    TextContainsRule,
    URLMatchesRule,
    ValueEqualsRule,
    
    // Types
    VerificationType,
    VerificationStatus,
    
    // Factory
    createVerifier: (options = {}) => new HybridVerifier(options),
    createBuilder: (verifier) => new VerificationBuilder(verifier || new HybridVerifier()),
    
    // Singleton
    getHybridVerifier: (options = {}) => {
        if (!defaultVerifier) {
            defaultVerifier = new HybridVerifier(options);
        }
        return defaultVerifier;
    }
};

console.log('✅ Step 19/50: Hybrid Verifier loaded');
