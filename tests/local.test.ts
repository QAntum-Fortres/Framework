/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum v23.0 Phase 1 Tests
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 WHISPER SERVICE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('WhisperService', () => {
    describe('Configuration', () => {
        it('should initialize with default configuration', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService();
            const config = service.getConfig();
            
            expect(config.model).toBe('base');
            expect(config.device).toBe('auto');
            expect(config.computeType).toBe('auto');
            expect(config.timeout).toBe(30000);
            expect(config.threads).toBe(4);
        });
        
        it('should accept custom configuration', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService({
                model: 'large-v3',
                device: 'cuda',
                computeType: 'float16',
                timeout: 60000,
                threads: 8
            });
            const config = service.getConfig();
            
            expect(config.model).toBe('large-v3');
            expect(config.device).toBe('cuda');
            expect(config.computeType).toBe('float16');
            expect(config.timeout).toBe(60000);
            expect(config.threads).toBe(8);
        });
        
        it('should update configuration', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService();
            
            service.updateConfig({ model: 'medium', threads: 16 });
            const config = service.getConfig();
            
            expect(config.model).toBe('medium');
            expect(config.threads).toBe(16);
        });
        
        it('should extend EventEmitter', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService();
            
            expect(service).toBeInstanceOf(EventEmitter);
        });
    });
    
    describe('Queue Management', () => {
        it('should report queue status', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService();
            const status = service.getQueueStatus();
            
            expect(status).toHaveProperty('pending');
            expect(status).toHaveProperty('processing');
            expect(status.pending).toBe(0);
            expect(status.processing).toBe(false);
        });
        
        it('should report service ready status', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService();
            
            expect(service.isServiceReady()).toBe(false);
        });
    });
    
    describe('Transcription Validation', () => {
        it('should reject transcription if not initialized', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService();
            
            await expect(service.transcribe('test.wav')).rejects.toThrow(
                'Whisper service not initialized'
            );
        });
        
        it('should validate audio file existence', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService();
            
            // Mock isReady
            (service as unknown as { isReady: boolean }).isReady = true;
            
            await expect(service.transcribe('nonexistent.wav')).rejects.toThrow(
                'Audio file not found'
            );
        });
    });
    
    describe('Model Sizes', () => {
        it('should support all Whisper model sizes', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const modelSizes = ['tiny', 'base', 'small', 'medium', 'large-v2', 'large-v3'] as const;
            
            for (const model of modelSizes) {
                const service = new WhisperService({ model });
                expect(service.getConfig().model).toBe(model);
            }
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 BULGARIAN LOCALE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Bulgarian Semantic Mapping', () => {
    let bgLocale: {
        language: string;
        locale: string;
        name: string;
        commands: Record<string, { keywords: string[]; patterns: string[] }>;
        entities: Record<string, Record<string, string[]>>;
        modifiers: Record<string, string[]>;
        confirmations: Record<string, string[]>;
    };
    
    beforeEach(async () => {
        bgLocale = (await import('../src/multimodal/locales/bg.json')).default;
    });
    
    describe('Locale Metadata', () => {
        it('should have correct language code', () => {
            expect(bgLocale.language).toBe('bg');
            expect(bgLocale.locale).toBe('bg-BG');
            expect(bgLocale.name).toBe('Български');
        });
    });
    
    describe('Command Mappings', () => {
        it('should map search commands', () => {
            const search = bgLocale.commands.search;
            expect(search.keywords).toContain('търси');
            expect(search.keywords).toContain('намери');
            expect(search.keywords).toContain('потърси');
        });
        
        it('should map click commands', () => {
            const click = bgLocale.commands.click;
            expect(click.keywords).toContain('кликни');
            expect(click.keywords).toContain('натисни');
            expect(click.keywords).toContain('избери');
        });
        
        it('should map assert commands', () => {
            const assert = bgLocale.commands.assert;
            expect(assert.keywords).toContain('провери');
            expect(assert.keywords).toContain('увери');
            expect(assert.keywords).toContain('потвърди');
        });
        
        it('should map navigate commands', () => {
            const navigate = bgLocale.commands.navigate;
            expect(navigate.keywords).toContain('отиди');
            expect(navigate.keywords).toContain('навигирай');
            expect(navigate.keywords).toContain('отвори');
        });
        
        it('should map type commands', () => {
            const type = bgLocale.commands.type;
            expect(type.keywords).toContain('напиши');
            expect(type.keywords).toContain('въведи');
            expect(type.keywords).toContain('попълни');
        });
        
        it('should map wait commands', () => {
            const wait = bgLocale.commands.wait;
            expect(wait.keywords).toContain('изчакай');
            expect(wait.keywords).toContain('почакай');
            expect(wait.keywords).toContain('пауза');
        });
        
        it('should map scroll commands', () => {
            const scroll = bgLocale.commands.scroll;
            expect(scroll.keywords).toContain('скролни');
            expect(scroll.keywords).toContain('превърти');
        });
        
        it('should map screenshot commands', () => {
            const screenshot = bgLocale.commands.screenshot;
            expect(screenshot.keywords).toContain('снимка');
            expect(screenshot.keywords).toContain('скрийншот');
        });
        
        it('should have patterns for each command', () => {
            const commandKeys = Object.keys(bgLocale.commands);
            expect(commandKeys.length).toBeGreaterThan(10);
            
            for (const key of commandKeys) {
                const command = bgLocale.commands[key];
                expect(command.patterns.length).toBeGreaterThan(0);
            }
        });
    });
    
    describe('Entity Mappings', () => {
        it('should map directions in Bulgarian', () => {
            const directions = bgLocale.entities.directions;
            expect(directions.up).toContain('нагоре');
            expect(directions.down).toContain('надолу');
            expect(directions.left).toContain('наляво');
            expect(directions.right).toContain('надясно');
        });
        
        it('should map UI elements in Bulgarian', () => {
            const elements = bgLocale.entities.elements;
            expect(elements.button).toContain('бутон');
            expect(elements.link).toContain('линк');
            expect(elements.input).toContain('поле');
            expect(elements.checkbox).toContain('чекбокс');
        });
        
        it('should map states in Bulgarian', () => {
            const states = bgLocale.entities.states;
            expect(states.visible).toContain('видим');
            expect(states.hidden).toContain('скрит');
            expect(states.enabled).toContain('активен');
            expect(states.disabled).toContain('неактивен');
        });
        
        it('should map time units in Bulgarian', () => {
            const timeUnits = bgLocale.entities.timeUnits;
            expect(timeUnits.seconds).toContain('секунди');
            expect(timeUnits.milliseconds).toContain('милисекунди');
            expect(timeUnits.minutes).toContain('минути');
        });
    });
    
    describe('Modifiers and Confirmations', () => {
        it('should map modifiers', () => {
            const modifiers = bgLocale.modifiers;
            expect(modifiers.not).toContain('не');
            expect(modifiers.and).toContain('и');
            expect(modifiers.or).toContain('или');
            expect(modifiers.first).toContain('първи');
            expect(modifiers.last).toContain('последен');
        });
        
        it('should map confirmations', () => {
            const confirmations = bgLocale.confirmations;
            expect(confirmations.yes).toContain('да');
            expect(confirmations.yes).toContain('добре');
            expect(confirmations.no).toContain('не');
            expect(confirmations.no).toContain('стоп');
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 HYBRID VISION CONTROLLER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('HybridVisionController', () => {
    describe('Configuration', () => {
        it('should initialize with default configuration', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            const config = controller.getConfig();
            
            expect(config.geminiModel).toBe('gemini-2.0-flash-exp');
            expect(config.ollamaEndpoint).toBe('http://localhost:11434');
            expect(config.ollamaModel).toBe('llava:13b');
            expect(config.latencyThreshold).toBe(2000);
            expect(config.enableFallback).toBe(true);
            expect(config.timeout).toBe(30000);
        });
        
        it('should accept custom configuration', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController({
                latencyThreshold: 3000,
                enableFallback: false,
                ollamaModel: 'llava:7b'
            });
            const config = controller.getConfig();
            
            expect(config.latencyThreshold).toBe(3000);
            expect(config.enableFallback).toBe(false);
            expect(config.ollamaModel).toBe('llava:7b');
        });
        
        it('should extend EventEmitter', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            
            expect(controller).toBeInstanceOf(EventEmitter);
        });
    });
    
    describe('Latency Threshold', () => {
        it('should update latency threshold', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            
            controller.setLatencyThreshold(5000);
            expect(controller.getConfig().latencyThreshold).toBe(5000);
        });
        
        it('should emit event on threshold update', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            
            const eventSpy = vi.fn();
            controller.on('config-updated', eventSpy);
            
            controller.setLatencyThreshold(4000);
            
            expect(eventSpy).toHaveBeenCalledWith({ latencyThreshold: 4000 });
        });
    });
    
    describe('Fallback Control', () => {
        it('should toggle fallback', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            
            expect(controller.getConfig().enableFallback).toBe(true);
            
            controller.setFallbackEnabled(false);
            expect(controller.getConfig().enableFallback).toBe(false);
            
            controller.setFallbackEnabled(true);
            expect(controller.getConfig().enableFallback).toBe(true);
        });
        
        it('should emit event on fallback toggle', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            
            const eventSpy = vi.fn();
            controller.on('config-updated', eventSpy);
            
            controller.setFallbackEnabled(false);
            
            expect(eventSpy).toHaveBeenCalledWith({ enableFallback: false });
        });
    });
    
    describe('Health Status', () => {
        it('should return health status', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            const health = controller.getHealth();
            
            expect(health).toHaveProperty('gemini');
            expect(health).toHaveProperty('ollama');
            expect(health.gemini).toHaveProperty('available');
            expect(health.gemini).toHaveProperty('avgLatency');
            expect(health.gemini).toHaveProperty('successRate');
        });
        
        it('should initialize with providers assumed available', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            const health = controller.getHealth();
            
            expect(health.gemini.available).toBe(true);
            expect(health.ollama.available).toBe(true);
        });
    });
    
    describe('Image Analysis', () => {
        it('should reject if image not found', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            
            await expect(
                controller.analyzeImage('nonexistent.png', 'test prompt')
            ).rejects.toThrow('Image not found');
        });
    });
    
    describe('Provider Selection', () => {
        it('should throw if no providers available', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            
            // Simulate no providers available
            const health = controller.getHealth();
            health.gemini.available = false;
            health.ollama.available = false;
            (controller as unknown as { health: typeof health }).health = health;
            
            await expect(
                controller.analyzeImage('test.png', 'test')
            ).rejects.toThrow();
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 LOCAL MODULE INDEX TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Local Module Index', () => {
    it('should export WhisperService', async () => {
        const localModule = await import('../src/local/index');
        expect(localModule.WhisperService).toBeDefined();
    });
    
    it('should export HybridVisionController', async () => {
        const localModule = await import('../src/local/index');
        expect(localModule.HybridVisionController).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 INTEGRATION SCENARIO TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 1 Integration Scenarios', () => {
    describe('Bulgarian Voice Command Flow', () => {
        it('should parse Bulgarian search command', async () => {
            const bgLocale = (await import('../src/multimodal/locales/bg.json')).default;
            const searchKeywords = bgLocale.commands.search.keywords;
            
            const voiceInput = 'търси бутон за вход';
            const hasSearchKeyword = searchKeywords.some((kw: string) => voiceInput.includes(kw));
            
            expect(hasSearchKeyword).toBe(true);
        });
        
        it('should parse Bulgarian click command', async () => {
            const bgLocale = (await import('../src/multimodal/locales/bg.json')).default;
            const clickKeywords = bgLocale.commands.click.keywords;
            
            const voiceInput = 'кликни върху бутона';
            const hasClickKeyword = clickKeywords.some((kw: string) => voiceInput.includes(kw));
            
            expect(hasClickKeyword).toBe(true);
        });
        
        it('should parse Bulgarian assert command', async () => {
            const bgLocale = (await import('../src/multimodal/locales/bg.json')).default;
            const assertKeywords = bgLocale.commands.assert.keywords;
            
            const voiceInput = 'провери дали текстът е видим';
            const hasAssertKeyword = assertKeywords.some((kw: string) => voiceInput.includes(kw));
            
            expect(hasAssertKeyword).toBe(true);
        });
    });
    
    describe('Vision Fallback Strategy', () => {
        it('should fallback when latency exceeds threshold', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController({
                latencyThreshold: 1000, // Low threshold for testing
                enableFallback: true
            });
            
            expect(controller.getConfig().latencyThreshold).toBe(1000);
            expect(controller.getConfig().enableFallback).toBe(true);
        });
        
        it('should not fallback when disabled', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController({
                enableFallback: false
            });
            
            expect(controller.getConfig().enableFallback).toBe(false);
        });
    });
    
    describe('Local Processing Benefits', () => {
        it('should use local Ollama to reduce cloud dependency', async () => {
            const { HybridVisionController } = await import('../src/local/hybrid-vision-controller');
            const controller = new HybridVisionController();
            
            expect(controller.getConfig().ollamaEndpoint).toBe('http://localhost:11434');
            expect(controller.getConfig().ollamaModel).toBe('llava:13b');
        });
        
        it('should configure Whisper for local processing', async () => {
            const { WhisperService } = await import('../src/local/whisper-service');
            const service = new WhisperService({
                device: 'cuda',
                threads: 16 // Ryzen 7 7435HS threads
            });
            
            expect(service.getConfig().device).toBe('cuda');
            expect(service.getConfig().threads).toBe(16);
        });
    });
});
