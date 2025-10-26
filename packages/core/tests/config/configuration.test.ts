/**
 * Configuration Tests
 * Tests for configuration management system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ConfigurationManager,
  DEFAULT_CONFIG,
  configManager,
  getConfig,
  updateConfig,
  resetConfig,
} from '../../src/config/configuration.js';
import type { WeaveConfig } from '../../src/config/configuration.js';

describe('Configuration Manager', () => {
  beforeEach(() => {
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = ConfigurationManager.getInstance();
      const instance2 = ConfigurationManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should be the same as exported configManager', () => {
      expect(ConfigurationManager.getInstance()).toBe(configManager);
    });
  });

  describe('Get Configuration', () => {
    it('should return default configuration', () => {
      const config = getConfig();
      expect(config.batchProcessor.batchSize).toBe(10);
      expect(config.batchProcessor.maxRetries).toBe(3);
      expect(config.provider.timeout).toBe(30000);
    });

    it('should return immutable configuration', () => {
      const config = getConfig();
      expect(() => {
        (config as any).batchProcessor.batchSize = 999;
      }).toThrow();
    });

    it('should return cloned configuration', () => {
      const config1 = getConfig();
      const config2 = getConfig();
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('Update Configuration', () => {
    it('should update batch processor settings', () => {
      updateConfig({
        batchProcessor: {
          batchSize: 20,
          maxRetries: 5,
          retryDelay: 2000,
          timeout: 60000,
          rateLimit: Infinity,
          maxJobHistory: 2000,
          jobTTL: 7200000,
          cleanupInterval: 120000,
          maxConcurrent: 5,
        },
      });

      const config = getConfig();
      expect(config.batchProcessor.batchSize).toBe(20);
      expect(config.batchProcessor.maxRetries).toBe(5);
    });

    it('should update provider settings', () => {
      updateConfig({
        provider: {
          timeout: 60000,
          maxRetries: 5,
          backoffMultiplier: 3,
          maxBackoffDelay: 60000,
        },
      });

      const config = getConfig();
      expect(config.provider.timeout).toBe(60000);
      expect(config.provider.maxRetries).toBe(5);
    });

    it('should preserve other settings when updating one', () => {
      const originalRateLimit = getConfig().rateLimit;

      updateConfig({
        provider: { timeout: 60000, maxRetries: 5, backoffMultiplier: 2, maxBackoffDelay: 30000 },
      });

      const config = getConfig();
      expect(config.rateLimit).toEqual(originalRateLimit);
      expect(config.provider.timeout).toBe(60000);
    });

    it('should deep merge nested objects', () => {
      updateConfig({
        costTracker: {
          enabled: false,
          currency: 'EUR',
          pricing: DEFAULT_CONFIG.costTracker.pricing,
        },
      });

      const config = getConfig();
      expect(config.costTracker.enabled).toBe(false);
      expect(config.costTracker.currency).toBe('EUR');
    });
  });

  describe('Reset Configuration', () => {
    it('should reset to default values', () => {
      updateConfig({
        batchProcessor: {
          batchSize: 999,
          maxRetries: 99,
          retryDelay: 99999,
          timeout: 99999,
          rateLimit: Infinity,
          maxJobHistory: 9999,
          jobTTL: 9999999,
          cleanupInterval: 9999,
          maxConcurrent: 99,
        },
      });

      resetConfig();

      const config = getConfig();
      expect(config.batchProcessor.batchSize).toBe(DEFAULT_CONFIG.batchProcessor.batchSize);
      expect(config.batchProcessor.maxRetries).toBe(DEFAULT_CONFIG.batchProcessor.maxRetries);
    });
  });

  describe('Specific Configuration Getters', () => {
    it('should get batch processor configuration', () => {
      const config = configManager.getBatchProcessorConfig();
      expect(config).toEqual(DEFAULT_CONFIG.batchProcessor);
    });

    it('should get provider configuration', () => {
      const config = configManager.getProviderConfig();
      expect(config).toEqual(DEFAULT_CONFIG.provider);
    });

    it('should get cost tracker configuration', () => {
      const config = configManager.getCostTrackerConfig();
      expect(config).toEqual(DEFAULT_CONFIG.costTracker);
    });

    it('should get rate limit configuration', () => {
      const config = configManager.getRateLimitConfig();
      expect(config).toEqual(DEFAULT_CONFIG.rateLimit);
    });

    it('should get logging configuration', () => {
      const config = configManager.getLoggingConfig();
      expect(config).toEqual(DEFAULT_CONFIG.logging);
    });
  });

  describe('Provider Rate Limit', () => {
    it('should get rate limit for known provider', () => {
      const limit = configManager.getProviderRateLimit('openai');
      expect(limit).toBe(60);
    });

    it('should get rate limit for anthropic', () => {
      const limit = configManager.getProviderRateLimit('anthropic');
      expect(limit).toBe(50);
    });

    it('should return default rate limit for unknown provider', () => {
      const limit = configManager.getProviderRateLimit('unknown-provider');
      expect(limit).toBe(DEFAULT_CONFIG.rateLimit.defaultRPS);
    });

    it('should be case insensitive', () => {
      const limit1 = configManager.getProviderRateLimit('OpenAI');
      const limit2 = configManager.getProviderRateLimit('OPENAI');
      expect(limit1).toBe(limit2);
      expect(limit1).toBe(60);
    });
  });

  describe('Model Pricing', () => {
    it('should get pricing for known model', () => {
      const pricing = configManager.getModelPricing('openai', 'gpt-4');
      expect(pricing).toEqual({ input: 0.03, output: 0.06 });
    });

    it('should get pricing for anthropic model', () => {
      const pricing = configManager.getModelPricing('anthropic', 'claude-3-opus');
      expect(pricing).toEqual({ input: 0.015, output: 0.075 });
    });

    it('should return null for unknown provider', () => {
      const pricing = configManager.getModelPricing('unknown', 'model');
      expect(pricing).toBeNull();
    });

    it('should return null for unknown model', () => {
      const pricing = configManager.getModelPricing('openai', 'unknown-model');
      expect(pricing).toBeNull();
    });

    it('should be case insensitive', () => {
      const pricing1 = configManager.getModelPricing('OpenAI', 'GPT-4');
      const pricing2 = configManager.getModelPricing('openai', 'gpt-4');
      expect(pricing1).toEqual(pricing2);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const result = configManager.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid batch size', () => {
      updateConfig({
        batchProcessor: {
          ...DEFAULT_CONFIG.batchProcessor,
          batchSize: 0,
        },
      });

      const result = configManager.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('batchProcessor.batchSize must be greater than 0');
    });

    it('should detect negative max retries', () => {
      updateConfig({
        batchProcessor: {
          ...DEFAULT_CONFIG.batchProcessor,
          maxRetries: -1,
        },
      });

      const result = configManager.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('batchProcessor.maxRetries must be >= 0');
    });

    it('should detect invalid timeout', () => {
      updateConfig({
        batchProcessor: {
          ...DEFAULT_CONFIG.batchProcessor,
          timeout: 50, // Less than 100ms
        },
      });

      const result = configManager.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('batchProcessor.timeout must be >= 100ms');
    });

    it('should detect multiple validation errors', () => {
      updateConfig({
        batchProcessor: {
          ...DEFAULT_CONFIG.batchProcessor,
          batchSize: 0,
          timeout: 50,
        },
        provider: {
          ...DEFAULT_CONFIG.provider,
          timeout: 50,
        },
      });

      const result = configManager.validate();
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });

  describe('Default Configuration', () => {
    it('should have reasonable defaults', () => {
      expect(DEFAULT_CONFIG.batchProcessor.batchSize).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.batchProcessor.maxRetries).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_CONFIG.batchProcessor.timeout).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.provider.timeout).toBeGreaterThan(0);
    });

    it('should have pricing for major providers', () => {
      expect(DEFAULT_CONFIG.costTracker.pricing.openai).toBeDefined();
      expect(DEFAULT_CONFIG.costTracker.pricing.anthropic).toBeDefined();
      expect(DEFAULT_CONFIG.costTracker.pricing.google).toBeDefined();
    });

    it('should have rate limits for major providers', () => {
      expect(DEFAULT_CONFIG.rateLimit.providers.openai).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.rateLimit.providers.anthropic).toBeGreaterThan(0);
      expect(DEFAULT_CONFIG.rateLimit.providers.google).toBeGreaterThan(0);
    });

    it('should have security-sensitive fields in redaction list', () => {
      expect(DEFAULT_CONFIG.logging.redactedFields).toContain('apiKey');
      expect(DEFAULT_CONFIG.logging.redactedFields).toContain('token');
      expect(DEFAULT_CONFIG.logging.redactedFields).toContain('password');
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of returned configs', () => {
      const config = configManager.getBatchProcessorConfig();
      expect(() => {
        (config as any).batchSize = 999;
      }).toThrow();
    });

    it('should not affect returned config after update', () => {
      const config1 = configManager.getBatchProcessorConfig();
      updateConfig({
        batchProcessor: {
          ...DEFAULT_CONFIG.batchProcessor,
          batchSize: 999,
        },
      });
      const config2 = configManager.getBatchProcessorConfig();

      expect(config1.batchSize).toBe(10);
      expect(config2.batchSize).toBe(999);
    });
  });
});
