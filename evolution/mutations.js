/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 32/50: Mutation Engine                             ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Advanced Mutation Operators for Evolution
 * @phase 2 - Autonomous Intelligence
 * @step 32 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// MUTATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MutationType - Types of mutations
 */
const MutationType = {
    BIT_FLIP: 'bit_flip',
    SWAP: 'swap',
    INVERSION: 'inversion',
    SCRAMBLE: 'scramble',
    GAUSSIAN: 'gaussian',
    UNIFORM: 'uniform',
    POLYNOMIAL: 'polynomial',
    ADAPTIVE: 'adaptive',
    CREEP: 'creep'
};

// ═══════════════════════════════════════════════════════════════════════════════
// BASIC MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BasicMutations - Simple mutation operators
 */
class BasicMutations {
    /**
     * Bit flip mutation (binary)
     */
    static bitFlip(genome, rate = 0.1) {
        for (let i = 0; i < genome.length; i++) {
            if (Math.random() < rate) {
                genome.genes[i] = genome.genes[i] === 0 ? 1 : 0;
            }
        }
        genome.fitness = null;
        return genome;
    }

    /**
     * Swap mutation
     */
    static swap(genome, rate = 0.1) {
        if (Math.random() < rate && genome.length >= 2) {
            const i = Math.floor(Math.random() * genome.length);
            let j = Math.floor(Math.random() * genome.length);
            while (j === i) j = Math.floor(Math.random() * genome.length);
            
            [genome.genes[i], genome.genes[j]] = [genome.genes[j], genome.genes[i]];
            genome.fitness = null;
        }
        return genome;
    }

    /**
     * Inversion mutation
     */
    static inversion(genome, rate = 0.1) {
        if (Math.random() < rate && genome.length >= 2) {
            let start = Math.floor(Math.random() * genome.length);
            let end = Math.floor(Math.random() * genome.length);
            
            if (start > end) [start, end] = [end, start];
            
            const segment = genome.genes.slice(start, end + 1).reverse();
            genome.genes.splice(start, segment.length, ...segment);
            genome.fitness = null;
        }
        return genome;
    }

    /**
     * Scramble mutation
     */
    static scramble(genome, rate = 0.1) {
        if (Math.random() < rate && genome.length >= 2) {
            let start = Math.floor(Math.random() * genome.length);
            let end = Math.floor(Math.random() * genome.length);
            
            if (start > end) [start, end] = [end, start];
            
            const segment = genome.genes.slice(start, end + 1);
            // Fisher-Yates shuffle
            for (let i = segment.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [segment[i], segment[j]] = [segment[j], segment[i]];
            }
            genome.genes.splice(start, segment.length, ...segment);
            genome.fitness = null;
        }
        return genome;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL-VALUED MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RealMutations - Mutations for real-valued genes
 */
class RealMutations {
    /**
     * Gaussian mutation
     */
    static gaussian(genome, rate = 0.1, sigma = 0.1) {
        for (let i = 0; i < genome.length; i++) {
            if (Math.random() < rate) {
                // Box-Muller transform
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                
                genome.genes[i] += z * sigma;
            }
        }
        genome.fitness = null;
        return genome;
    }

    /**
     * Uniform mutation
     */
    static uniform(genome, rate = 0.1, low = 0, high = 1) {
        for (let i = 0; i < genome.length; i++) {
            if (Math.random() < rate) {
                genome.genes[i] = low + Math.random() * (high - low);
            }
        }
        genome.fitness = null;
        return genome;
    }

    /**
     * Polynomial mutation
     */
    static polynomial(genome, rate = 0.1, eta = 20, low = 0, high = 1) {
        for (let i = 0; i < genome.length; i++) {
            if (Math.random() < rate) {
                const y = genome.genes[i];
                const delta1 = (y - low) / (high - low);
                const delta2 = (high - y) / (high - low);
                
                const rnd = Math.random();
                let deltaq;
                
                if (rnd <= 0.5) {
                    const xy = 1 - delta1;
                    const val = 2 * rnd + (1 - 2 * rnd) * Math.pow(xy, eta + 1);
                    deltaq = Math.pow(val, 1 / (eta + 1)) - 1;
                } else {
                    const xy = 1 - delta2;
                    const val = 2 * (1 - rnd) + 2 * (rnd - 0.5) * Math.pow(xy, eta + 1);
                    deltaq = 1 - Math.pow(val, 1 / (eta + 1));
                }
                
                genome.genes[i] = Math.max(low, Math.min(high, y + deltaq * (high - low)));
            }
        }
        genome.fitness = null;
        return genome;
    }

    /**
     * Creep mutation
     */
    static creep(genome, rate = 0.1, step = 0.05) {
        for (let i = 0; i < genome.length; i++) {
            if (Math.random() < rate) {
                genome.genes[i] += (Math.random() - 0.5) * 2 * step;
            }
        }
        genome.fitness = null;
        return genome;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADAPTIVE MUTATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AdaptiveMutation - Self-adaptive mutation rates
 */
class AdaptiveMutation extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            initialRate: options.initialRate || 0.1,
            minRate: options.minRate || 0.001,
            maxRate: options.maxRate || 0.5,
            learningRate: options.learningRate || 0.1,
            successThreshold: options.successThreshold || 0.2,
            ...options
        };
        
        this.rate = this.options.initialRate;
        this.history = [];
        this.successCount = 0;
        this.totalCount = 0;
    }

    /**
     * Apply adaptive mutation
     */
    mutate(genome, fitnessImproved = false) {
        // Track success
        this.totalCount++;
        if (fitnessImproved) this.successCount++;
        
        // Adapt rate (1/5 success rule)
        if (this.totalCount >= 10) {
            const successRate = this.successCount / this.totalCount;
            
            if (successRate > this.options.successThreshold) {
                // Increase exploration
                this.rate = Math.min(this.options.maxRate, this.rate * 1.5);
            } else if (successRate < this.options.successThreshold / 2) {
                // Decrease exploration
                this.rate = Math.max(this.options.minRate, this.rate * 0.5);
            }
            
            this.history.push({ rate: this.rate, successRate });
            this.successCount = 0;
            this.totalCount = 0;
        }
        
        // Apply mutation
        return RealMutations.gaussian(genome, this.rate);
    }

    /**
     * Get current rate
     */
    getRate() {
        return this.rate;
    }

    /**
     * Reset
     */
    reset() {
        this.rate = this.options.initialRate;
        this.history = [];
        this.successCount = 0;
        this.totalCount = 0;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUTATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MutationEngine - Advanced mutation management
 */
class MutationEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            type: options.type || MutationType.GAUSSIAN,
            rate: options.rate || 0.1,
            adaptive: options.adaptive || false,
            bounds: options.bounds || { low: 0, high: 1 },
            ...options
        };
        
        this.adaptiveMutation = new AdaptiveMutation(options);
        this.stats = {
            mutations: 0,
            successful: 0
        };
    }

    /**
     * Apply mutation
     */
    mutate(genome, fitnessImproved = null) {
        this.stats.mutations++;
        
        if (this.options.adaptive && fitnessImproved !== null) {
            if (fitnessImproved) this.stats.successful++;
            return this.adaptiveMutation.mutate(genome, fitnessImproved);
        }
        
        switch (this.options.type) {
            case MutationType.BIT_FLIP:
                return BasicMutations.bitFlip(genome, this.options.rate);
                
            case MutationType.SWAP:
                return BasicMutations.swap(genome, this.options.rate);
                
            case MutationType.INVERSION:
                return BasicMutations.inversion(genome, this.options.rate);
                
            case MutationType.SCRAMBLE:
                return BasicMutations.scramble(genome, this.options.rate);
                
            case MutationType.GAUSSIAN:
                return RealMutations.gaussian(genome, this.options.rate, this.options.sigma || 0.1);
                
            case MutationType.UNIFORM:
                return RealMutations.uniform(genome, this.options.rate, 
                    this.options.bounds.low, this.options.bounds.high);
                
            case MutationType.POLYNOMIAL:
                return RealMutations.polynomial(genome, this.options.rate, 
                    this.options.eta || 20, this.options.bounds.low, this.options.bounds.high);
                
            case MutationType.CREEP:
                return RealMutations.creep(genome, this.options.rate, this.options.step || 0.05);
                
            default:
                return RealMutations.gaussian(genome, this.options.rate);
        }
    }

    /**
     * Get mutation operator function
     */
    getOperator() {
        return (genome, rate) => this.mutate(genome, null);
    }

    /**
     * Combine multiple mutations
     */
    combinedMutation(genome, types = [MutationType.GAUSSIAN, MutationType.SWAP]) {
        for (const type of types) {
            const originalType = this.options.type;
            this.options.type = type;
            this.mutate(genome);
            this.options.type = originalType;
        }
        return genome;
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.mutations > 0 
                ? this.stats.successful / this.stats.mutations 
                : 0,
            currentRate: this.options.adaptive 
                ? this.adaptiveMutation.getRate() 
                : this.options.rate
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    BasicMutations,
    RealMutations,
    AdaptiveMutation,
    MutationEngine,
    
    // Types
    MutationType,
    
    // Factory
    createEngine: (options = {}) => new MutationEngine(options),
    
    // Quick operators
    bitFlip: BasicMutations.bitFlip,
    swap: BasicMutations.swap,
    inversion: BasicMutations.inversion,
    scramble: BasicMutations.scramble,
    gaussian: RealMutations.gaussian,
    uniform: RealMutations.uniform,
    polynomial: RealMutations.polynomial,
    creep: RealMutations.creep
};

console.log('✅ Step 32/50: Mutation Engine loaded');
