/**
 * Smart Caching Module
 * Semantic-aware caching with UI feedback and cost tracking
 */

export type {
  CacheStrategy,
  CacheEntry,
  CacheEntryMetadata,
  CacheHitResult,
  CacheMissResult,
  CacheQueryResult,
  CostSavings,
  CacheConfig,
  CacheQueryOptions,
  CacheStatistics,
  SemanticMatcher,
  ICacheStorage,
  CacheHitCallback,
  CostEstimator,
} from './types.js';

export { CacheManager } from './cache-manager.js';
export { CacheStorage, SimpleCache } from './cache-storage.js';
