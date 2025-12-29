/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 26/50: Agent Coordination                          ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Multi-agent coordination and communication
 * @phase 2 - Autonomous Intelligence
 * @step 26 of 50
 */

'use strict';

const EventEmitter = require('events');
const { AgentRole, AgentState } = require('./hive-mind');

// ═══════════════════════════════════════════════════════════════════════════════
// COORDINATION STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CoordinationStrategy - How agents coordinate
 */
const CoordinationStrategy = {
    CENTRALIZED: 'centralized',       // Single coordinator
    DISTRIBUTED: 'distributed',        // Peer-to-peer
    HIERARCHICAL: 'hierarchical',      // Multi-level hierarchy
    AUCTION: 'auction',                // Task auction
    CONSENSUS: 'consensus'             // Consensus-based
};

/**
 * MessageType - Inter-agent message types
 */
const MessageType = {
    TASK_OFFER: 'task_offer',
    TASK_ACCEPT: 'task_accept',
    TASK_REJECT: 'task_reject',
    TASK_COMPLETE: 'task_complete',
    STATUS_UPDATE: 'status_update',
    HELP_REQUEST: 'help_request',
    SYNC_REQUEST: 'sync_request',
    HEARTBEAT: 'heartbeat'
};

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE BUS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * MessageBus - Inter-agent communication
 */
class MessageBus extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxQueueSize: options.maxQueueSize || 1000,
            messageTimeout: options.messageTimeout || 30000,
            ...options
        };
        
        this.subscribers = new Map();
        this.messageQueue = [];
        this.messageLog = [];
        
        this.stats = {
            sent: 0,
            delivered: 0,
            dropped: 0
        };
    }

    /**
     * Subscribe to topic
     */
    subscribe(agentId, topic, handler) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, new Map());
        }
        
        this.subscribers.get(topic).set(agentId, handler);
        
        return () => this.unsubscribe(agentId, topic);
    }

    /**
     * Unsubscribe from topic
     */
    unsubscribe(agentId, topic) {
        if (this.subscribers.has(topic)) {
            this.subscribers.get(topic).delete(agentId);
        }
    }

    /**
     * Publish message to topic
     */
    publish(topic, message, senderId) {
        const msg = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            topic,
            sender: senderId,
            payload: message,
            timestamp: Date.now()
        };
        
        this.stats.sent++;
        this.messageLog.push(msg);
        
        // Keep log size manageable
        if (this.messageLog.length > this.options.maxQueueSize) {
            this.messageLog = this.messageLog.slice(-500);
        }
        
        if (this.subscribers.has(topic)) {
            for (const [agentId, handler] of this.subscribers.get(topic)) {
                if (agentId !== senderId) {
                    try {
                        handler(msg);
                        this.stats.delivered++;
                    } catch (error) {
                        this.emit('error', { agentId, error });
                    }
                }
            }
        }
        
        this.emit('message', msg);
        
        return msg.id;
    }

    /**
     * Send direct message
     */
    sendDirect(fromId, toId, message) {
        const topic = `direct:${toId}`;
        return this.publish(topic, message, fromId);
    }

    /**
     * Broadcast to all
     */
    broadcast(message, senderId) {
        return this.publish('broadcast', message, senderId);
    }

    /**
     * Get message history
     */
    getHistory(topic, limit = 50) {
        return this.messageLog
            .filter(m => !topic || m.topic === topic)
            .slice(-limit);
    }

    /**
     * Get stats
     */
    getStats() {
        return { ...this.stats };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK AUCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TaskAuction - Auction-based task assignment
 */
class TaskAuction extends EventEmitter {
    constructor(bus, options = {}) {
        super();
        
        this.bus = bus;
        this.options = {
            auctionTimeout: options.auctionTimeout || 5000,
            minBidders: options.minBidders || 1,
            ...options
        };
        
        this.activeAuctions = new Map();
        this.completedAuctions = [];
    }

    /**
     * Start auction for task
     */
    async startAuction(task) {
        const auction = {
            id: `auction_${Date.now()}`,
            task,
            bids: [],
            startTime: Date.now(),
            status: 'open',
            winner: null
        };
        
        this.activeAuctions.set(auction.id, auction);
        
        // Announce auction
        this.bus.broadcast({
            type: 'auction_start',
            auctionId: auction.id,
            task: {
                id: task.id,
                name: task.name,
                type: task.type,
                requiredCapabilities: task.requiredCapabilities
            }
        }, 'auctioneer');
        
        this.emit('auction:started', { auction });
        
        // Wait for bids
        await this._waitForBids(auction);
        
        // Select winner
        return this._selectWinner(auction);
    }

    /**
     * Place bid
     */
    placeBid(auctionId, agentId, bid) {
        const auction = this.activeAuctions.get(auctionId);
        
        if (!auction || auction.status !== 'open') {
            return false;
        }
        
        auction.bids.push({
            agentId,
            value: bid.value || 0,
            capabilities: bid.capabilities || [],
            estimatedTime: bid.estimatedTime,
            timestamp: Date.now()
        });
        
        this.emit('bid:placed', { auctionId, agentId, bid });
        
        return true;
    }

    /**
     * Wait for bids
     */
    async _waitForBids(auction) {
        return new Promise(resolve => {
            setTimeout(() => {
                auction.status = 'closed';
                resolve();
            }, this.options.auctionTimeout);
        });
    }

    /**
     * Select winner
     */
    _selectWinner(auction) {
        if (auction.bids.length === 0) {
            auction.status = 'no_bids';
            this.emit('auction:failed', { auction, reason: 'no_bids' });
            return null;
        }
        
        // Sort by bid value (lower is better - like time estimate)
        const sortedBids = [...auction.bids].sort((a, b) => a.value - b.value);
        const winner = sortedBids[0];
        
        auction.winner = winner.agentId;
        auction.status = 'completed';
        
        // Move to completed
        this.activeAuctions.delete(auction.id);
        this.completedAuctions.push(auction);
        
        // Notify winner
        this.bus.sendDirect('auctioneer', winner.agentId, {
            type: 'auction_won',
            auctionId: auction.id,
            task: auction.task
        });
        
        // Notify losers
        for (const bid of sortedBids.slice(1)) {
            this.bus.sendDirect('auctioneer', bid.agentId, {
                type: 'auction_lost',
                auctionId: auction.id
            });
        }
        
        this.emit('auction:completed', { auction, winner });
        
        return winner;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSENSUS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ConsensusEngine - Achieve consensus among agents
 */
class ConsensusEngine extends EventEmitter {
    constructor(bus, options = {}) {
        super();
        
        this.bus = bus;
        this.options = {
            consensusTimeout: options.consensusTimeout || 10000,
            quorum: options.quorum || 0.5, // 50% must agree
            ...options
        };
        
        this.proposals = new Map();
    }

    /**
     * Propose decision
     */
    async propose(proposal, participants) {
        const consensusRound = {
            id: `consensus_${Date.now()}`,
            proposal,
            participants,
            votes: new Map(),
            startTime: Date.now(),
            status: 'voting'
        };
        
        this.proposals.set(consensusRound.id, consensusRound);
        
        // Send proposal to all participants
        for (const agentId of participants) {
            this.bus.sendDirect('consensus', agentId, {
                type: 'proposal',
                roundId: consensusRound.id,
                proposal
            });
        }
        
        this.emit('proposal:started', { round: consensusRound });
        
        // Wait for votes
        return this._waitForConsensus(consensusRound);
    }

    /**
     * Cast vote
     */
    vote(roundId, agentId, approve, reason) {
        const round = this.proposals.get(roundId);
        
        if (!round || round.status !== 'voting') {
            return false;
        }
        
        if (!round.participants.includes(agentId)) {
            return false;
        }
        
        round.votes.set(agentId, {
            approve,
            reason,
            timestamp: Date.now()
        });
        
        this.emit('vote:cast', { roundId, agentId, approve });
        
        // Check if we have enough votes
        this._checkConsensus(round);
        
        return true;
    }

    /**
     * Wait for consensus
     */
    async _waitForConsensus(round) {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (round.status !== 'voting') {
                    clearInterval(checkInterval);
                    resolve(round);
                }
            }, 100);
            
            // Timeout
            setTimeout(() => {
                clearInterval(checkInterval);
                if (round.status === 'voting') {
                    this._checkConsensus(round, true);
                }
                resolve(round);
            }, this.options.consensusTimeout);
        });
    }

    /**
     * Check if consensus reached
     */
    _checkConsensus(round, forced = false) {
        const totalParticipants = round.participants.length;
        const totalVotes = round.votes.size;
        const requiredVotes = Math.ceil(totalParticipants * this.options.quorum);
        
        if (totalVotes < requiredVotes && !forced) {
            return; // Not enough votes yet
        }
        
        // Count approvals
        let approvals = 0;
        for (const [, vote] of round.votes) {
            if (vote.approve) approvals++;
        }
        
        // Determine result
        if (approvals >= requiredVotes) {
            round.status = 'approved';
            round.result = true;
        } else {
            round.status = 'rejected';
            round.result = false;
        }
        
        round.endTime = Date.now();
        round.summary = {
            totalParticipants,
            totalVotes,
            approvals,
            rejections: totalVotes - approvals,
            quorumReached: totalVotes >= requiredVotes
        };
        
        this.emit('consensus:reached', { round });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COORDINATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Coordinator - Central coordination point
 */
class Coordinator extends EventEmitter {
    constructor(hiveMind, options = {}) {
        super();
        
        this.hiveMind = hiveMind;
        this.options = {
            strategy: options.strategy || CoordinationStrategy.CENTRALIZED,
            heartbeatInterval: options.heartbeatInterval || 5000,
            ...options
        };
        
        this.bus = new MessageBus(options);
        this.auction = new TaskAuction(this.bus, options);
        this.consensus = new ConsensusEngine(this.bus, options);
        
        this.agentRegistry = new Map();
        this.heartbeats = new Map();
        
        this._setupMessageHandlers();
    }

    /**
     * Setup message handlers
     */
    _setupMessageHandlers() {
        this.bus.on('message', (msg) => {
            this._handleMessage(msg);
        });
    }

    /**
     * Register agent for coordination
     */
    registerAgent(agent) {
        this.agentRegistry.set(agent.id, {
            agent,
            lastHeartbeat: Date.now(),
            subscriptions: []
        });
        
        // Subscribe to agent's direct messages
        const unsub = this.bus.subscribe(agent.id, `direct:${agent.id}`, (msg) => {
            agent.emit('message', msg);
        });
        
        this.agentRegistry.get(agent.id).subscriptions.push(unsub);
        
        // Subscribe to broadcasts
        const unsubBroadcast = this.bus.subscribe(agent.id, 'broadcast', (msg) => {
            agent.emit('broadcast', msg);
        });
        
        this.agentRegistry.get(agent.id).subscriptions.push(unsubBroadcast);
        
        this.emit('agent:registered', { agentId: agent.id });
        
        return this;
    }

    /**
     * Unregister agent
     */
    unregisterAgent(agentId) {
        const entry = this.agentRegistry.get(agentId);
        
        if (entry) {
            // Cleanup subscriptions
            for (const unsub of entry.subscriptions) {
                unsub();
            }
            
            this.agentRegistry.delete(agentId);
            this.emit('agent:unregistered', { agentId });
        }
        
        return this;
    }

    /**
     * Handle incoming message
     */
    _handleMessage(msg) {
        switch (msg.payload.type) {
            case MessageType.HEARTBEAT:
                this._handleHeartbeat(msg.sender);
                break;
            
            case MessageType.STATUS_UPDATE:
                this._handleStatusUpdate(msg.sender, msg.payload);
                break;
            
            case MessageType.HELP_REQUEST:
                this._handleHelpRequest(msg.sender, msg.payload);
                break;
        }
    }

    /**
     * Handle heartbeat
     */
    _handleHeartbeat(agentId) {
        this.heartbeats.set(agentId, Date.now());
        
        const entry = this.agentRegistry.get(agentId);
        if (entry) {
            entry.lastHeartbeat = Date.now();
        }
    }

    /**
     * Handle status update
     */
    _handleStatusUpdate(agentId, payload) {
        this.emit('status:update', { agentId, status: payload.status });
    }

    /**
     * Handle help request
     */
    _handleHelpRequest(agentId, payload) {
        // Find available agents that can help
        const helpers = [];
        
        for (const [id, entry] of this.agentRegistry) {
            if (id !== agentId && entry.agent.state === AgentState.IDLE) {
                if (!payload.requiredCapabilities || 
                    payload.requiredCapabilities.every(cap => 
                        entry.agent.hasCapability(cap)
                    )) {
                    helpers.push(id);
                }
            }
        }
        
        // Notify requesting agent
        this.bus.sendDirect('coordinator', agentId, {
            type: 'help_response',
            availableHelpers: helpers
        });
        
        this.emit('help:requested', { agentId, helpers });
    }

    /**
     * Assign task using current strategy
     */
    async assignTask(task) {
        switch (this.options.strategy) {
            case CoordinationStrategy.AUCTION:
                return this.auction.startAuction(task);
            
            case CoordinationStrategy.CONSENSUS:
                // Get available agents
                const agents = Array.from(this.agentRegistry.keys());
                return this.consensus.propose({ type: 'task_assignment', task }, agents);
            
            default:
                // Centralized - let HiveMind handle it
                return this.hiveMind.submitTask(task);
        }
    }

    /**
     * Start heartbeat monitoring
     */
    startHeartbeatMonitor() {
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();
            const timeout = this.options.heartbeatInterval * 3;
            
            for (const [agentId, entry] of this.agentRegistry) {
                if (now - entry.lastHeartbeat > timeout) {
                    this.emit('agent:timeout', { agentId });
                }
            }
        }, this.options.heartbeatInterval);
        
        return this;
    }

    /**
     * Stop heartbeat monitoring
     */
    stopHeartbeatMonitor() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        return this;
    }

    /**
     * Get coordination status
     */
    getStatus() {
        return {
            strategy: this.options.strategy,
            registeredAgents: this.agentRegistry.size,
            messageStats: this.bus.getStats(),
            activeAuctions: this.auction.activeAuctions.size
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    MessageBus,
    TaskAuction,
    ConsensusEngine,
    Coordinator,
    
    // Types
    CoordinationStrategy,
    MessageType,
    
    // Factory
    createMessageBus: (options = {}) => new MessageBus(options),
    createCoordinator: (hiveMind, options = {}) => new Coordinator(hiveMind, options)
};

console.log('✅ Step 26/50: Agent Coordination loaded');
