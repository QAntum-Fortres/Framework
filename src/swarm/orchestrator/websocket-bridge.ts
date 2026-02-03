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

import { EventEmitter } from 'events';
import { SwarmMessage, MessagePriority } from '../types';
import { generateMessageId, generateSpanId } from '../utils/id-generator';

/** Connection status */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/** WebSocket bridge configuration */
export interface WsBridgeConfig {
  /** WebSocket server URL */
  serverUrl?: string;
  /** Reconnect attempts */
  maxReconnectAttempts?: number;
  /** Reconnect interval in ms */
  reconnectInterval?: number;
  /** Heartbeat interval in ms */
  heartbeatInterval?: number;
  /** Message timeout in ms */
  messageTimeout?: number;
  /** Enable compression */
  compression?: boolean;
  /** Authentication token */
  authToken?: string;
  /** Verbose logging */
  verbose?: boolean;
}

/** Pending message for retry */
interface PendingMessage {
  message: SwarmMessage;
  timestamp: Date;
  retries: number;
  maxRetries: number;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

/**
 * WebSocket Message Bridge
 * 
 * Provides:
 * - Bidirectional messaging between cloud and local
 * - Automatic reconnection
 * - Message queuing and retry
 * - Heartbeat monitoring
 */
export class WebSocketBridge extends EventEmitter {
  /** Configuration */
  private config: WsBridgeConfig;
  
  /** WebSocket instance (will be actual WebSocket in browser/Node) */
  private ws: { connected: boolean } | null = null;
  
  /** Connection status */
  private status: ConnectionStatus = 'disconnected';
  
  /** Reconnect attempts counter */
  private reconnectAttempts: number = 0;
  
  /** Heartbeat timer */
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  
  /** Pending messages awaiting response */
  private pendingMessages: Map<string, PendingMessage> = new Map();
  
  /** Message queue for offline period */
  private messageQueue: SwarmMessage[] = [];
  
  /** Client ID */
  private clientId: string;
  
  /** Last heartbeat received */
  private lastHeartbeat: Date | null = null;

  constructor(config?: WsBridgeConfig) {
    super();
    
    this.config = {
      serverUrl: config?.serverUrl || 'ws://localhost:8080',
      maxReconnectAttempts: config?.maxReconnectAttempts || 5,
      reconnectInterval: config?.reconnectInterval || 3000,
      heartbeatInterval: config?.heartbeatInterval || 30000,
      messageTimeout: config?.messageTimeout || 10000,
      compression: config?.compression ?? true,
      authToken: config?.authToken,
      verbose: config?.verbose ?? false,
    };
    
    this.clientId = `client_${Date.now().toString(36)}`;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<boolean> {
    if (this.status === 'connected') {
      return true;
    }
    
    this.status = 'connecting';
    this.emit('statusChange', this.status);
    this.log('Connecting to WebSocket server...');
    
    try {
      // In a real implementation, this would create actual WebSocket
      // For now, we simulate the connection
      await this.simulateConnection();
      
      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.emit('statusChange', this.status);
      this.emit('connected', { clientId: this.clientId });
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Flush queued messages
      await this.flushMessageQueue();
      
      this.log('Connected to WebSocket server');
      return true;
      
    } catch (error: unknown) {
      this.status = 'error';
      this.emit('statusChange', this.status);
      this.emit('error', error);
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Connection failed: ${message}`);
      
      // Attempt reconnect
      if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
        this.scheduleReconnect();
      }
      
      return false;
    }
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    this.log('Disconnecting from WebSocket server...');
    
    this.stopHeartbeat();
    
    if (this.ws) {
      // Close WebSocket
      this.ws = null;
    }
    
    this.status = 'disconnected';
    this.emit('statusChange', this.status);
    this.emit('disconnected', { clientId: this.clientId });
    
    this.log('Disconnected from WebSocket server');
  }

  /**
   * Send a message through the bridge
   */
  async send(message: SwarmMessage): Promise<unknown> {
    // If not connected, queue the message
    if (this.status !== 'connected') {
      this.messageQueue.push(message);
      this.log(`Message queued (offline): ${message.id}`);
      return { queued: true, messageId: message.id };
    }
    
    return new Promise((resolve, reject) => {
      // Add to pending
      const pending: PendingMessage = {
        message,
        timestamp: new Date(),
        retries: 0,
        maxRetries: 3,
        resolve,
        reject,
      };
      
      this.pendingMessages.set(message.id, pending);
      
      // Set timeout
      setTimeout(() => {
        if (this.pendingMessages.has(message.id)) {
          this.pendingMessages.delete(message.id);
          reject(new Error(`Message timeout: ${message.id}`));
        }
      }, this.config.messageTimeout);
      
      // Simulate sending
      this.simulateSend(message);
      
      this.log(`Message sent: ${message.id}`);
    });
  }

  /**
   * Send message and wait for specific response
   */
  async sendAndWaitForResponse(
    message: SwarmMessage,
    timeout?: number
  ): Promise<SwarmMessage | null> {
    return new Promise((resolve, reject) => {
      const timeoutMs = timeout || this.config.messageTimeout || 10000;
      
      // Listen for response
      const responseHandler = (response: SwarmMessage) => {
        if (response.parentSpanId === message.spanId) {
          this.off('message', responseHandler);
          resolve(response);
        }
      };
      
      this.on('message', responseHandler);
      
      // Set timeout
      setTimeout(() => {
        this.off('message', responseHandler);
        resolve(null);
      }, timeoutMs);
      
      // Send message
      this.send(message).catch(reject);
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  async broadcast(
    type: SwarmMessage['type'],
    payload: unknown,
    traceId: string,
    priority: MessagePriority = 'normal'
  ): Promise<void> {
    const message: SwarmMessage = {
      id: generateMessageId(),
      traceId,
      spanId: generateSpanId(),
      from: this.clientId,
      to: 'broadcast',
      type,
      priority,
      payload,
      timestamp: new Date(),
    };
    
    await this.send(message);
    this.log(`Broadcast sent: ${message.id}`);
  }

  /**
   * Handle incoming message
   */
  private handleIncomingMessage(data: unknown): void {
    try {
      const message: SwarmMessage = typeof data === 'string' ? JSON.parse(data) : data as SwarmMessage;
      
      // Check if it's a response to pending message
      if (message.parentSpanId) {
        const pending = this.findPendingBySpan(message.parentSpanId);
        if (pending) {
          pending.resolve(message);
          this.pendingMessages.delete(pending.message.id);
        }
      }
      
      // Emit for general handling
      this.emit('message', message);
      this.log(`Message received: ${message.id} from ${message.from}`);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Failed to parse message: ${errorMessage}`);
      this.emit('parseError', { data, error });
    }
  }

  /**
   * Find pending message by span ID
   */
  private findPendingBySpan(spanId: string): PendingMessage | null {
    for (const pending of this.pendingMessages.values()) {
      if (pending.message.spanId === spanId) {
        return pending;
      }
    }
    return null;
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.status === 'connected') {
        this.sendHeartbeat();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Send heartbeat
   */
  private sendHeartbeat(): void {
    const heartbeat: SwarmMessage = {
      id: generateMessageId(),
      traceId: 'heartbeat',
      spanId: generateSpanId(),
      from: this.clientId,
      to: 'server',
      type: 'heartbeat',
      priority: 'low',
      payload: { timestamp: Date.now() },
      timestamp: new Date(),
    };
    
    this.simulateSend(heartbeat);
    this.log('Heartbeat sent');
  }

  /**
   * Schedule reconnect
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    this.status = 'reconnecting';
    this.emit('statusChange', this.status);
    
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);
    this.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Flush message queue after reconnect
   */
  private async flushMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.send(message);
    }
    this.log('Message queue flushed');
  }

  /**
   * Simulate connection (for testing without actual WebSocket)
   */
  private async simulateConnection(): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.ws = { connected: true }; // Placeholder
  }

  /**
   * Simulate sending (for testing without actual WebSocket)
   */
  private simulateSend(message: SwarmMessage): void {
    // In real implementation, this would use ws.send()
    // For now, simulate async response
    setTimeout(() => {
      this.emit('messageSent', message);
    }, 10);
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Get pending message count
   */
  getPendingCount(): number {
    return this.pendingMessages.size;
  }

  /**
   * Get queued message count
   */
  getQueuedCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Log if verbose
   */
  private log(message: string, ...args: unknown[]): void {
    if (this.config.verbose) {
      console.log(`[WsBridge] ${message}`, ...args);
    }
  }
}

export default WebSocketBridge;
