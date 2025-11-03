/**
 * Svelte store for provider routing state.
 */

import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
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

export interface ProviderRoutingStoreState {
  currentProvider: string | null;
  providers: ProviderStatus[];
  lastEvent: ProviderRoutingEvent | null;
  events: ProviderRoutingEvent[];
  isLoading: boolean;
  error: Error | null;
}

export interface ProviderRoutingStore {
  state: Readable<ProviderRoutingStoreState>;
  selectProvider: (provider: string) => void;
  refreshStatus: () => Promise<void>;
  clearEvents: () => void;
  configure: (router: UIAwareProviderRouter, options?: ProviderRoutingControllerOptions) => void;
  dispose: () => void;
}

export function createProviderRoutingStore(
  router: UIAwareProviderRouter,
  options?: ProviderRoutingControllerOptions
): ProviderRoutingStore {
  let controller = new ProviderRoutingController(router, options);
  const initial = controller.getState();
  const { subscribe, set } = writable<ProviderRoutingStoreState>({
    currentProvider: initial.currentProvider,
    providers: [...initial.providers],
    lastEvent: initial.lastEvent,
    events: [...initial.events],
    isLoading: initial.isLoading,
    error: initial.error,
  });

  let unsubscribe = controller.subscribe((state: ProviderRoutingControllerState) => {
    set({
      currentProvider: state.currentProvider,
      providers: [...state.providers],
      lastEvent: state.lastEvent,
      events: [...state.events],
      isLoading: state.isLoading,
      error: state.error,
    });
  });

  const configure = (
    nextRouter: UIAwareProviderRouter,
    nextOptions?: ProviderRoutingControllerOptions
  ) => {
    unsubscribe();
    controller.dispose();
    controller = new ProviderRoutingController(nextRouter, nextOptions);
    const snapshot = controller.getState();
    set({
      currentProvider: snapshot.currentProvider,
      providers: [...snapshot.providers],
      lastEvent: snapshot.lastEvent,
      events: [...snapshot.events],
      isLoading: snapshot.isLoading,
      error: snapshot.error,
    });
    unsubscribe = controller.subscribe((state: ProviderRoutingControllerState) => {
      set({
        currentProvider: state.currentProvider,
        providers: [...state.providers],
        lastEvent: state.lastEvent,
        events: [...state.events],
        isLoading: state.isLoading,
        error: state.error,
      });
    });
  };

  const dispose = () => {
    unsubscribe();
    controller.dispose();
  };

  return {
    state: { subscribe },
    selectProvider: (provider: string) => controller.selectProvider(provider),
    refreshStatus: () => controller.refreshStatus(),
    clearEvents: () => controller.clearEvents(),
    configure,
    dispose,
  };
}
