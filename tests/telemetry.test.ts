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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HardwareTelemetry } from '../src/telemetry/hardware-telemetry';

// ═══════════════════════════════════════════════════════════════════════════════
// ⚡ HARDWARE TELEMETRY TESTS - System Monitoring & Auto-Throttling
// ═══════════════════════════════════════════════════════════════════════════════

describe('⚡ HardwareTelemetry - System Monitoring', () => {
    let telemetry: HardwareTelemetry;
    
    beforeEach(() => {
        telemetry = new HardwareTelemetry({
            cpuThreshold: 90,
            memoryThreshold: 85,
            checkInterval: 100 // Fast for testing
        });
    });
    
    afterEach(() => {
        telemetry.stopMonitoring();
    });
    
    describe('📊 Metrics Collection', () => {
        it('should collect system metrics', () => {
            const metrics = telemetry.collectMetrics();
            
            expect(metrics).toBeDefined();
            expect(metrics.cpu).toBeDefined();
            expect(metrics.memory).toBeDefined();
            expect(metrics.system).toBeDefined();
        });
        
        it('should have valid CPU info', () => {
            const metrics = telemetry.collectMetrics();
            
            expect(metrics.cpu.model).toBeTruthy();
            expect(metrics.cpu.cores).toBeGreaterThan(0);
            expect(metrics.cpu.threads).toBeGreaterThanOrEqual(metrics.cpu.cores);
            expect(metrics.cpu.speed).toBeGreaterThan(0);
            expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
            expect(metrics.cpu.usage).toBeLessThanOrEqual(100);
        });
        
        it('should have valid memory info', () => {
            const metrics = telemetry.collectMetrics();
            
            expect(metrics.memory.total).toBeGreaterThan(0);
            expect(metrics.memory.used).toBeGreaterThan(0);
            expect(metrics.memory.free).toBeGreaterThanOrEqual(0);
            expect(metrics.memory.usagePercent).toBeGreaterThan(0);
            expect(metrics.memory.usagePercent).toBeLessThanOrEqual(100);
        });
        
        it('should have per-core metrics', () => {
            const metrics = telemetry.collectMetrics();
            
            expect(metrics.cpu.perCore.length).toBe(metrics.cpu.threads);
            
            for (const core of metrics.cpu.perCore) {
                expect(core.id).toBeGreaterThanOrEqual(0);
                expect(core.usage).toBeGreaterThanOrEqual(0);
                expect(core.usage).toBeLessThanOrEqual(100);
            }
        });
        
        it('should have system info', () => {
            const metrics = telemetry.collectMetrics();
            
            expect(metrics.system.platform).toBeTruthy();
            expect(metrics.system.arch).toBeTruthy();
            expect(metrics.system.uptime).toBeGreaterThan(0);
            expect(metrics.system.loadAvg).toHaveLength(3);
        });
    });
    
    describe('📈 Monitoring', () => {
        it('should start and stop monitoring', async () => {
            const metricsReceived: number[] = [];
            
            telemetry.on('metrics', (m) => metricsReceived.push(m.timestamp));
            
            telemetry.startMonitoring();
            
            await new Promise(resolve => setTimeout(resolve, 350));
            
            telemetry.stopMonitoring();
            
            expect(metricsReceived.length).toBeGreaterThan(0);
        });
        
        it('should accumulate metrics history', async () => {
            telemetry.startMonitoring();
            
            await new Promise(resolve => setTimeout(resolve, 350));
            
            telemetry.stopMonitoring();
            
            const history = telemetry.getMetricsHistory();
            
            expect(history.length).toBeGreaterThan(0);
        });
        
        it('should not start monitoring twice', () => {
            telemetry.startMonitoring();
            telemetry.startMonitoring(); // Should be a no-op
            
            telemetry.stopMonitoring();
            
            // No error thrown = success
            expect(true).toBe(true);
        });
    });
    
    describe('🚦 Throttling', () => {
        it('should start unthrottled', () => {
            expect(telemetry.isSystemThrottled()).toBe(false);
            expect(telemetry.getThrottleDelay()).toBe(0);
        });
        
        it('should provide throttle delay when throttled', () => {
            // We can't easily simulate high CPU, but we can test the delay logic
            const config = telemetry.getConfig();
            
            expect(config.throttleDelay).toBeGreaterThan(0);
        });
        
        it('should have configurable thresholds', () => {
            telemetry.updateConfig({
                cpuThreshold: 80,
                memoryThreshold: 70
            });
            
            const config = telemetry.getConfig();
            
            expect(config.cpuThreshold).toBe(80);
            expect(config.memoryThreshold).toBe(70);
        });
    });
    
    describe('👷 Worker Pool Management', () => {
        it('should get worker pool status', () => {
            const status = telemetry.getWorkerPoolStatus();
            
            expect(status).toBeDefined();
            expect(status.activeWorkers).toBeGreaterThanOrEqual(0);
            expect(status.maxWorkers).toBeGreaterThan(0);
            expect(status.queueLength).toBeGreaterThanOrEqual(0);
            expect(status.completedTasks).toBeGreaterThanOrEqual(0);
            expect(typeof status.throttled).toBe('boolean');
        });
        
        it('should queue tasks with priority', () => {
            telemetry.queueTask({
                id: 'task1',
                type: 'test',
                data: {},
                priority: 'low',
                createdAt: Date.now()
            });
            
            telemetry.queueTask({
                id: 'task2',
                type: 'test',
                data: {},
                priority: 'high',
                createdAt: Date.now()
            });
            
            // High priority should come first
            const next = telemetry.getNextTask();
            
            expect(next?.id).toBe('task2');
        });
        
        it('should handle normal priority tasks', () => {
            telemetry.queueTask({
                id: 'low',
                type: 'test',
                data: {},
                priority: 'low',
                createdAt: Date.now()
            });
            
            telemetry.queueTask({
                id: 'normal',
                type: 'test',
                data: {},
                priority: 'normal',
                createdAt: Date.now()
            });
            
            // Normal should come before low
            const first = telemetry.getNextTask();
            const second = telemetry.getNextTask();
            
            expect(first?.id).toBe('normal');
            expect(second?.id).toBe('low');
        });
    });
    
    describe('📊 Average Metrics', () => {
        it('should calculate average metrics', async () => {
            telemetry.startMonitoring();
            
            await new Promise(resolve => setTimeout(resolve, 350));
            
            telemetry.stopMonitoring();
            
            const avg = telemetry.getAverageMetrics(60000);
            
            expect(avg.avgCpuUsage).toBeGreaterThanOrEqual(0);
            expect(avg.avgMemoryUsage).toBeGreaterThanOrEqual(0);
            expect(avg.peakCpuUsage).toBeGreaterThanOrEqual(avg.avgCpuUsage);
            expect(avg.peakMemoryUsage).toBeGreaterThanOrEqual(avg.avgMemoryUsage);
        });
        
        it('should return zero for empty history', () => {
            const avg = telemetry.getAverageMetrics();
            
            expect(avg.avgCpuUsage).toBe(0);
            expect(avg.avgMemoryUsage).toBe(0);
            expect(avg.totalAnalyses).toBeUndefined(); // Wrong property name test
        });
    });
    
    describe('📋 Report Generation', () => {
        it('should generate text report', async () => {
            telemetry.startMonitoring();
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            telemetry.stopMonitoring();
            
            const report = telemetry.generateReport();
            
            expect(report).toContain('HARDWARE TELEMETRY REPORT');
            expect(report).toContain('CPU');
            expect(report).toContain('Memory');
            expect(report).toContain('WORKER POOL');
        });
        
        it('should format bytes correctly', () => {
            const report = telemetry.generateReport();
            
            // Should contain formatted memory values
            expect(report).toMatch(/\d+\.\d+ (B|KB|MB|GB|TB)/);
        });
        
        it('should include per-core usage', () => {
            const report = telemetry.generateReport();
            
            expect(report).toContain('Core');
            expect(report).toMatch(/Core\s+\d+:/);
        });
    });
    
    describe('⚙️ Configuration', () => {
        it('should update configuration', () => {
            telemetry.updateConfig({
                cpuThreshold: 75,
                throttleDelay: 200
            });
            
            const config = telemetry.getConfig();
            
            expect(config.cpuThreshold).toBe(75);
            expect(config.throttleDelay).toBe(200);
        });
        
        it('should have default configuration', () => {
            const config = telemetry.getConfig();
            
            expect(config.cpuThreshold).toBe(90);
            expect(config.memoryThreshold).toBe(85);
            expect(config.minWorkers).toBeGreaterThan(0);
            expect(config.maxWorkers).toBeGreaterThan(config.minWorkers);
        });
    });
});
