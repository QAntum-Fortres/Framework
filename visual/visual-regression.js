/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 24/50: Visual Regression Engine                    ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Visual comparison and regression testing
 * @phase 2 - Autonomous Intelligence
 * @step 24 of 50
 */

'use strict';

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL COMPARISON TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ComparisonMode - How to compare images
 */
const ComparisonMode = {
    PIXEL_BY_PIXEL: 'pixel',
    STRUCTURAL: 'structural',
    PERCEPTUAL: 'perceptual',
    ANTI_ALIASING: 'anti_aliasing'
};

/**
 * DiffResult - Comparison result
 */
const DiffResult = {
    IDENTICAL: 'identical',
    SIMILAR: 'similar',
    DIFFERENT: 'different',
    ERROR: 'error'
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE COMPARATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ImageComparator - Core comparison logic
 */
class ImageComparator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            threshold: options.threshold || 0.1,
            antiAliasing: options.antiAliasing !== false,
            ignoreColors: options.ignoreColors || false,
            alpha: options.alpha || 0.1,
            diffColor: options.diffColor || { r: 255, g: 0, b: 255 },
            ...options
        };
    }

    /**
     * Compare two image buffers
     */
    async compare(baseline, current, options = {}) {
        const opts = { ...this.options, ...options };
        
        try {
            // Parse images (simplified - in real impl would use sharp/jimp)
            const baselineData = this._parseImage(baseline);
            const currentData = this._parseImage(current);
            
            // Check dimensions
            if (baselineData.width !== currentData.width || 
                baselineData.height !== currentData.height) {
                return {
                    result: DiffResult.DIFFERENT,
                    diffPercentage: 100,
                    reason: 'Size mismatch',
                    baseline: { width: baselineData.width, height: baselineData.height },
                    current: { width: currentData.width, height: currentData.height }
                };
            }
            
            // Compare pixels
            const comparison = this._comparePixels(baselineData, currentData, opts);
            
            // Determine result
            let result;
            if (comparison.diffPercentage === 0) {
                result = DiffResult.IDENTICAL;
            } else if (comparison.diffPercentage <= opts.threshold * 100) {
                result = DiffResult.SIMILAR;
            } else {
                result = DiffResult.DIFFERENT;
            }
            
            return {
                result,
                diffPercentage: comparison.diffPercentage,
                diffPixels: comparison.diffPixels,
                totalPixels: comparison.totalPixels,
                diffImage: comparison.diffImage,
                dimensions: { width: baselineData.width, height: baselineData.height }
            };
        } catch (error) {
            return {
                result: DiffResult.ERROR,
                error: error.message
            };
        }
    }

    /**
     * Parse image (simplified)
     */
    _parseImage(imageData) {
        // Simplified - returns mock data
        // Real implementation would use image parsing library
        return {
            width: imageData.width || 800,
            height: imageData.height || 600,
            pixels: imageData.pixels || new Uint8Array(800 * 600 * 4)
        };
    }

    /**
     * Compare pixels
     */
    _comparePixels(baseline, current, options) {
        const width = baseline.width;
        const height = baseline.height;
        const totalPixels = width * height;
        
        let diffPixels = 0;
        const diffImage = new Uint8Array(totalPixels * 4);
        
        for (let i = 0; i < totalPixels; i++) {
            const idx = i * 4;
            
            const br = baseline.pixels[idx] || 0;
            const bg = baseline.pixels[idx + 1] || 0;
            const bb = baseline.pixels[idx + 2] || 0;
            const ba = baseline.pixels[idx + 3] || 255;
            
            const cr = current.pixels[idx] || 0;
            const cg = current.pixels[idx + 1] || 0;
            const cb = current.pixels[idx + 2] || 0;
            const ca = current.pixels[idx + 3] || 255;
            
            // Calculate color distance
            const distance = this._colorDistance(
                { r: br, g: bg, b: bb, a: ba },
                { r: cr, g: cg, b: cb, a: ca },
                options
            );
            
            const isDiff = distance > options.threshold;
            
            if (isDiff) {
                diffPixels++;
                
                // Mark as diff
                diffImage[idx] = options.diffColor.r;
                diffImage[idx + 1] = options.diffColor.g;
                diffImage[idx + 2] = options.diffColor.b;
                diffImage[idx + 3] = 255;
            } else {
                // Copy original with reduced alpha
                diffImage[idx] = cr;
                diffImage[idx + 1] = cg;
                diffImage[idx + 2] = cb;
                diffImage[idx + 3] = Math.floor(ca * options.alpha);
            }
        }
        
        return {
            diffPixels,
            totalPixels,
            diffPercentage: (diffPixels / totalPixels) * 100,
            diffImage
        };
    }

    /**
     * Calculate color distance
     */
    _colorDistance(c1, c2, options) {
        if (options.ignoreColors) {
            // Grayscale comparison
            const gray1 = (c1.r * 0.299 + c1.g * 0.587 + c1.b * 0.114);
            const gray2 = (c2.r * 0.299 + c2.g * 0.587 + c2.b * 0.114);
            return Math.abs(gray1 - gray2) / 255;
        }
        
        // RGB Euclidean distance
        const dr = c1.r - c2.r;
        const dg = c1.g - c2.g;
        const db = c1.b - c2.b;
        const da = c1.a - c2.a;
        
        return Math.sqrt(dr*dr + dg*dg + db*db + da*da) / 510; // Normalize to 0-1
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASELINE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * BaselineManager - Manage baseline images
 */
class BaselineManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            baselineDir: options.baselineDir || './visual-baselines',
            currentDir: options.currentDir || './visual-current',
            diffDir: options.diffDir || './visual-diffs',
            ...options
        };
        
        this._ensureDirs();
    }

    /**
     * Ensure directories exist
     */
    _ensureDirs() {
        for (const dir of [this.options.baselineDir, this.options.currentDir, this.options.diffDir]) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    /**
     * Generate screenshot name
     */
    generateName(testName, suffix = '') {
        const sanitized = testName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        return `${sanitized}${suffix ? '_' + suffix : ''}.png`;
    }

    /**
     * Get baseline path
     */
    getBaselinePath(name) {
        return path.join(this.options.baselineDir, name);
    }

    /**
     * Get current path
     */
    getCurrentPath(name) {
        return path.join(this.options.currentDir, name);
    }

    /**
     * Get diff path
     */
    getDiffPath(name) {
        return path.join(this.options.diffDir, name);
    }

    /**
     * Save baseline
     */
    async saveBaseline(name, imageData) {
        const filePath = this.getBaselinePath(name);
        fs.writeFileSync(filePath, imageData);
        
        this.emit('baseline:saved', { name, path: filePath });
        
        return filePath;
    }

    /**
     * Save current
     */
    async saveCurrent(name, imageData) {
        const filePath = this.getCurrentPath(name);
        fs.writeFileSync(filePath, imageData);
        
        return filePath;
    }

    /**
     * Save diff
     */
    async saveDiff(name, diffData) {
        const filePath = this.getDiffPath(name);
        fs.writeFileSync(filePath, diffData);
        
        return filePath;
    }

    /**
     * Load baseline
     */
    async loadBaseline(name) {
        const filePath = this.getBaselinePath(name);
        
        if (!fs.existsSync(filePath)) {
            return null;
        }
        
        return fs.readFileSync(filePath);
    }

    /**
     * Has baseline
     */
    hasBaseline(name) {
        return fs.existsSync(this.getBaselinePath(name));
    }

    /**
     * Update baseline
     */
    async updateBaseline(name) {
        const currentPath = this.getCurrentPath(name);
        const baselinePath = this.getBaselinePath(name);
        
        if (fs.existsSync(currentPath)) {
            fs.copyFileSync(currentPath, baselinePath);
            this.emit('baseline:updated', { name });
            return true;
        }
        
        return false;
    }

    /**
     * List baselines
     */
    listBaselines() {
        if (!fs.existsSync(this.options.baselineDir)) {
            return [];
        }
        
        return fs.readdirSync(this.options.baselineDir)
            .filter(f => f.endsWith('.png'));
    }

    /**
     * Delete baseline
     */
    deleteBaseline(name) {
        const filePath = this.getBaselinePath(name);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL REGRESSION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * VisualRegressionEngine - Complete visual testing
 */
class VisualRegressionEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            autoUpdate: options.autoUpdate || false,
            threshold: options.threshold || 0.01,
            ...options
        };
        
        this.comparator = new ImageComparator(options);
        this.baselineManager = new BaselineManager(options);
        
        this.results = [];
        this.stats = {
            total: 0,
            passed: 0,
            failed: 0,
            new: 0,
            updated: 0
        };
    }

    /**
     * Check visual regression
     */
    async check(testName, screenshot, options = {}) {
        const name = this.baselineManager.generateName(testName);
        this.stats.total++;
        
        this.emit('check:start', { name, testName });
        
        // Save current screenshot
        await this.baselineManager.saveCurrent(name, screenshot);
        
        // Check if baseline exists
        if (!this.baselineManager.hasBaseline(name)) {
            // First run - save as baseline
            await this.baselineManager.saveBaseline(name, screenshot);
            this.stats.new++;
            
            const result = {
                name,
                testName,
                status: 'new',
                message: 'Baseline created'
            };
            
            this.results.push(result);
            this.emit('check:new', result);
            
            return result;
        }
        
        // Load baseline and compare
        const baseline = await this.baselineManager.loadBaseline(name);
        const comparison = await this.comparator.compare(
            { pixels: baseline },
            { pixels: screenshot },
            { threshold: options.threshold || this.options.threshold }
        );
        
        const result = {
            name,
            testName,
            status: comparison.result === DiffResult.IDENTICAL || 
                    comparison.result === DiffResult.SIMILAR ? 'passed' : 'failed',
            comparison,
            diffPercentage: comparison.diffPercentage
        };
        
        if (result.status === 'passed') {
            this.stats.passed++;
        } else {
            this.stats.failed++;
            
            // Save diff image
            if (comparison.diffImage) {
                await this.baselineManager.saveDiff(name, Buffer.from(comparison.diffImage));
            }
            
            // Auto-update if enabled
            if (this.options.autoUpdate) {
                await this.baselineManager.updateBaseline(name);
                result.status = 'updated';
                this.stats.updated++;
            }
        }
        
        this.results.push(result);
        this.emit('check:complete', result);
        
        return result;
    }

    /**
     * Batch check
     */
    async checkMany(screenshots) {
        const results = [];
        
        for (const { name, screenshot, options } of screenshots) {
            const result = await this.check(name, screenshot, options);
            results.push(result);
        }
        
        return results;
    }

    /**
     * Update baseline
     */
    async updateBaseline(testName) {
        const name = this.baselineManager.generateName(testName);
        return this.baselineManager.updateBaseline(name);
    }

    /**
     * Update all failing baselines
     */
    async updateAllFailing() {
        const failing = this.results.filter(r => r.status === 'failed');
        
        for (const result of failing) {
            await this.baselineManager.updateBaseline(result.name);
            result.status = 'updated';
            this.stats.updated++;
        }
        
        return failing.length;
    }

    /**
     * Get results
     */
    getResults() {
        return this.results;
    }

    /**
     * Get stats
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Generate report
     */
    generateReport() {
        return {
            timestamp: new Date().toISOString(),
            stats: this.getStats(),
            results: this.results.map(r => ({
                name: r.name,
                testName: r.testName,
                status: r.status,
                diffPercentage: r.diffPercentage?.toFixed(2)
            })),
            summary: {
                passRate: this.stats.total > 0 ? 
                    (this.stats.passed / this.stats.total * 100).toFixed(1) + '%' : 'N/A'
            }
        };
    }

    /**
     * Clear results
     */
    clearResults() {
        this.results = [];
        this.stats = {
            total: 0,
            passed: 0,
            failed: 0,
            new: 0,
            updated: 0
        };
        return this;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREENSHOT CAPTURE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ScreenshotCapture - Screenshot utilities
 */
class ScreenshotCapture {
    constructor(driver, options = {}) {
        this.driver = driver;
        this.options = options;
    }

    /**
     * Capture full page
     */
    async captureFullPage() {
        if (this.driver.screenshot) {
            return this.driver.screenshot({ fullPage: true });
        }
        return null;
    }

    /**
     * Capture viewport
     */
    async captureViewport() {
        if (this.driver.screenshot) {
            return this.driver.screenshot();
        }
        return null;
    }

    /**
     * Capture element
     */
    async captureElement(selector) {
        if (this.driver.locator) {
            const element = await this.driver.locator(selector);
            return element.screenshot();
        }
        return null;
    }

    /**
     * Capture with options
     */
    async capture(options = {}) {
        const screenshotOptions = {
            fullPage: options.fullPage || false,
            clip: options.clip,
            quality: options.quality || 80,
            type: options.type || 'png'
        };
        
        if (this.driver.screenshot) {
            return this.driver.screenshot(screenshotOptions);
        }
        
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine = null;

module.exports = {
    // Classes
    ImageComparator,
    BaselineManager,
    VisualRegressionEngine,
    ScreenshotCapture,
    
    // Types
    ComparisonMode,
    DiffResult,
    
    // Factory
    createVisualEngine: (options = {}) => new VisualRegressionEngine(options),
    createComparator: (options = {}) => new ImageComparator(options),
    
    // Singleton
    getVisualEngine: (options = {}) => {
        if (!defaultEngine) {
            defaultEngine = new VisualRegressionEngine(options);
        }
        return defaultEngine;
    }
};

console.log('✅ Step 24/50: Visual Regression Engine loaded');
