/**
 * UI-Aware Fallback Routing
 * Integrates provider routing with UI feedback and weighted selection
 */

import { getLogger } from '@weaveai/shared';
import type { ILanguageModel } from './interfaces.js';
import type { ProviderConfig } from '../types';
import { getCircuitBreakerManager } from './circuit-breaker.js';

/**
 * Provider routing event
 */
export interface ProviderRoutingEvent {
  type: 'switch' | 'attempt' | 'success' | 'failure' | 'fallback';
  from?: string;
  to: string;
  reason?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Provider status information
 */
export interface ProviderStatus {
  name: string;
  provider: string;
  healthy: boolean;
  latency: number;
  successRate: number;
  weight: number;
  currentLoad: number;
}

/**
 * UI configuration for routing
 */
export interface RoutingUIConfig {
  showProviderSwitch?: boolean;
  showStatus?: boolean;
  notifyOnFallback?: boolean;
  notifyOnSwitch?: boolean;
  onProviderChange?: (from: string, to: string, reason?: string) => void | Promise<void>;
  onRoutingEvent?: (event: ProviderRoutingEvent) => void | Promise<void>;
  onStatusChange?: (status: ProviderStatus[]) => void | Promise<void>;
}

/**
 * Weighted provider configuration
 */
export interface WeightedProvider {
  provider: string;
  weight: number;
  priority?: number; // Lower = higher priority
}

/**
 * UI-aware router configuration
 */
export interface UIAwareRouterConfig {
  providers: WeightedProvider[];
  strategy?: 'first-success' | 'weighted' | 'least-cost' | 'lowest-latency';
  ui?: RoutingUIConfig;
  healthCheckIntervalMs?: number;
  fallbackTimeout?: number;
}

/**
 * Provider route with UI metadata
 */
export interface UIAwareProviderRoute {
  name: string;
  provider: ILanguageModel;
  config: ProviderConfig;
  weight: number;
  priority: number;
  isHealthy: boolean;
  metrics: {
    successRate: number;
    totalRequests: number;
    failedRequests: number;
    avgLatency: number;
  };
}

/**
 * UI-aware provider router
 */
export class UIAwareProviderRouter {
  private readonly routes: Map<string, UIAwareProviderRoute> = new Map();
  private readonly ui?: RoutingUIConfig;
  private currentProvider: string | null = null;
  private strategy: string;
  private logger = getLogger();
  private circuitBreakerManager = getCircuitBreakerManager();
  private statusCheckInterval?: NodeJS.Timeout;

  constructor(
    providers: Array<{ provider: ILanguageModel; config: ProviderConfig }>,
    weightedProviders: WeightedProvider[],
    config?: UIAwareRouterConfig
  ) {
    this.ui = config?.ui;
    this.strategy = config?.strategy ?? 'first-success';

    // Initialize routes with weights
    for (const weighted of weightedProviders) {
      const provider = providers.find((p) =>
        p.config.type.includes(weighted.provider)
      );
      if (provider) {
        const breaker = this.circuitBreakerManager.getBreaker(weighted.provider);
        const metrics = breaker.getMetrics();

        this.routes.set(weighted.provider, {
          name: weighted.provider,
          provider: provider.provider,
          config: provider.config,
          weight: weighted.weight,
          priority: weighted.priority ?? 999,
          isHealthy: !breaker.isOpen(),
          metrics: {
            successRate: metrics.totalRequests > 0
              ? ((metrics.totalRequests - metrics.failedRequests) / metrics.totalRequests) * 100
              : 100,
            totalRequests: metrics.totalRequests,
            failedRequests: metrics.failedRequests,
            avgLatency: this.estimateLatency(weighted.provider),
          },
        });
      }
    }

    // Start periodic status checks
    if (this.ui?.showStatus) {
      this.startStatusChecks(config?.healthCheckIntervalMs ?? 10000);
    }
  }

  /**
   * Route request with UI feedback
   */
  async routeRequest<T>(
    operationName: string,
    fn: (provider: ILanguageModel) => Promise<T>
  ): Promise<T> {
    const selectedRoute = this.selectRoute();

    if (!selectedRoute) {
      throw new Error('No available providers');
    }

    // Notify provider change
    if (this.currentProvider && this.currentProvider !== selectedRoute.name) {
      await this.emitProviderChange(this.currentProvider, selectedRoute.name);
    }

    this.currentProvider = selectedRoute.name;

    try {
      await this.emitRoutingEvent({
        type: 'attempt',
        to: selectedRoute.name,
        timestamp: new Date(),
        metadata: { operationName },
      });

      const result = await this.circuitBreakerManager.execute(
        selectedRoute.name,
        () => fn(selectedRoute.provider)
      );

      await this.emitRoutingEvent({
        type: 'success',
        to: selectedRoute.name,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await this.emitRoutingEvent({
        type: 'failure',
        to: selectedRoute.name,
        reason: errorMsg,
        timestamp: new Date(),
      });

      // Try fallback
      return this.fallback(operationName, fn, selectedRoute.name);
    }
  }

  /**
   * Select route based on strategy
   */
  private selectRoute(): UIAwareProviderRoute | null {
    const healthyRoutes = Array.from(this.routes.values()).filter((r) => r.isHealthy);

    if (healthyRoutes.length === 0) {
      return null;
    }

    switch (this.strategy) {
      case 'weighted':
        return this.selectByWeight(healthyRoutes);

      case 'least-cost':
        return healthyRoutes.reduce((prev, current) =>
          this.estimateCost(current) < this.estimateCost(prev) ? current : prev
        );

      case 'lowest-latency':
        return healthyRoutes.reduce((prev, current) =>
          current.metrics.avgLatency < prev.metrics.avgLatency ? current : prev
        );

      case 'first-success':
      default:
        return (
          healthyRoutes.sort((a, b) => a.priority - b.priority)[0] ||
          healthyRoutes[0]
        );
    }
  }

  /**
   * Select route by weight using weighted random selection
   */
  private selectByWeight(routes: UIAwareProviderRoute[]): UIAwareProviderRoute {
    const totalWeight = routes.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;

    for (const route of routes) {
      random -= route.weight;
      if (random <= 0) {
        return route;
      }
    }

    return routes[0];
  }

  /**
   * Fallback to next provider
   */
  private async fallback<T>(
    operationName: string,
    fn: (provider: ILanguageModel) => Promise<T>,
    failedProvider: string
  ): Promise<T> {
    const healthyRoutes = Array.from(this.routes.values())
      .filter((r) => r.isHealthy && r.name !== failedProvider)
      .sort((a, b) => a.priority - b.priority);

    if (healthyRoutes.length === 0) {
      throw new Error(`All providers failed. Primary failure: ${failedProvider}`);
    }

    const fallbackRoute = healthyRoutes[0];

    await this.emitRoutingEvent({
      type: 'fallback',
      from: failedProvider,
      to: fallbackRoute.name,
      timestamp: new Date(),
      metadata: { operationName },
    });

    if (this.ui?.notifyOnFallback) {
      await this.emitProviderChange(failedProvider, fallbackRoute.name, 'fallback');
    }

    try {
      const result = await this.circuitBreakerManager.execute(fallbackRoute.name, () =>
        fn(fallbackRoute.provider)
      );

      this.currentProvider = fallbackRoute.name;
      return result;
    } catch (error) {
      // Recursively try next fallback
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.emitRoutingEvent({
        type: 'failure',
        to: fallbackRoute.name,
        reason: errorMsg,
        timestamp: new Date(),
      });

      return this.fallback(operationName, fn, fallbackRoute.name);
    }
  }

  /**
   * Emit provider change event
   */
  private async emitProviderChange(
    from: string,
    to: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.ui?.onProviderChange?.(from, to, reason);
    } catch (error) {
      this.logger.warn('Provider change callback failed', { error });
    }
  }

  /**
   * Emit routing event
   */
  private async emitRoutingEvent(event: ProviderRoutingEvent): Promise<void> {
    try {
      await this.ui?.onRoutingEvent?.(event);
    } catch (error) {
      this.logger.warn('Routing event callback failed', { error });
    }
  }

  /**
   * Emit status change
   */
  private async emitStatusChange(status: ProviderStatus[]): Promise<void> {
    try {
      await this.ui?.onStatusChange?.(status);
    } catch (error) {
      this.logger.warn('Status change callback failed', { error });
    }
  }

  /**
   * Get current status of all providers
   */
  getStatus(): ProviderStatus[] {
    return Array.from(this.routes.values()).map((route) => ({
      name: route.name,
      provider: route.config.type,
      healthy: route.isHealthy,
      latency: route.metrics.avgLatency,
      successRate: route.metrics.successRate,
      weight: route.weight,
      currentLoad: 0, // Would be populated from load metrics
    }));
  }

  /**
   * Get current provider
   */
  getCurrentProvider(): string | null {
    return this.currentProvider;
  }

  /**
   * Start periodic status checks
   */
  private startStatusChecks(interval: number): void {
    this.statusCheckInterval = setInterval(async () => {
      const status = this.getStatus();
      await this.emitStatusChange(status);

      // Update health status
      for (const route of this.routes.values()) {
        const breaker = this.circuitBreakerManager.getBreaker(route.name);
        route.isHealthy = !breaker.isOpen();
      }
    }, interval);
  }

  /**
   * Stop status checks
   */
  stop(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
    }
  }

  /**
   * Estimate cost for a provider
   */
  private estimateCost(route: UIAwareProviderRoute): number {
    const costMap: Record<string, number> = {
      openai: 100,
      anthropic: 80,
      google: 60,
      local: 0,
      mock: 0,
    };

    return costMap[route.config.type] ?? 100;
  }

  /**
   * Estimate latency for a provider
   */
  private estimateLatency(providerName: string): number {
    const breaker = this.circuitBreakerManager.getBreaker(providerName);
    const metrics = breaker.getMetrics();

    if (metrics.totalRequests === 0) {
      return 100;
    }

    const failureRate = metrics.failedRequests / metrics.totalRequests;
    return 100 + failureRate * 500;
  }
}
