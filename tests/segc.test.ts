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
 * For licensing inquiries: dimitar.papazov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * 🧬 SEGC Tests - Self-Evolving Genetic Core
 * 
 * @version 18.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SEGCController,
  GhostExecutionLayer,
  PredictiveStatePreloader,
  GeneticMutationEngine,
  HotSwapModuleLoader,
  StateVersioningSystem,
  MutationType,
} from '../src/segc';

describe('🧬 Self-Evolving Genetic Core v18.0', () => {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GHOST EXECUTION LAYER TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('👻 Ghost Execution Layer', () => {
    let ghost: GhostExecutionLayer;
    
    beforeEach(() => {
      ghost = new GhostExecutionLayer();
    });
    
    afterEach(async () => {
      await ghost.shutdown();
    });
    
    it('should generate alternative paths for a selector', () => {
      const alternatives = ghost.generateAlternativePaths(
        '#login-button',
        'Login',
        'button'
      );
      
      expect(alternatives).toBeDefined();
      expect(alternatives.length).toBeGreaterThan(1);
      expect(alternatives[0].selector).toBe('#login-button');
      expect(alternatives.some(a => a.strategy === 'text')).toBe(true);
    });
    
    it('should include text-based alternative', () => {
      const alternatives = ghost.generateAlternativePaths(
        'button.submit-btn',
        'Submit Form'
      );
      
      const textPath = alternatives.find(a => a.strategy === 'text');
      expect(textPath).toBeDefined();
      expect(textPath?.selector).toBe('Submit Form');
    });
    
    it('should simplify complex selectors', () => {
      const alternatives = ghost.generateAlternativePaths(
        'div.container > form#login > button[data-testid="submit"]:nth-child(2)'
      );
      
      // Should have a simplified version
      const simplified = alternatives.find(a => a.name === 'Path C (Simplified)');
      expect(simplified).toBeDefined();
    });
    
    it('should track statistics', () => {
      const stats = ghost.getStats();
      
      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('pathsTested');
      expect(stats).toHaveProperty('improvementsFound');
      expect(stats).toHaveProperty('knowledgeBaseSize');
    });
    
    it('should export and import knowledge', () => {
      const knowledge = ghost.exportKnowledge();
      expect(Array.isArray(knowledge)).toBe(true);
      
      ghost.importKnowledge([{
        pathHash: 'test_hash',
        successRate: 0.9,
        avgTime: 100,
        sampleCount: 5,
        lastUpdated: new Date(),
      }]);
      
      expect(ghost.getStats().knowledgeBaseSize).toBe(1);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PREDICTIVE STATE PRE-LOADER TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('🔮 Predictive State Pre-loader', () => {
    let predictive: PredictiveStatePreloader;
    
    beforeEach(() => {
      predictive = new PredictiveStatePreloader();
    });
    
    afterEach(async () => {
      await predictive.shutdown();
    });
    
    it('should learn state transitions', () => {
      predictive.learnTransition('login', 'dashboard', 500);
      predictive.learnTransition('login', 'dashboard', 450);
      predictive.learnTransition('login', 'error', 100);
      
      const stats = predictive.getTransitionStats();
      
      expect(stats.length).toBe(2);
      expect(stats.find(t => t.from === 'login' && t.to === 'dashboard')).toBeDefined();
    });
    
    it('should predict next states', () => {
      // Learn some transitions
      predictive.learnTransition('home', 'products', 200);
      predictive.learnTransition('home', 'about', 150);
      predictive.learnTransition('home', 'products', 180);
      
      const predictions = predictive.predictNextStates('home');
      
      expect(predictions.length).toBeGreaterThan(0);
      // Products should be more likely
      expect(predictions[0].stateId).toBe('products');
    });
    
    it('should register and cache selectors', () => {
      const selector = predictive.registerSelector('dashboard', '#user-profile', {
        textContent: 'Profile',
        ariaLabel: 'User Profile',
      });
      
      expect(selector.original).toBe('#user-profile');
      expect(selector.alternatives.length).toBeGreaterThan(0);
    });
    
    it('should cache DOM snapshots', () => {
      predictive.cacheDOMSnapshot('login', '<html><body>Login Page</body></html>');
      
      const cached = predictive.getCachedDOM('login');
      expect(cached).toContain('Login Page');
    });
    
    it('should export and import state machine', () => {
      predictive.learnTransition('A', 'B', 100);
      predictive.learnTransition('B', 'C', 150);
      
      const exported = predictive.exportStateMachine();
      
      expect(exported.states).toContain('A');
      expect(exported.states).toContain('B');
      expect(exported.transitions.length).toBe(2);
      
      // Import into new instance
      const newPreloader = new PredictiveStatePreloader();
      newPreloader.importStateMachine(exported);
      
      expect(newPreloader.getStats().transitionCount).toBe(2);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GENETIC MUTATION ENGINE TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('🧬 Genetic Mutation Engine', () => {
    let mutations: GeneticMutationEngine;
    
    beforeEach(() => {
      mutations = new GeneticMutationEngine();
    });
    
    afterEach(async () => {
      await mutations.shutdown();
    });
    
    it('should record failures and detect patterns', () => {
      const pattern = mutations.recordFailure({
        error: 'Timeout: element not found',
        selector: '#login-button',
        testName: 'login.test.ts',
      });
      
      expect(pattern).toBeDefined();
      expect(pattern.errorType).toBe('timeout');
    });
    
    it('should generate mutation after repeated failures', () => {
      // Record same failure multiple times
      for (let i = 0; i < 4; i++) {
        mutations.recordFailure({
          error: 'Element not found: #submit',
          selector: '#submit',
          testName: 'form.test.ts',
        });
      }
      
      const pending = mutations.getPendingMutations();
      expect(pending.length).toBeGreaterThan(0);
      expect(pending[0].type).toBe(MutationType.WAIT_INJECTION);
    });
    
    it('should classify different error types', () => {
      const timeoutPattern = mutations.recordFailure({
        error: 'Timeout exceeded',
        selector: '#btn',
      });
      expect(timeoutPattern.errorType).toBe('timeout');
      
      const notFoundPattern = mutations.recordFailure({
        error: 'No element found for selector',
        selector: '#missing',
      });
      expect(notFoundPattern.errorType).toBe('element_not_found');
    });
    
    it('should track mutation statistics', () => {
      const stats = mutations.getStats();
      
      expect(stats).toHaveProperty('patternsDetected');
      expect(stats).toHaveProperty('mutationsGenerated');
      expect(stats).toHaveProperty('mutationsApplied');
      expect(stats).toHaveProperty('successRate');
    });
    
    it('should support custom mutation rules', () => {
      mutations.addMutationRule('custom_error', (pattern) => ({
        id: 'custom_mut',
        type: MutationType.ERROR_HANDLING,
        targetSelector: pattern.selector || '',
        originalCode: '',
        mutatedCode: 'try { } catch { }',
        confidence: 0.9,
        generatedAt: new Date(),
        status: 'pending',
        parentPattern: pattern.id,
      }));
      
      // Record failure that matches custom rule
      for (let i = 0; i < 4; i++) {
        mutations.recordFailure({
          error: 'custom_error: something bad',
          selector: '#test',
        });
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HOT-SWAP MODULE LOADER TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('🔥 Hot-Swap Module Loader', () => {
    let hotswap: HotSwapModuleLoader;
    
    beforeEach(() => {
      hotswap = new HotSwapModuleLoader();
    });
    
    afterEach(async () => {
      await hotswap.shutdown();
    });
    
    it('should register a module with methods', () => {
      class TestService {
        greet(name: string) { return `Hello, ${name}!`; }
        add(a: number, b: number) { return a + b; }
      }
      
      const module = hotswap.registerModule('TestService', new TestService());
      
      expect(module.name).toBe('TestService');
      expect(module.methods.size).toBe(2);
    });
    
    it('should add alternative implementations', () => {
      class Calculator {
        multiply(a: number, b: number) { return a * b; }
      }
      
      const module = hotswap.registerModule('Calculator', new Calculator());
      
      // Get the registered method from module.methods Map
      // Keys are method names, values are SwappableMethod objects
      expect(module.methods.size).toBeGreaterThan(0);
      
      // Get first method entry
      const [methodName, method] = Array.from(module.methods.entries())[0];
      
      // The method ID for addAlternative should be the full ID (moduleId:methodName)
      const alt = hotswap.addAlternative(
        method.id, // Use method.id which is the full ID
        (a: number, b: number) => a * b * 1.1, // 10% boost
        { name: 'Boosted Multiply' }
      );
      
      expect(alt.name).toBe('Boosted Multiply');
      expect(method.alternatives.length).toBe(1);
    });
    
    it('should track statistics', () => {
      const stats = hotswap.getStats();
      
      expect(stats).toHaveProperty('modulesRegistered');
      expect(stats).toHaveProperty('methodsRegistered');
      expect(stats).toHaveProperty('swapsPerformed');
    });
    
    it('should export configuration', () => {
      class Service {
        run() { return 'running'; }
      }
      
      hotswap.registerModule('Service', new Service());
      
      const config = hotswap.exportConfig();
      
      expect(config.modules.length).toBe(1);
      expect(config.modules[0].name).toBe('Service');
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE VERSIONING SYSTEM TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('🔄 State Versioning System', () => {
    let versioning: StateVersioningSystem;
    
    beforeEach(() => {
      versioning = new StateVersioningSystem();
    });
    
    afterEach(async () => {
      await versioning.shutdown();
    });
    
    it('should create versions', () => {
      const version = versioning.createVersion({
        name: 'Strategy A',
        description: 'Initial strategy',
        strategy: { selector: '#btn' },
        isBaseline: true,
      });
      
      expect(version.id).toBeDefined();
      expect(version.name).toBe('Strategy A');
      expect(version.isBaseline).toBe(true);
    });
    
    it('should activate versions', () => {
      const v1 = versioning.createVersion({
        name: 'V1',
        strategy: { timeout: 5000 },
      });
      
      versioning.activateVersion(v1.id);
      
      const active = versioning.selectVersion();
      expect(active?.id).toBe(v1.id);
    });
    
    it('should run A/B experiments', () => {
      const vA = versioning.createVersion({
        name: 'Version A',
        strategy: { wait: 1000 },
      });
      
      const vB = versioning.createVersion({
        name: 'Version B',
        strategy: { wait: 500 },
      });
      
      const experimentId = versioning.startExperiment(vA.id, vB.id, 0.5);
      
      expect(experimentId).toBeDefined();
      
      const experiment = versioning.getExperiment(experimentId);
      expect(experiment).toBeDefined();
      expect(experiment?.versionA).toBe(vA.id);
      expect(experiment?.versionB).toBe(vB.id);
    });
    
    it('should record results and track metrics', () => {
      const version = versioning.createVersion({
        name: 'Test Version',
        strategy: {},
      });
      
      versioning.activateVersion(version.id);
      
      // Record some results
      for (let i = 0; i < 10; i++) {
        versioning.recordResult(version.id, {
          success: i < 8, // 80% success rate
          executionTime: 100 + Math.random() * 50,
        });
      }
      
      const metrics = versioning.getVersionMetrics(version.id);
      expect(metrics?.successCount).toBe(8);
      expect(metrics?.totalExecutions).toBe(10);
    });
    
    it('should rollback to baseline', () => {
      const baseline = versioning.createVersion({
        name: 'Baseline',
        strategy: { stable: true },
        isBaseline: true,
      });
      
      const experimental = versioning.createVersion({
        name: 'Experimental',
        strategy: { risky: true },
      });
      
      versioning.activateVersion(experimental.id);
      versioning.rollbackToBaseline();
      
      const active = versioning.selectVersion();
      expect(active?.id).toBe(baseline.id);
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SEGC CONTROLLER TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  describe('🧬 SEGC Controller', () => {
    let segc: SEGCController;
    
    beforeEach(() => {
      segc = new SEGCController({ verbose: false });
    });
    
    afterEach(async () => {
      await segc.shutdown();
    });
    
    it('should initialize all components', () => {
      expect(segc.ghost).toBeInstanceOf(GhostExecutionLayer);
      expect(segc.predictive).toBeInstanceOf(PredictiveStatePreloader);
      expect(segc.mutations).toBeInstanceOf(GeneticMutationEngine);
      expect(segc.hotswap).toBeInstanceOf(HotSwapModuleLoader);
      expect(segc.versioning).toBeInstanceOf(StateVersioningSystem);
    });
    
    it('should provide comprehensive statistics', () => {
      const stats = segc.getStats();
      
      expect(stats).toHaveProperty('ghostExecutions');
      expect(stats).toHaveProperty('ghostImprovements');
      expect(stats).toHaveProperty('predictionsMade');
      expect(stats).toHaveProperty('predictionAccuracy');
      expect(stats).toHaveProperty('mutationsProposed');
      expect(stats).toHaveProperty('mutationsApplied');
      expect(stats).toHaveProperty('hotSwapsPerformed');
      expect(stats).toHaveProperty('overallFitnessImprovement');
      expect(stats).toHaveProperty('uptime');
    });
    
    it('should run learning cycles', async () => {
      const result = await segc.runLearningCycle();
      
      expect(result).toHaveProperty('improvements');
      expect(result).toHaveProperty('mutations');
      expect(result).toHaveProperty('predictions');
    });
    
    it('should record failures', () => {
      segc.recordFailure({
        error: 'Timeout waiting for selector',
        selector: '#test-element',
        testName: 'sample.test.ts',
      });
      
      const patterns = segc.mutations.getFailurePatterns();
      expect(patterns.length).toBe(1);
    });
    
    it('should record state changes', () => {
      segc.recordStateChange('login');
      segc.recordStateChange('dashboard');
      segc.recordStateChange('profile');
      
      const transitions = segc.predictive.getTransitionStats();
      expect(transitions.length).toBeGreaterThan(0);
    });
    
    it('should create strategy versions', () => {
      const version = segc.createVersion({
        name: 'Strategy V1',
        description: 'First iteration',
        strategy: { timeout: 10000 },
        isBaseline: true,
      });
      
      expect(version).toBeDefined();
      expect(version?.name).toBe('Strategy V1');
    });
    
    it('should export and import knowledge', () => {
      // Add some data
      segc.recordStateChange('A');
      segc.recordStateChange('B');
      
      const knowledge = segc.exportKnowledge();
      
      expect(knowledge.ghost).toBeDefined();
      expect(knowledge.predictive).toBeDefined();
      expect(knowledge.mutations).toBeDefined();
      expect(knowledge.versioning).toBeDefined();
    });
  });
});
