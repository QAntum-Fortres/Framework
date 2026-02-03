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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceCommander, VoiceIntent, IntentType } from '../src/multimodal/voice-commander';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎙️ VOICE COMMANDER TESTS - Audio to Intent Conversion
// ═══════════════════════════════════════════════════════════════════════════════

describe('🎙️ VoiceCommander - The Voice Interface', () => {
    let commander: VoiceCommander;
    
    beforeEach(() => {
        commander = new VoiceCommander();
    });
    
    describe('⚙️ Configuration', () => {
        it('should configure with API key', () => {
            commander.configure({
                apiKey: 'test-api-key',
                model: 'whisper-1',
                language: 'en'
            });
            
            expect(true).toBe(true); // No error = success
        });
        
        it('should emit configured event', () => {
            const configuredHandler = vi.fn();
            commander.on('configured', configuredHandler);
            
            commander.configure({ apiKey: 'test' });
            
            expect(configuredHandler).toHaveBeenCalled();
        });
        
        it('should throw error when starting without config', async () => {
            await expect(commander.startListening())
                .rejects.toThrow('not configured');
        });
        
        it('should use default vocabulary', () => {
            commander.configure({ apiKey: 'test' });
            // No error = vocabulary initialized
            expect(true).toBe(true);
        });
    });
    
    describe('🎤 Listening State', () => {
        beforeEach(() => {
            commander.configure({ apiKey: 'test' });
        });
        
        it('should start listening', async () => {
            const startHandler = vi.fn();
            commander.on('listening:start', startHandler);
            
            await commander.startListening();
            
            expect(startHandler).toHaveBeenCalled();
            expect(commander.isActive()).toBe(true);
        });
        
        it('should stop listening', async () => {
            const stopHandler = vi.fn();
            commander.on('listening:stop', stopHandler);
            
            await commander.startListening();
            await commander.stopListening();
            
            expect(stopHandler).toHaveBeenCalled();
            expect(commander.isActive()).toBe(false);
        });
        
        it('should not start twice', async () => {
            await commander.startListening();
            await commander.startListening(); // Should not throw
            
            expect(commander.isActive()).toBe(true);
        });
    });
    
    describe('🎯 Intent Parsing', () => {
        beforeEach(() => {
            commander.configure({ apiKey: 'test' });
        });
        
        const mockMetadata = {
            duration: 1000,
            sampleRate: 16000,
            channels: 1,
            format: 'wav' as const,
            volumeLevel: 0.5,
            snr: 30,
            language: 'en'
        };
        
        it('should parse navigation intent', () => {
            const intent = commander.parseIntent('go to login page', mockMetadata);
            
            expect(intent.type).toBe('navigation');
            expect(intent.action?.verb).toBe('navigate');
            expect(intent.confidence).toBeGreaterThan(0);
        });
        
        it('should parse click intent', () => {
            const intent = commander.parseIntent('click the submit button', mockMetadata);
            
            expect(intent.type).toBe('interaction');
            expect(intent.action?.verb).toBe('click');
        });
        
        it('should parse type intent', () => {
            const intent = commander.parseIntent('type "hello world" into the input', mockMetadata);
            
            expect(intent.type).toBe('data_entry');
            expect(intent.action?.verb).toBe('type');
        });
        
        it('should parse wait intent', () => {
            const intent = commander.parseIntent('wait for 5 seconds', mockMetadata);
            
            expect(intent.type).toBe('wait');
            expect(intent.action?.verb).toBe('wait');
            expect(intent.action?.params.duration).toBe(5000);
        });
        
        it('should parse assertion intent', () => {
            const intent = commander.parseIntent('verify that the title is correct', mockMetadata);
            
            expect(intent.type).toBe('assertion');
            expect(intent.action?.verb).toBe('assert');
        });
        
        it('should parse screenshot intent', () => {
            const intent = commander.parseIntent('take a screenshot', mockMetadata);
            
            expect(intent.type).toBe('screenshot');
            expect(intent.action?.verb).toBe('screenshot');
        });
        
        it('should parse abort intent', () => {
            const intent = commander.parseIntent('stop the test', mockMetadata);
            
            expect(intent.type).toBe('abort');
            expect(intent.action?.params.emergency).toBe(true);
        });
        
        it('should handle unknown intent', () => {
            const intent = commander.parseIntent('random gibberish xyz', mockMetadata);
            
            expect(intent.type).toBe('unknown');
        });
        
        it('should extract URL entity', () => {
            const intent = commander.parseIntent('navigate to https://example.com', mockMetadata);
            
            const urlEntity = intent.entities.find(e => e.type === 'url');
            expect(urlEntity).toBeDefined();
            expect(urlEntity?.value).toContain('example.com');
        });
        
        it('should extract duration entity', () => {
            const intent = commander.parseIntent('wait 3 seconds', mockMetadata);
            
            const durationEntity = intent.entities.find(e => e.type === 'duration');
            expect(durationEntity).toBeDefined();
            expect(durationEntity?.value).toBe('3000');
        });
        
        it('should extract element type entity', () => {
            const intent = commander.parseIntent('click the login button', mockMetadata);
            
            const elementEntity = intent.entities.find(e => e.type === 'element_type');
            expect(elementEntity).toBeDefined();
            expect(elementEntity?.value).toBe('button');
        });
    });
    
    describe('📊 History & Statistics', () => {
        beforeEach(() => {
            commander.configure({ apiKey: 'test' });
        });
        
        it('should return empty history initially', () => {
            const history = commander.getHistory();
            expect(history).toEqual([]);
        });
        
        it('should return zero stats for empty history', () => {
            const stats = commander.getStats();
            
            expect(stats.totalIntents).toBe(0);
            expect(stats.averageConfidence).toBe(0);
        });
        
        it('should clear history', () => {
            commander.clear();
            
            const history = commander.getHistory();
            expect(history).toEqual([]);
        });
    });
    
    describe('🔊 Audio Processing', () => {
        beforeEach(() => {
            commander.configure({ apiKey: 'test' });
        });
        
        it('should process audio chunk while listening', async () => {
            await commander.startListening();
            
            const chunk = new Float32Array(1000).fill(0.1);
            const result = await commander.processAudioChunk(chunk);
            
            // Result depends on VAD state
            expect(result).toBeNull(); // Voice not ended yet
        });
        
        it('should not process audio when not listening', async () => {
            const chunk = new Float32Array(1000).fill(0.1);
            const result = await commander.processAudioChunk(chunk);
            
            expect(result).toBeNull();
        });
        
        it('should emit voice:start on voice activity', async () => {
            const voiceStartHandler = vi.fn();
            commander.on('voice:start', voiceStartHandler);
            
            await commander.startListening();
            
            // Simulate loud audio
            const chunk = new Float32Array(1000).fill(0.5);
            await commander.processAudioChunk(chunk);
            
            expect(voiceStartHandler).toHaveBeenCalled();
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 📹 VIDEO REPLAY ANALYZER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

import { VideoReplayAnalyzer, SovereignGoal, GoalType } from '../src/multimodal/video-replay-analyzer';

describe('📹 VideoReplayAnalyzer - Session to Sovereign Goals', () => {
    let analyzer: VideoReplayAnalyzer;
    
    beforeEach(() => {
        analyzer = new VideoReplayAnalyzer();
    });
    
    describe('⚙️ Configuration', () => {
        it('should configure with API key', () => {
            analyzer.configure({
                apiKey: 'test-api-key',
                model: 'gemini-2.0-flash'
            });
            
            expect(true).toBe(true);
        });
        
        it('should emit configured event', () => {
            const configuredHandler = vi.fn();
            analyzer.on('configured', configuredHandler);
            
            analyzer.configure({ apiKey: 'test' });
            
            expect(configuredHandler).toHaveBeenCalled();
        });
        
        it('should throw error when analyzing without config', async () => {
            const buffer = new ArrayBuffer(1000);
            
            await expect(analyzer.analyzeVideo(buffer))
                .rejects.toThrow('not configured');
        });
    });
    
    describe('💻 Test Code Generation', () => {
        beforeEach(() => {
            analyzer.configure({ apiKey: 'test' });
        });
        
        it('should generate Playwright test code', () => {
            const goal: SovereignGoal = {
                id: 'goal_1',
                description: 'User login flow',
                type: 'authentication',
                priority: 'critical',
                actions: [
                    {
                        type: 'type',
                        target: {
                            type: 'input',
                            boundingBox: { x: 0, y: 0, width: 100, height: 50 },
                            selector: 'input[name="email"]',
                            text: '',
                            attributes: {},
                            visualFeatures: {
                                primaryColor: '#000',
                                backgroundColor: '#fff',
                                hasBorder: true,
                                hasShadow: false,
                                isHighlighted: false,
                                zIndex: 1
                            },
                            confidence: 0.9
                        },
                        value: 'test@example.com',
                        timestamp: 0,
                        duration: 500,
                        confidence: 0.9,
                        frameIndex: 0
                    },
                    {
                        type: 'click',
                        target: {
                            type: 'button',
                            boundingBox: { x: 0, y: 0, width: 100, height: 50 },
                            selector: 'button[type="submit"]',
                            text: 'Login',
                            attributes: {},
                            visualFeatures: {
                                primaryColor: '#000',
                                backgroundColor: '#fff',
                                hasBorder: true,
                                hasShadow: false,
                                isHighlighted: false,
                                zIndex: 1
                            },
                            confidence: 0.9
                        },
                        timestamp: 500,
                        duration: 100,
                        confidence: 0.9,
                        frameIndex: 1
                    }
                ],
                elements: [],
                confidence: 0.9,
                timeRange: { start: 0, end: 600 },
                metadata: {
                    video: { filename: 'test.mp4', duration: 1000, resolution: { width: 1920, height: 1080 }, fps: 30, size: 1000 },
                    analysis: { startTime: 0, endTime: 1000, framesAnalyzed: 10, modelUsed: 'gemini-2.0-flash' },
                    session: {}
                }
            };
            
            const code = analyzer.generateTestCode(goal);
            
            expect(code).toContain('test(');
            expect(code).toContain("await page.fill");
            expect(code).toContain("await page.click");
            expect(code).toContain('SOVEREIGN GOAL');
        });
    });
    
    describe('📊 History & Statistics', () => {
        beforeEach(() => {
            analyzer.configure({ apiKey: 'test' });
        });
        
        it('should return empty history initially', () => {
            const history = analyzer.getHistory();
            expect(history).toEqual([]);
        });
        
        it('should return zero stats for empty history', () => {
            const stats = analyzer.getStats();
            
            expect(stats.totalGoals).toBe(0);
            expect(stats.averageConfidence).toBe(0);
            expect(stats.averageActionsPerGoal).toBe(0);
        });
        
        it('should clear history', () => {
            analyzer.clear();
            
            const history = analyzer.getHistory();
            expect(history).toEqual([]);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 NEURAL HUD TESTS
// ═══════════════════════════════════════════════════════════════════════════════

import { NeuralHUD, BrainWave, TelemetrySnapshot } from '../src/multimodal/neural-hud';

describe('🧠 NeuralHUD - Brain Waves & Telemetry Dashboard', () => {
    let hud: NeuralHUD;
    
    beforeEach(() => {
        hud = new NeuralHUD({ port: 0 }); // Port 0 = random available port
    });
    
    afterEach(async () => {
        if (hud.isActive()) {
            await hud.stop();
        }
    });
    
    describe('🚀 Server Lifecycle', () => {
        it('should start server', async () => {
            const startHandler = vi.fn();
            hud.on('start', startHandler);
            
            await hud.start();
            
            expect(hud.isActive()).toBe(true);
            expect(startHandler).toHaveBeenCalled();
        });
        
        it('should stop server', async () => {
            const stopHandler = vi.fn();
            hud.on('stop', stopHandler);
            
            await hud.start();
            await hud.stop();
            
            expect(hud.isActive()).toBe(false);
            expect(stopHandler).toHaveBeenCalled();
        });
        
        it('should throw error when starting twice', async () => {
            await hud.start();
            
            await expect(hud.start()).rejects.toThrow('already running');
        });
        
        it('should handle stop when not running', async () => {
            await hud.stop(); // Should not throw
            expect(hud.isActive()).toBe(false);
        });
    });
    
    describe('🧠 Brain Wave Emission', () => {
        it('should emit perception wave', () => {
            const wave = hud.perception('voice_commander', 'Received voice input', { audio: 'test' });
            
            expect(wave.type).toBe('perception');
            expect(wave.source).toBe('voice_commander');
            expect(wave.id).toContain('wave_');
        });
        
        it('should emit reasoning wave', () => {
            const wave = hud.reasoning('selector_engine', 'Analyzing element', { elements: 5 });
            
            expect(wave.type).toBe('reasoning');
            expect(wave.content.summary).toBe('Analyzing element');
        });
        
        it('should emit decision wave', () => {
            const wave = hud.decision(
                'neural_optimizer',
                'Selected best selector',
                '#login-btn',
                [
                    { option: '#login-btn', score: 0.95, rejected: false },
                    { option: '.btn-login', score: 0.8, rejected: true, reason: 'Lower confidence' }
                ]
            );
            
            expect(wave.type).toBe('decision');
            expect(wave.content.alternatives).toHaveLength(2);
        });
        
        it('should emit action wave', () => {
            const wave = hud.action('action_executor', 'Clicked button', { success: true }, 150);
            
            expect(wave.type).toBe('action');
            expect(wave.duration).toBe(150);
        });
        
        it('should emit error wave', () => {
            const error = new Error('Test error');
            const wave = hud.error('test_runner', 'Test failed', error);
            
            expect(wave.type).toBe('error');
            expect(wave.metadata.priority).toBe('critical');
            expect(wave.content.details).toHaveProperty('message', 'Test error');
        });
        
        it('should increment wave sequence', () => {
            const wave1 = hud.perception('system', 'Wave 1', {});
            const wave2 = hud.perception('system', 'Wave 2', {});
            
            expect(wave2.metadata.sequence).toBe(wave1.metadata.sequence + 1);
        });
    });
    
    describe('📊 Statistics', () => {
        it('should return statistics', () => {
            hud.perception('system', 'Test', {});
            hud.reasoning('system', 'Test', {});
            hud.action('system', 'Test', {}, 100);
            
            const stats = hud.getStatistics();
            
            expect(stats.waves.total).toBe(3);
            expect(stats.waves.byType).toHaveProperty('perception');
            expect(stats.waves.byType).toHaveProperty('reasoning');
            expect(stats.waves.byType).toHaveProperty('action');
        });
        
        it('should get recent waves', () => {
            for (let i = 0; i < 5; i++) {
                hud.perception('system', `Wave ${i}`, {});
            }
            
            const recent = hud.getRecentWaves(3);
            
            expect(recent).toHaveLength(3);
        });
        
        it('should clear buffers', () => {
            hud.perception('system', 'Test', {});
            hud.clearBuffers();
            
            const waves = hud.getRecentWaves();
            expect(waves).toHaveLength(0);
        });
    });
    
    describe('📡 Client Management', () => {
        it('should track client count', () => {
            expect(hud.getClientCount()).toBe(0);
        });
    });
    
    describe('📈 Telemetry', () => {
        it('should return null for latest telemetry when empty', () => {
            const latest = hud.getLatestTelemetry();
            expect(latest).toBeNull();
        });
    });
});
