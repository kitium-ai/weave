/**
 * Tests for provider functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MockLanguageModel } from '../src/providers/mock.js';
import { getProviderRegistry } from '../src/providers/registry.js';

describe('Providers', () => {
  describe('MockLanguageModel', () => {
    let model: MockLanguageModel;

    beforeEach(() => {
      model = new MockLanguageModel();
    });

    it('should generate text', async () => {
      const result = await model.generate('Test prompt');

      expect(result.text).toBeDefined();
      expect(result.tokenCount).toBeDefined();
      expect(result.tokenCount.input).toBeGreaterThan(0);
      expect(result.tokenCount.output).toBeGreaterThan(0);
      expect(result.finishReason).toBe('stop');
    });

    it('should classify text', async () => {
      const result = await model.classify('Test text', ['positive', 'negative']);

      expect(result.label).toBeDefined();
      expect(['positive', 'negative']).toContain(result.label);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should extract data', async () => {
      const schema = { name: 'string', age: 'number' };
      const result = await model.extract('John is 30', schema);

      expect(result).toBeDefined();
    });

    it('should support custom responses', async () => {
      const customText = 'Custom response';
      model.setResponse('generate:test', customText);

      const result = await model.generate('test');
      expect(result.text).toBe(customText);
    });

    it('should support delayed responses', async () => {
      model.setDelay('generate', 100);

      const start = Date.now();
      await model.generate('test');
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(100);
    });

    it('should validate provider', async () => {
      const isValid = await model.validate();
      expect(isValid).toBe(true);
    });

    it('should count tokens', async () => {
      const tokens = await model.countTokens('hello world test');
      expect(tokens).toBe(3);
    });

    it('should handle chat messages', async () => {
      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi' },
      ];

      const response = await model.chat(messages);
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should handle summarization', async () => {
      const text = 'This is a long text that should be summarized';
      const summary = await model.summary(text);

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
    });

    it('should handle translation', async () => {
      const translation = await model.translate('Hello world', 'Spanish');

      expect(translation).toBeDefined();
      expect(translation).toContain('Spanish');
    });

    it('should handle sentiment analysis', async () => {
      const sentiment = await model.sentiment('I love this!');

      expect(sentiment).toBeDefined();
      expect(typeof sentiment).toBe('object');
    });
  });

  describe('ProviderRegistry', () => {
    let registry = getProviderRegistry();

    beforeEach(() => {
      registry = getProviderRegistry();
      registry.clear();
    });

    afterEach(() => {
      registry.clear();
    });

    it('should register provider', () => {
      const model = new MockLanguageModel();
      registry.register('test-provider', model);

      expect(registry.has('test-provider')).toBe(true);
    });

    it('should retrieve registered provider', () => {
      const model = new MockLanguageModel();
      registry.register('test', model);

      const retrieved = registry.get('test');
      expect(retrieved).toBe(model);
    });

    it('should list all providers', () => {
      const model1 = new MockLanguageModel();
      const model2 = new MockLanguageModel();

      registry.register('provider1', model1);
      registry.register('provider2', model2);

      const list = registry.listProviders();
      expect(list).toContain('provider1');
      expect(list).toContain('provider2');
    });

    it('should clear all providers', () => {
      registry.register('provider1', new MockLanguageModel());
      registry.register('provider2', new MockLanguageModel());

      registry.clear();

      expect(registry.listProviders()).toHaveLength(0);
    });

    it('should throw on getting non-existent provider', () => {
      expect(() => registry.get('non-existent')).toThrow();
    });
  });
});
