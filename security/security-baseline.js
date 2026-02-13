/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 3/50: Security Baseline                            ║
 * ║  Part of: Phase 1 - Enterprise Foundation                                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Access control, encryption, and authentication for ML systems
 * @phase 1 - Enterprise Foundation
 * @step 3 of 50
 */

'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY BASELINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SecurityBaseline - Core security protocols for ML pipelines
 */
class SecurityBaseline extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            encryptionAlgorithm: options.encryptionAlgorithm || 'aes-256-gcm',
            hashAlgorithm: options.hashAlgorithm || 'sha256',
            keyDerivation: options.keyDerivation || 'scrypt',
            tokenExpiry: options.tokenExpiry || 3600000, // 1 hour
            maxLoginAttempts: options.maxLoginAttempts || 5,
            lockoutDuration: options.lockoutDuration || 900000, // 15 minutes
            ...options
        };
        
        // Initialize stores
        this.tokens = new Map();
        this.sessions = new Map();
        this.permissions = new Map();
        this.auditLog = [];
        this.failedAttempts = new Map();
        
        // Default roles and permissions
        this._initializeRBAC();
        
        // Start cleanup interval
        this._startCleanup();
    }

    /**
     * Initialize Role-Based Access Control
     */
    _initializeRBAC() {
        // Define roles
        this.roles = {
            admin: {
                permissions: ['*'], // All permissions
                description: 'Full system access'
            },
            trainer: {
                permissions: [
                    'model:create', 'model:read', 'model:update', 'model:train',
                    'data:read', 'data:upload',
                    'experiment:create', 'experiment:read'
                ],
                description: 'Can train and manage models'
            },
            viewer: {
                permissions: [
                    'model:read',
                    'data:read',
                    'experiment:read',
                    'metrics:read'
                ],
                description: 'Read-only access'
            },
            api: {
                permissions: [
                    'model:inference',
                    'metrics:read'
                ],
                description: 'API inference only'
            }
        };
        
        // Define resources
        this.resources = [
            'model', 'data', 'experiment', 'metrics', 'config', 'user', 'system'
        ];
        
        // Define actions
        this.actions = [
            'create', 'read', 'update', 'delete', 'train', 'inference', 'upload', 'download'
        ];
    }

    /**
     * Start periodic cleanup of expired tokens
     */
    _startCleanup() {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            
            // Clean expired tokens
            for (const [token, data] of this.tokens) {
                if (data.expiresAt < now) {
                    this.tokens.delete(token);
                    this._audit('token_expired', { tokenId: token.slice(0, 8) });
                }
            }
            
            // Clean expired sessions
            for (const [sessionId, session] of this.sessions) {
                if (session.expiresAt < now) {
                    this.sessions.delete(sessionId);
                }
            }
            
            // Clean old failed attempts
            for (const [key, data] of this.failedAttempts) {
                if (data.lockedUntil && data.lockedUntil < now) {
                    this.failedAttempts.delete(key);
                }
            }
        }, 60000); // Every minute
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENCRYPTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate encryption key from password
     */
    deriveKey(password, salt = null) {
        salt = salt || crypto.randomBytes(32);
        
        const key = crypto.scryptSync(password, salt, 32, {
            N: 16384,
            r: 8,
            p: 1
        });
        
        return { key, salt };
    }

    /**
     * Encrypt data
     */
    encrypt(data, key) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.options.encryptionAlgorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypt data
     */
    decrypt(encryptedData, key) {
        const decipher = crypto.createDecipheriv(
            this.options.encryptionAlgorithm,
            key,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    /**
     * Hash sensitive data
     */
    hash(data) {
        return crypto
            .createHash(this.options.hashAlgorithm)
            .update(typeof data === 'string' ? data : JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Generate secure random token
     */
    generateToken(bytes = 32) {
        return crypto.randomBytes(bytes).toString('hex');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHENTICATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create API key
     */
    createAPIKey(userId, role = 'api', metadata = {}) {
        const apiKey = `mm_${this.generateToken(32)}`;
        const hashedKey = this.hash(apiKey);
        
        this.tokens.set(hashedKey, {
            userId,
            role,
            type: 'api_key',
            metadata,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.options.tokenExpiry * 24 * 365, // 1 year for API keys
            lastUsed: null
        });
        
        this._audit('api_key_created', { userId, role });
        
        return apiKey; // Return unhashed - only time it's visible
    }

    /**
     * Validate API key
     */
    validateAPIKey(apiKey) {
        const hashedKey = this.hash(apiKey);
        const tokenData = this.tokens.get(hashedKey);
        
        if (!tokenData) {
            this._audit('invalid_api_key', { keyPrefix: apiKey.slice(0, 8) });
            return { valid: false, error: 'Invalid API key' };
        }
        
        if (tokenData.expiresAt < Date.now()) {
            this._audit('expired_api_key', { userId: tokenData.userId });
            return { valid: false, error: 'API key expired' };
        }
        
        // Update last used
        tokenData.lastUsed = Date.now();
        
        this._audit('api_key_used', { userId: tokenData.userId });
        
        return {
            valid: true,
            userId: tokenData.userId,
            role: tokenData.role,
            permissions: this.roles[tokenData.role]?.permissions || []
        };
    }

    /**
     * Create session token
     */
    createSession(userId, role, metadata = {}) {
        const sessionId = this.generateToken(32);
        const token = this.generateToken(48);
        
        this.sessions.set(sessionId, {
            userId,
            role,
            token: this.hash(token),
            metadata,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.options.tokenExpiry,
            lastActivity: Date.now()
        });
        
        this._audit('session_created', { userId, sessionId: sessionId.slice(0, 8) });
        
        return { sessionId, token };
    }

    /**
     * Validate session
     */
    validateSession(sessionId, token) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return { valid: false, error: 'Session not found' };
        }
        
        if (session.token !== this.hash(token)) {
            return { valid: false, error: 'Invalid token' };
        }
        
        if (session.expiresAt < Date.now()) {
            this.sessions.delete(sessionId);
            return { valid: false, error: 'Session expired' };
        }
        
        // Refresh session
        session.lastActivity = Date.now();
        session.expiresAt = Date.now() + this.options.tokenExpiry;
        
        return {
            valid: true,
            userId: session.userId,
            role: session.role,
            permissions: this.roles[session.role]?.permissions || []
        };
    }

    /**
     * Revoke session
     */
    revokeSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            const session = this.sessions.get(sessionId);
            this.sessions.delete(sessionId);
            this._audit('session_revoked', { userId: session.userId });
            return true;
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTHORIZATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Check permission
     */
    hasPermission(role, permission) {
        const roleData = this.roles[role];
        if (!roleData) return false;
        
        // Admin has all permissions
        if (roleData.permissions.includes('*')) return true;
        
        // Check exact permission
        if (roleData.permissions.includes(permission)) return true;
        
        // Check wildcard patterns
        const [resource, action] = permission.split(':');
        if (roleData.permissions.includes(`${resource}:*`)) return true;
        if (roleData.permissions.includes(`*:${action}`)) return true;
        
        return false;
    }

    /**
     * Authorize action
     */
    authorize(auth, resource, action) {
        const permission = `${resource}:${action}`;
        
        if (!auth || !auth.valid) {
            this._audit('unauthorized_access', { permission });
            return { authorized: false, error: 'Not authenticated' };
        }
        
        if (!this.hasPermission(auth.role, permission)) {
            this._audit('permission_denied', { 
                userId: auth.userId, 
                role: auth.role, 
                permission 
            });
            return { authorized: false, error: 'Permission denied' };
        }
        
        this._audit('action_authorized', { 
            userId: auth.userId, 
            permission 
        });
        
        return { authorized: true };
    }

    /**
     * Create custom role
     */
    createRole(name, permissions, description = '') {
        if (this.roles[name]) {
            throw new Error(`Role ${name} already exists`);
        }
        
        // Validate permissions
        for (const perm of permissions) {
            if (perm !== '*') {
                const [resource, action] = perm.split(':');
                if (!this.resources.includes(resource) && resource !== '*') {
                    throw new Error(`Invalid resource: ${resource}`);
                }
                if (!this.actions.includes(action) && action !== '*') {
                    throw new Error(`Invalid action: ${action}`);
                }
            }
        }
        
        this.roles[name] = { permissions, description };
        this._audit('role_created', { name, permissions });
        
        return this.roles[name];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RATE LIMITING & BRUTE FORCE PROTECTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Record failed attempt
     */
    recordFailedAttempt(identifier) {
        const data = this.failedAttempts.get(identifier) || { count: 0 };
        data.count++;
        data.lastAttempt = Date.now();
        
        if (data.count >= this.options.maxLoginAttempts) {
            data.lockedUntil = Date.now() + this.options.lockoutDuration;
            this._audit('account_locked', { identifier, attempts: data.count });
        }
        
        this.failedAttempts.set(identifier, data);
        return data;
    }

    /**
     * Check if locked
     */
    isLocked(identifier) {
        const data = this.failedAttempts.get(identifier);
        if (!data) return false;
        
        if (data.lockedUntil && data.lockedUntil > Date.now()) {
            return {
                locked: true,
                remainingTime: data.lockedUntil - Date.now()
            };
        }
        
        return { locked: false };
    }

    /**
     * Clear failed attempts
     */
    clearFailedAttempts(identifier) {
        this.failedAttempts.delete(identifier);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUDIT LOGGING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Record audit event
     */
    _audit(event, details = {}) {
        const entry = {
            timestamp: Date.now(),
            event,
            details,
            id: this.generateToken(8)
        };
        
        this.auditLog.push(entry);
        this.emit('audit', entry);
        
        // Keep last 10000 entries
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-10000);
        }
    }

    /**
     * Get audit log
     */
    getAuditLog(filter = {}) {
        let logs = this.auditLog;
        
        if (filter.event) {
            logs = logs.filter(l => l.event === filter.event);
        }
        
        if (filter.userId) {
            logs = logs.filter(l => l.details.userId === filter.userId);
        }
        
        if (filter.since) {
            logs = logs.filter(l => l.timestamp >= filter.since);
        }
        
        if (filter.limit) {
            logs = logs.slice(-filter.limit);
        }
        
        return logs;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DATA PROTECTION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Mask sensitive data
     */
    maskSensitive(data, fields = ['password', 'apiKey', 'token', 'secret']) {
        if (typeof data !== 'object' || data === null) return data;
        
        const masked = Array.isArray(data) ? [...data] : { ...data };
        
        for (const field of fields) {
            if (field in masked) {
                const value = masked[field];
                if (typeof value === 'string') {
                    masked[field] = value.slice(0, 4) + '***' + value.slice(-4);
                } else {
                    masked[field] = '***';
                }
            }
        }
        
        // Recursively mask nested objects
        for (const [key, value] of Object.entries(masked)) {
            if (typeof value === 'object' && value !== null) {
                masked[key] = this.maskSensitive(value, fields);
            }
        }
        
        return masked;
    }

    /**
     * Validate input (basic sanitization)
     */
    sanitizeInput(input) {
        if (typeof input === 'string') {
            // Remove potential script injections
            return input
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+=/gi, '')
                .trim();
        }
        
        if (typeof input === 'object' && input !== null) {
            const sanitized = Array.isArray(input) ? [] : {};
            for (const [key, value] of Object.entries(input)) {
                sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        
        return input;
    }

    /**
     * Get security summary
     */
    getSummary() {
        return {
            activeSessions: this.sessions.size,
            activeAPIKeys: [...this.tokens.values()].filter(t => t.type === 'api_key').length,
            lockedAccounts: [...this.failedAttempts.values()].filter(d => d.lockedUntil > Date.now()).length,
            recentAuditEvents: this.auditLog.slice(-10).map(e => e.event),
            roles: Object.keys(this.roles),
            encryptionAlgorithm: this.options.encryptionAlgorithm
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC - Role-Based Access Control (Standalone Class)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * RBAC - Role-Based Access Control Manager
 * 
 * @description Standalone RBAC implementation for fine-grained access control
 * 
 * @example
 * const rbac = new RBAC();
 * rbac.addRole('editor', ['document:read', 'document:write']);
 * rbac.assignRole('user123', 'editor');
 * const canWrite = rbac.can('user123', 'document:write'); // true
 */
class RBAC {
    constructor(options = {}) {
        /**
         * @type {Map<string, {permissions: string[], description: string}>}
         * @description Role definitions
         */
        this.roles = new Map();
        
        /**
         * @type {Map<string, Set<string>>}
         * @description User to roles mapping
         */
        this.userRoles = new Map();
        
        /**
         * @type {Set<string>}
         * @description Valid resources
         */
        this.resources = new Set(options.resources || [
            'model', 'data', 'experiment', 'metrics', 'config', 'user', 'system', 'document'
        ]);
        
        /**
         * @type {Set<string>}
         * @description Valid actions
         */
        this.actions = new Set(options.actions || [
            'create', 'read', 'update', 'delete', 'train', 'inference', 'upload', 'download', 'write', 'execute'
        ]);
        
        // Initialize default roles if provided
        if (options.defaultRoles) {
            for (const [name, config] of Object.entries(options.defaultRoles)) {
                this.addRole(name, config.permissions, config.description);
            }
        }
    }

    /**
     * Add a new role with permissions
     * 
     * @param {string} name - Role name
     * @param {string[]} permissions - Array of permissions (format: 'resource:action')
     * @param {string} description - Role description
     * @returns {RBAC} - Returns this for chaining
     */
    addRole(name, permissions = [], description = '') {
        if (!name || typeof name !== 'string') {
            throw new Error('Role name must be a non-empty string');
        }
        
        this.roles.set(name, {
            permissions: [...permissions],
            description
        });
        
        return this;
    }

    /**
     * Remove a role
     * 
     * @param {string} name - Role name
     * @returns {boolean} - True if role was removed
     */
    removeRole(name) {
        // Remove role from all users
        for (const roles of this.userRoles.values()) {
            roles.delete(name);
        }
        return this.roles.delete(name);
    }

    /**
     * Get role by name
     * 
     * @param {string} name - Role name
     * @returns {Object|null} - Role object or null
     */
    getRole(name) {
        return this.roles.get(name) || null;
    }

    /**
     * Get all roles
     * 
     * @returns {Object} - All roles as object
     */
    getRoles() {
        const result = {};
        for (const [name, config] of this.roles) {
            result[name] = { ...config };
        }
        return result;
    }

    /**
     * Add permission to a role
     * 
     * @param {string} roleName - Role name
     * @param {string} permission - Permission to add
     * @returns {boolean} - True if added
     */
    addPermissionToRole(roleName, permission) {
        const role = this.roles.get(roleName);
        if (!role) return false;
        
        if (!role.permissions.includes(permission)) {
            role.permissions.push(permission);
        }
        return true;
    }

    /**
     * Remove permission from a role
     * 
     * @param {string} roleName - Role name
     * @param {string} permission - Permission to remove
     * @returns {boolean} - True if removed
     */
    removePermissionFromRole(roleName, permission) {
        const role = this.roles.get(roleName);
        if (!role) return false;
        
        const index = role.permissions.indexOf(permission);
        if (index > -1) {
            role.permissions.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Assign role to user
     * 
     * @param {string} userId - User identifier
     * @param {string} roleName - Role to assign
     * @returns {boolean} - True if assigned
     */
    assignRole(userId, roleName) {
        if (!this.roles.has(roleName)) {
            throw new Error(`Role '${roleName}' does not exist`);
        }
        
        if (!this.userRoles.has(userId)) {
            this.userRoles.set(userId, new Set());
        }
        
        this.userRoles.get(userId).add(roleName);
        return true;
    }

    /**
     * Unassign role from user
     * 
     * @param {string} userId - User identifier
     * @param {string} roleName - Role to unassign
     * @returns {boolean} - True if unassigned
     */
    unassignRole(userId, roleName) {
        const roles = this.userRoles.get(userId);
        if (!roles) return false;
        return roles.delete(roleName);
    }

    /**
     * Get user's roles
     * 
     * @param {string} userId - User identifier
     * @returns {string[]} - Array of role names
     */
    getUserRoles(userId) {
        const roles = this.userRoles.get(userId);
        return roles ? Array.from(roles) : [];
    }

    /**
     * Get all permissions for a user
     * 
     * @param {string} userId - User identifier
     * @returns {string[]} - Array of all permissions
     */
    getUserPermissions(userId) {
        const userRoles = this.userRoles.get(userId);
        if (!userRoles) return [];
        
        const permissions = new Set();
        for (const roleName of userRoles) {
            const role = this.roles.get(roleName);
            if (role) {
                for (const perm of role.permissions) {
                    permissions.add(perm);
                }
            }
        }
        
        return Array.from(permissions);
    }

    /**
     * Check if user has permission
     * 
     * @param {string} userId - User identifier
     * @param {string} permission - Permission to check (format: 'resource:action')
     * @returns {boolean} - True if user has permission
     */
    can(userId, permission) {
        const userRoles = this.userRoles.get(userId);
        if (!userRoles) return false;
        
        for (const roleName of userRoles) {
            const role = this.roles.get(roleName);
            if (!role) continue;
            
            // Check for wildcard (admin)
            if (role.permissions.includes('*')) return true;
            
            // Check exact permission
            if (role.permissions.includes(permission)) return true;
            
            // Check resource wildcard
            const [resource, action] = permission.split(':');
            if (role.permissions.includes(`${resource}:*`)) return true;
            if (role.permissions.includes(`*:${action}`)) return true;
        }
        
        return false;
    }

    /**
     * Alias for can()
     */
    hasPermission(userId, permission) {
        return this.can(userId, permission);
    }

    /**
     * Check if role has permission
     * 
     * @param {string} roleName - Role name
     * @param {string} permission - Permission to check
     * @returns {boolean} - True if role has permission
     */
    roleHasPermission(roleName, permission) {
        const role = this.roles.get(roleName);
        if (!role) return false;
        
        if (role.permissions.includes('*')) return true;
        if (role.permissions.includes(permission)) return true;
        
        const [resource, action] = permission.split(':');
        if (role.permissions.includes(`${resource}:*`)) return true;
        if (role.permissions.includes(`*:${action}`)) return true;
        
        return false;
    }

    /**
     * Clear all user role assignments
     */
    clearUserRoles() {
        this.userRoles.clear();
    }

    /**
     * Get summary
     * 
     * @returns {Object} - Summary object
     */
    getSummary() {
        return {
            totalRoles: this.roles.size,
            totalUsers: this.userRoles.size,
            roles: Array.from(this.roles.keys()),
            resources: Array.from(this.resources),
            actions: Array.from(this.actions)
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION - Standalone Encryption Class
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Encryption - Standalone encryption/decryption utilities
 * 
 * @description Provides encryption, decryption, hashing, and key derivation
 * 
 * @example
 * const enc = new Encryption();
 * const { key, salt } = enc.deriveKey('password');
 * const encrypted = enc.encrypt({ secret: 'data' }, key);
 * const decrypted = enc.decrypt(encrypted, key);
 */
class Encryption {
    constructor(options = {}) {
        /**
         * @type {string}
         * @description Encryption algorithm (default: aes-256-gcm)
         */
        this.algorithm = options.algorithm || 'aes-256-gcm';
        
        /**
         * @type {string}
         * @description Hash algorithm (default: sha256)
         */
        this.hashAlgorithm = options.hashAlgorithm || 'sha256';
        
        /**
         * @type {number}
         * @description Key length in bytes
         */
        this.keyLength = options.keyLength || 32;
        
        /**
         * @type {number}
         * @description IV length in bytes
         */
        this.ivLength = options.ivLength || 12;
        
        /**
         * @type {number}
         * @description Salt length in bytes
         */
        this.saltLength = options.saltLength || 32;
    }

    /**
     * Derive key from password using scrypt
     * 
     * @param {string} password - Password to derive key from
     * @param {Buffer|null} salt - Optional salt (generated if not provided)
     * @returns {Object} - { key: Buffer, salt: Buffer }
     */
    deriveKey(password, salt = null) {
        salt = salt || crypto.randomBytes(this.saltLength);
        
        const key = crypto.scryptSync(password, salt, this.keyLength, {
            N: 16384,
            r: 8,
            p: 1
        });
        
        return { key, salt };
    }

    /**
     * Generate random key
     * 
     * @param {number} length - Key length in bytes
     * @returns {Buffer} - Random key
     */
    generateKey(length = null) {
        return crypto.randomBytes(length || this.keyLength);
    }

    /**
     * Encrypt data
     * 
     * @param {any} data - Data to encrypt (will be JSON stringified)
     * @param {Buffer} key - Encryption key
     * @returns {Object} - { encrypted: string, iv: string, authTag: string }
     */
    encrypt(data, key) {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm: this.algorithm
        };
    }

    /**
     * Decrypt data
     * 
     * @param {Object} encryptedData - Encrypted data object
     * @param {Buffer} key - Decryption key
     * @returns {any} - Decrypted data (parsed from JSON)
     */
    decrypt(encryptedData, key) {
        const algorithm = encryptedData.algorithm || this.algorithm;
        
        const decipher = crypto.createDecipheriv(
            algorithm,
            key,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    /**
     * Hash data
     * 
     * @param {any} data - Data to hash
     * @returns {string} - Hex-encoded hash
     */
    hash(data) {
        return crypto
            .createHash(this.hashAlgorithm)
            .update(typeof data === 'string' ? data : JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Create HMAC
     * 
     * @param {any} data - Data to sign
     * @param {string|Buffer} key - HMAC key
     * @returns {string} - Hex-encoded HMAC
     */
    hmac(data, key) {
        return crypto
            .createHmac(this.hashAlgorithm, key)
            .update(typeof data === 'string' ? data : JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Verify HMAC
     * 
     * @param {any} data - Original data
     * @param {string|Buffer} key - HMAC key
     * @param {string} signature - HMAC signature to verify
     * @returns {boolean} - True if valid
     */
    verifyHmac(data, key, signature) {
        const computed = this.hmac(data, key);
        return crypto.timingSafeEqual(
            Buffer.from(computed, 'hex'),
            Buffer.from(signature, 'hex')
        );
    }

    /**
     * Generate secure random token
     * 
     * @param {number} bytes - Number of bytes
     * @returns {string} - Hex-encoded token
     */
    generateToken(bytes = 32) {
        return crypto.randomBytes(bytes).toString('hex');
    }

    /**
     * Generate UUID v4
     * 
     * @returns {string} - UUID string
     */
    generateUUID() {
        return crypto.randomUUID();
    }

    /**
     * Constant-time string comparison
     * 
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {boolean} - True if equal
     */
    secureCompare(a, b) {
        if (a.length !== b.length) return false;
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    }

    /**
     * Get summary
     * 
     * @returns {Object} - Encryption configuration summary
     */
    getSummary() {
        return {
            algorithm: this.algorithm,
            hashAlgorithm: this.hashAlgorithm,
            keyLength: this.keyLength,
            ivLength: this.ivLength,
            saltLength: this.saltLength
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let _instance = null;

function getSecurityBaseline(options = {}) {
    if (!_instance) {
        _instance = new SecurityBaseline(options);
    }
    return _instance;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    SecurityBaseline,
    RBAC,
    Encryption,
    getSecurityBaseline,
    
    // Quick access
    encrypt: (data, key) => getSecurityBaseline().encrypt(data, key),
    decrypt: (data, key) => getSecurityBaseline().decrypt(data, key),
    hash: (data) => getSecurityBaseline().hash(data),
    generateToken: (bytes) => getSecurityBaseline().generateToken(bytes),
    createAPIKey: (userId, role) => getSecurityBaseline().createAPIKey(userId, role),
    validateAPIKey: (key) => getSecurityBaseline().validateAPIKey(key)
};

console.log('✅ Step 3/50: Security Baseline loaded');
