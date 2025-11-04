/**
 * Framework-agnostic cache controller with feedback events.
 */

import { logInfo, logError } from '../logger/index.js';
import { CacheManager } from '@weaveai/core';
import type { CacheStatistics, CacheConfig } from '@weaveai/core';

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

export interface CacheControllerOptions {
  cacheConfig: CacheConfig;
  cacheManager?: CacheManager;
  onFeedback?: (event: CacheFeedbackEvent) => void;
  showNotification?: boolean;
}

export interface CacheControllerState {
  lastFeedback: CacheFeedbackEvent | null;
  feedbackHistory: CacheFeedbackEvent[];
  stats: CacheStatistics | null;
}

type CacheListener = (state: CacheControllerState) => void;

export class CacheController {
  private cacheManager: CacheManager;
  private readonly options: CacheControllerOptions;
  private readonly listeners = new Set<CacheListener>();
  private state: CacheControllerState = {
    lastFeedback: null,
    feedbackHistory: [],
    stats: null,
  };

  constructor(options: CacheControllerOptions) {
    this.options = options;
    this.cacheManager = options.cacheManager ?? new CacheManager(options.cacheConfig);
  }

  subscribe(listener: CacheListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): CacheControllerState {
    return this.state;
  }

  async queryCache<T = unknown>(prompt: string): Promise<T | null> {
    try {
      const result = await this.cacheManager.query<T>(prompt);

      if (result.hit) {
        this.emitFeedback({
          type: 'hit',
          message: `Cache hit! Saved $${result.savings?.cost?.toFixed(4) ?? '0.0000'} and ${
            result.savings?.latency?.toFixed(0) ?? '0'
          }ms`,
          savings: result.savings ?? undefined,
          timestamp: new Date(),
        });
        return result.data;
      }

      this.emitFeedback({
        type: 'miss',
        message: 'Cache miss - generating fresh response',
        timestamp: new Date(),
      });

      return null;
    } catch (error) {
      logError('Cache query failed:', error);
      this.emitFeedback({
        type: 'miss',
        message: 'Cache query error',
        timestamp: new Date(),
      });
      return null;
    }
  }

  async storeInCache<T = unknown>(
    prompt: string,
    data: T,
    metadata: { cost: number; latency: number; tokenCount: { input: number; output: number } }
  ): Promise<void> {
    try {
      await this.cacheManager.store(prompt, data, metadata);
      this.emitFeedback({
        type: 'stored',
        message: 'Response cached for future use',
        timestamp: new Date(),
      });
      await this.refreshStats();
    } catch (error) {
      logError('Cache store failed:', error);
    }
  }

  async refreshStats(): Promise<void> {
    try {
      const stats = await this.cacheManager.getStats();
      this.updateState({ stats });
    } catch (error) {
      logError('Failed to fetch cache stats:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.updateState({
        lastFeedback: null,
        feedbackHistory: [],
        stats: null,
      });
      this.emitFeedback({
        type: 'miss',
        message: 'Cache cleared',
        timestamp: new Date(),
      });
    } catch (error) {
      logError('Failed to clear cache:', error);
    }
  }

  private emitFeedback(event: CacheFeedbackEvent): void {
    this.updateState({
      lastFeedback: event,
      feedbackHistory: [...this.state.feedbackHistory, event].slice(-50),
    });

    this.options.onFeedback?.(event);

    if (this.options.showNotification) {
      logInfo(`[Cache ${event.type}] ${event.message}`);
    }
  }

  private updateState(patch: Partial<CacheControllerState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
