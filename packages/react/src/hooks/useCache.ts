/**
 * useCache Hook
 * React integration for smart caching with UI feedback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CacheManager, CacheStatistics } from '@weaveai/core';
import type { CacheConfig } from '@weaveai/core';

// Re-export cache types for easier imports
export type { CacheConfig };

/**
 * Cache feedback event
 */
export interface CacheFeedbackEvent {
  type: 'hit' | 'miss' | 'stored';
  message: string;
  savings?: {
    cost: number;
    latency: number;
    tokens: number;
  };
  timestamp: Date;
}

/**
 * useCache hook options
 */
export interface UseCacheOptions {
  cacheConfig: CacheConfig;
  cacheManager?: CacheManager;
  onFeedback?: (event: CacheFeedbackEvent) => void;
  showNotification?: boolean;
  notificationDuration?: number;
}

/**
 * useCache hook return value
 */
export interface UseCacheReturn {
  // Query cache
  queryCache: <T = unknown>(prompt: string) => Promise<T | null>;

  // Store in cache
  storeInCache: <T = unknown>(
    prompt: string,
    data: T,
    metadata: { cost: number; latency: number; tokenCount: { input: number; output: number } }
  ) => Promise<void>;

  // Cache feedback
  lastFeedback: CacheFeedbackEvent | null;
  feedbackHistory: CacheFeedbackEvent[];

  // Cache stats
  stats: CacheStatistics | null;
  refreshStats: () => Promise<void>;

  // Cache management
  clearCache: () => Promise<void>;
}

/**
 * React hook for cache integration with UI feedback
 */
export function useCache(options: UseCacheOptions): UseCacheReturn {
  const cacheManager = useRef(options.cacheManager);
  const [lastFeedback, setLastFeedback] = useState<CacheFeedbackEvent | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<CacheFeedbackEvent[]>([]);
  const [stats, setStats] = useState<CacheStatistics | null>(null);

  // Initialize cache manager if not provided
  useEffect(() => {
    if (!cacheManager.current && options.cacheConfig) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { CacheManager: CM } = require('@weaveai/core');
      cacheManager.current = new CM(options.cacheConfig);
    }
  }, [options.cacheConfig]);

  // Emit feedback event
  const emitFeedback = useCallback(
    (event: CacheFeedbackEvent) => {
      setLastFeedback(event);
      setFeedbackHistory((prev) => [...prev, event]);

      options.onFeedback?.(event);

      if (options.showNotification) {
        // Could trigger toast/notification here
        console.log(`[Cache ${event.type}]`, event.message);
      }
    },
    [options]
  );

  // Query cache
  const queryCache = useCallback(
    async <T = unknown>(prompt: string): Promise<T | null> => {
      if (!cacheManager.current) {
        emitFeedback({
          type: 'miss',
          message: 'Cache not initialized',
          timestamp: new Date(),
        });
        return null;
      }

      try {
        const result = await cacheManager.current.query<T>(prompt);

        if (result.hit) {
          emitFeedback({
            type: 'hit',
            message: `Cache hit! Saved $${result.savings.cost.toFixed(4)} and ${result.savings.latency.toFixed(0)}ms`,
            savings: result.savings,
            timestamp: new Date(),
          });
          return result.data;
        } else {
          emitFeedback({
            type: 'miss',
            message: 'Cache miss - generating fresh response',
            timestamp: new Date(),
          });
          return null;
        }
      } catch (error) {
        console.error('Cache query failed:', error);
        emitFeedback({
          type: 'miss',
          message: 'Cache query error',
          timestamp: new Date(),
        });
        return null;
      }
    },
    [emitFeedback]
  );

  // Store in cache
  const storeInCache = useCallback(
    async <T = unknown>(
      prompt: string,
      data: T,
      metadata: { cost: number; latency: number; tokenCount: { input: number; output: number } }
    ): Promise<void> => {
      if (!cacheManager.current) {
        return;
      }

      try {
        await cacheManager.current.store(prompt, data, metadata);

        emitFeedback({
          type: 'stored',
          message: 'Response cached for future use',
          timestamp: new Date(),
        });

        // Refresh stats
        await refreshStats();
      } catch (error) {
        console.error('Cache store failed:', error);
      }
    },
    [emitFeedback]
  );

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!cacheManager.current) {
      return;
    }

    try {
      const newStats = await cacheManager.current.getStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!cacheManager.current) {
      return;
    }

    try {
      await cacheManager.current.clear();
      setLastFeedback(null);
      setFeedbackHistory([]);
      setStats(null);

      emitFeedback({
        type: 'miss',
        message: 'Cache cleared',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [emitFeedback]);

  return {
    queryCache,
    storeInCache,
    lastFeedback,
    feedbackHistory,
    stats,
    refreshStats,
    clearCache,
  };
}
