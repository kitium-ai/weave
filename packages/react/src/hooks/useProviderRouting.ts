/**
 * useProviderRouting Hook
 * React integration for UI-aware provider fallback routing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { UIAwareProviderRouter, ProviderStatus, ProviderRoutingEvent } from '@weaveai/core';

/**
 * useProviderRouting hook options
 */
export interface UseProviderRoutingOptions {
  router: UIAwareProviderRouter;
  onProviderChange?: (from: string, to: string, reason?: string) => void;
  onRoutingEvent?: (event: ProviderRoutingEvent) => void;
  onStatusChange?: (status: ProviderStatus[]) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * useProviderRouting hook return value
 */
export interface UseProviderRoutingReturn {
  // Current state
  currentProvider: string | null;
  providers: ProviderStatus[];
  lastEvent: ProviderRoutingEvent | null;
  events: ProviderRoutingEvent[];

  // Actions
  selectProvider: (provider: string) => void;
  refreshStatus: () => void;
  clearEvents: () => void;

  // Status
  isLoading: boolean;
  error: Error | null;
}

/**
 * React hook for provider routing with UI feedback
 */
export function useProviderRouting(options: UseProviderRoutingOptions): UseProviderRoutingReturn {
  const routerRef = useRef(options.router);
  const [currentProvider, setCurrentProvider] = useState<string | null>(
    options.router.getCurrentProvider()
  );
  const [providers, setProviders] = useState<ProviderStatus[]>(options.router.getStatus());
  const [lastEvent, setLastEvent] = useState<ProviderRoutingEvent | null>(null);
  const [events, setEvents] = useState<ProviderRoutingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Setup router callbacks
  useEffect(() => {
    // const _router = routerRef.current;
    // These callbacks would be set when creating the router
    // For now, we'll expose manual refresh methods
  }, []);

  // Auto-refresh status
  useEffect(() => {
    if (!options.autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      refreshStatus();
    }, options.refreshInterval ?? 5000);

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval]);

  // Refresh provider status
  const refreshStatus = useCallback(() => {
    try {
      setIsLoading(true);
      const newStatus = routerRef.current.getStatus();
      setProviders(newStatus);
      options.onStatusChange?.(newStatus);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  // Select provider manually
  const selectProvider = useCallback(
    (providerName: string) => {
      const provider = providers.find((p) => p.name === providerName);
      if (!provider) {
        setError(new Error(`Provider ${providerName} not found`));
        return;
      }

      if (!provider.healthy) {
        setError(new Error(`Provider ${providerName} is not healthy`));
        return;
      }

      const from = currentProvider;
      setCurrentProvider(providerName);

      if (from) {
        options.onProviderChange?.(from, providerName, 'manual');
        setLastEvent({
          type: 'switch',
          from,
          to: providerName,
          timestamp: new Date(),
          metadata: { reason: 'manual' },
        });
        setEvents((prev) => [
          ...prev,
          {
            type: 'switch',
            from,
            to: providerName,
            timestamp: new Date(),
            metadata: { reason: 'manual' },
          },
        ]);
      }

      setError(null);
    },
    [currentProvider, providers, options]
  );

  // Emit routing event (called from router)
  const emitRoutingEvent = useCallback(
    (event: ProviderRoutingEvent) => {
      setLastEvent(event);
      setEvents((prev) => [...prev.slice(-49), event]); // Keep last 50
      options.onRoutingEvent?.(event);

      if (event.type === 'switch' || event.type === 'fallback') {
        setCurrentProvider(event.to);
      }
    },
    [options]
  );

  // Expose event emitter for router callbacks
  useEffect(() => {
    (routerRef.current as unknown as Record<string, unknown>).__emitRoutingEvent = emitRoutingEvent;
  }, [emitRoutingEvent]);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  return {
    currentProvider,
    providers,
    lastEvent,
    events,
    selectProvider,
    refreshStatus,
    clearEvents,
    isLoading,
    error,
  };
}

/**
 * useProviderNotifications Hook
 * Show notifications for provider events
 */
export interface UseProviderNotificationsOptions {
  events: ProviderRoutingEvent[];
  showNotifications?: boolean;
  duration?: number;
  onNotification?: (message: string, type: string) => void;
}

export function useProviderNotifications(options: UseProviderNotificationsOptions): void {
  const lastEventRef = useRef<ProviderRoutingEvent | null>(null);

  useEffect(() => {
    if (!options.showNotifications || options.events.length === 0) {
      return;
    }

    const lastEvent = options.events[options.events.length - 1];

    // Only show notification for new events
    if (lastEventRef.current === lastEvent) {
      return;
    }

    lastEventRef.current = lastEvent;

    let message = '';
    let type = 'info';

    switch (lastEvent.type) {
      case 'switch':
        message = `Switched from ${lastEvent.from} to ${lastEvent.to}`;
        type = 'info';
        break;
      case 'fallback':
        message = `Falling back from ${lastEvent.from} to ${lastEvent.to}`;
        type = 'warning';
        break;
      case 'success':
        message = `Successfully using ${lastEvent.to}`;
        type = 'success';
        break;
      case 'failure':
        message = `Failed on ${lastEvent.to}: ${lastEvent.reason || 'Unknown error'}`;
        type = 'error';
        break;
      case 'attempt':
        message = `Attempting to use ${lastEvent.to}`;
        type = 'info';
        break;
    }

    options.onNotification?.(message, type);
  }, [options.events, options.showNotifications, options.onNotification]);
}
