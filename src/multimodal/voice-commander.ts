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

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎙️ THE VOICE COMMANDER - Audio Stream to Semantic Intent
// ═══════════════════════════════════════════════════════════════════════════════
// Transforms spoken commands into structured intents for the Semantic Core.
// Powered by Whisper API with real-time streaming support.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Voice command intent structure for Semantic Core integration
 */
export interface VoiceIntent {
    /** Unique intent identifier */
    id: string;
    /** Raw transcribed text */
    transcript: string;
    /** Detected intent type */
    type: IntentType;
    /** Confidence score (0-1) */
    confidence: number;
    /** Extracted entities from speech */
    entities: ExtractedEntity[];
    /** Parsed action for execution */
    action: SemanticAction | null;
    /** Timestamp of recognition */
    timestamp: number;
    /** Audio metadata */
    metadata: AudioMetadata;
}

/**
 * Supported intent types for QA operations
 */
export type IntentType = 
    | 'navigation'      // "Go to login page"
    | 'interaction'     // "Click the submit button"
    | 'assertion'       // "Verify the title is correct"
    | 'data_entry'      // "Enter email john@test.com"
    | 'screenshot'      // "Take a screenshot"
    | 'wait'            // "Wait for 3 seconds"
    | 'query'           // "What is the current URL?"
    | 'test_control'    // "Run the login test"
    | 'abort'           // "Stop the test"
    | 'unknown';

/**
 * Entity extracted from voice command
 */
export interface ExtractedEntity {
    /** Entity type */
    type: 'selector' | 'url' | 'text' | 'number' | 'duration' | 'element_type';
    /** Extracted value */
    value: string;
    /** Position in transcript */
    startIndex: number;
    /** Length of entity in transcript */
    length: number;
    /** Confidence for this entity */
    confidence: number;
}

/**
 * Semantic action ready for Sovereign execution
 */
export interface SemanticAction {
    /** Action verb */
    verb: 'click' | 'type' | 'navigate' | 'wait' | 'assert' | 'screenshot' | 'hover' | 'scroll' | 'select';
    /** Target selector or URL */
    target: string;
    /** Additional parameters */
    params: Record<string, unknown>;
    /** Priority level */
    priority: 'critical' | 'high' | 'normal' | 'low';
}

/**
 * Audio metadata from voice input
 */
export interface AudioMetadata {
    /** Duration in milliseconds */
    duration: number;
    /** Sample rate */
    sampleRate: number;
    /** Number of channels */
    channels: number;
    /** Audio format */
    format: 'wav' | 'mp3' | 'webm' | 'ogg' | 'raw';
    /** Average volume level (0-1) */
    volumeLevel: number;
    /** Signal-to-noise ratio */
    snr: number;
    /** Language detected */
    language: string;
}

/**
 * Voice Commander configuration
 */
export interface VoiceCommanderConfig {
    /** Whisper API key */
    apiKey: string;
    /** Whisper model to use */
    model: 'whisper-1' | 'whisper-large-v3';
    /** Primary language */
    language: string;
    /** Enable real-time streaming */
    streaming: boolean;
    /** Silence threshold for VAD (Voice Activity Detection) */
    silenceThreshold: number;
    /** Maximum recording duration (ms) */
    maxDuration: number;
    /** Custom vocabulary for QA terms */
    customVocabulary: string[];
    /** Enable intent caching */
    cacheIntents: boolean;
}

/**
 * Voice activity detection state
 */
interface VADState {
    isActive: boolean;
    startTime: number;
    silenceStart: number;
    volumeHistory: number[];
}

/**
 * Intent pattern for recognition
 */
interface IntentPattern {
    type: IntentType;
    patterns: RegExp[];
    entityExtractors: EntityExtractor[];
    actionBuilder: (transcript: string, entities: ExtractedEntity[]) => SemanticAction | null;
}

type EntityExtractor = (transcript: string) => ExtractedEntity | null;

// ═══════════════════════════════════════════════════════════════════════════════
// 🎙️ VOICE COMMANDER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class VoiceCommander extends EventEmitter {
    private config: VoiceCommanderConfig | null = null;
    private isListening: boolean = false;
    private vadState: VADState;
    private audioBuffer: Float32Array[] = [];
    private intentHistory: VoiceIntent[] = [];
    private intentCache: Map<string, VoiceIntent> = new Map();
    private intentPatterns: IntentPattern[];
    
    constructor() {
        super();
        this.vadState = {
            isActive: false,
            startTime: 0,
            silenceStart: 0,
            volumeHistory: []
        };
        this.intentPatterns = this.initializeIntentPatterns();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ⚙️ CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Configure the Voice Commander
     */
    configure(config: Partial<VoiceCommanderConfig>): void {
        this.config = {
            apiKey: config.apiKey || '',
            model: config.model || 'whisper-1',
            language: config.language || 'en',
            streaming: config.streaming ?? true,
            silenceThreshold: config.silenceThreshold || 0.01,
            maxDuration: config.maxDuration || 30000,
            customVocabulary: config.customVocabulary || this.getDefaultVocabulary(),
            cacheIntents: config.cacheIntents ?? true
        };
        
        this.emit('configured', this.config);
    }
    
    /**
     * Get default QA vocabulary
     */
    private getDefaultVocabulary(): string[] {
        return [
            // Actions
            'click', 'tap', 'press', 'type', 'enter', 'input', 'fill',
            'navigate', 'go to', 'open', 'visit',
            'wait', 'pause', 'delay',
            'verify', 'assert', 'check', 'confirm', 'validate',
            'screenshot', 'capture', 'snapshot',
            'hover', 'mouse over',
            'scroll', 'scroll down', 'scroll up',
            'select', 'choose', 'pick',
            
            // Elements
            'button', 'link', 'input', 'field', 'textbox', 'dropdown',
            'checkbox', 'radio', 'toggle', 'switch',
            'menu', 'modal', 'dialog', 'popup',
            'header', 'footer', 'sidebar', 'navbar',
            'form', 'table', 'list', 'card',
            
            // Selectors
            'id', 'class', 'name', 'data-testid', 'aria-label',
            'xpath', 'css selector',
            
            // Test control
            'run', 'execute', 'start', 'stop', 'abort', 'cancel',
            'repeat', 'retry', 'skip',
            
            // QAntum specific
            'QANTUM', 'sovereign', 'persona', 'chaos test'
        ];
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎤 AUDIO STREAMING
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Start listening for voice commands
     */
    async startListening(): Promise<void> {
        if (!this.config) {
            throw new Error('VoiceCommander not configured. Call configure() first.');
        }
        
        if (this.isListening) {
            return;
        }
        
        this.isListening = true;
        this.audioBuffer = [];
        this.vadState = {
            isActive: false,
            startTime: Date.now(),
            silenceStart: 0,
            volumeHistory: []
        };
        
        this.emit('listening:start');
    }
    
    /**
     * Stop listening for voice commands
     */
    async stopListening(): Promise<void> {
        if (!this.isListening) {
            return;
        }
        
        this.isListening = false;
        
        // Process any remaining audio
        if (this.audioBuffer.length > 0) {
            await this.processAudioBuffer();
        }
        
        this.emit('listening:stop');
    }
    
    /**
     * Process incoming audio chunk
     */
    async processAudioChunk(chunk: Float32Array): Promise<VoiceIntent | null> {
        if (!this.isListening || !this.config) {
            return null;
        }
        
        // Calculate volume level
        const volume = this.calculateVolume(chunk);
        this.vadState.volumeHistory.push(volume);
        
        // Keep only last 50 samples for VAD
        if (this.vadState.volumeHistory.length > 50) {
            this.vadState.volumeHistory.shift();
        }
        
        // Voice Activity Detection
        const isVoiceActive = volume > this.config.silenceThreshold;
        
        if (isVoiceActive && !this.vadState.isActive) {
            // Voice started
            this.vadState.isActive = true;
            this.vadState.startTime = Date.now();
            this.emit('voice:start');
        } else if (!isVoiceActive && this.vadState.isActive) {
            // Check for silence duration
            if (this.vadState.silenceStart === 0) {
                this.vadState.silenceStart = Date.now();
            } else if (Date.now() - this.vadState.silenceStart > 500) {
                // 500ms of silence = end of utterance
                this.vadState.isActive = false;
                this.vadState.silenceStart = 0;
                this.emit('voice:end');
                
                // Process the collected audio
                return await this.processAudioBuffer();
            }
        } else if (isVoiceActive) {
            // Reset silence timer
            this.vadState.silenceStart = 0;
        }
        
        // Add chunk to buffer if voice is active
        if (this.vadState.isActive) {
            this.audioBuffer.push(chunk);
            
            // Check max duration
            const duration = Date.now() - this.vadState.startTime;
            if (duration > this.config.maxDuration) {
                this.emit('voice:max_duration');
                return await this.processAudioBuffer();
            }
        }
        
        return null;
    }
    
    /**
     * Calculate volume level from audio chunk
     */
    private calculateVolume(chunk: Float32Array): number {
        let sum = 0;
        for (let i = 0; i < chunk.length; i++) {
            sum += chunk[i] * chunk[i];
        }
        return Math.sqrt(sum / chunk.length);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🧠 SPEECH RECOGNITION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Process audio buffer and extract intent
     */
    private async processAudioBuffer(): Promise<VoiceIntent | null> {
        if (this.audioBuffer.length === 0 || !this.config) {
            return null;
        }
        
        // Combine audio chunks
        const totalLength = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedAudio = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this.audioBuffer) {
            combinedAudio.set(chunk, offset);
            offset += chunk.length;
        }
        
        // Clear buffer
        this.audioBuffer = [];
        
        // Create audio metadata
        const metadata: AudioMetadata = {
            duration: combinedAudio.length / 16000 * 1000, // Assuming 16kHz
            sampleRate: 16000,
            channels: 1,
            format: 'raw',
            volumeLevel: this.calculateVolume(combinedAudio),
            snr: this.calculateSNR(combinedAudio),
            language: this.config.language
        };
        
        // Transcribe audio
        const transcript = await this.transcribeAudio(combinedAudio);
        
        if (!transcript || transcript.trim().length === 0) {
            return null;
        }
        
        // Parse intent from transcript
        const intent = this.parseIntent(transcript, metadata);
        
        // Cache if enabled
        if (this.config.cacheIntents) {
            const cacheKey = this.normalizeForCache(transcript);
            this.intentCache.set(cacheKey, intent);
        }
        
        // Add to history
        this.intentHistory.push(intent);
        
        // Emit intent
        this.emit('intent', intent);
        
        return intent;
    }
    
    /**
     * Transcribe audio using Whisper API
     */
    private async transcribeAudio(audio: Float32Array): Promise<string> {
        if (!this.config) {
            throw new Error('Not configured');
        }
        
        // Convert Float32Array to WAV format
        const wavBuffer = this.float32ToWav(audio);
        
        // Create form data for API
        const formData = new FormData();
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        formData.append('file', blob, 'audio.wav');
        formData.append('model', this.config.model);
        formData.append('language', this.config.language);
        formData.append('prompt', this.config.customVocabulary.join(', '));
        
        try {
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Whisper API error: ${response.status}`);
            }
            
            const result = await response.json();
            return result.text || '';
        } catch (error) {
            this.emit('error', error);
            return '';
        }
    }
    
    /**
     * Convert Float32Array to WAV buffer
     */
    private float32ToWav(samples: Float32Array): ArrayBuffer {
        const sampleRate = 16000;
        const numChannels = 1;
        const bitsPerSample = 16;
        
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
        view.setUint16(32, numChannels * bitsPerSample / 8, true);
        view.setUint16(34, bitsPerSample, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        
        // Convert samples
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
        
        return buffer;
    }
    
    /**
     * Calculate Signal-to-Noise Ratio
     */
    private calculateSNR(audio: Float32Array): number {
        // Simple SNR estimation
        const sorted = Array.from(audio).map(Math.abs).sort((a, b) => a - b);
        const noiseFloor = sorted[Math.floor(sorted.length * 0.1)];
        const signalPeak = sorted[Math.floor(sorted.length * 0.9)];
        
        if (noiseFloor === 0) return 60; // Very clean
        return 20 * Math.log10(signalPeak / noiseFloor);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 INTENT PARSING
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Parse voice transcript into semantic intent
     */
    parseIntent(transcript: string, metadata: AudioMetadata): VoiceIntent {
        const normalizedTranscript = transcript.toLowerCase().trim();
        
        // Check cache first
        if (this.config?.cacheIntents) {
            const cacheKey = this.normalizeForCache(normalizedTranscript);
            const cached = this.intentCache.get(cacheKey);
            if (cached) {
                return {
                    ...cached,
                    id: this.generateIntentId(),
                    timestamp: Date.now(),
                    metadata
                };
            }
        }
        
        // Find matching intent pattern
        let bestMatch: { pattern: IntentPattern; confidence: number } | null = null;
        
        for (const pattern of this.intentPatterns) {
            for (const regex of pattern.patterns) {
                if (regex.test(normalizedTranscript)) {
                    const confidence = this.calculatePatternConfidence(normalizedTranscript, regex);
                    if (!bestMatch || confidence > bestMatch.confidence) {
                        bestMatch = { pattern, confidence };
                    }
                }
            }
        }
        
        // Extract entities
        const entities: ExtractedEntity[] = [];
        if (bestMatch) {
            for (const extractor of bestMatch.pattern.entityExtractors) {
                const entity = extractor(normalizedTranscript);
                if (entity) {
                    entities.push(entity);
                }
            }
        }
        
        // Build action
        const action = bestMatch?.pattern.actionBuilder(normalizedTranscript, entities) || null;
        
        return {
            id: this.generateIntentId(),
            transcript,
            type: bestMatch?.pattern.type || 'unknown',
            confidence: bestMatch?.confidence || 0,
            entities,
            action,
            timestamp: Date.now(),
            metadata
        };
    }
    
    /**
     * Initialize intent recognition patterns
     */
    private initializeIntentPatterns(): IntentPattern[] {
        return [
            // Navigation intents
            {
                type: 'navigation',
                patterns: [
                    /^(go to|navigate to|open|visit)\s+(.+)$/i,
                    /^(go|navigate)\s+(to\s+)?(.+)$/i
                ],
                entityExtractors: [this.extractURL.bind(this)],
                actionBuilder: (transcript, entities) => {
                    const urlEntity = entities.find(e => e.type === 'url');
                    return {
                        verb: 'navigate',
                        target: urlEntity?.value || this.extractTargetFromTranscript(transcript),
                        params: {},
                        priority: 'high'
                    };
                }
            },
            
            // Click intents
            {
                type: 'interaction',
                patterns: [
                    /^(click|tap|press)\s+(on\s+)?(the\s+)?(.+)$/i,
                    /^(click|tap|press)\s+(.+)$/i
                ],
                entityExtractors: [this.extractSelector.bind(this), this.extractElementType.bind(this)],
                actionBuilder: (transcript, entities) => {
                    const selector = entities.find(e => e.type === 'selector');
                    const elementType = entities.find(e => e.type === 'element_type');
                    return {
                        verb: 'click',
                        target: selector?.value || this.buildSelectorFromContext(transcript, elementType?.value),
                        params: {},
                        priority: 'normal'
                    };
                }
            },
            
            // Type/Input intents
            {
                type: 'data_entry',
                patterns: [
                    /^(type|enter|input|fill)\s+(.+?)\s+(in|into)\s+(.+)$/i,
                    /^(type|enter|input)\s+["'](.+)["']$/i
                ],
                entityExtractors: [this.extractText.bind(this), this.extractSelector.bind(this)],
                actionBuilder: (transcript, entities) => {
                    const textEntity = entities.find(e => e.type === 'text');
                    const selectorEntity = entities.find(e => e.type === 'selector');
                    return {
                        verb: 'type',
                        target: selectorEntity?.value || 'input:focus',
                        params: { text: textEntity?.value || '' },
                        priority: 'normal'
                    };
                }
            },
            
            // Wait intents
            {
                type: 'wait',
                patterns: [
                    /^(wait|pause|delay)\s+(for\s+)?(\d+)\s*(seconds?|ms|milliseconds?)?$/i,
                    /^(wait|pause)\s+(.+)$/i
                ],
                entityExtractors: [this.extractDuration.bind(this)],
                actionBuilder: (transcript, entities) => {
                    const duration = entities.find(e => e.type === 'duration');
                    return {
                        verb: 'wait',
                        target: '',
                        params: { duration: parseInt(duration?.value || '1000') },
                        priority: 'low'
                    };
                }
            },
            
            // Assertion intents
            {
                type: 'assertion',
                patterns: [
                    /^(verify|assert|check|confirm|validate)\s+(that\s+)?(.+)$/i,
                    /^(should|must)\s+(have|contain|be)\s+(.+)$/i
                ],
                entityExtractors: [this.extractText.bind(this)],
                actionBuilder: (transcript, entities) => {
                    return {
                        verb: 'assert',
                        target: 'page',
                        params: { condition: transcript },
                        priority: 'high'
                    };
                }
            },
            
            // Screenshot intents
            {
                type: 'screenshot',
                patterns: [
                    /^(take\s+)?(a\s+)?screenshot$/i,
                    /^(capture|snapshot)\s+(the\s+)?(screen|page)?$/i
                ],
                entityExtractors: [],
                actionBuilder: () => ({
                    verb: 'screenshot',
                    target: 'page',
                    params: { fullPage: true },
                    priority: 'normal'
                })
            },
            
            // Test control intents
            {
                type: 'test_control',
                patterns: [
                    /^(run|execute|start)\s+(the\s+)?(.+)\s+test$/i,
                    /^(run|execute)\s+(.+)$/i
                ],
                entityExtractors: [this.extractText.bind(this)],
                actionBuilder: (transcript, entities) => {
                    const testName = entities.find(e => e.type === 'text');
                    return {
                        verb: 'click', // Will be interpreted by test runner
                        target: `test:${testName?.value || 'all'}`,
                        params: { isTestControl: true },
                        priority: 'critical'
                    };
                }
            },
            
            // Abort intents
            {
                type: 'abort',
                patterns: [
                    /^(stop|abort|cancel|halt)\s*(the\s+)?(test|execution)?$/i,
                    /^(emergency\s+)?stop$/i
                ],
                entityExtractors: [],
                actionBuilder: () => ({
                    verb: 'click', // Will be interpreted as abort
                    target: 'abort',
                    params: { emergency: true },
                    priority: 'critical'
                })
            },
            
            // Query intents
            {
                type: 'query',
                patterns: [
                    /^(what|where|how|which)\s+(.+)$/i,
                    /^(tell\s+me|show\s+me)\s+(.+)$/i
                ],
                entityExtractors: [],
                actionBuilder: (transcript) => ({
                    verb: 'assert', // Query as assertion
                    target: 'query',
                    params: { question: transcript },
                    priority: 'normal'
                })
            }
        ];
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔍 ENTITY EXTRACTORS
    // ═══════════════════════════════════════════════════════════════════════════
    
    private extractURL(transcript: string): ExtractedEntity | null {
        const urlPattern = /(https?:\/\/[^\s]+|[a-z0-9-]+\.(com|org|net|io|dev|app)[^\s]*)/i;
        const match = transcript.match(urlPattern);
        if (match) {
            return {
                type: 'url',
                value: match[0].startsWith('http') ? match[0] : `https://${match[0]}`,
                startIndex: match.index || 0,
                length: match[0].length,
                confidence: 0.9
            };
        }
        
        // Check for page names
        const pagePattern = /(login|home|dashboard|settings|profile|about|contact)\s*(page)?/i;
        const pageMatch = transcript.match(pagePattern);
        if (pageMatch) {
            return {
                type: 'url',
                value: `/${pageMatch[1].toLowerCase()}`,
                startIndex: pageMatch.index || 0,
                length: pageMatch[0].length,
                confidence: 0.7
            };
        }
        
        return null;
    }
    
    private extractSelector(transcript: string): ExtractedEntity | null {
        // Look for explicit selectors
        const selectorPatterns = [
            /id\s+["']?([^"'\s]+)["']?/i,
            /class\s+["']?([^"'\s]+)["']?/i,
            /data-testid\s+["']?([^"'\s]+)["']?/i,
            /#([a-z0-9_-]+)/i,
            /\.([a-z0-9_-]+)/i
        ];
        
        for (const pattern of selectorPatterns) {
            const match = transcript.match(pattern);
            if (match) {
                let selector = match[1];
                if (pattern.source.startsWith('#')) {
                    selector = `#${selector}`;
                } else if (pattern.source.startsWith('\\.')) {
                    selector = `.${selector}`;
                } else if (pattern.source.includes('data-testid')) {
                    selector = `[data-testid="${selector}"]`;
                } else if (pattern.source.includes('id')) {
                    selector = `#${selector}`;
                } else if (pattern.source.includes('class')) {
                    selector = `.${selector}`;
                }
                
                return {
                    type: 'selector',
                    value: selector,
                    startIndex: match.index || 0,
                    length: match[0].length,
                    confidence: 0.95
                };
            }
        }
        
        return null;
    }
    
    private extractElementType(transcript: string): ExtractedEntity | null {
        const elements = [
            'button', 'link', 'input', 'field', 'textbox', 'dropdown',
            'checkbox', 'radio', 'toggle', 'menu', 'modal', 'dialog',
            'header', 'footer', 'form', 'table', 'list', 'card', 'image'
        ];
        
        for (const element of elements) {
            const index = transcript.toLowerCase().indexOf(element);
            if (index !== -1) {
                return {
                    type: 'element_type',
                    value: element,
                    startIndex: index,
                    length: element.length,
                    confidence: 0.8
                };
            }
        }
        
        return null;
    }
    
    private extractText(transcript: string): ExtractedEntity | null {
        // Look for quoted text
        const quotedMatch = transcript.match(/["']([^"']+)["']/);
        if (quotedMatch) {
            return {
                type: 'text',
                value: quotedMatch[1],
                startIndex: quotedMatch.index || 0,
                length: quotedMatch[0].length,
                confidence: 0.95
            };
        }
        
        // Extract text after keywords
        const textPatterns = [
            /(?:type|enter|input|fill)\s+(.+?)(?:\s+(?:in|into)\s+|$)/i,
            /(?:verify|check|assert)\s+(?:that\s+)?(.+)/i
        ];
        
        for (const pattern of textPatterns) {
            const match = transcript.match(pattern);
            if (match && match[1]) {
                return {
                    type: 'text',
                    value: match[1].trim(),
                    startIndex: match.index || 0,
                    length: match[0].length,
                    confidence: 0.7
                };
            }
        }
        
        return null;
    }
    
    private extractDuration(transcript: string): ExtractedEntity | null {
        const durationMatch = transcript.match(/(\d+)\s*(seconds?|s|ms|milliseconds?)?/i);
        if (durationMatch) {
            let value = parseInt(durationMatch[1]);
            const unit = durationMatch[2]?.toLowerCase() || 's';
            
            // Convert to milliseconds
            if (unit.startsWith('s')) {
                value *= 1000;
            }
            
            return {
                type: 'duration',
                value: value.toString(),
                startIndex: durationMatch.index || 0,
                length: durationMatch[0].length,
                confidence: 0.9
            };
        }
        
        return null;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🛠️ UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    
    private calculatePatternConfidence(transcript: string, pattern: RegExp): number {
        const match = transcript.match(pattern);
        if (!match) return 0;
        
        // Higher confidence for longer matches
        const matchLength = match[0].length;
        const transcriptLength = transcript.length;
        
        return Math.min(0.5 + (matchLength / transcriptLength) * 0.5, 1);
    }
    
    private extractTargetFromTranscript(transcript: string): string {
        // Remove action words and extract target
        const cleaned = transcript
            .replace(/^(go to|navigate to|open|visit)\s+/i, '')
            .trim();
        
        // Check if it's a URL
        if (cleaned.includes('.') || cleaned.startsWith('/')) {
            return cleaned;
        }
        
        // Assume it's a page name
        return `/${cleaned.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    private buildSelectorFromContext(transcript: string, elementType?: string): string {
        // Extract element name/text
        const cleaned = transcript
            .replace(/^(click|tap|press)\s+(on\s+)?(the\s+)?/i, '')
            .replace(/\s+button$/i, '')
            .replace(/\s+link$/i, '')
            .trim();
        
        if (elementType === 'button') {
            return `button:has-text("${cleaned}"), [role="button"]:has-text("${cleaned}")`;
        } else if (elementType === 'link') {
            return `a:has-text("${cleaned}")`;
        } else if (elementType === 'input' || elementType === 'field') {
            return `input[placeholder*="${cleaned}"], input[name*="${cleaned}"]`;
        }
        
        // Generic text-based selector
        return `text="${cleaned}"`;
    }
    
    private normalizeForCache(transcript: string): string {
        return transcript
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    private generateIntentId(): string {
        return `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 DIRECT TRANSCRIPTION API
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Directly transcribe audio file to intent
     */
    async transcribeFile(audioBuffer: ArrayBuffer, format: AudioMetadata['format'] = 'wav'): Promise<VoiceIntent> {
        if (!this.config) {
            throw new Error('VoiceCommander not configured');
        }
        
        const formData = new FormData();
        const blob = new Blob([audioBuffer], { type: `audio/${format}` });
        formData.append('file', blob, `audio.${format}`);
        formData.append('model', this.config.model);
        formData.append('language', this.config.language);
        
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Transcription failed: ${response.status}`);
        }
        
        const result = await response.json();
        const transcript = result.text || '';
        
        const metadata: AudioMetadata = {
            duration: 0,
            sampleRate: 16000,
            channels: 1,
            format,
            volumeLevel: 0,
            snr: 0,
            language: this.config.language
        };
        
        return this.parseIntent(transcript, metadata);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📈 STATISTICS & HISTORY
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Get intent history
     */
    getHistory(): VoiceIntent[] {
        return [...this.intentHistory];
    }
    
    /**
     * Get statistics
     */
    getStats(): {
        totalIntents: number;
        byType: Record<IntentType, number>;
        averageConfidence: number;
        cacheHitRate: number;
    } {
        const byType: Record<string, number> = {};
        let totalConfidence = 0;
        
        for (const intent of this.intentHistory) {
            byType[intent.type] = (byType[intent.type] || 0) + 1;
            totalConfidence += intent.confidence;
        }
        
        return {
            totalIntents: this.intentHistory.length,
            byType: byType as Record<IntentType, number>,
            averageConfidence: this.intentHistory.length > 0 
                ? totalConfidence / this.intentHistory.length 
                : 0,
            cacheHitRate: this.intentCache.size > 0 
                ? this.intentCache.size / this.intentHistory.length 
                : 0
        };
    }
    
    /**
     * Clear history and cache
     */
    clear(): void {
        this.intentHistory = [];
        this.intentCache.clear();
    }
    
    /**
     * Check if currently listening
     */
    isActive(): boolean {
        return this.isListening;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default VoiceCommander;
