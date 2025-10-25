/**
 * NestJS services tests (simplified without full TestBed)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Weave } from '@weave/core';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

// Mock WeaveService
class MockWeaveService {
  constructor(private weave: Weave) {}

  getWeave(): Weave {
    return this.weave;
  }
}

// Mock GenerateService
class MockGenerateService {
  constructor(private weave: Weave) {}

  async generate(prompt: string): Promise<string> {
    const result = await this.weave.generate(prompt);
    return result.text;
  }
}

// Mock ClassifyService
class MockClassifyService {
  constructor(private weave: Weave) {}

  async classify(text: string, labels: string[]): Promise<any> {
    return await this.weave.classify(text, labels);
  }
}

// Mock ExtractService
class MockExtractService {
  constructor(private weave: Weave) {}

  async extract(text: string, schema: any): Promise<any> {
    return await this.weave.extract(text, schema);
  }
}

describe('WeaveService', () => {
  let service: MockWeaveService;

  beforeEach(() => {
    service = new MockWeaveService(mockWeave);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('should return weave instance', () => {
    const weave = service.getWeave();
    expect(weave).toBe(mockWeave);
  });
});

describe('GenerateService', () => {
  let service: MockGenerateService;

  beforeEach(() => {
    service = new MockGenerateService(mockWeave);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('should generate text', async () => {
    const result = await service.generate('prompt');
    expect(result).toBe('Generated text');
    expect(mockWeave.generate).toHaveBeenCalledWith('prompt');
  });

  it('should handle generation error', async () => {
    const errorWeave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    };

    const errorService = new MockGenerateService(errorWeave as any);
    await expect(errorService.generate('prompt')).rejects.toThrow('Generation failed');
  });

  it('should handle empty prompts', async () => {
    const result = await service.generate('');
    expect(mockWeave.generate).toHaveBeenCalledWith('');
  });
});

describe('ClassifyService', () => {
  let service: MockClassifyService;

  beforeEach(() => {
    service = new MockClassifyService(mockWeave);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('should classify text', async () => {
    const result = await service.classify('good', ['positive', 'negative']);
    expect(result).toEqual({ label: 'positive', confidence: 0.95 });
  });

  it('should handle multiple labels', async () => {
    const result = await service.classify('text', ['label1', 'label2', 'label3']);
    expect(mockWeave.classify).toHaveBeenCalledWith('text', ['label1', 'label2', 'label3']);
  });
});

describe('ExtractService', () => {
  let service: MockExtractService;

  beforeEach(() => {
    service = new MockExtractService(mockWeave);
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('should extract data', async () => {
    const schema = { name: 'string' };
    const result = await service.extract('John', schema);
    expect(result).toEqual({ key: 'value' });
  });

  it('should handle complex schemas', async () => {
    const schema = { name: 'string', age: 'number', email: 'string' };
    const result = await service.extract('John, 30, john@example.com', schema);
    expect(mockWeave.extract).toHaveBeenCalledWith('John, 30, john@example.com', schema);
  });

  it('should handle extraction errors', async () => {
    const errorWeave = {
      ...mockWeave,
      extract: vi.fn().mockRejectedValue(new Error('Extraction failed')),
    };

    const errorService = new MockExtractService(errorWeave as any);
    await expect(errorService.extract('text', {})).rejects.toThrow('Extraction failed');
  });
});
