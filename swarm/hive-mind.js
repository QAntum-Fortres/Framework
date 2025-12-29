/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 25/50: HIVE MIND Core                              ║
 * ║  Part of: Phase 2 - Autonomous Intelligence                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Multi-Agent Swarm Intelligence Core
 * @phase 2 - Autonomous Intelligence
 * @step 25 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// SWARM TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * AgentRole - Roles agents can have
 */
const AgentRole = {
    COORDINATOR: 'coordinator',
    WORKER: 'worker',
    SCOUT: 'scout',
    SPECIALIST: 'specialist',
    OBSERVER: 'observer'
};

/**
 * AgentState - Agent states
 */
const AgentState = {
    IDLE: 'idle',
    WORKING: 'working',
    WAITING: 'waiting',
    COMPLETED: 'completed',
    FAILED: 'failed',
    TERMINATED: 'terminated'
};

/**
 * TaskPriority - Task priorities
 */
const TaskPriority = {
    CRITICAL: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
    BACKGROUND: 5
};

// ═══════════════════════════════════════════════════════════════════════════════
// SWARM AGENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SwarmAgent - Individual agent in swarm
 */
class SwarmAgent extends EventEmitter {
    constructor(config) {
        super();
        
        this.id = config.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = config.name || this.id;
        this.role = config.role || AgentRole.WORKER;
        this.capabilities = config.capabilities || [];
        this.state = AgentState.IDLE;
        
        this.currentTask = null;
        this.taskHistory = [];
        this.metrics = {
            tasksCompleted: 0,
            tasksFailed: 0,
            totalWorkTime: 0,
            avgTaskTime: 0
        };
        
        this.memory = new Map();
        this.connections = new Set();
    }

    /**
     * Assign task
     */
    assignTask(task) {
        if (this.state !== AgentState.IDLE) {
            return false;
        }
        
        this.currentTask = task;
        this.state = AgentState.WORKING;
        task.assignedAt = Date.now();
        task.agent = this.id;
        
        this.emit('task:assigned', { task });
        
        return true;
    }

    /**
     * Complete task
     */
    completeTask(result) {
        if (!this.currentTask) return;
        
        const duration = Date.now() - this.currentTask.assignedAt;
        
        this.currentTask.result = result;
        this.currentTask.completedAt = Date.now();
        this.currentTask.duration = duration;
        
        this.taskHistory.push(this.currentTask);
        
        this.metrics.tasksCompleted++;
        this.metrics.totalWorkTime += duration;
        this.metrics.avgTaskTime = this.metrics.totalWorkTime / this.metrics.tasksCompleted;
        
        this.emit('task:completed', { task: this.currentTask, result });
        
        this.currentTask = null;
        this.state = AgentState.IDLE;
    }

    /**
     * Fail task
     */
    failTask(error) {
        if (!this.currentTask) return;
        
        this.currentTask.error = error;
        this.currentTask.failedAt = Date.now();
        
        this.taskHistory.push(this.currentTask);
        
        this.metrics.tasksFailed++;
        
        this.emit('task:failed', { task: this.currentTask, error });
        
        this.currentTask = null;
        this.state = AgentState.IDLE;
    }

    /**
     * Check capability
     */
    hasCapability(capability) {
        return this.capabilities.includes(capability);
    }

    /**
     * Store in memory
     */
    remember(key, value) {
        this.memory.set(key, { value, timestamp: Date.now() });
        return this;
    }

    /**
     * Recall from memory
     */
    recall(key) {
        const entry = this.memory.get(key);
        return entry ? entry.value : null;
    }

    /**
     * Connect to another agent
     */
    connect(agent) {
        this.connections.add(agent.id);
        return this;
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            role: this.role,
            state: this.state,
            currentTask: this.currentTask?.id,
            metrics: { ...this.metrics },
            capabilities: [...this.capabilities]
        };
    }

    /**
     * Terminate agent
     */
    terminate() {
        this.state = AgentState.TERMINATED;
        this.emit('terminated');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SWARM TASK
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SwarmTask - Task for swarm to execute
 */
class SwarmTask {
    constructor(config) {
        this.id = config.id || `task_${Date.now()}`;
        this.name = config.name || this.id;
        this.type = config.type || 'generic';
        this.priority = config.priority || TaskPriority.NORMAL;
        this.requiredCapabilities = config.requiredCapabilities || [];
        this.payload = config.payload || {};
        this.executor = config.executor || null;
        
        this.status = 'pending';
        this.agent = null;
        this.createdAt = Date.now();
        this.assignedAt = null;
        this.completedAt = null;
        this.duration = null;
        this.result = null;
        this.error = null;
        this.retries = 0;
        this.maxRetries = config.maxRetries || 3;
        
        this.dependencies = config.dependencies || [];
        this.dependents = [];
    }

    /**
     * Check if task can be executed
     */
    canExecute(completedTasks) {
        return this.dependencies.every(depId => 
            completedTasks.has(depId)
        );
    }

    /**
     * Get execution order weight
     */
    getWeight() {
        return this.priority - this.dependencies.length * 0.1;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HIVE MIND
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * HiveMind - Central swarm intelligence
 */
class HiveMind extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxAgents: options.maxAgents || 10,
            taskTimeout: options.taskTimeout || 60000,
            loadBalancing: options.loadBalancing || 'round_robin',
            ...options
        };
        
        this.agents = new Map();
        this.taskQueue = [];
        this.completedTasks = new Map();
        this.failedTasks = new Map();
        
        this.sharedMemory = new Map();
        this.nextAgentIndex = 0;
        
        this.stats = {
            totalTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            activeAgents: 0
        };
        
        this.running = false;
    }

    /**
     * Register agent
     */
    registerAgent(agent) {
        if (this.agents.size >= this.options.maxAgents) {
            throw new Error('Max agents reached');
        }
        
        // Set up agent events
        agent.on('task:completed', ({ task, result }) => {
            this._onTaskCompleted(agent, task, result);
        });
        
        agent.on('task:failed', ({ task, error }) => {
            this._onTaskFailed(agent, task, error);
        });
        
        this.agents.set(agent.id, agent);
        this.stats.activeAgents = this.agents.size;
        
        this.emit('agent:registered', { agent: agent.getStatus() });
        
        return this;
    }

    /**
     * Create and register agent
     */
    createAgent(config = {}) {
        const agent = new SwarmAgent(config);
        this.registerAgent(agent);
        return agent;
    }

    /**
     * Submit task
     */
    submitTask(task) {
        if (!(task instanceof SwarmTask)) {
            task = new SwarmTask(task);
        }
        
        this.taskQueue.push(task);
        this.stats.totalTasks++;
        
        this.emit('task:submitted', { task });
        
        // Try to assign immediately if running
        if (this.running) {
            this._assignTasks();
        }
        
        return task;
    }

    /**
     * Submit multiple tasks
     */
    submitTasks(tasks) {
        return tasks.map(t => this.submitTask(t));
    }

    /**
     * Start swarm
     */
    start() {
        this.running = true;
        this.emit('started');
        this._assignTasks();
        return this;
    }

    /**
     * Stop swarm
     */
    stop() {
        this.running = false;
        this.emit('stopped');
        return this;
    }

    /**
     * Assign tasks to available agents
     */
    _assignTasks() {
        if (!this.running) return;
        
        // Sort tasks by priority and dependencies
        this.taskQueue.sort((a, b) => a.getWeight() - b.getWeight());
        
        const completedIds = new Set(this.completedTasks.keys());
        
        for (const task of [...this.taskQueue]) {
            // Check dependencies
            if (!task.canExecute(completedIds)) {
                continue;
            }
            
            // Find suitable agent
            const agent = this._findAgent(task);
            
            if (agent) {
                // Remove from queue
                const idx = this.taskQueue.indexOf(task);
                if (idx > -1) {
                    this.taskQueue.splice(idx, 1);
                }
                
                // Assign task
                agent.assignTask(task);
                
                // Execute task
                this._executeTask(agent, task);
            }
        }
    }

    /**
     * Find suitable agent
     */
    _findAgent(task) {
        const availableAgents = Array.from(this.agents.values())
            .filter(a => a.state === AgentState.IDLE);
        
        if (availableAgents.length === 0) return null;
        
        // Filter by capabilities
        const capable = availableAgents.filter(a => 
            task.requiredCapabilities.every(cap => a.hasCapability(cap))
        );
        
        if (capable.length === 0) {
            // Fall back to any available if no capability requirements
            if (task.requiredCapabilities.length === 0) {
                return this._selectByStrategy(availableAgents);
            }
            return null;
        }
        
        return this._selectByStrategy(capable);
    }

    /**
     * Select agent by load balancing strategy
     */
    _selectByStrategy(agents) {
        switch (this.options.loadBalancing) {
            case 'round_robin':
                this.nextAgentIndex = (this.nextAgentIndex + 1) % agents.length;
                return agents[this.nextAgentIndex];
            
            case 'least_busy':
                return agents.sort((a, b) => 
                    a.metrics.tasksCompleted - b.metrics.tasksCompleted
                )[0];
            
            case 'fastest':
                return agents.sort((a, b) => 
                    (a.metrics.avgTaskTime || Infinity) - (b.metrics.avgTaskTime || Infinity)
                )[0];
            
            case 'random':
                return agents[Math.floor(Math.random() * agents.length)];
            
            default:
                return agents[0];
        }
    }

    /**
     * Execute task
     */
    async _executeTask(agent, task) {
        try {
            let result;
            
            if (task.executor) {
                // Custom executor
                result = await task.executor(task.payload, {
                    agent,
                    hiveMind: this,
                    sharedMemory: this.sharedMemory
                });
            } else {
                // Default execution
                result = { success: true };
            }
            
            agent.completeTask(result);
        } catch (error) {
            agent.failTask(error.message);
        }
    }

    /**
     * Handle task completed
     */
    _onTaskCompleted(agent, task, result) {
        this.completedTasks.set(task.id, { task, result });
        this.stats.completedTasks++;
        
        this.emit('task:completed', { agent: agent.id, task, result });
        
        // Assign more tasks
        this._assignTasks();
        
        // Check if all done
        this._checkCompletion();
    }

    /**
     * Handle task failed
     */
    _onTaskFailed(agent, task, error) {
        if (task.retries < task.maxRetries) {
            // Retry
            task.retries++;
            task.status = 'pending';
            task.agent = null;
            this.taskQueue.push(task);
            
            this.emit('task:retry', { task, retries: task.retries });
        } else {
            // Mark as failed
            this.failedTasks.set(task.id, { task, error });
            this.stats.failedTasks++;
            
            this.emit('task:failed', { agent: agent.id, task, error });
        }
        
        // Assign more tasks
        this._assignTasks();
        
        // Check if all done
        this._checkCompletion();
    }

    /**
     * Check if all tasks completed
     */
    _checkCompletion() {
        if (this.taskQueue.length === 0) {
            const allAgentsIdle = Array.from(this.agents.values())
                .every(a => a.state === AgentState.IDLE);
            
            if (allAgentsIdle) {
                this.emit('all:completed', {
                    completed: this.stats.completedTasks,
                    failed: this.stats.failedTasks
                });
            }
        }
    }

    /**
     * Store in shared memory
     */
    share(key, value) {
        this.sharedMemory.set(key, {
            value,
            timestamp: Date.now()
        });
        
        this.emit('memory:shared', { key });
        
        return this;
    }

    /**
     * Retrieve from shared memory
     */
    retrieve(key) {
        const entry = this.sharedMemory.get(key);
        return entry ? entry.value : null;
    }

    /**
     * Broadcast to all agents
     */
    broadcast(message) {
        for (const agent of this.agents.values()) {
            agent.emit('broadcast', message);
        }
        return this;
    }

    /**
     * Get swarm status
     */
    getStatus() {
        return {
            running: this.running,
            agents: Array.from(this.agents.values()).map(a => a.getStatus()),
            queueSize: this.taskQueue.length,
            stats: { ...this.stats }
        };
    }

    /**
     * Terminate swarm
     */
    terminate() {
        this.running = false;
        
        for (const agent of this.agents.values()) {
            agent.terminate();
        }
        
        this.agents.clear();
        this.emit('terminated');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

let defaultHiveMind = null;

module.exports = {
    // Classes
    SwarmAgent,
    SwarmTask,
    HiveMind,
    
    // Types
    AgentRole,
    AgentState,
    TaskPriority,
    
    // Factory
    createHiveMind: (options = {}) => new HiveMind(options),
    createAgent: (config = {}) => new SwarmAgent(config),
    createTask: (config = {}) => new SwarmTask(config),
    
    // Singleton
    getHiveMind: (options = {}) => {
        if (!defaultHiveMind) {
            defaultHiveMind = new HiveMind(options);
        }
        return defaultHiveMind;
    }
};

console.log('✅ Step 25/50: HIVE MIND Core loaded');
