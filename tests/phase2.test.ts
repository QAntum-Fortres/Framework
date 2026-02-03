/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum v23.0 Phase 2 Tests - Hardware & Swarm Orchestration
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// 🐳 DOCKER MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('DockerManager', () => {
    describe('Configuration', () => {
        it('should initialize with default configuration', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager();
            const config = manager.getConfig();
            
            expect(config.hubPort).toBe(4444);
            expect(config.maxSessions).toBe(16);
            expect(config.sessionTimeout).toBe(300);
            expect(config.networkName).toBe('QAntum-grid');
        });
        
        it('should accept custom configuration', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager({
                hubPort: 5555,
                maxSessions: 32,
                enableVideo: true
            });
            const config = manager.getConfig();
            
            expect(config.hubPort).toBe(5555);
            expect(config.maxSessions).toBe(32);
            expect(config.enableVideo).toBe(true);
        });
        
        it('should extend EventEmitter', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager();
            
            expect(manager).toBeInstanceOf(EventEmitter);
        });
    });
    
    describe('Dockerfile Generation', () => {
        it('should generate valid Dockerfile content', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager();
            const dockerfile = manager.generateDockerfile();
            
            expect(dockerfile).toContain('FROM node:20-slim');
            expect(dockerfile).toContain('WORKDIR /app');
            expect(dockerfile).toContain('HEALTHCHECK');
            expect(dockerfile).toContain('QAntum_CONTAINER');
            expect(dockerfile).toContain('npm ci');
        });
        
        it('should include Playwright dependencies', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager();
            const dockerfile = manager.generateDockerfile();
            
            expect(dockerfile).toContain('libgtk-3-0');
            expect(dockerfile).toContain('libnss3');
            expect(dockerfile).toContain('libxss1');
        });
    });
    
    describe('Docker Compose Generation', () => {
        it('should generate docker-compose with selenium hub', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager();
            const compose = manager.generateDockerCompose();
            
            expect(compose).toContain('selenium-hub');
            expect(compose).toContain('QAntum-hub');
            expect(compose).toContain('4444');
        });
        
        it('should include browser nodes', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager({
                nodes: [
                    { name: 'chrome', browser: 'chrome', instances: 4, memoryLimit: '2g', cpuLimit: '2.0', enableVnc: true, seleniumPort: 5555 }
                ]
            });
            const compose = manager.generateDockerCompose();
            
            expect(compose).toContain('chrome-node');
            expect(compose).toContain('selenium/node-chrome');
        });
        
        it('should generate Playwright compose', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager();
            const compose = manager.generatePlaywrightCompose();
            
            expect(compose).toContain('playwright');
            expect(compose).toContain('mcr.microsoft.com/playwright');
        });
        
        it('should include video recorder when enabled', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager({
                enableVideo: true,
                nodes: [{ name: 'chrome', browser: 'chrome', instances: 2, memoryLimit: '1g', cpuLimit: '1.0', enableVnc: false, seleniumPort: 5555 }]
            });
            const compose = manager.generateDockerCompose();
            
            expect(compose).toContain('video-recorder');
        });
    });
    
    describe('Grid Management', () => {
        it('should report running status', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager();
            
            expect(manager.isRunning()).toBe(false);
        });
        
        it('should return hub URL', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager({ hubPort: 4444 });
            
            expect(manager.getHubUrl()).toBe('http://localhost:4444/wd/hub');
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🎖️ SWARM COMMANDER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('SwarmCommander', () => {
    describe('Configuration', () => {
        it('should initialize with default strategy', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            const strategy = commander.getStrategy();
            
            expect(strategy.name).toBe('Thermal-Aware Swarm');
            expect(strategy.taskDistribution).toBe('thermal-aware');
            expect(strategy.thermalConfig.throttleTemp).toBe(90);
            expect(strategy.thermalConfig.coolTemp).toBe(70);
        });
        
        it('should accept custom strategy', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander({
                name: 'Custom Swarm',
                maxConcurrency: 32,
                thermalConfig: {
                    throttleTemp: 85,
                    criticalTemp: 90,
                    coolTemp: 65,
                    maxSoldiersCool: 32,
                    minSoldiersHot: 2,
                    checkInterval: 1000
                }
            });
            const strategy = commander.getStrategy();
            
            expect(strategy.name).toBe('Custom Swarm');
            expect(strategy.thermalConfig.throttleTemp).toBe(85);
        });
        
        it('should extend EventEmitter', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            
            expect(commander).toBeInstanceOf(EventEmitter);
        });
    });
    
    describe('Lifecycle', () => {
        it('should initialize swarm', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            
            await commander.initialize();
            expect(commander.isSwarmRunning()).toBe(true);
            
            await commander.shutdown();
            expect(commander.isSwarmRunning()).toBe(false);
        });
        
        it('should emit initialized event', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            
            const eventSpy = vi.fn();
            commander.on('initialized', eventSpy);
            
            await commander.initialize();
            
            expect(eventSpy).toHaveBeenCalled();
            
            await commander.shutdown();
        });
    });
    
    describe('Thermal Management', () => {
        it('should respond to temperature changes', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander({
                thermalConfig: {
                    throttleTemp: 90,
                    criticalTemp: 95,
                    coolTemp: 70,
                    maxSoldiersCool: 40,
                    minSoldiersHot: 4,
                    checkInterval: 1000
                }
            });
            
            await commander.initialize();
            
            // Simulate hot temperature
            commander.setTemperature(92);
            const metrics = commander.getMetrics();
            
            expect(metrics.thermalState).toBe('hot');
            
            await commander.shutdown();
        });
        
        it('should scale soldiers based on thermal state', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander({
                thermalConfig: {
                    throttleTemp: 90,
                    criticalTemp: 95,
                    coolTemp: 70,
                    maxSoldiersCool: 40,
                    minSoldiersHot: 4,
                    checkInterval: 1000
                }
            });
            
            await commander.initialize();
            
            // Cool state
            commander.setTemperature(60);
            const coolMetrics = commander.getMetrics();
            expect(coolMetrics.thermalState).toBe('cool');
            
            // Critical state
            commander.setTemperature(96);
            const criticalMetrics = commander.getMetrics();
            expect(criticalMetrics.thermalState).toBe('critical');
            
            await commander.shutdown();
        });
        
        it('should update thermal config', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            
            commander.updateThermalConfig({ throttleTemp: 85 });
            const strategy = commander.getStrategy();
            
            expect(strategy.thermalConfig.throttleTemp).toBe(85);
        });
    });
    
    describe('Task Management', () => {
        it('should submit tasks', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            
            await commander.initialize();
            
            const taskId = await commander.submitTask('semantic-analysis', { test: 'data' });
            
            expect(taskId).toContain('task_');
            
            await commander.shutdown();
        });
        
        it('should submit batch tasks', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            
            await commander.initialize();
            
            const taskIds = await commander.submitBatch([
                { type: 'dom-inspection', payload: { selector: '#btn' } },
                { type: 'visual-diff', payload: { baseline: 'img.png' } }
            ]);
            
            expect(taskIds.length).toBe(2);
            
            await commander.shutdown();
        });
        
        it('should report queue length', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            
            expect(commander.getQueueLength()).toBe(0);
        });
    });
    
    describe('Soldier Status', () => {
        it('should return soldier statuses', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander();
            
            await commander.initialize();
            
            const statuses = commander.getSoldierStatuses();
            expect(statuses.length).toBeGreaterThan(0);
            expect(statuses[0]).toHaveProperty('id');
            expect(statuses[0]).toHaveProperty('status');
            
            await commander.shutdown();
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🌡️ THERMAL AWARE POOL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('ThermalAwarePool', () => {
    describe('Configuration', () => {
        it('should initialize with default config', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool();
            const config = pool.getConfig();
            
            expect(config.throttleThreshold).toBe(90);
            expect(config.criticalThreshold).toBe(95);
            expect(config.coolThreshold).toBe(70);
            expect(config.maxInstancesCool).toBe(40);
            expect(config.minInstancesHot).toBe(4);
        });
        
        it('should accept custom config', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({
                throttleThreshold: 85,
                maxInstancesCool: 32
            });
            const config = pool.getConfig();
            
            expect(config.throttleThreshold).toBe(85);
            expect(config.maxInstancesCool).toBe(32);
        });
    });
    
    describe('Thermal States', () => {
        it('should start in cool state', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool();
            
            expect(pool.getState()).toBe('cool');
        });
        
        it('should transition to hot state at threshold', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({ throttleThreshold: 90 });
            
            pool.setTemperature(92);
            expect(pool.getState()).toBe('hot');
        });
        
        it('should transition to critical state', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({ criticalThreshold: 95 });
            
            pool.setTemperature(96);
            expect(pool.getState()).toBe('critical');
        });
        
        it('should transition to emergency state', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({ criticalThreshold: 95 });
            
            pool.setTemperature(101);
            expect(pool.getState()).toBe('emergency');
        });
        
        it('should return to cool state when temperature drops', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({ coolThreshold: 70 });
            
            pool.setTemperature(95);
            expect(pool.getState()).toBe('critical');
            
            pool.setTemperature(65);
            expect(pool.getState()).toBe('cool');
        });
    });
    
    describe('Concurrency Scaling', () => {
        it('should max concurrency when cool', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({
                maxInstancesCool: 40,
                coolThreshold: 70
            });
            
            pool.setTemperature(60);
            // Should be at least equal to maxInstancesCool or CPU count (whichever is smaller)
            expect(pool.getConcurrency()).toBeGreaterThan(0);
            expect(pool.getConcurrency()).toBeLessThanOrEqual(40);
        });
        
        it('should reduce concurrency when hot', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({
                maxInstancesCool: 40,
                minInstancesHot: 4,
                throttleThreshold: 90
            });
            
            pool.setTemperature(92);
            expect(pool.getConcurrency()).toBeLessThan(40);
        });
        
        it('should force concurrency override', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool();
            
            pool.forceConcurrency(20);
            expect(pool.getConcurrency()).toBe(20);
        });
    });
    
    describe('Metrics', () => {
        it('should return pool metrics', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool();
            const metrics = pool.getMetrics();
            
            expect(metrics).toHaveProperty('currentTemperature');
            expect(metrics).toHaveProperty('state');
            expect(metrics).toHaveProperty('currentConcurrency');
            expect(metrics).toHaveProperty('throttleCount');
        });
        
        it('should track throttle count', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool();
            
            expect(pool.getMetrics().throttleCount).toBe(0);
        });
        
        it('should report throttling status', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({ throttleThreshold: 90 });
            
            pool.setTemperature(60);
            expect(pool.isThrottling()).toBe(false);
            
            pool.setTemperature(92);
            expect(pool.isThrottling()).toBe(true);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🗣️ BULGARIAN TTS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('BulgarianTTS', () => {
    describe('Configuration', () => {
        it('should initialize with default config', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            const config = tts.getConfig();
            
            expect(config.engine).toBe('sapi');
            expect(config.language).toBe('bg-BG');
            expect(config.rate).toBe(1.0);
            expect(config.volume).toBe(0.9);
        });
        
        it('should accept custom config', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS({
                engine: 'espeak',
                rate: 1.2,
                volume: 0.8
            });
            const config = tts.getConfig();
            
            expect(config.engine).toBe('espeak');
            expect(config.rate).toBe(1.2);
            expect(config.volume).toBe(0.8);
        });
        
        it('should extend EventEmitter', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            
            expect(tts).toBeInstanceOf(EventEmitter);
        });
    });
    
    describe('Templates', () => {
        it('should have Bulgarian feedback templates', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            const templates = tts.getTemplates();
            
            expect(templates.testPassed).toBe('Тестът премина успешно.');
            expect(templates.testFailed).toBe('Тестът се провали.');
            expect(templates.errorFound).toContain('Открих грешка');
        });
        
        it('should have critical error template', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            const templates = tts.getTemplates();
            
            expect(templates.criticalError).toContain('Критична грешка');
        });
        
        it('should have suite completion template', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            const templates = tts.getTemplates();
            
            expect(templates.suiteCompleted).toContain('успешни');
            expect(templates.suiteCompleted).toContain('неуспешни');
        });
        
        it('should add custom templates', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            
            tts.addTemplate('customMessage', 'Персонализирано съобщение: {msg}');
            const templates = tts.getTemplates();
            
            expect(templates['customMessage']).toContain('Персонализирано');
        });
    });
    
    describe('Queue Management', () => {
        it('should report queue length', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            
            expect(tts.getQueueLength()).toBe(0);
        });
        
        it('should report speaking status', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            
            expect(tts.isSpeakingNow()).toBe(false);
        });
        
        it('should clear queue', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            
            tts.clearQueue();
            expect(tts.getQueueLength()).toBe(0);
        });
    });
    
    describe('Configuration Updates', () => {
        it('should update configuration', async () => {
            const { BulgarianTTS } = await import('../src/enterprise/bulgarian-tts');
            const tts = new BulgarianTTS();
            
            tts.updateConfig({ rate: 1.5, volume: 0.7 });
            const config = tts.getConfig();
            
            expect(config.rate).toBe(1.5);
            expect(config.volume).toBe(0.7);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 INTEGRATION SCENARIO TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 2 Integration Scenarios', () => {
    describe('Thermal-Aware Swarm Execution', () => {
        it('should reduce soldiers when hot', async () => {
            const { SwarmCommander } = await import('../src/enterprise/swarm-commander');
            const commander = new SwarmCommander({
                thermalConfig: {
                    throttleTemp: 90,
                    criticalTemp: 95,
                    coolTemp: 70,
                    maxSoldiersCool: 40,
                    minSoldiersHot: 4,
                    checkInterval: 1000
                }
            });
            
            await commander.initialize();
            
            // Cool - soldiers spawned
            commander.setTemperature(60);
            const coolStatuses = commander.getSoldierStatuses();
            const coolCount = coolStatuses.length;
            expect(coolCount).toBeGreaterThan(0);
            
            // Critical state should have fewer soldiers available
            commander.setTemperature(96);
            const metrics = commander.getMetrics();
            expect(metrics.thermalState).toBe('critical');
            
            await commander.shutdown();
        });
    });
    
    describe('Docker Grid with Bulgarian Feedback', () => {
        it('should generate complete grid setup', async () => {
            const { DockerManager } = await import('../src/enterprise/docker-manager');
            const manager = new DockerManager({
                hubPort: 4444,
                maxSessions: 16,
                nodes: [
                    { name: 'chrome', browser: 'chrome', instances: 8, memoryLimit: '2g', cpuLimit: '2.0', enableVnc: true, vncPort: 5900, seleniumPort: 5555 },
                    { name: 'firefox', browser: 'firefox', instances: 4, memoryLimit: '2g', cpuLimit: '1.0', enableVnc: false, seleniumPort: 5556 }
                ]
            });
            
            const dockerfile = manager.generateDockerfile();
            const compose = manager.generateDockerCompose();
            
            expect(dockerfile).toContain('node:20-slim');
            expect(compose).toContain('chrome-node');
            expect(compose).toContain('firefox-node');
        });
    });
    
    describe('Lenovo Hardware Optimization', () => {
        it('should optimize for Ryzen 7 7435HS specs', async () => {
            const { ThermalAwarePool } = await import('../src/enterprise/thermal-aware-pool');
            const pool = new ThermalAwarePool({
                // Ryzen 7 7435HS optimized settings
                throttleThreshold: 90, // Typical Ryzen throttle point
                criticalThreshold: 95, // Safety margin
                coolThreshold: 70, // Ideal operating temp
                maxInstancesCool: 40, // 16 threads * 2.5 (with HT efficiency)
                minInstancesHot: 4, // Minimum safe operation
                checkInterval: 2000
            });
            
            // Test full power mode
            pool.setTemperature(65);
            expect(pool.getConcurrency()).toBeGreaterThan(0);
            expect(pool.getConcurrency()).toBeLessThanOrEqual(40);
            expect(pool.getState()).toBe('cool');
            
            // Test throttled mode
            pool.setTemperature(92);
            expect(pool.isThrottling()).toBe(true);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🎖️ SOLDIER UNIT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Soldier', () => {
    it('should execute tasks', async () => {
        const { Soldier } = await import('../src/enterprise/swarm-commander');
        const soldier = new Soldier(1);
        
        const result = await soldier.execute({
            id: 'test_1',
            type: 'dom-inspection',
            priority: 'normal',
            payload: { selector: '#btn' },
            createdAt: Date.now(),
            retries: 0,
            maxRetries: 3
        });
        
        expect(result.success).toBe(true);
        expect(result.soldierId).toBe(1);
    });
    
    it('should track execution metrics', async () => {
        const { Soldier } = await import('../src/enterprise/swarm-commander');
        const soldier = new Soldier(1);
        
        await soldier.execute({
            id: 'test_1',
            type: 'semantic-analysis',
            priority: 'high',
            payload: {},
            createdAt: Date.now(),
            retries: 0,
            maxRetries: 3
        });
        
        const status = soldier.getStatus();
        expect(status.tasksCompleted).toBe(1);
        expect(status.avgExecutionTime).toBeGreaterThan(0);
    });
    
    it('should enter cooldown mode', async () => {
        const { Soldier } = await import('../src/enterprise/swarm-commander');
        const soldier = new Soldier(1);
        
        soldier.enterCooldown();
        expect(soldier.getStatus().status).toBe('cooldown');
        
        soldier.resume();
        expect(soldier.getStatus().status).toBe('idle');
    });
});
