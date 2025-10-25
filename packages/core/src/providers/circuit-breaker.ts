/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by failing fast when service is unavailable
 */

import { getLogger } from '@weaveai/shared';

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Successful calls needed to close from half-open
  timeout: number; // Time in ms before trying half-open
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  state: CircuitBreakerState;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

/**
 * Circuit Breaker
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime: number = 0;
  private readonly logger = getLogger();

  constructor(
    private providerName: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
    }
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.successCount = 0;
        this.logger.info(`Circuit breaker ${this.providerName} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.providerName} is OPEN. Service unavailable.`);
      }
    }

    this.totalRequests++;

    try {
      const result = await fn();

      this.onSuccess();

      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.successfulRequests++;
    this.lastSuccessTime = new Date();
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.failureCount = 0;
        this.logger.info(`Circuit breaker ${this.providerName} closed (recovered)`);
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.failedRequests++;
    this.lastFailureTime = new Date();
    this.failureCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
      this.logger.warn(`Circuit breaker ${this.providerName} re-opened`);
    } else if (
      this.state === CircuitBreakerState.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.timeout;
      this.logger.warn(
        `Circuit breaker ${this.providerName} opened after ${this.failureCount} failures`
      );
    }
  }

  /**
   * Get circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Check if circuit breaker is open
   */
  isOpen(): boolean {
    return this.state === CircuitBreakerState.OPEN && Date.now() < this.nextAttemptTime;
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitBreakerState.CLOSED;
  }

  /**
   * Get metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.logger.debug(`Circuit breaker ${this.providerName} reset`);
  }

  /**
   * Get success rate percentage
   */
  getSuccessRate(): number {
    if (this.totalRequests === 0) {
      return 100;
    }

    return (this.successfulRequests / this.totalRequests) * 100;
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different providers
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private readonly logger = getLogger();

  /**
   * Get or create circuit breaker for provider
   */
  getBreaker(providerName: string, config?: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(providerName)) {
      const breaker = new CircuitBreaker(providerName, config);
      this.breakers.set(providerName, breaker);
      this.logger.debug(`Created circuit breaker for ${providerName}`);
    }

    return <CircuitBreaker>this.breakers.get(providerName);
  }

  /**
   * Execute with circuit breaker protection
   */
  async execute<T>(
    providerName: string,
    fn: () => Promise<T>,
    config?: CircuitBreakerConfig
  ): Promise<T> {
    const breaker = this.getBreaker(providerName, config);
    return breaker.execute(fn);
  }

  /**
   * Get all circuit breakers
   */
  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get health status of all breakers
   */
  getHealth(): Record<string, CircuitBreakerMetrics> {
    const health: Record<string, CircuitBreakerMetrics> = {};

    for (const [name, breaker] of this.breakers.entries()) {
      health[name] = breaker.getMetrics();
    }

    return health;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    this.logger.debug('Reset all circuit breakers');
  }

  /**
   * Reset specific circuit breaker
   */
  reset(providerName: string): void {
    const breaker = this.breakers.get(providerName);
    if (breaker) {
      breaker.reset();
      this.logger.debug(`Reset circuit breaker for ${providerName}`);
    }
  }
}

// Global circuit breaker manager
const globalManager = new CircuitBreakerManager();

export function getCircuitBreakerManager(): CircuitBreakerManager {
  return globalManager;
}
