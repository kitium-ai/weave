/**
 * Smart Caching System Types
 * Semantic-aware caching with UI feedback and cost tracking
 */

/**
 * Cache strategy for matching prompts
 */
export type CacheStrategy = 'exact' | 'semantic' | 'fuzzy';

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  key: string;
  createdAt: Date;
  accessedAt: Date;
  accessCount: number;
  ttl: number;
  cost: number;
  latency: number;
  tokenCount: {
    input: number;
    output: number;
  };
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  data: T;
  metadata: CacheEntryMetadata;
  embedding?: number[];
}

/**
 * Cache hit result
 */
export interface CacheHitResult<T = any> {
  hit: true;
  data: T;
  metadata: CacheEntryMetadata;
  savings: CostSavings;
}

/**
 * Cache miss result
 */
export interface CacheMissResult {
  hit: false;
  data: null;
  metadata: null;
}

export type CacheQueryResult<T = any> = CacheHitResult<T> | CacheMissResult;

/**
 * Cost savings from cache hit
 */
export interface CostSavings {
  cost: number;
  latency: number;
  tokens: number;
}

/**
 * Cache hit callback
 */
export interface CacheHitCallback {
  onCacheHit?: (result: {
    savings: CostSavings;
    entry: CacheEntryMetadata;
  }) => void | Promise<void>;
}

/**
 * Cost estimation function
 */
export type CostEstimator = (cached: CacheEntryMetadata, fresh: CacheEntryMetadata) => CostSavings;

/**
 * Cache configuration
 */
export interface CacheConfig extends CacheHitCallback {
  enabled: boolean;
  strategy: CacheStrategy;
  ttl: number; // Time to live in seconds
  maxEntries?: number;
  maxSize?: number; // Max size in bytes
  estimatedSavings?: CostEstimator;
}

/**
 * Cache query options
 */
export interface CacheQueryOptions {
  similarity?: number; // Minimum similarity threshold (0-1)
  includeMetadata?: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  totalSavings: CostSavings;
  avgLatency: number;
  entriesCount: number;
  totalSize: number;
}

/**
 * Semantic matcher
 */
export interface SemanticMatcher {
  /**
   * Embed text into vector space
   */
  embed(text: string): Promise<number[]>;

  /**
   * Calculate similarity between two vectors
   */
  similarity(vec1: number[], vec2: number[]): number;
}

/**
 * Cache storage interface
 */
export interface ICacheStorage {
  /**
   * Get entry by key
   */
  get<T = any>(key: string): Promise<CacheEntry<T> | null>;

  /**
   * Set entry
   */
  set<T = any>(key: string, entry: CacheEntry<T>): Promise<void>;

  /**
   * Check if key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete entry
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all entries
   */
  clear(): Promise<void>;

  /**
   * Get all keys
   */
  keys(): Promise<string[]>;

  /**
   * Get cache statistics
   */
  stats(): Promise<CacheStatistics>;
}
