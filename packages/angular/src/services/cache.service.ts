/**
 * Angular service wrapper around the Weave cache controller.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  CacheController,
  type CacheControllerOptions,
  type CacheControllerState,
  type CacheFeedbackEvent,
} from '@weaveai/shared';

export interface CacheState {
  lastFeedback: CacheFeedbackEvent | null;
  feedbackHistory: CacheFeedbackEvent[];
  stats: CacheControllerState['stats'];
}

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private controller: CacheController;
  private controllerUnsubscribe: (() => void) | null = null;
  private readonly stateSubject = new BehaviorSubject<CacheState>({
    lastFeedback: null,
    feedbackHistory: [],
    stats: null,
  });
  readonly state$: Observable<CacheState> = this.stateSubject.asObservable();

  constructor() {
    // A cache config must be provided via configure before usage.
    this.controller = new CacheController({
      cacheConfig: {
        enabled: false,
        strategy: 'exact',
        ttl: 3600,
      },
    });
    this.attachController(this.controller);
  }

  configure(options: CacheControllerOptions): void {
    this.controller = new CacheController(options);
    this.attachController(this.controller);
  }

  getState(): CacheState {
    return this.stateSubject.value;
  }

  queryCache<T = unknown>(prompt: string): Promise<T | null> {
    return this.controller.queryCache(prompt);
  }

  storeInCache<T = unknown>(
    prompt: string,
    data: T,
    metadata: { cost: number; latency: number; tokenCount: { input: number; output: number } }
  ): Promise<void> {
    return this.controller.storeInCache(prompt, data, metadata);
  }

  refreshStats(): Promise<void> {
    return this.controller.refreshStats();
  }

  clearCache(): Promise<void> {
    return this.controller.clearCache();
  }

  private attachController(controller: CacheController): void {
    if (this.controllerUnsubscribe) {
      this.controllerUnsubscribe();
    }

    const initial = controller.getState();
    this.stateSubject.next({
      lastFeedback: initial.lastFeedback,
      feedbackHistory: [...initial.feedbackHistory],
      stats: initial.stats,
    });

    this.controllerUnsubscribe = controller.subscribe((state: CacheControllerState) => {
      this.stateSubject.next({
        lastFeedback: state.lastFeedback,
        feedbackHistory: [...state.feedbackHistory],
        stats: state.stats,
      });
    });
  }
}
