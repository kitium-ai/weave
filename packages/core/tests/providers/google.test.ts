/**
 * Google Provider Tests
 * Comprehensive unit tests for Google Generative AI provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleProvider } from '../../src/providers/google.js';
import type {
  GenerateOptions,
  ClassifyOptions,
  ExtractOptions,
} from '../../src/providers/interfaces.js';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('GoogleProvider', () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    provider = new GoogleProvider({
      apiKey: 'test-key-123',
      model: 'gemini-pro',
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
        new GoogleProvider({
          apiKey: '',
          model: 'gemini-pro',
        });
      }).toThrow();
    });

    it('should use default model if not specified', () => {
      const p = new GoogleProvider({
        apiKey: 'test-key',
      });
      const info = p.getProviderInfo();
      expect(info.model).toBe('gemini-pro');
    });

    it('should have correct provider info', () => {
      const info = provider.getProviderInfo();
      expect(info.provider).toBe('google');
      expect(info.model).toBe('gemini-pro');
    });

    it('should set custom baseUrl if provided', () => {
      const p = new GoogleProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.googleapis.com/v1/models',
      });
      expect(p).toBeDefined();
    });

    it('should set custom timeout if provided', () => {
      const p = new GoogleProvider({
        apiKey: 'test-key',
        timeout: 60000,
      });
      expect(p).toBeDefined();
    });

    it('should set custom maxRetries if provided', () => {
      const p = new GoogleProvider({
        apiKey: 'test-key',
        maxRetries: 5,
      });
      expect(p).toBeDefined();
    });
  });

  describe('Generate Operation', () => {
    it('should generate text successfully', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  text: 'Generated text response',
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30,
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
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: '' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 0,
          candidatesTokenCount: 0,
          totalTokenCount: 0,
        },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          totalTokenCount: 15,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const options: GenerateOptions = { temperature: 0.1, maxTokens: 500 };
      await provider.generate('test', options);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.generationConfig.temperature).toBe(0.1);
    });

    it('should respect maxTokens setting', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          totalTokenCount: 15,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const options: GenerateOptions = { maxTokens: 1500 };
      await provider.generate('test', options);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.generationConfig.maxOutputTokens).toBe(1500);
    });

    it('should respect topP setting', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          totalTokenCount: 15,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const options: GenerateOptions = { topP: 0.8 };
      await provider.generate('test', options);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.generationConfig.topP).toBe(0.8);
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
            candidates: [
              {
                content: {
                  role: 'model',
                  parts: [{ text: 'response' }],
                },
                finishReason: 'STOP',
              },
            ],
            usageMetadata: {
              promptTokenCount: 5,
              candidatesTokenCount: 10,
              totalTokenCount: 15,
            },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'positive' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 5,
          totalTokenCount: 20,
        },
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
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'unknown' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 5,
          totalTokenCount: 10,
        },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'positive' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 15,
          candidatesTokenCount: 5,
          totalTokenCount: 20,
        },
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
    });
  });

  describe('Extract Operation', () => {
    it('should extract data successfully', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  text: JSON.stringify({
                    name: 'John Doe',
                    email: 'john@example.com',
                    age: 30,
                  }),
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 15,
          totalTokenCount: 35,
        },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: '{}' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'not valid json' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await provider.extract('test', { field: 'string' }, {});
      expect(result).toEqual({});
    });
  });

  describe('Token Counting', () => {
    it('should count tokens via API', async () => {
      const mockResponse = {
        totalTokens: 10,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const text = 'This is a test prompt for token counting';
      const count = await provider.countTokens(text);

      expect(count).toBe(10);
      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[0]).toContain(':countTokens');
    });

    it('should handle countTokens API failure with heuristic fallback', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API error'));

      const text = 'This is a test prompt';
      const count = await provider.countTokens(text);

      // Should fall back to heuristic: ~4 characters per token
      expect(count).toBeCloseTo(Math.ceil(text.length / 4), 5);
    });

    it('should handle totalTokenCount field variation', async () => {
      const mockResponse = {
        totalTokenCount: 15, // Alternative field name
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const count = await provider.countTokens('test text');
      expect(count).toBe(15);
    });

    it('should handle special characters in token counting', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API error'));

      const text = '你好世界 🌍 Special chars: @#$%^&*()';
      const count = await provider.countTokens(text);

      expect(count).toBeGreaterThan(0);
    });

    it('should handle empty string in token counting', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce({ totalTokens: 0 }),
      });

      const count = await provider.countTokens('');
      expect(count).toBe(0);
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          totalTokenCount: 15,
        },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Summary text' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 50,
          candidatesTokenCount: 20,
          totalTokenCount: 70,
        },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Bonjour' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [
                {
                  text: JSON.stringify({
                    compound: 0.8,
                    positive: 0.8,
                    negative: 0.0,
                    neutral: 0.2,
                  }),
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 30,
          totalTokenCount: 50,
        },
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
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'ok' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 1,
          candidatesTokenCount: 1,
          totalTokenCount: 2,
        },
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

  describe('Chat Operation', () => {
    it('should handle chat messages', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Chat response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 15,
          totalTokenCount: 35,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ];

      const result = await provider.chat(messages, {});
      expect(result).toBe('Chat response');
    });

    it('should filter system messages from chat', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'Chat response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 10,
          totalTokenCount: 20,
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValueOnce(mockResponse),
      });

      const messages = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'Hello' },
      ];

      await provider.chat(messages, {});

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      // System messages should be filtered
      expect(body.contents).toHaveLength(1);
    });
  });

  describe('Concurrency', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              role: 'model',
              parts: [{ text: 'response' }],
            },
            finishReason: 'STOP',
          },
        ],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          totalTokenCount: 15,
        },
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
