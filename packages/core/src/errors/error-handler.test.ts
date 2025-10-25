/**
 * Tests for error handling system
 */

import { describe, it, expect } from 'vitest';
import {
  extractErrorCode,
  getErrorSolution,
  formatErrorMessage,
  validateConfiguration,
  WeaveError,
} from './index.js';

describe('Error Handler', () => {
  describe('extractErrorCode', () => {
    it('should extract error code from WeaveError', () => {
      const error = new WeaveError('Test error', {
        code: 'INVALID_API_KEY',
      });
      expect(extractErrorCode(error)).toBe('INVALID_API_KEY');
    });

    it('should extract from 401 error message', () => {
      const error = new Error('401 Unauthorized');
      expect(extractErrorCode(error)).toBe('INVALID_API_KEY');
    });

    it('should extract from 429 error message', () => {
      const error = new Error('429 Rate limit exceeded');
      expect(extractErrorCode(error)).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should extract from timeout error', () => {
      const error = new Error('Request timeout');
      expect(extractErrorCode(error)).toBe('OPERATION_TIMEOUT');
    });

    it('should extract from network error', () => {
      const error = new Error('Network error: ECONNREFUSED');
      expect(extractErrorCode(error)).toBe('NETWORK_ERROR');
    });

    it('should return UNKNOWN_ERROR for unrecognized errors', () => {
      const error = new Error('Some random error');
      expect(extractErrorCode(error)).toBe('UNKNOWN_ERROR');
    });

    it('should handle non-Error objects', () => {
      expect(extractErrorCode('string error')).toBe('UNKNOWN_ERROR');
      expect(extractErrorCode(null)).toBe('UNKNOWN_ERROR');
      expect(extractErrorCode(undefined)).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getErrorSolution', () => {
    it('should return solution for INVALID_API_KEY', () => {
      const solution = getErrorSolution('INVALID_API_KEY');
      expect(solution.title).toBe('Invalid API Key');
      expect(solution.steps.length).toBeGreaterThan(0);
      expect(solution.documentation).toContain('weave.ai');
    });

    it('should return solution for RATE_LIMIT_EXCEEDED', () => {
      const solution = getErrorSolution('RATE_LIMIT_EXCEEDED');
      expect(solution.title).toBe('Rate Limit Exceeded');
      expect(solution.description).toContain('rate limit');
    });

    it('should return solution for NETWORK_ERROR', () => {
      const solution = getErrorSolution('NETWORK_ERROR');
      expect(solution.title).toBe('Network Connection Error');
      expect(solution.steps).toContain('1. Check your internet connection');
    });

    it('should return UNKNOWN_ERROR solution for unrecognized codes', () => {
      const solution = getErrorSolution('UNKNOWN_CODE');
      expect(solution.title).toBe('Unknown Error');
    });

    it('should include examples for applicable errors', () => {
      const solution = getErrorSolution('INVALID_API_KEY');
      expect(solution.examples).toBeDefined();
      expect(solution.examples!.length).toBeGreaterThan(0);
      expect(solution.examples![0]).toContain('sk-');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error message with solution', () => {
      const error = new WeaveError('Invalid API key', {
        code: 'INVALID_API_KEY',
      });
      const formatted = formatErrorMessage(error);

      expect(formatted).toContain('Invalid API Key');
      expect(formatted).toContain('Steps to resolve');
      expect(formatted).toContain('Learn more');
    });

    it('should include context when provided', () => {
      const error = new Error('Test error');
      const formatted = formatErrorMessage(error, {
        provider: 'openai',
        details: {
          timestamp: new Date().toISOString(),
          userId: 'user123',
        },
      });

      expect(formatted).toContain('Context');
      expect(formatted).toContain('timestamp');
      expect(formatted).toContain('userId');
    });

    it('should include examples if available', () => {
      const error = new Error('Invalid API key');
      const formatted = formatErrorMessage(error);

      expect(formatted).toContain('Examples');
      expect(formatted).toContain('sk-');
    });

    it('should handle non-Error objects', () => {
      const formatted = formatErrorMessage('string error');
      expect(formatted).toBeTruthy();
      expect(formatted).toContain('Unknown Error');
    });
  });

  describe('validateConfiguration', () => {
    it('should validate complete configuration', () => {
      const config = {
        provider: {
          type: 'openai',
          apiKey: 'sk-' + 'a'.repeat(48),
        },
      };
      const result = validateConfiguration(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing provider', () => {
      const config = {};
      const result = validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing "provider" configuration');
    });

    it('should detect missing provider type', () => {
      const config = {
        provider: {
          apiKey: 'sk-test',
        },
      };
      const result = validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Missing provider type');
    });

    it('should detect invalid provider type', () => {
      const config = {
        provider: {
          type: 'invalid-provider',
          apiKey: 'sk-test',
        },
      };
      const result = validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unknown provider type');
    });

    it('should detect missing API key', () => {
      const config = {
        provider: {
          type: 'openai',
        },
      };
      const result = validateConfiguration(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing API key for provider');
    });

    it('should warn about placeholder API key', () => {
      const config = {
        provider: {
          type: 'openai',
          apiKey: 'PLACEHOLDER_API_KEY',
        },
      };
      const result = validateConfiguration(config);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('placeholder');
    });

    it('should warn about short API key', () => {
      const config = {
        provider: {
          type: 'openai',
          apiKey: 'sk-short',
        },
      };
      const result = validateConfiguration(config);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('too short');
    });

    it('should accept all valid provider types', () => {
      const providers = ['openai', 'anthropic', 'google'];

      providers.forEach((provider) => {
        const config = {
          provider: {
            type: provider,
            apiKey: 'sk-' + 'a'.repeat(48),
          },
        };
        const result = validateConfiguration(config);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('WeaveError static methods', () => {
    it('should create auth error', () => {
      const error = WeaveError.authError('Auth failed', { userId: '123' });
      expect(error.code).toBe('INVALID_API_KEY');
      expect(error.statusCode).toBe(401);
      expect(error.context.userId).toBe('123');
    });

    it('should create not found error', () => {
      const error = WeaveError.notFound('Model not found', { model: 'gpt-5' });
      expect(error.code).toBe('MODEL_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.context.model).toBe('gpt-5');
    });

    it('should create rate limit error', () => {
      const error = WeaveError.rateLimitError(60);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.statusCode).toBe(429);
      expect(error.context.retryAfter).toBe(60);
    });

    it('should create timeout error', () => {
      const error = WeaveError.timeoutError(30000);
      expect(error.code).toBe('OPERATION_TIMEOUT');
      expect(error.statusCode).toBe(408);
      expect(error.context.timeout).toBe(30000);
    });

    it('should create validation error', () => {
      const error = WeaveError.validationError('Invalid email', 'email', 'not-an-email');
      expect(error.code).toBe('INVALID_REQUEST');
      expect(error.statusCode).toBe(400);
      expect(error.context.field).toBe('email');
    });

    it('should create config error', () => {
      const error = WeaveError.configError('Missing API key');
      expect(error.code).toBe('INVALID_CONFIGURATION');
      expect(error.statusCode).toBe(400);
    });

    it('should create network error', () => {
      const error = WeaveError.networkError('Connection refused');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.statusCode).toBe(503);
    });

    it('should create parsing error', () => {
      const error = WeaveError.parseError('Invalid JSON', '{"invalid}');
      expect(error.code).toBe('PARSING_ERROR');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('WeaveError methods', () => {
    it('should identify retryable errors', () => {
      expect(new WeaveError('Test', { code: 'RATE_LIMIT_EXCEEDED' }).isRetryable()).toBe(true);
      expect(new WeaveError('Test', { code: 'NETWORK_ERROR' }).isRetryable()).toBe(true);
      expect(new WeaveError('Test', { code: 'INVALID_API_KEY' }).isRetryable()).toBe(false);
    });

    it('should determine severity', () => {
      expect(new WeaveError('Test', { code: 'INVALID_API_KEY' }).getSeverity()).toBe('critical');
      expect(new WeaveError('Test', { code: 'RATE_LIMIT_EXCEEDED' }).getSeverity()).toBe('medium');
      expect(new WeaveError('Test', { code: 'UNKNOWN_ERROR' }).getSeverity()).toBe('low');
    });

    it('should serialize to JSON', () => {
      const error = new WeaveError('Test error', {
        code: 'TEST_ERROR',
        context: { detail: 'test' },
      });
      const json = error.toJSON();

      expect(json.code).toBe('TEST_ERROR');
      expect(json.message).toBe('Test error');
      expect(json.context).toEqual({ detail: 'test' });
      expect(json.severity).toBeDefined();
      expect(json.timestamp).toBeDefined();
    });
  });
});
