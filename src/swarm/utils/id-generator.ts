/**
 * 🔧 ID Generator Utilities
 * 
 * Generates unique IDs for traces, spans, tasks, and messages
 * 
 * @author Dimitar Papazov
 * @version 17.0.0
 */

import * as crypto from 'crypto';

/**
 * Generate a unique trace ID (128-bit, W3C Trace Context format)
 * Format: 32 hex characters
 */
export function generateTraceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a unique span ID (64-bit)
 * Format: 16 hex characters
 */
export function generateSpanId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Generate a unique task ID
 * Format: task_XXXXXXXXXX
 */
export function generateTaskId(): string {
  return `task_${crypto.randomBytes(5).toString('hex')}`;
}

/**
 * Generate a unique message ID
 * Format: msg_XXXXXXXXXX
 */
export function generateMessageId(): string {
  return `msg_${crypto.randomBytes(5).toString('hex')}`;
}

/**
 * Generate a unique agent ID
 * Format: agent_XXXXXX
 */
export function generateAgentId(): string {
  return `agent_${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Generate a unique entry ID
 * Format: entry_XXXXXXXXXX
 */
export function generateEntryId(): string {
  return `entry_${crypto.randomBytes(5).toString('hex')}`;
}

/**
 * Generate a unique browser context ID
 * Format: ctx_XXXXXX
 */
export function generateContextId(): string {
  return `ctx_${crypto.randomBytes(3).toString('hex')}`;
}

/**
 * Generate a unique plan ID
 * Format: plan_XXXXXXXX
 */
export function generatePlanId(): string {
  return `plan_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Generate a unique feedback ID
 * Format: fb_XXXXXXXX
 */
export function generateFeedbackId(): string {
  return `fb_${crypto.randomBytes(4).toString('hex')}`;
}

export default {
  generateTraceId,
  generateSpanId,
  generateTaskId,
  generateMessageId,
  generateAgentId,
  generateEntryId,
  generateContextId,
  generatePlanId,
  generateFeedbackId,
};
