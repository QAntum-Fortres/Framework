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

// ═══════════════════════════════════════════════════════════════════════════════
// 🎭 PERSONA ENGINE v21.0 - THE PERSONA SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════
// Simulates realistic human user behaviors for UX testing
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * User persona configuration interface
 * Defines behavioral parameters for simulating different user types
 */
export interface UserPersona {
    /** Unique identifier for the persona */
    id: string;
    
    /** Human-readable name */
    name: string;
    
    /** Technical proficiency (0-100) - affects interaction patterns */
    techSavviness: number;
    
    /** Patience level (0-100) - affects wait times and rage behavior */
    patienceLevel: number;
    
    /** Visual impairment level (0-100) - affects target size requirements */
    visualImpairment: number;
    
    /** Interaction speed (0-100) - affects click/type speeds */
    interactionSpeed: number;
    
    /** Age group for demographic simulation */
    ageGroup?: 'teen' | 'young-adult' | 'adult' | 'senior';
    
    /** Device familiarity */
    deviceFamiliarity?: 'novice' | 'intermediate' | 'expert';
    
    /** Accessibility needs */
    accessibilityNeeds?: AccessibilityNeeds;
}

/**
 * Accessibility requirements for persona
 */
export interface AccessibilityNeeds {
    screenReader?: boolean;
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
    colorBlindness?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

/**
 * Behavior modifiers calculated from persona
 */
export interface BehaviorProfile {
    /** Time to wait before rage clicking (ms) */
    rageClickThreshold: number;
    
    /** Number of rage clicks when frustrated */
    rageClickCount: number;
    
    /** Minimum clickable target size (px) */
    minTargetSize: number;
    
    /** Delay between interactions (ms) */
    interactionDelay: number;
    
    /** Typing speed (chars per minute) */
    typingSpeed: number;
    
    /** Mouse movement precision (px variance) */
    mousePrecision: number;
    
    /** Reading speed (words per minute) */
    readingSpeed: number;
    
    /** Likelihood of missing small targets (0-1) */
    missClickProbability: number;
    
    /** Scroll speed multiplier */
    scrollSpeed: number;
    
    /** Double-click instead of single-click probability */
    doubleClickProbability: number;
}

/**
 * Interaction event for logging
 */
export interface InteractionEvent {
    timestamp: number;
    type: 'click' | 'rage-click' | 'miss-click' | 'type' | 'scroll' | 'wait' | 'frustration';
    details: Record<string, unknown>;
    persona: string;
}

/**
 * Pre-defined persona templates
 */
export const PERSONA_TEMPLATES: Record<string, Omit<UserPersona, 'id'>> = {
    // 👴 Senior user with low tech savviness
    'senior-novice': {
        name: 'Margaret (Senior Novice)',
        techSavviness: 20,
        patienceLevel: 70,
        visualImpairment: 40,
        interactionSpeed: 30,
        ageGroup: 'senior',
        deviceFamiliarity: 'novice',
        accessibilityNeeds: {
            largeText: true,
            highContrast: true,
            reducedMotion: true
        }
    },
    
    // 😤 Impatient power user
    'impatient-expert': {
        name: 'Alex (Impatient Expert)',
        techSavviness: 95,
        patienceLevel: 15,
        visualImpairment: 0,
        interactionSpeed: 90,
        ageGroup: 'young-adult',
        deviceFamiliarity: 'expert'
    },
    
    // 🧑‍💻 Average office worker
    'office-worker': {
        name: 'John (Office Worker)',
        techSavviness: 50,
        patienceLevel: 50,
        visualImpairment: 10,
        interactionSpeed: 50,
        ageGroup: 'adult',
        deviceFamiliarity: 'intermediate'
    },
    
    // 👶 Teen with high speed, low patience
    'teen-speedster': {
        name: 'Zoe (Teen Speedster)',
        techSavviness: 80,
        patienceLevel: 25,
        visualImpairment: 0,
        interactionSpeed: 95,
        ageGroup: 'teen',
        deviceFamiliarity: 'expert'
    },
    
    // ♿ Accessibility-focused user
    'accessibility-user': {
        name: 'Sam (Accessibility User)',
        techSavviness: 60,
        patienceLevel: 80,
        visualImpairment: 80,
        interactionSpeed: 40,
        ageGroup: 'adult',
        deviceFamiliarity: 'intermediate',
        accessibilityNeeds: {
            screenReader: true,
            highContrast: true,
            largeText: true,
            colorBlindness: 'deuteranopia'
        }
    },
    
    // 🌍 Non-native speaker / first-time user
    'first-time-user': {
        name: 'Maria (First Time User)',
        techSavviness: 40,
        patienceLevel: 60,
        visualImpairment: 5,
        interactionSpeed: 35,
        ageGroup: 'adult',
        deviceFamiliarity: 'novice'
    },
    
    // 📱 Mobile-first user on desktop
    'mobile-native': {
        name: 'Jake (Mobile Native)',
        techSavviness: 70,
        patienceLevel: 30,
        visualImpairment: 0,
        interactionSpeed: 85,
        ageGroup: 'young-adult',
        deviceFamiliarity: 'intermediate'
    },
    
    // 🔥 Rage-prone gamer
    'rage-gamer': {
        name: 'Kyle (Rage Gamer)',
        techSavviness: 85,
        patienceLevel: 5,
        visualImpairment: 0,
        interactionSpeed: 100,
        ageGroup: 'teen',
        deviceFamiliarity: 'expert'
    }
};

/**
 * 🎭 PersonaEngine - Simulates realistic human user behavior
 * 
 * Transforms UserPersona configurations into actionable behavior profiles
 * that can be used by ActionExecutor for realistic UX testing.
 */
export class PersonaEngine extends EventEmitter {
    private currentPersona: UserPersona | null = null;
    private behaviorProfile: BehaviorProfile | null = null;
    private interactionLog: InteractionEvent[] = [];
    private frustrationLevel: number = 0;
    private lastInteractionTime: number = 0;
    
    constructor() {
        super();
    }
    
    /**
     * Load a persona by template name or custom configuration
     */
    loadPersona(personaOrTemplate: UserPersona | string): BehaviorProfile {
        if (typeof personaOrTemplate === 'string') {
            const template = PERSONA_TEMPLATES[personaOrTemplate];
            if (!template) {
                throw new Error(`Unknown persona template: ${personaOrTemplate}`);
            }
            this.currentPersona = {
                id: `persona-${Date.now()}`,
                ...template
            };
        } else {
            this.currentPersona = personaOrTemplate;
        }
        
        this.behaviorProfile = this.calculateBehaviorProfile(this.currentPersona);
        this.frustrationLevel = 0;
        this.lastInteractionTime = Date.now();
        
        this.emit('persona-loaded', {
            persona: this.currentPersona,
            profile: this.behaviorProfile
        });
        
        return this.behaviorProfile;
    }
    
    /**
     * Calculate behavior profile from persona parameters
     */
    private calculateBehaviorProfile(persona: UserPersona): BehaviorProfile {
        const {
            techSavviness,
            patienceLevel,
            visualImpairment,
            interactionSpeed
        } = persona;
        
        // 🔥 Rage click threshold: Low patience = faster rage
        // Base: 5000ms, Min: 500ms for extremely impatient users
        const rageClickThreshold = Math.max(
            500,
            5000 - (100 - patienceLevel) * 45
        );
        
        // 💥 Rage click count: More clicks when more frustrated
        const rageClickCount = Math.ceil((100 - patienceLevel) / 15) + 2;
        
        // 🎯 Minimum target size: Larger for visual impairment
        // Base: 24px, Max: 64px for high impairment
        const minTargetSize = 24 + Math.floor(visualImpairment * 0.4);
        
        // ⏱️ Interaction delay: Slower for low tech/speed
        // Base: 100ms, Max: 2000ms for slow users
        const baseDelay = 100;
        const speedFactor = (100 - interactionSpeed) / 100;
        const techFactor = (100 - techSavviness) / 100;
        const interactionDelay = Math.floor(
            baseDelay + (speedFactor * 800) + (techFactor * 600)
        );
        
        // ⌨️ Typing speed: 20-120 CPM based on speed and tech
        const typingSpeed = Math.floor(
            20 + (interactionSpeed * 0.5) + (techSavviness * 0.5)
        );
        
        // 🎯 Mouse precision: Lower = more variance
        // Base: 2px, Max: 20px for low precision
        const mousePrecision = Math.floor(
            2 + ((100 - techSavviness) * 0.1) + (visualImpairment * 0.08)
        );
        
        // 📖 Reading speed: 100-400 WPM
        const readingSpeed = Math.floor(
            100 + (techSavviness * 2) + (interactionSpeed * 1)
        );
        
        // ❌ Miss-click probability: Higher for impaired/low-tech
        const missClickProbability = Math.min(
            0.3,
            (visualImpairment / 500) + ((100 - techSavviness) / 500)
        );
        
        // 📜 Scroll speed: Based on interaction speed
        const scrollSpeed = 0.5 + (interactionSpeed / 100);
        
        // 🖱️ Double-click probability: Higher for seniors/novices
        const doubleClickProbability = Math.min(
            0.15,
            ((100 - techSavviness) / 1000) + 
            (persona.ageGroup === 'senior' ? 0.05 : 0)
        );
        
        return {
            rageClickThreshold,
            rageClickCount,
            minTargetSize,
            interactionDelay,
            typingSpeed,
            mousePrecision,
            readingSpeed,
            missClickProbability,
            scrollSpeed,
            doubleClickProbability
        };
    }
    
    /**
     * Get current behavior profile
     */
    getBehaviorProfile(): BehaviorProfile | null {
        return this.behaviorProfile;
    }
    
    /**
     * Get current persona
     */
    getCurrentPersona(): UserPersona | null {
        return this.currentPersona;
    }
    
    /**
     * Check if rage click should be triggered
     * Called when page load or element interaction takes too long
     */
    shouldRageClick(waitTimeMs: number): boolean {
        if (!this.behaviorProfile || !this.currentPersona) return false;
        
        // Increase frustration over time
        this.frustrationLevel += waitTimeMs / this.behaviorProfile.rageClickThreshold;
        
        if (waitTimeMs >= this.behaviorProfile.rageClickThreshold) {
            this.logInteraction({
                type: 'frustration',
                details: {
                    waitTime: waitTimeMs,
                    threshold: this.behaviorProfile.rageClickThreshold,
                    frustrationLevel: this.frustrationLevel
                }
            });
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Generate rage click sequence
     */
    generateRageClicks(targetX: number, targetY: number): Array<{ x: number; y: number; delay: number }> {
        if (!this.behaviorProfile) return [];
        
        const clicks: Array<{ x: number; y: number; delay: number }> = [];
        const { rageClickCount, mousePrecision } = this.behaviorProfile;
        
        for (let i = 0; i < rageClickCount; i++) {
            // Add variance to click positions (frustrated clicking is imprecise)
            const variance = mousePrecision * (1 + this.frustrationLevel * 0.5);
            const x = targetX + (Math.random() - 0.5) * variance * 2;
            const y = targetY + (Math.random() - 0.5) * variance * 2;
            
            // Rapid succession with slight delays
            const delay = Math.floor(50 + Math.random() * 100);
            
            clicks.push({ x, y, delay });
        }
        
        this.logInteraction({
            type: 'rage-click',
            details: {
                targetX,
                targetY,
                clickCount: rageClickCount,
                frustrationLevel: this.frustrationLevel
            }
        });
        
        // Frustration decreases slightly after rage clicking
        this.frustrationLevel = Math.max(0, this.frustrationLevel - 0.3);
        
        return clicks;
    }
    
    /**
     * Simulate realistic mouse movement to target
     */
    generateMousePath(
        startX: number, 
        startY: number, 
        endX: number, 
        endY: number
    ): Array<{ x: number; y: number }> {
        if (!this.behaviorProfile) {
            return [{ x: endX, y: endY }];
        }
        
        const { mousePrecision } = this.behaviorProfile;
        const points: Array<{ x: number; y: number }> = [];
        
        const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const steps = Math.max(5, Math.floor(distance / 20));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            
            // Bezier-like curve with natural variance
            const easeT = t < 0.5 
                ? 2 * t * t 
                : 1 - Math.pow(-2 * t + 2, 2) / 2;
            
            let x = startX + (endX - startX) * easeT;
            let y = startY + (endY - startY) * easeT;
            
            // Add human-like jitter
            if (i > 0 && i < steps) {
                x += (Math.random() - 0.5) * mousePrecision;
                y += (Math.random() - 0.5) * mousePrecision;
            }
            
            points.push({ x: Math.round(x), y: Math.round(y) });
        }
        
        return points;
    }
    
    /**
     * Check if click should miss (based on target size and visual impairment)
     */
    shouldMissClick(targetWidth: number, targetHeight: number): boolean {
        if (!this.behaviorProfile) return false;
        
        const { minTargetSize, missClickProbability } = this.behaviorProfile;
        
        // Small targets are more likely to be missed
        const targetSize = Math.min(targetWidth, targetHeight);
        const sizeRatio = targetSize / minTargetSize;
        
        // If target is smaller than recommended, increase miss probability
        const adjustedProbability = sizeRatio < 1 
            ? missClickProbability * (2 - sizeRatio)
            : missClickProbability * sizeRatio;
        
        const shouldMiss = Math.random() < adjustedProbability;
        
        if (shouldMiss) {
            this.logInteraction({
                type: 'miss-click',
                details: {
                    targetWidth,
                    targetHeight,
                    minRecommended: minTargetSize,
                    probability: adjustedProbability
                }
            });
        }
        
        return shouldMiss;
    }
    
    /**
     * Calculate typing delay for realistic typing simulation
     */
    getTypingDelay(): number {
        if (!this.behaviorProfile) return 100;
        
        const { typingSpeed } = this.behaviorProfile;
        const baseDelay = (60 * 1000) / typingSpeed; // ms per character
        
        // Add natural variance (±30%)
        const variance = baseDelay * 0.3;
        return baseDelay + (Math.random() - 0.5) * variance * 2;
    }
    
    /**
     * Calculate reading time for content
     */
    getReadingTime(wordCount: number): number {
        if (!this.behaviorProfile) return wordCount * 200;
        
        const { readingSpeed } = this.behaviorProfile;
        const baseTime = (wordCount / readingSpeed) * 60 * 1000;
        
        // Add variance for re-reading, confusion, etc.
        const variance = baseTime * 0.2;
        return baseTime + (Math.random() * variance);
    }
    
    /**
     * Get interaction delay for current persona
     */
    getInteractionDelay(): number {
        if (!this.behaviorProfile) return 200;
        
        const { interactionDelay } = this.behaviorProfile;
        
        // Add variance (±25%)
        const variance = interactionDelay * 0.25;
        return interactionDelay + (Math.random() - 0.5) * variance * 2;
    }
    
    /**
     * Log an interaction event
     */
    private logInteraction(event: Omit<InteractionEvent, 'timestamp' | 'persona'>): void {
        const fullEvent: InteractionEvent = {
            ...event,
            timestamp: Date.now(),
            persona: this.currentPersona?.id || 'unknown'
        };
        
        this.interactionLog.push(fullEvent);
        this.lastInteractionTime = Date.now();
        
        this.emit('interaction', fullEvent);
    }
    
    /**
     * Get interaction log for analysis
     */
    getInteractionLog(): InteractionEvent[] {
        return [...this.interactionLog];
    }
    
    /**
     * Clear interaction log
     */
    clearInteractionLog(): void {
        this.interactionLog = [];
        this.frustrationLevel = 0;
    }
    
    /**
     * Get frustration metrics for UX analysis
     */
    getFrustrationMetrics(): {
        currentLevel: number;
        rageClicks: number;
        missClicks: number;
        frustrationEvents: number;
    } {
        const rageClicks = this.interactionLog.filter(e => e.type === 'rage-click').length;
        const missClicks = this.interactionLog.filter(e => e.type === 'miss-click').length;
        const frustrationEvents = this.interactionLog.filter(e => e.type === 'frustration').length;
        
        return {
            currentLevel: this.frustrationLevel,
            rageClicks,
            missClicks,
            frustrationEvents
        };
    }
    
    /**
     * Generate UX recommendations based on persona and interactions
     */
    generateUXRecommendations(): string[] {
        if (!this.currentPersona || !this.behaviorProfile) {
            return [];
        }
        
        const recommendations: string[] = [];
        const metrics = this.getFrustrationMetrics();
        
        // Check for rage click issues
        if (metrics.rageClicks > 0) {
            recommendations.push(
                `⚠️ Detected ${metrics.rageClicks} rage click events. ` +
                `Consider improving page load times to under ${this.behaviorProfile.rageClickThreshold}ms ` +
                `for ${this.currentPersona.name} persona.`
            );
        }
        
        // Check for miss click issues
        if (metrics.missClicks > 0) {
            recommendations.push(
                `🎯 Detected ${metrics.missClicks} miss-click events. ` +
                `Increase interactive element sizes to at least ${this.behaviorProfile.minTargetSize}px ` +
                `for users with visual impairment level ${this.currentPersona.visualImpairment}.`
            );
        }
        
        // Accessibility recommendations
        if (this.currentPersona.accessibilityNeeds) {
            const needs = this.currentPersona.accessibilityNeeds;
            
            if (needs.screenReader) {
                recommendations.push('♿ Ensure all interactive elements have proper ARIA labels.');
            }
            if (needs.highContrast) {
                recommendations.push('🔲 Verify color contrast ratios meet WCAG AA standards (4.5:1).');
            }
            if (needs.reducedMotion) {
                recommendations.push('🚫 Respect prefers-reduced-motion media query.');
            }
            if (needs.colorBlindness !== 'none') {
                recommendations.push(`🎨 Test UI with ${needs.colorBlindness} simulation filter.`);
            }
        }
        
        // Age-specific recommendations
        if (this.currentPersona.ageGroup === 'senior') {
            recommendations.push(
                '👴 Consider larger font sizes (16px+) and simpler navigation for senior users.'
            );
        }
        
        return recommendations;
    }
    
    /**
     * Get all available persona templates
     */
    static getTemplates(): string[] {
        return Object.keys(PERSONA_TEMPLATES);
    }
    
    /**
     * Create custom persona from partial configuration
     */
    static createCustomPersona(
        name: string,
        config: Partial<Omit<UserPersona, 'id' | 'name'>>
    ): UserPersona {
        return {
            id: `custom-${Date.now()}`,
            name,
            techSavviness: config.techSavviness ?? 50,
            patienceLevel: config.patienceLevel ?? 50,
            visualImpairment: config.visualImpairment ?? 0,
            interactionSpeed: config.interactionSpeed ?? 50,
            ageGroup: config.ageGroup ?? 'adult',
            deviceFamiliarity: config.deviceFamiliarity ?? 'intermediate',
            accessibilityNeeds: config.accessibilityNeeds
        };
    }
}

// Export singleton instance
export const personaEngine = new PersonaEngine();
