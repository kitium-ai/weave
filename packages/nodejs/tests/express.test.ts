/**
 * Node.js Express integration tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWeaveMiddleware, setupWeaveRoutes } from '../src/server/express-integration.js';
import type { Weave } from '@weaveai/core';
import type { Request, Response } from 'express';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

const createMockRequest = (body: any = {}): Partial<Request> => ({
  body,
});

const createMockResponse = (): Partial<Response> => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('createWeaveMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create middleware object', () => {
    const middleware = createWeaveMiddleware(mockWeave);
    expect(middleware).toHaveProperty('middleware');
    expect(middleware).toHaveProperty('generateHandler');
    expect(middleware).toHaveProperty('classifyHandler');
    expect(middleware).toHaveProperty('extractHandler');
  });

  it('should attach weave instance to request', () => {
    const { middleware } = createWeaveMiddleware(mockWeave);
    const req = {} as any;
    const res = {} as any;
    const next = vi.fn();

    middleware(req, res, next);

    expect(req.weave).toBe(mockWeave);
    expect(next).toHaveBeenCalled();
  });

  it('should handle generate requests', async () => {
    const { generateHandler } = createWeaveMiddleware(mockWeave);
    const req = createMockRequest({ prompt: 'test' }) as any;
    const res = createMockResponse() as any;

    await generateHandler(req, res);

    expect(mockWeave.generate).toHaveBeenCalledWith('test', undefined);
    expect(res.json).toHaveBeenCalledWith({ text: 'Generated text' });
  });

  it('should reject generate without prompt', async () => {
    const { generateHandler } = createWeaveMiddleware(mockWeave);
    const req = createMockRequest({}) as any;
    const res = createMockResponse() as any;

    await generateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('should handle classify requests', async () => {
    const { classifyHandler } = createWeaveMiddleware(mockWeave);
    const req = createMockRequest({ text: 'good', labels: ['positive', 'negative'] }) as any;
    const res = createMockResponse() as any;

    await classifyHandler(req, res);

    expect(mockWeave.classify).toHaveBeenCalledWith('good', ['positive', 'negative']);
    expect(res.json).toHaveBeenCalledWith({ label: 'positive', confidence: 0.95 });
  });

  it('should reject classify without text', async () => {
    const { classifyHandler } = createWeaveMiddleware(mockWeave);
    const req = createMockRequest({ labels: [] }) as any;
    const res = createMockResponse() as any;

    await classifyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle extract requests', async () => {
    const { extractHandler } = createWeaveMiddleware(mockWeave);
    const schema = { name: 'string' };
    const req = createMockRequest({ text: 'John', schema }) as any;
    const res = createMockResponse() as any;

    await extractHandler(req, res);

    expect(mockWeave.extract).toHaveBeenCalledWith('John', schema);
    expect(res.json).toHaveBeenCalledWith({ key: 'value' });
  });

  it('should handle errors in generate', async () => {
    const errorWeave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    };
    const { generateHandler } = createWeaveMiddleware(errorWeave as any);
    const req = createMockRequest({ prompt: 'test' }) as any;
    const res = createMockResponse() as any;

    await generateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Generation failed' });
  });
});

describe('setupWeaveRoutes', () => {
  it('should setup routes on app', () => {
    const mockApp = {
      use: vi.fn(),
      post: vi.fn(),
    };

    setupWeaveRoutes(mockApp, mockWeave);

    expect(mockApp.use).toHaveBeenCalled();
    expect(mockApp.post).toHaveBeenCalledTimes(3);
  });

  it('should use custom basePath', () => {
    const mockApp = {
      use: vi.fn(),
      post: vi.fn(),
    };

    setupWeaveRoutes(mockApp, mockWeave, { basePath: '/custom/path' });

    const calls = (mockApp.post as any).mock.calls;
    expect(calls[0][0]).toContain('/custom/path');
  });
});
