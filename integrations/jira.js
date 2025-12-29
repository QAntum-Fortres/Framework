/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  TRAINING FRAMEWORK - Step 38/50: Jira Integration                            ║
 * ║  Part of: Phase 3 - Domination                                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 * 
 * @description Jira Project Management Integration
 * @phase 3 - Domination
 * @step 38 of 50
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// JIRA TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * JiraIssueType - Issue types
 */
const JiraIssueType = {
    BUG: 'Bug',
    STORY: 'Story',
    TASK: 'Task',
    EPIC: 'Epic',
    SUB_TASK: 'Sub-task',
    TEST: 'Test'
};

/**
 * JiraPriority - Issue priorities
 */
const JiraPriority = {
    HIGHEST: 'Highest',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    LOWEST: 'Lowest'
};

/**
 * JiraTransition - Status transitions
 */
const JiraTransition = {
    TO_DO: 'To Do',
    IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review',
    DONE: 'Done'
};

// ═══════════════════════════════════════════════════════════════════════════════
// JIRA ISSUE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * JiraIssue - Local issue representation
 */
class JiraIssue {
    constructor(data = {}) {
        this.key = data.key || null;
        this.id = data.id || null;
        this.summary = data.summary || '';
        this.description = data.description || '';
        this.issueType = data.issueType || JiraIssueType.BUG;
        this.priority = data.priority || JiraPriority.MEDIUM;
        this.status = data.status || JiraTransition.TO_DO;
        this.assignee = data.assignee || null;
        this.reporter = data.reporter || null;
        this.labels = data.labels || [];
        this.components = data.components || [];
        this.attachments = data.attachments || [];
        this.comments = data.comments || [];
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        
        // Test-related fields
        this.testResults = data.testResults || [];
        this.linkedTests = data.linkedTests || [];
    }

    /**
     * Add comment
     */
    addComment(author, body) {
        this.comments.push({
            id: `comment_${Date.now()}`,
            author,
            body,
            createdAt: new Date()
        });
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Add attachment
     */
    addAttachment(filename, content, mimeType) {
        this.attachments.push({
            id: `att_${Date.now()}`,
            filename,
            content,
            mimeType,
            createdAt: new Date()
        });
        this.updatedAt = new Date();
        return this;
    }

    /**
     * Link test result
     */
    linkTestResult(testResult) {
        this.testResults.push(testResult);
        this.updatedAt = new Date();
        return this;
    }

    /**
     * To JSON for API
     */
    toJiraJson() {
        return {
            fields: {
                summary: this.summary,
                description: this.description,
                issuetype: { name: this.issueType },
                priority: { name: this.priority },
                labels: this.labels,
                assignee: this.assignee ? { name: this.assignee } : null
            }
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JIRA CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * JiraClient - Jira API client
 */
class JiraClient extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            baseUrl: options.baseUrl || 'https://jira.example.com',
            apiVersion: options.apiVersion || '3',
            email: options.email,
            apiToken: options.apiToken,
            projectKey: options.projectKey,
            ...options
        };
        
        this.connected = false;
    }

    /**
     * Build auth header
     */
    _getAuthHeader() {
        const credentials = Buffer.from(`${this.options.email}:${this.options.apiToken}`).toString('base64');
        return `Basic ${credentials}`;
    }

    /**
     * Make API request (simulated)
     */
    async _request(method, endpoint, data = null) {
        // In real implementation, use fetch or axios
        console.log(`[Jira API] ${method} ${endpoint}`);
        
        // Simulate response
        return {
            success: true,
            data: data
        };
    }

    /**
     * Test connection
     */
    async connect() {
        try {
            await this._request('GET', '/rest/api/3/myself');
            this.connected = true;
            this.emit('connected');
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
        const payload = issue instanceof JiraIssue ? issue.toJiraJson() : issue;
        payload.fields.project = { key: this.options.projectKey };
        
        const response = await this._request('POST', '/rest/api/3/issue', payload);
        
        // Simulate response
        const createdIssue = new JiraIssue({
            ...issue,
            key: `${this.options.projectKey}-${Date.now() % 10000}`,
            id: `${Date.now()}`
        });
        
        this.emit('issue:created', { issue: createdIssue });
        
        return createdIssue;
    }

    /**
     * Get issue
     */
    async getIssue(issueKey) {
        const response = await this._request('GET', `/rest/api/3/issue/${issueKey}`);
        
        // Simulate
        return new JiraIssue({
            key: issueKey,
            summary: 'Simulated Issue',
            description: 'This is a simulated issue'
        });
    }

    /**
     * Update issue
     */
    async updateIssue(issueKey, updates) {
        await this._request('PUT', `/rest/api/3/issue/${issueKey}`, { fields: updates });
        this.emit('issue:updated', { issueKey, updates });
        return true;
    }

    /**
     * Transition issue
     */
    async transitionIssue(issueKey, transitionName) {
        // First get available transitions
        const transitions = await this._request('GET', `/rest/api/3/issue/${issueKey}/transitions`);
        
        // Find transition ID (simulated)
        const transitionId = '1';
        
        await this._request('POST', `/rest/api/3/issue/${issueKey}/transitions`, {
            transition: { id: transitionId }
        });
        
        this.emit('issue:transitioned', { issueKey, transition: transitionName });
        return true;
    }

    /**
     * Add comment
     */
    async addComment(issueKey, comment) {
        await this._request('POST', `/rest/api/3/issue/${issueKey}/comment`, {
            body: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: comment }]
                    }
                ]
            }
        });
        
        this.emit('comment:added', { issueKey, comment });
        return true;
    }

    /**
     * Add attachment
     */
    async addAttachment(issueKey, filename, content) {
        await this._request('POST', `/rest/api/3/issue/${issueKey}/attachments`, {
            filename,
            content
        });
        
        this.emit('attachment:added', { issueKey, filename });
        return true;
    }

    /**
     * Search issues
     */
    async search(jql, maxResults = 50) {
        const response = await this._request('POST', '/rest/api/3/search', {
            jql,
            maxResults
        });
        
        // Simulate results
        return {
            total: 1,
            issues: [
                new JiraIssue({
                    key: `${this.options.projectKey}-1`,
                    summary: 'Test Issue'
                })
            ]
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JIRA TEST REPORTER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * JiraTestReporter - Report test results to Jira
 */
class JiraTestReporter extends EventEmitter {
    constructor(client) {
        super();
        
        this.client = client;
        this.reportedIssues = [];
    }

    /**
     * Report test failure
     */
    async reportFailure(testResult, options = {}) {
        const issue = new JiraIssue({
            summary: `Test Failure: ${testResult.name}`,
            description: this._formatDescription(testResult),
            issueType: options.issueType || JiraIssueType.BUG,
            priority: this._determinePriority(testResult),
            labels: ['auto-generated', 'test-failure', ...(options.labels || [])],
            testResults: [testResult]
        });
        
        const created = await this.client.createIssue(issue);
        
        // Add screenshot if available
        if (testResult.screenshot) {
            await this.client.addAttachment(created.key, 'failure_screenshot.png', testResult.screenshot);
        }
        
        // Add error log
        if (testResult.error) {
            await this.client.addComment(created.key, `Error details:\n\`\`\`\n${testResult.error}\n\`\`\``);
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
h2. Test Failure Report

*Test Name:* ${testResult.name}
*Suite:* ${testResult.suite || 'N/A'}
*Duration:* ${testResult.duration || 0}ms
*Timestamp:* ${new Date().toISOString()}

h3. Error Message
{code}
${testResult.error || 'No error message'}
{code}

h3. Stack Trace
{code}
${testResult.stackTrace || 'No stack trace available'}
{code}

h3. Environment
* Browser: ${testResult.browser || 'Unknown'}
* OS: ${testResult.os || 'Unknown'}
* URL: ${testResult.url || 'N/A'}
        `.trim();
    }

    /**
     * Determine priority
     */
    _determinePriority(testResult) {
        if (testResult.critical) return JiraPriority.HIGHEST;
        if (testResult.blocksRelease) return JiraPriority.HIGH;
        if (testResult.flaky) return JiraPriority.LOW;
        return JiraPriority.MEDIUM;
    }

    /**
     * Update existing issue
     */
    async updateExistingIssue(issueKey, testResult) {
        const comment = `
Test run update (${new Date().toISOString()}):
* Status: ${testResult.status}
* Duration: ${testResult.duration}ms
${testResult.error ? `* Error: ${testResult.error}` : ''}
        `.trim();
        
        await this.client.addComment(issueKey, comment);
        
        if (testResult.status === 'passed') {
            await this.client.transitionIssue(issueKey, JiraTransition.DONE);
        }
        
        return true;
    }

    /**
     * Find related issue
     */
    async findRelatedIssue(testName) {
        const jql = `project = ${this.client.options.projectKey} AND summary ~ "${testName}" AND status != Done`;
        const result = await this.client.search(jql, 1);
        
        return result.issues.length > 0 ? result.issues[0] : null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// JIRA INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * JiraIntegration - Main integration orchestrator
 */
class JiraIntegration extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = options;
        this.client = new JiraClient(options);
        this.reporter = new JiraTestReporter(this.client);
        
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
            // Check for existing issue
            const existing = await this.reporter.findRelatedIssue(testResult.name);
            
            if (existing && !options.createNew) {
                return this.reporter.updateExistingIssue(existing.key, testResult);
            }
            
            return this.reporter.reportFailure(testResult, options);
        }
        
        return null;
    }

    /**
     * Sync test suite results
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
    JiraIssue,
    JiraClient,
    JiraTestReporter,
    JiraIntegration,
    
    // Types
    JiraIssueType,
    JiraPriority,
    JiraTransition,
    
    // Factory
    createIntegration: (options = {}) => new JiraIntegration(options),
    createClient: (options = {}) => new JiraClient(options)
};

console.log('✅ Step 38/50: Jira Integration loaded');
