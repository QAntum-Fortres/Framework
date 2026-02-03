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

import * as crypto from 'node:crypto';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { EventEmitter } from 'node:events';
import {
  EncryptionAlgorithm,
  EncryptedPayload,
  VaultEntry,
  VaultManifest,
  SyncStatus,
  NeuralVaultConfig
} from '../types';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

/**
 * PBKDF2 configuration
 */
const PBKDF2_CONFIG = {
  iterations: 100000,
  keyLength: 32, // 256 bits for AES-256
  digest: 'sha512'
};

/**
 * Current vault version
 */
const VAULT_VERSION = 1;

/**
 * Neural Vault
 * 
 * Provides encrypted storage for sensitive QANTUM data.
 */
export class NeuralVault extends EventEmitter {
  private config: Required<NeuralVaultConfig>;
  private derivedKey: Buffer | null = null;
  private salt: Buffer | null = null;
  private manifest: VaultManifest | null = null;
  private entries: Map<string, VaultEntry> = new Map();
  private syncStatus: SyncStatus;
  private machineId: string;
  private operationCount = 0;
  private startTime = Date.now();

  constructor(config: NeuralVaultConfig = {}) {
    super();
    
    this.config = {
      enabled: config.enabled ?? true,
      algorithm: config.algorithm ?? 'aes-256-gcm',
      vaultPath: config.vaultPath ?? './data/vault.encrypted',
      autoSyncInterval: config.autoSyncInterval ?? 0,
      cloudEndpoint: config.cloudEndpoint ?? '',
      compression: config.compression ?? true
    };
    
    this.syncStatus = {
      isSyncing: false,
      pendingChanges: 0
    };
    
    this.machineId = this.generateMachineId();
  }

  /**
   * Initialize the vault with a password
   * @param password - Master password for encryption
   * @param existingVault - Load existing vault if present
   */
  async initialize(password: string, existingVault = true): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Neural Vault is disabled');
    }

    // Generate or load salt
    if (existingVault && existsSync(this.config.vaultPath)) {
      await this.loadVault(password);
    } else {
      this.salt = crypto.randomBytes(32);
      this.derivedKey = await this.deriveKey(password, this.salt);
      
      // Create initial manifest
      this.manifest = {
        version: '19.0.0',
        machineId: this.machineId,
        createdAt: new Date(),
        entryCount: 0,
        totalSize: 0,
        manifestChecksum: ''
      };
      
      this.manifest.manifestChecksum = this.calculateChecksum(
        JSON.stringify(this.manifest)
      );
    }

    this.emit('initialized', { machineId: this.machineId });
  }

  /**
   * Derive encryption key from password using PBKDF2
   */
  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        PBKDF2_CONFIG.iterations,
        PBKDF2_CONFIG.keyLength,
        PBKDF2_CONFIG.digest,
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data - Data to encrypt
   */
  async encrypt(data: unknown): Promise<EncryptedPayload> {
    if (!this.derivedKey || !this.salt) {
      throw new Error('Vault not initialized');
    }

    this.operationCount++;

    // Serialize and optionally compress
    let serialized = JSON.stringify(data);
    if (this.config.compression) {
      const compressed = await gzip(Buffer.from(serialized, 'utf-8'));
      serialized = compressed.toString('base64');
    }

    // Generate IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12);

    // Create cipher
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      this.derivedKey,
      iv
    );

    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(serialized, 'utf-8'),
      cipher.final()
    ]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    return {
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      data: encrypted.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: this.salt.toString('base64'),
      encryptedAt: new Date(),
      version: VAULT_VERSION
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param payload - Encrypted payload
   */
  async decrypt<T = unknown>(payload: EncryptedPayload): Promise<T> {
    if (!this.derivedKey) {
      throw new Error('Vault not initialized');
    }

    this.operationCount++;

    // Parse components
    const iv = Buffer.from(payload.iv, 'base64');
    const encrypted = Buffer.from(payload.data, 'base64');
    const authTag = Buffer.from(payload.authTag!, 'base64');

    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.derivedKey,
      iv
    );

    // Set auth tag
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted: string;
    try {
      decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]).toString('utf-8');
    } catch (error) {
      throw new Error('Decryption failed: invalid password or corrupted data');
    }

    // Decompress if needed
    if (this.config.compression) {
      const decompressed = await gunzip(Buffer.from(decrypted, 'base64'));
      decrypted = decompressed.toString('utf-8');
    }

    return JSON.parse(decrypted);
  }

  /**
   * Store data in the vault
   * @param id - Entry ID
   * @param type - Entry type
   * @param data - Data to store
   */
  async store(
    id: string,
    type: VaultEntry['type'],
    data: unknown
  ): Promise<VaultEntry> {
    const originalData = JSON.stringify(data);
    const checksum = this.calculateChecksum(originalData);
    const encrypted = await this.encrypt(data);

    const entry: VaultEntry = {
      id,
      type,
      payload: encrypted,
      checksum,
      lastModified: new Date(),
      originalSize: originalData.length
    };

    this.entries.set(id, entry);
    this.syncStatus.pendingChanges++;
    
    this.emit('stored', { id, type });
    
    return entry;
  }

  /**
   * Retrieve data from the vault
   * @param id - Entry ID
   */
  async retrieve<T = unknown>(id: string): Promise<T | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    const data = await this.decrypt<T>(entry.payload);
    
    // Verify checksum
    const checksum = this.calculateChecksum(JSON.stringify(data));
    if (checksum !== entry.checksum) {
      throw new Error(`Data integrity check failed for entry ${id}`);
    }

    return data;
  }

  /**
   * Check if an entry exists
   * @param id - Entry ID
   */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Delete an entry
   * @param id - Entry ID
   */
  delete(id: string): boolean {
    const deleted = this.entries.delete(id);
    if (deleted) {
      this.syncStatus.pendingChanges++;
      this.emit('deleted', id);
    }
    return deleted;
  }

  /**
   * Calculate SHA-256 checksum
   * @param data - Data to hash
   */
  calculateChecksum(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity
   * @param id - Entry ID
   */
  async verifyIntegrity(id: string): Promise<boolean> {
    const entry = this.entries.get(id);
    if (!entry) return false;

    try {
      const data = await this.decrypt(entry.payload);
      const checksum = this.calculateChecksum(JSON.stringify(data));
      return checksum === entry.checksum;
    } catch {
      return false;
    }
  }

  /**
   * Save vault to disk
   */
  async save(): Promise<void> {
    if (!this.manifest || !this.salt) {
      throw new Error('Vault not initialized');
    }

    // Update manifest
    this.manifest.entryCount = this.entries.size;
    this.manifest.totalSize = Array.from(this.entries.values())
      .reduce((sum, entry) => sum + entry.originalSize, 0);
    this.manifest.lastSync = new Date();
    this.manifest.manifestChecksum = this.calculateChecksum(
      JSON.stringify({ ...this.manifest, manifestChecksum: '' })
    );

    // Prepare vault data
    const vaultData = {
      manifest: this.manifest,
      salt: this.salt.toString('base64'),
      entries: Array.from(this.entries.entries())
    };

    // Ensure directory exists
    const dir = dirname(this.config.vaultPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Write to disk
    await writeFile(
      this.config.vaultPath,
      JSON.stringify(vaultData, null, 2),
      'utf-8'
    );

    this.syncStatus.lastSuccessfulSync = new Date();
    this.syncStatus.pendingChanges = 0;

    this.emit('saved', { path: this.config.vaultPath });
  }

  /**
   * Load vault from disk
   * @param password - Master password
   */
  private async loadVault(password: string): Promise<void> {
    const data = await readFile(this.config.vaultPath, 'utf-8');
    const vaultData = JSON.parse(data);

    // Restore salt and derive key
    this.salt = Buffer.from(vaultData.salt, 'base64');
    this.derivedKey = await this.deriveKey(password, this.salt);

    // Restore manifest
    this.manifest = vaultData.manifest;

    // Restore entries
    this.entries = new Map(vaultData.entries);

    // Verify manifest checksum
    const expectedChecksum = this.manifest!.manifestChecksum;
    const calculatedChecksum = this.calculateChecksum(
      JSON.stringify({ ...this.manifest, manifestChecksum: '' })
    );

    if (expectedChecksum !== calculatedChecksum) {
      throw new Error('Vault manifest integrity check failed');
    }

    this.emit('loaded', { entryCount: this.entries.size });
  }

  /**
   * Change the master password
   * @param currentPassword - Current password
   * @param newPassword - New password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Verify current password
    if (!this.derivedKey || !this.salt) {
      throw new Error('Vault not initialized');
    }

    const verifyKey = await this.deriveKey(currentPassword, this.salt);
    if (!verifyKey.equals(this.derivedKey)) {
      throw new Error('Current password is incorrect');
    }

    // Decrypt all entries
    const decryptedEntries: Array<{ entry: VaultEntry; data: unknown }> = [];
    for (const [id, entry] of this.entries) {
      const data = await this.decrypt(entry.payload);
      decryptedEntries.push({ entry, data });
    }

    // Generate new salt and key
    this.salt = crypto.randomBytes(32);
    this.derivedKey = await this.deriveKey(newPassword, this.salt);

    // Re-encrypt all entries
    for (const { entry, data } of decryptedEntries) {
      const newPayload = await this.encrypt(data);
      entry.payload = newPayload;
      entry.lastModified = new Date();
    }

    // Save vault
    await this.save();

    this.emit('passwordChanged');
  }

  /**
   * Export vault (for backup)
   */
  async export(): Promise<string> {
    if (!this.manifest || !this.salt) {
      throw new Error('Vault not initialized');
    }

    const exportData = {
      manifest: this.manifest,
      salt: this.salt.toString('base64'),
      entries: Array.from(this.entries.entries()),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData);
  }

  /**
   * Import vault (from backup)
   * @param exportData - Exported vault data
   * @param password - Master password
   */
  async import(exportData: string, password: string): Promise<void> {
    const data = JSON.parse(exportData);
    
    this.salt = Buffer.from(data.salt, 'base64');
    this.derivedKey = await this.deriveKey(password, this.salt);
    this.manifest = data.manifest;
    this.entries = new Map(data.entries);

    await this.save();

    this.emit('imported', { entryCount: this.entries.size });
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get vault statistics
   */
  getStats(): {
    entryCount: number;
    totalSize: number;
    operationCount: number;
    uptime: number;
    pendingChanges: number;
  } {
    return {
      entryCount: this.entries.size,
      totalSize: this.manifest?.totalSize ?? 0,
      operationCount: this.operationCount,
      uptime: Date.now() - this.startTime,
      pendingChanges: this.syncStatus.pendingChanges
    };
  }

  /**
   * List all entries
   */
  listEntries(): Array<{
    id: string;
    type: VaultEntry['type'];
    size: number;
    lastModified: Date;
  }> {
    return Array.from(this.entries.values()).map(entry => ({
      id: entry.id,
      type: entry.type,
      size: entry.originalSize,
      lastModified: entry.lastModified
    }));
  }

  /**
   * Generate machine ID
   */
  private generateMachineId(): string {
    const hostname = require('node:os').hostname();
    const cpus = require('node:os').cpus();
    const data = `${hostname}-${cpus[0]?.model || 'unknown'}`;
    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  /**
   * Check if vault is initialized
   */
  isInitialized(): boolean {
    return this.derivedKey !== null && this.salt !== null;
  }

  /**
   * Check if vault is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Close the vault
   */
  async close(): Promise<void> {
    if (this.syncStatus.pendingChanges > 0) {
      await this.save();
    }
    
    this.derivedKey = null;
    this.salt = null;
    this.entries.clear();
    
    this.emit('closed');
  }
}

export default NeuralVault;
