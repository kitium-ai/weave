/**
 * Tests for provider infrastructure: circuit breaker, router, and registry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitBreakerState,
  ProviderRegistry,
  MockLanguageModel,
} from '../src';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-provider', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 100,
    });
  });

  describe('execute', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should track successful requests', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      await breaker.execute(fn);

      const metrics = breaker.getMetrics();
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.totalRequests).toBe(1);
    });

    it('should fail after threshold number of failures', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failFn)).rejects.toThrow();
      }

      const metrics = breaker.getMetrics();
      expect(metrics.failedRequests).toBe(3);
      expect(metrics.state).toBe(CircuitBreakerState.OPEN);
    });

    it('should reject requests when circuit is open', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failFn)).rejects.toThrow();
      }

      // Try to execute when open
      await expect(breaker.execute(vi.fn())).rejects.toThrow(
        'Circuit breaker test-provider is OPEN'
      );
    });

    it('should transition to half-open after timeout', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failFn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should transition to half-open on next attempt
      const successFn = vi.fn().mockResolvedValue('success');
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitBreakerState.HALF_OPEN);
    });

    it('should close circuit after successful threshold in half-open state', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failFn)).rejects.toThrow();
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Succeed twice to close circuit
      const successFn = vi.fn().mockResolvedValue('success');
      await breaker.execute(successFn);
      await breaker.execute(successFn);

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('getMetrics', () => {
    it('should return accurate metrics', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      await breaker.execute(fn);

      const metrics = breaker.getMetrics();
      expect(metrics.totalRequests).toBe(1);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.state).toBe(CircuitBreakerState.CLOSED);
    });

    it('should track last failure time', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));
      const beforeTime = new Date();

      await expect(breaker.execute(failFn)).rejects.toThrow();

      const metrics = breaker.getMetrics();
      expect(metrics.lastFailureTime).toBeDefined();
      expect(metrics.lastFailureTime!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    });
  });

  describe('getSuccessRate', () => {
    it('should return 100% for no requests', () => {
      expect(breaker.getSuccessRate()).toBe(100);
    });

    it('should calculate success rate correctly', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      await breaker.execute(fn);
      await breaker.execute(fn);
      await expect(breaker.execute(failFn)).rejects.toThrow();

      const rate = breaker.getSuccessRate();
      expect(rate).toBeCloseTo(66.67, 1);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker state', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(failFn)).rejects.toThrow();
      }

      breaker.reset();

      const metrics = breaker.getMetrics();
      expect(metrics.state).toBe(CircuitBreakerState.CLOSED);
      expect(metrics.totalRequests).toBe(0);
      expect(metrics.successfulRequests).toBe(0);
      expect(metrics.failedRequests).toBe(0);
    });
  });
});

describe('CircuitBreakerManager', () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  describe('getBreaker', () => {
    it('should create breaker if not exists', () => {
      const breaker = manager.getBreaker('test-provider');
      expect(breaker).toBeDefined();
    });

    it('should return same breaker for same provider name', () => {
      const breaker1 = manager.getBreaker('test-provider');
      const breaker2 = manager.getBreaker('test-provider');
      expect(breaker1).toBe(breaker2);
    });

    it('should create different breakers for different providers', () => {
      const breaker1 = manager.getBreaker('provider1');
      const breaker2 = manager.getBreaker('provider2');
      expect(breaker1).not.toBe(breaker2);
    });
  });

  describe('execute', () => {
    it('should execute function through circuit breaker', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await manager.execute('test-provider', fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should use provided config for new breaker', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const config = {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 200,
      };

      await manager.execute('custom-provider', fn, config);

      const breaker = manager.getBreaker('custom-provider');
      const metrics = breaker.getMetrics();
      expect(metrics.totalRequests).toBe(1);
    });
  });

  describe('getHealth', () => {
    it('should return health status for all breakers', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      await manager.execute('provider1', fn);
      await manager.execute('provider2', fn);

      const health = manager.getHealth();
      expect(health['provider1']).toBeDefined();
      expect(health['provider2']).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset specific breaker', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open a breaker
      const breaker = manager.getBreaker('test-provider', {
        failureThreshold: 2,
        successThreshold: 1,
        timeout: 100,
      });

      for (let i = 0; i < 2; i++) {
        await expect(manager.execute('test-provider', failFn)).rejects.toThrow();
      }

      manager.reset('test-provider');

      const metrics = breaker.getMetrics();
      expect(metrics.state).toBe(CircuitBreakerState.CLOSED);
    });

    it('should reset all breakers', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('fail'));

      // Open multiple breakers
      const config = {
        failureThreshold: 2,
        successThreshold: 1,
        timeout: 100,
      };

      for (const provider of ['provider1', 'provider2']) {
        manager.getBreaker(provider, config);
        for (let i = 0; i < 2; i++) {
          await expect(manager.execute(provider, failFn)).rejects.toThrow();
        }
      }

      manager.resetAll();

      const health = manager.getHealth();
      expect(health['provider1'].state).toBe(CircuitBreakerState.CLOSED);
      expect(health['provider2'].state).toBe(CircuitBreakerState.CLOSED);
    });
  });
});

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = ProviderRegistry.getInstance();
    registry.clear();
  });

  describe('register', () => {
    it('should register a provider', () => {
      const provider = new MockLanguageModel();
      registry.register('test-provider', provider);

      expect(registry.has('test-provider')).toBe(true);
    });

    it('should overwrite existing provider with same name', () => {
      const provider1 = new MockLanguageModel();
      const provider2 = new MockLanguageModel();

      registry.register('test-provider', provider1);
      registry.register('test-provider', provider2);

      expect(registry.get('test-provider')).toBe(provider2);
    });
  });

  describe('get', () => {
    it('should retrieve registered provider', () => {
      const provider = new MockLanguageModel();
      registry.register('test-provider', provider);

      const retrieved = registry.get('test-provider');
      expect(retrieved).toBe(provider);
    });

    it('should throw error for non-existent provider', () => {
      expect(() => registry.get('non-existent')).toThrow();
    });
  });

  describe('has', () => {
    it('should return true for registered provider', () => {
      registry.register('test-provider', new MockLanguageModel());
      expect(registry.has('test-provider')).toBe(true);
    });

    it('should return false for non-registered provider', () => {
      expect(registry.has('test-provider')).toBe(false);
    });
  });

  describe('listProviders', () => {
    it('should return list of registered provider names', () => {
      registry.register('provider1', new MockLanguageModel());
      registry.register('provider2', new MockLanguageModel());

      const providers = registry.listProviders();
      expect(providers).toContain('provider1');
      expect(providers).toContain('provider2');
      expect(providers.length).toBe(2);
    });

    it('should return empty array when no providers registered', () => {
      const providers = registry.listProviders();
      expect(providers).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should clear all registered providers', () => {
      registry.register('provider1', new MockLanguageModel());
      registry.register('provider2', new MockLanguageModel());

      registry.clear();

      expect(registry.listProviders().length).toBe(0);
      expect(registry.has('provider1')).toBe(false);
    });
  });

  describe('createProvider', () => {
    it('should create mock provider from config', async () => {
      const provider = await registry.createProvider({ type: 'mock' });
      expect(provider).toBeInstanceOf(MockLanguageModel);
    });

    it('should throw error for unsupported provider type', async () => {
      await expect(registry.createProvider({ type: 'unsupported' } as any)).rejects.toThrow(
        'not supported'
      );
    });

    it('should throw error for invalid configuration', async () => {
      await expect(registry.createProvider({ type: 'openai' } as any)).rejects.toThrow(
        'Invalid provider configuration'
      );
    });
  });
});
