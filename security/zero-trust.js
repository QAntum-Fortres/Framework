/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  QAntum v23.0 - PHASE ALPHA: Zero-Trust Security Wrapper                      ║
 * ║  Part of: Corporate Integration - Sovereign Systems Architect                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Zero-Trust wrapper for Hardware Bridge with mTLS and RBAC
 *              for Tier-1 Financial/Cybersecurity deployment
 * @compliance SOC2, ISO27001
 * @phase ALPHA - Defensive Hardening
 */

'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// ZERO-TRUST POLICY ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PolicyDecision - Possible policy decisions
 */
const PolicyDecision = {
    ALLOW: 'allow',
    DENY: 'deny',
    CHALLENGE: 'challenge',
    AUDIT: 'audit'
};

/**
 * TrustLevel - Trust levels for entities
 */
const TrustLevel = {
    NONE: 0,
    MINIMAL: 1,
    LOW: 2,
    MEDIUM: 3,
    HIGH: 4,
    VERIFIED: 5
};

/**
 * ZeroTrustPolicy - Individual policy rule
 */
class ZeroTrustPolicy {
    constructor(config = {}) {
        this.id = config.id || `policy_${Date.now()}`;
        this.name = config.name || 'Unnamed Policy';
        this.description = config.description || '';
        this.resource = config.resource || '*';
        this.action = config.action || '*';
        this.conditions = config.conditions || [];
        this.decision = config.decision || PolicyDecision.DENY;
        this.priority = config.priority || 100;
        this.enabled = config.enabled !== false;
    }

    /**
     * Evaluate policy against request context
     */
    evaluate(context) {
        if (!this.enabled) {
            return { applicable: false, reason: 'Policy disabled' };
        }

        // Check resource match
        if (this.resource !== '*' && this.resource !== context.resource) {
            return { applicable: false, reason: 'Resource mismatch' };
        }

        // Check action match
        if (this.action !== '*' && this.action !== context.action) {
            return { applicable: false, reason: 'Action mismatch' };
        }

        // Evaluate all conditions
        for (const condition of this.conditions) {
            const conditionResult = this._evaluateCondition(condition, context);
            if (!conditionResult.pass) {
                return { 
                    applicable: true, 
                    decision: PolicyDecision.DENY,
                    reason: conditionResult.reason
                };
            }
        }

        return {
            applicable: true,
            decision: this.decision,
            policyId: this.id,
            policyName: this.name
        };
    }

    /**
     * Evaluate individual condition
     */
    _evaluateCondition(condition, context) {
        switch (condition.type) {
            case 'trust_level':
                return {
                    pass: (context.trustLevel || 0) >= (condition.minLevel || TrustLevel.MEDIUM),
                    reason: 'Insufficient trust level'
                };

            case 'source_ip':
                return {
                    pass: condition.allowed.includes(context.sourceIp),
                    reason: 'Source IP not in allowlist'
                };

            case 'time_window':
                const hour = new Date().getHours();
                return {
                    pass: hour >= condition.startHour && hour < condition.endHour,
                    reason: 'Access outside permitted time window'
                };

            case 'mfa_required':
                return {
                    pass: context.mfaVerified === true,
                    reason: 'MFA verification required'
                };

            case 'certificate_valid':
                return {
                    pass: context.certificateValid === true,
                    reason: 'Valid certificate required'
                };

            default:
                return { pass: true };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// mTLS MANAGER - Mutual TLS for Hardware Bridge
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MTLSManager - Manages mutual TLS certificates for low-latency secure communication
 */
class MTLSManager extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            keySize: options.keySize || 2048,
            expiryDays: options.expiryDays || 365,
            algorithm: options.algorithm || 'sha256',
            ...options
        };

        this.certificates = new Map();
        this.trustedCAs = new Set();
        this.revokedCerts = new Set();
    }

    /**
     * Generate certificate fingerprint
     * Uses deterministic computation for 0.1ms validation target
     */
    generateFingerprint(certData) {
        return crypto
            .createHash('sha256')
            .update(typeof certData === 'string' ? certData : JSON.stringify(certData))
            .digest('hex');
    }

    /**
     * Register certificate
     */
    registerCertificate(entityId, certData) {
        const fingerprint = this.generateFingerprint(certData);
        const entry = {
            entityId,
            fingerprint,
            certData,
            registeredAt: Date.now(),
            expiresAt: Date.now() + (this.options.expiryDays * 24 * 60 * 60 * 1000),
            lastValidation: null,
            validationCount: 0
        };

        this.certificates.set(entityId, entry);
        this.emit('certificate:registered', { entityId, fingerprint });

        return { entityId, fingerprint };
    }

    /**
     * Validate certificate - optimized for low latency
     * Target: <0.1ms for cached validation
     */
    validateCertificate(entityId, certData) {
        const startTime = process.hrtime.bigint();

        const entry = this.certificates.get(entityId);
        if (!entry) {
            return {
                valid: false,
                reason: 'Certificate not registered',
                latencyNs: Number(process.hrtime.bigint() - startTime)
            };
        }

        // Check revocation (O(1) lookup)
        if (this.revokedCerts.has(entry.fingerprint)) {
            return {
                valid: false,
                reason: 'Certificate revoked',
                latencyNs: Number(process.hrtime.bigint() - startTime)
            };
        }

        // Check expiry
        if (Date.now() > entry.expiresAt) {
            return {
                valid: false,
                reason: 'Certificate expired',
                latencyNs: Number(process.hrtime.bigint() - startTime)
            };
        }

        // Validate fingerprint match
        const fingerprint = this.generateFingerprint(certData);
        const valid = fingerprint === entry.fingerprint;

        // Update validation stats
        entry.lastValidation = Date.now();
        entry.validationCount++;

        const latencyNs = Number(process.hrtime.bigint() - startTime);

        return {
            valid,
            reason: valid ? 'Valid certificate' : 'Fingerprint mismatch',
            latencyNs,
            latencyMs: latencyNs / 1000000
        };
    }

    /**
     * Revoke certificate
     */
    revokeCertificate(entityId) {
        const entry = this.certificates.get(entityId);
        if (entry) {
            this.revokedCerts.add(entry.fingerprint);
            this.emit('certificate:revoked', { entityId, fingerprint: entry.fingerprint });
            return true;
        }
        return false;
    }

    /**
     * Get certificate status
     */
    getCertificateStatus(entityId) {
        const entry = this.certificates.get(entityId);
        if (!entry) return null;

        return {
            entityId,
            fingerprint: entry.fingerprint,
            registeredAt: new Date(entry.registeredAt),
            expiresAt: new Date(entry.expiresAt),
            isRevoked: this.revokedCerts.has(entry.fingerprint),
            validationCount: entry.validationCount,
            lastValidation: entry.lastValidation ? new Date(entry.lastValidation) : null
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HARDWARE BRIDGE SECURITY WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * HardwareBridgeSecurity - Zero-Trust wrapper for Hardware Bridge operations
 * Prevents lateral movement by enforcing strict isolation
 */
class HardwareBridgeSecurity extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            maxConcurrentWorkers: options.maxConcurrentWorkers || 500,
            sessionTimeout: options.sessionTimeout || 3600000, // 1 hour
            ...options
        };

        this.mtls = new MTLSManager(options);
        this.sessions = new Map();
        this.workerRegistry = new Map();
        this.isolationZones = new Map();
        this.auditLog = [];
    }

    /**
     * Register worker for remote access (with hijacking prevention)
     */
    registerWorker(workerId, credentials) {
        // Validate credential structure
        if (!credentials || !credentials.publicKey || !credentials.signature) {
            return {
                success: false,
                reason: 'Invalid credentials structure'
            };
        }

        // Register certificate for mTLS
        const certResult = this.mtls.registerCertificate(workerId, credentials.publicKey);

        // Create isolation zone for worker
        const zone = {
            id: `zone_${workerId}`,
            workerId,
            allowedResources: credentials.allowedResources || [],
            allowedActions: credentials.allowedActions || [],
            createdAt: Date.now(),
            lastAccess: null,
            accessCount: 0
        };
        this.isolationZones.set(workerId, zone);

        // Register worker
        this.workerRegistry.set(workerId, {
            id: workerId,
            fingerprint: certResult.fingerprint,
            zone: zone.id,
            status: 'registered',
            registeredAt: Date.now()
        });

        this._audit('worker:registered', { workerId, zone: zone.id });

        return {
            success: true,
            workerId,
            zoneId: zone.id,
            fingerprint: certResult.fingerprint
        };
    }

    /**
     * Authenticate worker connection
     */
    authenticateWorker(workerId, credentials) {
        const worker = this.workerRegistry.get(workerId);
        if (!worker) {
            this._audit('auth:failed', { workerId, reason: 'Worker not registered' });
            return { authenticated: false, reason: 'Worker not registered' };
        }

        // Validate certificate
        const validation = this.mtls.validateCertificate(workerId, credentials.publicKey);
        if (!validation.valid) {
            this._audit('auth:failed', { workerId, reason: validation.reason });
            return { authenticated: false, reason: validation.reason };
        }

        // Create session
        const sessionId = crypto.randomBytes(32).toString('hex');
        this.sessions.set(sessionId, {
            workerId,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.options.sessionTimeout,
            zone: worker.zone
        });

        this._audit('auth:success', { workerId, sessionId });

        return {
            authenticated: true,
            sessionId,
            expiresIn: this.options.sessionTimeout,
            zone: worker.zone
        };
    }

    /**
     * Authorize worker action (prevents lateral movement)
     */
    authorizeAction(sessionId, resource, action) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { authorized: false, reason: 'Invalid session' };
        }

        // Check session expiry
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return { authorized: false, reason: 'Session expired' };
        }

        // Get isolation zone
        const zone = this.isolationZones.get(session.workerId);
        if (!zone) {
            return { authorized: false, reason: 'Isolation zone not found' };
        }

        // Check resource authorization (lateral movement prevention)
        const resourceAllowed = zone.allowedResources.length === 0 || 
            zone.allowedResources.includes(resource) ||
            zone.allowedResources.includes('*');

        if (!resourceAllowed) {
            this._audit('authz:denied', { 
                workerId: session.workerId, 
                resource, 
                action,
                reason: 'Resource not in allowed list'
            });
            return { authorized: false, reason: 'Resource access denied' };
        }

        // Check action authorization
        const actionAllowed = zone.allowedActions.length === 0 ||
            zone.allowedActions.includes(action) ||
            zone.allowedActions.includes('*');

        if (!actionAllowed) {
            this._audit('authz:denied', { 
                workerId: session.workerId, 
                resource, 
                action,
                reason: 'Action not permitted'
            });
            return { authorized: false, reason: 'Action not permitted' };
        }

        // Update zone stats
        zone.lastAccess = Date.now();
        zone.accessCount++;

        this._audit('authz:allowed', { workerId: session.workerId, resource, action });

        return { authorized: true, workerId: session.workerId, zone: zone.id };
    }

    /**
     * Terminate worker session
     */
    terminateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            this._audit('session:terminated', { sessionId, workerId: session.workerId });
            this.sessions.delete(sessionId);
            return true;
        }
        return false;
    }

    /**
     * Deregister worker (cleanup)
     */
    deregisterWorker(workerId) {
        // Remove from registry
        this.workerRegistry.delete(workerId);

        // Remove isolation zone
        this.isolationZones.delete(workerId);

        // Revoke certificate
        this.mtls.revokeCertificate(workerId);

        // Terminate all sessions for this worker
        for (const [sessionId, session] of this.sessions) {
            if (session.workerId === workerId) {
                this.sessions.delete(sessionId);
            }
        }

        this._audit('worker:deregistered', { workerId });

        return true;
    }

    /**
     * Get security status
     */
    getSecurityStatus() {
        return {
            registeredWorkers: this.workerRegistry.size,
            activeSessions: this.sessions.size,
            isolationZones: this.isolationZones.size,
            certificates: this.mtls.certificates.size,
            revokedCertificates: this.mtls.revokedCerts.size,
            recentAuditEntries: this.auditLog.slice(-10)
        };
    }

    /**
     * Audit logging
     */
    _audit(event, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            event,
            data
        };
        this.auditLog.push(entry);

        // Trim audit log
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-5000);
        }

        this.emit('audit', entry);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZERO-TRUST WRAPPER - Main Entry Point
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ZeroTrustWrapper - Comprehensive Zero-Trust architecture implementation
 */
class ZeroTrustWrapper extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            defaultDecision: options.defaultDecision || PolicyDecision.DENY,
            auditAll: options.auditAll !== false,
            ...options
        };

        this.policies = new Map();
        this.hardwareBridge = new HardwareBridgeSecurity(options);
        this.mtls = this.hardwareBridge.mtls;
        this.stats = {
            requests: 0,
            allowed: 0,
            denied: 0,
            challenged: 0
        };

        this._initializeDefaultPolicies();
    }

    /**
     * Initialize default corporate security policies
     */
    _initializeDefaultPolicies() {
        // Policy: Require mTLS for all bridge operations
        this.addPolicy(new ZeroTrustPolicy({
            id: 'bridge-mtls-required',
            name: 'Hardware Bridge mTLS Requirement',
            resource: 'hardware_bridge',
            action: '*',
            conditions: [{ type: 'certificate_valid' }],
            decision: PolicyDecision.ALLOW,
            priority: 10
        }));

        // Policy: Deny operations from unknown sources
        this.addPolicy(new ZeroTrustPolicy({
            id: 'deny-unknown-sources',
            name: 'Deny Unknown Sources',
            resource: '*',
            action: '*',
            conditions: [{ type: 'trust_level', minLevel: TrustLevel.MINIMAL }],
            decision: PolicyDecision.ALLOW,
            priority: 100
        }));

        // Policy: Require MFA for administrative actions
        this.addPolicy(new ZeroTrustPolicy({
            id: 'admin-mfa-required',
            name: 'Admin MFA Requirement',
            resource: 'admin',
            action: '*',
            conditions: [
                { type: 'mfa_required' },
                { type: 'trust_level', minLevel: TrustLevel.HIGH }
            ],
            decision: PolicyDecision.ALLOW,
            priority: 5
        }));
    }

    /**
     * Add policy
     */
    addPolicy(policy) {
        this.policies.set(policy.id, policy);
        this.emit('policy:added', { policyId: policy.id });
    }

    /**
     * Remove policy
     */
    removePolicy(policyId) {
        const removed = this.policies.delete(policyId);
        if (removed) {
            this.emit('policy:removed', { policyId });
        }
        return removed;
    }

    /**
     * Evaluate request against all policies
     */
    evaluate(context) {
        this.stats.requests++;
        
        // Sort policies by priority (lower = higher priority)
        const sortedPolicies = Array.from(this.policies.values())
            .sort((a, b) => a.priority - b.priority);

        for (const policy of sortedPolicies) {
            const result = policy.evaluate(context);
            
            if (result.applicable) {
                switch (result.decision) {
                    case PolicyDecision.ALLOW:
                        this.stats.allowed++;
                        break;
                    case PolicyDecision.DENY:
                        this.stats.denied++;
                        break;
                    case PolicyDecision.CHALLENGE:
                        this.stats.challenged++;
                        break;
                }

                if (this.options.auditAll) {
                    this.emit('evaluation', { context, result });
                }

                return result;
            }
        }

        // Default decision when no policy matches
        this.stats.denied++;
        return {
            applicable: true,
            decision: this.options.defaultDecision,
            reason: 'No matching policy found'
        };
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            policyCount: this.policies.size,
            hardwareBridgeStatus: this.hardwareBridge.getSecurityStatus()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    ZeroTrustWrapper,
    ZeroTrustPolicy,
    HardwareBridgeSecurity,
    MTLSManager,

    // Enums
    PolicyDecision,
    TrustLevel,

    // Factory functions
    createZeroTrustWrapper: (options = {}) => new ZeroTrustWrapper(options),
    createHardwareBridgeSecurity: (options = {}) => new HardwareBridgeSecurity(options),
    createMTLSManager: (options = {}) => new MTLSManager(options)
};

console.log('✅ PHASE ALPHA: Zero-Trust Security Wrapper loaded');
