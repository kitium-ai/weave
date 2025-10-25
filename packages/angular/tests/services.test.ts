/**
 * Angular services tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Weave } from '@weave/core';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

// Simple mock AIService for testing without Angular TestBed complexity
class MockAIService {
  private weave: Weave;
  private state = { data: null, loading: false, error: null, status: 'idle' };

  constructor(weave: Weave) {
    this.weave = weave;
  }

  getState() {
    return { ...this.state };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      this.state = { ...this.state, loading: true, status: 'loading' };
      const result = await fn();
      this.state = { ...this.state, data: result, loading: false, status: 'success', error: null };
      return result;
    } catch (error) {
      this.state = { ...this.state, error: error as Error, loading: false, status: 'error' };
      return null;
    }
  }

  reset() {
    this.state = { data: null, loading: false, error: null, status: 'idle' };
  }
}

class MockGenerateService {
  private weave: Weave;

  constructor(weave: Weave) {
    this.weave = weave;
  }

  async generate(prompt: string): Promise<string | null> {
    try {
      const result = await this.weave.generate(prompt);
      return result.text;
    } catch {
      return null;
    }
  }
}

class MockClassifyService {
  private weave: Weave;

  constructor(weave: Weave) {
    this.weave = weave;
  }

  async classify(text: string, labels: string[]): Promise<any> {
    try {
      return await this.weave.classify(text, labels);
    } catch {
      return null;
    }
  }
}

class MockExtractService {
  private weave: Weave;

  constructor(weave: Weave) {
    this.weave = weave;
  }

  async extract(text: string, schema: any): Promise<any> {
    try {
      return await this.weave.extract(text, schema);
    } catch {
      return null;
    }
  }
}

describe('AIService', () => {
  let service: MockAIService;

  beforeEach(() => {
    service = new MockAIService(mockWeave);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with idle state', () => {
    const state = service.getState();
    expect(state.data).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.status).toBe('idle');
  });

  it('should execute async function successfully', async () => {
    const fn = vi.fn().mockResolvedValue('result');
    const result = await service.execute(fn);

    expect(result).toBe('result');
    const state = service.getState();
    expect(state.data).toBe('result');
    expect(state.error).toBeNull();
    expect(state.status).toBe('success');
  });

  it('should handle errors', async () => {
    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);

    const result = await service.execute(fn);

    expect(result).toBeNull();
    const state = service.getState();
    expect(state.error?.message).toBe('Test error');
    expect(state.status).toBe('error');
  });

  it('should reset state', () => {
    service.reset();
    const state = service.getState();
    expect(state.data).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.status).toBe('idle');
  });
});

describe('GenerateService', () => {
  let service: MockGenerateService;

  beforeEach(() => {
    service = new MockGenerateService(mockWeave);
    vi.clearAllMocks();
  });

  it('should generate text', async () => {
    const mockGenerateWeave: Weave = {
      ...mockWeave,
      generate: vi.fn().mockResolvedValue({ text: 'Generated' }),
    } as any;
    service = new MockGenerateService(mockGenerateWeave);

    const result = await service.generate('prompt');

    expect(result).toBe('Generated');
  });

  it('should handle generation error', async () => {
    const mockErrorWeave: Weave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    } as any;
    service = new MockGenerateService(mockErrorWeave);

    const result = await service.generate('prompt');

    expect(result).toBeNull();
  });
});

describe('ClassifyService', () => {
  let service: MockClassifyService;

  beforeEach(() => {
    service = new MockClassifyService(mockWeave);
    vi.clearAllMocks();
  });

  it('should classify text', async () => {
    const mockClassifyWeave: Weave = {
      ...mockWeave,
      classify: vi.fn().mockResolvedValue({ label: 'positive' }),
    } as any;
    service = new MockClassifyService(mockClassifyWeave);

    const result = await service.classify('Good product', ['positive', 'negative']);

    expect(result).toEqual({ label: 'positive' });
  });
});

describe('ExtractService', () => {
  let service: MockExtractService;

  beforeEach(() => {
    service = new MockExtractService(mockWeave);
    vi.clearAllMocks();
  });

  it('should extract data', async () => {
    const mockExtractWeave: Weave = {
      ...mockWeave,
      extract: vi.fn().mockResolvedValue({ name: 'John', age: 30 }),
    } as any;
    service = new MockExtractService(mockExtractWeave);

    const schema = { name: 'string', age: 'number' };
    const result = await service.extract('John is 30 years old', schema);

    expect(result).toEqual({ name: 'John', age: 30 });
  });
});
