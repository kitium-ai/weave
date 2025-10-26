/**
 * Error Converter Utility
 * Normalizes and converts various error types to standard Weave error format
 */

import type { WeaveError } from './index.js';
import {
  ValidationError,
  ProviderError,
  RateLimitError,
  AuthenticationError,
  TimeoutError,
  WeaveError as WeaveErrorClass,
} from './index.js';

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }
  return String(error);
}

/**
 * Extract HTTP status code from error if available
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof WeaveErrorClass) {
    return error.statusCode;
  }
  if (typeof error === 'object' && error !== null) {
    const status = (error as any).status || (error as any).statusCode || (error as any).code;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
}

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof RateLimitError) {
    return true;
  }
  const status = getErrorStatus(error);
  if (status === 429) {
    return true;
  }
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('rate limit') || message.includes('too many requests');
}

/**
 * Check if error is an authentication error
 */
function isAuthenticationError(error: unknown): boolean {
  if (error instanceof AuthenticationError) {
    return true;
  }
  const status = getErrorStatus(error);
  if (status === 401 || status === 403) {
    return true;
  }
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('unauthorized') ||
    message.includes('authentication') ||
    message.includes('invalid api key') ||
    message.includes('forbidden') ||
    message.includes('access denied')
  );
}

/**
 * Check if error is a timeout error
 */
function isTimeoutError(error: unknown): boolean {
  if (error instanceof TimeoutError) {
    return true;
  }
  const status = getErrorStatus(error);
  if (status === 408) {
    return true;
  }
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('request timeout') ||
    message.includes('took too long')
  );
}

/**
 * Check if error is a validation error
 */
function isValidationError(error: unknown): boolean {
  if (error instanceof ValidationError) {
    return true;
  }
  const status = getErrorStatus(error);
  if (status === 400) {
    return true;
  }
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('bad request') ||
    message.includes('malformed')
  );
}

/**
 * Extract retry-after value from rate limit error
 */
export function getRetryAfter(error: unknown): number | undefined {
  if (error instanceof RateLimitError) {
    return error.retryAfter;
  }
  if (typeof error === 'object' && error !== null) {
    const retryAfter = (error as any)['retry-after'] || (error as any).retryAfter;
    if (typeof retryAfter === 'number') {
      return retryAfter * 1000; // Convert to milliseconds if in seconds
    }
    if (typeof retryAfter === 'string') {
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed)) {
        return parsed * 1000; // Convert to milliseconds
      }
    }
  }
  return undefined;
}

/**
 * Normalize error to WeaveError
 * Provides safe error handling for catch blocks
 */
export function normalizeError(
  error: unknown,
  context?: Record<string, unknown>,
  providerName?: string
): WeaveError {
  // If already a WeaveError, return as-is with context
  if (error instanceof WeaveErrorClass) {
    return error;
  }

  const message = getErrorMessage(error);
  const status = getErrorStatus(error);
  const errorContext = {
    ...context,
    originalError: error instanceof Error ? { name: error.name, stack: error.stack } : error,
  };

  // Check for specific error types
  if (isRateLimitError(error)) {
    const retryAfter = getRetryAfter(error);
    return new RateLimitError(
      message,
      providerName || 'unknown',
      retryAfter,
      errorContext
    );
  }

  if (isAuthenticationError(error)) {
    return new AuthenticationError(message, providerName || 'unknown', errorContext);
  }

  if (isTimeoutError(error)) {
    return new TimeoutError(message, errorContext);
  }

  if (isValidationError(error)) {
    return new ValidationError(message, errorContext);
  }

  // Generic provider error if provider name given
  if (providerName) {
    return new ProviderError(
      message,
      providerName,
      'PROVIDER_ERROR',
      status,
      errorContext
    );
  }

  // Default to generic WeaveError
  return new WeaveErrorClass(message, 'UNKNOWN_ERROR', status, errorContext);
}

/**
 * Normalize and throw error
 * Shorthand for normalizeError followed by throw
 */
export function throwNormalizedError(
  error: unknown,
  context?: Record<string, unknown>,
  providerName?: string
): never {
  throw normalizeError(error, context, providerName);
}

/**
 * Safely handle error in callback
 * Returns normalized error or undefined if not an error
 */
export function safeNormalizeError(
  error: unknown,
  context?: Record<string, unknown>,
  providerName?: string
): WeaveError | undefined {
  try {
    if (!error) {
      return undefined;
    }
    return normalizeError(error, context, providerName);
  } catch {
    // If normalization fails, create basic error
    return new WeaveErrorClass(
      'Failed to normalize error',
      'ERROR_NORMALIZATION_FAILED',
      500,
      { originalError: error }
    );
  }
}

/**
 * Format error message for logging or display
 */
export function formatErrorMessage(error: unknown, includeStack = false): string {
  const normalizedError = normalizeError(error);

  let message = `${normalizedError.name}: ${normalizedError.message}`;

  if (normalizedError.code) {
    message += ` [${normalizedError.code}]`;
  }

  if (normalizedError.statusCode) {
    message += ` (${normalizedError.statusCode})`;
  }

  if (includeStack && error instanceof Error && error.stack) {
    message += `\n${error.stack}`;
  }

  return message;
}

/**
 * Chain error handling with custom handler
 */
export function handleError(
  error: unknown,
  handler: (err: WeaveError) => void | never,
  context?: Record<string, unknown>,
  providerName?: string
): void {
  const normalized = normalizeError(error, context, providerName);
  handler(normalized);
}

/**
 * Create a safe error boundary wrapper
 */
export function createErrorBoundary(
  context?: Record<string, unknown>,
  providerName?: string
): {
  try: <T>(fn: () => T | Promise<T>) => T | Promise<WeaveError | T>;
  catch: (error: unknown) => WeaveError;
} {
  return {
    try: <T>(fn: () => T | Promise<T>): T | Promise<WeaveError | T> => {
      try {
        const result = fn();
        if (result instanceof Promise) {
          return result.catch((error: unknown) =>
            normalizeError(error, context, providerName)
          ) as Promise<WeaveError | T>;
        }
        return result;
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return normalizeError(error, context, providerName) as any;
      }
    },
    catch: (error: unknown): WeaveError => {
      return normalizeError(error, context, providerName);
    },
  };
}
