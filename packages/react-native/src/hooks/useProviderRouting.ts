/**
 * React Native hook for provider routing status.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
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
  onProviderChange?: (from: string, to: string, reason?: string) => void;
  onRoutingEvent?: (event: ProviderRoutingEvent) => void;
  onStatusChange?: (status: ProviderStatus[]) => void;
}

export interface UseProviderRoutingReturn {
  currentProvider: string | null;
  providers: ProviderStatus[];
  lastEvent: ProviderRoutingEvent | null;
  events: ProviderRoutingEvent[];
  isLoading: boolean;
  error: Error | null;
  selectProvider: (provider: string) => void;
  refreshStatus: () => Promise<void>;
  clearEvents: () => void;
}

export function useProviderRouting(
  router: UIAwareProviderRouter,
  options: UseProviderRoutingOptions = {}
): UseProviderRoutingReturn {
  const controllerOptions = useMemo<ProviderRoutingControllerOptions>(
    () => ({
      autoRefresh: options.autoRefresh,
      refreshInterval: options.refreshInterval,
      maxEvents: options.maxEvents,
      onProviderChange: options.onProviderChange,
      onRoutingEvent: options.onRoutingEvent,
      onStatusChange: options.onStatusChange,
    }),
    [
      options.autoRefresh,
      options.refreshInterval,
      options.maxEvents,
      options.onProviderChange,
      options.onRoutingEvent,
      options.onStatusChange,
    ]
  );

  const controllerRef = useRef<ProviderRoutingController | null>(null);

  const [currentProvider, setCurrentProvider] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [lastEvent, setLastEvent] = useState<ProviderRoutingEvent | null>(null);
  const [events, setEvents] = useState<ProviderRoutingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new ProviderRoutingController(router, controllerOptions);
    controllerRef.current = controller;

    const initial = controller.getState();
    setCurrentProvider(initial.currentProvider);
    setProviders(initial.providers);
    setLastEvent(initial.lastEvent);
    setEvents(initial.events);
    setIsLoading(initial.isLoading);
    setError(initial.error);

    const unsubscribe = controller.subscribe((state: ProviderRoutingControllerState) => {
      setCurrentProvider(state.currentProvider);
      setProviders(state.providers);
      setLastEvent(state.lastEvent);
      setEvents(state.events);
      setIsLoading(state.isLoading);
      setError(state.error);
    });

    return () => {
      unsubscribe();
      controller.dispose();
    };
  }, [router, controllerOptions]);

  const selectProvider = (provider: string) => {
    controllerRef.current?.selectProvider(provider);
  };

  const refreshStatus = () => controllerRef.current?.refreshStatus() ?? Promise.resolve();

  const clearEvents = () => controllerRef.current?.clearEvents();

  return {
    currentProvider,
    providers,
    lastEvent,
    events,
    isLoading,
    error,
    selectProvider,
    refreshStatus,
    clearEvents,
  };
}
