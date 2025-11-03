/**
 * Next.js API routes tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGenerateHandler, createClassifyHandler, createExtractHandler } from '../src';
import { MockWeaveFactory, MockRequestFactory } from '@weaveai/shared/testing';
import type { Weave } from '@weaveai/core';

const mockWeave: Weave = MockWeaveFactory.createMockWeave();

const createMockRequest = (
  method: string,
  body: Record<string, unknown> = {}
): Partial<NextRequest> => ({
  method,
  json: vi.fn().mockResolvedValue(body) as any,
  headers: new Headers({
    'content-type': 'application/json',
  }),
});

describe('createGenerateHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate text', async () => {
    const handler = createGenerateHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { prompt: 'test' });

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(200);
    expect(mockWeave.generate).toHaveBeenCalledWith('test', undefined);
  });

  it('should reject non-POST requests', async () => {
    const handler = createGenerateHandler({ weave: mockWeave });
    const req = createMockRequest('GET');

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(405);
  });

  it('should reject missing prompt', async () => {
    const handler = createGenerateHandler({ weave: mockWeave });
    const req = createMockRequest('POST', {});

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(400);
  });

  it('should handle generation errors', async () => {
    const errorWeave = MockWeaveFactory.createMockWeaveWithError(new Error('Generation failed'));
    const handler = createGenerateHandler({ weave: errorWeave });
    const req = createMockRequest('POST', { prompt: 'test' });

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(500);
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
    });

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(200);
    expect(mockWeave.classify).toHaveBeenCalledWith('good product', ['positive', 'negative']);
  });

  it('should reject non-POST requests', async () => {
    const handler = createClassifyHandler({ weave: mockWeave });
    const req = createMockRequest('GET');

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(405);
  });

  it('should reject missing text', async () => {
    const handler = createClassifyHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { labels: [] });

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(400);
  });

  it('should reject non-array labels', async () => {
    const handler = createClassifyHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { text: 'good', labels: 'invalid' });

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(400);
  });
});

describe('createExtractHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract data', async () => {
    const handler = createExtractHandler({ weave: mockWeave });
    const schema = { name: 'string' };
    const req = createMockRequest('POST', { text: 'John', schema });

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(200);
    expect(mockWeave.extract).toHaveBeenCalledWith('John', schema);
  });

  it('should reject non-POST requests', async () => {
    const handler = createExtractHandler({ weave: mockWeave });
    const req = createMockRequest('GET');

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(405);
  });

  it('should reject missing text', async () => {
    const handler = createExtractHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { schema: {} });

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(400);
  });

  it('should reject missing schema', async () => {
    const handler = createExtractHandler({ weave: mockWeave });
    const req = createMockRequest('POST', { text: 'data' });

    const response = await handler(req as NextRequest);

    expect(response?.status).toBe(400);
  });
});
