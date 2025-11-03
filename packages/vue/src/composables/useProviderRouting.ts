/**
 * Vue composable for reactive provider routing state.
 */

import { ref, onBeforeUnmount, type Ref } from 'vue';
import type {
  UIAwareProviderRouter,
  ProviderStatus,
  ProviderRoutingEvent,
} from '@weaveai/core';
import {
  ProviderRoutingController,
  type ProviderRoutingControllerOptions,
  type ProviderRoutingControllerState,
} from '@weaveai/shared';

export interface UseProviderRoutingOptions
  extends Omit<ProviderRoutingControllerOptions, 'onProviderChange' | 'onRoutingEvent' | 'onStatusChange'> {
  router: UIAwareProviderRouter;
  onProviderChange?: (from: string, to: string, reason?: string) => void;
  onRoutingEvent?: (event: ProviderRoutingEvent) => void;
  onStatusChange?: (status: ProviderStatus[]) => void;
}

export interface UseProviderRoutingReturn {
  currentProvider: Ref<string | null>;
  providers: Ref<ProviderStatus[]>;
  lastEvent: Ref<ProviderRoutingEvent | null>;
  events: Ref<ProviderRoutingEvent[]>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  selectProvider: (provider: string) => void;
  refreshStatus: () => Promise<void>;
  clearEvents: () => void;
  dispose: () => void;
}

export function useProviderRouting(
  options: UseProviderRoutingOptions
): UseProviderRoutingReturn {
  const controller = new ProviderRoutingController(options.router, {
    autoRefresh: options.autoRefresh,
    refreshInterval: options.refreshInterval,
    maxEvents: options.maxEvents,
    onProviderChange: options.onProviderChange,
    onRoutingEvent: options.onRoutingEvent,
    onStatusChange: options.onStatusChange,
  });

  const state = controller.getState();
  const currentProvider = ref<string | null>(state.currentProvider);
  const providers = ref<ProviderStatus[]>([...state.providers]);
  const lastEvent = ref<ProviderRoutingEvent | null>(state.lastEvent);
  const events = ref<ProviderRoutingEvent[]>([...state.events]);
  const isLoading = ref(state.isLoading);
  const error = ref<Error | null>(state.error);

  const unsubscribe = controller.subscribe((next: ProviderRoutingControllerState) => {
    currentProvider.value = next.currentProvider;
    providers.value = [...next.providers];
    lastEvent.value = next.lastEvent;
    events.value = [...next.events];
    isLoading.value = next.isLoading;
    error.value = next.error;
  });

  onBeforeUnmount(() => {
    unsubscribe();
    controller.dispose();
  });

  return {
    currentProvider,
    providers,
    lastEvent,
    events,
    isLoading,
    error,
    selectProvider: (provider: string) => controller.selectProvider(provider),
    refreshStatus: () => controller.refreshStatus(),
    clearEvents: () => controller.clearEvents(),
    dispose: () => controller.dispose(),
  };
}
