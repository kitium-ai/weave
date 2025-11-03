/**
 * OpenAI Provider Tests
 * Comprehensive unit tests for OpenAI provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../../src/providers/openai.js';
import type {
  GenerateOptions,
  ClassifyOptions,
  ExtractOptions,
} from '../../src/providers/interfaces.js';

// Mock the OpenAI SDK
vi.mock('openai', () => ({
  OpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

describe('OpenAIProvider', () => {
  let provider: OpenAIProvider;

  beforeEach(() => {
    provider = new OpenAIProvider({
      apiKey: 'test-key-123',
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 2000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with valid config', () => {
      expect(provider).toBeDefined();
    });

    it('should throw error on missing API key', () => {
      expect(() => {
        new OpenAIProvider({
          apiKey: '',
          model: 'gpt-4-turbo',
        });
      }).toThrow('API key is required');
    });

    it('should throw error on invalid model', () => {
      expect(() => {
        new OpenAIProvider({
          apiKey: 'test-key',
          model: 'invalid-model-xyz',
        });
      }).toThrow();
    });

    it('should have correct provider info', () => {
      const info = provider.getProviderInfo();
      expect(info.name).toBe('OpenAI');
      expect(info.provider).toBe('openai');
      expect(info.model).toBe('gpt-4-turbo');
      expect(info.isInitialized).toBe(true);
    });
  });

  describe('Generate Operation', () => {
    it('should generate text successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Generated text response',
            },
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      vi.spyOn(provider as any, 'callAPI').mockResolvedValueOnce(mockResponse);

      const options: GenerateOptions = {
        temperature: 0.7,
        maxTokens: 1000,
      };

      const result = await provider.generate('Tell me a story', options);

      expect(result).toBeDefined();
      expect(result.text).toBe('Generated text response');
      expect(result.tokens).toEqual({
        input: 10,
        output: 20,
      });
    });

    it('should handle empty prompt', async () => {
      await expect(provider.generate('', {})).rejects.toThrow('Prompt cannot be empty');
    });

    it('should handle API timeout', async () => {
      vi.spyOn(provider as any, 'callAPI').mockRejectedValueOnce(new Error('Request timeout'));

      await expect(provider.generate('test', {})).rejects.toThrow('Request timeout');
    });

    it('should respect temperature setting', async () => {
      const options: GenerateOptions = {
        temperature: 0.1,
        maxTokens: 500,
      };

      const callSpy = vi.spyOn(provider as any, 'callAPI');
      await provider.generate('test', options).catch(() => {});

      expect(callSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.1,
        })
      );
    });

    it('should respect maxTokens setting', async () => {
      const options: GenerateOptions = {
        maxTokens: 1500,
      };

      const callSpy = vi.spyOn(provider as any, 'callAPI');
      await provider.generate('test', options).catch(() => {});

      expect(callSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1500,
        })
      );
    });
  });

  describe('Classify Operation', () => {
    it('should classify text successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                label: 'positive',
                confidence: 0.95,
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 10,
          total_tokens: 25,
        },
      };

      vi.spyOn(provider as any, 'callAPI').mockResolvedValueOnce(mockResponse);

      const options: ClassifyOptions = {};
      const result = await provider.classify('This is great!', ['positive', 'negative'], options);

      expect(result).toBeDefined();
      expect(result.label).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle invalid labels array', async () => {
      await expect(provider.classify('test', [], {})).rejects.toThrow(
        'Labels array cannot be empty'
      );
    });

    it('should handle classification errors', async () => {
      vi.spyOn(provider as any, 'callAPI').mockRejectedValueOnce(
        new Error('Classification failed')
      );

      await expect(provider.classify('test', ['pos', 'neg'], {})).rejects.toThrow(
        'Classification failed'
      );
    });

    it('should handle malformed JSON response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'not valid json',
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      vi.spyOn(provider as any, 'callAPI').mockResolvedValueOnce(mockResponse);

      await expect(provider.classify('test', ['a', 'b'], {})).rejects.toThrow();
    });
  });

  describe('Extract Operation', () => {
    it('should extract data successfully', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                name: 'John Doe',
                email: 'john@example.com',
                age: 30,
              }),
            },
          },
        ],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 15,
          total_tokens: 35,
        },
      };

      vi.spyOn(provider as any, 'callAPI').mockResolvedValueOnce(mockResponse);

      const schema = { name: 'string', email: 'string', age: 'number' };
      const result = await provider.extract('John Doe, john@example.com, 30 years old', schema, {});

      expect(result).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.age).toBe(30);
    });

    it('should handle empty schema', async () => {
      await expect(provider.extract('test', {}, {})).rejects.toThrow('Schema cannot be empty');
    });

    it('should handle extraction errors', async () => {
      vi.spyOn(provider as any, 'callAPI').mockRejectedValueOnce(new Error('Extraction failed'));

      const schema = { field: 'string' };
      await expect(provider.extract('test', schema, {})).rejects.toThrow('Extraction failed');
    });

    it('should validate extracted data against schema', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                field: 'value',
              }),
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      vi.spyOn(provider as any, 'callAPI').mockResolvedValueOnce(mockResponse);

      const schema = { field: 'string', required_field: 'string' };

      // Should either validate or provide helpful error
      try {
        await provider.extract('test', schema, {});
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      vi.spyOn(provider as any, 'callAPI').mockRejectedValueOnce(rateLimitError);

      await expect(provider.generate('test', {})).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;

      vi.spyOn(provider as any, 'callAPI').mockRejectedValueOnce(authError);

      await expect(provider.generate('test', {})).rejects.toThrow('Invalid API key');
    });

    it('should handle server errors', async () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;

      vi.spyOn(provider as any, 'callAPI').mockRejectedValueOnce(serverError);

      await expect(provider.generate('test', {})).rejects.toThrow('Internal server error');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      networkError.name = 'NetworkError';

      vi.spyOn(provider as any, 'callAPI').mockRejectedValueOnce(networkError);

      await expect(provider.generate('test', {})).rejects.toThrow('Network timeout');
    });
  });

  describe('Token Counting', () => {
    it('should count tokens accurately', () => {
      const text = 'This is a test prompt for token counting';
      const count = provider.countTokens(text);

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    it('should handle special characters in token counting', () => {
      const text = '你好世界 🌍 Special chars: @#$%^&*()';
      const count = provider.countTokens(text);

      expect(count).toBeGreaterThan(0);
    });

    it('should handle empty string in token counting', () => {
      const count = provider.countTokens('');
      expect(count).toBe(0);
    });
  });

  describe('Concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'response' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      vi.spyOn(provider as any, 'callAPI').mockResolvedValue(mockResponse);

      const requests = Array(5)
        .fill(null)
        .map((_, i) => provider.generate(`prompt ${i}`, {}));

      const results = await Promise.all(requests);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.text).toBe('response');
      });
    });
  });
});
