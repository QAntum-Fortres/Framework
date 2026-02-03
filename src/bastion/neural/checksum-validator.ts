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
import { createReadStream } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';

/**
 * Checksum record
 */
export interface ChecksumRecord {
  /** Resource identifier */
  id: string;
  /** SHA-256 hash */
  hash: string;
  /** Hash algorithm used */
  algorithm: 'sha256';
  /** Size in bytes */
  size: number;
  /** Generation timestamp */
  generatedAt: Date;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * File checksum record
 */
export interface FileChecksum extends ChecksumRecord {
  /** File path */
  path: string;
  /** File modification time */
  mtime: Date;
}

/**
 * Manifest of checksums
 */
export interface ChecksumManifest {
  /** Manifest version */
  version: string;
  /** Generation timestamp */
  generatedAt: Date;
  /** Root path (for file manifests) */
  rootPath?: string;
  /** File checksums */
  files: FileChecksum[];
  /** Total files */
  totalFiles: number;
  /** Total size */
  totalSize: number;
  /** Manifest hash (hash of all file hashes) */
  manifestHash: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  /** Overall valid */
  valid: boolean;
  /** Checked items */
  checked: number;
  /** Valid items */
  validCount: number;
  /** Invalid items */
  invalidCount: number;
  /** Missing items */
  missingCount: number;
  /** Invalid items details */
  invalidItems: Array<{
    id: string;
    expected: string;
    actual: string | null;
    reason: 'mismatch' | 'missing' | 'error';
  }>;
  /** Verification timestamp */
  verifiedAt: Date;
}

/**
 * Checksum Validator
 * 
 * Provides checksum generation and verification utilities.
 */
export class ChecksumValidator extends EventEmitter {
  private cache: Map<string, ChecksumRecord> = new Map();
  private cacheEnabled: boolean;
  private operationCount = 0;
  private startTime = Date.now();

  constructor(options: { cacheEnabled?: boolean } = {}) {
    super();
    this.cacheEnabled = options.cacheEnabled ?? true;
  }

  /**
   * Generate SHA-256 hash for a string
   * @param data - String data
   */
  hashString(data: string): string {
    this.operationCount++;
    return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
  }

  /**
   * Generate SHA-256 hash for a buffer
   * @param buffer - Buffer data
   */
  hashBuffer(buffer: Buffer): string {
    this.operationCount++;
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate SHA-256 hash for any serializable data
   * @param data - Any serializable data
   */
  hashData(data: unknown): ChecksumRecord {
    const serialized = JSON.stringify(data);
    const hash = this.hashString(serialized);
    const id = `data-${Date.now()}-${hash.slice(0, 8)}`;
    
    const record: ChecksumRecord = {
      id,
      hash,
      algorithm: 'sha256',
      size: Buffer.byteLength(serialized, 'utf-8'),
      generatedAt: new Date()
    };

    if (this.cacheEnabled) {
      this.cache.set(id, record);
    }

    return record;
  }

  /**
   * Generate SHA-256 hash for a file
   * @param filePath - File path
   */
  async hashFile(filePath: string): Promise<FileChecksum> {
    this.operationCount++;
    
    return new Promise(async (resolve, reject) => {
      try {
        const fileStat = await stat(filePath);
        const hash = crypto.createHash('sha256');
        const stream = createReadStream(filePath);
        
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('error', reject);
        stream.on('end', () => {
          const record: FileChecksum = {
            id: filePath,
            path: filePath,
            hash: hash.digest('hex'),
            algorithm: 'sha256',
            size: fileStat.size,
            mtime: fileStat.mtime,
            generatedAt: new Date()
          };
          
          if (this.cacheEnabled) {
            this.cache.set(filePath, record);
          }
          
          this.emit('fileHashed', record);
          resolve(record);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate checksum manifest for a directory
   * @param dirPath - Directory path
   * @param recursive - Include subdirectories
   */
  async generateManifest(
    dirPath: string,
    recursive = true
  ): Promise<ChecksumManifest> {
    const files: FileChecksum[] = [];
    let totalSize = 0;
    
    await this.walkDirectory(dirPath, recursive, async (filePath) => {
      const checksum = await this.hashFile(filePath);
      files.push(checksum);
      totalSize += checksum.size;
      this.emit('manifestProgress', { path: filePath, count: files.length });
    });

    // Generate manifest hash from all file hashes
    const allHashes = files.map(f => f.hash).sort().join('');
    const manifestHash = this.hashString(allHashes);

    const manifest: ChecksumManifest = {
      version: '19.0.0',
      generatedAt: new Date(),
      rootPath: dirPath,
      files,
      totalFiles: files.length,
      totalSize,
      manifestHash
    };

    this.emit('manifestGenerated', manifest);
    
    return manifest;
  }

  /**
   * Walk directory recursively
   */
  private async walkDirectory(
    dirPath: string,
    recursive: boolean,
    callback: (filePath: string) => Promise<void>
  ): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      
      if (entry.isFile()) {
        await callback(fullPath);
      } else if (entry.isDirectory() && recursive) {
        await this.walkDirectory(fullPath, recursive, callback);
      }
    }
  }

  /**
   * Verify a checksum
   * @param data - Data to verify
   * @param expectedHash - Expected hash
   */
  verifyData(data: unknown, expectedHash: string): boolean {
    const actualHash = this.hashString(JSON.stringify(data));
    return actualHash === expectedHash;
  }

  /**
   * Verify a file checksum
   * @param filePath - File path
   * @param expectedHash - Expected hash
   */
  async verifyFile(filePath: string, expectedHash: string): Promise<boolean> {
    try {
      const checksum = await this.hashFile(filePath);
      return checksum.hash === expectedHash;
    } catch {
      return false;
    }
  }

  /**
   * Verify a manifest
   * @param manifest - Manifest to verify
   */
  async verifyManifest(manifest: ChecksumManifest): Promise<VerificationResult> {
    const result: VerificationResult = {
      valid: true,
      checked: 0,
      validCount: 0,
      invalidCount: 0,
      missingCount: 0,
      invalidItems: [],
      verifiedAt: new Date()
    };

    for (const file of manifest.files) {
      result.checked++;
      
      try {
        const actualChecksum = await this.hashFile(file.path);
        
        if (actualChecksum.hash === file.hash) {
          result.validCount++;
        } else {
          result.valid = false;
          result.invalidCount++;
          result.invalidItems.push({
            id: file.path,
            expected: file.hash,
            actual: actualChecksum.hash,
            reason: 'mismatch'
          });
        }
      } catch (error) {
        result.valid = false;
        result.missingCount++;
        result.invalidItems.push({
          id: file.path,
          expected: file.hash,
          actual: null,
          reason: 'missing'
        });
      }

      this.emit('verifyProgress', {
        path: file.path,
        checked: result.checked,
        total: manifest.totalFiles
      });
    }

    // Verify manifest hash
    const allHashes = manifest.files.map(f => f.hash).sort().join('');
    const calculatedManifestHash = this.hashString(allHashes);
    
    if (calculatedManifestHash !== manifest.manifestHash) {
      result.valid = false;
      result.invalidItems.push({
        id: 'manifest',
        expected: manifest.manifestHash,
        actual: calculatedManifestHash,
        reason: 'mismatch'
      });
    }

    this.emit('verifyComplete', result);
    
    return result;
  }

  /**
   * Verify multiple checksums at once
   * @param records - Checksum records to verify
   * @param dataProvider - Function to get data by ID
   */
  async verifyMultiple(
    records: ChecksumRecord[],
    dataProvider: (id: string) => Promise<unknown>
  ): Promise<VerificationResult> {
    const result: VerificationResult = {
      valid: true,
      checked: 0,
      validCount: 0,
      invalidCount: 0,
      missingCount: 0,
      invalidItems: [],
      verifiedAt: new Date()
    };

    for (const record of records) {
      result.checked++;
      
      try {
        const data = await dataProvider(record.id);
        const actualHash = this.hashString(JSON.stringify(data));
        
        if (actualHash === record.hash) {
          result.validCount++;
        } else {
          result.valid = false;
          result.invalidCount++;
          result.invalidItems.push({
            id: record.id,
            expected: record.hash,
            actual: actualHash,
            reason: 'mismatch'
          });
        }
      } catch (error) {
        result.valid = false;
        result.missingCount++;
        result.invalidItems.push({
          id: record.id,
          expected: record.hash,
          actual: null,
          reason: 'error'
        });
      }
    }

    return result;
  }

  /**
   * Compare two hashes in constant time (timing-safe)
   * @param hash1 - First hash
   * @param hash2 - Second hash
   */
  compareHashes(hash1: string, hash2: string): boolean {
    if (hash1.length !== hash2.length) return false;
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(hash1, 'hex'),
        Buffer.from(hash2, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Get cached checksum
   * @param id - Record ID
   */
  getCached(id: string): ChecksumRecord | undefined {
    return this.cache.get(id);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    operationCount: number;
    cacheSize: number;
    uptime: number;
  } {
    return {
      operationCount: this.operationCount,
      cacheSize: this.cache.size,
      uptime: Date.now() - this.startTime
    };
  }
}

export default ChecksumValidator;
