/**
 * React Native hook for cache integration.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  CacheController,
  type CacheControllerOptions,
  type CacheControllerState,
  type CacheFeedbackEvent,
} from '@weaveai/shared';
import type { CacheConfig, CacheManager } from '@weaveai/core';

export interface UseCacheOptions {
  cacheConfig: CacheConfig;
  cacheManager?: CacheManager;
  onFeedback?: (event: CacheFeedbackEvent) => void;
  showNotification?: boolean;
}

export interface UseCacheReturn {
  queryCache: <T = unknown>(prompt: string) => Promise<T | null>;
  storeInCache: <T = unknown>(
    prompt: string,
    data: T,
    metadata: { cost: number; latency: number; tokenCount: { input: number; output: number } }
  ) => Promise<void>;
  lastFeedback: CacheFeedbackEvent | null;
  feedbackHistory: CacheFeedbackEvent[];
  stats: CacheControllerState['stats'];
  refreshStats: () => Promise<void>;
  clearCache: () => Promise<void>;
}

export function useCache(options: UseCacheOptions): UseCacheReturn {
  const controllerOptions = useMemo<CacheControllerOptions>(() => ({ ...options }), [options]);
  const controllerRef = useRef<CacheController | null>(null);

  const [lastFeedback, setLastFeedback] = useState<CacheFeedbackEvent | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<CacheFeedbackEvent[]>([]);
  const [stats, setStats] = useState<CacheControllerState['stats']>(null);

  useEffect(() => {
    const controller = new CacheController(controllerOptions);
    controllerRef.current = controller;

    const initial = controller.getState();
    setLastFeedback(initial.lastFeedback);
    setFeedbackHistory(initial.feedbackHistory);
    setStats(initial.stats);

    const unsubscribe = controller.subscribe((state: CacheControllerState) => {
      setLastFeedback(state.lastFeedback);
      setFeedbackHistory(state.feedbackHistory);
      setStats(state.stats);
    });

    return () => {
      unsubscribe();
    };
  }, [controllerOptions]);

  const queryCache = <T = unknown>(prompt: string) => {
    return controllerRef.current?.queryCache<T>(prompt) ?? Promise.resolve(null);
  };

  const storeInCache = <T = unknown>(
    prompt: string,
    data: T,
    metadata: { cost: number; latency: number; tokenCount: { input: number; output: number } }
  ) => {
    return controllerRef.current?.storeInCache(prompt, data, metadata) ?? Promise.resolve();
  };

  const refreshStats = () => controllerRef.current?.refreshStats() ?? Promise.resolve();
  const clearCache = () => controllerRef.current?.clearCache() ?? Promise.resolve();

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
