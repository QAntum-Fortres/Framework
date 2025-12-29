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
