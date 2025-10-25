/**
 * Retry Strategy Utilities
 * Implements exponential backoff with jitter
 */

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(attempt: number, config: Partial<RetryConfig> = {}): number {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = Math.min(
    finalConfig.initialDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt),
    finalConfig.maxDelayMs
  );

  // Add jitter: random variation between -jitterFactor% and +jitterFactor%
  const jitter = exponentialDelay * finalConfig.jitterFactor * (Math.random() * 2 - 1);
  const finalDelay = Math.max(0, exponentialDelay + jitter);

  return Math.round(finalDelay);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return true;
    }

    // Check for HTTP 5xx or specific 429 (rate limit)
    if (error instanceof Response) {
      return error.status >= 500 || error.status === 429;
    }
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>;
    if ('status' in obj) {
      const status = obj.status;
      if (typeof status === 'number') {
        return status >= 500 || status === 429 || status === 408;
      }
    }
  }

  return false;
}

/**
 * Retry decorator for async functions
 */
export function withRetry<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
) {
  return async (...args: T): Promise<R> => {
    const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;

        if (attempt < finalConfig.maxRetries && isRetryableError(error)) {
          const delay = calculateBackoffDelay(attempt, finalConfig);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    throw lastError;
  };
}
