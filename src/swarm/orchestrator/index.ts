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

export { AgenticOrchestrator, OrchestratorStatus } from './agentic-orchestrator';
export { WebSocketBridge, ConnectionStatus, WsBridgeConfig } from './websocket-bridge';

// ═══════════════════════════════════════════════════════════════════════════════
// NOISE PROTOCOL BRIDGE - Hardware-Level Encrypted Communication
// ═══════════════════════════════════════════════════════════════════════════════

export {
  NoiseProtocolBridge,
  createNoiseBridge,
  
  // Types
  type NoisePattern,
  type CipherSuite,
  type KeyPair,
  type HandshakeState,
  type CipherState,
  type EncryptedMessage,
  type NoiseBridgeConfig,
  type ConnectionStats
} from './noise-protocol-bridge';
