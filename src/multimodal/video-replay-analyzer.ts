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
// 📹 THE VIDEO REPLAY ANALYZER - Session Recording to Sovereign Goals
// ═══════════════════════════════════════════════════════════════════════════════
// Transforms MP4 session recordings into actionable test scenarios using
// Vision AI for visual element detection and action extraction.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Sovereign Goal - High-level test objective extracted from video
 */
export interface SovereignGoal {
    /** Unique goal identifier */
    id: string;
    /** Human-readable goal description */
    description: string;
    /** Goal type */
    type: GoalType;
    /** Priority level */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** Extracted action sequence */
    actions: ExtractedAction[];
    /** UI elements involved */
    elements: UIElement[];
    /** Confidence in goal extraction */
    confidence: number;
    /** Time range in video */
    timeRange: { start: number; end: number };
    /** Generated test code */
    generatedCode?: string;
    /** Metadata */
    metadata: GoalMetadata;
}

/**
 * Goal type classification
 */
export type GoalType =
    | 'authentication'    // Login/logout flows
    | 'form_submission'   // Form filling and submission
    | 'navigation'        // Page navigation
    | 'search'            // Search functionality
    | 'crud_operation'    // Create/Read/Update/Delete
    | 'checkout'          // E-commerce checkout
    | 'file_upload'       // File handling
    | 'data_validation'   // Form validation
    | 'user_settings'     // Settings/preferences
    | 'custom';

/**
 * Extracted action from video frame
 */
export interface ExtractedAction {
    /** Action type */
    type: ActionType;
    /** Target element */
    target: UIElement;
    /** Action value (for typing, selecting) */
    value?: string;
    /** Timestamp in video (ms) */
    timestamp: number;
    /** Duration of action (ms) */
    duration: number;
    /** Confidence score */
    confidence: number;
    /** Screenshot frame reference */
    frameIndex: number;
}

/**
 * Action types detectable in video
 */
export type ActionType =
    | 'click'
    | 'double_click'
    | 'right_click'
    | 'type'
    | 'scroll'
    | 'drag'
    | 'drop'
    | 'hover'
    | 'focus'
    | 'blur'
    | 'select'
    | 'upload'
    | 'wait'
    | 'navigation';

/**
 * UI Element detected in frame
 */
export interface UIElement {
    /** Element type */
    type: ElementType;
    /** Bounding box coordinates */
    boundingBox: BoundingBox;
    /** Generated selector */
    selector: string;
    /** Visible text content */
    text?: string;
    /** Element attributes */
    attributes: Record<string, string>;
    /** Visual features */
    visualFeatures: VisualFeatures;
    /** Confidence in detection */
    confidence: number;
}

/**
 * Element types
 */
export type ElementType =
    | 'button'
    | 'link'
    | 'input'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'image'
    | 'icon'
    | 'menu'
    | 'modal'
    | 'card'
    | 'list_item'
    | 'table_cell'
    | 'tab'
    | 'unknown';

/**
 * Bounding box for element location
 */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Visual features of element
 */
export interface VisualFeatures {
    /** Primary color */
    primaryColor: string;
    /** Background color */
    backgroundColor: string;
    /** Has border */
    hasBorder: boolean;
    /** Has shadow */
    hasShadow: boolean;
    /** Is highlighted/focused */
    isHighlighted: boolean;
    /** Estimated z-index */
    zIndex: number;
}

/**
 * Goal metadata
 */
export interface GoalMetadata {
    /** Video file info */
    video: {
        filename: string;
        duration: number;
        resolution: { width: number; height: number };
        fps: number;
        size: number;
    };
    /** Analysis timing */
    analysis: {
        startTime: number;
        endTime: number;
        framesAnalyzed: number;
        modelUsed: string;
    };
    /** Session info */
    session: {
        url?: string;
        browser?: string;
        viewport?: { width: number; height: number };
    };
}

/**
 * Video Analyzer configuration
 */
export interface VideoAnalyzerConfig {
    /** Vision API key (Gemini) */
    apiKey: string;
    /** Vision model to use */
    model: 'gemini-2.0-flash' | 'gemini-1.5-pro-vision';
    /** Frames per second to analyze */
    analysisFrameRate: number;
    /** Minimum action confidence threshold */
    confidenceThreshold: number;
    /** Enable OCR for text extraction */
    enableOCR: boolean;
    /** Enable element detection */
    enableElementDetection: boolean;
    /** Custom prompts for goal extraction */
    customPrompts?: Record<string, string>;
}

/**
 * Frame analysis result
 */
interface FrameAnalysis {
    frameIndex: number;
    timestamp: number;
    elements: UIElement[];
    cursorPosition?: { x: number; y: number };
    detectedAction?: {
        type: ActionType;
        target?: UIElement;
        confidence: number;
    };
    textContent: string[];
    changes: FrameChange[];
}

/**
 * Changes between frames
 */
interface FrameChange {
    type: 'element_added' | 'element_removed' | 'element_changed' | 'cursor_moved' | 'scroll' | 'navigation';
    details: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📹 VIDEO REPLAY ANALYZER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class VideoReplayAnalyzer extends EventEmitter {
    private config: VideoAnalyzerConfig | null = null;
    private analysisHistory: SovereignGoal[] = [];
    private frameCache: Map<number, FrameAnalysis> = new Map();
    
    constructor() {
        super();
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ⚙️ CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Configure the Video Analyzer
     */
    configure(config: Partial<VideoAnalyzerConfig>): void {
        this.config = {
            apiKey: config.apiKey || '',
            model: config.model || 'gemini-2.0-flash',
            analysisFrameRate: config.analysisFrameRate || 2, // 2 FPS for analysis
            confidenceThreshold: config.confidenceThreshold || 0.7,
            enableOCR: config.enableOCR ?? true,
            enableElementDetection: config.enableElementDetection ?? true,
            customPrompts: config.customPrompts
        };
        
        this.emit('configured', this.config);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📹 VIDEO ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Analyze MP4 video file and extract Sovereign Goals
     */
    async analyzeVideo(videoBuffer: ArrayBuffer, filename: string = 'session.mp4'): Promise<SovereignGoal[]> {
        if (!this.config) {
            throw new Error('VideoReplayAnalyzer not configured');
        }
        
        const startTime = Date.now();
        this.emit('analysis:start', { filename });
        
        // Extract video metadata
        const videoMetadata = await this.extractVideoMetadata(videoBuffer);
        
        // Extract frames at analysis rate
        const frames = await this.extractFrames(videoBuffer, this.config.analysisFrameRate);
        
        this.emit('frames:extracted', { count: frames.length });
        
        // Analyze each frame
        const frameAnalyses: FrameAnalysis[] = [];
        for (let i = 0; i < frames.length; i++) {
            const analysis = await this.analyzeFrame(frames[i], i, videoMetadata.fps);
            frameAnalyses.push(analysis);
            
            // Detect changes from previous frame
            if (i > 0) {
                analysis.changes = this.detectFrameChanges(frameAnalyses[i - 1], analysis);
            }
            
            this.emit('frame:analyzed', { index: i, total: frames.length });
        }
        
        // Extract action sequences
        const actionSequences = this.extractActionSequences(frameAnalyses);
        
        // Group actions into Sovereign Goals
        const goals = await this.extractSovereignGoals(actionSequences, frameAnalyses, {
            filename,
            ...videoMetadata
        });
        
        // Generate test code for each goal
        for (const goal of goals) {
            goal.generatedCode = this.generateTestCode(goal);
            goal.metadata.analysis = {
                startTime,
                endTime: Date.now(),
                framesAnalyzed: frames.length,
                modelUsed: this.config.model
            };
        }
        
        // Store in history
        this.analysisHistory.push(...goals);
        
        this.emit('analysis:complete', { goals: goals.length, duration: Date.now() - startTime });
        
        return goals;
    }
    
    /**
     * Extract video metadata
     */
    private async extractVideoMetadata(videoBuffer: ArrayBuffer): Promise<{
        duration: number;
        resolution: { width: number; height: number };
        fps: number;
        size: number;
    }> {
        // In real implementation, this would use ffprobe or similar
        // For now, return estimated values
        return {
            duration: videoBuffer.byteLength / 100000, // Rough estimate
            resolution: { width: 1920, height: 1080 },
            fps: 30,
            size: videoBuffer.byteLength
        };
    }
    
    /**
     * Extract frames from video at specified rate
     */
    private async extractFrames(videoBuffer: ArrayBuffer, frameRate: number): Promise<Uint8Array[]> {
        // In real implementation, this would use ffmpeg or canvas API
        // For now, simulate frame extraction
        const estimatedDuration = videoBuffer.byteLength / 100000;
        const frameCount = Math.ceil(estimatedDuration * frameRate);
        
        const frames: Uint8Array[] = [];
        
        // Simulate frame data (would be actual JPEG/PNG data in real implementation)
        for (let i = 0; i < Math.min(frameCount, 100); i++) {
            frames.push(new Uint8Array(1000)); // Placeholder
        }
        
        return frames;
    }
    
    /**
     * Analyze single frame using Vision AI
     */
    private async analyzeFrame(
        frameData: Uint8Array,
        frameIndex: number,
        fps: number
    ): Promise<FrameAnalysis> {
        if (!this.config) {
            throw new Error('Not configured');
        }
        
        const timestamp = (frameIndex / this.config.analysisFrameRate) * 1000;
        
        // Check cache
        const cached = this.frameCache.get(frameIndex);
        if (cached) {
            return cached;
        }
        
        // Build Vision API prompt
        const prompt = this.buildFrameAnalysisPrompt();
        
        // Call Gemini Vision API
        const response = await this.callVisionAPI(frameData, prompt);
        
        // Parse response into structured data
        const analysis = this.parseVisionResponse(response, frameIndex, timestamp);
        
        // Cache result
        this.frameCache.set(frameIndex, analysis);
        
        return analysis;
    }
    
    /**
     * Build prompt for frame analysis
     */
    private buildFrameAnalysisPrompt(): string {
        return `Analyze this screenshot of a web application session recording.

Extract the following information in JSON format:

1. UI Elements:
   - Type (button, input, link, etc.)
   - Bounding box coordinates (x, y, width, height)
   - Visible text content
   - Visual state (normal, hover, focused, disabled)

2. Cursor Position:
   - X and Y coordinates if visible
   - Cursor state (normal, pointer, text)

3. Detected User Action:
   - Action type (click, type, scroll, etc.)
   - Target element
   - Confidence score

4. Text Content:
   - All visible text on screen
   - Form field values

5. Page Context:
   - URL if visible in address bar
   - Page title
   - Current viewport area

Return structured JSON with these fields:
{
  "elements": [...],
  "cursorPosition": { "x": number, "y": number },
  "detectedAction": { "type": string, "confidence": number },
  "textContent": [...],
  "pageContext": { "url": string, "title": string }
}`;
    }
    
    /**
     * Call Gemini Vision API
     */
    private async callVisionAPI(imageData: Uint8Array, prompt: string): Promise<unknown> {
        if (!this.config) {
            throw new Error('Not configured');
        }
        
        const base64Image = this.uint8ArrayToBase64(imageData);
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: 'image/png',
                                    data: base64Image
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 4096
                    }
                })
            }
        );
        
        if (!response.ok) {
            throw new Error(`Vision API error: ${response.status}`);
        }
        
        return response.json();
    }
    
    /**
     * Parse Vision API response
     */
    private parseVisionResponse(
        response: unknown,
        frameIndex: number,
        timestamp: number
    ): FrameAnalysis {
        // Extract text from response
        const responseObj = response as {
            candidates?: Array<{
                content?: {
                    parts?: Array<{ text?: string }>;
                };
            }>;
        };
        
        const text = responseObj.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        
        // Parse JSON from response
        let parsed: Record<string, unknown> = {};
        try {
            // Find JSON in response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        } catch {
            // If parsing fails, return default analysis
        }
        
        // Convert to FrameAnalysis
        const elements = this.parseElements(parsed.elements as unknown[] || []);
        
        return {
            frameIndex,
            timestamp,
            elements,
            cursorPosition: parsed.cursorPosition as { x: number; y: number } | undefined,
            detectedAction: parsed.detectedAction as {
                type: ActionType;
                target?: UIElement;
                confidence: number;
            } | undefined,
            textContent: (parsed.textContent as string[]) || [],
            changes: []
        };
    }
    
    /**
     * Parse elements from Vision response
     */
    private parseElements(rawElements: unknown[]): UIElement[] {
        return rawElements.map((raw: unknown) => {
            const elem = raw as Record<string, unknown>;
            return {
                type: (elem.type as ElementType) || 'unknown',
                boundingBox: (elem.boundingBox as BoundingBox) || { x: 0, y: 0, width: 0, height: 0 },
                selector: this.generateSelector(elem),
                text: elem.text as string | undefined,
                attributes: (elem.attributes as Record<string, string>) || {},
                visualFeatures: {
                    primaryColor: '#000000',
                    backgroundColor: '#ffffff',
                    hasBorder: false,
                    hasShadow: false,
                    isHighlighted: false,
                    zIndex: 0
                },
                confidence: (elem.confidence as number) || 0.5
            };
        });
    }
    
    /**
     * Generate CSS selector for element
     */
    private generateSelector(element: Record<string, unknown>): string {
        const type = element.type as string;
        const text = element.text as string;
        const attributes = element.attributes as Record<string, string> || {};
        
        // Priority: data-testid > id > aria-label > text content
        if (attributes['data-testid']) {
            return `[data-testid="${attributes['data-testid']}"]`;
        }
        if (attributes.id) {
            return `#${attributes.id}`;
        }
        if (attributes['aria-label']) {
            return `[aria-label="${attributes['aria-label']}"]`;
        }
        if (text && type === 'button') {
            return `button:has-text("${text}")`;
        }
        if (text && type === 'link') {
            return `a:has-text("${text}")`;
        }
        
        // Fallback to type + position
        return `${type}`;
    }
    
    /**
     * Detect changes between frames
     */
    private detectFrameChanges(prev: FrameAnalysis, current: FrameAnalysis): FrameChange[] {
        const changes: FrameChange[] = [];
        
        // Check cursor movement
        if (prev.cursorPosition && current.cursorPosition) {
            const dx = Math.abs(current.cursorPosition.x - prev.cursorPosition.x);
            const dy = Math.abs(current.cursorPosition.y - prev.cursorPosition.y);
            if (dx > 10 || dy > 10) {
                changes.push({
                    type: 'cursor_moved',
                    details: {
                        from: prev.cursorPosition,
                        to: current.cursorPosition,
                        distance: Math.sqrt(dx * dx + dy * dy)
                    }
                });
            }
        }
        
        // Check element changes
        const prevElementIds = new Set(prev.elements.map(e => e.selector));
        const currentElementIds = new Set(current.elements.map(e => e.selector));
        
        for (const elem of current.elements) {
            if (!prevElementIds.has(elem.selector)) {
                changes.push({
                    type: 'element_added',
                    details: { element: elem.selector }
                });
            }
        }
        
        for (const elem of prev.elements) {
            if (!currentElementIds.has(elem.selector)) {
                changes.push({
                    type: 'element_removed',
                    details: { element: elem.selector }
                });
            }
        }
        
        return changes;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🎯 ACTION & GOAL EXTRACTION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Extract action sequences from frame analyses
     */
    private extractActionSequences(frameAnalyses: FrameAnalysis[]): ExtractedAction[] {
        const actions: ExtractedAction[] = [];
        
        for (let i = 0; i < frameAnalyses.length; i++) {
            const frame = frameAnalyses[i];
            
            if (frame.detectedAction && frame.detectedAction.confidence >= (this.config?.confidenceThreshold || 0.7)) {
                // Find target element
                let target: UIElement | undefined;
                if (frame.cursorPosition) {
                    target = this.findElementAtPosition(
                        frame.elements,
                        frame.cursorPosition.x,
                        frame.cursorPosition.y
                    );
                }
                
                if (!target && frame.elements.length > 0) {
                    // Use most likely target
                    target = frame.elements.reduce((best, elem) =>
                        elem.confidence > best.confidence ? elem : best
                    );
                }
                
                if (target) {
                    actions.push({
                        type: frame.detectedAction.type,
                        target,
                        timestamp: frame.timestamp,
                        duration: this.estimateActionDuration(frame.detectedAction.type),
                        confidence: frame.detectedAction.confidence,
                        frameIndex: frame.frameIndex
                    });
                }
            }
            
            // Detect implicit actions from changes
            for (const change of frame.changes) {
                if (change.type === 'cursor_moved') {
                    const details = change.details as { distance: number };
                    if (details.distance > 100) {
                        // Significant cursor movement might indicate scroll or drag
                    }
                }
            }
        }
        
        // Merge consecutive similar actions
        return this.mergeConsecutiveActions(actions);
    }
    
    /**
     * Find element at cursor position
     */
    private findElementAtPosition(elements: UIElement[], x: number, y: number): UIElement | undefined {
        return elements.find(elem => {
            const box = elem.boundingBox;
            return x >= box.x && x <= box.x + box.width &&
                   y >= box.y && y <= box.y + box.height;
        });
    }
    
    /**
     * Estimate action duration
     */
    private estimateActionDuration(actionType: ActionType): number {
        const durations: Record<ActionType, number> = {
            click: 100,
            double_click: 200,
            right_click: 100,
            type: 500, // Per character roughly
            scroll: 300,
            drag: 500,
            drop: 100,
            hover: 200,
            focus: 50,
            blur: 50,
            select: 100,
            upload: 1000,
            wait: 1000,
            navigation: 2000
        };
        return durations[actionType] || 100;
    }
    
    /**
     * Merge consecutive similar actions
     */
    private mergeConsecutiveActions(actions: ExtractedAction[]): ExtractedAction[] {
        if (actions.length < 2) return actions;
        
        const merged: ExtractedAction[] = [];
        let current = actions[0];
        
        for (let i = 1; i < actions.length; i++) {
            const next = actions[i];
            
            // Merge consecutive typing actions on same target
            if (current.type === 'type' && next.type === 'type' &&
                current.target.selector === next.target.selector) {
                current = {
                    ...current,
                    value: (current.value || '') + (next.value || ''),
                    duration: current.duration + next.duration,
                    confidence: Math.min(current.confidence, next.confidence)
                };
            } else {
                merged.push(current);
                current = next;
            }
        }
        merged.push(current);
        
        return merged;
    }
    
    /**
     * Extract Sovereign Goals from action sequences
     */
    private async extractSovereignGoals(
        actions: ExtractedAction[],
        frameAnalyses: FrameAnalysis[],
        videoInfo: { filename: string; duration: number; resolution: { width: number; height: number }; fps: number; size: number }
    ): Promise<SovereignGoal[]> {
        const goals: SovereignGoal[] = [];
        
        // Group actions into logical sequences
        const sequences = this.groupActionsIntoSequences(actions);
        
        for (const sequence of sequences) {
            const goal = await this.createSovereignGoal(sequence, frameAnalyses, videoInfo);
            if (goal) {
                goals.push(goal);
            }
        }
        
        return goals;
    }
    
    /**
     * Group actions into logical sequences
     */
    private groupActionsIntoSequences(actions: ExtractedAction[]): ExtractedAction[][] {
        const sequences: ExtractedAction[][] = [];
        let currentSequence: ExtractedAction[] = [];
        
        for (const action of actions) {
            // Start new sequence on navigation
            if (action.type === 'navigation' && currentSequence.length > 0) {
                sequences.push(currentSequence);
                currentSequence = [action];
            } else {
                currentSequence.push(action);
            }
            
            // Also split on long time gaps
            if (currentSequence.length > 1) {
                const prevAction = currentSequence[currentSequence.length - 2];
                if (action.timestamp - prevAction.timestamp > 5000) {
                    // 5+ second gap = new sequence
                    sequences.push(currentSequence.slice(0, -1));
                    currentSequence = [action];
                }
            }
        }
        
        if (currentSequence.length > 0) {
            sequences.push(currentSequence);
        }
        
        return sequences;
    }
    
    /**
     * Create Sovereign Goal from action sequence
     */
    private async createSovereignGoal(
        actions: ExtractedAction[],
        frameAnalyses: FrameAnalysis[],
        videoInfo: { filename: string; duration: number; resolution: { width: number; height: number }; fps: number; size: number }
    ): Promise<SovereignGoal | null> {
        if (actions.length === 0) return null;
        
        // Classify goal type based on actions and elements
        const goalType = this.classifyGoalType(actions);
        
        // Generate description
        const description = this.generateGoalDescription(actions, goalType);
        
        // Determine priority
        const priority = this.determineGoalPriority(goalType, actions);
        
        // Collect unique elements
        const elements = this.collectUniqueElements(actions);
        
        // Calculate confidence
        const confidence = this.calculateGoalConfidence(actions);
        
        return {
            id: this.generateGoalId(),
            description,
            type: goalType,
            priority,
            actions,
            elements,
            confidence,
            timeRange: {
                start: actions[0].timestamp,
                end: actions[actions.length - 1].timestamp + actions[actions.length - 1].duration
            },
            metadata: {
                video: videoInfo,
                analysis: {
                    startTime: 0,
                    endTime: 0,
                    framesAnalyzed: frameAnalyses.length,
                    modelUsed: this.config?.model || 'unknown'
                },
                session: {}
            }
        };
    }
    
    /**
     * Classify goal type based on actions
     */
    private classifyGoalType(actions: ExtractedAction[]): GoalType {
        const actionTypes = actions.map(a => a.type);
        const elementTypes = actions.map(a => a.target.type);
        const elementTexts = actions.map(a => a.target.text?.toLowerCase() || '');
        
        // Check for authentication
        if (elementTexts.some(t => t.includes('login') || t.includes('sign in') || t.includes('password'))) {
            return 'authentication';
        }
        
        // Check for form submission
        if (actionTypes.filter(t => t === 'type').length >= 2 &&
            elementTypes.includes('button')) {
            return 'form_submission';
        }
        
        // Check for search
        if (elementTexts.some(t => t.includes('search'))) {
            return 'search';
        }
        
        // Check for navigation
        if (actionTypes.filter(t => t === 'navigation').length > 0 ||
            actionTypes.filter(t => t === 'click').length === actions.length) {
            return 'navigation';
        }
        
        // Check for checkout
        if (elementTexts.some(t => t.includes('cart') || t.includes('checkout') || t.includes('pay'))) {
            return 'checkout';
        }
        
        // Check for file upload
        if (actionTypes.includes('upload')) {
            return 'file_upload';
        }
        
        return 'custom';
    }
    
    /**
     * Generate human-readable goal description
     */
    private generateGoalDescription(actions: ExtractedAction[], goalType: GoalType): string {
        const descriptions: Record<GoalType, (actions: ExtractedAction[]) => string> = {
            authentication: (acts) => {
                const hasPassword = acts.some(a => a.target.text?.toLowerCase().includes('password'));
                return hasPassword ? 'User login flow with credentials' : 'User logout flow';
            },
            form_submission: (acts) => {
                const fieldCount = acts.filter(a => a.type === 'type').length;
                return `Form submission with ${fieldCount} field(s)`;
            },
            navigation: (acts) => {
                const clickCount = acts.filter(a => a.type === 'click').length;
                return `Page navigation with ${clickCount} click(s)`;
            },
            search: () => 'Search functionality test',
            crud_operation: (acts) => {
                const hasDelete = acts.some(a => a.target.text?.toLowerCase().includes('delete'));
                return hasDelete ? 'Delete operation' : 'Create/Update operation';
            },
            checkout: () => 'E-commerce checkout flow',
            file_upload: () => 'File upload functionality',
            data_validation: () => 'Form validation test',
            user_settings: () => 'User settings modification',
            custom: (acts) => `Custom flow with ${acts.length} action(s)`
        };
        
        return descriptions[goalType](actions);
    }
    
    /**
     * Determine goal priority
     */
    private determineGoalPriority(goalType: GoalType, actions: ExtractedAction[]): 'critical' | 'high' | 'medium' | 'low' {
        const priorities: Record<GoalType, 'critical' | 'high' | 'medium' | 'low'> = {
            authentication: 'critical',
            checkout: 'critical',
            form_submission: 'high',
            crud_operation: 'high',
            search: 'medium',
            navigation: 'medium',
            file_upload: 'medium',
            data_validation: 'medium',
            user_settings: 'low',
            custom: 'low'
        };
        
        return priorities[goalType];
    }
    
    /**
     * Collect unique elements from actions
     */
    private collectUniqueElements(actions: ExtractedAction[]): UIElement[] {
        const seen = new Set<string>();
        const elements: UIElement[] = [];
        
        for (const action of actions) {
            if (!seen.has(action.target.selector)) {
                seen.add(action.target.selector);
                elements.push(action.target);
            }
        }
        
        return elements;
    }
    
    /**
     * Calculate goal confidence
     */
    private calculateGoalConfidence(actions: ExtractedAction[]): number {
        if (actions.length === 0) return 0;
        
        const avgConfidence = actions.reduce((sum, a) => sum + a.confidence, 0) / actions.length;
        const completenessBonus = Math.min(actions.length / 5, 1) * 0.1;
        
        return Math.min(avgConfidence + completenessBonus, 1);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 💻 TEST CODE GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Generate test code from Sovereign Goal
     */
    generateTestCode(goal: SovereignGoal): string {
        const lines: string[] = [];
        
        lines.push(`// ═══════════════════════════════════════════════════════════════`);
        lines.push(`// 🎯 SOVEREIGN GOAL: ${goal.description}`);
        lines.push(`// Generated by QAntum Video Replay Analyzer`);
        lines.push(`// Type: ${goal.type} | Priority: ${goal.priority}`);
        lines.push(`// Confidence: ${(goal.confidence * 100).toFixed(1)}%`);
        lines.push(`// ═══════════════════════════════════════════════════════════════`);
        lines.push('');
        lines.push(`import { test, expect } from '@playwright/test';`);
        lines.push('');
        lines.push(`test('${goal.description}', async ({ page }) => {`);
        
        for (const action of goal.actions) {
            const actionCode = this.generateActionCode(action);
            lines.push(`    ${actionCode}`);
        }
        
        lines.push('});');
        
        return lines.join('\n');
    }
    
    /**
     * Generate code for single action
     */
    private generateActionCode(action: ExtractedAction): string {
        const selector = action.target.selector;
        
        switch (action.type) {
            case 'click':
                return `await page.click('${selector}');`;
            case 'double_click':
                return `await page.dblclick('${selector}');`;
            case 'right_click':
                return `await page.click('${selector}', { button: 'right' });`;
            case 'type':
                return `await page.fill('${selector}', '${action.value || ''}');`;
            case 'hover':
                return `await page.hover('${selector}');`;
            case 'scroll':
                return `await page.evaluate(() => window.scrollBy(0, 300));`;
            case 'select':
                return `await page.selectOption('${selector}', '${action.value || ''}');`;
            case 'wait':
                return `await page.waitForTimeout(${action.duration});`;
            case 'navigation':
                return `await page.goto('${action.value || '/'}');`;
            default:
                return `// TODO: Implement ${action.type} action`;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🛠️ UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    
    private uint8ArrayToBase64(bytes: Uint8Array): string {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    private generateGoalId(): string {
        return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 HISTORY & STATISTICS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Get analysis history
     */
    getHistory(): SovereignGoal[] {
        return [...this.analysisHistory];
    }
    
    /**
     * Get statistics
     */
    getStats(): {
        totalGoals: number;
        byType: Record<GoalType, number>;
        averageConfidence: number;
        averageActionsPerGoal: number;
    } {
        const byType: Record<string, number> = {};
        let totalConfidence = 0;
        let totalActions = 0;
        
        for (const goal of this.analysisHistory) {
            byType[goal.type] = (byType[goal.type] || 0) + 1;
            totalConfidence += goal.confidence;
            totalActions += goal.actions.length;
        }
        
        return {
            totalGoals: this.analysisHistory.length,
            byType: byType as Record<GoalType, number>,
            averageConfidence: this.analysisHistory.length > 0
                ? totalConfidence / this.analysisHistory.length
                : 0,
            averageActionsPerGoal: this.analysisHistory.length > 0
                ? totalActions / this.analysisHistory.length
                : 0
        };
    }
    
    /**
     * Clear history and cache
     */
    clear(): void {
        this.analysisHistory = [];
        this.frameCache.clear();
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default VideoReplayAnalyzer;
