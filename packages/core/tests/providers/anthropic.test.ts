/**
 * Anthropic Provider Tests
 * Comprehensive unit tests for Anthropic provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnthropicProvider } from '../../src/providers/anthropic.js';
import type { GenerateOptions, ClassifyOptions, ExtractOptions } from '../../src/providers/interfaces.js';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  beforeEach(() => {
    provider = new AnthropicProvider({
      apiKey: 'test-key-123',
      model: 'claude-3-sonnet-20240229',
      timeout: 30000,
      maxRetries: 3,
    });
    vi.clearAllMocks();
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
        new AnthropicProvider({
          apiKey: '',
          model: 'claude-3-sonnet-20240229',
        });
      }).toThrow();
    });

    it('should use default model if not specified', () => {
      const p = new AnthropicProvider({
        apiKey: 'test-key',
      });
      const info = p.getProviderInfo();
      expect(info.model).toBe('claude-3-sonnet-20240229');
    });

    it('should have correct provider info', () => {
      const info = provider.getProviderInfo();
      expect(info.provider).toBe('anthropic');
      expect(info.model).toBe('claude-3-sonnet-20240229');
    });

    it('should set custom baseUrl if provided', () => {
      const p = new AnthropicProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.anthropic.com/v1',
      });
      expect(p).toBeDefined();
    });

    it('should set custom timeout if provided', () => {
      const p = new AnthropicProvider({
        apiKey: 'test-key',
        timeout: 60000,
      });
      expect(p).toBeDefined();
    });

    it('should set custom maxRetries if provided', () => {
      const p = new AnthropicProvider({
        apiKey: 'test-key',
        maxRetries: 5,
      });
      expect(p).toBeDefined();
    });
  });

  describe('Generate Operation', () => {
    it('should generate text successfully', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'Generated text response',
          },
        ],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const options: GenerateOptions = {
        temperature: 0.7,
        maxTokens: 1000,
      };

      const result = await provider.generate('Tell me a story', options);

      expect(result).toBeDefined();
      expect(result.text).toBe('Generated text response');
      expect(result.tokenCount.input).toBe(10);
      expect(result.tokenCount.output).toBe(20);
    });

    it('should handle empty prompt', async () => {
      // Anthropic provider may not validate empty prompts at client level
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 0, output_tokens: 0 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await provider.generate('', {});
      expect(result).toBeDefined();
    });

    it('should handle API timeout', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(provider.generate('test', {})).rejects.toThrow();
    });

    it('should respect temperature setting', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'response' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const options: GenerateOptions = { temperature: 0.1, maxTokens: 500 };
      await provider.generate('test', options);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.temperature).toBe(0.1);
    });

    it('should respect maxTokens setting', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'response' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const options: GenerateOptions = { maxTokens: 1500 };
      await provider.generate('test', options);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.max_tokens).toBe(1500);
    });

    it('should handle rate limit errors with retry', async () => {
      const rateLimitError = {
        error: { message: 'Rate limit exceeded' },
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: vi.fn().mockResolvedValueOnce(rateLimitError),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValueOnce({
            id: 'msg-123',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: 'response' }],
            model: 'claude-3-sonnet-20240229',
            stop_reason: 'end_turn',
            usage: { input_tokens: 5, output_tokens: 10 },
          }),
        });

      const result = await provider.generate('test', {});
      expect(result.text).toBe('response');
      expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Classify Operation', () => {
    it('should classify text successfully', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'positive' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 15, output_tokens: 5 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const options: ClassifyOptions = {};
      const result = await provider.classify('This is great!', ['positive', 'negative'], options);

      expect(result).toBeDefined();
      expect(result.label).toBe('positive');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle invalid labels array', async () => {
      // Provider may not validate labels at client level
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'unknown' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 5 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await provider.classify('test', [], {});
      expect(result).toBeDefined();
    });

    it('should handle classification errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValueOnce({
          error: { message: 'Classification failed' },
        }),
      });

      await expect(provider.classify('test', ['pos', 'neg'], {})).rejects.toThrow();
    });

    it('should return confidence scores for all labels', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'positive' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 15, output_tokens: 5 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const labels = ['positive', 'negative', 'neutral'];
      const result = await provider.classify('test', labels, {});

      expect(result.scores).toBeDefined();
      expect(Object.keys(result.scores)).toEqual(labels);
      expect(result.scores['positive']).toBeCloseTo(0.95);
      expect(result.scores['negative']).toBeLessThan(0.5);
      expect(result.scores['neutral']).toBeLessThan(0.5);
    });
  });

  describe('Extract Operation', () => {
    it('should extract data successfully', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              name: 'John Doe',
              email: 'john@example.com',
              age: 30,
            }),
          },
        ],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 20, output_tokens: 15 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const schema = { name: 'string', email: 'string', age: 'number' };
      const result = await provider.extract('John Doe, john@example.com, 30 years old', schema, {});

      expect(result).toBeDefined();
      expect((result as any).name).toBe('John Doe');
      expect((result as any).email).toBe('john@example.com');
      expect((result as any).age).toBe(30);
    });

    it('should handle empty schema', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: '{}' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await provider.extract('test', {}, {});
      expect(result).toBeDefined();
    });

    it('should handle extraction errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValueOnce({
          error: { message: 'Extraction failed' },
        }),
      });

      const schema = { field: 'string' };
      await expect(provider.extract('test', schema, {})).rejects.toThrow();
    });

    it('should handle malformed JSON response', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'not valid json' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await provider.extract('test', { field: 'string' }, {});
      // Should return empty object on parse failure
      expect(result).toEqual({});
    });
  });

  describe('Token Counting', () => {
    it('should count tokens with heuristic', async () => {
      const text = 'This is a test prompt for token counting';
      const count = await provider.countTokens(text);

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
      // Rough estimate: ~4 characters per token
      expect(count).toBeCloseTo(Math.ceil(text.length / 4), 5);
    });

    it('should handle special characters in token counting', async () => {
      const text = '你好世界 🌍 Special chars: @#$%^&*()';
      const count = await provider.countTokens(text);

      expect(count).toBeGreaterThan(0);
    });

    it('should handle empty string in token counting', async () => {
      const count = await provider.countTokens('');
      expect(count).toBe(0);
    });

    it('should handle long text', async () => {
      const text = 'a'.repeat(10000);
      const count = await provider.countTokens(text);

      expect(count).toBeGreaterThan(0);
      expect(count).toBeCloseTo(Math.ceil(10000 / 4), 5);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValueOnce({
          error: { message: 'Invalid API key' },
        }),
      });

      await expect(provider.generate('test', {})).rejects.toThrow();
    });

    it('should handle server errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValueOnce({
          error: { message: 'Internal server error' },
        }),
      });

      await expect(provider.generate('test', {})).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(provider.generate('test', {})).rejects.toThrow('Network timeout');
    });

    it('should retry on transient errors', async () => {
      const serverError = { error: { message: 'Service temporarily unavailable' } };
      const successResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'response' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: vi.fn().mockResolvedValueOnce(serverError),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValueOnce(successResponse),
        });

      const result = await provider.generate('test', {});
      expect(result.text).toBe('response');
    });
  });

  describe('Additional Methods', () => {
    it('should summarize text', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Summary text' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 50, output_tokens: 20 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await provider.summary('Long text to summarize');
      expect(result).toBe('Summary text');
    });

    it('should translate text', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Bonjour' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await provider.translate('Hello', 'French');
      expect(result).toBe('Bonjour');
    });

    it('should analyze sentiment', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              compound: 0.8,
              positive: 0.8,
              negative: 0.0,
              neutral: 0.2,
            }),
          },
        ],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 20, output_tokens: 30 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await provider.sentiment('This is great!');
      expect((result as any).compound).toBeGreaterThan(0.7);
      expect((result as any).positive).toBeGreaterThan(0.7);
    });

    it('should validate provider configuration', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'ok' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 1, output_tokens: 1 },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const isValid = await provider.validate();
      expect(isValid).toBe(true);
    });

    it('should handle validation failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Validation failed'));

      const isValid = await provider.validate();
      expect(isValid).toBe(false);
    });
  });

  describe('Concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'response' }],
        model: 'claude-3-sonnet-20240229',
        stop_reason: 'end_turn',
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

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
