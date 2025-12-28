/**
 * 🧬 Self-Evolving Genetic Core - Index
 * 
 * @author Dimitar Papazov
 * @version 18.0.0
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
