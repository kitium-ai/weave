/**
 * Framework-agnostic controller for managing AI operations.
 * Base types and interfaces used across different controllers.
 */

/**
 * AI Status type - Union of all possible status values
 */
export type AIStatus = 'idle' | 'loading' | 'success' | 'error' | 'cancelled';

/**
 * AI Status enum values
 */
export const AIStatusEnum = {
  IDLE: 'idle' as const,
  LOADING: 'loading' as const,
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  CANCELLED: 'cancelled' as const,
};

/**
 * Token usage summary
 */
export interface TokenUsage {
  /** Number of input tokens */
  input: number;
  /** Number of output tokens */
  output: number;
}

/**
 * Cost summary for AI operations
 */
export interface CostSummary {
  /** Total cost in USD */
  totalCost: number;
  /** Cost per input token */
  costPerInputToken?: number;
  /** Cost per output token */
  costPerOutputToken?: number;
  /** Number of input tokens */
  inputTokens?: number;
  /** Number of output tokens */
  outputTokens?: number;
  /** Timestamp of the cost tracking */
  timestamp?: Date;
  /** Provider used for the operation */
  provider?: string;
  /** Model used for the operation */
  model?: string;
  /** Token usage summary */
  tokens?: TokenUsage;
  /** Currency symbol */
  currency?: string;
}

/**
 * Options for AI operations
 */
export interface AIControllerOptions<T = unknown> {
  /** Enable cost tracking */
  trackCosts?: boolean;
  /** Enable caching */
  cacheEnabled?: boolean;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Timeout for operations in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retries?: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  };
  /** Error handling */
  onError?: (error: Error) => void;
  /** Success callback */
  onSuccess?: (result: T) => void;
  /** Operation type (framework-specific) */
  operation?: string;
}

/**
 * Base AI controller state
 */
export interface AIControllerState<T = unknown> {
  data?: T | null;
  loading: boolean;
  status: 'idle' | 'loading' | 'success' | 'error' | 'cancelled';
  error: Error | null;
  cost: CostSummary | null;
  budgetExceeded?: boolean;
}

/**
 * Event emitter for AI operations
 */
export interface AIControllerEventMap {
  'cost-updated': CostSummary;
  'cache-hit': { key: string; result: any };
  'cache-miss': { key: string };
  'operation-start': { operationId: string; timestamp: Date };
  'operation-end': { operationId: string; timestamp: Date; duration: number };
  'provider-switched': { from: string; to: string };
  'error': { error: Error; operationId: string };
}

export type AIControllerListener<K extends keyof AIControllerEventMap> = (
  event: AIControllerEventMap[K],
) => void;

/**
 * Abstract base class for AI controllers
 */
export abstract class AIController {
  protected options: AIControllerOptions;
  protected listeners: Map<string, Set<Function>> = new Map();
  protected costSummary: CostSummary | null = null;

  constructor(options: AIControllerOptions = {}) {
    this.options = {
      trackCosts: true,
      cacheEnabled: true,
      cacheTTL: 3600,
      timeout: 30000,
      ...options,
    };
  }

  /**
   * Subscribe to controller events
   */
  on<K extends keyof AIControllerEventMap>(
    event: K,
    listener: AIControllerListener<K>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  /**
   * Emit an event
   */
  protected emit<K extends keyof AIControllerEventMap>(
    event: K,
    data: AIControllerEventMap[K],
  ): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          (listener as Function)(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Get current cost summary
   */
  getCostSummary(): CostSummary | null {
    return this.costSummary;
  }

  /**
   * Update cost summary
   */
  protected updateCostSummary(cost: CostSummary): void {
    this.costSummary = cost;
    if (this.options.trackCosts) {
      this.emit('cost-updated', cost);
    }
  }

  /**
   * Handle operation with timeout and retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
  ): Promise<T> {
    const maxAttempts = this.options.retries?.maxAttempts ?? 3;
    const baseDelay = this.options.retries?.delayMs ?? 1000;
    const backoffMultiplier = this.options.retries?.backoffMultiplier ?? 2;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        this.emit('operation-start', {
          operationId,
          timestamp: new Date(),
        });

        const startTime = Date.now();
        const result = await Promise.race([
          operation(),
          new Promise<T>((_, reject) =>
            setTimeout(
              () => reject(new Error('Operation timeout')),
              this.options.timeout ?? 30000,
            ),
          ),
        ]);

        const duration = Date.now() - startTime;
        this.emit('operation-end', {
          operationId,
          timestamp: new Date(),
          duration,
        });

        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts - 1) {
          const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    const error = lastError ?? new Error('Operation failed');
    this.emit('error', { error, operationId });
    this.options.onError?.(error);
    throw error;
  }

  /**
   * Cleanup resources
   */
  abstract destroy(): void;
}

/**
 * Helper function to calculate cost
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  costPerInputToken: number,
  costPerOutputToken: number,
): number {
  return inputTokens * costPerInputToken + outputTokens * costPerOutputToken;
}

/**
 * Helper function to format cost
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Execution listener for state changes
 */
export type AIExecutionListener<T = unknown> = (state: AIControllerState<T>) => void;

/**
 * AI Execution Controller - generic controller class
 */
export class AIExecutionController<T = unknown> {
  private listeners = new Set<AIExecutionListener<T>>();
  private state: AIControllerState<T> = {
    loading: false,
    status: 'idle',
    error: null,
    cost: null,
    data: null,
  };
  private options: AIControllerOptions<T>;

  constructor(options?: AIControllerOptions<T>) {
    this.options = {
      trackCosts: true,
      cacheEnabled: true,
      cacheTTL: 3600,
      timeout: 30000,
      ...options,
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: AIExecutionListener<T>): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state
   */
  getState(): AIControllerState<T> {
    return this.state;
  }

  /**
   * Update state
   */
  setState(patch: Partial<AIControllerState<T>>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Set options
   */
  setOptions(options: AIControllerOptions<T>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get options
   */
  getOptions(): AIControllerOptions<T> {
    return this.options;
  }

  /**
   * Execute an operation
   */
  async execute(fn: () => Promise<T>): Promise<T | null> {
    try {
      this.setState({ loading: true, status: 'loading', error: null });
      const result = await fn();
      this.setState({ data: result, loading: false, status: 'success' });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState({ error: err, loading: false, status: 'error' });
      this.options.onError?.(err);
      return null;
    }
  }

  /**
   * Reset cost tracking
   */
  resetCost(): void {
    this.setState({ cost: null, budgetExceeded: false });
  }
}

/**
 * AI Execution Options - generic options type
 */
export type AIExecutionOptions<T = unknown> = AIControllerOptions<T>;

/**
 * AI Execution State - alias for AIControllerState
 */
export type AIExecutionState<T = unknown> = AIControllerState<T>;
