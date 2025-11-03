/**
 * In-Memory Cache Storage Implementation
 */

import type { ICacheStorage, CacheEntry, CacheStatistics } from './types.js';

/**
 * In-memory cache storage with TTL and size management
 */
export class CacheStorage implements ICacheStorage {
  private storage = new Map<string, CacheEntry>();
  private metadata = new Map<string, { expiresAt: number; size: number }>();

  constructor(
    private maxEntries: number = 1000,
    private maxSize: number = 100 * 1024 * 1024 // 100MB default
  ) {}

  async get<T = unknown>(key: string): Promise<CacheEntry<T> | null> {
    const metaInfo = this.metadata.get(key);

    // Check if expired
    if (metaInfo && metaInfo.expiresAt < Date.now()) {
      await this.delete(key);
      return null;
    }

    const entry = this.storage.get(key) as CacheEntry<T> | undefined;
    if (entry) {
      // Update access metadata
      entry.metadata.accessedAt = new Date();
      entry.metadata.accessCount += 1;
    }

    return entry || null;
  }

  async set<T = unknown>(key: string, entry: CacheEntry<T>): Promise<void> {
    const entrySize = this.estimateSize(entry);

    // Check max entries
    if (this.storage.size >= this.maxEntries && !this.storage.has(key)) {
      await this.evictLRU();
    }

    // Check max total size
    let totalSize = Array.from(this.metadata.values()).reduce((sum, m) => sum + m.size, 0);
    while (totalSize + entrySize > this.maxSize && this.storage.size > 0) {
      await this.evictLRU();
      totalSize = Array.from(this.metadata.values()).reduce((sum, m) => sum + m.size, 0);
    }

    this.storage.set(key, entry);
    this.metadata.set(key, {
      expiresAt: Date.now() + entry.metadata.ttl * 1000,
      size: entrySize,
    });
  }

  async has(key: string): Promise<boolean> {
    const metaInfo = this.metadata.get(key);

    // Check if expired
    if (metaInfo && metaInfo.expiresAt < Date.now()) {
      await this.delete(key);
      return false;
    }

    return this.storage.has(key);
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
    this.metadata.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
    this.metadata.clear();
  }

  async keys(): Promise<string[]> {
    // Filter out expired entries
    const allKeys = Array.from(this.storage.keys());
    const validKeys: string[] = [];

    for (const key of allKeys) {
      const metaInfo = this.metadata.get(key);
      if (!metaInfo || metaInfo.expiresAt >= Date.now()) {
        validKeys.push(key);
      } else {
        await this.delete(key);
      }
    }

    return validKeys;
  }

  async stats(): Promise<CacheStatistics> {
    const allKeys = Array.from(this.storage.keys());
    const validKeys: string[] = [];
    let totalSize = 0;
    let totalHits = 0;
    let totalLatency = 0;

    for (const key of allKeys) {
      const metaInfo = this.metadata.get(key);
      if (!metaInfo || metaInfo.expiresAt < Date.now()) {
        await this.delete(key);
      } else {
        validKeys.push(key);
        totalSize += metaInfo.size;

        const entry = this.storage.get(key);
        if (entry) {
          totalHits += entry.metadata.accessCount;
          totalLatency += entry.metadata.latency;
        }
      }
    }

    const hitRate = validKeys.length > 0 ? totalHits / validKeys.length : 0;

    return {
      totalHits,
      totalMisses: 0, // Track separately
      hitRate,
      totalSavings: {
        cost: 0,
        latency: totalLatency,
        tokens: 0,
      },
      avgLatency: validKeys.length > 0 ? totalLatency / validKeys.length : 0,
      entriesCount: validKeys.length,
      totalSize,
    };
  }

  /**
   * Evict least recently used entry
   */
  private async evictLRU(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.storage.entries()) {
      const entryTime = entry.metadata.accessedAt.getTime();
      if (entryTime < oldestTime) {
        oldestTime = entryTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
    }
  }

  /**
   * Estimate entry size in bytes
   */
  private estimateSize(entry: CacheEntry): number {
    const dataSize = JSON.stringify(entry.data).length;
    const metadataSize = JSON.stringify(entry.metadata).length;
    const embeddingSize = entry.embedding ? entry.embedding.length * 8 : 0; // 8 bytes per float

    return dataSize + metadataSize + embeddingSize;
  }
}

/**
 * In-memory cache with manual eviction
 */
export class SimpleCache implements ICacheStorage {
  private storage = new Map<string, { entry: CacheEntry; expiresAt: number }>();

  constructor(private maxEntries: number = 1000) {}

  async get<T = unknown>(key: string): Promise<CacheEntry<T> | null> {
    const item = this.storage.get(key);

    if (!item) {
      return null;
    }

    if (item.expiresAt < Date.now()) {
      this.storage.delete(key);
      return null;
    }

    item.entry.metadata.accessedAt = new Date();
    item.entry.metadata.accessCount += 1;

    return item.entry as CacheEntry<T>;
  }

  async set<T = unknown>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (this.storage.size >= this.maxEntries && !this.storage.has(key)) {
      const firstKey = this.storage.keys().next().value as string | undefined;
      if (firstKey) {
        this.storage.delete(firstKey);
      }
    }

    this.storage.set(key, {
      entry,
      expiresAt: Date.now() + entry.metadata.ttl * 1000,
    });
  }

  async has(key: string): Promise<boolean> {
    const item = this.storage.get(key);
    if (!item) {
      return false;
    }

    if (item.expiresAt < Date.now()) {
      this.storage.delete(key);
      return false;
    }

    return true;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  async stats(): Promise<CacheStatistics> {
    const entriesCount = this.storage.size;
    let totalHits = 0;
    let totalLatency = 0;

    for (const { entry } of this.storage.values()) {
      totalHits += entry.metadata.accessCount;
      totalLatency += entry.metadata.latency;
    }

    return {
      totalHits,
      totalMisses: 0,
      hitRate: entriesCount > 0 ? totalHits / entriesCount : 0,
      totalSavings: {
        cost: 0,
        latency: totalLatency,
        tokens: 0,
      },
      avgLatency: entriesCount > 0 ? totalLatency / entriesCount : 0,
      entriesCount,
      totalSize: 0,
    };
  }
}
