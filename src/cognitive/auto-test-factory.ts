/**
 * 🏭 AUTO TEST FACTORY - Self-Writing Test Generator
 * 
 * Transforms discovered site maps into ready-to-run tests.
 * Generates both Ghost-API tests and Playwright-UI tests.
 * 
 * "QANTUM writes its own tests!"
 * 
 * @version 1.0.0-QANTUM-PRIME
 * @phase 87-88
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
    SiteMap, 
    DiscoveredPage, 
    DiscoveredForm, 
    ApiCall, 
    TransactionFlow 
} from './autonomous-explorer';

// ============================================================
// TYPES
// ============================================================
interface TestFactoryConfig {
    outputDir: string;
    generateGhostTests: boolean;
    generatePlaywrightTests: boolean;
    generateApiTests: boolean;
    generateE2ETests: boolean;
    testFramework: 'playwright' | 'jest' | 'mocha';
    language: 'typescript' | 'javascript';
    includeComments: boolean;
    generateDataFactories: boolean;
}

interface GeneratedTest {
    id: string;
    name: string;
    type: 'ghost-api' | 'playwright-ui' | 'api' | 'e2e';
    filePath: string;
    code: string;
    estimatedDuration: number;
    coverage: string[];
}

interface TestSuite {
    name: string;
    description: string;
    tests: GeneratedTest[];
    setupCode: string;
    teardownCode: string;
}

interface TestData {
    name: string;
    type: string;
    generator: string;
    examples: any[];
}

// ============================================================
// AUTO TEST FACTORY
// ============================================================
export class AutoTestFactory {
    private config: TestFactoryConfig;
    private generatedTests: GeneratedTest[] = [];

    constructor(config: Partial<TestFactoryConfig> = {}) {
        this.config = {
            outputDir: './generated_tests',
            generateGhostTests: true,
            generatePlaywrightTests: true,
            generateApiTests: true,
            generateE2ETests: true,
            testFramework: 'playwright',
            language: 'typescript',
            includeComments: true,
            generateDataFactories: true,
            ...config
        };
    }

    /**
     * 🏭 Generate all tests from sitemap
     */
    async generateFromSiteMap(siteMap: SiteMap): Promise<TestSuite[]> {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🏭 AUTO TEST FACTORY - Self-Writing Tests                    ║
║                                                               ║
║  "QANTUM writes its own tests!"                         ║
╚═══════════════════════════════════════════════════════════════╝
`);
        console.log(`🏭 [FACTORY] Processing sitemap: ${siteMap.baseUrl}`);
        console.log(`🏭 [FACTORY] Pages: ${siteMap.totalPages}`);
        console.log(`🏭 [FACTORY] Forms: ${siteMap.totalForms}`);
        console.log(`🏭 [FACTORY] API Endpoints: ${siteMap.totalApiEndpoints}`);
        console.log('');

        const suites: TestSuite[] = [];

        // Generate Ghost-API tests (UI actions → API calls)
        if (this.config.generateGhostTests) {
            const ghostSuite = await this.generateGhostTests(siteMap);
            suites.push(ghostSuite);
        }

        // Generate Playwright UI tests
        if (this.config.generatePlaywrightTests) {
            const playwrightSuite = await this.generatePlaywrightTests(siteMap);
            suites.push(playwrightSuite);
        }

        // Generate pure API tests
        if (this.config.generateApiTests) {
            const apiSuite = await this.generateApiTests(siteMap);
            suites.push(apiSuite);
        }

        // Generate E2E flow tests
        if (this.config.generateE2ETests && siteMap.transactionFlows.length > 0) {
            const e2eSuite = await this.generateE2ETests(siteMap);
            suites.push(e2eSuite);
        }

        // Generate data factories
        if (this.config.generateDataFactories) {
            await this.generateDataFactories(siteMap);
        }

        // Write tests to disk
        await this.writeTestsToDisk(suites);

        // Print summary
        this.printSummary(suites);

        return suites;
    }

    /**
     * 👻 Generate Ghost-API tests
     * These tests convert UI actions to direct API calls for 100x speed
     */
    private async generateGhostTests(siteMap: SiteMap): Promise<TestSuite> {
        console.log('🏭 [FACTORY] Generating Ghost-API tests...');

        const tests: GeneratedTest[] = [];

        // Generate tests for each form
        for (const page of siteMap.pages.values()) {
            for (const form of page.forms) {
                const test = this.generateGhostFormTest(form, page, siteMap);
                tests.push(test);
            }
        }

        // Generate tests for API endpoints
        for (const [key, endpoint] of Object.entries(siteMap.apiEndpoints)) {
            const ep = endpoint as any;
            const test = this.generateGhostApiTest(ep, siteMap);
            tests.push(test);
        }

        const setupCode = this.generateGhostSetup(siteMap);
        const teardownCode = this.generateGhostTeardown();

        return {
            name: 'Ghost-API Tests',
            description: 'UI actions converted to direct API calls for maximum speed',
            tests,
            setupCode,
            teardownCode
        };
    }

    /**
     * Generate Ghost test for a form
     */
    private generateGhostFormTest(
        form: DiscoveredForm,
        page: DiscoveredPage,
        siteMap: SiteMap
    ): GeneratedTest {
        const ext = this.config.language === 'typescript' ? 'ts' : 'js';
        const testName = `ghost_${form.purpose}_${form.id}`;

        const fieldAssignments = form.fields.map(f => {
            const value = this.generateFieldValue(f);
            return `        ${f.name}: ${value}`;
        }).join(',\n');

        const code = `
${this.config.includeComments ? `/**
 * 👻 Ghost-API Test: ${form.purpose}
 * Auto-generated from form: ${form.id}
 * Original page: ${page.url}
 * 
 * This test bypasses the UI and calls the API directly.
 * Expected speedup: ~100x faster than UI test
 */` : ''}
import { test, expect } from '@playwright/test';
import { GhostProtocol } from '../src/ghost/ghost-protocol';

test.describe('Ghost: ${this.capitalize(form.purpose)} Form', () => {
    let ghost: GhostProtocol;

    test.beforeEach(async ({ page }) => {
        ghost = new GhostProtocol(page);
        await ghost.initialize();
    });

    test('should submit ${form.purpose} form via API', async ({ page }) => {
        ${this.config.includeComments ? '// Form data - auto-generated based on field analysis' : ''}
        const formData = {
${fieldAssignments}
        };

        ${this.config.includeComments ? '// Ghost Protocol: Direct API call instead of UI interaction' : ''}
        const response = await ghost.submitForm({
            endpoint: '${form.action}',
            method: '${form.method}',
            data: formData
        });

        ${this.config.includeComments ? '// Assertions' : ''}
        expect(response.status).toBe(200);
        expect(response.success).toBeTruthy();
    });

    test('should validate required fields', async ({ page }) => {
        ${this.config.includeComments ? '// Submit empty form to test validation' : ''}
        const response = await ghost.submitForm({
            endpoint: '${form.action}',
            method: '${form.method}',
            data: {}
        });

        expect(response.status).toBe(400);
        ${form.fields.filter(f => f.required).map(f => 
            `expect(response.errors).toContain('${f.name}');`
        ).join('\n        ')}
    });
});
`;

        return {
            id: `ghost_${form.id}`,
            name: testName,
            type: 'ghost-api',
            filePath: `ghost/${testName}.spec.${ext}`,
            code: code.trim(),
            estimatedDuration: 50, // ms - Ghost tests are fast!
            coverage: [form.action]
        };
    }

    /**
     * Generate Ghost test for an API endpoint
     */
    private generateGhostApiTest(endpoint: any, siteMap: SiteMap): GeneratedTest {
        const ext = this.config.language === 'typescript' ? 'ts' : 'js';
        const urlParts = endpoint.url.split('/').filter(Boolean);
        const resourceName = urlParts[urlParts.length - 1] || 'resource';
        const testName = `ghost_api_${endpoint.method.toLowerCase()}_${resourceName}`;

        const code = `
${this.config.includeComments ? `/**
 * 👻 Ghost-API Test: ${endpoint.method} ${endpoint.url}
 * Auto-generated from captured API traffic
 * Auth: ${endpoint.authentication}
 * Avg Response: ${Math.round(endpoint.avgResponseTime)}ms
 */` : ''}
import { test, expect } from '@playwright/test';
import { GhostProtocol } from '../src/ghost/ghost-protocol';

test.describe('Ghost API: ${endpoint.method} ${resourceName}', () => {
    let ghost: GhostProtocol;

    test.beforeEach(async ({ page }) => {
        ghost = new GhostProtocol(page);
        await ghost.initialize();
        ${endpoint.authentication !== 'none' ? `await ghost.authenticate();` : ''}
    });

    test('should ${endpoint.method} ${resourceName} successfully', async () => {
        const response = await ghost.api({
            method: '${endpoint.method}',
            url: '${endpoint.url}',
            ${endpoint.requestSchema ? `data: ${JSON.stringify(endpoint.requestSchema, null, 12)}` : ''}
        });

        expect(response.status).toBeLessThan(400);
        ${endpoint.responseSchema ? `expect(response.data).toMatchSchema(${JSON.stringify(endpoint.responseSchema)});` : ''}
    });

    test('should respond within SLA (${Math.round(endpoint.avgResponseTime * 2)}ms)', async () => {
        const start = Date.now();
        
        await ghost.api({
            method: '${endpoint.method}',
            url: '${endpoint.url}'
        });

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(${Math.round(endpoint.avgResponseTime * 2)});
    });
});
`;

        return {
            id: `ghost_api_${endpoint.method}_${resourceName}`,
            name: testName,
            type: 'ghost-api',
            filePath: `ghost/api/${testName}.spec.${ext}`,
            code: code.trim(),
            estimatedDuration: 100,
            coverage: [endpoint.url]
        };
    }

    /**
     * 🎭 Generate Playwright UI tests
     */
    private async generatePlaywrightTests(siteMap: SiteMap): Promise<TestSuite> {
        console.log('🏭 [FACTORY] Generating Playwright UI tests...');

        const tests: GeneratedTest[] = [];

        // Generate page tests
        for (const page of siteMap.pages.values()) {
            const test = this.generatePageTest(page, siteMap);
            tests.push(test);
        }

        // Generate form interaction tests
        for (const page of siteMap.pages.values()) {
            for (const form of page.forms) {
                const test = this.generateFormUITest(form, page);
                tests.push(test);
            }
        }

        return {
            name: 'Playwright UI Tests',
            description: 'Full browser tests with visual verification',
            tests,
            setupCode: this.generatePlaywrightSetup(siteMap),
            teardownCode: this.generatePlaywrightTeardown()
        };
    }

    /**
     * Generate page test
     */
    private generatePageTest(page: DiscoveredPage, siteMap: SiteMap): GeneratedTest {
        const ext = this.config.language === 'typescript' ? 'ts' : 'js';
        const pageName = this.urlToTestName(page.url);
        const testName = `ui_page_${pageName}`;

        const code = `
${this.config.includeComments ? `/**
 * 🎭 Playwright UI Test: ${page.title || page.url}
 * Auto-generated from page discovery
 * Type: ${page.pageType}
 * Business Function: ${page.businessFunction || 'N/A'}
 */` : ''}
import { test, expect } from '@playwright/test';
import { NeuralMapEngine } from '../src/cognitive/neural-map-engine';

test.describe('Page: ${page.title || pageName}', () => {
    let neuralMap: NeuralMapEngine;

    test.beforeEach(async ({ page: browserPage }) => {
        neuralMap = new NeuralMapEngine();
        await browserPage.goto('${page.url}');
    });

    test('should load successfully', async ({ page: browserPage }) => {
        ${this.config.includeComments ? '// Verify page loaded' : ''}
        await expect(browserPage).toHaveTitle(/${this.escapeRegex(page.title || '')}/i);
        
        ${this.config.includeComments ? '// Check for critical elements' : ''}
        ${page.buttons.slice(0, 3).map(btn => 
            `await expect(browserPage.getByRole('button', { name: /${this.escapeRegex(btn.text)}/i })).toBeVisible();`
        ).join('\n        ')}
    });

    test('should have no accessibility violations', async ({ page: browserPage }) => {
        ${this.config.includeComments ? '// Run accessibility audit' : ''}
        const violations = await browserPage.evaluate(async () => {
            // @ts-ignore - axe injected
            if (window.axe) {
                const results = await window.axe.run();
                return results.violations;
            }
            return [];
        });

        expect(violations).toHaveLength(0);
    });

    test('should match visual baseline', async ({ page: browserPage }) => {
        ${this.config.includeComments ? '// Visual regression test' : ''}
        await expect(browserPage).toHaveScreenshot('${pageName}.png', {
            maxDiffPixels: 100
        });
    });
});
`;

        return {
            id: `ui_page_${pageName}`,
            name: testName,
            type: 'playwright-ui',
            filePath: `playwright/pages/${testName}.spec.${ext}`,
            code: code.trim(),
            estimatedDuration: 3000, // ms - UI tests are slower
            coverage: [page.url]
        };
    }

    /**
     * Generate form UI test
     */
    private generateFormUITest(form: DiscoveredForm, page: DiscoveredPage): GeneratedTest {
        const ext = this.config.language === 'typescript' ? 'ts' : 'js';
        const testName = `ui_form_${form.purpose}_${form.id}`;

        const fillActions = form.fields.map(f => {
            const value = this.generateFieldValue(f);
            const selector = this.getFieldSelector(f);
            return `        await page.${this.getFieldFillMethod(f)}(${selector}, ${value});`;
        }).join('\n');

        const code = `
${this.config.includeComments ? `/**
 * 🎭 Playwright Form Test: ${form.purpose}
 * Auto-generated from form: ${form.id}
 * Page: ${page.url}
 * Method: ${form.method}
 */` : ''}
import { test, expect } from '@playwright/test';
import { NeuralMapEngine } from '../src/cognitive/neural-map-engine';

test.describe('Form: ${this.capitalize(form.purpose)}', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('${page.url}');
    });

    test('should submit form successfully', async ({ page }) => {
        ${this.config.includeComments ? '// Fill form fields' : ''}
${fillActions}

        ${this.config.includeComments ? '// Submit form' : ''}
        await page.click('button[type="submit"], input[type="submit"]');

        ${this.config.includeComments ? '// Verify success' : ''}
        await expect(page.locator('.success, .alert-success, [data-testid="success"]')).toBeVisible();
    });

    test('should show validation errors for empty required fields', async ({ page }) => {
        ${this.config.includeComments ? '// Submit empty form' : ''}
        await page.click('button[type="submit"], input[type="submit"]');

        ${this.config.includeComments ? '// Check for validation errors' : ''}
        ${form.fields.filter(f => f.required).map(f =>
            `await expect(page.locator('[data-error="${f.name}"], #${f.name}-error, .error')).toBeVisible();`
        ).join('\n        ')}
    });

    ${form.fields.filter(f => f.validation).map(f => `
    test('should validate ${f.name} format', async ({ page }) => {
        ${this.config.includeComments ? '// Enter invalid value' : ''}
        await page.fill('[name="${f.name}"]', 'invalid_value');
        await page.click('button[type="submit"]');

        ${this.config.includeComments ? '// Should show validation error' : ''}
        await expect(page.locator('[data-error="${f.name}"], .error')).toBeVisible();
    });`).join('\n')}
});
`;

        return {
            id: `ui_form_${form.id}`,
            name: testName,
            type: 'playwright-ui',
            filePath: `playwright/forms/${testName}.spec.${ext}`,
            code: code.trim(),
            estimatedDuration: 5000,
            coverage: [page.url, form.action]
        };
    }

    /**
     * 🔌 Generate pure API tests
     */
    private async generateApiTests(siteMap: SiteMap): Promise<TestSuite> {
        console.log('🏭 [FACTORY] Generating API tests...');

        const tests: GeneratedTest[] = [];

        for (const [key, endpoint] of Object.entries(siteMap.apiEndpoints)) {
            const ep = endpoint as any;
            const test = this.generateApiEndpointTest(ep);
            tests.push(test);
        }

        return {
            name: 'API Tests',
            description: 'Direct API endpoint tests',
            tests,
            setupCode: this.generateApiSetup(siteMap),
            teardownCode: ''
        };
    }

    /**
     * Generate API endpoint test
     */
    private generateApiEndpointTest(endpoint: any): GeneratedTest {
        const ext = this.config.language === 'typescript' ? 'ts' : 'js';
        const urlParts = endpoint.url.split('/').filter(Boolean);
        const resourceName = urlParts[urlParts.length - 1] || 'api';
        const testName = `api_${endpoint.method.toLowerCase()}_${resourceName}`;

        const code = `
${this.config.includeComments ? `/**
 * 🔌 API Test: ${endpoint.method} ${endpoint.url}
 * Auth: ${endpoint.authentication}
 * Usage Count: ${endpoint.usageCount}
 */` : ''}
import { test, expect, request } from '@playwright/test';

test.describe('API: ${endpoint.method} ${resourceName}', () => {
    let apiContext;

    test.beforeAll(async () => {
        apiContext = await request.newContext({
            baseURL: '${new URL(endpoint.url).origin}',
            extraHTTPHeaders: {
                ${endpoint.authentication === 'bearer' ? "'Authorization': 'Bearer {{TOKEN}}'," : ''}
                ${endpoint.authentication === 'api-key' ? "'X-API-Key': '{{API_KEY}}'," : ''}
                'Content-Type': 'application/json'
            }
        });
    });

    test('${endpoint.method} should return success', async () => {
        const response = await apiContext.${endpoint.method.toLowerCase()}('${new URL(endpoint.url).pathname}'${
            endpoint.method !== 'GET' ? `, { data: {} }` : ''
        });

        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBeLessThan(400);
    });

    test('should respond within acceptable time', async () => {
        const start = Date.now();
        
        await apiContext.${endpoint.method.toLowerCase()}('${new URL(endpoint.url).pathname}');
        
        const duration = Date.now() - start;
        expect(duration).toBeLessThan(${Math.max(1000, Math.round(endpoint.avgResponseTime * 3))});
    });

    ${endpoint.authentication !== 'none' ? `
    test('should reject unauthorized requests', async () => {
        const unauthContext = await request.newContext({
            baseURL: '${new URL(endpoint.url).origin}'
        });

        const response = await unauthContext.${endpoint.method.toLowerCase()}('${new URL(endpoint.url).pathname}');
        
        expect(response.status()).toBe(401);
    });` : ''}
});
`;

        return {
            id: `api_${endpoint.method}_${resourceName}`,
            name: testName,
            type: 'api',
            filePath: `api/${testName}.spec.${ext}`,
            code: code.trim(),
            estimatedDuration: 500,
            coverage: [endpoint.url]
        };
    }

    /**
     * 🔄 Generate E2E flow tests
     */
    private async generateE2ETests(siteMap: SiteMap): Promise<TestSuite> {
        console.log('🏭 [FACTORY] Generating E2E flow tests...');

        const tests: GeneratedTest[] = [];

        for (const flow of siteMap.transactionFlows) {
            const test = this.generateFlowTest(flow, siteMap);
            tests.push(test);
        }

        return {
            name: 'E2E Flow Tests',
            description: 'End-to-end business flow tests',
            tests,
            setupCode: this.generateE2ESetup(siteMap),
            teardownCode: this.generateE2ETeardown()
        };
    }

    /**
     * Generate flow test
     */
    private generateFlowTest(flow: TransactionFlow, siteMap: SiteMap): GeneratedTest {
        const ext = this.config.language === 'typescript' ? 'ts' : 'js';
        const testName = `e2e_${flow.id}`;

        const stepCode = flow.steps.map((step, i) => {
            switch (step.action) {
                case 'navigate':
                    return `        // Step ${i + 1}: Navigate
        await page.goto('${step.pageUrl}');
        await page.waitForLoadState('networkidle');`;
                case 'click':
                    return `        // Step ${i + 1}: Click
        await page.click('${step.target}');`;
                case 'fill':
                    return `        // Step ${i + 1}: Fill
        await page.fill('${step.target}', '${step.value}');`;
                case 'submit':
                    return `        // Step ${i + 1}: Submit
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');`;
                default:
                    return `        // Step ${i + 1}: ${step.action}`;
            }
        }).join('\n\n');

        const code = `
${this.config.includeComments ? `/**
 * 🔄 E2E Flow Test: ${flow.name}
 * Auto-generated from transaction flow discovery
 * Business Purpose: ${flow.businessPurpose}
 * Steps: ${flow.steps.length}
 */` : ''}
import { test, expect } from '@playwright/test';

test.describe('E2E: ${flow.name}', () => {
    test('should complete ${flow.name} flow', async ({ page }) => {
        ${this.config.includeComments ? `// Flow: ${flow.startPage} → ${flow.endPage}` : ''}
        
${stepCode}

        ${this.config.includeComments ? '// Verify flow completed successfully' : ''}
        await expect(page).toHaveURL(/${this.escapeRegex(flow.endPage)}/);
    });

    test('should handle errors gracefully', async ({ page }) => {
        ${this.config.includeComments ? '// Navigate to start page' : ''}
        await page.goto('${flow.startPage}');

        ${this.config.includeComments ? '// Simulate network error' : ''}
        await page.route('**/api/**', route => route.abort());

        ${this.config.includeComments ? '// Trigger flow and verify error handling' : ''}
        await page.click('button[type="submit"]');
        await expect(page.locator('.error, .alert-danger, [role="alert"]')).toBeVisible();
    });
});
`;

        return {
            id: flow.id,
            name: testName,
            type: 'e2e',
            filePath: `e2e/${testName}.spec.${ext}`,
            code: code.trim(),
            estimatedDuration: 10000,
            coverage: [flow.startPage, flow.endPage, ...flow.steps.map(s => s.pageUrl)]
        };
    }

    /**
     * 📦 Generate data factories
     */
    private async generateDataFactories(siteMap: SiteMap): Promise<void> {
        console.log('🏭 [FACTORY] Generating data factories...');

        const ext = this.config.language === 'typescript' ? 'ts' : 'js';
        const factories: string[] = [];

        // Collect all form fields
        const allFields = new Map<string, Set<string>>();
        for (const page of siteMap.pages.values()) {
            for (const form of page.forms) {
                for (const field of form.fields) {
                    if (!allFields.has(field.type)) {
                        allFields.set(field.type, new Set());
                    }
                    allFields.get(field.type)!.add(field.name);
                }
            }
        }

        const code = `
/**
 * 📦 Test Data Factory
 * Auto-generated from discovered forms
 */
import { faker } from '@faker-js/faker';

export class TestDataFactory {
    ${Array.from(allFields.entries()).map(([type, names]) => `
    /**
     * Generate ${type} data
     * Used in: ${Array.from(names).join(', ')}
     */
    static ${type}(): string {
        ${this.getFactoryMethod(type)}
    }`).join('\n')}

    /**
     * Generate form data
     */
    static formData(formType: string): Record<string, any> {
        switch (formType) {
            ${Array.from(siteMap.pages.values())
                .flatMap(p => p.forms)
                .map(form => `
            case '${form.purpose}':
                return {
                    ${form.fields.map(f => `${f.name}: this.${f.type}()`).join(',\n                    ')}
                };`).join('')}
            default:
                return {};
        }
    }
}
`;

        const dir = path.join(this.config.outputDir, 'factories');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(
            path.join(dir, `test-data-factory.${ext}`),
            code.trim()
        );
    }

    // ============================================================
    // SETUP/TEARDOWN GENERATORS
    // ============================================================

    private generateGhostSetup(siteMap: SiteMap): string {
        return `
import { GhostProtocol } from '../src/ghost/ghost-protocol';

export async function setupGhost(page) {
    const ghost = new GhostProtocol(page);
    await ghost.initialize();
    ${siteMap.authentication ? `
    // Auto-authenticate
    await ghost.authenticate({
        loginUrl: '${siteMap.authentication.loginUrl}',
        username: process.env.TEST_USER,
        password: process.env.TEST_PASS
    });` : ''}
    return ghost;
}
`;
    }

    private generateGhostTeardown(): string {
        return `
export async function teardownGhost(ghost) {
    await ghost.cleanup();
}
`;
    }

    private generatePlaywrightSetup(siteMap: SiteMap): string {
        return `
import { test as base } from '@playwright/test';
import { NeuralMapEngine } from '../src/cognitive/neural-map-engine';

export const test = base.extend({
    neuralMap: async ({ page }, use) => {
        const nm = new NeuralMapEngine();
        await use(nm);
    }
});
`;
    }

    private generatePlaywrightTeardown(): string {
        return '';
    }

    private generateApiSetup(siteMap: SiteMap): string {
        return `
export const API_BASE = '${siteMap.baseUrl}';
`;
    }

    private generateE2ESetup(siteMap: SiteMap): string {
        return `
import { test, expect } from '@playwright/test';

// E2E Test Setup
test.beforeEach(async ({ page }) => {
    // Clear cookies and storage
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
});
`;
    }

    private generateE2ETeardown(): string {
        return `
test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
        await page.screenshot({ path: \`./screenshots/\${testInfo.title}.png\` });
    }
});
`;
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    private generateFieldValue(field: any): string {
        switch (field.type) {
            case 'email':
                return `'test_${Date.now()}@example.com'`;
            case 'password':
                return `'TestPass123!'`;
            case 'tel':
            case 'phone':
                return `'+1234567890'`;
            case 'number':
                return `123`;
            case 'date':
                return `'2024-01-15'`;
            case 'url':
                return `'https://example.com'`;
            case 'checkbox':
                return `true`;
            default:
                return `'Test ${field.name || 'Value'}'`;
        }
    }

    private getFieldSelector(field: any): string {
        if (field.name) return `'[name="${field.name}"]'`;
        if (field.label) return `'text=${field.label}'`;
        return `'[type="${field.type}"]'`;
    }

    private getFieldFillMethod(field: any): string {
        switch (field.type) {
            case 'checkbox':
                return 'check';
            case 'select':
                return 'selectOption';
            default:
                return 'fill';
        }
    }

    private getFactoryMethod(type: string): string {
        switch (type) {
            case 'email':
                return `return faker.internet.email();`;
            case 'password':
                return `return faker.internet.password({ length: 12 });`;
            case 'text':
                return `return faker.lorem.words(3);`;
            case 'tel':
            case 'phone':
                return `return faker.phone.number();`;
            case 'number':
                return `return faker.number.int({ min: 1, max: 1000 }).toString();`;
            case 'date':
                return `return faker.date.future().toISOString().split('T')[0];`;
            case 'url':
                return `return faker.internet.url();`;
            default:
                return `return faker.lorem.word();`;
        }
    }

    private urlToTestName(url: string): string {
        try {
            const urlObj = new URL(url);
            return urlObj.pathname
                .replace(/\//g, '_')
                .replace(/[^a-zA-Z0-9_]/g, '')
                .replace(/^_+|_+$/g, '') || 'root';
        } catch {
            return 'page';
        }
    }

    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Write tests to disk
     */
    private async writeTestsToDisk(suites: TestSuite[]): Promise<void> {
        for (const suite of suites) {
            for (const test of suite.tests) {
                const fullPath = path.join(this.config.outputDir, test.filePath);
                const dir = path.dirname(fullPath);

                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }

                fs.writeFileSync(fullPath, test.code);
            }
        }
    }

    /**
     * Print summary
     */
    private printSummary(suites: TestSuite[]): void {
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════════╗');
        console.log('║  🏭 TEST FACTORY SUMMARY                                      ║');
        console.log('╠═══════════════════════════════════════════════════════════════╣');

        let totalTests = 0;
        let totalDuration = 0;

        for (const suite of suites) {
            console.log(`║  ${suite.name.padEnd(50)} ║`);
            console.log(`║    Tests: ${suite.tests.length.toString().padEnd(42)} ║`);
            
            const suiteDuration = suite.tests.reduce((sum, t) => sum + t.estimatedDuration, 0);
            console.log(`║    Est. Duration: ${(suiteDuration / 1000).toFixed(1)}s`.padEnd(62) + '║');
            
            totalTests += suite.tests.length;
            totalDuration += suiteDuration;
        }

        console.log('╠═══════════════════════════════════════════════════════════════╣');
        console.log(`║  TOTAL: ${totalTests} tests`.padEnd(62) + '║');
        console.log(`║  UI Duration: ~${(totalDuration / 1000).toFixed(0)}s`.padEnd(62) + '║');
        console.log(`║  Ghost Duration: ~${(totalDuration / 100000).toFixed(1)}s (100x faster!)`.padEnd(62) + '║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
    }
}

// ============================================================
// EXPORTS
// ============================================================
export function createTestFactory(config?: Partial<TestFactoryConfig>): AutoTestFactory {
    return new AutoTestFactory(config);
}
