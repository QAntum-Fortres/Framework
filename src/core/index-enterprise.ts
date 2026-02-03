/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE CORE - MAIN EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * God Mode Enterprise Infrastructure
 * - Logging
 * - Error Handling
 * - Security
 * - Configuration Management
 */

// Logging
export {
  EnterpriseLogger,
  LogLevel,
  LogContext,
  LogEntry,
  LoggerConfig,
  LogTransport,
  createLogger,
  getLogger,
  DatadogTransport
} from './logging/enterprise-logger';

// Error Handling
export {
  QAntumError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  TimeoutError,
  DatabaseError,
  NetworkError,
  ConfigurationError,
  SecurityError,
  LicenseError,
  CircuitBreakerError,
  ErrorRecoveryManager,
  CircuitBreaker,
  GlobalErrorHandler,
  ErrorFormatter
} from './errors/enterprise-errors';

// Security
export {
  InputSanitizer,
  SchemaValidator,
  ValidationSchema,
  RateLimiter,
  RateLimitConfig,
  SecurityHeaders,
  CryptoService,
  SecretManager,
  AuditLogger
} from './security/enterprise-security';

// Configuration
export {
  EnterpriseConfigManager,
  ConfigSchema,
  QAntumConfigSchema,
  createConfigManager,
  getConfigManager
} from './config/enterprise-config';

/**
 * Initialize all enterprise systems
 */
export async function initializeEnterpriseCore(options: {
  logLevel?: string;
  enableFileLogging?: boolean;
  enableMetrics?: boolean;
  secretMasterKey?: string;
  configPath?: string;
} = {}): Promise<void> {
  const { getLogger } = await import('./logging/enterprise-logger');
  const { GlobalErrorHandler } = await import('./errors/enterprise-errors');
  const { SecretManager } = await import('./security/enterprise-security');
  const { createConfigManager } = await import('./config/enterprise-config');

  const logger = getLogger();

  // Initialize global error handlers
  GlobalErrorHandler.initialize();

  // Initialize secret manager
  if (options.secretMasterKey) {
    SecretManager.initialize(options.secretMasterKey);
  }

  // Initialize configuration manager
  const configManager = createConfigManager(undefined, {
    configPath: options.configPath,
    hotReload: process.env.NODE_ENV !== 'production'
  });
  
  await configManager.initialize();

  logger.info('Enterprise core initialized', {
    component: 'EnterpriseCore',
    environment: process.env.NODE_ENV || 'development'
  });
}
