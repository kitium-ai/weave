/**
 * Tests for error classes
 */

import { describe, it, expect } from 'vitest';
import {
  WeaveError,
  ValidationError,
  ProviderError,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
  TimeoutError,
  OperationError,
  isWeaveError,
  isErrorType,
} from '../src/errors/index.js';

describe('Error Classes', () => {
  describe('WeaveError', () => {
    it('should create error with message and code', () => {
      const error = new WeaveError('Test error', 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('WeaveError');
    });

    it('should include status code and context', () => {
      const context = { field: 'value' };
      const error = new WeaveError('Test error', 'TEST_ERROR', 400, context);

      expect(error.statusCode).toBe(400);
      expect(error.context).toBe(context);
    });

    it('should convert to JSON', () => {
      const error = new WeaveError('Test error', 'TEST_ERROR', 400, { test: true });
      const json = error.toJSON();

      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.statusCode).toBe(400);
      expect(json.context).toEqual({ test: true });
    });
  });

  describe('ValidationError', () => {
    it('should have correct error type', () => {
      const error = new ValidationError('Invalid input');

      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });

    it('should include context', () => {
      const error = new ValidationError('Invalid', { field: 'email' });

      expect(error.context?.field).toBe('email');
    });
  });

  describe('ProviderError', () => {
    it('should include provider name', () => {
      const error = new ProviderError('Provider failed', 'openai', 'PROVIDER_ERROR', 500);

      expect(error.providerName).toBe('openai');
      expect(error.code).toBe('PROVIDER_ERROR');
    });
  });

  describe('RateLimitError', () => {
    it('should have rate limit error details', () => {
      const error = new RateLimitError('Too many requests', 'openai', 60000);

      expect(error.name).toBe('RateLimitError');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
      expect(error.retryAfter).toBe(60000);
    });

    it('should use default retry after', () => {
      const error = new RateLimitError('Too many requests', 'openai');

      expect(error.retryAfter).toBe(60000);
    });
  });

  describe('AuthenticationError', () => {
    it('should have authentication error details', () => {
      const error = new AuthenticationError('Invalid API key', 'openai');

      expect(error.name).toBe('AuthenticationError');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
      expect(error.providerName).toBe('openai');
    });
  });

  describe('NotFoundError', () => {
    it('should have not found error details', () => {
      const error = new NotFoundError('Model not found');

      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('TimeoutError', () => {
    it('should have timeout error details', () => {
      const error = new TimeoutError('Request timed out');

      expect(error.code).toBe('TIMEOUT');
      expect(error.statusCode).toBe(408);
    });
  });

  describe('OperationError', () => {
    it('should include operation name', () => {
      const error = new OperationError('Operation failed', 'generate');

      expect(error.operationName).toBe('generate');
      expect(error.code).toBe('OPERATION_ERROR');
    });
  });

  describe('Type Guards', () => {
    it('should identify WeaveError', () => {
      const error = new WeaveError('Test', 'TEST');

      expect(isWeaveError(error)).toBe(true);
      expect(isWeaveError(new Error('Not a weave error'))).toBe(false);
    });

    it('should identify specific error types', () => {
      const validationError = new ValidationError('Invalid');
      const rateLimitError = new RateLimitError('Too many', 'openai');

      expect(isErrorType(validationError, ValidationError)).toBe(true);
      expect(isErrorType(validationError, RateLimitError)).toBe(false);
      expect(isErrorType(rateLimitError, RateLimitError)).toBe(true);
    });
  });
});
