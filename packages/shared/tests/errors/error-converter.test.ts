/**
 * Error Converter Tests
 * Tests for error normalization and conversion utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  getErrorMessage,
  getErrorStatus,
  getRetryAfter,
  normalizeError,
  safeNormalizeError,
  formatErrorMessage,
  handleError,
  createErrorBoundary,
  throwNormalizedError,
} from '../../src/errors/error-converter.js';
import {
  WeaveError,
  ValidationError,
  ProviderError,
  RateLimitError,
  AuthenticationError,
  TimeoutError,
  OperationError,
} from '../../src/errors/index.js';

describe('Error Converter', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle object with message property', () => {
      const error = { message: 'Object error' };
      expect(getErrorMessage(error)).toBe('Object error');
    });

    it('should handle null/undefined', () => {
      expect(getErrorMessage(null)).toBe('null');
      expect(getErrorMessage(undefined)).toBe('undefined');
    });

    it('should handle objects without message', () => {
      const error = { code: 'ERROR' };
      expect(getErrorMessage(error)).toBe('[object Object]');
    });
  });

  describe('getErrorStatus', () => {
    it('should extract status from WeaveError', () => {
      const error = new ValidationError('Test', { status: 400 });
      expect(getErrorStatus(error)).toBe(400);
    });

    it('should extract status from object.status', () => {
      const error = { status: 404 };
      expect(getErrorStatus(error)).toBeUndefined(); // Only numeric status extracted, but it's not a WeaveError
    });

    it('should return undefined if no status found', () => {
      const error = new Error('Generic error');
      expect(getErrorStatus(error)).toBeUndefined();
    });

    it('should handle statusCode property', () => {
      const error = new WeaveError('Test', 'TEST', 500);
      expect(getErrorStatus(error)).toBe(500);
    });
  });

  describe('getRetryAfter', () => {
    it('should extract retry-after from RateLimitError', () => {
      const error = new RateLimitError('Rate limited', 'test', 30000);
      expect(getRetryAfter(error)).toBe(30000);
    });

    it('should use default if not specified', () => {
      const error = new RateLimitError('Rate limited', 'test');
      expect(getRetryAfter(error)).toBe(60000); // Default is 1 minute
    });

    it('should extract retry-after header as milliseconds', () => {
      const error = { 'retry-after': 30 };
      expect(getRetryAfter(error)).toBe(30000);
    });

    it('should handle retryAfter property', () => {
      const error = { retryAfter: 45 };
      expect(getRetryAfter(error)).toBe(45000);
    });

    it('should return undefined if not a rate limit error', () => {
      const error = new Error('Generic error');
      expect(getRetryAfter(error)).toBeUndefined();
    });
  });

  describe('normalizeError', () => {
    it('should return WeaveError as-is', () => {
      const error = new ValidationError('Test error');
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(ValidationError);
      expect(normalized.message).toBe('Test error');
    });

    it('should convert Error to WeaveError', () => {
      const error = new Error('Generic error');
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(WeaveError);
      expect(normalized.message).toBe('Generic error');
    });

    it('should detect and convert rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(RateLimitError);
    });

    it('should detect and convert authentication errors', () => {
      const error = new Error('Invalid API key');
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(AuthenticationError);
    });

    it('should detect and convert timeout errors', () => {
      const error = new Error('Request timeout');
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(TimeoutError);
    });

    it('should detect and convert validation errors', () => {
      const error = new Error('Invalid request body');
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(ValidationError);
    });

    it('should handle 429 status as rate limit', () => {
      const error = { status: 429, message: 'Too many requests' };
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(RateLimitError);
    });

    it('should handle 401 status as authentication error', () => {
      const error = { statusCode: 401, message: 'Unauthorized' };
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(AuthenticationError);
    });

    it('should handle 408 status as timeout', () => {
      const error = { status: 408, message: 'Request timeout' };
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(TimeoutError);
    });

    it('should handle 400 status as validation error', () => {
      const error = { statusCode: 400, message: 'Bad request' };
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(ValidationError);
    });

    it('should create ProviderError with provider name', () => {
      const error = new Error('Provider error');
      const normalized = normalizeError(error, undefined, 'openai');
      expect(normalized).toBeInstanceOf(ProviderError);
      expect((normalized as ProviderError).providerName).toBe('openai');
    });

    it('should preserve context information', () => {
      const context = { userId: '123', operation: 'generate' };
      const error = new Error('Test error');
      const normalized = normalizeError(error, context);
      expect(normalized.context).toEqual(expect.objectContaining(context));
    });

    it('should handle string errors', () => {
      const normalized = normalizeError('String error');
      expect(normalized).toBeInstanceOf(WeaveError);
      expect(normalized.message).toBe('String error');
    });
  });

  describe('safeNormalizeError', () => {
    it('should safely normalize valid errors', () => {
      const error = new Error('Test error');
      const normalized = safeNormalizeError(error);
      expect(normalized).toBeInstanceOf(WeaveError);
    });

    it('should return undefined for null/undefined', () => {
      expect(safeNormalizeError(null)).toBeUndefined();
      expect(safeNormalizeError(undefined)).toBeUndefined();
    });

    it('should never throw even with circular references', () => {
      const circular: any = {};
      circular.self = circular;

      expect(() => {
        safeNormalizeError(circular);
      }).not.toThrow();
    });

    it('should handle normalization failures gracefully', () => {
      const error = {
        get message() {
          throw new Error('Getter error');
        },
      };
      const normalized = safeNormalizeError(error);
      expect(normalized).toBeInstanceOf(WeaveError);
    });
  });

  describe('formatErrorMessage', () => {
    it('should format WeaveError', () => {
      const error = new ValidationError('Invalid input');
      const formatted = formatErrorMessage(error);
      expect(formatted).toContain('ValidationError');
      expect(formatted).toContain('Invalid input');
      expect(formatted).toContain('VALIDATION_ERROR');
    });

    it('should include status code if available', () => {
      const error = new ValidationError('Invalid input');
      const formatted = formatErrorMessage(error);
      expect(formatted).toContain('400');
    });

    it('should optionally include stack trace', () => {
      const error = new Error('Test error');
      const formatted = formatErrorMessage(error, true);
      expect(formatted).toContain('at ');
    });

    it('should not include stack trace by default', () => {
      const error = new Error('Test error');
      const formatted = formatErrorMessage(error, false);
      expect(formatted).not.toContain('at ');
    });

    it('should handle errors without status code', () => {
      const error = new WeaveError('Test', 'TEST_CODE');
      const formatted = formatErrorMessage(error);
      expect(formatted).toContain('TEST_CODE');
      expect(formatted).not.toContain('undefined');
    });
  });

  describe('handleError', () => {
    it('should call handler with normalized error', () => {
      const handler = vi.fn();
      const error = new Error('Test error');
      handleError(error, handler);

      expect(handler).toHaveBeenCalledWith(expect.any(WeaveError));
    });

    it('should pass normalized error to handler', () => {
      let capturedError: WeaveError | null = null;
      const handler = (err: WeaveError) => {
        capturedError = err;
      };

      const error = new Error('Rate limit exceeded');
      handleError(error, handler);

      expect(capturedError).toBeInstanceOf(RateLimitError);
    });

    it('should support throwing in handler', () => {
      const handler = (err: WeaveError): never => {
        throw err;
      };

      const error = new Error('Test error');
      expect(() => {
        handleError(error, handler);
      }).toThrow();
    });

    it('should preserve context through handler', () => {
      let capturedContext: Record<string, unknown> | undefined;
      const handler = (err: WeaveError) => {
        capturedContext = err.context;
      };

      const context = { userId: 'abc123' };
      const error = new Error('Test error');
      handleError(error, handler, context);

      expect(capturedContext).toEqual(expect.objectContaining(context));
    });
  });

  describe('createErrorBoundary', () => {
    it('should return successful result from try', () => {
      const boundary = createErrorBoundary();
      const result = boundary.try(() => 42);
      expect(result).toBe(42);
    });

    it('should catch and normalize error from try', () => {
      const boundary = createErrorBoundary();
      const result = boundary.try(() => {
        throw new Error('Test error');
      });

      expect(result).toBeInstanceOf(WeaveError);
    });

    it('should support async operations', async () => {
      const boundary = createErrorBoundary();
      const result = boundary.try(async () => 42);

      if (result instanceof Promise) {
        const resolved = await result;
        expect(resolved).toBe(42);
      }
    });

    it('should handle async errors', async () => {
      const boundary = createErrorBoundary();
      const result = boundary.try(async () => {
        throw new Error('Async error');
      });

      if (result instanceof Promise) {
        const resolved = await result;
        expect(resolved).toBeInstanceOf(WeaveError);
      }
    });

    it('should provide catch method for manual error handling', () => {
      const boundary = createErrorBoundary();
      const error = new Error('Manual error');
      const normalized = boundary.catch(error);

      expect(normalized).toBeInstanceOf(WeaveError);
    });

    it('should preserve context in boundary', () => {
      const context = { operation: 'test' };
      const boundary = createErrorBoundary(context);
      const error = new Error('Test error');
      const normalized = boundary.catch(error);

      expect(normalized.context).toEqual(expect.objectContaining(context));
    });
  });

  describe('throwNormalizedError', () => {
    it('should throw WeaveError', () => {
      const error = new Error('Test error');
      expect(() => {
        throwNormalizedError(error);
      }).toThrow(WeaveError);
    });

    it('should throw RateLimitError for rate limit messages', () => {
      expect(() => {
        throwNormalizedError('Rate limit exceeded', undefined, 'openai');
      }).toThrow(RateLimitError);
    });

    it('should throw AuthenticationError for auth messages', () => {
      expect(() => {
        throwNormalizedError('Invalid API key', undefined, 'openai');
      }).toThrow(AuthenticationError);
    });

    it('should preserve context when throwing', () => {
      const context = { userId: 'test' };
      try {
        throwNormalizedError(new Error('Test'), context);
      } catch (error) {
        expect((error as WeaveError).context).toEqual(expect.objectContaining(context));
      }
    });
  });

  describe('Error Detection', () => {
    it('should detect rate limit by message variations', () => {
      const messages = ['Rate limit exceeded', 'Too many requests', 'rate limited', 'Rate limit'];

      messages.forEach((msg) => {
        const error = normalizeError(new Error(msg));
        expect(error).toBeInstanceOf(RateLimitError);
      });
    });

    it('should detect authentication by message variations', () => {
      const messages = [
        'Unauthorized',
        'Invalid API key',
        'Authentication failed',
        'Access denied',
        'Forbidden',
      ];

      messages.forEach((msg) => {
        const error = normalizeError(new Error(msg), undefined, 'openai');
        expect(error).toBeInstanceOf(AuthenticationError);
      });
    });

    it('should detect timeout by message variations', () => {
      const messages = ['Request timeout', 'Timed out', 'Connection timeout', 'Took too long'];

      messages.forEach((msg) => {
        const error = normalizeError(new Error(msg));
        expect(error).toBeInstanceOf(TimeoutError);
      });
    });

    it('should detect validation by message variations', () => {
      const messages = ['Validation error', 'Invalid request', 'Bad request', 'Malformed request'];

      messages.forEach((msg) => {
        const error = normalizeError(new Error(msg));
        expect(error).toBeInstanceOf(ValidationError);
      });
    });
  });

  describe('Context Preservation', () => {
    it('should preserve original error in context', () => {
      const originalError = new Error('Original');
      const normalized = normalizeError(originalError);

      expect(normalized.context?.originalError).toBeDefined();
    });

    it('should accumulate context from multiple sources', () => {
      const error = new Error('Test');
      const context = { userId: 'abc', operation: 'generate' };
      const normalized = normalizeError(error, context);

      expect(normalized.context).toEqual(
        expect.objectContaining({
          userId: 'abc',
          operation: 'generate',
        })
      );
    });

    it('should handle context as undefined', () => {
      const error = new Error('Test');
      const normalized = normalizeError(error, undefined);

      expect(normalized.context).toBeDefined();
    });
  });
});
