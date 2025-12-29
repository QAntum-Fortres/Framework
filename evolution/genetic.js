/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 31/50: Genetic Evolution                           ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Evolutionary Algorithms and Genetic Optimization
 * @phase 2 - Autonomous Intelligence
 * @step 31 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// GENETIC TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SelectionMethod - Parent selection methods
 */
const SelectionMethod = {
    TOURNAMENT: 'tournament',
    ROULETTE: 'roulette',
    RANK: 'rank',
    ELITISM: 'elitism',
    TRUNCATION: 'truncation'
};

/**
 * CrossoverMethod - Crossover methods
 */
const CrossoverMethod = {
    SINGLE_POINT: 'single_point',
    TWO_POINT: 'two_point',
    UNIFORM: 'uniform',
    ARITHMETIC: 'arithmetic',
    SBX: 'sbx' // Simulated Binary Crossover
};

// ═══════════════════════════════════════════════════════════════════════════════
// GENOME
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Genome - Individual in population
 */
class Genome {
    constructor(genes = [], fitness = null) {
        this.id = `genome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.genes = genes;
        this.fitness = fitness;
        this.age = 0;
        this.metadata = {};
    }

    /**
     * Create random genome
     */
    static random(length, geneGenerator) {
        const genes = Array(length).fill(0).map((_, i) => geneGenerator(i));
        return new Genome(genes);
    }

    /**
     * Clone genome
     */
    clone() {
        const clone = new Genome([...this.genes], this.fitness);
        clone.age = this.age;
        clone.metadata = { ...this.metadata };
        return clone;
    }

    /**
     * Get gene at index
     */
    get(index) {
        return this.genes[index];
    }

    /**
     * Set gene at index
     */
    set(index, value) {
        this.genes[index] = value;
        this.fitness = null; // Invalidate fitness
        return this;
    }

    /**
     * Get genome length
     */
    get length() {
        return this.genes.length;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SELECTION OPERATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SelectionOperator - Parent selection strategies
 */
class SelectionOperator {
    /**
     * Tournament selection
     */
    static tournament(population, tournamentSize = 3) {
        const tournament = [];
        
        for (let i = 0; i < tournamentSize; i++) {
            const idx = Math.floor(Math.random() * population.length);
            tournament.push(population[idx]);
        }
        
        return tournament.reduce((best, current) => 
            (current.fitness > best.fitness) ? current : best
        );
    }

    /**
     * Roulette wheel selection
     */
    static roulette(population) {
        const totalFitness = population.reduce((sum, g) => sum + Math.max(g.fitness, 0), 0);
        
        if (totalFitness === 0) {
            return population[Math.floor(Math.random() * population.length)];
        }
        
        let spin = Math.random() * totalFitness;
        
        for (const genome of population) {
            spin -= Math.max(genome.fitness, 0);
            if (spin <= 0) return genome;
        }
        
        return population[population.length - 1];
    }

    /**
     * Rank-based selection
     */
    static rank(population) {
        const sorted = [...population].sort((a, b) => a.fitness - b.fitness);
        const totalRank = (population.length * (population.length + 1)) / 2;
        
        let spin = Math.random() * totalRank;
        
        for (let i = 0; i < sorted.length; i++) {
            spin -= (i + 1);
            if (spin <= 0) return sorted[i];
        }
        
        return sorted[sorted.length - 1];
    }

    /**
     * Truncation selection
     */
    static truncation(population, keepRatio = 0.5) {
        const sorted = [...population].sort((a, b) => b.fitness - a.fitness);
        const keepCount = Math.floor(population.length * keepRatio);
        const selected = sorted.slice(0, keepCount);
        
        return selected[Math.floor(Math.random() * selected.length)];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CROSSOVER OPERATORS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CrossoverOperator - Genetic crossover strategies
 */
class CrossoverOperator {
    /**
     * Single point crossover
     */
    static singlePoint(parent1, parent2) {
        const point = Math.floor(Math.random() * parent1.length);
        
        const child1Genes = [...parent1.genes.slice(0, point), ...parent2.genes.slice(point)];
        const child2Genes = [...parent2.genes.slice(0, point), ...parent1.genes.slice(point)];
        
        return [new Genome(child1Genes), new Genome(child2Genes)];
    }

    /**
     * Two point crossover
     */
    static twoPoint(parent1, parent2) {
        let point1 = Math.floor(Math.random() * parent1.length);
        let point2 = Math.floor(Math.random() * parent1.length);
        
        if (point1 > point2) [point1, point2] = [point2, point1];
        
        const child1Genes = [
            ...parent1.genes.slice(0, point1),
            ...parent2.genes.slice(point1, point2),
            ...parent1.genes.slice(point2)
        ];
        
        const child2Genes = [
            ...parent2.genes.slice(0, point1),
            ...parent1.genes.slice(point1, point2),
            ...parent2.genes.slice(point2)
        ];
        
        return [new Genome(child1Genes), new Genome(child2Genes)];
    }

    /**
     * Uniform crossover
     */
    static uniform(parent1, parent2, probability = 0.5) {
        const child1Genes = [];
        const child2Genes = [];
        
        for (let i = 0; i < parent1.length; i++) {
            if (Math.random() < probability) {
                child1Genes.push(parent1.genes[i]);
                child2Genes.push(parent2.genes[i]);
            } else {
                child1Genes.push(parent2.genes[i]);
                child2Genes.push(parent1.genes[i]);
            }
        }
        
        return [new Genome(child1Genes), new Genome(child2Genes)];
    }

    /**
     * Arithmetic crossover (for real-valued genes)
     */
    static arithmetic(parent1, parent2, alpha = 0.5) {
        const child1Genes = [];
        const child2Genes = [];
        
        for (let i = 0; i < parent1.length; i++) {
            child1Genes.push(alpha * parent1.genes[i] + (1 - alpha) * parent2.genes[i]);
            child2Genes.push((1 - alpha) * parent1.genes[i] + alpha * parent2.genes[i]);
        }
        
        return [new Genome(child1Genes), new Genome(child2Genes)];
    }

    /**
     * Simulated Binary Crossover (SBX)
     */
    static sbx(parent1, parent2, eta = 20) {
        const child1Genes = [];
        const child2Genes = [];
        
        for (let i = 0; i < parent1.length; i++) {
            const u = Math.random();
            const beta = u <= 0.5 
                ? Math.pow(2 * u, 1 / (eta + 1))
                : Math.pow(1 / (2 * (1 - u)), 1 / (eta + 1));
            
            child1Genes.push(0.5 * ((1 + beta) * parent1.genes[i] + (1 - beta) * parent2.genes[i]));
            child2Genes.push(0.5 * ((1 - beta) * parent1.genes[i] + (1 + beta) * parent2.genes[i]));
        }
        
        return [new Genome(child1Genes), new Genome(child2Genes)];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENETIC ALGORITHM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GeneticAlgorithm - Main evolution engine
 */
class GeneticAlgorithm extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            populationSize: options.populationSize || 100,
            eliteCount: options.eliteCount || 2,
            crossoverRate: options.crossoverRate || 0.8,
            mutationRate: options.mutationRate || 0.1,
            selectionMethod: options.selectionMethod || SelectionMethod.TOURNAMENT,
            crossoverMethod: options.crossoverMethod || CrossoverMethod.UNIFORM,
            tournamentSize: options.tournamentSize || 3,
            ...options
        };
        
        this.population = [];
        this.generation = 0;
        this.bestGenome = null;
        this.history = [];
    }

    /**
     * Initialize population
     */
    initialize(genomeLength, geneGenerator) {
        this.population = [];
        
        for (let i = 0; i < this.options.populationSize; i++) {
            this.population.push(Genome.random(genomeLength, geneGenerator));
        }
        
        this.generation = 0;
        this.emit('initialized', { populationSize: this.population.length });
        
        return this;
    }

    /**
     * Evaluate population fitness
     */
    evaluate(fitnessFunction) {
        for (const genome of this.population) {
            if (genome.fitness === null) {
                genome.fitness = fitnessFunction(genome.genes);
            }
        }
        
        // Update best
        for (const genome of this.population) {
            if (!this.bestGenome || genome.fitness > this.bestGenome.fitness) {
                this.bestGenome = genome.clone();
            }
        }
        
        return this;
    }

    /**
     * Select parents
     */
    _selectParent() {
        switch (this.options.selectionMethod) {
            case SelectionMethod.TOURNAMENT:
                return SelectionOperator.tournament(this.population, this.options.tournamentSize);
            case SelectionMethod.ROULETTE:
                return SelectionOperator.roulette(this.population);
            case SelectionMethod.RANK:
                return SelectionOperator.rank(this.population);
            case SelectionMethod.TRUNCATION:
                return SelectionOperator.truncation(this.population);
            default:
                return SelectionOperator.tournament(this.population);
        }
    }

    /**
     * Crossover
     */
    _crossover(parent1, parent2) {
        if (Math.random() > this.options.crossoverRate) {
            return [parent1.clone(), parent2.clone()];
        }
        
        switch (this.options.crossoverMethod) {
            case CrossoverMethod.SINGLE_POINT:
                return CrossoverOperator.singlePoint(parent1, parent2);
            case CrossoverMethod.TWO_POINT:
                return CrossoverOperator.twoPoint(parent1, parent2);
            case CrossoverMethod.UNIFORM:
                return CrossoverOperator.uniform(parent1, parent2);
            case CrossoverMethod.ARITHMETIC:
                return CrossoverOperator.arithmetic(parent1, parent2);
            case CrossoverMethod.SBX:
                return CrossoverOperator.sbx(parent1, parent2);
            default:
                return CrossoverOperator.uniform(parent1, parent2);
        }
    }

    /**
     * Evolve one generation
     */
    evolve(mutationOperator) {
        // Sort by fitness
        this.population.sort((a, b) => b.fitness - a.fitness);
        
        const newPopulation = [];
        
        // Elitism
        for (let i = 0; i < this.options.eliteCount; i++) {
            newPopulation.push(this.population[i].clone());
        }
        
        // Fill rest with offspring
        while (newPopulation.length < this.options.populationSize) {
            const parent1 = this._selectParent();
            const parent2 = this._selectParent();
            
            const [child1, child2] = this._crossover(parent1, parent2);
            
            // Mutate
            mutationOperator(child1, this.options.mutationRate);
            mutationOperator(child2, this.options.mutationRate);
            
            newPopulation.push(child1);
            if (newPopulation.length < this.options.populationSize) {
                newPopulation.push(child2);
            }
        }
        
        // Age genomes
        for (const genome of newPopulation) {
            genome.age++;
        }
        
        this.population = newPopulation;
        this.generation++;
        
        // Record history
        const stats = this.getStatistics();
        this.history.push(stats);
        
        this.emit('evolved', stats);
        
        return this;
    }

    /**
     * Run evolution
     */
    run(fitnessFunction, mutationOperator, generations = 100) {
        this.evaluate(fitnessFunction);
        
        for (let g = 0; g < generations; g++) {
            this.evolve(mutationOperator);
            this.evaluate(fitnessFunction);
            
            this.emit('generation', {
                generation: this.generation,
                best: this.bestGenome.fitness,
                ...this.getStatistics()
            });
        }
        
        return {
            bestGenome: this.bestGenome,
            history: this.history
        };
    }

    /**
     * Get population statistics
     */
    getStatistics() {
        const fitnesses = this.population.map(g => g.fitness);
        
        return {
            generation: this.generation,
            best: Math.max(...fitnesses),
            worst: Math.min(...fitnesses),
            average: fitnesses.reduce((a, b) => a + b, 0) / fitnesses.length,
            diversity: this._calculateDiversity()
        };
    }

    /**
     * Calculate genetic diversity
     */
    _calculateDiversity() {
        if (this.population.length < 2) return 0;
        
        let totalDistance = 0;
        let comparisons = 0;
        
        for (let i = 0; i < Math.min(10, this.population.length); i++) {
            for (let j = i + 1; j < Math.min(10, this.population.length); j++) {
                totalDistance += this._hammingDistance(
                    this.population[i].genes,
                    this.population[j].genes
                );
                comparisons++;
            }
        }
        
        return comparisons > 0 ? totalDistance / comparisons : 0;
    }

    /**
     * Hamming distance
     */
    _hammingDistance(genes1, genes2) {
        let distance = 0;
        for (let i = 0; i < genes1.length; i++) {
            if (genes1[i] !== genes2[i]) distance++;
        }
        return distance / genes1.length;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    Genome,
    SelectionOperator,
    CrossoverOperator,
    GeneticAlgorithm,
    
    // Types
    SelectionMethod,
    CrossoverMethod,
    
    // Factory
    createGA: (options = {}) => new GeneticAlgorithm(options),
    createGenome: (genes, fitness) => new Genome(genes, fitness)
};

console.log('✅ Step 31/50: Genetic Evolution loaded');
