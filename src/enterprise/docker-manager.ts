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
import { exec, spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════════════════
// 🐳 DOCKER ORCHESTRATOR - Selenium/Playwright Grid Management
// ═══════════════════════════════════════════════════════════════════════════════
// Auto-generates Dockerfile & docker-compose.yml for test isolation.
// Each test runs in its own container on the mighty Lenovo with RTX 4050.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Docker container configuration
 */
export interface ContainerConfig {
    /** Container name */
    name: string;
    /** Browser type */
    browser: 'chrome' | 'firefox' | 'edge';
    /** Number of instances */
    instances: number;
    /** Memory limit */
    memoryLimit: string;
    /** CPU limit */
    cpuLimit: string;
    /** Enable VNC for debugging */
    enableVnc: boolean;
    /** VNC port (if enabled) */
    vncPort?: number;
    /** Selenium port */
    seleniumPort: number;
    /** Environment variables */
    env?: Record<string, string>;
}

/**
 * Docker Compose service
 */
export interface DockerService {
    image: string;
    container_name: string;
    ports: string[];
    environment: string[];
    depends_on?: string[];
    deploy?: {
        resources: {
            limits: {
                cpus: string;
                memory: string;
            };
        };
    };
    shm_size?: string;
    volumes?: string[];
    networks?: string[];
}

/**
 * Grid configuration
 */
export interface GridConfig {
    /** Hub port */
    hubPort: number;
    /** Maximum sessions */
    maxSessions: number;
    /** Session timeout (seconds) */
    sessionTimeout: number;
    /** Browser nodes */
    nodes: ContainerConfig[];
    /** Network name */
    networkName: string;
    /** Enable video recording */
    enableVideo: boolean;
    /** Video output path */
    videoPath?: string;
}

/**
 * Container status
 */
export interface ContainerStatus {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'created' | 'exited' | 'unknown';
    ports: string[];
    health: 'healthy' | 'unhealthy' | 'starting' | 'none';
    uptime?: string;
}

/**
 * Grid status
 */
export interface GridStatus {
    hub: ContainerStatus | null;
    nodes: ContainerStatus[];
    totalSessions: number;
    availableSessions: number;
    queuedSessions: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🐳 DOCKER MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class DockerManager extends EventEmitter {
    private config: GridConfig;
    private outputDir: string;
    private isGridRunning: boolean = false;
    private composeProcess: ChildProcess | null = null;
    
    constructor(config?: Partial<GridConfig>) {
        super();
        
        this.config = {
            hubPort: config?.hubPort || 4444,
            maxSessions: config?.maxSessions || 16,
            sessionTimeout: config?.sessionTimeout || 300,
            networkName: config?.networkName || 'QAntum-grid',
            enableVideo: config?.enableVideo ?? false,
            videoPath: config?.videoPath || './recordings',
            nodes: config?.nodes || [
                {
                    name: 'chrome',
                    browser: 'chrome',
                    instances: 4,
                    memoryLimit: '2g',
                    cpuLimit: '2.0',
                    enableVnc: true,
                    vncPort: 5900,
                    seleniumPort: 5555
                }
            ]
        };
        
        this.outputDir = path.join(process.cwd(), 'docker');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📄 DOCKERFILE GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Generate Dockerfile for custom test runner
     */
    generateDockerfile(): string {
        const dockerfile = `# ═══════════════════════════════════════════════════════════════════════════════
# QAntum Test Runner Container
# © 2025 Димитър Продромов. All Rights Reserved.
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:20-slim

# Install dependencies for Playwright/Puppeteer
RUN apt-get update && apt-get install -y \\
    wget \\
    gnupg \\
    ca-certificates \\
    fonts-liberation \\
    libasound2 \\
    libatk-bridge2.0-0 \\
    libatk1.0-0 \\
    libc6 \\
    libcairo2 \\
    libcups2 \\
    libdbus-1-3 \\
    libexpat1 \\
    libfontconfig1 \\
    libgbm1 \\
    libgcc1 \\
    libglib2.0-0 \\
    libgtk-3-0 \\
    libnspr4 \\
    libnss3 \\
    libpango-1.0-0 \\
    libpangocairo-1.0-0 \\
    libstdc++6 \\
    libx11-6 \\
    libx11-xcb1 \\
    libxcb1 \\
    libxcomposite1 \\
    libxcursor1 \\
    libxdamage1 \\
    libxext6 \\
    libxfixes3 \\
    libxi6 \\
    libxrandr2 \\
    libxrender1 \\
    libxss1 \\
    libxtst6 \\
    lsb-release \\
    xdg-utils \\
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Set environment
ENV NODE_ENV=production
ENV QAntum_CONTAINER=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD node -e "console.log('healthy')" || exit 1

# Run tests
CMD ["npm", "run", "test"]
`;
        return dockerfile;
    }
    
    /**
     * Generate docker-compose.yml for Selenium Grid
     */
    generateDockerCompose(): string {
        const services: Record<string, DockerService> = {};
        
        // Selenium Hub
        services['selenium-hub'] = {
            image: 'selenium/hub:4.16.1-20231219',
            container_name: 'QAntum-hub',
            ports: [`${this.config.hubPort}:4444`],
            environment: [
                `GRID_MAX_SESSION=${this.config.maxSessions}`,
                `SE_SESSION_REQUEST_TIMEOUT=${this.config.sessionTimeout}`,
                'SE_NODE_SESSION_TIMEOUT=300'
            ],
            deploy: {
                resources: {
                    limits: {
                        cpus: '1.0',
                        memory: '1g'
                    }
                }
            },
            networks: [this.config.networkName]
        };
        
        // Browser nodes
        for (const node of this.config.nodes) {
            const browserImages: Record<string, string> = {
                'chrome': 'selenium/node-chrome:4.16.1-20231219',
                'firefox': 'selenium/node-firefox:4.16.1-20231219',
                'edge': 'selenium/node-edge:4.16.1-20231219'
            };
            
            const serviceName = `${node.browser}-node`;
            const ports: string[] = [];
            
            if (node.enableVnc && node.vncPort) {
                ports.push(`${node.vncPort}:5900`);
            }
            
            services[serviceName] = {
                image: browserImages[node.browser],
                container_name: `QAntum-${node.name}`,
                ports,
                environment: [
                    'SE_EVENT_BUS_HOST=selenium-hub',
                    'SE_EVENT_BUS_PUBLISH_PORT=4442',
                    'SE_EVENT_BUS_SUBSCRIBE_PORT=4443',
                    `SE_NODE_MAX_SESSIONS=${node.instances}`,
                    `SE_NODE_OVERRIDE_MAX_SESSIONS=true`,
                    'SE_VNC_NO_PASSWORD=1'
                ],
                depends_on: ['selenium-hub'],
                deploy: {
                    resources: {
                        limits: {
                            cpus: node.cpuLimit,
                            memory: node.memoryLimit
                        }
                    }
                },
                shm_size: '2g',
                networks: [this.config.networkName]
            };
            
            if (node.env) {
                for (const [key, value] of Object.entries(node.env)) {
                    services[serviceName].environment.push(`${key}=${value}`);
                }
            }
        }
        
        // Video recorder (if enabled)
        if (this.config.enableVideo) {
            services['video-recorder'] = {
                image: 'selenium/video:ffmpeg-6.0-20231219',
                container_name: 'QAntum-video',
                ports: [],
                environment: [
                    'DISPLAY_CONTAINER_NAME=QAntum-chrome',
                    'SE_VIDEO_FILE_NAME=test_recording'
                ],
                volumes: [
                    `${this.config.videoPath}:/videos`
                ],
                depends_on: ['chrome-node'],
                networks: [this.config.networkName]
            };
        }
        
        // Build YAML
        const compose = {
            version: '3.8',
            services,
            networks: {
                [this.config.networkName]: {
                    driver: 'bridge'
                }
            }
        };
        
        return this.toYaml(compose);
    }
    
    /**
     * Generate Playwright docker-compose
     */
    generatePlaywrightCompose(): string {
        const services: Record<string, DockerService> = {};
        
        // Playwright container
        services['playwright'] = {
            image: 'mcr.microsoft.com/playwright:v1.40.0-jammy',
            container_name: 'QAntum-playwright',
            ports: ['9323:9323'],
            environment: [
                'PLAYWRIGHT_BROWSERS_PATH=/ms-playwright',
                'DEBUG=pw:api'
            ],
            deploy: {
                resources: {
                    limits: {
                        cpus: '4.0',
                        memory: '8g'
                    }
                }
            },
            shm_size: '2g',
            volumes: [
                './tests:/tests',
                './results:/results'
            ],
            networks: [this.config.networkName]
        };
        
        const compose = {
            version: '3.8',
            services,
            networks: {
                [this.config.networkName]: {
                    driver: 'bridge'
                }
            }
        };
        
        return this.toYaml(compose);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🚀 GRID MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Write Docker files to disk
     */
    async writeDockerFiles(): Promise<{ dockerfile: string; compose: string }> {
        // Create output directory
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
        
        const dockerfilePath = path.join(this.outputDir, 'Dockerfile');
        const composePath = path.join(this.outputDir, 'docker-compose.yml');
        
        const dockerfile = this.generateDockerfile();
        const compose = this.generateDockerCompose();
        
        fs.writeFileSync(dockerfilePath, dockerfile, 'utf-8');
        fs.writeFileSync(composePath, compose, 'utf-8');
        
        this.emit('files-written', { dockerfile: dockerfilePath, compose: composePath });
        
        return { dockerfile: dockerfilePath, compose: composePath };
    }
    
    /**
     * Start Selenium Grid
     */
    async startGrid(): Promise<void> {
        if (this.isGridRunning) {
            throw new Error('Grid is already running');
        }
        
        // Check Docker availability
        await this.checkDockerAvailable();
        
        // Write files
        await this.writeDockerFiles();
        
        // Start docker-compose
        const composePath = path.join(this.outputDir, 'docker-compose.yml');
        
        return new Promise((resolve, reject) => {
            this.composeProcess = spawn('docker-compose', ['-f', composePath, 'up', '-d'], {
                cwd: this.outputDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let output = '';
            let errorOutput = '';
            
            this.composeProcess.stdout?.on('data', (data) => {
                output += data.toString();
                this.emit('log', data.toString());
            });
            
            this.composeProcess.stderr?.on('data', (data) => {
                errorOutput += data.toString();
                this.emit('log', data.toString());
            });
            
            this.composeProcess.on('close', (code) => {
                if (code === 0) {
                    this.isGridRunning = true;
                    this.emit('grid-started', { hubPort: this.config.hubPort });
                    resolve();
                } else {
                    reject(new Error(`docker-compose failed with code ${code}: ${errorOutput}`));
                }
            });
            
            this.composeProcess.on('error', reject);
        });
    }
    
    /**
     * Stop Selenium Grid
     */
    async stopGrid(): Promise<void> {
        if (!this.isGridRunning) {
            return;
        }
        
        const composePath = path.join(this.outputDir, 'docker-compose.yml');
        
        return new Promise((resolve, reject) => {
            const stopProcess = spawn('docker-compose', ['-f', composePath, 'down', '--remove-orphans'], {
                cwd: this.outputDir,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            stopProcess.on('close', (code) => {
                this.isGridRunning = false;
                this.composeProcess = null;
                
                if (code === 0) {
                    this.emit('grid-stopped');
                    resolve();
                } else {
                    reject(new Error(`docker-compose down failed with code ${code}`));
                }
            });
            
            stopProcess.on('error', reject);
        });
    }
    
    /**
     * Get grid status
     */
    async getGridStatus(): Promise<GridStatus> {
        const status: GridStatus = {
            hub: null,
            nodes: [],
            totalSessions: 0,
            availableSessions: 0,
            queuedSessions: 0
        };
        
        try {
            // Get container statuses
            const { stdout } = await execAsync(
                'docker ps -a --filter "name=QAntum" --format "{{.ID}}|{{.Names}}|{{.Status}}|{{.Ports}}"'
            );
            
            const lines = stdout.trim().split('\n').filter(Boolean);
            
            for (const line of lines) {
                const [id, name, statusText, ports] = line.split('|');
                
                const containerStatus: ContainerStatus = {
                    id,
                    name,
                    status: this.parseContainerStatus(statusText),
                    ports: ports ? ports.split(',').map(p => p.trim()) : [],
                    health: 'none'
                };
                
                if (name.includes('hub')) {
                    status.hub = containerStatus;
                } else {
                    status.nodes.push(containerStatus);
                }
            }
            
            // Get session info from hub
            if (status.hub?.status === 'running') {
                const sessionInfo = await this.getHubSessionInfo();
                status.totalSessions = sessionInfo.total;
                status.availableSessions = sessionInfo.available;
                status.queuedSessions = sessionInfo.queued;
            }
        } catch {
            // Docker not available or no containers
        }
        
        return status;
    }
    
    /**
     * Check Docker availability
     */
    async checkDockerAvailable(): Promise<boolean> {
        try {
            await execAsync('docker --version');
            await execAsync('docker-compose --version');
            return true;
        } catch {
            throw new Error('Docker or docker-compose not found. Please install Docker Desktop.');
        }
    }
    
    /**
     * Get hub session info
     */
    private async getHubSessionInfo(): Promise<{ total: number; available: number; queued: number }> {
        try {
            const response = await fetch(`http://localhost:${this.config.hubPort}/status`);
            const data = await response.json() as {
                value?: {
                    ready?: boolean;
                    nodes?: Array<{
                        maxSessions?: number;
                        slots?: Array<{ session?: unknown }>;
                    }>;
                };
            };
            
            let total = 0;
            let used = 0;
            
            if (data.value?.nodes) {
                for (const node of data.value.nodes) {
                    total += node.maxSessions || 0;
                    used += node.slots?.filter((s: { session?: unknown }) => s.session).length || 0;
                }
            }
            
            return {
                total,
                available: total - used,
                queued: 0
            };
        } catch {
            return { total: 0, available: 0, queued: 0 };
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🛠️ UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    
    private parseContainerStatus(status: string): ContainerStatus['status'] {
        if (status.startsWith('Up')) return 'running';
        if (status.startsWith('Exited')) return 'exited';
        if (status.startsWith('Created')) return 'created';
        return 'unknown';
    }
    
    private toYaml(obj: Record<string, unknown>, indent: number = 0): string {
        let yaml = '';
        const spaces = '  '.repeat(indent);
        
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) continue;
            
            if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                for (const item of value) {
                    if (typeof item === 'object') {
                        yaml += `${spaces}  -\n${this.toYaml(item as Record<string, unknown>, indent + 2)}`;
                    } else {
                        yaml += `${spaces}  - ${item}\n`;
                    }
                }
            } else if (typeof value === 'object') {
                yaml += `${spaces}${key}:\n${this.toYaml(value as Record<string, unknown>, indent + 1)}`;
            } else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }
        
        return yaml;
    }
    
    /**
     * Get configuration
     */
    getConfig(): GridConfig {
        return { ...this.config };
    }
    
    /**
     * Check if grid is running
     */
    isRunning(): boolean {
        return this.isGridRunning;
    }
    
    /**
     * Get hub URL
     */
    getHubUrl(): string {
        return `http://localhost:${this.config.hubPort}/wd/hub`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default DockerManager;
