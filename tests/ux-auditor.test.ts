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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitiveUXAuditor, UXAnalysisResult } from '../src/ux/cognitive-ux-auditor';

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 COGNITIVE UX AUDITOR TESTS - AI-Powered Interface Analysis
// ═══════════════════════════════════════════════════════════════════════════════

describe('🧠 CognitiveUXAuditor - UX Analysis Engine', () => {
    let auditor: CognitiveUXAuditor;
    
    beforeEach(() => {
        auditor = new CognitiveUXAuditor();
    });
    
    describe('⚙️ Configuration', () => {
        it('should configure with API key', () => {
            auditor.configure({
                apiKey: 'test-api-key',
                model: 'gemini-2.0-flash'
            });
            
            // No error = success
            expect(true).toBe(true);
        });
        
        it('should use default model if not specified', () => {
            const configuredEmitted = vi.fn();
            auditor.on('configured', configuredEmitted);
            
            auditor.configure({
                apiKey: 'test-api-key'
            });
            
            expect(configuredEmitted).toHaveBeenCalledWith(
                expect.objectContaining({ model: 'gemini-2.0-flash' })
            );
        });
        
        it('should throw error when analyzing without configuration', async () => {
            const screenshot = Buffer.from('test');
            
            await expect(auditor.analyzeScreenshot(screenshot))
                .rejects.toThrow('not configured');
        });
    });
    
    describe('📊 Report Generation', () => {
        it('should generate human-readable report', () => {
            const mockResult: UXAnalysisResult = {
                score: 75,
                categoryScores: {
                    visualHierarchy: 80,
                    accessibility: 70,
                    consistency: 75,
                    clarity: 80,
                    spacing: 70,
                    colorContrast: 75,
                    typography: 80,
                    interactiveElements: 70
                },
                issues: [{
                    severity: 'major',
                    category: 'accessibility',
                    description: 'Button has insufficient contrast',
                    impact: 60
                }],
                strengths: ['Clean layout', 'Good typography'],
                recommendations: [{
                    priority: 'high',
                    text: 'Increase button contrast',
                    relatedIssues: [0],
                    effort: 'low',
                    expectedImprovement: 10
                }],
                metadata: {
                    analysisTime: 1500,
                    modelUsed: 'gemini-2.0-flash',
                    imageSize: { width: 1920, height: 1080 },
                    timestamp: Date.now()
                }
            };
            
            const report = auditor.generateReport(mockResult);
            
            expect(report).toContain('COGNITIVE UX AUDIT REPORT');
            expect(report).toContain('75/100');
            expect(report).toContain('ISSUES FOUND');
            expect(report).toContain('accessibility');
            expect(report).toContain('STRENGTHS');
            expect(report).toContain('RECOMMENDATIONS');
        });
        
        it('should include progress bars in report', () => {
            const mockResult: UXAnalysisResult = {
                score: 85,
                categoryScores: {
                    visualHierarchy: 90,
                    accessibility: 80,
                    consistency: 85,
                    clarity: 85,
                    spacing: 80,
                    colorContrast: 85,
                    typography: 90,
                    interactiveElements: 85
                },
                issues: [],
                strengths: [],
                recommendations: [],
                metadata: {
                    analysisTime: 1000,
                    modelUsed: 'gemini-2.0-flash',
                    imageSize: { width: 1920, height: 1080 },
                    timestamp: Date.now()
                }
            };
            
            const report = auditor.generateReport(mockResult);
            
            // Should contain progress bar characters
            expect(report).toContain('█');
            expect(report).toContain('░');
        });
        
        it('should show severity icons in report', () => {
            const mockResult: UXAnalysisResult = {
                score: 50,
                categoryScores: {
                    visualHierarchy: 50,
                    accessibility: 50,
                    consistency: 50,
                    clarity: 50,
                    spacing: 50,
                    colorContrast: 50,
                    typography: 50,
                    interactiveElements: 50
                },
                issues: [
                    { severity: 'critical', category: 'test', description: 'Critical issue', impact: 90 },
                    { severity: 'major', category: 'test', description: 'Major issue', impact: 70 },
                    { severity: 'minor', category: 'test', description: 'Minor issue', impact: 30 },
                    { severity: 'suggestion', category: 'test', description: 'Suggestion', impact: 10 }
                ],
                strengths: [],
                recommendations: [],
                metadata: {
                    analysisTime: 1000,
                    modelUsed: 'gemini-2.0-flash',
                    imageSize: { width: 1920, height: 1080 },
                    timestamp: Date.now()
                }
            };
            
            const report = auditor.generateReport(mockResult);
            
            expect(report).toContain('🔴'); // critical
            expect(report).toContain('🟠'); // major
            expect(report).toContain('🟡'); // minor
            expect(report).toContain('🔵'); // suggestion
        });
    });
    
    describe('📈 History & Statistics', () => {
        it('should return empty history initially', () => {
            const history = auditor.getHistory();
            
            expect(history).toEqual([]);
        });
        
        it('should return zero stats for empty history', () => {
            const stats = auditor.getHistoryStats();
            
            expect(stats.averageScore).toBe(0);
            expect(stats.totalAnalyses).toBe(0);
            expect(stats.mostCommonIssues).toEqual([]);
        });
    });
    
    describe('💾 Caching', () => {
        it('should enable/disable caching', () => {
            auditor.setCaching(false);
            auditor.clearCache();
            auditor.setCaching(true);
            
            // No errors = success
            expect(true).toBe(true);
        });
        
        it('should clear cache', () => {
            auditor.clearCache();
            
            // No errors = success
            expect(true).toBe(true);
        });
    });
    
    describe('🎯 Score Interpretation', () => {
        it('should show excellent for high scores', () => {
            const result: UXAnalysisResult = {
                score: 95,
                categoryScores: {
                    visualHierarchy: 95, accessibility: 95, consistency: 95,
                    clarity: 95, spacing: 95, colorContrast: 95,
                    typography: 95, interactiveElements: 95
                },
                issues: [], strengths: [], recommendations: [],
                metadata: { analysisTime: 100, modelUsed: 'test', imageSize: { width: 0, height: 0 }, timestamp: 0 }
            };
            
            const report = auditor.generateReport(result);
            
            expect(report).toContain('Excellent');
        });
        
        it('should show critical issues for low scores', () => {
            const result: UXAnalysisResult = {
                score: 25,
                categoryScores: {
                    visualHierarchy: 25, accessibility: 25, consistency: 25,
                    clarity: 25, spacing: 25, colorContrast: 25,
                    typography: 25, interactiveElements: 25
                },
                issues: [], strengths: [], recommendations: [],
                metadata: { analysisTime: 100, modelUsed: 'test', imageSize: { width: 0, height: 0 }, timestamp: 0 }
            };
            
            const report = auditor.generateReport(result);
            
            expect(report).toContain('Critical Issues');
        });
    });
});
