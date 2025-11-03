/**
 * Framework-agnostic provider routing controller for UI integrations.
 */

import type {
  UIAwareProviderRouter,
  ProviderRoutingEvent,
  ProviderStatus,
} from '@weaveai/core';

export interface ProviderRoutingControllerOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxEvents?: number;
  onProviderChange?: (from: string, to: string, reason?: string) => void;
  onRoutingEvent?: (event: ProviderRoutingEvent) => void;
  onStatusChange?: (status: ProviderStatus[]) => void;
}

export interface ProviderRoutingControllerState {
  currentProvider: string | null;
  providers: ProviderStatus[];
  lastEvent: ProviderRoutingEvent | null;
  events: ProviderRoutingEvent[];
  isLoading: boolean;
  error: Error | null;
}

type ProviderRoutingListener = (state: ProviderRoutingControllerState) => void;

export class ProviderRoutingController {
  private readonly router: UIAwareProviderRouter;
  private readonly options: ProviderRoutingControllerOptions;
  private readonly listeners = new Set<ProviderRoutingListener>();
  private state: ProviderRoutingControllerState;
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(router: UIAwareProviderRouter, options: ProviderRoutingControllerOptions = {}) {
    this.router = router;
    this.options = options;

    this.state = {
      currentProvider: router.getCurrentProvider(),
      providers: router.getStatus(),
      lastEvent: null,
      events: [],
      isLoading: false,
      error: null,
    };

    this.attachRouterCallbacks();

    if (options.autoRefresh) {
      this.startAutoRefresh(options.refreshInterval ?? 5000);
    }
  }

  subscribe(listener: ProviderRoutingListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): ProviderRoutingControllerState {
    return this.state;
  }

  async refreshStatus(): Promise<void> {
    try {
      this.updateState({ isLoading: true });
      const status = this.router.getStatus();
      this.updateState({
        providers: status,
        error: null,
      });
      this.options.onStatusChange?.(status);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.updateState({ error });
    } finally {
      this.updateState({ isLoading: false });
    }
  }

  selectProvider(providerName: string): void {
    const provider = this.state.providers.find((p) => p.name === providerName);
    if (!provider) {
      this.updateState({
        error: new Error(`Provider ${providerName} not found`),
      });
      return;
    }

    if (!provider.healthy) {
      this.updateState({
        error: new Error(`Provider ${providerName} is not healthy`),
      });
      return;
    }

    const from = this.state.currentProvider;
    this.updateState({ currentProvider: providerName, error: null });

    if (from) {
      const event: ProviderRoutingEvent = {
        type: 'switch',
        from,
        to: providerName,
        timestamp: new Date(),
        metadata: { reason: 'manual' },
      };
      this.recordEvent(event);
      this.options.onProviderChange?.(from, providerName, 'manual');
    }
  }

  clearEvents(): void {
    this.updateState({
      events: [],
      lastEvent: null,
    });
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  private startAutoRefresh(interval: number): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.refreshTimer = setInterval(() => {
      void this.refreshStatus();
    }, interval);
  }

  private attachRouterCallbacks(): void {
    const routerAny = this.router as any;
    const existingUi = (routerAny.ui ?? {}) as {
      onProviderChange?: (from: string, to: string, reason?: string) => unknown;
      onRoutingEvent?: (event: ProviderRoutingEvent) => unknown;
      onStatusChange?: (status: ProviderStatus[]) => unknown;
    };

    const wrapProviderChange = existingUi.onProviderChange?.bind(this.router);
    const wrapRoutingEvent = existingUi.onRoutingEvent?.bind(this.router);
    const wrapStatusChange = existingUi.onStatusChange?.bind(this.router);

    const controller = this;

    const patchedUi = {
      ...existingUi,
      onProviderChange: async function (from: string, to: string, reason?: string) {
        controller.handleProviderChange(from, to, reason);
        if (wrapProviderChange) {
          await wrapProviderChange(from, to, reason);
        }
      },
      onRoutingEvent: async function (event: ProviderRoutingEvent) {
        controller.handleRoutingEvent(event);
        if (wrapRoutingEvent) {
          await wrapRoutingEvent(event);
        }
      },
      onStatusChange: async function (status: ProviderStatus[]) {
        controller.handleStatusChange(status);
        if (wrapStatusChange) {
          await wrapStatusChange(status);
        }
      },
    };

    routerAny.ui = patchedUi;
  }

  private handleProviderChange(from: string, to: string, reason?: string): void {
    this.updateState({ currentProvider: to });
    this.options.onProviderChange?.(from, to, reason);
  }

  private handleRoutingEvent(event: ProviderRoutingEvent): void {
    this.recordEvent(event);
    if (event.type === 'switch' || event.type === 'fallback') {
      this.updateState({ currentProvider: event.to });
    }
    this.options.onRoutingEvent?.(event);
  }

  private handleStatusChange(status: ProviderStatus[]): void {
    this.updateState({ providers: status });
    this.options.onStatusChange?.(status);
  }

  private recordEvent(event: ProviderRoutingEvent): void {
    const maxEvents = this.options.maxEvents ?? 50;
    const trimmedEvents = [...this.state.events, event].slice(-maxEvents);
    this.updateState({
      events: trimmedEvents,
      lastEvent: event,
    });
  }

  private updateState(patch: Partial<ProviderRoutingControllerState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
