/**
 * Request Timeout and Cancellation Utilities
 * Manages timeouts and cancellation tokens for async operations
 */

import { getLogger } from '@weaveai/shared';

/**
 * Cancellation token source
 */
export class CancellationTokenSource {
  private _cancelled: boolean = false;
  private _signal: AbortSignal;
  private _controller: AbortController;
  private readonly logger = getLogger();

  constructor() {
    this._controller = new AbortController();
    this._signal = this._controller.signal;
  }

  /**
   * Get the cancellation signal
   */
  get signal(): AbortSignal {
    return this._signal;
  }

  /**
   * Check if cancellation was requested
   */
  get cancelled(): boolean {
    return this._cancelled;
  }

  /**
   * Request cancellation
   */
  public cancel(): void {
    if (!this._cancelled) {
      this._cancelled = true;
      this._controller.abort();
      this.logger.debug('Cancellation requested');
    }
  }

  /**
   * Throw if cancellation was requested
   */
  public throwIfCancelled(): void {
    if (this._cancelled) {
      throw new Error('Operation was cancelled');
    }
  }
}

/**
 * Timeout result with value
 */
export interface TimeoutResult<T> {
  completed: boolean;
  value?: T;
  timedOut: boolean;
}

/**
 * Create a timeout promise that rejects after specified time
 */
export function createTimeoutPromise(
  timeoutMs: number,
  message: string = 'Operation timeout'
): Promise<never> {
  return new Promise((_, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    // Cleanup on rejection
    return () => clearTimeout(timeoutId);
  });
}

/**
 * Race a promise against a timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message?: string
): Promise<T> {
  if (timeoutMs <= 0) {
    throw new Error('Timeout must be greater than 0');
  }

  return Promise.race([promise, createTimeoutPromise(timeoutMs, message)]);
}

/**
 * Execute function with timeout
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  message?: string
): Promise<T> {
  return withTimeout(fn(), timeoutMs, message || `Operation timeout after ${timeoutMs}ms`);
}

/**
 * Create a deferred promise for manual resolution
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Create a deferred promise
 */
export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Abort controller helper
 */
export function createAbortController(timeoutMs?: number): AbortController {
  const controller = new AbortController();

  if (timeoutMs && timeoutMs > 0) {
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);
  }

  return controller;
}

/**
 * Check if a signal is aborted
 */
export function isAborted(signal: AbortSignal): boolean {
  return signal.aborted;
}

/**
 * Wait for abort signal
 */
export function waitForAbort(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
    } else {
      signal.addEventListener('abort', () => resolve(), { once: true });
    }
  });
}
