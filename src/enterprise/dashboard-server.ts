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

import { EventEmitter } from 'events';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎛️ THE INTEGRATED DASHBOARD - Real-time Sovereign Control Center
// ═══════════════════════════════════════════════════════════════════════════════
// Live streaming dashboard for QAntum at http://localhost:3847
// Visualizes: CPU temperature, Docker status, Bulgarian activity logs
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Dashboard configuration
 */
export interface DashboardConfig {
    /** Server port */
    port: number;
    /** Host to bind */
    host: string;
    /** Update interval (ms) */
    updateInterval: number;
    /** Max log entries to keep */
    maxLogEntries: number;
    /** Enable authentication */
    requireAuth: boolean;
    /** Auth token (if enabled) */
    authToken?: string;
}

/**
 * System telemetry data
 */
export interface TelemetryData {
    timestamp: number;
    cpu: {
        temperature: number;
        usage: number;
        cores: number;
        model: string;
        perCore: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
        percent: number;
    };
    system: {
        platform: string;
        uptime: number;
        hostname: string;
    };
}

/**
 * Docker container info
 */
export interface ContainerInfo {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'exited' | 'unknown';
    image: string;
    ports: string[];
    health: 'healthy' | 'unhealthy' | 'starting' | 'none';
    cpuPercent: number;
    memoryUsage: string;
}

/**
 * Activity log entry
 */
export interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'success' | 'warning' | 'error' | 'debug';
    message: string;
    source: string;
    details?: Record<string, unknown>;
}

/**
 * Dashboard state
 */
export interface DashboardState {
    telemetry: TelemetryData;
    containers: ContainerInfo[];
    logs: LogEntry[];
    swarm: {
        activeSoldiers: number;
        queueLength: number;
        completedTasks: number;
        thermalState: string;
    };
    tests: {
        running: boolean;
        passed: number;
        failed: number;
        current: string;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎛️ DASHBOARD SERVER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class DashboardServer extends EventEmitter {
    private config: DashboardConfig;
    private server: http.Server | null = null;
    private wss: WebSocketServer | null = null;
    private clients: Set<WebSocket> = new Set();
    private updateInterval: NodeJS.Timeout | null = null;
    private state: DashboardState;
    private logIdCounter: number = 1;
    private lastCpuInfo: os.CpuInfo[] = [];
    private temperatureHistory: number[] = [];
    private usageHistory: number[] = [];
    
    constructor(config?: Partial<DashboardConfig>) {
        super();
        
        this.config = {
            port: config?.port || 3847,
            host: config?.host || 'localhost',
            updateInterval: config?.updateInterval || 1000,
            maxLogEntries: config?.maxLogEntries || 500,
            requireAuth: config?.requireAuth ?? false,
            authToken: config?.authToken
        };
        
        this.state = this.initializeState();
        this.lastCpuInfo = os.cpus();
    }
    
    /**
     * Initialize empty state
     */
    private initializeState(): DashboardState {
        return {
            telemetry: {
                timestamp: Date.now(),
                cpu: {
                    temperature: 50,
                    usage: 0,
                    cores: os.cpus().length,
                    model: os.cpus()[0]?.model || 'Unknown',
                    perCore: []
                },
                memory: {
                    total: os.totalmem(),
                    used: 0,
                    free: os.freemem(),
                    percent: 0
                },
                system: {
                    platform: os.platform(),
                    uptime: os.uptime(),
                    hostname: os.hostname()
                }
            },
            containers: [],
            logs: [],
            swarm: {
                activeSoldiers: 0,
                queueLength: 0,
                completedTasks: 0,
                thermalState: 'cool'
            },
            tests: {
                running: false,
                passed: 0,
                failed: 0,
                current: ''
            }
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🚀 SERVER LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Start the dashboard server
     */
    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Create HTTP server
            this.server = http.createServer((req, res) => {
                this.handleHttpRequest(req, res);
            });
            
            // Create WebSocket server
            this.wss = new WebSocketServer({ server: this.server });
            
            this.wss.on('connection', (ws, req) => {
                this.handleWebSocketConnection(ws, req);
            });
            
            // Start listening
            this.server.listen(this.config.port, this.config.host, () => {
                this.log('info', `🎛️ Dashboard активен на http://${this.config.host}:${this.config.port}`, 'Dashboard');
                
                // Start update loop
                this.startUpdateLoop();
                
                this.emit('started', { url: `http://${this.config.host}:${this.config.port}` });
                resolve();
            });
            
            this.server.on('error', reject);
        });
    }
    
    /**
     * Stop the dashboard server
     */
    async stop(): Promise<void> {
        // Stop update loop
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Close all WebSocket connections
        for (const client of this.clients) {
            client.close();
        }
        this.clients.clear();
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
        
        // Close HTTP server
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    this.server = null;
                    this.emit('stopped');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🌐 HTTP REQUEST HANDLING
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Handle HTTP requests
     */
    private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
        const url = req.url || '/';
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        
        // Route handling
        if (url === '/' || url === '/index.html') {
            this.serveHtml(res);
        } else if (url === '/api/state') {
            this.serveJson(res, this.state);
        } else if (url === '/api/telemetry') {
            this.serveJson(res, this.state.telemetry);
        } else if (url === '/api/logs') {
            this.serveJson(res, this.state.logs);
        } else if (url === '/api/containers') {
            this.serveJson(res, this.state.containers);
        } else if (url === '/api/history') {
            this.serveJson(res, {
                temperature: this.temperatureHistory,
                usage: this.usageHistory
            });
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }
    
    /**
     * Serve JSON response
     */
    private serveJson(res: http.ServerResponse, data: unknown): void {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(data));
    }
    
    /**
     * Serve HTML dashboard
     */
    private serveHtml(res: http.ServerResponse): void {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.writeHead(200);
        res.end(this.generateDashboardHtml());
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔌 WEBSOCKET HANDLING
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Handle WebSocket connection
     */
    private handleWebSocketConnection(ws: WebSocket, req: http.IncomingMessage): void {
        // Authentication check
        if (this.config.requireAuth) {
            const url = new URL(req.url || '/', `http://${req.headers.host}`);
            const token = url.searchParams.get('token');
            
            if (token !== this.config.authToken) {
                ws.close(4001, 'Unauthorized');
                return;
            }
        }
        
        this.clients.add(ws);
        this.log('debug', 'Нов клиент се свърза с Dashboard', 'WebSocket');
        
        // Send initial state
        ws.send(JSON.stringify({ type: 'init', data: this.state }));
        
        ws.on('close', () => {
            this.clients.delete(ws);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleClientMessage(ws, message);
            } catch {
                // Invalid JSON
            }
        });
    }
    
    /**
     * Handle client message
     */
    private handleClientMessage(ws: WebSocket, message: { type: string; data?: unknown }): void {
        switch (message.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            case 'getState':
                ws.send(JSON.stringify({ type: 'state', data: this.state }));
                break;
            case 'getLogs':
                ws.send(JSON.stringify({ type: 'logs', data: this.state.logs }));
                break;
        }
    }
    
    /**
     * Broadcast to all clients
     */
    private broadcast(type: string, data: unknown): void {
        const message = JSON.stringify({ type, data, timestamp: Date.now() });
        
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 TELEMETRY UPDATES
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Start the update loop
     */
    private startUpdateLoop(): void {
        this.updateInterval = setInterval(() => {
            this.updateTelemetry();
            this.broadcast('telemetry', this.state.telemetry);
        }, this.config.updateInterval);
    }
    
    /**
     * Update telemetry data
     */
    private updateTelemetry(): void {
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        
        // Calculate per-core usage
        const perCore: number[] = cpus.map((cpu, i) => {
            const prev = this.lastCpuInfo[i];
            if (!prev) return 0;
            
            const prevTotal = prev.times.user + prev.times.nice + prev.times.sys + prev.times.idle;
            const currTotal = cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle;
            const totalDiff = currTotal - prevTotal;
            const idleDiff = cpu.times.idle - prev.times.idle;
            
            return totalDiff > 0 ? Math.round(((totalDiff - idleDiff) / totalDiff) * 100) : 0;
        });
        
        const avgUsage = perCore.length > 0 
            ? perCore.reduce((a, b) => a + b, 0) / perCore.length 
            : 0;
        
        // Estimate temperature (Ryzen 7 7435HS typical range: 45-95°C)
        const baseTemp = 45;
        const loadTemp = (avgUsage / 100) * 50;
        const estimatedTemp = Math.round((baseTemp + loadTemp) * 10) / 10;
        
        // Update state
        this.state.telemetry = {
            timestamp: Date.now(),
            cpu: {
                temperature: estimatedTemp,
                usage: Math.round(avgUsage * 10) / 10,
                cores: cpus.length,
                model: cpus[0]?.model || 'AMD Ryzen 7 7435HS',
                perCore
            },
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                percent: Math.round((usedMem / totalMem) * 1000) / 10
            },
            system: {
                platform: os.platform(),
                uptime: os.uptime(),
                hostname: os.hostname()
            }
        };
        
        // Update history (keep last 60 points)
        this.temperatureHistory.push(estimatedTemp);
        this.usageHistory.push(avgUsage);
        if (this.temperatureHistory.length > 60) this.temperatureHistory.shift();
        if (this.usageHistory.length > 60) this.usageHistory.shift();
        
        this.lastCpuInfo = cpus;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📝 LOGGING
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Add log entry
     */
    log(level: LogEntry['level'], message: string, source: string, details?: Record<string, unknown>): void {
        const entry: LogEntry = {
            id: `log_${this.logIdCounter++}`,
            timestamp: Date.now(),
            level,
            message,
            source,
            details
        };
        
        this.state.logs.unshift(entry);
        
        // Trim logs
        if (this.state.logs.length > this.config.maxLogEntries) {
            this.state.logs = this.state.logs.slice(0, this.config.maxLogEntries);
        }
        
        // Broadcast to clients
        this.broadcast('log', entry);
        
        this.emit('log', entry);
    }
    
    /**
     * Log Bulgarian activity messages
     */
    logActivity(message: string, source: string = 'Agent'): void {
        this.log('info', message, source);
    }
    
    /**
     * Log success
     */
    logSuccess(message: string, source: string = 'Agent'): void {
        this.log('success', message, source);
    }
    
    /**
     * Log warning
     */
    logWarning(message: string, source: string = 'Agent'): void {
        this.log('warning', message, source);
    }
    
    /**
     * Log error
     */
    logError(message: string, source: string = 'Agent'): void {
        this.log('error', message, source);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🐳 CONTAINER STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Update container status
     */
    updateContainers(containers: ContainerInfo[]): void {
        this.state.containers = containers;
        this.broadcast('containers', containers);
    }
    
    /**
     * Add container
     */
    addContainer(container: ContainerInfo): void {
        const existing = this.state.containers.findIndex(c => c.id === container.id);
        if (existing >= 0) {
            this.state.containers[existing] = container;
        } else {
            this.state.containers.push(container);
        }
        this.broadcast('containers', this.state.containers);
    }
    
    /**
     * Remove container
     */
    removeContainer(containerId: string): void {
        this.state.containers = this.state.containers.filter(c => c.id !== containerId);
        this.broadcast('containers', this.state.containers);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎖️ SWARM STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Update swarm status
     */
    updateSwarm(swarmState: DashboardState['swarm']): void {
        this.state.swarm = swarmState;
        this.broadcast('swarm', swarmState);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🧪 TEST STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Update test status
     */
    updateTests(testState: DashboardState['tests']): void {
        this.state.tests = testState;
        this.broadcast('tests', testState);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎨 HTML GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Generate dashboard HTML
     */
    private generateDashboardHtml(): string {
        return `<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QAntum Dashboard - Sovereign Control Center</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --bg-primary: #0a0a0f;
            --bg-secondary: #12121a;
            --bg-card: #1a1a25;
            --text-primary: #e0e0e0;
            --text-secondary: #888;
            --accent: #00d4ff;
            --accent-glow: rgba(0, 212, 255, 0.3);
            --success: #00ff88;
            --warning: #ffaa00;
            --error: #ff4444;
            --border: rgba(255, 255, 255, 0.1);
        }
        
        body {
            font-family: 'Segoe UI', system-ui, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
            padding: 20px 30px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--accent), #0066ff);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .logo-text h1 {
            font-size: 24px;
            font-weight: 600;
            background: linear-gradient(90deg, var(--accent), #fff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .logo-text span {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: var(--bg-card);
            border-radius: 20px;
            border: 1px solid var(--border);
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--success);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .container {
            padding: 20px 30px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: auto 1fr;
            gap: 20px;
            max-width: 1800px;
            margin: 0 auto;
        }
        
        .card {
            background: var(--bg-card);
            border-radius: 16px;
            border: 1px solid var(--border);
            overflow: hidden;
        }
        
        .card-header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .card-title {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-secondary);
        }
        
        .card-body {
            padding: 20px;
        }
        
        /* Temperature Card */
        .temp-card { grid-column: span 2; }
        
        .temp-display {
            display: flex;
            align-items: flex-end;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .temp-value {
            font-size: 64px;
            font-weight: 300;
            line-height: 1;
        }
        
        .temp-value.cool { color: var(--success); }
        .temp-value.warm { color: var(--warning); }
        .temp-value.hot { color: var(--error); }
        
        .temp-unit {
            font-size: 24px;
            color: var(--text-secondary);
            margin-bottom: 10px;
        }
        
        .temp-label {
            font-size: 14px;
            color: var(--text-secondary);
            margin-bottom: 4px;
        }
        
        .temp-model {
            font-size: 12px;
            color: var(--accent);
        }
        
        .graph-container {
            height: 150px;
            position: relative;
            background: var(--bg-secondary);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .graph-canvas {
            width: 100%;
            height: 100%;
        }
        
        /* System Card */
        .system-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        
        .metric {
            padding: 15px;
            background: var(--bg-secondary);
            border-radius: 8px;
        }
        
        .metric-label {
            font-size: 11px;
            color: var(--text-secondary);
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: 600;
        }
        
        .metric-sub {
            font-size: 11px;
            color: var(--text-secondary);
        }
        
        /* Docker Card */
        .docker-card { grid-column: span 1; grid-row: span 2; }
        
        .container-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .container-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: var(--bg-secondary);
            border-radius: 8px;
        }
        
        .container-status {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        
        .container-status.running { background: var(--success); }
        .container-status.stopped { background: var(--error); }
        .container-status.unknown { background: var(--text-secondary); }
        
        .container-info {
            flex: 1;
        }
        
        .container-name {
            font-weight: 500;
            font-size: 14px;
        }
        
        .container-image {
            font-size: 11px;
            color: var(--text-secondary);
        }
        
        .container-stats {
            text-align: right;
            font-size: 11px;
            color: var(--text-secondary);
        }
        
        .no-containers {
            text-align: center;
            padding: 40px;
            color: var(--text-secondary);
        }
        
        /* Log Card */
        .log-card { grid-column: span 2; }
        
        .log-container {
            height: 350px;
            overflow-y: auto;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
        }
        
        .log-entry {
            padding: 8px 12px;
            border-bottom: 1px solid var(--border);
            display: flex;
            gap: 12px;
        }
        
        .log-entry:hover {
            background: var(--bg-secondary);
        }
        
        .log-time {
            color: var(--text-secondary);
            white-space: nowrap;
        }
        
        .log-level {
            width: 70px;
            text-transform: uppercase;
            font-weight: 600;
            font-size: 10px;
        }
        
        .log-level.info { color: var(--accent); }
        .log-level.success { color: var(--success); }
        .log-level.warning { color: var(--warning); }
        .log-level.error { color: var(--error); }
        .log-level.debug { color: var(--text-secondary); }
        
        .log-source {
            color: var(--accent);
            white-space: nowrap;
        }
        
        .log-message {
            flex: 1;
            word-break: break-word;
        }
        
        /* Swarm Card */
        .swarm-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        
        .swarm-stat {
            padding: 15px;
            background: var(--bg-secondary);
            border-radius: 8px;
            text-align: center;
        }
        
        .swarm-stat-value {
            font-size: 28px;
            font-weight: 600;
            color: var(--accent);
        }
        
        .swarm-stat-label {
            font-size: 11px;
            color: var(--text-secondary);
            text-transform: uppercase;
        }
        
        .thermal-indicator {
            margin-top: 15px;
            padding: 10px 15px;
            background: var(--bg-secondary);
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .thermal-state {
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .thermal-state.cool { color: var(--success); }
        .thermal-state.warm { color: var(--warning); }
        .thermal-state.hot, .thermal-state.critical { color: var(--error); }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 20px;
            color: var(--text-secondary);
            font-size: 12px;
            border-top: 1px solid var(--border);
        }
        
        .footer a {
            color: var(--accent);
            text-decoration: none;
        }
        
        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--bg-secondary);
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">
            <div class="logo-icon">🧠</div>
            <div class="logo-text">
                <h1>QAntum</h1>
                <span>Sovereign Control Center v23.0.0</span>
            </div>
        </div>
        <div class="status-badge">
            <div class="status-dot" id="connectionStatus"></div>
            <span id="connectionText">Свързан</span>
        </div>
    </header>
    
    <main class="container">
        <!-- Temperature Card -->
        <div class="card temp-card">
            <div class="card-header">
                <span class="card-title">🌡️ CPU Температура</span>
                <span class="card-title" id="cpuModel">AMD Ryzen 7 7435HS</span>
            </div>
            <div class="card-body">
                <div class="temp-display">
                    <div>
                        <span class="temp-value cool" id="tempValue">50</span>
                        <span class="temp-unit">°C</span>
                    </div>
                    <div>
                        <div class="temp-label">CPU Натоварване</div>
                        <div class="temp-model" id="cpuUsage">0%</div>
                    </div>
                    <div>
                        <div class="temp-label">Ядра</div>
                        <div class="temp-model" id="cpuCores">16</div>
                    </div>
                </div>
                <div class="graph-container">
                    <canvas id="tempGraph" class="graph-canvas"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Docker Card -->
        <div class="card docker-card">
            <div class="card-header">
                <span class="card-title">🐳 Docker Контейнери</span>
            </div>
            <div class="card-body">
                <div class="container-list" id="containerList">
                    <div class="no-containers">Няма активни контейнери</div>
                </div>
            </div>
        </div>
        
        <!-- System Card -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">💾 Система</span>
            </div>
            <div class="card-body">
                <div class="system-grid">
                    <div class="metric">
                        <div class="metric-label">RAM Използване</div>
                        <div class="metric-value" id="memPercent">0%</div>
                        <div class="metric-sub" id="memUsed">0 / 0 GB</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Uptime</div>
                        <div class="metric-value" id="uptime">0h</div>
                        <div class="metric-sub" id="platform">Windows</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Swarm Card -->
        <div class="card">
            <div class="card-header">
                <span class="card-title">🎖️ Swarm Статус</span>
            </div>
            <div class="card-body">
                <div class="swarm-stats">
                    <div class="swarm-stat">
                        <div class="swarm-stat-value" id="activeSoldiers">0</div>
                        <div class="swarm-stat-label">Войници</div>
                    </div>
                    <div class="swarm-stat">
                        <div class="swarm-stat-value" id="queueLength">0</div>
                        <div class="swarm-stat-label">В Опашка</div>
                    </div>
                    <div class="swarm-stat">
                        <div class="swarm-stat-value" id="completedTasks">0</div>
                        <div class="swarm-stat-label">Завършени</div>
                    </div>
                    <div class="swarm-stat">
                        <div class="swarm-stat-value" id="testsStatus">-</div>
                        <div class="swarm-stat-label">Тестове</div>
                    </div>
                </div>
                <div class="thermal-indicator">
                    <span>Термално Състояние</span>
                    <span class="thermal-state cool" id="thermalState">COOL</span>
                </div>
            </div>
        </div>
        
        <!-- Log Card -->
        <div class="card log-card">
            <div class="card-header">
                <span class="card-title">📋 Активност</span>
                <span class="card-title" id="logCount">0 записа</span>
            </div>
            <div class="card-body">
                <div class="log-container" id="logContainer">
                    <!-- Logs will be inserted here -->
                </div>
            </div>
        </div>
    </main>
    
    <footer class="footer">
        © 2025 <a href="#">Димитър Продромов</a> | QAntum v23.0.0 "The Local Sovereign" | All Rights Reserved
    </footer>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://' + window.location.host);
        let tempHistory = [];
        let usageHistory = [];
        
        ws.onopen = () => {
            document.getElementById('connectionStatus').style.background = '#00ff88';
            document.getElementById('connectionText').textContent = 'Свързан';
        };
        
        ws.onclose = () => {
            document.getElementById('connectionStatus').style.background = '#ff4444';
            document.getElementById('connectionText').textContent = 'Изключен';
        };
        
        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            
            switch (msg.type) {
                case 'init':
                    updateAll(msg.data);
                    break;
                case 'telemetry':
                    updateTelemetry(msg.data);
                    break;
                case 'log':
                    addLog(msg.data);
                    break;
                case 'containers':
                    updateContainers(msg.data);
                    break;
                case 'swarm':
                    updateSwarm(msg.data);
                    break;
                case 'tests':
                    updateTests(msg.data);
                    break;
            }
        };
        
        function updateAll(state) {
            updateTelemetry(state.telemetry);
            updateContainers(state.containers);
            updateSwarm(state.swarm);
            updateTests(state.tests);
            state.logs.forEach(log => addLog(log, true));
        }
        
        function updateTelemetry(data) {
            const temp = data.cpu.temperature;
            const usage = data.cpu.usage;
            
            // Update temperature display
            const tempEl = document.getElementById('tempValue');
            tempEl.textContent = temp.toFixed(1);
            tempEl.className = 'temp-value ' + (temp < 70 ? 'cool' : temp < 90 ? 'warm' : 'hot');
            
            document.getElementById('cpuUsage').textContent = usage.toFixed(1) + '%';
            document.getElementById('cpuCores').textContent = data.cpu.cores;
            document.getElementById('cpuModel').textContent = data.cpu.model;
            
            // Memory
            const memPercent = data.memory.percent;
            const memUsedGB = (data.memory.used / 1024 / 1024 / 1024).toFixed(1);
            const memTotalGB = (data.memory.total / 1024 / 1024 / 1024).toFixed(1);
            document.getElementById('memPercent').textContent = memPercent.toFixed(1) + '%';
            document.getElementById('memUsed').textContent = memUsedGB + ' / ' + memTotalGB + ' GB';
            
            // Uptime
            const hours = Math.floor(data.system.uptime / 3600);
            const mins = Math.floor((data.system.uptime % 3600) / 60);
            document.getElementById('uptime').textContent = hours + 'h ' + mins + 'm';
            document.getElementById('platform').textContent = data.system.platform;
            
            // Update graph
            tempHistory.push(temp);
            usageHistory.push(usage);
            if (tempHistory.length > 60) tempHistory.shift();
            if (usageHistory.length > 60) usageHistory.shift();
            drawGraph();
        }
        
        function updateContainers(containers) {
            const list = document.getElementById('containerList');
            
            if (containers.length === 0) {
                list.innerHTML = '<div class="no-containers">Няма активни контейнери</div>';
                return;
            }
            
            list.innerHTML = containers.map(c => \`
                <div class="container-item">
                    <div class="container-status \${c.status}"></div>
                    <div class="container-info">
                        <div class="container-name">\${c.name}</div>
                        <div class="container-image">\${c.image}</div>
                    </div>
                    <div class="container-stats">
                        <div>\${c.cpuPercent.toFixed(1)}% CPU</div>
                        <div>\${c.memoryUsage}</div>
                    </div>
                </div>
            \`).join('');
        }
        
        function updateSwarm(swarm) {
            document.getElementById('activeSoldiers').textContent = swarm.activeSoldiers;
            document.getElementById('queueLength').textContent = swarm.queueLength;
            document.getElementById('completedTasks').textContent = swarm.completedTasks;
            
            const thermalEl = document.getElementById('thermalState');
            thermalEl.textContent = swarm.thermalState.toUpperCase();
            thermalEl.className = 'thermal-state ' + swarm.thermalState;
        }
        
        function updateTests(tests) {
            const status = tests.running 
                ? \`\${tests.passed}/\${tests.passed + tests.failed}\` 
                : \`\${tests.passed} ✓\`;
            document.getElementById('testsStatus').textContent = status;
        }
        
        function addLog(log, prepend = false) {
            const container = document.getElementById('logContainer');
            const time = new Date(log.timestamp).toLocaleTimeString('bg-BG');
            
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = \`
                <span class="log-time">\${time}</span>
                <span class="log-level \${log.level}">\${log.level}</span>
                <span class="log-source">[\${log.source}]</span>
                <span class="log-message">\${log.message}</span>
            \`;
            
            if (prepend) {
                container.appendChild(entry);
            } else {
                container.insertBefore(entry, container.firstChild);
            }
            
            // Limit entries
            while (container.children.length > 200) {
                container.removeChild(container.lastChild);
            }
            
            document.getElementById('logCount').textContent = container.children.length + ' записа';
        }
        
        function drawGraph() {
            const canvas = document.getElementById('tempGraph');
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            
            canvas.width = rect.width * window.devicePixelRatio;
            canvas.height = rect.height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            
            const w = rect.width;
            const h = rect.height;
            
            // Clear
            ctx.fillStyle = '#12121a';
            ctx.fillRect(0, 0, w, h);
            
            // Grid
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i <= 4; i++) {
                const y = (h / 4) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
            
            // Temperature line
            if (tempHistory.length > 1) {
                ctx.strokeStyle = '#00d4ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                tempHistory.forEach((temp, i) => {
                    const x = (w / 60) * i;
                    const y = h - ((temp - 30) / 70) * h;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            }
            
            // Usage area
            if (usageHistory.length > 1) {
                ctx.fillStyle = 'rgba(0, 255, 136, 0.1)';
                ctx.beginPath();
                ctx.moveTo(0, h);
                usageHistory.forEach((usage, i) => {
                    const x = (w / 60) * i;
                    const y = h - (usage / 100) * h;
                    ctx.lineTo(x, y);
                });
                ctx.lineTo(w, h);
                ctx.closePath();
                ctx.fill();
            }
            
            // Labels
            ctx.fillStyle = '#888';
            ctx.font = '10px sans-serif';
            ctx.fillText('100°C', 5, 12);
            ctx.fillText('30°C', 5, h - 5);
        }
        
        // Initial graph
        drawGraph();
        window.addEventListener('resize', drawGraph);
    </script>
</body>
</html>`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Get server URL
     */
    getUrl(): string {
        return `http://${this.config.host}:${this.config.port}`;
    }
    
    /**
     * Get current state
     */
    getState(): DashboardState {
        return { ...this.state };
    }
    
    /**
     * Get connected client count
     */
    getClientCount(): number {
        return this.clients.size;
    }
    
    /**
     * Check if server is running
     */
    isRunning(): boolean {
        return this.server !== null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default DashboardServer;
