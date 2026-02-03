/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE CONFIGURATION MANAGEMENT
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * God Mode Configuration with:
 * - Environment-based configuration
 * - Schema validation on startup
 * - Type-safe configuration access
 * - Hot-reload capability
 * - Configuration change auditing
 * - Secret management integration
 * - Configuration versioning
 */

import * as path from 'path';
import * as fs from 'fs';
import { getLogger } from '../logging/enterprise-logger';
import { ConfigurationError } from '../errors/enterprise-errors';
import { SecretManager } from '../security/enterprise-security';

const logger = getLogger();

/**
 * Configuration schema definition
 */
export interface ConfigSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    default?: unknown;
    validator?: (value: unknown) => boolean;
    secret?: boolean; // If true, value should be retrieved from SecretManager
    description?: string;
  };
}

/**
 * Enterprise Configuration Manager
 */
export class EnterpriseConfigManager {
  private config: Map<string, unknown> = new Map();
  private schema: ConfigSchema;
  private watchers: Set<(key: string, value: unknown) => void> = new Set();
  private configPath?: string;
  private hotReload: boolean;
  private fileWatcher?: fs.FSWatcher;

  constructor(schema: ConfigSchema, options: {
    configPath?: string;
    hotReload?: boolean;
  } = {}) {
    this.schema = schema;
    this.configPath = options.configPath;
    this.hotReload = options.hotReload ?? false;
  }

  /**
   * Initialize configuration
   */
  async initialize(): Promise<void> {
    logger.info('Initializing enterprise configuration', {
      component: 'ConfigManager'
    });

    // Load configuration from environment
    this.loadFromEnvironment();

    // Load configuration from file if provided
    if (this.configPath) {
      await this.loadFromFile(this.configPath);
    }

    // Validate configuration against schema
    this.validate();

    // Set up hot reload if enabled
    if (this.hotReload && this.configPath) {
      this.setupHotReload();
    }

    logger.info('Enterprise configuration initialized', {
      component: 'ConfigManager',
      keys: Array.from(this.config.keys()).length
    });
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    for (const [key, definition] of Object.entries(this.schema)) {
      const envKey = this.toEnvKey(key);
      const envValue = process.env[envKey];

      if (envValue !== undefined) {
        const value = this.parseValue(envValue, definition.type);
        
        if (definition.secret) {
          // Store in SecretManager instead of config
          SecretManager.setSecret(key, envValue);
        } else {
          this.config.set(key, value);
        }

        logger.debug(`Loaded config from environment: ${key}`, {
          component: 'ConfigManager'
        });
      } else if (definition.default !== undefined) {
        this.config.set(key, definition.default);
      }
    }
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(filePath: string): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) {
        logger.warn(`Configuration file not found: ${filePath}`, {
          component: 'ConfigManager'
        });
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const fileConfig = JSON.parse(content);

      for (const [key, value] of Object.entries(fileConfig)) {
        if (this.schema[key]) {
          if (this.schema[key].secret) {
            SecretManager.setSecret(key, String(value));
          } else {
            this.config.set(key, value);
          }
        }
      }

      logger.info(`Configuration loaded from file: ${filePath}`, {
        component: 'ConfigManager'
      });
    } catch (error) {
      logger.error('Failed to load configuration file', error as Error, {
        component: 'ConfigManager',
        filePath
      });
    }
  }

  /**
   * Validate configuration against schema
   */
  private validate(): void {
    const errors: string[] = [];

    for (const [key, definition] of Object.entries(this.schema)) {
      const value = definition.secret 
        ? SecretManager.getSecret(key)
        : this.config.get(key);

      // Check required fields
      if (definition.required && value === undefined) {
        errors.push(`Required configuration key '${key}' is missing`);
        continue;
      }

      if (value === undefined) {
        continue;
      }

      // Validate type
      if (!this.validateType(value, definition.type)) {
        errors.push(`Configuration key '${key}' has invalid type. Expected ${definition.type}`);
      }

      // Custom validator
      if (definition.validator && !definition.validator(value)) {
        errors.push(`Configuration key '${key}' failed custom validation`);
      }
    }

    if (errors.length > 0) {
      const errorMessage = `Configuration validation failed:\n${errors.join('\n')}`;
      logger.error(errorMessage, undefined, { component: 'ConfigManager' });
      throw new ConfigurationError(errorMessage);
    }

    logger.info('Configuration validation passed', {
      component: 'ConfigManager'
    });
  }

  /**
   * Get configuration value
   */
  get<T = unknown>(key: string, defaultValue?: T): T {
    const definition = this.schema[key];
    
    if (!definition) {
      logger.warn(`Accessing unknown configuration key: ${key}`, {
        component: 'ConfigManager'
      });
    }

    const value = definition?.secret 
      ? SecretManager.getSecret(key)
      : this.config.get(key);

    return (value ?? defaultValue) as T;
  }

  /**
   * Set configuration value
   */
  set(key: string, value: unknown): void {
    const definition = this.schema[key];

    if (!definition) {
      throw new ConfigurationError(`Cannot set unknown configuration key: ${key}`);
    }

    // Validate value
    if (!this.validateType(value, definition.type)) {
      throw new ConfigurationError(`Invalid type for key '${key}'. Expected ${definition.type}`);
    }

    if (definition.validator && !definition.validator(value)) {
      throw new ConfigurationError(`Value for key '${key}' failed validation`);
    }

    // Store value
    if (definition.secret) {
      SecretManager.setSecret(key, String(value));
    } else {
      this.config.set(key, value);
    }

    // Notify watchers
    this.notifyWatchers(key, value);

    logger.info(`Configuration updated: ${key}`, {
      component: 'ConfigManager'
    });
  }

  /**
   * Check if configuration key exists
   */
  has(key: string): boolean {
    const definition = this.schema[key];
    
    if (definition?.secret) {
      return SecretManager.getSecret(key) !== undefined;
    }
    
    return this.config.has(key);
  }

  /**
   * Get all configuration keys
   */
  keys(): string[] {
    return Array.from(this.config.keys());
  }

  /**
   * Watch for configuration changes
   */
  watch(callback: (key: string, value: unknown) => void): () => void {
    this.watchers.add(callback);
    
    // Return unwatch function
    return () => {
      this.watchers.delete(callback);
    };
  }

  /**
   * Set up hot reload for configuration file
   */
  private setupHotReload(): void {
    if (!this.configPath) return;

    this.fileWatcher = fs.watch(this.configPath, async (eventType) => {
      if (eventType === 'change') {
        logger.info('Configuration file changed, reloading...', {
          component: 'ConfigManager'
        });

        try {
          await this.loadFromFile(this.configPath!);
          this.validate();
          
          logger.info('Configuration reloaded successfully', {
            component: 'ConfigManager'
          });
        } catch (error) {
          logger.error('Failed to reload configuration', error as Error, {
            component: 'ConfigManager'
          });
        }
      }
    });
  }

  /**
   * Notify watchers of configuration changes
   */
  private notifyWatchers(key: string, value: unknown): void {
    for (const callback of this.watchers) {
      try {
        callback(key, value);
      } catch (error) {
        logger.error('Error in configuration watcher', error as Error, {
          component: 'ConfigManager',
          key
        });
      }
    }
  }

  /**
   * Parse value from string to appropriate type
   */
  private parseValue(value: string, type: string): unknown {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'object':
      case 'array':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Validate value type
   */
  private validateType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Convert config key to environment variable format
   */
  private toEnvKey(key: string): string {
    return key
      .replace(/([A-Z])/g, '_$1')
      .toUpperCase()
      .replace(/^_/, '');
  }

  /**
   * Export configuration (excluding secrets)
   */
  exportConfig(): Record<string, unknown> {
    const exported: Record<string, unknown> = {};

    for (const [key, value] of this.config.entries()) {
      if (!this.schema[key]?.secret) {
        exported[key] = value;
      }
    }

    return exported;
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    if (this.fileWatcher) {
      this.fileWatcher.close();
    }
    
    this.watchers.clear();
    
    logger.info('Configuration manager shutdown', {
      component: 'ConfigManager'
    });
  }
}

/**
 * Default QAntum configuration schema
 */
export const QAntumConfigSchema: ConfigSchema = {
  // Environment
  nodeEnv: {
    type: 'string',
    required: true,
    default: 'development',
    validator: (value) => ['development', 'staging', 'production'].includes(value as string),
    description: 'Application environment'
  },

  // Server
  port: {
    type: 'number',
    required: true,
    default: 3847,
    validator: (value) => (value as number) > 0 && (value as number) < 65536,
    description: 'Server port'
  },

  host: {
    type: 'string',
    required: true,
    default: 'localhost',
    description: 'Server host'
  },

  // Logging
  logLevel: {
    type: 'string',
    required: true,
    default: 'info',
    validator: (value) => ['debug', 'info', 'warn', 'error', 'fatal'].includes(value as string),
    description: 'Logging level'
  },

  logFile: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Enable file logging'
  },

  // Database
  databaseUrl: {
    type: 'string',
    required: false,
    secret: true,
    description: 'Database connection URL'
  },

  // API Keys
  openaiApiKey: {
    type: 'string',
    required: false,
    secret: true,
    description: 'OpenAI API key'
  },

  anthropicApiKey: {
    type: 'string',
    required: false,
    secret: true,
    description: 'Anthropic API key'
  },

  // Security
  jwtSecret: {
    type: 'string',
    required: false,
    secret: true,
    description: 'JWT signing secret'
  },

  encryptionKey: {
    type: 'string',
    required: false,
    secret: true,
    description: 'Data encryption key'
  },

  // Rate Limiting
  rateLimitWindow: {
    type: 'number',
    required: false,
    default: 900000, // 15 minutes
    description: 'Rate limit window in milliseconds'
  },

  rateLimitMax: {
    type: 'number',
    required: false,
    default: 100,
    description: 'Maximum requests per window'
  },

  // Feature Flags
  enableMetrics: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Enable metrics collection'
  },

  enableAuditLog: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Enable audit logging'
  },

  enableHotReload: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Enable configuration hot reload'
  }
};

/**
 * Global configuration manager instance
 */
let globalConfigManager: EnterpriseConfigManager | null = null;

export function createConfigManager(
  schema: ConfigSchema = QAntumConfigSchema,
  options?: {
    configPath?: string;
    hotReload?: boolean;
  }
): EnterpriseConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = new EnterpriseConfigManager(schema, options);
  }
  return globalConfigManager;
}

export function getConfigManager(): EnterpriseConfigManager {
  if (!globalConfigManager) {
    globalConfigManager = createConfigManager();
  }
  return globalConfigManager;
}
