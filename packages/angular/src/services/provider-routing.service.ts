/**
 * Angular service to expose provider routing state reactively.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type {
  UIAwareProviderRouter,
  ProviderRoutingEvent,
  ProviderStatus,
} from '@weaveai/core';
import {
  ProviderRoutingController,
  type ProviderRoutingControllerOptions,
  type ProviderRoutingControllerState,
} from '@weaveai/shared';

export interface ProviderRoutingState {
  currentProvider: string | null;
  providers: ProviderStatus[];
  lastEvent: ProviderRoutingEvent | null;
  events: ProviderRoutingEvent[];
  isLoading: boolean;
  error: Error | null;
}

const DEFAULT_STATE: ProviderRoutingState = {
  currentProvider: null,
  providers: [],
  lastEvent: null,
  events: [],
  isLoading: false,
  error: null,
};

@Injectable({
  providedIn: 'root',
})
export class ProviderRoutingService {
  private controller: ProviderRoutingController | null = null;
  private controllerUnsubscribe: (() => void) | null = null;
  private readonly stateSubject = new BehaviorSubject<ProviderRoutingState>(DEFAULT_STATE);
  readonly state$: Observable<ProviderRoutingState> = this.stateSubject.asObservable();

  /**
   * Initialise the routing controller with the current router instance.
   */
  initialise(
    router: UIAwareProviderRouter,
    options: ProviderRoutingControllerOptions = {}
  ): void {
    this.attachController(router, options);
  }

  /**
   * Get current provider routing state snapshot.
   */
  getState(): ProviderRoutingState {
    return this.stateSubject.value;
  }

  selectProvider(provider: string): void {
    this.controller?.selectProvider(provider);
  }

  refreshStatus(): Promise<void> {
    return this.controller?.refreshStatus() ?? Promise.resolve();
  }

  clearEvents(): void {
    this.controller?.clearEvents();
  }

  dispose(): void {
    if (this.controller) {
      this.controller.dispose();
    }
    if (this.controllerUnsubscribe) {
      this.controllerUnsubscribe();
      this.controllerUnsubscribe = null;
    }
    this.controller = null;
    this.stateSubject.next(DEFAULT_STATE);
  }

  private attachController(
    router: UIAwareProviderRouter,
    options: ProviderRoutingControllerOptions
  ): void {
    if (this.controllerUnsubscribe) {
      this.controllerUnsubscribe();
      this.controllerUnsubscribe = null;
    }

    this.controller = new ProviderRoutingController(router, {
      ...options,
      autoRefresh: options.autoRefresh,
    });

    const initial = this.controller.getState();
    this.stateSubject.next({
      currentProvider: initial.currentProvider,
      providers: [...initial.providers],
      lastEvent: initial.lastEvent,
      events: [...initial.events],
      isLoading: initial.isLoading,
      error: initial.error,
    });

    this.controllerUnsubscribe = this.controller.subscribe(
      (state: ProviderRoutingControllerState) => {
        this.stateSubject.next({
          currentProvider: state.currentProvider,
          providers: [...state.providers],
          lastEvent: state.lastEvent,
          events: [...state.events],
          isLoading: state.isLoading,
          error: state.error,
        });
      }
    );
  }
}
