/**
 * Svelte store for cache metrics and feedback.
 */

import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import {
  CacheController,
  type CacheControllerOptions,
  type CacheControllerState,
  type CacheFeedbackEvent,
} from '@weaveai/shared';

export interface CacheStoreState {
  lastFeedback: CacheFeedbackEvent | null;
  feedbackHistory: CacheFeedbackEvent[];
  stats: CacheControllerState['stats'];
}

export interface CacheStore {
  state: Readable<CacheStoreState>;
  queryCache: <T = unknown>(prompt: string) => Promise<T | null>;
  storeInCache: <T = unknown>(
    prompt: string,
    data: T,
    metadata: { cost: number; latency: number; tokenCount: { input: number; output: number } }
  ) => Promise<void>;
  refreshStats: () => Promise<void>;
  clearCache: () => Promise<void>;
  configure: (options: CacheControllerOptions) => void;
}

export function createCacheStore(options: CacheControllerOptions): CacheStore {
  let controller = new CacheController(options);
  const initial = controller.getState();
  const { subscribe, set } = writable<CacheStoreState>({
    lastFeedback: initial.lastFeedback,
    feedbackHistory: [...initial.feedbackHistory],
    stats: initial.stats,
  });

  let unsubscribe = controller.subscribe((state: CacheControllerState) => {
    set({
      lastFeedback: state.lastFeedback,
      feedbackHistory: [...state.feedbackHistory],
      stats: state.stats,
    });
  });

  const configure = (nextOptions: CacheControllerOptions) => {
    unsubscribe();
    controller = new CacheController(nextOptions);
    const snapshot = controller.getState();
    set({
      lastFeedback: snapshot.lastFeedback,
      feedbackHistory: [...snapshot.feedbackHistory],
      stats: snapshot.stats,
    });
    unsubscribe = controller.subscribe((state: CacheControllerState) => {
      set({
        lastFeedback: state.lastFeedback,
        feedbackHistory: [...state.feedbackHistory],
        stats: state.stats,
      });
    });
  };

  return {
    state: { subscribe },
    queryCache: (prompt) => controller.queryCache(prompt),
    storeInCache: (prompt, data, metadata) => controller.storeInCache(prompt, data, metadata),
    refreshStats: () => controller.refreshStats(),
    clearCache: () => controller.clearCache(),
    configure,
  };
}
