/**
 * Tests for utilities: retry strategy and HTTP client
 */

import { describe, it, expect } from 'vitest';
import { calculateBackoffDelay, isRetryableError, DEFAULT_RETRY_CONFIG, withRetry } from '../src';

describe('Retry Strategy', () => {
  describe('calculateBackoffDelay', () => {
    it('should use default config when none provided', () => {
      const delay = calculateBackoffDelay(0);
      expect(delay).toBeGreaterThanOrEqual(DEFAULT_RETRY_CONFIG.initialDelayMs * 0.9);
      expect(delay).toBeLessThanOrEqual(DEFAULT_RETRY_CONFIG.initialDelayMs * 1.1);
    });

    it('should calculate exponential backoff', () => {
      const config = {
        initialDelayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 10000,
        jitterFactor: 0,
      };

      const delay0 = calculateBackoffDelay(0, config);
      const delay1 = calculateBackoffDelay(1, config);
      const delay2 = calculateBackoffDelay(2, config);

      expect(delay0).toBe(100);
      expect(delay1).toBe(200);
      expect(delay2).toBe(400);
    });

    it('should respect max delay', () => {
      const config = {
        initialDelayMs: 100,
        backoffMultiplier: 10,
        maxDelayMs: 1000,
        jitterFactor: 0,
      };

      const delay = calculateBackoffDelay(5, config);
      expect(delay).toBeLessThanOrEqual(1000);
    });

    it('should add jitter to delay', () => {
      const config = {
        initialDelayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 10000,
        jitterFactor: 0.1,
      };

      const delays = Array.from({ length: 10 }, () => calculateBackoffDelay(0, config));
      const baseDelay = 100;
      const allBetweenRange = delays.every((d) => d >= baseDelay * 0.9 && d <= baseDelay * 1.1);

      expect(allBetweenRange).toBe(true);
    });

    it('should never return negative delay', () => {
      const config = {
        initialDelayMs: 1,
        backoffMultiplier: 2,
        maxDelayMs: 10000,
        jitterFactor: 0.5,
      };

      for (let i = 0; i < 100; i++) {
        const delay = calculateBackoffDelay(0, config);
        expect(delay).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new Error('network error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const error = new Error('timeout occurred');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 5xx status codes', () => {
      const error = { status: 500 };
      expect(isRetryableError(error)).toBe(true);

      const error503 = { status: 503 };
      expect(isRetryableError(error503)).toBe(true);
    });

    it('should return true for 429 (rate limit) status', () => {
      const error = { status: 429 };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 408 (timeout) status', () => {
      const error = { status: 408 };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for 4xx errors (except 408, 429)', () => {
      const error401 = { status: 401 };
      expect(isRetryableError(error401)).toBe(false);

      const error404 = { status: 404 };
      expect(isRetryableError(error404)).toBe(false);
    });

    it('should return false for non-retryable errors', () => {
      const error = new Error('Some other error');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should handle non-Error objects', () => {
      expect(isRetryableError('string')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe('withRetry decorator', () => {
    it('should execute function successfully on first try', async () => {
      const fn = async () => 'success';
      const retryFn = withRetry(fn);

      const result = await retryFn();
      expect(result).toBe('success');
    });

    it('should retry on retryable error', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('network error');
        }
        return 'success';
      };

      const retryFn = withRetry(fn, { maxRetries: 2 });
      const result = await retryFn();

      expect(result).toBe('success');
      expect(callCount).toBe(2);
    });

    it('should give up after max retries', async () => {
      const fn = async () => {
        throw new Error('network error');
      };

      const retryFn = withRetry(fn, { maxRetries: 2 });

      await expect(retryFn()).rejects.toThrow('network error');
    });

    it('should not retry on non-retryable errors', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        throw new Error('Some other error');
      };

      const retryFn = withRetry(fn, { maxRetries: 3 });

      await expect(retryFn()).rejects.toThrow('Some other error');
      expect(callCount).toBe(1);
    });

    it('should pass arguments through', async () => {
      const fn = async (a: number, b: string) => `${a}-${b}`;
      const retryFn = withRetry(fn);

      const result = await retryFn(42, 'test');
      expect(result).toBe('42-test');
    });
  });

  describe('DEFAULT_RETRY_CONFIG', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBeGreaterThan(0);
      expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBeGreaterThan(0);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBeGreaterThan(DEFAULT_RETRY_CONFIG.initialDelayMs);
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBeGreaterThan(1);
      expect(DEFAULT_RETRY_CONFIG.jitterFactor).toBeGreaterThanOrEqual(0);
    });
  });
});
