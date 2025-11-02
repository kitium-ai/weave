/**
 * Provider Router
 * Routes requests across multiple providers with fallback support
 */

import { getLogger } from '@weaveai/shared';
import type { ILanguageModel } from './interfaces.js';
import type { ProviderConfig } from '../types';
import { getCircuitBreakerManager } from './circuit-breaker.js';

/**
 * Fallback strategy types
 */
export type FallbackStrategy = 'first-success' | 'least-cost' | 'lowest-latency';

/**
 * Provider route configuration
 */
export interface ProviderRoute {
  name: string;
  provider: ILanguageModel;
  config: ProviderConfig;
  weight?: number; // For load balancing
  isHealthy?: boolean;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  primaryRoute: ProviderRoute;
  fallbackRoutes?: ProviderRoute[];
  strategy?: FallbackStrategy;
  healthCheckIntervalMs?: number;
}

/**
 * Provider Router
 */
export class ProviderRouter {
  private readonly routes: ProviderRoute[];
  private strategy: FallbackStrategy;
  private healthCheckIntervalMs: number;
  private logger = getLogger();
  private circuitBreakerManager = getCircuitBreakerManager();

  constructor(config: RouterConfig) {
    this.routes = [config.primaryRoute, ...(config.fallbackRoutes ?? [])];
    this.strategy = config.strategy ?? 'first-success';
    this.healthCheckIntervalMs = config.healthCheckIntervalMs ?? 60000;
    this.logger.debug('Provider router initialized', {
      strategy: this.strategy,
      routeCount: this.routes.length,
      healthCheckIntervalMs: this.healthCheckIntervalMs,
    });
  }

  /**
   * Route request to appropriate provider
   */
  async routeRequest<T>(
    operationName: string,
    fn: (provider: ILanguageModel) => Promise<T>
  ): Promise<T> {
    const availableRoutes = await this.getAvailableRoutes();

    if (availableRoutes.length === 0) {
      throw new Error('No available providers. All circuit breakers are open.');
    }

    const sortedRoutes = this.sortRoutes(availableRoutes);

    let lastError: Error | undefined;

    for (const route of sortedRoutes) {
      try {
        this.logger.debug(`Attempting request via ${route.name}`, { operationName });

        const result = await this.circuitBreakerManager.execute(route.name, () =>
          fn(route.provider)
        );

        this.logger.debug(`Successfully routed via ${route.name}`);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Request failed on ${route.name}, trying next provider`, {
          operationName,
          error: lastError.message,
        });
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Get available routes (circuit breaker not open)
   */
  private async getAvailableRoutes(): Promise<ProviderRoute[]> {
    const available: ProviderRoute[] = [];

    for (const route of this.routes) {
      const breaker = this.circuitBreakerManager.getBreaker(route.name);

      if (!breaker.isOpen()) {
        available.push(route);
      } else {
        this.logger.debug(`Provider ${route.name} circuit breaker is open`);
      }
    }

    return available;
  }

  /**
   * Sort routes based on strategy
   */
  private sortRoutes(routes: ProviderRoute[]): ProviderRoute[] {
    switch (this.strategy) {
      case 'first-success':
        return routes; // Use in order

      case 'least-cost':
        // Routes with lower cost models first
        return routes.sort((a, b) => {
          const costA = this.estimateCost(a.config);
          const costB = this.estimateCost(b.config);
          return costA - costB;
        });

      case 'lowest-latency':
        // Routes with lower latency first (based on health metrics)
        return routes.sort((a, b) => {
          const latencyA = this.estimateLatency(a);
          const latencyB = this.estimateLatency(b);
          return latencyA - latencyB;
        });

      default:
        return routes;
    }
  }

  /**
   * Estimate cost for a provider
   */
  private estimateCost(config: ProviderConfig): number {
    // Cost estimation based on provider type
    const costMap: Record<string, number> = {
      openai: 100,
      anthropic: 80,
      google: 60,
      local: 0,
      mock: 0,
    };

    return costMap[config.type] ?? 100;
  }

  /**
   * Estimate latency for a provider
   */
  private estimateLatency(route: ProviderRoute): number {
    const breaker = this.circuitBreakerManager.getBreaker(route.name);
    const metrics = breaker.getMetrics();

    // If no requests yet, assume default latency
    if (metrics.totalRequests === 0) {
      return 100;
    }

    // Latency based on success rate and failures
    const failureRate = metrics.failedRequests / metrics.totalRequests;
    return 100 + failureRate * 500; // Max 600ms for failing provider
  }

  /**
   * Get provider health status
   */
  getProviderHealth(): Record<string, object> {
    const health: Record<string, object> = {};

    for (const route of this.routes) {
      const breaker = this.circuitBreakerManager.getBreaker(route.name);
      const metrics = breaker.getMetrics();

      health[route.name] = {
        state: metrics.state,
        healthy: !breaker.isOpen(),
        successRate: breaker.getSuccessRate(),
        metrics,
      };
    }

    return health;
  }

  /**
   * Reset provider
   */
  resetProvider(providerName: string): void {
    this.circuitBreakerManager.reset(providerName);
    this.logger.info(`Reset provider ${providerName}`);
  }

  /**
   * Reset all providers
   */
  resetAll(): void {
    this.circuitBreakerManager.resetAll();
    this.logger.info('Reset all providers');
  }

  /**
   * Get current strategy
   */
  getStrategy(): FallbackStrategy {
    return this.strategy;
  }

  /**
   * Set routing strategy
   */
  setStrategy(strategy: FallbackStrategy): void {
    this.strategy = strategy;
    this.logger.info(`Updated routing strategy to ${strategy}`);
  }

  /**
   * Get number of available providers
   */
  getAvailableProviderCount(): number {
    return this.routes.length - this.getUnavailableProviders().length;
  }

  /**
   * Get unavailable providers
   */
  getUnavailableProviders(): string[] {
    const unavailable: string[] = [];

    for (const route of this.routes) {
      const breaker = this.circuitBreakerManager.getBreaker(route.name);
      if (breaker.isOpen()) {
        unavailable.push(route.name);
      }
    }

    return unavailable;
  }
}
