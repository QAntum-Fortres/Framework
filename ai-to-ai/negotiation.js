/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 42/50: AI-to-AI Negotiation                        ║
 * ║  Part of: Phase 3 - Domination                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description AI-to-AI Negotiation and Communication System
 * @phase 3 - Domination
 * @step 42 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// NEGOTIATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NegotiationType - Types of negotiations
 */
const NegotiationType = {
    RESOURCE: 'resource',
    TASK: 'task',
    PRIORITY: 'priority',
    STRATEGY: 'strategy',
    CONTRACT: 'contract'
};

/**
 * NegotiationState - States of negotiation
 */
const NegotiationState = {
    INITIATED: 'initiated',
    PROPOSING: 'proposing',
    COUNTER_OFFER: 'counter_offer',
    ACCEPTED: 'accepted',
    REJECTED: 'rejected',
    DEADLOCK: 'deadlock',
    COMPLETED: 'completed'
};

/**
 * AgentRole - Agent roles in negotiation
 */
const AgentRole = {
    INITIATOR: 'initiator',
    RESPONDER: 'responder',
    MEDIATOR: 'mediator',
    OBSERVER: 'observer'
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROPOSAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Proposal - Negotiation proposal
 */
class Proposal {
    constructor(config = {}) {
        this.id = config.id || `prop-${Date.now()}`;
        this.fromAgent = config.fromAgent;
        this.toAgent = config.toAgent;
        this.type = config.type || NegotiationType.RESOURCE;
        
        this.terms = {
            offered: config.offered || {},
            requested: config.requested || {},
            constraints: config.constraints || [],
            ...config.terms
        };
        
        this.utility = config.utility || 0;
        this.createdAt = new Date();
        this.expiresAt = config.expiresAt || new Date(Date.now() + 60000);
    }

    /**
     * Check if expired
     */
    isExpired() {
        return new Date() > this.expiresAt;
    }

    /**
     * Clone proposal
     */
    clone() {
        return new Proposal({
            fromAgent: this.fromAgent,
            toAgent: this.toAgent,
            type: this.type,
            terms: JSON.parse(JSON.stringify(this.terms)),
            utility: this.utility
        });
    }

    /**
     * Create counter proposal
     */
    createCounter(modifications = {}) {
        const counter = this.clone();
        counter.id = `prop-${Date.now()}`;
        counter.fromAgent = this.toAgent;
        counter.toAgent = this.fromAgent;
        counter.terms = { ...counter.terms, ...modifications };
        counter.createdAt = new Date();
        return counter;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEGOTIATOR AGENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NegotiatorAgent - AI negotiation agent
 */
class NegotiatorAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.id = config.id || `agent-${Date.now()}`;
        this.name = config.name || 'Negotiator';
        this.role = config.role || AgentRole.RESPONDER;
        
        // Negotiation preferences
        this.preferences = {
            priorities: config.priorities || {},
            reservationValue: config.reservationValue || 0.3,
            concessionRate: config.concessionRate || 0.1,
            ...config.preferences
        };
        
        // Strategy
        this.strategy = config.strategy || 'tit-for-tat';
        
        // State
        this.activeNegotiations = new Map();
        this.history = [];
    }

    /**
     * Calculate utility of proposal
     */
    calculateUtility(proposal) {
        let utility = 0;
        
        // Calculate based on what we receive
        for (const [key, value] of Object.entries(proposal.terms.offered)) {
            const weight = this.preferences.priorities[key] || 1;
            utility += value * weight;
        }
        
        // Subtract what we give
        for (const [key, value] of Object.entries(proposal.terms.requested)) {
            const weight = this.preferences.priorities[key] || 1;
            utility -= value * weight * 0.8;
        }
        
        return Math.max(0, Math.min(1, utility / 10));
    }

    /**
     * Evaluate proposal
     */
    evaluate(proposal) {
        const utility = this.calculateUtility(proposal);
        
        return {
            utility,
            acceptable: utility >= this.preferences.reservationValue,
            recommendation: utility >= 0.7 ? 'accept' : 
                          utility >= 0.4 ? 'counter' : 'reject'
        };
    }

    /**
     * Generate proposal
     */
    generateProposal(targetAgent, negotiationType, goals = {}) {
        const proposal = new Proposal({
            fromAgent: this.id,
            toAgent: targetAgent,
            type: negotiationType,
            terms: {
                offered: goals.offer || {},
                requested: goals.request || {},
                constraints: goals.constraints || []
            }
        });
        
        proposal.utility = this.calculateUtility(proposal);
        
        return proposal;
    }

    /**
     * Generate counter proposal
     */
    generateCounter(proposal, evaluation) {
        const concession = this.preferences.concessionRate;
        
        // Modify terms based on strategy
        const modifications = {
            offered: { ...proposal.terms.requested },
            requested: { ...proposal.terms.offered }
        };
        
        // Apply concession to our requests
        for (const key of Object.keys(modifications.requested)) {
            modifications.requested[key] *= (1 - concession);
        }
        
        // Increase our offer slightly
        for (const key of Object.keys(modifications.offered)) {
            modifications.offered[key] *= (1 + concession * 0.5);
        }
        
        return proposal.createCounter({ 
            offered: modifications.offered,
            requested: modifications.requested 
        });
    }

    /**
     * Respond to proposal
     */
    respond(proposal) {
        const evaluation = this.evaluate(proposal);
        
        this.history.push({
            proposal,
            evaluation,
            timestamp: new Date()
        });
        
        if (evaluation.acceptable) {
            this.emit('accept', { proposal, evaluation });
            return { action: 'accept', proposal };
        } else if (evaluation.recommendation === 'counter') {
            const counter = this.generateCounter(proposal, evaluation);
            this.emit('counter', { original: proposal, counter, evaluation });
            return { action: 'counter', proposal: counter };
        } else {
            this.emit('reject', { proposal, evaluation });
            return { action: 'reject', reason: 'Below reservation value' };
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEGOTIATION SESSION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NegotiationSession - Multi-round negotiation session
 */
class NegotiationSession extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.id = config.id || `session-${Date.now()}`;
        this.type = config.type || NegotiationType.RESOURCE;
        this.state = NegotiationState.INITIATED;
        
        this.participants = new Map();
        this.proposals = [];
        this.rounds = 0;
        this.maxRounds = config.maxRounds || 10;
        
        this.outcome = null;
        this.startedAt = new Date();
        this.completedAt = null;
    }

    /**
     * Add participant
     */
    addParticipant(agent, role = AgentRole.RESPONDER) {
        this.participants.set(agent.id, { agent, role });
    }

    /**
     * Submit proposal
     */
    submitProposal(proposal) {
        this.proposals.push(proposal);
        this.rounds++;
        this.state = NegotiationState.PROPOSING;
        
        this.emit('proposalSubmitted', { proposal, round: this.rounds });
        
        // Get response from target agent
        const target = this.participants.get(proposal.toAgent);
        if (target) {
            const response = target.agent.respond(proposal);
            return this._processResponse(response, proposal);
        }
        
        return null;
    }

    /**
     * Process response
     */
    _processResponse(response, originalProposal) {
        switch (response.action) {
            case 'accept':
                this.state = NegotiationState.ACCEPTED;
                this.outcome = {
                    success: true,
                    agreement: originalProposal,
                    rounds: this.rounds
                };
                this.completedAt = new Date();
                this.emit('accepted', { proposal: originalProposal });
                break;
                
            case 'counter':
                this.state = NegotiationState.COUNTER_OFFER;
                this.proposals.push(response.proposal);
                this.emit('counterOffer', { 
                    original: originalProposal, 
                    counter: response.proposal 
                });
                
                // Check for deadlock
                if (this.rounds >= this.maxRounds) {
                    this.state = NegotiationState.DEADLOCK;
                    this.outcome = {
                        success: false,
                        reason: 'Max rounds reached'
                    };
                    this.completedAt = new Date();
                    this.emit('deadlock', { rounds: this.rounds });
                }
                break;
                
            case 'reject':
                this.state = NegotiationState.REJECTED;
                this.outcome = {
                    success: false,
                    reason: response.reason
                };
                this.completedAt = new Date();
                this.emit('rejected', { reason: response.reason });
                break;
        }
        
        return this.outcome;
    }

    /**
     * Run auto-negotiation
     */
    async autoNegotiate(initiatorProposal) {
        let currentProposal = initiatorProposal;
        let currentAgent = initiatorProposal.toAgent;
        
        while (this.state !== NegotiationState.ACCEPTED && 
               this.state !== NegotiationState.REJECTED &&
               this.state !== NegotiationState.DEADLOCK) {
            
            const target = this.participants.get(currentAgent);
            if (!target) break;
            
            const response = target.agent.respond(currentProposal);
            const result = this._processResponse(response, currentProposal);
            
            if (result) break;
            
            // Switch agents for next round
            currentProposal = response.proposal;
            currentAgent = currentProposal.toAgent;
        }
        
        return this.outcome;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEGOTIATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * NegotiationEngine - Main negotiation coordinator
 */
class NegotiationEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        this.agents = new Map();
        this.sessions = new Map();
        this.protocols = new Map();
        
        this._initDefaultProtocols();
    }

    /**
     * Initialize default protocols
     */
    _initDefaultProtocols() {
        this.protocols.set('alternating-offers', {
            name: 'Alternating Offers',
            maxRounds: 10,
            timeout: 60000
        });
        
        this.protocols.set('auction', {
            name: 'Auction',
            maxRounds: 20,
            bidIncrement: 0.1
        });
        
        this.protocols.set('contract-net', {
            name: 'Contract Net',
            phases: ['announce', 'bid', 'award', 'confirm']
        });
    }

    /**
     * Register agent
     */
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
        this.emit('agentRegistered', { agent });
    }

    /**
     * Create session
     */
    createSession(config = {}) {
        const session = new NegotiationSession({
            type: config.type,
            maxRounds: config.maxRounds || 10
        });
        
        // Add participants
        for (const participantId of (config.participants || [])) {
            const agent = this.agents.get(participantId);
            if (agent) {
                session.addParticipant(agent, config.roles?.[participantId]);
            }
        }
        
        this.sessions.set(session.id, session);
        this.emit('sessionCreated', { session });
        
        return session;
    }

    /**
     * Start negotiation
     */
    async negotiate(initiatorId, responderId, goals = {}) {
        const initiator = this.agents.get(initiatorId);
        const responder = this.agents.get(responderId);
        
        if (!initiator || !responder) {
            throw new Error('Agents not found');
        }
        
        // Create session
        const session = this.createSession({
            type: goals.type || NegotiationType.RESOURCE,
            participants: [initiatorId, responderId],
            roles: {
                [initiatorId]: AgentRole.INITIATOR,
                [responderId]: AgentRole.RESPONDER
            }
        });
        
        // Generate initial proposal
        const proposal = initiator.generateProposal(
            responderId,
            goals.type || NegotiationType.RESOURCE,
            goals
        );
        
        // Run negotiation
        const result = await session.autoNegotiate(proposal);
        
        this.emit('negotiationComplete', { session, result });
        
        return result;
    }

    /**
     * Get session
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    /**
     * Get stats
     */
    getStats() {
        const sessions = [...this.sessions.values()];
        
        return {
            agents: this.agents.size,
            totalSessions: sessions.length,
            successful: sessions.filter(s => s.outcome?.success).length,
            failed: sessions.filter(s => s.outcome && !s.outcome.success).length,
            avgRounds: sessions.reduce((sum, s) => sum + s.rounds, 0) / sessions.length || 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    Proposal,
    NegotiatorAgent,
    NegotiationSession,
    NegotiationEngine,
    
    // Types
    NegotiationType,
    NegotiationState,
    AgentRole,
    
    // Factory
    createEngine: (options = {}) => new NegotiationEngine(options),
    createAgent: (config = {}) => new NegotiatorAgent(config),
    createSession: (config = {}) => new NegotiationSession(config)
};

console.log('✅ Step 42/50: AI-to-AI Negotiation loaded');
