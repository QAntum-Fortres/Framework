/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 13/50: Data Source Selector                        ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Intelligent data source prioritization and selection
 * @phase 1 - Enterprise Foundation
 * @step 13 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// DATA SOURCE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DataSource - Abstract data source
 */
class DataSource extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.name = options.name || 'unnamed';
        this.type = options.type || 'generic';
        this.priority = options.priority || 0;
        this.config = options.config || {};
        
        this.state = {
            connected: false,
            lastAccess: null,
            accessCount: 0,
            errors: 0,
            avgLatency: 0
        };
        
        this.metadata = {
            schema: null,
            rowCount: null,
            lastSync: null
        };
    }

    /**
     * Connect to source
     */
    async connect() {
        this.state.connected = true;
        this.emit('connected');
        return this;
    }

    /**
     * Disconnect
     */
    async disconnect() {
        this.state.connected = false;
        this.emit('disconnected');
        return this;
    }

    /**
     * Check if available
     */
    async isAvailable() {
        return this.state.connected;
    }

    /**
     * Read data
     */
    async read(query = {}) {
        throw new Error('Must implement read method');
    }

    /**
     * Write data
     */
    async write(data) {
        throw new Error('Must implement write method');
    }

    /**
     * Get schema
     */
    async getSchema() {
        return this.metadata.schema;
    }

    /**
     * Record access
     */
    _recordAccess(latency, success = true) {
        this.state.lastAccess = Date.now();
        this.state.accessCount++;
        
        if (!success) {
            this.state.errors++;
        }
        
        // Update average latency
        this.state.avgLatency = (this.state.avgLatency * (this.state.accessCount - 1) + latency) / this.state.accessCount;
    }

    /**
     * Get health score
     */
    getHealthScore() {
        if (this.state.accessCount === 0) return 1;
        
        const errorRate = this.state.errors / this.state.accessCount;
        const latencyScore = Math.max(0, 1 - (this.state.avgLatency / 5000)); // Penalize > 5s
        
        return (1 - errorRate) * latencyScore;
    }

    /**
     * Get source info
     */
    getInfo() {
        return {
            name: this.name,
            type: this.type,
            priority: this.priority,
            state: this.state,
            metadata: this.metadata,
            healthScore: this.getHealthScore()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIFIC DATA SOURCES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * FileDataSource - File-based data source
 */
class FileDataSource extends DataSource {
    constructor(options = {}) {
        super({ type: 'file', ...options });
        
        this.basePath = options.basePath || './data';
        this.format = options.format || 'json';
    }

    async read(query = {}) {
        const startTime = Date.now();
        
        try {
            const fs = require('fs');
            const path = require('path');
            
            const filePath = query.file ? 
                path.join(this.basePath, query.file) : 
                this.basePath;
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            
            const content = fs.readFileSync(filePath, 'utf8');
            let data;
            
            switch (this.format) {
                case 'json':
                    data = JSON.parse(content);
                    break;
                case 'csv':
                    data = this._parseCSV(content);
                    break;
                default:
                    data = content;
            }
            
            this._recordAccess(Date.now() - startTime, true);
            
            // Apply filters if any
            if (query.filter && Array.isArray(data)) {
                data = data.filter(item => {
                    for (const [key, value] of Object.entries(query.filter)) {
                        if (item[key] !== value) return false;
                    }
                    return true;
                });
            }
            
            return data;
            
        } catch (error) {
            this._recordAccess(Date.now() - startTime, false);
            throw error;
        }
    }

    async write(data, options = {}) {
        const fs = require('fs');
        const path = require('path');
        
        const filePath = options.file ? 
            path.join(this.basePath, options.file) : 
            path.join(this.basePath, `data_${Date.now()}.json`);
        
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        let content;
        switch (this.format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                break;
            case 'csv':
                content = this._toCSV(data);
                break;
            default:
                content = String(data);
        }
        
        fs.writeFileSync(filePath, content);
        return filePath;
    }

    _parseCSV(content) {
        const lines = content.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((h, i) => {
                const num = Number(values[i]);
                row[h] = isNaN(num) ? values[i] : num;
            });
            return row;
        });
    }

    _toCSV(data) {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const lines = [headers.join(',')];
        
        for (const row of data) {
            lines.push(headers.map(h => row[h]).join(','));
        }
        
        return lines.join('\n');
    }
}

/**
 * DatabaseDataSource - Database data source
 */
class DatabaseDataSource extends DataSource {
    constructor(options = {}) {
        super({ type: 'database', ...options });
        
        this.connectionString = options.connectionString;
        this.dbType = options.dbType || 'postgres';
    }

    async connect() {
        // Simulated connection
        this.state.connected = true;
        this.emit('connected');
        return this;
    }

    async read(query = {}) {
        const startTime = Date.now();
        
        // Simulated query
        const data = [
            { id: 1, name: 'Sample 1', value: 100 },
            { id: 2, name: 'Sample 2', value: 200 }
        ];
        
        this._recordAccess(Date.now() - startTime, true);
        
        return data;
    }

    async write(data) {
        // Simulated write
        return { inserted: Array.isArray(data) ? data.length : 1 };
    }

    async query(sql, params = []) {
        // Simulated SQL query
        return [];
    }
}

/**
 * APIDataSource - External API data source
 */
class APIDataSource extends DataSource {
    constructor(options = {}) {
        super({ type: 'api', ...options });
        
        this.baseUrl = options.baseUrl;
        this.headers = options.headers || {};
        this.auth = options.auth;
    }

    async read(query = {}) {
        const startTime = Date.now();
        
        try {
            // Simulated API call
            const data = {
                source: 'api',
                endpoint: query.endpoint || '/',
                data: [{ sample: true }]
            };
            
            this._recordAccess(Date.now() - startTime, true);
            
            return data;
            
        } catch (error) {
            this._recordAccess(Date.now() - startTime, false);
            throw error;
        }
    }

    async write(data, options = {}) {
        // Simulated POST
        return { success: true };
    }
}

/**
 * StreamDataSource - Streaming data source
 */
class StreamDataSource extends DataSource {
    constructor(options = {}) {
        super({ type: 'stream', ...options });
        
        this.bufferSize = options.bufferSize || 1000;
        this.buffer = [];
    }

    async *read(query = {}) {
        // Simulated stream
        for (let i = 0; i < 10; i++) {
            yield { index: i, timestamp: Date.now(), data: `item-${i}` };
        }
    }

    async push(item) {
        this.buffer.push(item);
        
        if (this.buffer.length >= this.bufferSize) {
            const data = this.buffer.splice(0, this.bufferSize);
            this.emit('batch', data);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA SOURCE SELECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DataSourceSelector - Intelligent source selection
 */
class DataSourceSelector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            strategy: options.strategy || 'priority',
            fallbackEnabled: options.fallbackEnabled !== false,
            healthThreshold: options.healthThreshold || 0.5,
            ...options
        };
        
        this.sources = new Map();
        this.history = [];
        this.maxHistory = 100;
    }

    /**
     * Register data source
     */
    register(name, source, priority = 0) {
        if (!(source instanceof DataSource)) {
            // Create from config
            source = this._createSource(source);
        }
        
        source.name = name;
        source.priority = priority;
        
        this.sources.set(name, source);
        
        this.emit('source:registered', { name, type: source.type });
        
        return this;
    }

    /**
     * Create source from config
     */
    _createSource(config) {
        const types = {
            file: FileDataSource,
            database: DatabaseDataSource,
            api: APIDataSource,
            stream: StreamDataSource
        };
        
        const SourceClass = types[config.type] || DataSource;
        return new SourceClass(config);
    }

    /**
     * Select best source
     */
    selectSource(requirements = {}) {
        const candidates = this._getCandidates(requirements);
        
        if (candidates.length === 0) {
            throw new Error('No suitable data source found');
        }
        
        let selected;
        
        switch (this.options.strategy) {
            case 'priority':
                selected = this._selectByPriority(candidates);
                break;
            case 'health':
                selected = this._selectByHealth(candidates);
                break;
            case 'latency':
                selected = this._selectByLatency(candidates);
                break;
            case 'round-robin':
                selected = this._selectRoundRobin(candidates);
                break;
            default:
                selected = candidates[0];
        }
        
        this._recordSelection(selected.name, requirements);
        
        return selected;
    }

    /**
     * Get candidate sources
     */
    _getCandidates(requirements) {
        const candidates = [];
        
        for (const source of this.sources.values()) {
            // Check health
            if (source.getHealthScore() < this.options.healthThreshold) {
                continue;
            }
            
            // Check type requirement
            if (requirements.type && source.type !== requirements.type) {
                continue;
            }
            
            // Check availability
            if (requirements.available && !source.state.connected) {
                continue;
            }
            
            candidates.push(source);
        }
        
        return candidates;
    }

    /**
     * Select by priority
     */
    _selectByPriority(candidates) {
        return candidates.sort((a, b) => b.priority - a.priority)[0];
    }

    /**
     * Select by health
     */
    _selectByHealth(candidates) {
        return candidates.sort((a, b) => b.getHealthScore() - a.getHealthScore())[0];
    }

    /**
     * Select by latency
     */
    _selectByLatency(candidates) {
        return candidates.sort((a, b) => 
            (a.state.avgLatency || 0) - (b.state.avgLatency || 0)
        )[0];
    }

    /**
     * Select round-robin
     */
    _selectRoundRobin(candidates) {
        const lastSelection = this.history[this.history.length - 1];
        
        if (!lastSelection) {
            return candidates[0];
        }
        
        const lastIndex = candidates.findIndex(c => c.name === lastSelection.source);
        return candidates[(lastIndex + 1) % candidates.length];
    }

    /**
     * Record selection
     */
    _recordSelection(sourceName, requirements) {
        this.history.push({
            source: sourceName,
            requirements,
            timestamp: Date.now()
        });
        
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(-this.maxHistory);
        }
        
        this.emit('source:selected', { source: sourceName });
    }

    /**
     * Read from best source
     */
    async read(query = {}, requirements = {}) {
        const source = this.selectSource(requirements);
        
        try {
            return await source.read(query);
        } catch (error) {
            if (this.options.fallbackEnabled) {
                return this._fallbackRead(query, requirements, source.name);
            }
            throw error;
        }
    }

    /**
     * Fallback read
     */
    async _fallbackRead(query, requirements, failedSource) {
        const candidates = this._getCandidates(requirements)
            .filter(s => s.name !== failedSource);
        
        for (const source of candidates) {
            try {
                this.emit('fallback', { from: failedSource, to: source.name });
                return await source.read(query);
            } catch (error) {
                continue;
            }
        }
        
        throw new Error('All sources failed');
    }

    /**
     * Get source
     */
    getSource(name) {
        return this.sources.get(name);
    }

    /**
     * List sources
     */
    listSources() {
        return Array.from(this.sources.values()).map(s => s.getInfo());
    }

    /**
     * Get stats
     */
    getStats() {
        const sourceStats = {};
        
        for (const [name, source] of this.sources) {
            sourceStats[name] = {
                ...source.state,
                healthScore: source.getHealthScore()
            };
        }
        
        // Selection frequency
        const selectionCounts = {};
        for (const record of this.history) {
            selectionCounts[record.source] = (selectionCounts[record.source] || 0) + 1;
        }
        
        return {
            sources: sourceStats,
            selections: selectionCounts,
            totalSelections: this.history.length
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let selectorInstance = null;

module.exports = {
    // Sources
    DataSource,
    FileDataSource,
    DatabaseDataSource,
    APIDataSource,
    StreamDataSource,
    
    // Selector
    DataSourceSelector,
    
    // Singleton getter
    getSelector: () => {
        if (!selectorInstance) {
            selectorInstance = new DataSourceSelector();
        }
        return selectorInstance;
    },
    
    // Factory
    createSource: (type, options) => {
        const sources = {
            file: FileDataSource,
            database: DatabaseDataSource,
            api: APIDataSource,
            stream: StreamDataSource
        };
        
        const SourceClass = sources[type] || DataSource;
        return new SourceClass(options);
    }
};

console.log('✅ Step 13/50: Data Source Selector loaded');
