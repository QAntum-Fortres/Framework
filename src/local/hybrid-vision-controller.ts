/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of QAntum.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited without express written permission.
 * 
 * For licensing inquiries: dimitar.prodromov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 HYBRID VISION CONTROLLER - Gemini + Ollama Llava Fallback
// ═══════════════════════════════════════════════════════════════════════════════
// Intelligent vision analysis with automatic fallback when Gemini latency > 2000ms.
// Leverages local RTX 4050 for Ollama when cloud is slow.
// ═══════════════════════════════════════════════════════════════════════════════

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Vision analysis result
 */
export interface VisionAnalysisResult {
    /** Extracted text from image */
    text: string;
    /** Detected elements */
    elements: DetectedElement[];
    /** Analysis confidence */
    confidence: number;
    /** Provider used */
    provider: 'gemini' | 'ollama-llava';
    /** Processing time (ms) */
    latency: number;
    /** Raw response */
    rawResponse?: string;
    /** Fallback triggered */
    fallbackUsed: boolean;
}

/**
 * Detected UI element
 */
export interface DetectedElement {
    /** Element type */
    type: string;
    /** Element description */
    description: string;
    /** Bounding box (if available) */
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /** Confidence score */
    confidence: number;
    /** Element text content */
    text?: string;
    /** Suggested selector */
    selector?: string;
}

/**
 * Vision controller configuration
 */
export interface HybridVisionConfig {
    /** Gemini API key */
    geminiApiKey?: string;
    /** Gemini model */
    geminiModel: string;
    /** Ollama endpoint */
    ollamaEndpoint: string;
    /** Ollama model */
    ollamaModel: string;
    /** Latency threshold for fallback (ms) */
    latencyThreshold: number;
    /** Enable fallback */
    enableFallback: boolean;
    /** Timeout (ms) */
    timeout: number;
    /** Retry count */
    retryCount: number;
}

/**
 * Provider health status
 */
interface ProviderHealth {
    gemini: {
        available: boolean;
        avgLatency: number;
        successRate: number;
        lastCheck: number;
    };
    ollama: {
        available: boolean;
        avgLatency: number;
        successRate: number;
        lastCheck: number;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 HYBRID VISION CONTROLLER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class HybridVisionController extends EventEmitter {
    private config: HybridVisionConfig;
    private health: ProviderHealth;
    private latencyHistory: { gemini: number[]; ollama: number[] };
    
    constructor(config?: Partial<HybridVisionConfig>) {
        super();
        this.config = {
            geminiApiKey: config?.geminiApiKey || process.env['GEMINI_API_KEY'],
            geminiModel: config?.geminiModel || 'gemini-2.0-flash-exp',
            ollamaEndpoint: config?.ollamaEndpoint || 'http://localhost:11434',
            ollamaModel: config?.ollamaModel || 'llava:13b',
            latencyThreshold: config?.latencyThreshold || 2000,
            enableFallback: config?.enableFallback ?? true,
            timeout: config?.timeout || 30000,
            retryCount: config?.retryCount || 2
        };
        
        this.health = {
            gemini: { available: true, avgLatency: 0, successRate: 1, lastCheck: 0 },
            ollama: { available: true, avgLatency: 0, successRate: 1, lastCheck: 0 }
        };
        
        this.latencyHistory = { gemini: [], ollama: [] };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🚀 INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Initialize and health check both providers
     */
    async initialize(): Promise<void> {
        await Promise.all([
            this.checkGeminiHealth(),
            this.checkOllamaHealth()
        ]);
        
        this.emit('initialized', this.health);
    }
    
    /**
     * Check Gemini API health
     */
    private async checkGeminiHealth(): Promise<void> {
        try {
            if (!this.config.geminiApiKey) {
                this.health.gemini.available = false;
                return;
            }
            
            const startTime = Date.now();
            // Simple API ping - just check if endpoint responds
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.geminiApiKey}`,
                { method: 'GET', signal: AbortSignal.timeout(5000) }
            );
            
            this.health.gemini.available = response.ok;
            this.health.gemini.avgLatency = Date.now() - startTime;
            this.health.gemini.lastCheck = Date.now();
        } catch {
            this.health.gemini.available = false;
        }
    }
    
    /**
     * Check Ollama health
     */
    private async checkOllamaHealth(): Promise<void> {
        try {
            const startTime = Date.now();
            const response = await fetch(`${this.config.ollamaEndpoint}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const data = await response.json() as { models?: Array<{ name: string }> };
                // Check if llava model is available
                const hasLlava = data.models?.some((m: { name: string }) => 
                    m.name.includes('llava')
                );
                this.health.ollama.available = hasLlava || false;
            } else {
                this.health.ollama.available = false;
            }
            
            this.health.ollama.avgLatency = Date.now() - startTime;
            this.health.ollama.lastCheck = Date.now();
        } catch {
            this.health.ollama.available = false;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔍 VISION ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Analyze image with automatic fallback
     */
    async analyzeImage(
        imagePath: string, 
        prompt: string = 'Analyze this UI screenshot and identify all interactive elements.'
    ): Promise<VisionAnalysisResult> {
        // Read image
        const imageData = await this.readImage(imagePath);
        
        // Try Gemini first
        if (this.health.gemini.available) {
            const startTime = Date.now();
            
            try {
                const result = await this.analyzeWithGemini(imageData, prompt);
                const latency = Date.now() - startTime;
                
                this.updateLatencyHistory('gemini', latency);
                
                // Check if we should fallback due to high latency
                if (latency > this.config.latencyThreshold && this.config.enableFallback) {
                    this.emit('latency-warning', { provider: 'gemini', latency });
                    
                    // Try Ollama for potentially faster response
                    if (this.health.ollama.available) {
                        const ollamaResult = await this.analyzeWithOllama(imageData, prompt);
                        return {
                            ...ollamaResult,
                            fallbackUsed: true
                        };
                    }
                }
                
                return {
                    ...result,
                    provider: 'gemini',
                    latency,
                    fallbackUsed: false
                };
            } catch (error) {
                this.emit('error', { provider: 'gemini', error });
                
                // Fallback to Ollama
                if (this.config.enableFallback && this.health.ollama.available) {
                    return this.analyzeWithOllama(imageData, prompt);
                }
                
                throw error;
            }
        }
        
        // Use Ollama if Gemini not available
        if (this.health.ollama.available) {
            return this.analyzeWithOllama(imageData, prompt);
        }
        
        throw new Error('No vision provider available');
    }
    
    /**
     * Analyze with Gemini API
     */
    private async analyzeWithGemini(imageData: string, prompt: string): Promise<VisionAnalysisResult> {
        const startTime = Date.now();
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.config.geminiModel}:generateContent?key=${this.config.geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: imageData
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4096
                    }
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            }
        );
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        const data = await response.json() as {
            candidates?: Array<{
                content?: {
                    parts?: Array<{ text?: string }>;
                };
            }>;
        };
        const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        return {
            text: rawResponse,
            elements: this.parseElements(rawResponse),
            confidence: 0.9,
            provider: 'gemini',
            latency: Date.now() - startTime,
            rawResponse,
            fallbackUsed: false
        };
    }
    
    /**
     * Analyze with Ollama Llava
     */
    private async analyzeWithOllama(imageData: string, prompt: string): Promise<VisionAnalysisResult> {
        const startTime = Date.now();
        
        const response = await fetch(`${this.config.ollamaEndpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.config.ollamaModel,
                prompt: prompt,
                images: [imageData],
                stream: false,
                options: {
                    temperature: 0.1,
                    num_predict: 2048
                }
            }),
            signal: AbortSignal.timeout(this.config.timeout)
        });
        
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }
        
        const data = await response.json() as { response?: string };
        const rawResponse = data.response || '';
        const latency = Date.now() - startTime;
        
        this.updateLatencyHistory('ollama', latency);
        
        return {
            text: rawResponse,
            elements: this.parseElements(rawResponse),
            confidence: 0.85,
            provider: 'ollama-llava',
            latency,
            rawResponse,
            fallbackUsed: true
        };
    }
    
    /**
     * Analyze with racing strategy - fastest wins
     */
    async analyzeWithRacing(imagePath: string, prompt: string): Promise<VisionAnalysisResult> {
        const imageData = await this.readImage(imagePath);
        
        const providers: Promise<VisionAnalysisResult>[] = [];
        
        if (this.health.gemini.available) {
            providers.push(this.analyzeWithGemini(imageData, prompt));
        }
        
        if (this.health.ollama.available) {
            providers.push(this.analyzeWithOllama(imageData, prompt));
        }
        
        if (providers.length === 0) {
            throw new Error('No vision provider available');
        }
        
        // Race all providers
        const result = await Promise.race(providers);
        this.emit('race-winner', result.provider);
        
        return result;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🛠️ UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Read image and convert to base64
     */
    private async readImage(imagePath: string): Promise<string> {
        const absolutePath = path.isAbsolute(imagePath) 
            ? imagePath 
            : path.join(process.cwd(), imagePath);
        
        if (!fs.existsSync(absolutePath)) {
            throw new Error(`Image not found: ${absolutePath}`);
        }
        
        const buffer = fs.readFileSync(absolutePath);
        return buffer.toString('base64');
    }
    
    /**
     * Parse elements from response text
     */
    private parseElements(text: string): DetectedElement[] {
        const elements: DetectedElement[] = [];
        
        // Simple pattern matching for common UI elements
        const patterns = [
            { type: 'button', regex: /button[s]?:?\s*["']?([^"'\n,]+)/gi },
            { type: 'input', regex: /input[s]?|text\s*field[s]?:?\s*["']?([^"'\n,]+)/gi },
            { type: 'link', regex: /link[s]?:?\s*["']?([^"'\n,]+)/gi },
            { type: 'checkbox', regex: /checkbox[es]?:?\s*["']?([^"'\n,]+)/gi },
            { type: 'dropdown', regex: /dropdown[s]?|select:?\s*["']?([^"'\n,]+)/gi }
        ];
        
        for (const { type, regex } of patterns) {
            let match;
            while ((match = regex.exec(text)) !== null) {
                elements.push({
                    type,
                    description: match[1]?.trim() || type,
                    confidence: 0.7
                });
            }
        }
        
        return elements;
    }
    
    /**
     * Update latency history
     */
    private updateLatencyHistory(provider: 'gemini' | 'ollama', latency: number): void {
        const history = this.latencyHistory[provider];
        history.push(latency);
        
        // Keep last 10 readings
        if (history.length > 10) {
            history.shift();
        }
        
        // Update average
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        this.health[provider].avgLatency = avg;
    }
    
    /**
     * Get current health status
     */
    getHealth(): ProviderHealth {
        return { ...this.health };
    }
    
    /**
     * Get configuration
     */
    getConfig(): HybridVisionConfig {
        return { ...this.config };
    }
    
    /**
     * Update latency threshold
     */
    setLatencyThreshold(ms: number): void {
        this.config.latencyThreshold = ms;
        this.emit('config-updated', { latencyThreshold: ms });
    }
    
    /**
     * Toggle fallback
     */
    setFallbackEnabled(enabled: boolean): void {
        this.config.enableFallback = enabled;
        this.emit('config-updated', { enableFallback: enabled });
    }
    
    /**
     * Force provider selection
     */
    async analyzeWithProvider(
        imagePath: string, 
        prompt: string, 
        provider: 'gemini' | 'ollama-llava'
    ): Promise<VisionAnalysisResult> {
        const imageData = await this.readImage(imagePath);
        
        if (provider === 'gemini') {
            return this.analyzeWithGemini(imageData, prompt);
        } else {
            return this.analyzeWithOllama(imageData, prompt);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default HybridVisionController;
