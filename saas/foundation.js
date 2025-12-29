/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 36/50: SaaS Foundation                             ║
 * ║  Part of: Phase 3 - Domination                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Enterprise SaaS Platform Foundation
 * @phase 3 - Domination
 * @step 36 of 50
 */

'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// TENANT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TenantTier - Subscription tiers
 */
const TenantTier = {
    FREE: 'free',
    STARTER: 'starter',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise',
    UNLIMITED: 'unlimited'
};

/**
 * TenantStatus - Tenant status
 */
const TenantStatus = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TRIAL: 'trial',
    CANCELLED: 'cancelled'
};

// ═══════════════════════════════════════════════════════════════════════════════
// TENANT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tenant - SaaS tenant entity
 */
class Tenant {
    constructor(data = {}) {
        this.id = data.id || `tenant_${Date.now()}`;
        this.name = data.name || 'Unnamed Tenant';
        this.slug = data.slug || this._generateSlug(this.name);
        this.tier = data.tier || TenantTier.FREE;
        this.status = data.status || TenantStatus.TRIAL;
        
        this.owner = data.owner || null;
        this.members = data.members || [];
        this.settings = data.settings || {};
        
        this.limits = this._getLimits(this.tier);
        this.usage = {
            tests: 0,
            storage: 0,
            apiCalls: 0,
            agents: 0
        };
        
        this.createdAt = data.createdAt || new Date();
        this.trialEndsAt = data.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        
        this.metadata = data.metadata || {};
    }

    /**
     * Generate slug
     */
    _generateSlug(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Get tier limits
     */
    _getLimits(tier) {
        const limits = {
            [TenantTier.FREE]: {
                tests: 100,
                storage: 100 * 1024 * 1024, // 100 MB
                apiCalls: 1000,
                agents: 1,
                features: ['basic']
            },
            [TenantTier.STARTER]: {
                tests: 1000,
                storage: 1024 * 1024 * 1024, // 1 GB
                apiCalls: 10000,
                agents: 3,
                features: ['basic', 'reports', 'integrations']
            },
            [TenantTier.PROFESSIONAL]: {
                tests: 10000,
                storage: 10 * 1024 * 1024 * 1024, // 10 GB
                apiCalls: 100000,
                agents: 10,
                features: ['basic', 'reports', 'integrations', 'ai', 'parallel']
            },
            [TenantTier.ENTERPRISE]: {
                tests: -1, // Unlimited
                storage: 100 * 1024 * 1024 * 1024, // 100 GB
                apiCalls: -1,
                agents: -1,
                features: ['all']
            },
            [TenantTier.UNLIMITED]: {
                tests: -1,
                storage: -1,
                apiCalls: -1,
                agents: -1,
                features: ['all']
            }
        };
        
        return limits[tier] || limits[TenantTier.FREE];
    }

    /**
     * Check if within limits
     */
    checkLimit(resource) {
        const limit = this.limits[resource];
        if (limit === -1) return true;
        return this.usage[resource] < limit;
    }

    /**
     * Increment usage
     */
    incrementUsage(resource, amount = 1) {
        if (this.checkLimit(resource)) {
            this.usage[resource] += amount;
            return true;
        }
        return false;
    }

    /**
     * Has feature
     */
    hasFeature(feature) {
        return this.limits.features.includes('all') || 
               this.limits.features.includes(feature);
    }

    /**
     * Upgrade tier
     */
    upgradeTier(newTier) {
        this.tier = newTier;
        this.limits = this._getLimits(newTier);
        return this;
    }

    /**
     * Add member
     */
    addMember(userId, role = 'member') {
        this.members.push({ userId, role, addedAt: new Date() });
        return this;
    }

    /**
     * To JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug,
            tier: this.tier,
            status: this.status,
            limits: this.limits,
            usage: this.usage,
            createdAt: this.createdAt
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TENANT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TenantManager - Multi-tenancy management
 */
class TenantManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            isolationMode: options.isolationMode || 'database', // 'database' | 'schema' | 'row'
            ...options
        };
        
        this.tenants = new Map();
        this.tenantsBySlug = new Map();
    }

    /**
     * Create tenant
     */
    create(data) {
        const tenant = new Tenant(data);
        
        this.tenants.set(tenant.id, tenant);
        this.tenantsBySlug.set(tenant.slug, tenant);
        
        this.emit('created', { tenant });
        
        return tenant;
    }

    /**
     * Get tenant by ID
     */
    get(id) {
        return this.tenants.get(id);
    }

    /**
     * Get tenant by slug
     */
    getBySlug(slug) {
        return this.tenantsBySlug.get(slug);
    }

    /**
     * Update tenant
     */
    update(id, data) {
        const tenant = this.tenants.get(id);
        if (!tenant) return null;
        
        Object.assign(tenant, data);
        this.emit('updated', { tenant });
        
        return tenant;
    }

    /**
     * Delete tenant
     */
    delete(id) {
        const tenant = this.tenants.get(id);
        if (!tenant) return false;
        
        this.tenants.delete(id);
        this.tenantsBySlug.delete(tenant.slug);
        
        this.emit('deleted', { tenantId: id });
        
        return true;
    }

    /**
     * List tenants
     */
    list(filter = {}) {
        let tenants = Array.from(this.tenants.values());
        
        if (filter.tier) {
            tenants = tenants.filter(t => t.tier === filter.tier);
        }
        
        if (filter.status) {
            tenants = tenants.filter(t => t.status === filter.status);
        }
        
        return tenants;
    }

    /**
     * Get context for tenant
     */
    getContext(tenantId) {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) return null;
        
        return {
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            tier: tenant.tier,
            limits: tenant.limits,
            features: tenant.limits.features
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SubscriptionManager - Billing and subscriptions
 */
class SubscriptionManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        this.subscriptions = new Map();
        
        this.pricing = {
            [TenantTier.FREE]: { monthly: 0, yearly: 0 },
            [TenantTier.STARTER]: { monthly: 29, yearly: 290 },
            [TenantTier.PROFESSIONAL]: { monthly: 99, yearly: 990 },
            [TenantTier.ENTERPRISE]: { monthly: 499, yearly: 4990 },
            [TenantTier.UNLIMITED]: { monthly: 999, yearly: 9990 }
        };
    }

    /**
     * Create subscription
     */
    createSubscription(tenantId, tier, billingCycle = 'monthly') {
        const subscription = {
            id: `sub_${Date.now()}`,
            tenantId,
            tier,
            billingCycle,
            amount: this.pricing[tier][billingCycle],
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: this._getNextBillingDate(billingCycle),
            createdAt: new Date()
        };
        
        this.subscriptions.set(subscription.id, subscription);
        this.emit('created', { subscription });
        
        return subscription;
    }

    /**
     * Get next billing date
     */
    _getNextBillingDate(cycle) {
        const now = new Date();
        if (cycle === 'yearly') {
            return new Date(now.setFullYear(now.getFullYear() + 1));
        }
        return new Date(now.setMonth(now.getMonth() + 1));
    }

    /**
     * Cancel subscription
     */
    cancel(subscriptionId) {
        const sub = this.subscriptions.get(subscriptionId);
        if (sub) {
            sub.status = 'cancelled';
            sub.cancelledAt = new Date();
            this.emit('cancelled', { subscription: sub });
        }
        return sub;
    }

    /**
     * Upgrade subscription
     */
    upgrade(subscriptionId, newTier) {
        const sub = this.subscriptions.get(subscriptionId);
        if (sub) {
            const oldTier = sub.tier;
            sub.tier = newTier;
            sub.amount = this.pricing[newTier][sub.billingCycle];
            this.emit('upgraded', { subscription: sub, oldTier, newTier });
        }
        return sub;
    }

    /**
     * Get subscription by tenant
     */
    getByTenant(tenantId) {
        return Array.from(this.subscriptions.values())
            .find(s => s.tenantId === tenantId && s.status === 'active');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// API KEY MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ApiKeyManager - API key management
 */
class ApiKeyManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        this.keys = new Map();
    }

    /**
     * Generate API key
     */
    generate(tenantId, name, scopes = ['read']) {
        const key = {
            id: `key_${Date.now()}`,
            tenantId,
            name,
            key: `mm_${crypto.randomBytes(32).toString('hex')}`,
            scopes,
            createdAt: new Date(),
            lastUsedAt: null,
            usageCount: 0
        };
        
        this.keys.set(key.id, key);
        this.emit('generated', { keyId: key.id, tenantId });
        
        return key;
    }

    /**
     * Validate API key
     */
    validate(apiKey) {
        for (const key of this.keys.values()) {
            if (key.key === apiKey) {
                key.lastUsedAt = new Date();
                key.usageCount++;
                return key;
            }
        }
        return null;
    }

    /**
     * Revoke API key
     */
    revoke(keyId) {
        const deleted = this.keys.delete(keyId);
        if (deleted) {
            this.emit('revoked', { keyId });
        }
        return deleted;
    }

    /**
     * List keys by tenant
     */
    listByTenant(tenantId) {
        return Array.from(this.keys.values())
            .filter(k => k.tenantId === tenantId)
            .map(k => ({ ...k, key: `${k.key.substring(0, 10)}...` })); // Mask key
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SAAS PLATFORM
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SaaSPlatform - Main SaaS orchestrator
 */
class SaaSPlatform extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        
        this.tenantManager = new TenantManager(options);
        this.subscriptionManager = new SubscriptionManager(options);
        this.apiKeyManager = new ApiKeyManager(options);
        
        this.currentTenant = null;
    }

    /**
     * Onboard new tenant
     */
    async onboard(data) {
        // Create tenant
        const tenant = this.tenantManager.create(data);
        
        // Create subscription
        const subscription = this.subscriptionManager.createSubscription(
            tenant.id,
            data.tier || TenantTier.TRIAL,
            data.billingCycle || 'monthly'
        );
        
        // Generate API key
        const apiKey = this.apiKeyManager.generate(
            tenant.id,
            'Default Key',
            ['read', 'write']
        );
        
        this.emit('onboarded', { tenant, subscription, apiKey });
        
        return {
            tenant,
            subscription,
            apiKey: apiKey.key
        };
    }

    /**
     * Set current tenant context
     */
    setContext(tenantId) {
        this.currentTenant = this.tenantManager.get(tenantId);
        return this.currentTenant;
    }

    /**
     * Get current tenant
     */
    getCurrentTenant() {
        return this.currentTenant;
    }

    /**
     * Check feature access
     */
    hasFeature(feature) {
        if (!this.currentTenant) return false;
        return this.currentTenant.hasFeature(feature);
    }

    /**
     * Check limit
     */
    checkLimit(resource) {
        if (!this.currentTenant) return false;
        return this.currentTenant.checkLimit(resource);
    }

    /**
     * Get platform metrics
     */
    getMetrics() {
        const tenants = this.tenantManager.list();
        
        return {
            totalTenants: tenants.length,
            byTier: {
                free: tenants.filter(t => t.tier === TenantTier.FREE).length,
                starter: tenants.filter(t => t.tier === TenantTier.STARTER).length,
                professional: tenants.filter(t => t.tier === TenantTier.PROFESSIONAL).length,
                enterprise: tenants.filter(t => t.tier === TenantTier.ENTERPRISE).length
            },
            activeSubscriptions: Array.from(this.subscriptionManager.subscriptions.values())
                .filter(s => s.status === 'active').length
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultPlatform = null;

module.exports = {
    // Classes
    Tenant,
    TenantManager,
    SubscriptionManager,
    ApiKeyManager,
    SaaSPlatform,
    
    // Types
    TenantTier,
    TenantStatus,
    
    // Factory
    createPlatform: (options = {}) => new SaaSPlatform(options),
    createTenantManager: (options = {}) => new TenantManager(options),
    
    // Singleton
    getPlatform: (options = {}) => {
        if (!defaultPlatform) {
            defaultPlatform = new SaaSPlatform(options);
        }
        return defaultPlatform;
    }
};

console.log('✅ Step 36/50: SaaS Foundation loaded');
