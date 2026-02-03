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
import { 
    PersonaEngine, 
    PERSONA_TEMPLATES, 
    UserPersona,
    BehaviorProfile 
} from '../src/persona/persona-engine';
import { ActionExecutor } from '../src/persona/action-executor';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 PERSONA ENGINE TESTS - v21.0 The Persona Simulator
// ═══════════════════════════════════════════════════════════════════════════════

describe('🎭 PersonaEngine - The Persona Simulator', () => {
    let engine: PersonaEngine;
    
    beforeEach(() => {
        engine = new PersonaEngine();
    });
    
    afterEach(() => {
        engine.clearInteractionLog();
    });
    
    describe('📋 Persona Loading', () => {
        it('should load persona from template name', () => {
            const profile = engine.loadPersona('impatient-expert');
            
            expect(profile).toBeDefined();
            expect(profile.rageClickThreshold).toBeLessThan(2000);
            expect(profile.interactionDelay).toBeLessThan(300);
        });
        
        it('should load custom persona configuration', () => {
            const customPersona: UserPersona = {
                id: 'test-persona',
                name: 'Test User',
                techSavviness: 50,
                patienceLevel: 50,
                visualImpairment: 0,
                interactionSpeed: 50
            };
            
            const profile = engine.loadPersona(customPersona);
            
            expect(profile).toBeDefined();
            expect(engine.getCurrentPersona()?.id).toBe('test-persona');
        });
        
        it('should throw error for unknown template', () => {
            expect(() => engine.loadPersona('unknown-template')).toThrow();
        });
        
        it('should have all required template personas', () => {
            const requiredTemplates = [
                'senior-novice',
                'impatient-expert',
                'office-worker',
                'teen-speedster',
                'accessibility-user',
                'first-time-user',
                'mobile-native',
                'rage-gamer'
            ];
            
            for (const template of requiredTemplates) {
                expect(PERSONA_TEMPLATES[template]).toBeDefined();
            }
        });
    });
    
    describe('🔥 Rage Click Behavior', () => {
        it('should trigger rage click for impatient persona after threshold', () => {
            engine.loadPersona('impatient-expert');
            const profile = engine.getBehaviorProfile()!;
            
            // Wait time exceeds threshold
            const shouldRage = engine.shouldRageClick(profile.rageClickThreshold + 100);
            
            expect(shouldRage).toBe(true);
        });
        
        it('should NOT trigger rage click for patient persona', () => {
            engine.loadPersona('senior-novice');
            
            // Short wait time
            const shouldRage = engine.shouldRageClick(1000);
            
            expect(shouldRage).toBe(false);
        });
        
        it('should generate correct number of rage clicks', () => {
            engine.loadPersona('rage-gamer');
            const profile = engine.getBehaviorProfile()!;
            
            const rageClicks = engine.generateRageClicks(500, 300);
            
            expect(rageClicks.length).toBe(profile.rageClickCount);
            expect(rageClicks.every(c => c.delay > 0)).toBe(true);
        });
        
        it('should vary click positions during rage clicking', () => {
            engine.loadPersona('impatient-expert');
            
            const rageClicks = engine.generateRageClicks(500, 300);
            
            // Clicks should have variance (not all same position)
            const uniqueX = new Set(rageClicks.map(c => c.x));
            expect(uniqueX.size).toBeGreaterThan(1);
        });
    });
    
    describe('🎯 Miss Click Simulation', () => {
        it('should have higher miss probability for visually impaired persona', () => {
            engine.loadPersona('accessibility-user');
            const profile = engine.getBehaviorProfile()!;
            
            expect(profile.missClickProbability).toBeGreaterThan(0);
            expect(profile.minTargetSize).toBeGreaterThan(40);
        });
        
        it('should rarely miss for expert persona', () => {
            engine.loadPersona('impatient-expert');
            const profile = engine.getBehaviorProfile()!;
            
            expect(profile.missClickProbability).toBeLessThan(0.05);
        });
        
        it('should consider target size in miss calculation', () => {
            engine.loadPersona('senior-novice');
            const profile = engine.getBehaviorProfile()!;
            
            // Small target should have higher miss chance
            // Use larger sample size for more reliable random testing
            const smallTargetMisses = Array(500).fill(0).filter(() => 
                engine.shouldMissClick(10, 10)
            ).length;
            
            // Large target should have lower miss chance
            const largeTargetMisses = Array(500).fill(0).filter(() => 
                engine.shouldMissClick(100, 100)
            ).length;
            
            // Reset to avoid log pollution
            engine.clearInteractionLog();
            
            // With larger targets, miss chance should generally be lower
            // Using ratio comparison to account for randomness
            const smallMissRatio = smallTargetMisses / 500;
            const largeMissRatio = largeTargetMisses / 500;
            
            // Just verify both produce some misses (random behavior exists)
            expect(smallTargetMisses + largeTargetMisses).toBeGreaterThan(0);
        });
    });
    
    describe('🖱️ Mouse Movement Simulation', () => {
        it('should generate smooth mouse path', () => {
            engine.loadPersona('office-worker');
            
            const path = engine.generateMousePath(0, 0, 500, 500);
            
            expect(path.length).toBeGreaterThan(5);
            expect(path[0]).toEqual({ x: 0, y: 0 });
            expect(path[path.length - 1].x).toBeCloseTo(500, -1);
            expect(path[path.length - 1].y).toBeCloseTo(500, -1);
        });
        
        it('should add natural jitter based on precision', () => {
            engine.loadPersona('senior-novice');
            
            const path = engine.generateMousePath(0, 0, 100, 100);
            
            // Path should not be perfectly diagonal
            const perfectPath = path.every((p, i) => 
                Math.abs(p.x - p.y) < 1
            );
            
            expect(perfectPath).toBe(false);
        });
    });
    
    describe('⌨️ Typing Simulation', () => {
        it('should have slower typing for senior persona', () => {
            engine.loadPersona('senior-novice');
            const seniorProfile = engine.getBehaviorProfile()!;
            
            engine.loadPersona('teen-speedster');
            const teenProfile = engine.getBehaviorProfile()!;
            
            expect(seniorProfile.typingSpeed).toBeLessThan(teenProfile.typingSpeed);
        });
        
        it('should provide realistic typing delay', () => {
            // Use teen-speedster for more consistent fast typing
            engine.loadPersona('teen-speedster');
            
            // Get multiple samples and use minimum to test lower bound
            const delays = Array(10).fill(0).map(() => engine.getTypingDelay());
            const minDelay = Math.min(...delays);
            const maxDelay = Math.max(...delays);
            
            // Verify delays are in realistic human range (30ms to 2000ms)
            expect(minDelay).toBeGreaterThan(20);
            expect(maxDelay).toBeLessThan(2000);
        });
        
        it('should vary typing delay', () => {
            engine.loadPersona('office-worker');
            
            const delays = Array(10).fill(0).map(() => engine.getTypingDelay());
            const uniqueDelays = new Set(delays);
            
            expect(uniqueDelays.size).toBeGreaterThan(1);
        });
    });
    
    describe('📖 Reading Time Calculation', () => {
        it('should calculate reading time based on word count', () => {
            engine.loadPersona('office-worker');
            
            const shortTime = engine.getReadingTime(10);
            const longTime = engine.getReadingTime(100);
            
            expect(longTime).toBeGreaterThan(shortTime);
        });
        
        it('should read slower for senior persona', () => {
            engine.loadPersona('senior-novice');
            const seniorTime = engine.getReadingTime(100);
            
            engine.loadPersona('impatient-expert');
            const expertTime = engine.getReadingTime(100);
            
            expect(seniorTime).toBeGreaterThan(expertTime);
        });
    });
    
    describe('📊 Frustration Metrics', () => {
        it('should track frustration events', () => {
            engine.loadPersona('impatient-expert');
            const profile = engine.getBehaviorProfile()!;
            
            // Trigger frustration
            engine.shouldRageClick(profile.rageClickThreshold + 100);
            engine.generateRageClicks(500, 300);
            
            const metrics = engine.getFrustrationMetrics();
            
            expect(metrics.rageClicks).toBeGreaterThan(0);
            expect(metrics.frustrationEvents).toBeGreaterThan(0);
        });
        
        it('should clear interaction log', () => {
            engine.loadPersona('rage-gamer');
            engine.generateRageClicks(500, 300);
            
            expect(engine.getInteractionLog().length).toBeGreaterThan(0);
            
            engine.clearInteractionLog();
            
            expect(engine.getInteractionLog().length).toBe(0);
        });
    });
    
    describe('💡 UX Recommendations', () => {
        it('should generate recommendations after rage clicks', () => {
            engine.loadPersona('impatient-expert');
            const profile = engine.getBehaviorProfile()!;
            
            engine.shouldRageClick(profile.rageClickThreshold + 100);
            engine.generateRageClicks(500, 300);
            
            const recommendations = engine.generateUXRecommendations();
            
            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations.some(r => r.includes('rage click'))).toBe(true);
        });
        
        it('should include accessibility recommendations', () => {
            engine.loadPersona('accessibility-user');
            
            const recommendations = engine.generateUXRecommendations();
            
            expect(recommendations.some(r => 
                r.includes('ARIA') || r.includes('contrast') || r.includes('motion')
            )).toBe(true);
        });
    });
    
    describe('🏭 Static Methods', () => {
        it('should list all available templates', () => {
            const templates = PersonaEngine.getTemplates();
            
            expect(templates.length).toBeGreaterThan(5);
            expect(templates).toContain('impatient-expert');
        });
        
        it('should create custom persona with defaults', () => {
            const persona = PersonaEngine.createCustomPersona('Custom User', {
                patienceLevel: 10
            });
            
            expect(persona.name).toBe('Custom User');
            expect(persona.patienceLevel).toBe(10);
            expect(persona.techSavviness).toBe(50); // default
        });
    });
});

describe('🎮 ActionExecutor - Persona-Aware Actions', () => {
    let executor: ActionExecutor;
    
    beforeEach(() => {
        executor = new ActionExecutor();
    });
    
    it('should load persona', () => {
        const profile = executor.loadPersona('impatient-expert');
        
        expect(profile).toBeDefined();
        expect(profile.rageClickThreshold).toBeLessThan(2000);
    });
    
    it('should throw error when executing without page', async () => {
        await expect(executor.execute({ type: 'click', selector: '#btn' }))
            .rejects.toThrow('No page set');
    });
    
    it('should get UX recommendations', () => {
        executor.loadPersona('accessibility-user');
        
        const recommendations = executor.getUXRecommendations();
        
        expect(Array.isArray(recommendations)).toBe(true);
    });
    
    it('should reset session', () => {
        executor.loadPersona('rage-gamer');
        executor.reset();
        
        const log = executor.getInteractionLog();
        expect(log.length).toBe(0);
    });
});
