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
import { spawn, ChildProcess, exec } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════════════════
// 🗣️ BULGARIAN TTS FEEDBACK - Local Text-to-Speech Engine
// ═══════════════════════════════════════════════════════════════════════════════
// Докладва резултати на български: "Тестът премина успешно" или 
// "Открих грешка в бутона за плащане". Magic for QA Automation!
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TTS Voice options
 */
export interface TTSVoice {
    id: string;
    name: string;
    language: string;
    gender: 'male' | 'female' | 'neutral';
}

/**
 * TTS Configuration
 */
export interface TTSConfig {
    /** TTS engine to use */
    engine: 'sapi' | 'espeak' | 'pyttsx3' | 'edge-tts';
    /** Voice ID or name */
    voice?: string;
    /** Speaking rate (0.5 - 2.0) */
    rate: number;
    /** Volume (0.0 - 1.0) */
    volume: number;
    /** Pitch adjustment */
    pitch: number;
    /** Language code */
    language: string;
    /** Enable audio caching */
    enableCache: boolean;
    /** Cache directory */
    cacheDir: string;
}

/**
 * Speech request
 */
export interface SpeechRequest {
    id: string;
    text: string;
    priority: 'immediate' | 'normal' | 'low';
    timestamp: number;
}

/**
 * Test result feedback templates
 */
export interface FeedbackTemplates {
    testPassed: string;
    testFailed: string;
    errorFound: string;
    warningFound: string;
    suiteCompleted: string;
    criticalError: string;
    [key: string]: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🗣️ BULGARIAN TTS CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class BulgarianTTS extends EventEmitter {
    private config: TTSConfig;
    private speechQueue: SpeechRequest[] = [];
    private isSpeaking: boolean = false;
    private currentProcess: ChildProcess | null = null;
    private templates: FeedbackTemplates;
    private cache: Map<string, string> = new Map();
    private nextRequestId: number = 1;
    
    constructor(config?: Partial<TTSConfig>) {
        super();
        
        this.config = {
            engine: config?.engine || 'sapi',
            voice: config?.voice,
            rate: config?.rate ?? 1.0,
            volume: config?.volume ?? 0.9,
            pitch: config?.pitch ?? 1.0,
            language: config?.language || 'bg-BG',
            enableCache: config?.enableCache ?? true,
            cacheDir: config?.cacheDir || path.join(process.cwd(), '.tts-cache')
        };
        
        // Bulgarian feedback templates
        this.templates = {
            testPassed: 'Тестът премина успешно.',
            testFailed: 'Тестът се провали.',
            errorFound: 'Открих грешка в {element}.',
            warningFound: 'Внимание! {message}',
            suiteCompleted: 'Тестовият пакет завърши. {passed} успешни, {failed} неуспешни.',
            criticalError: 'Критична грешка! {message}',
            elementNotFound: 'Елементът {element} не е намерен.',
            assertionFailed: 'Проверката се провали: {assertion}',
            timeoutOccurred: 'Времето за изчакване изтече след {seconds} секунди.',
            browserCrashed: 'Браузърът се срина. Рестартирам...',
            networkError: 'Мрежова грешка при заявка към {url}.',
            validationPassed: 'Валидацията премина успешно.',
            performanceWarning: 'Предупреждение за производителност: {metric} е {value}.',
            accessibilityIssue: 'Проблем с достъпността: {issue}.',
            securityAlert: 'Сигнал за сигурност! {alert}',
            screenshotTaken: 'Направих снимка на екрана.',
            videoRecorded: 'Записах видео на теста.',
            reportGenerated: 'Генерирах отчет: {filename}.',
            allTestsPassed: 'Всички тестове преминаха успешно! Браво!',
            someTestsFailed: 'Някои тестове се провалиха. Проверете отчета.'
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🚀 INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Initialize TTS engine
     */
    async initialize(): Promise<void> {
        // Create cache directory
        if (this.config.enableCache && !fs.existsSync(this.config.cacheDir)) {
            fs.mkdirSync(this.config.cacheDir, { recursive: true });
        }
        
        // Verify engine availability
        await this.verifyEngine();
        
        this.emit('initialized', { engine: this.config.engine });
    }
    
    /**
     * Verify TTS engine is available
     */
    private async verifyEngine(): Promise<void> {
        switch (this.config.engine) {
            case 'sapi':
                // Windows SAPI is always available on Windows
                if (process.platform !== 'win32') {
                    throw new Error('SAPI is only available on Windows');
                }
                break;
                
            case 'espeak':
                try {
                    await execAsync('espeak --version');
                } catch {
                    throw new Error('espeak not found. Install with: apt-get install espeak');
                }
                break;
                
            case 'pyttsx3':
                try {
                    await execAsync('python -c "import pyttsx3"');
                } catch {
                    throw new Error('pyttsx3 not found. Install with: pip install pyttsx3');
                }
                break;
                
            case 'edge-tts':
                try {
                    await execAsync('edge-tts --version');
                } catch {
                    throw new Error('edge-tts not found. Install with: pip install edge-tts');
                }
                break;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🗣️ SPEECH SYNTHESIS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Speak text
     */
    async speak(text: string, priority: SpeechRequest['priority'] = 'normal'): Promise<void> {
        const request: SpeechRequest = {
            id: `speech_${this.nextRequestId++}`,
            text,
            priority,
            timestamp: Date.now()
        };
        
        // Handle priority
        if (priority === 'immediate') {
            // Stop current speech and speak immediately
            this.stopCurrentSpeech();
            this.speechQueue.unshift(request);
        } else if (priority === 'low') {
            this.speechQueue.push(request);
        } else {
            // Normal priority - insert after immediate but before low
            const insertIndex = this.speechQueue.findIndex(r => r.priority === 'low');
            if (insertIndex === -1) {
                this.speechQueue.push(request);
            } else {
                this.speechQueue.splice(insertIndex, 0, request);
            }
        }
        
        this.emit('speech-queued', { id: request.id, queueLength: this.speechQueue.length });
        
        // Process queue
        this.processQueue();
    }
    
    /**
     * Process speech queue
     */
    private async processQueue(): Promise<void> {
        if (this.isSpeaking || this.speechQueue.length === 0) return;
        
        this.isSpeaking = true;
        const request = this.speechQueue.shift()!;
        
        this.emit('speech-started', { id: request.id, text: request.text });
        
        try {
            await this.synthesize(request.text);
            this.emit('speech-completed', { id: request.id });
        } catch (error) {
            this.emit('speech-error', { id: request.id, error });
        }
        
        this.isSpeaking = false;
        this.processQueue();
    }
    
    /**
     * Synthesize speech using configured engine
     */
    private async synthesize(text: string): Promise<void> {
        switch (this.config.engine) {
            case 'sapi':
                return this.synthesizeWithSAPI(text);
            case 'espeak':
                return this.synthesizeWithEspeak(text);
            case 'pyttsx3':
                return this.synthesizeWithPyttsx3(text);
            case 'edge-tts':
                return this.synthesizeWithEdgeTTS(text);
        }
    }
    
    /**
     * Synthesize with Windows SAPI
     */
    private synthesizeWithSAPI(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const escapedText = text.replace(/"/g, '\\"').replace(/'/g, "''");
            const rate = Math.round((this.config.rate - 1) * 10); // SAPI rate is -10 to 10
            
            const script = `
                Add-Type -AssemblyName System.Speech
                $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
                $synth.Rate = ${rate}
                $synth.Volume = ${Math.round(this.config.volume * 100)}
                $synth.Speak("${escapedText}")
            `;
            
            this.currentProcess = spawn('powershell', ['-Command', script], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            this.currentProcess.on('close', (code) => {
                this.currentProcess = null;
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`SAPI exited with code ${code}`));
                }
            });
            
            this.currentProcess.on('error', (error) => {
                this.currentProcess = null;
                reject(error);
            });
        });
    }
    
    /**
     * Synthesize with espeak
     */
    private synthesizeWithEspeak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const args = [
                '-v', 'bg',
                '-s', String(Math.round(175 * this.config.rate)),
                '-a', String(Math.round(this.config.volume * 200)),
                text
            ];
            
            this.currentProcess = spawn('espeak', args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            this.currentProcess.on('close', (code) => {
                this.currentProcess = null;
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`espeak exited with code ${code}`));
                }
            });
            
            this.currentProcess.on('error', reject);
        });
    }
    
    /**
     * Synthesize with pyttsx3
     */
    private synthesizeWithPyttsx3(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const escapedText = text.replace(/"/g, '\\"');
            const script = `
import pyttsx3
engine = pyttsx3.init()
engine.setProperty('rate', ${Math.round(150 * this.config.rate)})
engine.setProperty('volume', ${this.config.volume})
engine.say("${escapedText}")
engine.runAndWait()
`;
            
            this.currentProcess = spawn('python', ['-c', script], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            this.currentProcess.on('close', (code) => {
                this.currentProcess = null;
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`pyttsx3 exited with code ${code}`));
                }
            });
            
            this.currentProcess.on('error', reject);
        });
    }
    
    /**
     * Synthesize with edge-tts (Microsoft Edge TTS)
     */
    private synthesizeWithEdgeTTS(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const outputFile = path.join(this.config.cacheDir, `tts_${Date.now()}.mp3`);
            const args = [
                '--voice', 'bg-BG-BorislavNeural', // Bulgarian male voice
                '--rate', `${(this.config.rate - 1) * 100}%`,
                '--volume', `${(this.config.volume - 1) * 100}%`,
                '--text', text,
                '--write-media', outputFile
            ];
            
            const edgeProcess = spawn('edge-tts', args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            edgeProcess.on('close', async (code) => {
                if (code === 0) {
                    // Play the audio file
                    await this.playAudioFile(outputFile);
                    // Clean up
                    if (!this.config.enableCache && fs.existsSync(outputFile)) {
                        fs.unlinkSync(outputFile);
                    }
                    resolve();
                } else {
                    reject(new Error(`edge-tts exited with code ${code}`));
                }
            });
            
            edgeProcess.on('error', reject);
        });
    }
    
    /**
     * Play audio file
     */
    private playAudioFile(filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let player: ChildProcess;
            
            if (process.platform === 'win32') {
                // Windows Media Player
                player = spawn('powershell', [
                    '-Command',
                    `(New-Object Media.SoundPlayer "${filePath}").PlaySync()`
                ]);
            } else if (process.platform === 'darwin') {
                // macOS afplay
                player = spawn('afplay', [filePath]);
            } else {
                // Linux - try aplay or mpg123
                player = spawn('mpg123', [filePath]);
            }
            
            player.on('close', () => resolve());
            player.on('error', reject);
        });
    }
    
    /**
     * Stop current speech
     */
    stopCurrentSpeech(): void {
        if (this.currentProcess) {
            this.currentProcess.kill();
            this.currentProcess = null;
            this.isSpeaking = false;
        }
    }
    
    /**
     * Clear speech queue
     */
    clearQueue(): void {
        this.speechQueue = [];
        this.emit('queue-cleared');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📝 FEEDBACK TEMPLATES
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Announce test passed
     */
    async announceTestPassed(testName?: string): Promise<void> {
        const text = testName 
            ? `Тестът "${testName}" премина успешно.`
            : this.templates.testPassed;
        await this.speak(text);
    }
    
    /**
     * Announce test failed
     */
    async announceTestFailed(testName?: string, reason?: string): Promise<void> {
        let text = testName 
            ? `Тестът "${testName}" се провали.`
            : this.templates.testFailed;
        
        if (reason) {
            text += ` Причина: ${reason}`;
        }
        
        await this.speak(text, 'immediate');
    }
    
    /**
     * Announce error found
     */
    async announceError(element: string): Promise<void> {
        const text = this.templates.errorFound.replace('{element}', element);
        await this.speak(text, 'immediate');
    }
    
    /**
     * Announce suite completion
     */
    async announceSuiteCompletion(passed: number, failed: number): Promise<void> {
        const text = this.templates.suiteCompleted
            .replace('{passed}', String(passed))
            .replace('{failed}', String(failed));
        await this.speak(text);
        
        // Add encouraging message
        if (failed === 0) {
            await this.speak(this.templates.allTestsPassed);
        } else {
            await this.speak(this.templates.someTestsFailed);
        }
    }
    
    /**
     * Announce critical error
     */
    async announceCriticalError(message: string): Promise<void> {
        const text = this.templates.criticalError.replace('{message}', message);
        await this.speak(text, 'immediate');
    }
    
    /**
     * Custom announcement using template
     */
    async announceTemplate(
        templateKey: keyof FeedbackTemplates,
        replacements: Record<string, string> = {}
    ): Promise<void> {
        let text = this.templates[templateKey] || templateKey;
        
        for (const [key, value] of Object.entries(replacements)) {
            text = text.replace(`{${key}}`, value);
        }
        
        await this.speak(text);
    }
    
    /**
     * Add custom template
     */
    addTemplate(key: string, template: string): void {
        this.templates[key] = template;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 STATUS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Get configuration
     */
    getConfig(): TTSConfig {
        return { ...this.config };
    }
    
    /**
     * Update configuration
     */
    updateConfig(config: Partial<TTSConfig>): void {
        this.config = { ...this.config, ...config };
        this.emit('config-updated', this.config);
    }
    
    /**
     * Get queue length
     */
    getQueueLength(): number {
        return this.speechQueue.length;
    }
    
    /**
     * Check if speaking
     */
    isSpeakingNow(): boolean {
        return this.isSpeaking;
    }
    
    /**
     * Get available templates
     */
    getTemplates(): FeedbackTemplates {
        return { ...this.templates };
    }
    
    /**
     * List available voices (Windows SAPI)
     */
    async listVoices(): Promise<TTSVoice[]> {
        if (this.config.engine !== 'sapi') {
            return [];
        }
        
        try {
            const { stdout } = await execAsync(`
                powershell -Command "
                    Add-Type -AssemblyName System.Speech
                    $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
                    $synth.GetInstalledVoices() | ForEach-Object {
                        Write-Output ($_.VoiceInfo.Name + '|' + $_.VoiceInfo.Culture.Name + '|' + $_.VoiceInfo.Gender)
                    }
                "
            `);
            
            return stdout.trim().split('\n').map((line, i) => {
                const [name, language, gender] = line.split('|');
                return {
                    id: String(i),
                    name: name?.trim() || 'Unknown',
                    language: language?.trim() || 'en-US',
                    gender: (gender?.trim().toLowerCase() || 'neutral') as TTSVoice['gender']
                };
            });
        } catch {
            return [];
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default BulgarianTTS;
