/**
 * Vue composable for integrating the Weave cache manager with UI feedback.
 */

import { ref, onBeforeUnmount, type Ref } from 'vue';
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
  lastFeedback: Ref<CacheFeedbackEvent | null>;
  feedbackHistory: Ref<CacheFeedbackEvent[]>;
  stats: Ref<CacheControllerState['stats']>;
  refreshStats: () => Promise<void>;
  clearCache: () => Promise<void>;
}

function mapOptions(options: UseCacheOptions): CacheControllerOptions {
  return {
    cacheConfig: options.cacheConfig,
    cacheManager: options.cacheManager,
    onFeedback: options.onFeedback,
    showNotification: options.showNotification,
  };
}

export function useCache(options: UseCacheOptions): UseCacheReturn {
  const controller = new CacheController(mapOptions(options));
  const state = controller.getState();

  const lastFeedback = ref<CacheFeedbackEvent | null>(state.lastFeedback);
  const feedbackHistory = ref<CacheFeedbackEvent[]>([...state.feedbackHistory]);
  const stats = ref(state.stats);

  const unsubscribe = controller.subscribe((next: CacheControllerState) => {
    lastFeedback.value = next.lastFeedback;
    feedbackHistory.value = [...next.feedbackHistory];
    stats.value = next.stats;
  });

  onBeforeUnmount(() => {
    unsubscribe();
  });

  return {
    queryCache: (prompt) => controller.queryCache(prompt),
    storeInCache: (prompt, data, metadata) => controller.storeInCache(prompt, data, metadata),
    lastFeedback,
    feedbackHistory,
    stats,
    refreshStats: () => controller.refreshStats(),
    clearCache: () => controller.clearCache(),
  };
}
