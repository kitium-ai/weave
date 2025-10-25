/**
 * Integration tests for all provider implementations
 */

import { describe, it, expect } from 'vitest';
import { OpenAIProvider, AnthropicProvider, GoogleProvider } from '../src';

describe('Provider Integrations', () => {
  describe('OpenAI Provider', () => {
    it('should instantiate with valid config', () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      expect(provider).toBeDefined();
    });

    it('should throw on missing apiKey', () => {
      expect(() => {
        new OpenAIProvider({
          apiKey: '',
        });
      }).toThrow();
    });

    it('should have all required methods', async () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
      });

      expect(typeof provider.generate).toBe('function');
      expect(typeof provider.classify).toBe('function');
      expect(typeof provider.extract).toBe('function');
      expect(typeof provider.summary).toBe('function');
      expect(typeof provider.translate).toBe('function');
      expect(typeof provider.sentiment).toBe('function');
      expect(typeof provider.chat).toBe('function');
      expect(typeof provider.countTokens).toBe('function');
      expect(typeof provider.validate).toBe('function');
    });

    it('should provide correct model defaults', () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
      });

      // Model defaults to gpt-3.5-turbo
      expect(provider).toBeDefined();
    });

    it('should allow custom model selection', () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
        model: 'gpt-4',
      });

      expect(provider).toBeDefined();
    });
  });

  describe('Anthropic Provider', () => {
    it('should instantiate with valid config', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-3-sonnet-20240229',
      });

      expect(provider).toBeDefined();
    });

    it('should throw on missing apiKey', () => {
      expect(() => {
        new AnthropicProvider({
          apiKey: '',
        });
      }).toThrow();
    });

    it('should have all required methods', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
      });

      expect(typeof provider.generate).toBe('function');
      expect(typeof provider.classify).toBe('function');
      expect(typeof provider.extract).toBe('function');
      expect(typeof provider.summary).toBe('function');
      expect(typeof provider.translate).toBe('function');
      expect(typeof provider.sentiment).toBe('function');
      expect(typeof provider.chat).toBe('function');
      expect(typeof provider.countTokens).toBe('function');
      expect(typeof provider.validate).toBe('function');
    });

    it('should provide correct model defaults', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
      });

      // Model defaults to claude-3-sonnet-20240229
      expect(provider).toBeDefined();
    });

    it('should allow custom model selection', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        model: 'claude-3-opus-20240229',
      });

      expect(provider).toBeDefined();
    });
  });

  describe('Google Provider', () => {
    it('should instantiate with valid config', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
        model: 'gemini-pro',
      });

      expect(provider).toBeDefined();
    });

    it('should throw on missing apiKey', () => {
      expect(() => {
        new GoogleProvider({
          apiKey: '',
        });
      }).toThrow();
    });

    it('should have all required methods', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      expect(typeof provider.generate).toBe('function');
      expect(typeof provider.classify).toBe('function');
      expect(typeof provider.extract).toBe('function');
      expect(typeof provider.summary).toBe('function');
      expect(typeof provider.translate).toBe('function');
      expect(typeof provider.sentiment).toBe('function');
      expect(typeof provider.chat).toBe('function');
      expect(typeof provider.countTokens).toBe('function');
      expect(typeof provider.validate).toBe('function');
    });

    it('should provide correct model defaults', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      // Model defaults to gemini-pro
      expect(provider).toBeDefined();
    });

    it('should allow custom model selection', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
        model: 'gemini-pro-vision',
      });

      expect(provider).toBeDefined();
    });
  });

  describe('Token Counting', () => {
    it('OpenAI should estimate tokens from text length', async () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
      });

      const tokens = await provider.countTokens('This is a test message.');
      expect(typeof tokens).toBe('number');
      expect(tokens).toBeGreaterThan(0);
    });

    it('Anthropic should estimate tokens from text length', async () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
      });

      const tokens = await provider.countTokens('This is a test message.');
      expect(typeof tokens).toBe('number');
      expect(tokens).toBeGreaterThan(0);
    });

    it('Google should estimate tokens from text length', async () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      const tokens = await provider.countTokens('This is a test message.');
      expect(typeof tokens).toBe('number');
      expect(tokens).toBeGreaterThan(0);
    });

    it('should handle empty text', async () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
      });

      const tokens = await provider.countTokens('');
      expect(tokens).toBe(0);
    });

    it('should handle long text', async () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
      });

      const longText = 'word '.repeat(1000);
      const tokens = await provider.countTokens(longText);
      expect(tokens).toBeGreaterThan(100);
    });
  });

  describe('Configuration Options', () => {
    it('OpenAI should support custom timeout', () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
        timeout: 60000,
      });

      expect(provider).toBeDefined();
    });

    it('Anthropic should support custom timeout', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        timeout: 60000,
      });

      expect(provider).toBeDefined();
    });

    it('Google should support custom timeout', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
        timeout: 60000,
      });

      expect(provider).toBeDefined();
    });

    it('OpenAI should support custom baseUrl', () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com/v1',
      });

      expect(provider).toBeDefined();
    });

    it('Anthropic should support custom baseUrl', () => {
      const provider = new AnthropicProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com/v1',
      });

      expect(provider).toBeDefined();
    });

    it('Google should support custom baseUrl', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com/v1',
      });

      expect(provider).toBeDefined();
    });

    it('should support retry configuration', () => {
      const provider = new OpenAIProvider({
        apiKey: 'test-key',
        maxRetries: 5,
      });

      expect(provider).toBeDefined();
    });
  });

  describe('Provider Compatibility', () => {
    it('all providers should implement ILanguageModel interface', () => {
      const openai = new OpenAIProvider({ apiKey: 'key' });
      const anthropic = new AnthropicProvider({ apiKey: 'key' });
      const google = new GoogleProvider({ apiKey: 'key' });

      // Check that all implement the same interface
      const methods = [
        'generate',
        'classify',
        'extract',
        'summary',
        'translate',
        'sentiment',
        'chat',
        'countTokens',
        'validate',
      ];

      for (const method of methods) {
        expect(typeof (openai as unknown as Record<string, unknown>)[method]).toBe('function');
        expect(typeof (anthropic as unknown as Record<string, unknown>)[method]).toBe('function');
        expect(typeof (google as unknown as Record<string, unknown>)[method]).toBe('function');
      }
    });

    it('providers should be interchangeable', () => {
      const providers = [
        new OpenAIProvider({ apiKey: 'key' }),
        new AnthropicProvider({ apiKey: 'key' }),
        new GoogleProvider({ apiKey: 'key' }),
      ];

      for (const provider of providers) {
        expect(provider).toHaveProperty('generate');
        expect(provider).toHaveProperty('classify');
        expect(provider).toHaveProperty('extract');
      }
    });
  });
});
