/**
 * Tests for Weave main class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Weave, createWeave } from '../src/weave.js';
import type { WeaveConfig } from '../src/types/index.js';
import { ValidationError } from '@weaveai/shared';

describe('Weave', () => {
  let config: WeaveConfig;

  beforeEach(() => {
    config = {
      provider: {
        type: 'mock',
      },
    };
  });

  describe('initialization', () => {
    it('should create Weave instance', () => {
      const weave = new Weave(config);
      expect(weave).toBeDefined();
      expect(weave.getModel()).toBeDefined();
    });

    it('should use createWeave factory', () => {
      const weave = createWeave(config);
      expect(weave).toBeDefined();
      expect(weave).toBeInstanceOf(Weave);
    });

    it('should throw on missing config', () => {
      expect(() => new Weave(undefined as unknown as WeaveConfig)).toThrow();
    });

    it('should throw on missing provider', () => {
      expect(() => new Weave({} as WeaveConfig)).toThrow();
    });
  });

  describe('generate operation', () => {
    it('should generate text', async () => {
      const weave = new Weave(config);
      const result = await weave.generate('Test prompt');

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.tokenCount).toBeDefined();
      expect(result.finishReason).toBe('stop');
    });

    it('should throw on empty prompt', async () => {
      const weave = new Weave(config);
      await expect(weave.generate('')).rejects.toThrow(ValidationError);
    });

    it('should pass options to model', async () => {
      const weave = new Weave(config);
      const result = await weave.generate('Test', {
        maxTokens: 100,
        temperature: 0.5,
      });

      expect(result.text).toBeDefined();
    });
  });

  describe('classify operation', () => {
    it('should classify text', async () => {
      const weave = new Weave(config);
      const result = await weave.classify('Test text', ['positive', 'negative']);

      expect(result).toBeDefined();
      expect(result.label).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.scores).toBeDefined();
    });

    it('should throw on empty text', async () => {
      const weave = new Weave(config);
      await expect(weave.classify('', ['positive'])).rejects.toThrow(ValidationError);
    });

    it('should throw on empty labels', async () => {
      const weave = new Weave(config);
      await expect(weave.classify('Test', [])).rejects.toThrow(ValidationError);
    });

    it('should include scores for all labels', async () => {
      const weave = new Weave(config);
      const labels = ['positive', 'negative', 'neutral'];
      const result = await weave.classify('Test', labels);

      expect(Object.keys(result.scores!)).toHaveLength(3);
      expect(result.scores).toHaveProperty('positive');
      expect(result.scores).toHaveProperty('negative');
      expect(result.scores).toHaveProperty('neutral');
    });
  });

  describe('extract operation', () => {
    it('should extract data', async () => {
      const weave = new Weave(config);
      const schema = { name: 'string', age: 'number' };
      const result = await weave.extract('John is 30 years old', schema);

      expect(result).toBeDefined();
    });

    it('should throw on empty text', async () => {
      const weave = new Weave(config);
      const schema = { name: 'string' };
      await expect(weave.extract('', schema)).rejects.toThrow(ValidationError);
    });

    it('should throw on invalid schema', async () => {
      const weave = new Weave(config);
      // null is not a valid schema (not an object)
      await expect(weave.extract('Test', null)).rejects.toThrow(ValidationError);
    });
  });

  describe('provider access', () => {
    it('should provide access to underlying model', () => {
      const weave = new Weave(config);
      const model = weave.getModel();

      expect(model).toBeDefined();
      expect(model.generate).toBeDefined();
      expect(model.classify).toBeDefined();
    });
  });
});
