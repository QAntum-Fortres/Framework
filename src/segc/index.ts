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

// Main Controller
export { SEGCController, default } from './segc-controller';

// Components
export { GhostExecutionLayer } from './ghost/ghost-execution-layer';
export { PredictiveStatePreloader } from './predictive/state-preloader';
export { GeneticMutationEngine } from './mutations/mutation-engine';
export { HotSwapModuleLoader } from './hotswap/module-loader';
export { StateVersioningSystem } from './versioning/state-versioner';

// Types
export * from './types';
