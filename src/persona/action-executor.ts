/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * This file is part of QAntum.
 * Unauthorized copying, modification, distribution, or use of this file,
 * via any medium, is strictly prohibited without express written permission.
 * 
 * For licensing inquiries: dimitar.prodromov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { PersonaEngine, BehaviorProfile, UserPersona } from './persona-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 ACTION EXECUTOR - Persona-Aware Interaction Engine
// ═══════════════════════════════════════════════════════════════════════════════
// Executes browser actions with realistic human-like behavior based on persona
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Action types supported by the executor
 */
export type ActionType = 
    | 'click'
    | 'type'
    | 'scroll'
    | 'hover'
    | 'wait'
    | 'navigate'
    | 'screenshot';

/**
 * Action configuration
 */
export interface Action {
    type: ActionType;
    selector?: string;
    value?: string;
    x?: number;
    y?: number;
    timeout?: number;
    options?: Record<string, unknown>;
}

/**
 * Execution result
 */
export interface ActionResult {
    success: boolean;
    action: Action;
    duration: number;
    rageClicked: boolean;
    missClicked: boolean;
    retries: number;
    error?: string;
}

/**
 * Page interface (Playwright-like)
 */
export interface PageLike {
    click(selector: string, options?: Record<string, unknown>): Promise<void>;
    type(selector: string, text: string, options?: Record<string, unknown>): Promise<void>;
    hover(selector: string): Promise<void>;
    waitForSelector(selector: string, options?: Record<string, unknown>): Promise<unknown>;
    evaluate<T>(fn: (...args: unknown[]) => T, ...args: unknown[]): Promise<T>;
    mouse: {
        move(x: number, y: number, options?: Record<string, unknown>): Promise<void>;
        click(x: number, y: number, options?: Record<string, unknown>): Promise<void>;
    };
    keyboard: {
        type(text: string, options?: Record<string, unknown>): Promise<void>;
        press(key: string): Promise<void>;
    };
    screenshot(options?: Record<string, unknown>): Promise<Buffer>;
    goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
}

/**
 * 🎮 ActionExecutor - Executes actions with persona-based behavior
 * 
 * Integrates with PersonaEngine to simulate realistic user interactions
 * including rage clicks, miss clicks, and human-like timing.
 */
export class ActionExecutor extends EventEmitter {
    private personaEngine: PersonaEngine;
    private page: PageLike | null = null;
    private loadStartTime: number = 0;
    
    constructor(personaEngine?: PersonaEngine) {
        super();
        this.personaEngine = personaEngine || new PersonaEngine();
    }
    
    /**
     * Set the page instance to execute actions on
     */
    setPage(page: PageLike): void {
        this.page = page;
    }
    
    /**
     * Load a persona for behavior simulation
     */
    loadPersona(personaOrTemplate: UserPersona | string): BehaviorProfile {
        return this.personaEngine.loadPersona(personaOrTemplate);
    }
    
    /**
     * Execute an action with persona-based behavior
     */
    async execute(action: Action): Promise<ActionResult> {
        if (!this.page) {
            throw new Error('No page set. Call setPage() first.');
        }
        
        const startTime = Date.now();
        let rageClicked = false;
        let missClicked = false;
        let retries = 0;
        
        try {
            // Add persona-based delay before action
            await this.addInteractionDelay();
            
            switch (action.type) {
                case 'click':
                    const clickResult = await this.executeClick(action);
                    rageClicked = clickResult.rageClicked;
                    missClicked = clickResult.missClicked;
                    retries = clickResult.retries;
                    break;
                    
                case 'type':
                    await this.executeType(action);
                    break;
                    
                case 'scroll':
                    await this.executeScroll(action);
                    break;
                    
                case 'hover':
                    await this.executeHover(action);
                    break;
                    
                case 'wait':
                    await this.executeWait(action);
                    break;
                    
                case 'navigate':
                    const navResult = await this.executeNavigate(action);
                    rageClicked = navResult.rageClicked;
                    break;
                    
                case 'screenshot':
                    await this.page.screenshot(action.options);
                    break;
                    
                default:
                    throw new Error(`Unknown action type: ${action.type}`);
            }
            
            return {
                success: true,
                action,
                duration: Date.now() - startTime,
                rageClicked,
                missClicked,
                retries,
            };
            
        } catch (error) {
            return {
                success: false,
                action,
                duration: Date.now() - startTime,
                rageClicked,
                missClicked,
                retries,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    
    /**
     * Execute click with persona behavior (rage clicks, miss clicks)
     */
    private async executeClick(action: Action): Promise<{
        rageClicked: boolean;
        missClicked: boolean;
        retries: number;
    }> {
        if (!this.page || !action.selector) {
            throw new Error('Page or selector not provided');
        }
        
        let rageClicked = false;
        let missClicked = false;
        let retries = 0;
        
        const profile = this.personaEngine.getBehaviorProfile();
        
        // Wait for element with timeout check
        const waitStart = Date.now();
        try {
            await this.page.waitForSelector(action.selector, {
                timeout: action.timeout || 10000
            });
        } catch {
            const waitTime = Date.now() - waitStart;
            
            // Check if we should rage click
            if (profile && this.personaEngine.shouldRageClick(waitTime)) {
                rageClicked = true;
                this.emit('rage-click', { selector: action.selector, waitTime });
                
                // Execute rage clicks at approximate position
                const rageClicks = this.personaEngine.generateRageClicks(
                    action.x || 500,
                    action.y || 300
                );
                
                for (const click of rageClicks) {
                    await this.page.mouse.click(click.x, click.y);
                    await this.delay(click.delay);
                }
            }
            
            throw new Error(`Element not found: ${action.selector}`);
        }
        
        // Get element dimensions for miss-click check
        const elementInfo = await this.page.evaluate((sel: string) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                width: rect.width,
                height: rect.height
            };
        }, action.selector);
        
        if (elementInfo && profile) {
            // Check if we should miss the click
            if (this.personaEngine.shouldMissClick(elementInfo.width, elementInfo.height)) {
                missClicked = true;
                retries++;
                this.emit('miss-click', { 
                    selector: action.selector,
                    size: { width: elementInfo.width, height: elementInfo.height }
                });
                
                // Click slightly off-target
                const missOffset = profile.mousePrecision * 2;
                await this.page.mouse.click(
                    elementInfo.x + missOffset,
                    elementInfo.y + missOffset
                );
                
                // Wait and retry with correct click
                await this.delay(300);
            }
            
            // Generate realistic mouse path
            const mousePos = await this.page.evaluate(() => ({ x: 0, y: 0 }));
            const path = this.personaEngine.generateMousePath(
                mousePos.x,
                mousePos.y,
                elementInfo.x,
                elementInfo.y
            );
            
            // Move along path
            for (const point of path) {
                await this.page.mouse.move(point.x, point.y, { steps: 1 });
            }
        }
        
        // Execute the actual click
        await this.page.click(action.selector, action.options);
        
        return { rageClicked, missClicked, retries };
    }
    
    /**
     * Execute type with realistic typing speed
     */
    private async executeType(action: Action): Promise<void> {
        if (!this.page || !action.selector || !action.value) {
            throw new Error('Page, selector, or value not provided');
        }
        
        await this.page.waitForSelector(action.selector);
        
        // Type character by character with persona-based delays
        for (const char of action.value) {
            const delay = this.personaEngine.getTypingDelay();
            await this.page.keyboard.type(char);
            await this.delay(delay);
        }
    }
    
    /**
     * Execute scroll with persona-based speed
     */
    private async executeScroll(action: Action): Promise<void> {
        if (!this.page) return;
        
        const profile = this.personaEngine.getBehaviorProfile();
        const scrollSpeed = profile?.scrollSpeed || 1;
        
        const scrollAmount = (action.value ? parseInt(action.value) : 300) * scrollSpeed;
        
        await this.page.evaluate((amount: number) => {
            window.scrollBy({ top: amount, behavior: 'smooth' });
        }, scrollAmount);
    }
    
    /**
     * Execute hover with realistic mouse movement
     */
    private async executeHover(action: Action): Promise<void> {
        if (!this.page || !action.selector) {
            throw new Error('Page or selector not provided');
        }
        
        await this.page.waitForSelector(action.selector);
        await this.page.hover(action.selector);
    }
    
    /**
     * Execute wait
     */
    private async executeWait(action: Action): Promise<void> {
        const waitTime = action.timeout || 1000;
        await this.delay(waitTime);
    }
    
    /**
     * Execute navigation with load time monitoring
     */
    private async executeNavigate(action: Action): Promise<{ rageClicked: boolean }> {
        if (!this.page || !action.value) {
            throw new Error('Page or URL not provided');
        }
        
        let rageClicked = false;
        this.loadStartTime = Date.now();
        
        const profile = this.personaEngine.getBehaviorProfile();
        const timeout = action.timeout || 30000;
        
        // Monitor load time in background
        const rageCheckInterval = setInterval(() => {
            if (profile) {
                const elapsed = Date.now() - this.loadStartTime;
                if (this.personaEngine.shouldRageClick(elapsed) && !rageClicked) {
                    rageClicked = true;
                    this.emit('rage-click-during-load', { 
                        url: action.value,
                        elapsed 
                    });
                }
            }
        }, 500);
        
        try {
            await this.page.goto(action.value, { timeout });
        } finally {
            clearInterval(rageCheckInterval);
        }
        
        return { rageClicked };
    }
    
    /**
     * Add persona-based delay between interactions
     */
    private async addInteractionDelay(): Promise<void> {
        const delay = this.personaEngine.getInteractionDelay();
        await this.delay(delay);
    }
    
    /**
     * Delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get UX recommendations based on test session
     */
    getUXRecommendations(): string[] {
        return this.personaEngine.generateUXRecommendations();
    }
    
    /**
     * Get frustration metrics
     */
    getFrustrationMetrics() {
        return this.personaEngine.getFrustrationMetrics();
    }
    
    /**
     * Get interaction log
     */
    getInteractionLog() {
        return this.personaEngine.getInteractionLog();
    }
    
    /**
     * Reset session
     */
    reset(): void {
        this.personaEngine.clearInteractionLog();
        this.loadStartTime = 0;
    }
}

// Export singleton instance
export const actionExecutor = new ActionExecutor();
