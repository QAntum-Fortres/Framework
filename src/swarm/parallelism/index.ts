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

export { BrowserPoolManager } from './browser-pool';
export type { BrowserPoolConfig } from './browser-pool';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED MEMORY V2 - Lock-Free High-Performance Memory Manager
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SharedMemoryV2,
  getSharedMemoryV2,
} from './shared-memory-v2';

export type {
  MemorySegmentConfig,
  SharedMemoryStats,
  MemoryOpResult,
  MemorySegment
} from './shared-memory-v2';
