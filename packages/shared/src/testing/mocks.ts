/**
 * Mock utilities for testing
 * Provides type-safe mock factories for Weave and related objects
 */

import type { Weave, WeaveConfig } from '../types/index.js';
import type { AIOperation } from '../types/index.js';

/**
 * Factory for creating mock Weave instances with proper typing
 */
export class MockWeaveFactory {
  /**
   * Create a mock Weave with all operations mocked
   */
  static createMockWeave(overrides?: Partial<Weave>): Weave {
    const mockWeave: Weave = {
      config: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        apiKey: 'test-key',
      } as WeaveConfig,

      generate: vi.fn().mockResolvedValue({
        text: 'Generated text',
        tokens: { input: 10, output: 20 },
      }),

      classify: vi.fn().mockResolvedValue({
        label: 'positive',
        confidence: 0.95,
        scores: { positive: 0.95, negative: 0.05 },
      }),

      extract: vi.fn().mockResolvedValue({
        key1: 'value1',
        key2: 'value2',
      }),

      evaluate: vi.fn().mockResolvedValue({
        success: true,
        score: 0.95,
        details: {},
      }),

      batch: vi.fn().mockResolvedValue({
        results: [],
        stats: { success: 0, failed: 0 },
      }),

      rag: vi.fn().mockResolvedValue({
        answer: 'RAG answer',
        sources: [],
      }),

      getModel: vi.fn().mockReturnValue({
        id: 'claude-3-sonnet-20240229',
        provider: 'anthropic',
      }),

      getProvider: vi.fn().mockReturnValue({
        name: 'anthropic',
        isInitialized: true,
      }),

      ...overrides,
    };

    return mockWeave;
  }

  /**
   * Create a mock Weave with custom operation responses
   */
  static createMockWeaveWithResponses(responses: {
    generateResponse?: unknown;
    classifyResponse?: unknown;
    extractResponse?: unknown;
  }): Weave {
    return this.createMockWeave({
      generate: vi.fn().mockResolvedValue(responses.generateResponse),
      classify: vi.fn().mockResolvedValue(responses.classifyResponse),
      extract: vi.fn().mockResolvedValue(responses.extractResponse),
    });
  }

  /**
   * Create a mock Weave that throws errors
   */
  static createMockWeaveWithError(error: Error): Weave {
    const mockWeave = this.createMockWeave();
    (mockWeave.generate as any).mockRejectedValue(error);
    (mockWeave.classify as any).mockRejectedValue(error);
    (mockWeave.extract as any).mockRejectedValue(error);
    return mockWeave;
  }
}

/**
 * Mock request/response factories for Node.js/Express testing
 */
export class MockRequestFactory {
  /**
   * Create a mock Express request
   */
  static createMockRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: Record<string, unknown>,
    query?: Record<string, string | string[]>,
    params?: Record<string, string>
  ): Partial<Express.Request> {
    return {
      method,
      body: body || {},
      query: query || {},
      params: params || {},
      headers: {
        'content-type': 'application/json',
      },
      get: (header: string) => {
        const headerMap: Record<string, string> = {
          'content-type': 'application/json',
          authorization: 'Bearer token',
        };
        return headerMap[header.toLowerCase()] || '';
      },
    };
  }

  /**
   * Create a mock Express response
   */
  static createMockResponse(): {
    res: Partial<Express.Response>;
    status: jest.Mock;
    json: jest.Mock;
    send: jest.Mock;
  } {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const send = vi.fn().mockReturnThis();

    const res: Partial<Express.Response> = {
      status,
      json,
      send,
      setHeader: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    return { res, status, json, send };
  }

  /**
   * Create Next.js request mock
   */
  static createNextJSRequest(
    method: string = 'POST',
    body?: Record<string, unknown>
  ): {
    method: string;
    json: () => Promise<unknown>;
    headers: Headers;
  } {
    return {
      method,
      json: vi.fn().mockResolvedValue(body || {}),
      headers: new Headers({
        'content-type': 'application/json',
      }),
    };
  }
}

/**
 * Mock Weave configuration factory
 */
export class MockConfigFactory {
  static createMockConfig(overrides?: Partial<WeaveConfig>): WeaveConfig {
    return {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey: 'test-api-key',
      temperature: 0.7,
      maxTokens: 1024,
      ...overrides,
    } as WeaveConfig;
  }
}

/**
 * Type-safe mock assertion helpers
 */
export class MockAssertions {
  /**
   * Assert a function was called with specific arguments
   */
  static assertCalledWith(fn: any, ...args: unknown[]): void {
    if (!fn.mock.calls.some((call: unknown[]) => JSON.stringify(call) === JSON.stringify(args))) {
      throw new Error(
        `Expected function to be called with ${JSON.stringify(args)}, ` +
          `but was called with ${fn.mock.calls.map((c: unknown[]) => JSON.stringify(c)).join(', ')}`
      );
    }
  }

  /**
   * Assert a function was called a specific number of times
   */
  static assertCallCount(fn: any, count: number): void {
    if (fn.mock.calls.length !== count) {
      throw new Error(`Expected function to be called ${count} times, but was called ${fn.mock.calls.length} times`);
    }
  }

  /**
   * Assert a function was called at least once
   */
  static assertCalled(fn: any): void {
    if (fn.mock.calls.length === 0) {
      throw new Error('Expected function to be called at least once, but was never called');
    }
  }
}
