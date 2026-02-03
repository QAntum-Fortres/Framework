/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POLYGLOT INTEGRATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Multi-Language Integration for Maximum Performance & Stability:
 * - Rust: Performance-critical operations, memory safety
 * - Go: Concurrent processing, microservices
 * - C++: Legacy system integration, low-level operations
 * - Python: Data science, ML models
 * 
 * Features:
 * - FFI (Foreign Function Interface) bridges
 * - Type-safe communication
 * - Error handling across language boundaries
 * - Performance monitoring
 * - Automatic fallback to TypeScript implementation
 */

import { getLogger } from '../logging/enterprise-logger';
import { ServiceUnavailableError, InternalServerError } from '../errors/enterprise-errors';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

const logger = getLogger();

/**
 * Supported languages for integration
 */
export enum SupportedLanguage {
  RUST = 'rust',
  GO = 'go',
  CPP = 'cpp',
  PYTHON = 'python',
  TYPESCRIPT = 'typescript'
}

/**
 * Module metadata
 */
export interface PolyglotModuleMetadata {
  name: string;
  language: SupportedLanguage;
  path: string;
  version: string;
  capabilities: string[];
  fallback?: string; // Path to TypeScript fallback
}

/**
 * Communication protocol
 */
export interface PolyglotMessage {
  id: string;
  method: string;
  params: unknown[];
  timestamp: number;
}

export interface PolyglotResponse {
  id: string;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
  executionTime: number;
}

/**
 * Polyglot Module Manager
 * 
 * Manages integration with modules written in different languages
 */
export class PolyglotModuleManager {
  private modules: Map<string, PolyglotModule> = new Map();
  private initialized = false;

  /**
   * Initialize the polyglot system
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Polyglot Module Manager', {
      component: 'PolyglotManager'
    });

    // Discover available modules
    await this.discoverModules();

    this.initialized = true;

    logger.info('Polyglot Module Manager initialized', {
      component: 'PolyglotManager',
      moduleCount: this.modules.size
    });
  }

  /**
   * Discover available polyglot modules
   */
  private async discoverModules(): Promise<void> {
    const modulesPath = path.join(process.cwd(), 'polyglot-modules');

    if (!fs.existsSync(modulesPath)) {
      logger.warn('Polyglot modules directory not found', {
        component: 'PolyglotManager',
        path: modulesPath
      });
      return;
    }

    // Scan for module manifests
    const manifestFiles = this.findManifests(modulesPath);

    for (const manifestPath of manifestFiles) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const module = await this.loadModule(manifest);
        this.modules.set(manifest.name, module);

        logger.info('Loaded polyglot module', {
          component: 'PolyglotManager',
          module: manifest.name,
          language: manifest.language
        });
      } catch (error) {
        logger.error('Failed to load module', error as Error, {
          component: 'PolyglotManager',
          manifest: manifestPath
        });
      }
    }
  }

  private findManifests(dir: string): string[] {
    const manifests: string[] = [];

    if (!fs.existsSync(dir)) {
      return manifests;
    }

    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const filePath = path.join(dir, file.name);

      if (file.isDirectory()) {
        manifests.push(...this.findManifests(filePath));
      } else if (file.name === 'module.json') {
        manifests.push(filePath);
      }
    }

    return manifests;
  }

  /**
   * Load a polyglot module
   */
  private async loadModule(metadata: PolyglotModuleMetadata): Promise<PolyglotModule> {
    switch (metadata.language) {
      case SupportedLanguage.RUST:
        return new RustModule(metadata);
      case SupportedLanguage.GO:
        return new GoModule(metadata);
      case SupportedLanguage.CPP:
        return new CppModule(metadata);
      case SupportedLanguage.PYTHON:
        return new PythonModule(metadata);
      default:
        throw new Error(`Unsupported language: ${metadata.language}`);
    }
  }

  /**
   * Call a method on a polyglot module
   */
  async call<T = unknown>(
    moduleName: string,
    method: string,
    ...params: unknown[]
  ): Promise<T> {
    const module = this.modules.get(moduleName);

    if (!module) {
      throw new ServiceUnavailableError(`Module not found: ${moduleName}`);
    }

    try {
      return await module.call<T>(method, ...params);
    } catch (error) {
      logger.error('Module call failed', error as Error, {
        component: 'PolyglotManager',
        module: moduleName,
        method
      });

      // Try fallback if available
      if (module.metadata.fallback) {
        logger.warn('Attempting fallback implementation', {
          component: 'PolyglotManager',
          module: moduleName,
          fallback: module.metadata.fallback
        });

        return await this.callFallback<T>(module.metadata.fallback, method, ...params);
      }

      throw error;
    }
  }

  /**
   * Call TypeScript fallback implementation
   */
  private async callFallback<T>(
    fallbackPath: string,
    method: string,
    ...params: unknown[]
  ): Promise<T> {
    const fallbackModule = await import(fallbackPath);

    if (typeof fallbackModule[method] !== 'function') {
      throw new Error(`Fallback method not found: ${method}`);
    }

    return await fallbackModule[method](...params);
  }

  /**
   * Get module health status
   */
  async getModuleHealth(moduleName: string): Promise<{
    healthy: boolean;
    language: string;
    version: string;
  }> {
    const module = this.modules.get(moduleName);

    if (!module) {
      return { healthy: false, language: 'unknown', version: 'unknown' };
    }

    const healthy = await module.healthCheck();

    return {
      healthy,
      language: module.metadata.language,
      version: module.metadata.version
    };
  }

  /**
   * Reload a module (hot-reload support)
   */
  async reloadModule(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);

    if (!module) {
      throw new Error(`Module not found: ${moduleName}`);
    }

    logger.info('Reloading module', {
      component: 'PolyglotManager',
      module: moduleName
    });

    await module.shutdown();
    
    // Reload module
    const manifestPath = path.join(
      process.cwd(),
      'polyglot-modules',
      moduleName,
      'module.json'
    );
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const newModule = await this.loadModule(manifest);
    
    this.modules.set(moduleName, newModule);

    logger.info('Module reloaded successfully', {
      component: 'PolyglotManager',
      module: moduleName
    });
  }

  /**
   * Shutdown all modules
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Polyglot Module Manager', {
      component: 'PolyglotManager'
    });

    for (const [name, module] of this.modules.entries()) {
      try {
        await module.shutdown();
        logger.info('Module shutdown', {
          component: 'PolyglotManager',
          module: name
        });
      } catch (error) {
        logger.error('Error shutting down module', error as Error, {
          component: 'PolyglotManager',
          module: name
        });
      }
    }

    this.modules.clear();
    this.initialized = false;
  }
}

/**
 * Base class for polyglot modules
 */
abstract class PolyglotModule {
  protected process?: ChildProcess;
  protected requestQueue: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  constructor(public metadata: PolyglotModuleMetadata) {}

  /**
   * Call a method on the module
   */
  async call<T = unknown>(method: string, ...params: unknown[]): Promise<T> {
    const message: PolyglotMessage = {
      id: this.generateId(),
      method,
      params,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.requestQueue.delete(message.id);
        reject(new Error(`Timeout calling ${method} on ${this.metadata.name}`));
      }, 30000); // 30 second timeout

      this.requestQueue.set(message.id, { resolve, reject, timeout });

      // Send message to module
      this.sendMessage(message);
    });
  }

  /**
   * Send message to module process
   */
  protected abstract sendMessage(message: PolyglotMessage): void;

  /**
   * Handle response from module
   */
  protected handleResponse(response: PolyglotResponse): void {
    const request = this.requestQueue.get(response.id);

    if (!request) {
      logger.warn('Received response for unknown request', {
        component: 'PolyglotModule',
        module: this.metadata.name,
        requestId: response.id
      });
      return;
    }

    clearTimeout(request.timeout);
    this.requestQueue.delete(response.id);

    if (response.error) {
      request.reject(new Error(response.error.message));
    } else {
      request.resolve(response.result);
    }

    logger.debug('Module call completed', {
      component: 'PolyglotModule',
      module: this.metadata.name,
      executionTime: response.executionTime
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.call('__health__');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Shutdown module
   */
  async shutdown(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }

    // Reject all pending requests
    for (const [id, request] of this.requestQueue.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error('Module shutdown'));
    }

    this.requestQueue.clear();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Rust module implementation
 */
class RustModule extends PolyglotModule {
  constructor(metadata: PolyglotModuleMetadata) {
    super(metadata);
    this.initializeProcess();
  }

  private initializeProcess(): void {
    // Start Rust process
    this.process = spawn(this.metadata.path, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    // Handle messages from Rust
    this.process.on('message', (message: PolyglotResponse) => {
      this.handleResponse(message);
    });

    this.process.on('error', (error) => {
      logger.error('Rust module process error', error, {
        component: 'RustModule',
        module: this.metadata.name
      });
    });

    logger.info('Rust module process started', {
      component: 'RustModule',
      module: this.metadata.name,
      pid: this.process.pid
    });
  }

  protected sendMessage(message: PolyglotMessage): void {
    if (!this.process) {
      throw new Error('Rust module process not initialized');
    }

    this.process.send(message);
  }
}

/**
 * Go module implementation
 */
class GoModule extends PolyglotModule {
  constructor(metadata: PolyglotModuleMetadata) {
    super(metadata);
    this.initializeProcess();
  }

  private initializeProcess(): void {
    this.process = spawn(this.metadata.path, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    this.process.on('message', (message: PolyglotResponse) => {
      this.handleResponse(message);
    });

    logger.info('Go module process started', {
      component: 'GoModule',
      module: this.metadata.name,
      pid: this.process.pid
    });
  }

  protected sendMessage(message: PolyglotMessage): void {
    if (!this.process) {
      throw new Error('Go module process not initialized');
    }

    this.process.send(message);
  }
}

/**
 * C++ module implementation
 */
class CppModule extends PolyglotModule {
  private nativeAddon: any;

  constructor(metadata: PolyglotModuleMetadata) {
    super(metadata);
    this.loadNativeAddon();
  }

  private loadNativeAddon(): void {
    try {
      // Load N-API addon
      this.nativeAddon = require(this.metadata.path);

      logger.info('C++ module loaded', {
        component: 'CppModule',
        module: this.metadata.name
      });
    } catch (error) {
      logger.error('Failed to load C++ module', error as Error, {
        component: 'CppModule',
        module: this.metadata.name
      });
      throw error;
    }
  }

  protected sendMessage(message: PolyglotMessage): void {
    // For N-API, call method directly
    const startTime = Date.now();

    try {
      const result = this.nativeAddon[message.method](...message.params);

      const response: PolyglotResponse = {
        id: message.id,
        result,
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };

      this.handleResponse(response);
    } catch (error) {
      const response: PolyglotResponse = {
        id: message.id,
        error: {
          code: 'CPP_ERROR',
          message: (error as Error).message
        },
        timestamp: Date.now(),
        executionTime: Date.now() - startTime
      };

      this.handleResponse(response);
    }
  }
}

/**
 * Python module implementation
 */
class PythonModule extends PolyglotModule {
  constructor(metadata: PolyglotModuleMetadata) {
    super(metadata);
    this.initializeProcess();
  }

  private initializeProcess(): void {
    this.process = spawn('python3', [this.metadata.path], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Parse JSON responses from stdout
    let buffer = '';

    this.process.stdout?.on('data', (data) => {
      buffer += data.toString();

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            this.handleResponse(response);
          } catch (error) {
            logger.error('Failed to parse Python response', error as Error, {
              component: 'PythonModule',
              line
            });
          }
        }
      }
    });

    logger.info('Python module process started', {
      component: 'PythonModule',
      module: this.metadata.name,
      pid: this.process.pid
    });
  }

  protected sendMessage(message: PolyglotMessage): void {
    if (!this.process?.stdin) {
      throw new Error('Python module process not initialized');
    }

    this.process.stdin.write(JSON.stringify(message) + '\n');
  }
}

/**
 * Global polyglot manager instance
 */
let globalPolyglotManager: PolyglotModuleManager | null = null;

export function getPolyglotManager(): PolyglotModuleManager {
  if (!globalPolyglotManager) {
    globalPolyglotManager = new PolyglotModuleManager();
  }
  return globalPolyglotManager;
}
