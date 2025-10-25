/**
 * Next.js API routes tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGenerateHandler, createClassifyHandler, createExtractHandler } from '../src';
import type { NextRequest } from 'next/server';
import type { Weave } from '@weave/core';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

const createMockRequest = (method: string, body: any = {}): Partial<NextRequest> => ({
  method,
  json: vi.fn().mockResolvedValue(body),
});

describe('createGenerateHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate text', async () => {
    const handler = createGenerateHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { prompt: 'test' }) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(200);
    expect(mockWeave.generate).toHaveBeenCalledWith('test', undefined);
  });

  it('should reject non-POST requests', async () => {
    const handler = createGenerateHandler({ weave: mockWeave });
    const req = createMockRequest('GET') as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(405);
  });

  it('should reject missing prompt', async () => {
    const handler = createGenerateHandler({ weave: mockWeave });
    const req = createMockRequest('POST', {}) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(400);
  });

  it('should handle generation errors', async () => {
    const errorWeave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    };
    const handler = createGenerateHandler({ weave: errorWeave as any });
    const req = createMockRequest('POST', { prompt: 'test' }) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(500);
  });
});

describe('createClassifyHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify text', async () => {
    const handler = createClassifyHandler({ weave: mockWeave });
    const req = createMockRequest('POST', {
      text: 'good product',
      labels: ['positive', 'negative'],
    }) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(200);
    expect(mockWeave.classify).toHaveBeenCalledWith('good product', ['positive', 'negative']);
  });

  it('should reject non-POST requests', async () => {
    const handler = createClassifyHandler({ weave: mockWeave });
    const req = createMockRequest('GET') as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(405);
  });

  it('should reject missing text', async () => {
    const handler = createClassifyHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { labels: [] }) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(400);
  });

  it('should reject non-array labels', async () => {
    const handler = createClassifyHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { text: 'good', labels: 'invalid' }) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(400);
  });
});

describe('createExtractHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract data', async () => {
    const handler = createExtractHandler({ weave: mockWeave });
    const schema = { name: 'string' };
    const req = createMockRequest('POST', { text: 'John', schema }) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(200);
    expect(mockWeave.extract).toHaveBeenCalledWith('John', schema);
  });

  it('should reject non-POST requests', async () => {
    const handler = createExtractHandler({ weave: mockWeave });
    const req = createMockRequest('GET') as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(405);
  });

  it('should reject missing text', async () => {
    const handler = createExtractHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { schema: {} }) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(400);
  });

  it('should reject missing schema', async () => {
    const handler = createExtractHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { text: 'data' }) as any;

    const response = (await handler(req)) as any;

    expect(response.status).toBe(400);
  });
});
