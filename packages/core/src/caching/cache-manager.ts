/**
 * Smart Cache Manager
 * Handles semantic matching, exact matching, and fuzzy matching
 */

import crypto from 'crypto';
import type {
  CacheConfig,
  CacheEntry,
  CacheQueryResult,
  CacheQueryOptions,
  CacheStatistics,
  SemanticMatcher,
  ICacheStorage,
  CostSavings,
} from './types.js';
import { SimpleCache } from './cache-storage.js';

/**
 * Simple cosine similarity implementation
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude !== 0 ? dotProduct / magnitude : 0;
}

/**
 * Simple string similarity using Levenshtein distance
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance implementation
 */
function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];

  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return costs[s2.length];
}

/**
 * Default semantic matcher using simple embedding
 */
class SimpleSemanticMatcher implements SemanticMatcher {
  async embed(text: string): Promise<number[]> {
    // Simple hash-based embedding for demo
    // In production, use actual embedding models
    const normalized = text.toLowerCase().trim();
    const hash = crypto.createHash('sha256').update(normalized).digest();

    const embedding: number[] = [];
    for (let i = 0; i < 128; i++) {
      embedding.push((hash[i % hash.length] - 128) / 128);
    }

    return embedding;
  }

  similarity(vec1: number[], vec2: number[]): number {
    return cosineSimilarity(vec1, vec2);
  }
}

/**
 * Smart cache manager
 */
export class CacheManager {
  private storage: ICacheStorage;
  private config: CacheConfig;
  private matcher: SemanticMatcher;
  private operationStats = new Map<string, { timestamp: number; cost: number }>();

  constructor(config: CacheConfig, storage?: ICacheStorage, matcher?: SemanticMatcher) {
    this.config = config;
    this.storage = storage || new SimpleCache();
    this.matcher = matcher || new SimpleSemanticMatcher();
  }

  /**
   * Query cache
   */
  async query<T = any>(
    prompt: string,
    options: CacheQueryOptions = { similarity: 0.85 }
  ): Promise<CacheQueryResult<T>> {
    if (!this.config.enabled) {
      return { hit: false, data: null, metadata: null };
    }

    const similarity = options.similarity ?? 0.85;

    switch (this.config.strategy) {
      case 'exact':
        return this.queryExact<T>(prompt);

      case 'semantic':
        return this.querySemantic<T>(prompt, similarity);

      case 'fuzzy':
        return this.queryFuzzy<T>(prompt, similarity);

      default:
        return { hit: false, data: null, metadata: null };
    }
  }

  /**
   * Store in cache
   */
  async store<T = any>(
    prompt: string,
    data: T,
    metadata: {
      cost: number;
      latency: number;
      tokenCount: { input: number; output: number };
    }
  ): Promise<void> {
    if (!this.config.enabled) return;

    const key = await this.getKey(prompt);
    const entry: CacheEntry<T> = {
      data,
      metadata: {
        key,
        createdAt: new Date(),
        accessedAt: new Date(),
        accessCount: 0,
        ttl: this.config.ttl,
        cost: metadata.cost,
        latency: metadata.latency,
        tokenCount: metadata.tokenCount,
      },
    };

    if (this.config.strategy === 'semantic') {
      entry.embedding = await this.matcher.embed(prompt);
    }

    await this.storage.set(key, entry);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStatistics> {
    return this.storage.stats();
  }

  /**
   * Clear cache
   */
  async clear(): Promise<void> {
    await this.storage.clear();
  }

  /**
   * Query with exact matching
   */
  private async queryExact<T = any>(prompt: string): Promise<CacheQueryResult<T>> {
    const key = await this.getKey(prompt);
    const entry = await this.storage.get<T>(key);

    if (!entry) {
      return { hit: false, data: null, metadata: null };
    }

    const savings = await this.calculateSavings(entry.metadata);
    await this.config.onCacheHit?.({ savings, entry: entry.metadata });

    return {
      hit: true,
      data: entry.data,
      metadata: entry.metadata,
      savings,
    };
  }

  /**
   * Query with semantic matching
   */
  private async querySemantic<T = any>(
    prompt: string,
    similarity: number
  ): Promise<CacheQueryResult<T>> {
    const promptEmbedding = await this.matcher.embed(prompt);
    const keys = await this.storage.keys();

    let bestMatch: { key: string; similarity: number; entry: CacheEntry<T> } | null = null;

    for (const key of keys) {
      const entry = await this.storage.get<T>(key);
      if (!entry?.embedding) continue;

      const sim = this.matcher.similarity(promptEmbedding, entry.embedding);
      if (sim >= similarity && (!bestMatch || sim > bestMatch.similarity)) {
        bestMatch = { key, similarity: sim, entry };
      }
    }

    if (!bestMatch) {
      return { hit: false, data: null, metadata: null };
    }

    const savings = await this.calculateSavings(bestMatch.entry.metadata);
    await this.config.onCacheHit?.({
      savings,
      entry: bestMatch.entry.metadata,
    });

    return {
      hit: true,
      data: bestMatch.entry.data,
      metadata: bestMatch.entry.metadata,
      savings,
    };
  }

  /**
   * Query with fuzzy matching
   */
  private async queryFuzzy<T = any>(
    prompt: string,
    similarity: number
  ): Promise<CacheQueryResult<T>> {
    const keys = await this.storage.keys();

    let bestMatch: { key: string; similarity: number; entry: CacheEntry<T> } | null = null;

    for (const key of keys) {
      const entry = await this.storage.get<T>(key);
      if (!entry) continue;

      // Extract prompt from key if possible, otherwise use string comparison
      const sim = stringSimilarity(prompt, entry.metadata.key);
      if (sim >= similarity && (!bestMatch || sim > bestMatch.similarity)) {
        bestMatch = { key, similarity: sim, entry };
      }
    }

    if (!bestMatch) {
      return { hit: false, data: null, metadata: null };
    }

    const savings = await this.calculateSavings(bestMatch.entry.metadata);
    await this.config.onCacheHit?.({
      savings,
      entry: bestMatch.entry.metadata,
    });

    return {
      hit: true,
      data: bestMatch.entry.data,
      metadata: bestMatch.entry.metadata,
      savings,
    };
  }

  /**
   * Calculate cost savings
   */
  private async calculateSavings(cached: any): Promise<CostSavings> {
    if (this.config.estimatedSavings) {
      const fresh = {
        ...cached,
        cost: cached.cost * 1.2, // Estimated fresh cost (20% more)
        latency: cached.latency * 2, // Estimated fresh latency
      };
      return this.config.estimatedSavings(cached, fresh);
    }

    return {
      cost: cached.cost * 0.8, // Default: save 80% cost
      latency: cached.latency, // Save full latency
      tokens: cached.tokenCount.output, // Save output tokens
    };
  }

  /**
   * Get cache key from prompt
   */
  private async getKey(prompt: string): Promise<string> {
    if (this.config.strategy === 'exact') {
      return crypto.createHash('sha256').update(prompt).digest('hex');
    }
    return crypto.createHash('sha256').update(prompt.slice(0, 100)).digest('hex');
  }
}
