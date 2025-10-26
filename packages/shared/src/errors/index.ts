/**
 * Error classes for Weave framework
 * Provides hierarchical error types for different failure scenarios
 */

export class WeaveError extends Error {
  public readonly name: string = 'WeaveError';

  public constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, WeaveError.prototype);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

export class ValidationError extends WeaveError {
  public readonly name: string = 'ValidationError';

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ProviderError extends WeaveError {
  public readonly name: string = 'ProviderError';

  public constructor(
    message: string,
    public readonly providerName: string,
    code: string,
    statusCode?: number,
    context?: Record<string, unknown>
  ) {
    super(message, code, statusCode, context);
    Object.setPrototypeOf(this, ProviderError.prototype);
  }
}

export class RateLimitError extends ProviderError {
  public readonly name: string = 'RateLimitError';
  public readonly retryAfter: number;

  public constructor(
    message: string,
    providerName: string,
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, providerName, 'RATE_LIMIT', 429, context);
    this.retryAfter = retryAfter ?? 60000;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class AuthenticationError extends ProviderError {
  public readonly name: string = 'AuthenticationError';

  public constructor(message: string, providerName: string, context?: Record<string, unknown>) {
    super(message, providerName, 'AUTHENTICATION_ERROR', 401, context);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class NotFoundError extends WeaveError {
  public readonly name: string = 'NotFoundError';

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, context);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class TimeoutError extends WeaveError {
  public readonly name: string = 'TimeoutError';

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TIMEOUT', 408, context);
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class OperationError extends WeaveError {
  public readonly name: string = 'OperationError';

  public constructor(
    message: string,
    public readonly operationName: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'OPERATION_ERROR', 500, context);
    Object.setPrototypeOf(this, OperationError.prototype);
  }
}

/**
 * Type guard to check if error is a WeaveError
 */
export function isWeaveError(error: unknown): error is WeaveError {
  return error instanceof WeaveError;
}

/**
 * Type guard to check if error is a specific error type
 */
export function isErrorType<T extends WeaveError>(
  error: unknown,
  errorClass: new (...args: unknown[]) => T
): error is T {
  return error instanceof errorClass;
}

// Export error converter utilities
export * from './error-converter.js';

// Export error logger utilities
export * from './error-logger.js';
