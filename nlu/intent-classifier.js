/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 22/50: Intent Classifier                           ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description ML-based intent classification with training capabilities
 * @phase 2 - Autonomous Intelligence
 * @step 22 of 50
 */

'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE VECTORIZER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FeatureVectorizer - Convert text to feature vectors
 */
class FeatureVectorizer {
    constructor(options = {}) {
        this.options = {
            maxFeatures: options.maxFeatures || 1000,
            ngrams: options.ngrams || [1, 2],
            ...options
        };
        
        this.vocabulary = new Map();
        this.idf = new Map();
        this.fitted = false;
    }

    /**
     * Fit vocabulary from documents
     */
    fit(documents) {
        const docCount = documents.length;
        const termDocCount = new Map();
        
        // Build vocabulary and count document frequencies
        for (const doc of documents) {
            const tokens = this._tokenize(doc);
            const ngrams = this._getNgrams(tokens);
            const seen = new Set();
            
            for (const ngram of ngrams) {
                if (!seen.has(ngram)) {
                    seen.add(ngram);
                    termDocCount.set(ngram, (termDocCount.get(ngram) || 0) + 1);
                }
            }
        }
        
        // Select top features by document frequency
        const sorted = Array.from(termDocCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.options.maxFeatures);
        
        // Build vocabulary
        this.vocabulary.clear();
        sorted.forEach(([term], index) => {
            this.vocabulary.set(term, index);
        });
        
        // Calculate IDF
        for (const [term, count] of termDocCount) {
            if (this.vocabulary.has(term)) {
                this.idf.set(term, Math.log(docCount / (1 + count)) + 1);
            }
        }
        
        this.fitted = true;
        return this;
    }

    /**
     * Transform document to vector
     */
    transform(document) {
        if (!this.fitted) {
            throw new Error('Vectorizer must be fitted first');
        }
        
        const vector = new Float32Array(this.vocabulary.size);
        const tokens = this._tokenize(document);
        const ngrams = this._getNgrams(tokens);
        
        // Count term frequencies
        const tf = new Map();
        for (const ngram of ngrams) {
            tf.set(ngram, (tf.get(ngram) || 0) + 1);
        }
        
        // Build TF-IDF vector
        for (const [term, freq] of tf) {
            if (this.vocabulary.has(term)) {
                const index = this.vocabulary.get(term);
                const idf = this.idf.get(term) || 1;
                vector[index] = freq * idf;
            }
        }
        
        // L2 normalize
        const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (norm > 0) {
            for (let i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }
        
        return vector;
    }

    /**
     * Fit and transform
     */
    fitTransform(documents) {
        this.fit(documents);
        return documents.map(doc => this.transform(doc));
    }

    /**
     * Tokenize text
     */
    _tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }

    /**
     * Get n-grams
     */
    _getNgrams(tokens) {
        const result = [];
        
        for (const n of this.options.ngrams) {
            for (let i = 0; i <= tokens.length - n; i++) {
                result.push(tokens.slice(i, i + n).join(' '));
            }
        }
        
        return result;
    }

    /**
     * Serialize
     */
    toJSON() {
        return {
            vocabulary: Array.from(this.vocabulary.entries()),
            idf: Array.from(this.idf.entries()),
            options: this.options
        };
    }

    /**
     * Deserialize
     */
    static fromJSON(json) {
        const vectorizer = new FeatureVectorizer(json.options);
        vectorizer.vocabulary = new Map(json.vocabulary);
        vectorizer.idf = new Map(json.idf);
        vectorizer.fitted = true;
        return vectorizer;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAIVE BAYES CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NaiveBayesClassifier - Simple but effective classifier
 */
class NaiveBayesClassifier {
    constructor(options = {}) {
        this.options = {
            alpha: options.alpha || 1.0, // Laplace smoothing
            ...options
        };
        
        this.classes = [];
        this.classPriors = new Map();
        this.featureProbabilities = new Map();
        this.trained = false;
    }

    /**
     * Train classifier
     */
    train(X, y) {
        // Get unique classes
        this.classes = [...new Set(y)];
        const nSamples = X.length;
        const nFeatures = X[0].length;
        
        // Calculate class priors
        const classCounts = new Map();
        for (const label of y) {
            classCounts.set(label, (classCounts.get(label) || 0) + 1);
        }
        
        for (const [cls, count] of classCounts) {
            this.classPriors.set(cls, count / nSamples);
        }
        
        // Calculate feature probabilities per class
        for (const cls of this.classes) {
            const classIndices = y.map((label, i) => label === cls ? i : -1).filter(i => i >= 0);
            const featureProbs = new Float32Array(nFeatures);
            
            for (let f = 0; f < nFeatures; f++) {
                let sum = 0;
                for (const i of classIndices) {
                    sum += X[i][f];
                }
                // Add smoothing
                featureProbs[f] = (sum + this.options.alpha) / (classIndices.length + this.options.alpha * nFeatures);
            }
            
            this.featureProbabilities.set(cls, featureProbs);
        }
        
        this.trained = true;
        return this;
    }

    /**
     * Predict class
     */
    predict(x) {
        const probs = this.predictProbabilities(x);
        
        let maxClass = null;
        let maxProb = -Infinity;
        
        for (const [cls, prob] of probs) {
            if (prob > maxProb) {
                maxProb = prob;
                maxClass = cls;
            }
        }
        
        return maxClass;
    }

    /**
     * Predict probabilities
     */
    predictProbabilities(x) {
        if (!this.trained) {
            throw new Error('Classifier must be trained first');
        }
        
        const logProbs = new Map();
        
        for (const cls of this.classes) {
            let logProb = Math.log(this.classPriors.get(cls));
            const featureProbs = this.featureProbabilities.get(cls);
            
            for (let f = 0; f < x.length; f++) {
                if (x[f] > 0) {
                    logProb += x[f] * Math.log(featureProbs[f] + 1e-10);
                }
            }
            
            logProbs.set(cls, logProb);
        }
        
        // Convert to probabilities using softmax
        const maxLogProb = Math.max(...logProbs.values());
        let sumExp = 0;
        
        for (const [cls, logProb] of logProbs) {
            sumExp += Math.exp(logProb - maxLogProb);
        }
        
        const probs = new Map();
        for (const [cls, logProb] of logProbs) {
            probs.set(cls, Math.exp(logProb - maxLogProb) / sumExp);
        }
        
        return probs;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT CLASSIFIER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * IntentClassifier - ML-based intent classification
 */
class IntentClassifier extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            confidenceThreshold: options.confidenceThreshold || 0.5,
            modelPath: options.modelPath || './models/intent_classifier.json',
            ...options
        };
        
        this.vectorizer = new FeatureVectorizer(options);
        this.classifier = new NaiveBayesClassifier(options);
        this.trainingData = [];
        this.trained = false;
        
        this.stats = {
            predictions: 0,
            correct: 0,
            trainingSamples: 0
        };
    }

    /**
     * Add training example
     */
    addExample(text, intent) {
        this.trainingData.push({ text, intent });
        return this;
    }

    /**
     * Add multiple examples
     */
    addExamples(examples) {
        for (const example of examples) {
            this.addExample(example.text, example.intent);
        }
        return this;
    }

    /**
     * Train model
     */
    train() {
        if (this.trainingData.length === 0) {
            throw new Error('No training data');
        }
        
        this.emit('train:start', { samples: this.trainingData.length });
        
        const texts = this.trainingData.map(d => d.text);
        const labels = this.trainingData.map(d => d.intent);
        
        // Vectorize
        const X = this.vectorizer.fitTransform(texts);
        
        // Train classifier
        this.classifier.train(X, labels);
        
        this.trained = true;
        this.stats.trainingSamples = this.trainingData.length;
        
        this.emit('train:complete', {
            samples: this.trainingData.length,
            classes: this.classifier.classes.length
        });
        
        return this;
    }

    /**
     * Classify text
     */
    classify(text) {
        if (!this.trained) {
            throw new Error('Classifier not trained');
        }
        
        this.stats.predictions++;
        
        const vector = this.vectorizer.transform(text);
        const probabilities = this.classifier.predictProbabilities(vector);
        
        // Get top predictions
        const sorted = Array.from(probabilities.entries())
            .sort((a, b) => b[1] - a[1]);
        
        const topIntent = sorted[0];
        const confidence = topIntent[1];
        
        const result = {
            text,
            intent: confidence >= this.options.confidenceThreshold ? topIntent[0] : 'unknown',
            confidence,
            alternatives: sorted.slice(1, 4).map(([intent, prob]) => ({ intent, probability: prob }))
        };
        
        this.emit('classified', result);
        
        return result;
    }

    /**
     * Evaluate model
     */
    evaluate(testData) {
        let correct = 0;
        const confusion = new Map();
        
        for (const { text, intent: expected } of testData) {
            const result = this.classify(text);
            
            if (result.intent === expected) {
                correct++;
            }
            
            // Update confusion matrix
            const key = `${expected}:${result.intent}`;
            confusion.set(key, (confusion.get(key) || 0) + 1);
        }
        
        const accuracy = correct / testData.length;
        
        return {
            accuracy,
            correct,
            total: testData.length,
            confusion: Object.fromEntries(confusion)
        };
    }

    /**
     * Save model
     */
    async save(modelPath) {
        const path_ = modelPath || this.options.modelPath;
        
        const data = {
            version: '1.0',
            vectorizer: this.vectorizer.toJSON(),
            classifier: {
                classes: this.classifier.classes,
                classPriors: Array.from(this.classifier.classPriors.entries()),
                featureProbabilities: Array.from(this.classifier.featureProbabilities.entries())
                    .map(([cls, probs]) => [cls, Array.from(probs)])
            },
            stats: this.stats,
            savedAt: new Date().toISOString()
        };
        
        const dir = path.dirname(path_);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(path_, JSON.stringify(data, null, 2));
        
        this.emit('saved', { path: path_ });
        
        return this;
    }

    /**
     * Load model
     */
    async load(modelPath) {
        const path_ = modelPath || this.options.modelPath;
        
        if (!fs.existsSync(path_)) {
            throw new Error(`Model not found: ${path_}`);
        }
        
        const data = JSON.parse(fs.readFileSync(path_, 'utf-8'));
        
        this.vectorizer = FeatureVectorizer.fromJSON(data.vectorizer);
        
        this.classifier.classes = data.classifier.classes;
        this.classifier.classPriors = new Map(data.classifier.classPriors);
        this.classifier.featureProbabilities = new Map(
            data.classifier.featureProbabilities.map(([cls, probs]) => [cls, new Float32Array(probs)])
        );
        this.classifier.trained = true;
        
        this.stats = data.stats;
        this.trained = true;
        
        this.emit('loaded', { path: path_ });
        
        return this;
    }

    /**
     * Get training data
     */
    getTrainingData() {
        return this.trainingData;
    }

    /**
     * Clear training data
     */
    clearTrainingData() {
        this.trainingData = [];
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT TRAINING DATA
// ═══════════════════════════════════════════════════════════════════════════════

const DefaultTrainingData = [
    // Click intents
    { text: 'click on the login button', intent: 'click' },
    { text: 'press the submit button', intent: 'click' },
    { text: 'tap the menu icon', intent: 'click' },
    { text: 'click the link', intent: 'click' },
    
    // Type intents
    { text: 'type hello in the input field', intent: 'type' },
    { text: 'enter username in the login field', intent: 'type' },
    { text: 'fill in the email address', intent: 'type' },
    { text: 'input the password', intent: 'type' },
    
    // Navigate intents
    { text: 'go to the homepage', intent: 'navigate' },
    { text: 'navigate to settings page', intent: 'navigate' },
    { text: 'open the dashboard', intent: 'navigate' },
    { text: 'visit the contact page', intent: 'navigate' },
    
    // Verify intents
    { text: 'verify the title contains welcome', intent: 'verify' },
    { text: 'check that the error message is visible', intent: 'verify' },
    { text: 'assert the button is enabled', intent: 'verify' },
    { text: 'confirm the text shows success', intent: 'verify' },
    
    // Wait intents
    { text: 'wait for the page to load', intent: 'wait' },
    { text: 'wait 5 seconds', intent: 'wait' },
    { text: 'wait until the spinner disappears', intent: 'wait' },
    
    // Select intents
    { text: 'select option A from dropdown', intent: 'select' },
    { text: 'choose the first item', intent: 'select' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultClassifier = null;

module.exports = {
    // Classes
    FeatureVectorizer,
    NaiveBayesClassifier,
    IntentClassifier,
    
    // Default data
    DefaultTrainingData,
    
    // Factory
    createIntentClassifier: (options = {}) => {
        const classifier = new IntentClassifier(options);
        classifier.addExamples(DefaultTrainingData);
        return classifier;
    },
    
    // Singleton
    getIntentClassifier: (options = {}) => {
        if (!defaultClassifier) {
            defaultClassifier = new IntentClassifier(options);
            defaultClassifier.addExamples(DefaultTrainingData);
        }
        return defaultClassifier;
    }
};

console.log('✅ Step 22/50: Intent Classifier loaded');
