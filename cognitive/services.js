/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 11/50: Cognitive Services                          ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description AI-powered cognitive services for automation
 * @phase 1 - Enterprise Foundation
 * @step 11 of 50
 */

'use strict';

const EventEmitter = require('events');
const { getIntegrator } = require('./model-integrator');

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IntentClassifier - Classify user intents from natural language
 */
class IntentClassifier extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        this.intents = new Map();
        this.examples = new Map();
        this.threshold = options.threshold || 0.7;
    }

    /**
     * Register intent
     */
    registerIntent(name, config) {
        this.intents.set(name, {
            name,
            description: config.description || '',
            parameters: config.parameters || [],
            examples: config.examples || [],
            handler: config.handler
        });
        
        // Store examples for training
        if (config.examples) {
            this.examples.set(name, config.examples);
        }
        
        return this;
    }

    /**
     * Classify text
     */
    async classify(text, options = {}) {
        const integrator = getIntegrator();
        
        // Build classification prompt
        const intentList = Array.from(this.intents.entries()).map(([name, config]) => 
            `- ${name}: ${config.description}\n  Examples: ${config.examples.slice(0, 3).join(', ')}`
        ).join('\n');
        
        const prompt = `Classify the following user input into one of these intents:

${intentList}

User input: "${text}"

Respond with JSON:
{
  "intent": "intent_name",
  "confidence": 0.0-1.0,
  "parameters": {},
  "reasoning": "brief explanation"
}`;

        try {
            const response = await integrator.complete(prompt, {
                temperature: 0.3,
                maxTokens: 200
            });
            
            const content = response.choices[0].message.content;
            
            // Parse response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                
                this.emit('classified', { text, result });
                
                return {
                    intent: result.intent,
                    confidence: result.confidence,
                    parameters: result.parameters || {},
                    reasoning: result.reasoning,
                    raw: content
                };
            }
            
            return { intent: 'unknown', confidence: 0, parameters: {} };
            
        } catch (error) {
            // Fallback to keyword matching
            return this._keywordFallback(text);
        }
    }

    /**
     * Keyword-based fallback classification
     */
    _keywordFallback(text) {
        const textLower = text.toLowerCase();
        let bestMatch = { intent: 'unknown', confidence: 0 };
        
        for (const [name, config] of this.intents) {
            for (const example of config.examples) {
                const exampleWords = example.toLowerCase().split(/\s+/);
                const textWords = textLower.split(/\s+/);
                
                const matches = exampleWords.filter(w => textWords.includes(w)).length;
                const confidence = matches / Math.max(exampleWords.length, 1);
                
                if (confidence > bestMatch.confidence) {
                    bestMatch = { intent: name, confidence };
                }
            }
        }
        
        return { ...bestMatch, parameters: {}, fallback: true };
    }

    /**
     * Execute intent handler
     */
    async execute(text, context = {}) {
        const classification = await this.classify(text);
        
        if (classification.confidence < this.threshold) {
            return {
                success: false,
                reason: 'Low confidence classification',
                classification
            };
        }
        
        const intent = this.intents.get(classification.intent);
        
        if (!intent || !intent.handler) {
            return {
                success: false,
                reason: 'No handler for intent',
                classification
            };
        }
        
        try {
            const result = await intent.handler(classification.parameters, context);
            
            return {
                success: true,
                result,
                classification
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                classification
            };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY EXTRACTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * EntityExtractor - Extract entities from text
 */
class EntityExtractor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.entityTypes = new Map();
        
        // Register built-in types
        this._registerBuiltInTypes();
    }

    /**
     * Register built-in entity types
     */
    _registerBuiltInTypes() {
        this.registerType('email', {
            pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            normalize: (v) => v.toLowerCase()
        });
        
        this.registerType('phone', {
            pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            normalize: (v) => v.replace(/[-.\s]/g, '')
        });
        
        this.registerType('url', {
            pattern: /https?:\/\/[^\s]+/g
        });
        
        this.registerType('date', {
            pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{2}[\/\-]\d{2}\b/g
        });
        
        this.registerType('number', {
            pattern: /\b\d+(?:\.\d+)?\b/g,
            normalize: (v) => parseFloat(v)
        });
        
        this.registerType('currency', {
            pattern: /\$[\d,]+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP)/gi,
            normalize: (v) => parseFloat(v.replace(/[$,]/g, ''))
        });
    }

    /**
     * Register entity type
     */
    registerType(name, config) {
        this.entityTypes.set(name, {
            name,
            pattern: config.pattern,
            normalize: config.normalize || ((v) => v),
            validate: config.validate || (() => true),
            description: config.description || ''
        });
        
        return this;
    }

    /**
     * Extract entities from text
     */
    extract(text, types = null) {
        const entities = [];
        const typesToExtract = types ? 
            types.map(t => this.entityTypes.get(t)).filter(Boolean) :
            Array.from(this.entityTypes.values());
        
        for (const entityType of typesToExtract) {
            const matches = text.matchAll(entityType.pattern);
            
            for (const match of matches) {
                const value = entityType.normalize(match[0]);
                
                if (entityType.validate(value)) {
                    entities.push({
                        type: entityType.name,
                        value,
                        raw: match[0],
                        start: match.index,
                        end: match.index + match[0].length
                    });
                }
            }
        }
        
        // Sort by position
        entities.sort((a, b) => a.start - b.start);
        
        this.emit('extracted', { text, entities });
        
        return entities;
    }

    /**
     * Extract with AI enhancement
     */
    async extractWithAI(text, entityTypes = []) {
        const integrator = getIntegrator();
        
        const prompt = `Extract the following entities from the text:
Entity types: ${entityTypes.length > 0 ? entityTypes.join(', ') : 'any relevant entities'}

Text: "${text}"

Respond with JSON array:
[{"type": "entity_type", "value": "extracted_value", "confidence": 0.0-1.0}]`;

        try {
            const response = await integrator.complete(prompt, {
                temperature: 0.2,
                maxTokens: 500
            });
            
            const content = response.choices[0].message.content;
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            
            if (jsonMatch) {
                const aiEntities = JSON.parse(jsonMatch[0]);
                const regexEntities = this.extract(text);
                
                // Merge and dedupe
                return this._mergeEntities(regexEntities, aiEntities);
            }
            
            return this.extract(text);
            
        } catch (error) {
            return this.extract(text);
        }
    }

    /**
     * Merge regex and AI entities
     */
    _mergeEntities(regexEntities, aiEntities) {
        const merged = [...regexEntities];
        
        for (const aiEntity of aiEntities) {
            const exists = merged.some(e => 
                e.type === aiEntity.type && 
                e.value === aiEntity.value
            );
            
            if (!exists) {
                merged.push({
                    ...aiEntity,
                    source: 'ai'
                });
            }
        }
        
        return merged;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SENTIMENT ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SentimentAnalyzer - Analyze text sentiment
 */
class SentimentAnalyzer extends EventEmitter {
    constructor() {
        super();
        
        // Simple word lists for basic sentiment
        this.positiveWords = new Set([
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'love', 'like', 'best', 'perfect', 'awesome', 'happy', 'success'
        ]);
        
        this.negativeWords = new Set([
            'bad', 'terrible', 'awful', 'horrible', 'hate', 'worst',
            'fail', 'error', 'problem', 'issue', 'wrong', 'broken', 'bug'
        ]);
    }

    /**
     * Analyze sentiment
     */
    analyze(text) {
        const words = text.toLowerCase().split(/\s+/);
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        for (const word of words) {
            if (this.positiveWords.has(word)) positiveCount++;
            if (this.negativeWords.has(word)) negativeCount++;
        }
        
        const total = positiveCount + negativeCount;
        
        let sentiment = 'neutral';
        let score = 0;
        
        if (total > 0) {
            score = (positiveCount - negativeCount) / total;
            
            if (score > 0.2) sentiment = 'positive';
            else if (score < -0.2) sentiment = 'negative';
        }
        
        return {
            sentiment,
            score, // -1 to 1
            confidence: total > 0 ? Math.min(total / words.length, 1) : 0.5,
            details: {
                positiveWords: positiveCount,
                negativeWords: negativeCount,
                totalWords: words.length
            }
        };
    }

    /**
     * Analyze with AI
     */
    async analyzeWithAI(text) {
        const integrator = getIntegrator();
        
        const prompt = `Analyze the sentiment of this text:

"${text}"

Respond with JSON:
{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "score": -1.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "aspects": [{"aspect": "name", "sentiment": "positive/negative/neutral"}],
  "explanation": "brief explanation"
}`;

        try {
            const response = await integrator.complete(prompt, {
                temperature: 0.3,
                maxTokens: 300
            });
            
            const content = response.choices[0].message.content;
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            return this.analyze(text);
            
        } catch (error) {
            return this.analyze(text);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT SUMMARIZER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TextSummarizer - Summarize text content
 */
class TextSummarizer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxLength: options.maxLength || 200,
            style: options.style || 'concise',
            ...options
        };
    }

    /**
     * Summarize text
     */
    async summarize(text, options = {}) {
        const integrator = getIntegrator();
        const maxLength = options.maxLength || this.options.maxLength;
        const style = options.style || this.options.style;
        
        const prompt = `Summarize the following text in a ${style} manner. 
Keep the summary under ${maxLength} characters.

Text:
${text}

Summary:`;

        const response = await integrator.complete(prompt, {
            temperature: 0.5,
            maxTokens: Math.ceil(maxLength / 3)
        });
        
        const summary = response.choices[0].message.content.trim();
        
        this.emit('summarized', { 
            originalLength: text.length,
            summaryLength: summary.length,
            compressionRatio: summary.length / text.length
        });
        
        return {
            summary,
            originalLength: text.length,
            summaryLength: summary.length
        };
    }

    /**
     * Extract key points
     */
    async extractKeyPoints(text, count = 5) {
        const integrator = getIntegrator();
        
        const prompt = `Extract ${count} key points from this text:

${text}

Respond with JSON array:
["point 1", "point 2", ...]`;

        const response = await integrator.complete(prompt, {
            temperature: 0.3,
            maxTokens: 500
        });
        
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CODE ANALYZER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CodeAnalyzer - Analyze and understand code
 */
class CodeAnalyzer extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * Explain code
     */
    async explain(code, language = 'auto') {
        const integrator = getIntegrator();
        
        const prompt = `Explain this ${language !== 'auto' ? language : ''} code:

\`\`\`
${code}
\`\`\`

Provide:
1. Brief summary of what it does
2. Step-by-step explanation
3. Any potential issues or improvements`;

        const response = await integrator.complete(prompt, {
            temperature: 0.3,
            maxTokens: 1000
        });
        
        return response.choices[0].message.content;
    }

    /**
     * Generate tests for code
     */
    async generateTests(code, framework = 'jest') {
        const integrator = getIntegrator();
        
        const prompt = `Generate ${framework} tests for this code:

\`\`\`
${code}
\`\`\`

Generate comprehensive test cases including edge cases.`;

        const response = await integrator.complete(prompt, {
            temperature: 0.3,
            maxTokens: 1500
        });
        
        return response.choices[0].message.content;
    }

    /**
     * Review code
     */
    async review(code, language = 'auto') {
        const integrator = getIntegrator();
        
        const prompt = `Review this ${language !== 'auto' ? language : ''} code:

\`\`\`
${code}
\`\`\`

Analyze for:
1. Bugs and potential issues
2. Security vulnerabilities
3. Performance concerns
4. Code style and best practices
5. Suggestions for improvement

Respond with JSON:
{
  "issues": [{"severity": "high/medium/low", "type": "bug/security/performance/style", "description": "...", "line": null}],
  "suggestions": ["..."],
  "score": 0-100
}`;

        const response = await integrator.complete(prompt, {
            temperature: 0.3,
            maxTokens: 1500
        });
        
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return { issues: [], suggestions: [], score: 50 };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COGNITIVE SERVICES FACADE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CognitiveServices - Unified access to all cognitive services
 */
class CognitiveServices extends EventEmitter {
    constructor() {
        super();
        
        this.intentClassifier = new IntentClassifier();
        this.entityExtractor = new EntityExtractor();
        this.sentimentAnalyzer = new SentimentAnalyzer();
        this.textSummarizer = new TextSummarizer();
        this.codeAnalyzer = new CodeAnalyzer();
    }

    /**
     * Get intent classifier
     */
    get intents() {
        return this.intentClassifier;
    }

    /**
     * Get entity extractor
     */
    get entities() {
        return this.entityExtractor;
    }

    /**
     * Get sentiment analyzer
     */
    get sentiment() {
        return this.sentimentAnalyzer;
    }

    /**
     * Get text summarizer
     */
    get summarizer() {
        return this.textSummarizer;
    }

    /**
     * Get code analyzer
     */
    get code() {
        return this.codeAnalyzer;
    }

    /**
     * Full NLU analysis
     */
    async analyze(text) {
        const [intent, entities, sentiment] = await Promise.all([
            this.intentClassifier.classify(text).catch(() => ({ intent: 'unknown', confidence: 0 })),
            Promise.resolve(this.entityExtractor.extract(text)),
            Promise.resolve(this.sentimentAnalyzer.analyze(text))
        ]);
        
        return {
            text,
            intent,
            entities,
            sentiment,
            timestamp: new Date().toISOString()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

// Singleton
let servicesInstance = null;

module.exports = {
    IntentClassifier,
    EntityExtractor,
    SentimentAnalyzer,
    TextSummarizer,
    CodeAnalyzer,
    CognitiveServices,
    
    // Singleton getter
    getServices: () => {
        if (!servicesInstance) {
            servicesInstance = new CognitiveServices();
        }
        return servicesInstance;
    }
};

console.log('✅ Step 11/50: Cognitive Services loaded');
