/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 39/50: Linear Integration                          ║
 * ║  Part of: Phase 3 - Domination                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Linear Project Management Integration
 * @phase 3 - Domination
 * @step 39 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// LINEAR TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LinearState - Issue states
 */
const LinearState = {
    BACKLOG: 'Backlog',
    TODO: 'Todo',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done',
    CANCELLED: 'Cancelled'
};

/**
 * LinearPriority - Priority levels
 */
const LinearPriority = {
    NO_PRIORITY: 0,
    URGENT: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4
};

/**
 * LinearLabel - Issue labels
 */
const LinearLabel = {
    BUG: 'Bug',
    FEATURE: 'Feature',
    IMPROVEMENT: 'Improvement',
    TEST: 'Test',
    AUTOMATION: 'Automation'
};

// ═══════════════════════════════════════════════════════════════════════════════
// LINEAR ISSUE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LinearIssue - Linear issue representation
 */
class LinearIssue {
    constructor(data = {}) {
        this.id = data.id || null;
        this.identifier = data.identifier || null;
        this.title = data.title || '';
        this.description = data.description || '';
        this.priority = data.priority ?? LinearPriority.MEDIUM;
        this.state = data.state || LinearState.BACKLOG;
        this.assignee = data.assignee || null;
        this.creator = data.creator || null;
        this.teamId = data.teamId || null;
        this.projectId = data.projectId || null;
        this.labels = data.labels || [];
        this.estimate = data.estimate || null;
        this.dueDate = data.dueDate || null;
        this.attachments = data.attachments || [];
        this.comments = data.comments || [];
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        
        // Test-specific
        this.testLink = data.testLink || null;
        this.testResults = data.testResults || [];
    }

    /**
     * Add comment
     */
    addComment(userId, body) {
        this.comments.push({
            id: `lc_${Date.now()}`,
            userId,
            body,
            createdAt: new Date()
        });
        this.updatedAt = new Date();
        return this;
    }

    /**
     * To GraphQL input
     */
    toGraphQLInput() {
        return {
            title: this.title,
            description: this.description,
            priority: this.priority,
            teamId: this.teamId,
            projectId: this.projectId,
            assigneeId: this.assignee?.id,
            labelIds: this.labels.map(l => l.id).filter(Boolean),
            estimate: this.estimate,
            dueDate: this.dueDate?.toISOString()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LINEAR CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LinearClient - Linear GraphQL API client
 */
class LinearClient extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            apiKey: options.apiKey,
            baseUrl: options.baseUrl || 'https://api.linear.app/graphql',
            ...options
        };
        
        this.connected = false;
        this.viewer = null;
    }

    /**
     * Execute GraphQL query
     */
    async _graphql(query, variables = {}) {
        // In real implementation, use fetch
        console.log(`[Linear API] GraphQL: ${query.split('{')[0].trim()}`);
        
        // Simulate response
        return { data: {} };
    }

    /**
     * Connect and verify
     */
    async connect() {
        const query = `
            query {
                viewer {
                    id
                    name
                    email
                }
            }
        `;
        
        try {
            const result = await this._graphql(query);
            this.viewer = result.data.viewer || { id: 'viewer_1', name: 'Test User' };
            this.connected = true;
            this.emit('connected', { viewer: this.viewer });
            return true;
        } catch (e) {
            this.emit('error', e);
            return false;
        }
    }

    /**
     * Create issue
     */
    async createIssue(issue) {
        const mutation = `
            mutation IssueCreate($input: IssueCreateInput!) {
                issueCreate(input: $input) {
                    success
                    issue {
                        id
                        identifier
                        title
                        url
                    }
                }
            }
        `;
        
        const input = issue instanceof LinearIssue ? issue.toGraphQLInput() : issue;
        const result = await this._graphql(mutation, { input });
        
        // Simulate response
        const created = new LinearIssue({
            ...issue,
            id: `issue_${Date.now()}`,
            identifier: `TST-${Date.now() % 1000}`
        });
        
        this.emit('issue:created', { issue: created });
        
        return created;
    }

    /**
     * Get issue
     */
    async getIssue(issueId) {
        const query = `
            query Issue($id: String!) {
                issue(id: $id) {
                    id
                    identifier
                    title
                    description
                    priority
                    state { name }
                    assignee { id name }
                    labels { nodes { id name } }
                }
            }
        `;
        
        await this._graphql(query, { id: issueId });
        
        // Simulate
        return new LinearIssue({
            id: issueId,
            identifier: 'TST-1',
            title: 'Simulated Issue'
        });
    }

    /**
     * Update issue
     */
    async updateIssue(issueId, updates) {
        const mutation = `
            mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
                issueUpdate(id: $id, input: $input) {
                    success
                    issue { id identifier title }
                }
            }
        `;
        
        await this._graphql(mutation, { id: issueId, input: updates });
        this.emit('issue:updated', { issueId, updates });
        
        return true;
    }

    /**
     * Add comment
     */
    async addComment(issueId, body) {
        const mutation = `
            mutation CommentCreate($input: CommentCreateInput!) {
                commentCreate(input: $input) {
                    success
                    comment { id body }
                }
            }
        `;
        
        await this._graphql(mutation, { input: { issueId, body } });
        this.emit('comment:added', { issueId, body });
        
        return true;
    }

    /**
     * Search issues
     */
    async searchIssues(filter = {}) {
        const query = `
            query Issues($filter: IssueFilter) {
                issues(filter: $filter) {
                    nodes {
                        id
                        identifier
                        title
                        state { name }
                        priority
                    }
                }
            }
        `;
        
        await this._graphql(query, { filter });
        
        // Simulate results
        return [
            new LinearIssue({
                id: 'issue_1',
                identifier: 'TST-1',
                title: 'Test Issue'
            })
        ];
    }

    /**
     * Get teams
     */
    async getTeams() {
        const query = `
            query {
                teams {
                    nodes {
                        id
                        name
                        key
                    }
                }
            }
        `;
        
        await this._graphql(query);
        
        return [
            { id: 'team_1', name: 'Engineering', key: 'ENG' },
            { id: 'team_2', name: 'QA', key: 'QA' }
        ];
    }

    /**
     * Get projects
     */
    async getProjects(teamId) {
        const query = `
            query Projects($teamId: String!) {
                team(id: $teamId) {
                    projects {
                        nodes {
                            id
                            name
                        }
                    }
                }
            }
        `;
        
        await this._graphql(query, { teamId });
        
        return [
            { id: 'proj_1', name: 'Test Automation' }
        ];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LINEAR TEST REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LinearTestReporter - Report test results to Linear
 */
class LinearTestReporter extends EventEmitter {
    constructor(client, options = {}) {
        super();
        
        this.client = client;
        this.options = {
            teamId: options.teamId,
            projectId: options.projectId,
            defaultLabels: options.defaultLabels || [],
            ...options
        };
        
        this.reportedIssues = [];
    }

    /**
     * Report test failure
     */
    async reportFailure(testResult, options = {}) {
        const issue = new LinearIssue({
            title: `🔴 Test Failure: ${testResult.name}`,
            description: this._formatDescription(testResult),
            priority: this._mapPriority(testResult),
            teamId: options.teamId || this.options.teamId,
            projectId: options.projectId || this.options.projectId,
            labels: [{ id: 'bug_label' }, ...this.options.defaultLabels],
            testResults: [testResult]
        });
        
        const created = await this.client.createIssue(issue);
        
        // Add detailed comment
        if (testResult.stackTrace) {
            await this.client.addComment(created.id, 
                `**Stack Trace:**\n\`\`\`\n${testResult.stackTrace}\n\`\`\``
            );
        }
        
        this.reportedIssues.push(created);
        this.emit('reported', { issue: created, testResult });
        
        return created;
    }

    /**
     * Format description
     */
    _formatDescription(testResult) {
        return `
## Test Failure Report

**Test Name:** ${testResult.name}
**Suite:** ${testResult.suite || 'N/A'}
**Duration:** ${testResult.duration || 0}ms
**Timestamp:** ${new Date().toISOString()}

### Error Message
\`\`\`
${testResult.error || 'No error message'}
\`\`\`

### Environment
- Browser: ${testResult.browser || 'Unknown'}
- OS: ${testResult.os || 'Unknown'}
- URL: ${testResult.url || 'N/A'}

### Steps to Reproduce
${testResult.steps?.join('\n') || 'Not available'}
        `.trim();
    }

    /**
     * Map priority
     */
    _mapPriority(testResult) {
        if (testResult.critical) return LinearPriority.URGENT;
        if (testResult.blocksRelease) return LinearPriority.HIGH;
        if (testResult.flaky) return LinearPriority.LOW;
        return LinearPriority.MEDIUM;
    }

    /**
     * Find existing issue
     */
    async findExisting(testName) {
        const issues = await this.client.searchIssues({
            title: { contains: testName },
            state: { name: { nin: ['Done', 'Cancelled'] } }
        });
        
        return issues.length > 0 ? issues[0] : null;
    }

    /**
     * Update existing issue
     */
    async updateExisting(issueId, testResult) {
        const comment = `
**Test Run Update** - ${new Date().toISOString()}
- Status: ${testResult.status}
- Duration: ${testResult.duration}ms
${testResult.error ? `- Error: ${testResult.error}` : ''}
        `.trim();
        
        await this.client.addComment(issueId, comment);
        
        if (testResult.status === 'passed') {
            await this.client.updateIssue(issueId, {
                stateId: 'done_state_id'
            });
        }
        
        return true;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LINEAR INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * LinearIntegration - Main integration orchestrator
 */
class LinearIntegration extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        this.client = new LinearClient(options);
        this.reporter = new LinearTestReporter(this.client, options);
        
        this._setupListeners();
    }

    /**
     * Setup listeners
     */
    _setupListeners() {
        this.client.on('connected', () => this.emit('connected'));
        this.client.on('error', (e) => this.emit('error', e));
        this.reporter.on('reported', (data) => this.emit('reported', data));
    }

    /**
     * Initialize
     */
    async initialize() {
        return this.client.connect();
    }

    /**
     * Report test result
     */
    async reportTestResult(testResult, options = {}) {
        if (testResult.status === 'failed') {
            // Check for existing
            const existing = await this.reporter.findExisting(testResult.name);
            
            if (existing && !options.createNew) {
                return this.reporter.updateExisting(existing.id, testResult);
            }
            
            return this.reporter.reportFailure(testResult, options);
        }
        
        return null;
    }

    /**
     * Sync test suite
     */
    async syncSuiteResults(suiteResults) {
        const issues = [];
        
        for (const result of suiteResults) {
            if (result.status === 'failed') {
                const issue = await this.reportTestResult(result);
                if (issue) issues.push(issue);
            }
        }
        
        return issues;
    }

    /**
     * Get client
     */
    getClient() {
        return this.client;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Classes
    LinearIssue,
    LinearClient,
    LinearTestReporter,
    LinearIntegration,
    
    // Types
    LinearState,
    LinearPriority,
    LinearLabel,
    
    // Factory
    createIntegration: (options = {}) => new LinearIntegration(options),
    createClient: (options = {}) => new LinearClient(options)
};

console.log('✅ Step 39/50: Linear Integration loaded');
