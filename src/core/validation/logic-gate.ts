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
 * For licensing inquiries: dimitar.papazov@QAntum.dev
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as vm from 'node:vm';
import { EventEmitter } from 'node:events';
import * as crypto from 'node:crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Result of syntax validation
 */
export interface SyntaxValidationResult {
  valid: boolean;
  errors: SyntaxError[];
  warnings: string[];
  parsedAST?: unknown;
}

/**
 * Syntax error details
 */
export interface SyntaxError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Result of logic validation
 */
export interface LogicValidationResult {
  valid: boolean;
  issues: LogicIssue[];
  metrics: CodeMetrics;
}

/**
 * Logic issue found in code
 */
export interface LogicIssue {
  type: 'infinite-loop' | 'unreachable' | 'side-effect' | 'memory-leak' | 'security' | 'performance';
  message: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

/**
 * Code metrics
 */
export interface CodeMetrics {
  lineCount: number;
  complexity: number;
  nestingDepth: number;
  functionCount: number;
  asyncOperations: number;
  dangerousPatterns: string[];
}

/**
 * Sandbox execution result
 */
export interface SandboxExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  violations: SecurityViolation[];
  output: string[];
}

/**
 * Security violation
 */
export interface SecurityViolation {
  type: 'filesystem' | 'network' | 'process' | 'eval' | 'prototype' | 'timeout' | 'memory';
  operation: string;
  blocked: boolean;
  timestamp: Date;
}

/**
 * Full validation report
 */
export interface ValidationReport {
  id: string;
  code: string;
  timestamp: Date;
  syntax: SyntaxValidationResult;
  logic: LogicValidationResult;
  sandbox: SandboxExecutionResult;
  approved: boolean;
  approvalReason: string;
  score: number;
}

/**
 * Logic Gate configuration
 */
export interface LogicGateConfig {
  maxExecutionTime?: number;
  maxMemory?: number;
  maxComplexity?: number;
  maxNestingDepth?: number;
  allowedPatterns?: RegExp[];
  forbiddenPatterns?: RegExp[];
  requiredPatterns?: RegExp[];
  autoApproveThreshold?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DANGEROUS PATTERNS DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Patterns that indicate potentially dangerous code
 */
const DANGEROUS_PATTERNS = [
  // Dangerous globals
  { pattern: /\beval\s*\(/, name: 'eval', severity: 'critical' as const },
  { pattern: /\bFunction\s*\(/, name: 'Function constructor', severity: 'critical' as const },
  { pattern: /\bsetTimeout\s*\(\s*["']/, name: 'setTimeout with string', severity: 'high' as const },
  { pattern: /\bsetInterval\s*\(\s*["']/, name: 'setInterval with string', severity: 'high' as const },
  
  // Prototype pollution
  { pattern: /__proto__/, name: '__proto__ access', severity: 'critical' as const },
  { pattern: /\bconstructor\s*\[/, name: 'constructor bracket access', severity: 'high' as const },
  { pattern: /Object\.setPrototypeOf/, name: 'setPrototypeOf', severity: 'high' as const },
  
  // Process/System access
  { pattern: /\bprocess\./, name: 'process access', severity: 'critical' as const },
  { pattern: /\brequire\s*\(/, name: 'require', severity: 'high' as const },
  { pattern: /\bimport\s*\(/, name: 'dynamic import', severity: 'high' as const },
  { pattern: /child_process/, name: 'child_process', severity: 'critical' as const },
  
  // File system
  { pattern: /\bfs\b/, name: 'fs module', severity: 'high' as const },
  { pattern: /readFile|writeFile|unlink|rmdir/, name: 'file operations', severity: 'high' as const },
  
  // Network
  { pattern: /\bfetch\s*\(/, name: 'fetch', severity: 'medium' as const },
  { pattern: /XMLHttpRequest/, name: 'XMLHttpRequest', severity: 'medium' as const },
  { pattern: /WebSocket/, name: 'WebSocket', severity: 'medium' as const },
  
  // Infinite loops (heuristic)
  { pattern: /while\s*\(\s*true\s*\)/, name: 'while(true)', severity: 'high' as const },
  { pattern: /while\s*\(\s*1\s*\)/, name: 'while(1)', severity: 'high' as const },
  { pattern: /for\s*\(\s*;\s*;\s*\)/, name: 'for(;;)', severity: 'high' as const },
  
  // Memory issues
  { pattern: /new Array\s*\(\s*\d{7,}\s*\)/, name: 'huge array allocation', severity: 'high' as const },
  { pattern: /\.push\s*\([^)]*\)\s*;?\s*\}/, name: 'unbounded push in loop', severity: 'medium' as const }
];

/**
 * Required safety patterns
 */
const SAFETY_PATTERNS = [
  // Error handling
  { pattern: /try\s*\{/, name: 'try-catch', required: false },
  // Input validation
  { pattern: /typeof|instanceof/, name: 'type checking', required: false }
];

// ═══════════════════════════════════════════════════════════════════════════════
// AI LOGIC GATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 🧪 AI Logic Gate
 * 
 * Three-phase validation for AI-generated code:
 * 1. Syntax Validation - Check for valid JavaScript/TypeScript
 * 2. Logic Validation - Check for dangerous patterns and code quality
 * 3. Sandbox Execution - Test in isolated environment
 * 
 * Only code that passes all three phases is approved for production.
 */
export class AILogicGate extends EventEmitter {
  private config: Required<LogicGateConfig>;
  private validationHistory: ValidationReport[] = [];
  private approvalCount = 0;
  private rejectionCount = 0;
  private startTime = Date.now();

  constructor(config: LogicGateConfig = {}) {
    super();
    
    this.config = {
      maxExecutionTime: config.maxExecutionTime ?? 5000,
      maxMemory: config.maxMemory ?? 64 * 1024 * 1024, // 64MB
      maxComplexity: config.maxComplexity ?? 20,
      maxNestingDepth: config.maxNestingDepth ?? 6,
      allowedPatterns: config.allowedPatterns ?? [],
      forbiddenPatterns: config.forbiddenPatterns ?? [],
      requiredPatterns: config.requiredPatterns ?? [],
      autoApproveThreshold: config.autoApproveThreshold ?? 80
    };
  }

  /**
   * Validate AI-generated code through all gates
   * @param code - Code to validate
   * @param context - Optional execution context
   * @returns Full validation report
   */
  async validate(
    code: string,
    context: Record<string, unknown> = {}
  ): Promise<ValidationReport> {
    const reportId = this.generateReportId();
    const timestamp = new Date();

    // Phase 1: Syntax Validation
    const syntaxResult = this.validateSyntax(code);
    
    // Phase 2: Logic Validation
    const logicResult = this.validateLogic(code);
    
    // Phase 3: Sandbox Execution (only if syntax is valid)
    let sandboxResult: SandboxExecutionResult;
    if (syntaxResult.valid) {
      sandboxResult = await this.executeInSandbox(code, context);
    } else {
      sandboxResult = {
        success: false,
        error: 'Skipped due to syntax errors',
        executionTime: 0,
        memoryUsed: 0,
        violations: [],
        output: []
      };
    }

    // Calculate approval score
    const score = this.calculateScore(syntaxResult, logicResult, sandboxResult);
    const approved = score >= this.config.autoApproveThreshold;
    const approvalReason = this.generateApprovalReason(
      approved, score, syntaxResult, logicResult, sandboxResult
    );

    // Update counters
    if (approved) {
      this.approvalCount++;
    } else {
      this.rejectionCount++;
    }

    // Create report
    const report: ValidationReport = {
      id: reportId,
      code,
      timestamp,
      syntax: syntaxResult,
      logic: logicResult,
      sandbox: sandboxResult,
      approved,
      approvalReason,
      score
    };

    // Store in history
    this.validationHistory.push(report);
    if (this.validationHistory.length > 1000) {
      this.validationHistory.shift();
    }

    // Emit events
    this.emit('validated', report);
    if (!approved) {
      this.emit('rejected', report);
    }

    return report;
  }

  /**
   * Phase 1: Syntax Validation
   * Checks if code is syntactically valid JavaScript
   */
  private validateSyntax(code: string): SyntaxValidationResult {
    const errors: SyntaxError[] = [];
    const warnings: string[] = [];

    // Try to parse as a module
    try {
      new vm.Script(code, { filename: 'validation.js' });
    } catch (e) {
      const error = e as Error;
      const match = error.message.match(/line (\d+)/i);
      errors.push({
        line: match ? parseInt(match[1]) : 1,
        column: 0,
        message: error.message,
        severity: 'error'
      });
    }

    // Check for common issues
    if (!code.trim()) {
      errors.push({
        line: 1,
        column: 0,
        message: 'Empty code block',
        severity: 'error'
      });
    }

    // Check for unclosed brackets/braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      warnings.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      warnings.push(`Mismatched parentheses: ${openParens} open, ${closeParens} close`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Phase 2: Logic Validation
   * Checks for dangerous patterns and code quality
   */
  private validateLogic(code: string): LogicValidationResult {
    const issues: LogicIssue[] = [];
    const dangerousPatterns: string[] = [];

    // Check dangerous patterns
    for (const dangerous of DANGEROUS_PATTERNS) {
      if (dangerous.pattern.test(code)) {
        dangerousPatterns.push(dangerous.name);
        issues.push({
          type: 'security',
          message: `Dangerous pattern detected: ${dangerous.name}`,
          severity: dangerous.severity,
          suggestion: `Remove or replace ${dangerous.name} with a safe alternative`
        });
      }
    }

    // Check forbidden patterns from config
    for (const pattern of this.config.forbiddenPatterns) {
      if (pattern.test(code)) {
        issues.push({
          type: 'security',
          message: `Forbidden pattern: ${pattern.toString()}`,
          severity: 'high'
        });
      }
    }

    // Check required patterns from config
    for (const pattern of this.config.requiredPatterns) {
      if (!pattern.test(code)) {
        issues.push({
          type: 'security',
          message: `Required pattern missing: ${pattern.toString()}`,
          severity: 'medium'
        });
      }
    }

    // Calculate metrics
    const metrics = this.calculateMetrics(code);

    // Check metrics against limits
    if (metrics.complexity > this.config.maxComplexity) {
      issues.push({
        type: 'performance',
        message: `Cyclomatic complexity (${metrics.complexity}) exceeds limit (${this.config.maxComplexity})`,
        severity: 'medium',
        suggestion: 'Break down complex functions into smaller ones'
      });
    }

    if (metrics.nestingDepth > this.config.maxNestingDepth) {
      issues.push({
        type: 'performance',
        message: `Nesting depth (${metrics.nestingDepth}) exceeds limit (${this.config.maxNestingDepth})`,
        severity: 'medium',
        suggestion: 'Reduce nesting by extracting conditions or using early returns'
      });
    }

    return {
      valid: !issues.some(i => i.severity === 'critical' || i.severity === 'high'),
      issues,
      metrics: { ...metrics, dangerousPatterns }
    };
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(code: string): Omit<CodeMetrics, 'dangerousPatterns'> {
    const lines = code.split('\n');
    
    // Count functions
    const functionMatches = code.match(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*\{/g);
    const functionCount = functionMatches?.length ?? 0;

    // Count async operations
    const asyncMatches = code.match(/async|await|Promise|\.then\(|\.catch\(/g);
    const asyncOperations = asyncMatches?.length ?? 0;

    // Calculate cyclomatic complexity (simplified)
    const branchKeywords = code.match(/\bif\b|\belse\b|\bfor\b|\bwhile\b|\bcase\b|\bcatch\b|\b\?\b|\b&&\b|\b\|\|\b/g);
    const complexity = (branchKeywords?.length ?? 0) + 1;

    // Calculate max nesting depth
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return {
      lineCount: lines.length,
      complexity,
      nestingDepth: maxDepth,
      functionCount,
      asyncOperations
    };
  }

  /**
   * Phase 3: Sandbox Execution
   * Executes code in isolated environment
   */
  private async executeInSandbox(
    code: string,
    context: Record<string, unknown>
  ): Promise<SandboxExecutionResult> {
    const violations: SecurityViolation[] = [];
    const output: string[] = [];
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Create secure sandbox
    const sandbox = this.createSecureSandbox(violations, output);
    Object.assign(sandbox, context);

    try {
      const vmContext = vm.createContext(sandbox);
      const script = new vm.Script(code, { filename: 'sandbox.js' });
      
      const result = script.runInContext(vmContext, {
        timeout: this.config.maxExecutionTime
      });

      const executionTime = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;

      // Check memory usage
      if (memoryUsed > this.config.maxMemory) {
        violations.push({
          type: 'memory',
          operation: 'allocation',
          blocked: false,
          timestamp: new Date()
        });
      }

      return {
        success: true,
        result,
        executionTime,
        memoryUsed: Math.max(0, memoryUsed),
        violations,
        output
      };
    } catch (error) {
      const err = error as Error;
      const executionTime = Date.now() - startTime;

      if (err.message.includes('timed out')) {
        violations.push({
          type: 'timeout',
          operation: 'execution',
          blocked: true,
          timestamp: new Date()
        });
      }

      // v20.0: Handle dynamic import attempts (sandbox escape vector)
      const errWithCode = err as Error & { code?: string };
      if (err.message.includes('dynamic import') || 
          errWithCode.code === 'ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING') {
        violations.push({
          type: 'code-injection',
          operation: 'dynamic-import',
          blocked: true,
          timestamp: new Date()
        });
      }

      return {
        success: false,
        error: err.message,
        executionTime,
        memoryUsed: 0,
        violations,
        output
      };
    }
  }

  /**
   * Create secure sandbox with trapped globals
   */
  private createSecureSandbox(
    violations: SecurityViolation[],
    output: string[]
  ): Record<string, unknown> {
    const sandbox: Record<string, unknown> = {
      // Safe globals
      Math,
      JSON,
      Date,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Promise,
      Map,
      Set,
      Symbol,
      RegExp,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,

      // Console proxy
      console: {
        log: (...args: unknown[]) => output.push(args.map(String).join(' ')),
        warn: (...args: unknown[]) => output.push(`[WARN] ${args.map(String).join(' ')}`),
        error: (...args: unknown[]) => output.push(`[ERROR] ${args.map(String).join(' ')}`),
        info: (...args: unknown[]) => output.push(`[INFO] ${args.map(String).join(' ')}`)
      },

      // Blocked globals
      eval: undefined,
      Function: undefined,
      require: undefined,
      module: undefined,
      exports: undefined,
      __dirname: undefined,
      __filename: undefined,

      // Trapped process
      process: new Proxy({}, {
        get: (_target, prop) => {
          violations.push({
            type: 'process',
            operation: `process.${String(prop)}`,
            blocked: true,
            timestamp: new Date()
          });
          return undefined;
        }
      }),

      // Trapped fs
      fs: new Proxy({}, {
        get: (_target, prop) => {
          violations.push({
            type: 'filesystem',
            operation: `fs.${String(prop)}`,
            blocked: true,
            timestamp: new Date()
          });
          return undefined;
        }
      }),

      // Trapped fetch
      fetch: () => {
        violations.push({
          type: 'network',
          operation: 'fetch',
          blocked: true,
          timestamp: new Date()
        });
        return Promise.resolve(undefined);
      }
    };

    return sandbox;
  }

  /**
   * Calculate approval score (0-100)
   */
  private calculateScore(
    syntax: SyntaxValidationResult,
    logic: LogicValidationResult,
    sandbox: SandboxExecutionResult
  ): number {
    let score = 100;

    // Syntax penalties
    score -= syntax.errors.length * 25;
    score -= syntax.warnings.length * 5;

    // Logic penalties
    for (const issue of logic.issues) {
      switch (issue.severity) {
        case 'critical': score -= 50; break;
        case 'high': score -= 25; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    }

    // Sandbox penalties
    if (!sandbox.success) score -= 30;
    score -= sandbox.violations.length * 15;

    // Complexity penalty
    if (logic.metrics.complexity > 10) {
      score -= Math.min(20, logic.metrics.complexity - 10);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate human-readable approval reason
   */
  private generateApprovalReason(
    approved: boolean,
    score: number,
    syntax: SyntaxValidationResult,
    logic: LogicValidationResult,
    sandbox: SandboxExecutionResult
  ): string {
    if (approved) {
      return `Approved with score ${score}/100. Code passed all validation gates.`;
    }

    const reasons: string[] = [];
    
    if (syntax.errors.length > 0) {
      reasons.push(`${syntax.errors.length} syntax error(s)`);
    }
    
    const criticalIssues = logic.issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      reasons.push(`${criticalIssues.length} critical security issue(s)`);
    }
    
    if (sandbox.violations.length > 0) {
      reasons.push(`${sandbox.violations.length} sandbox violation(s)`);
    }
    
    if (!sandbox.success) {
      reasons.push('sandbox execution failed');
    }

    return `Rejected with score ${score}/100: ${reasons.join(', ')}.`;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `gate-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Get validation statistics
   */
  getStats(): {
    totalValidations: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    uptime: number;
  } {
    const total = this.approvalCount + this.rejectionCount;
    return {
      totalValidations: total,
      approved: this.approvalCount,
      rejected: this.rejectionCount,
      approvalRate: total > 0 ? (this.approvalCount / total) * 100 : 0,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Get recent validation reports
   * @param count - Number of reports to return
   */
  getRecentReports(count = 10): ValidationReport[] {
    return this.validationHistory.slice(-count);
  }

  /**
   * Clear validation history
   */
  clearHistory(): void {
    this.validationHistory = [];
  }
}

export default AILogicGate;
