/**
 * Custom WeaveError class
 * Extends Error with additional context and solutions
 */

export interface WeaveErrorOptions {
  code?: string;
  context?: Record<string, unknown>;
  cause?: Error;
  statusCode?: number;
}

/**
 * WeaveError - Custom error class for all Weave errors
 *
 * Provides structured error handling with:
 * - Error codes for categorization
 * - Context for debugging
 * - Root cause tracking
 * - HTTP status codes
 */
export class WeaveError extends Error {
  readonly code: string;
  readonly context: Record<string, unknown>;
  readonly cause?: Error;
  readonly statusCode: number;
  readonly timestamp: Date;

  constructor(message: string, options: WeaveErrorOptions = {}) {
    super(message);

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, WeaveError.prototype);

    this.name = 'WeaveError';
    this.code = options.code || 'UNKNOWN_ERROR';
    this.context = options.context || {};
    this.cause = options.cause;
    this.statusCode = options.statusCode || 500;
    this.timestamp = new Date();

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WeaveError);
    }
  }

  /**
   * Check if this is a retryable error
   */
  isRetryable(): boolean {
    const retryableCodes = [
      'RATE_LIMIT_EXCEEDED',
      'NETWORK_ERROR',
      'OPERATION_TIMEOUT',
      'SERVICE_UNAVAILABLE'
    ];
    return retryableCodes.includes(this.code);
  }

  /**
   * Get error severity level
   */
  getSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.code === 'INVALID_API_KEY' || this.code === 'AUTHENTICATION_FAILED') {
      return 'critical';
    }
    if (this.code === 'PERMISSION_DENIED' || this.code === 'INVALID_CONFIGURATION') {
      return 'high';
    }
    if (this.code === 'RATE_LIMIT_EXCEEDED' || this.code === 'OPERATION_TIMEOUT') {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Serialize error for logging
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      severity: this.getSeverity(),
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      causedBy: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  /**
   * Create WeaveError from standard Error
   */
  static from(error: Error, code?: string): WeaveError {
    return new WeaveError(error.message, {
      code: code || 'UNKNOWN_ERROR',
      cause: error
    });
  }

  /**
   * Create authentication error
   */
  static authError(message: string, context?: Record<string, unknown>): WeaveError {
    return new WeaveError(message, {
      code: 'INVALID_API_KEY',
      context,
      statusCode: 401
    });
  }

  /**
   * Create not found error
   */
  static notFound(message: string, context?: Record<string, unknown>): WeaveError {
    return new WeaveError(message, {
      code: 'MODEL_NOT_FOUND',
      context,
      statusCode: 404
    });
  }

  /**
   * Create rate limit error
   */
  static rateLimitError(
    retryAfter?: number,
    context?: Record<string, unknown>
  ): WeaveError {
    return new WeaveError('Rate limit exceeded. Please try again later.', {
      code: 'RATE_LIMIT_EXCEEDED',
      context: {
        ...(context || {}),
        retryAfter: retryAfter || 60
      },
      statusCode: 429
    });
  }

  /**
   * Create timeout error
   */
  static timeoutError(timeout: number, context?: Record<string, unknown>): WeaveError {
    return new WeaveError(`Operation timed out after ${timeout}ms`, {
      code: 'OPERATION_TIMEOUT',
      context: {
        ...(context || {}),
        timeout
      },
      statusCode: 408
    });
  }

  /**
   * Create validation error
   */
  static validationError(
    message: string,
    field?: string,
    value?: unknown
  ): WeaveError {
    return new WeaveError(message, {
      code: 'INVALID_REQUEST',
      context: {
        field,
        value
      },
      statusCode: 400
    });
  }

  /**
   * Create configuration error
   */
  static configError(message: string, context?: Record<string, unknown>): WeaveError {
    return new WeaveError(message, {
      code: 'INVALID_CONFIGURATION',
      context,
      statusCode: 400
    });
  }

  /**
   * Create network error
   */
  static networkError(message: string, context?: Record<string, unknown>): WeaveError {
    return new WeaveError(message, {
      code: 'NETWORK_ERROR',
      context,
      statusCode: 503
    });
  }

  /**
   * Create parsing error
   */
  static parseError(
    message: string,
    rawData?: unknown,
    context?: Record<string, unknown>
  ): WeaveError {
    return new WeaveError(message, {
      code: 'PARSING_ERROR',
      context: {
        ...(context || {}),
        rawData: typeof rawData === 'string' ? rawData.substring(0, 500) : rawData
      },
      statusCode: 500
    });
  }
}

/**
 * Type guard to check if error is a WeaveError
 */
export function isWeaveError(error: unknown): error is WeaveError {
  return error instanceof WeaveError;
}

/**
 * Assert that error is a WeaveError
 */
export function assertWeaveError(error: unknown): asserts error is WeaveError {
  if (!isWeaveError(error)) {
    throw new TypeError('Expected WeaveError');
  }
}
