/**
 * Angular services tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AIService, GenerateService, ClassifyService, ExtractService } from '../src/services/ai.service.js';
import type { Weave } from '@weave/core';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

describe('AIService', () => {
  let service: AIService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AIService, { provide: 'WEAVE_TOKEN', useValue: mockWeave }],
    });
    service = TestBed.inject(AIService);
    service['weave'] = mockWeave;
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with idle state', (done) => {
    const state = service.getState();
    expect(state.data).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.status).toBe('idle');
    done();
  });

  it('should execute async function successfully', async (done) => {
    const fn = vi.fn().mockResolvedValue('result');
    const result = await service.execute(fn);

    expect(result).toBe('result');

    service.state$.subscribe((state) => {
      if (state.status === 'success') {
        expect(state.data).toBe('result');
        expect(state.error).toBeNull();
        done();
      }
    });
  });

  it('should handle errors', async (done) => {
    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);

    const result = await service.execute(fn);

    expect(result).toBeNull();

    service.state$.subscribe((state) => {
      if (state.status === 'error') {
        expect(state.error?.message).toBe('Test error');
        done();
      }
    });
  });

  it('should reset state', (done) => {
    service.reset();
    service.state$.subscribe((state) => {
      expect(state.data).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.status).toBe('idle');
      done();
    });
  });
});

describe('GenerateService', () => {
  let service: GenerateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GenerateService, { provide: 'WEAVE_TOKEN', useValue: mockWeave }],
    });
    service = TestBed.inject(GenerateService);
    service['weave'] = mockWeave;
    vi.clearAllMocks();
  });

  it('should generate text', async (done) => {
    const mockGenerateWeave: Weave = {
      ...mockWeave,
      generate: vi.fn().mockResolvedValue({ text: 'Generated' }),
    } as any;
    service['weave'] = mockGenerateWeave;

    const result = await service.generate('prompt');

    expect(result).toBe('Generated');
    done();
  });

  it('should handle generation error', async (done) => {
    const mockErrorWeave: Weave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    } as any;
    service['weave'] = mockErrorWeave;

    const result = await service.generate('prompt');

    expect(result).toBeNull();
    done();
  });
});

describe('ClassifyService', () => {
  let service: ClassifyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClassifyService, { provide: 'WEAVE_TOKEN', useValue: mockWeave }],
    });
    service = TestBed.inject(ClassifyService);
    service['weave'] = mockWeave;
    vi.clearAllMocks();
  });

  it('should classify text', async (done) => {
    const mockClassifyWeave: Weave = {
      ...mockWeave,
      classify: vi.fn().mockResolvedValue({ label: 'positive' }),
    } as any;
    service['weave'] = mockClassifyWeave;

    const result = await service.classify('Good product', ['positive', 'negative']);

    expect(result).toEqual({ label: 'positive' });
    done();
  });
});

describe('ExtractService', () => {
  let service: ExtractService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExtractService, { provide: 'WEAVE_TOKEN', useValue: mockWeave }],
    });
    service = TestBed.inject(ExtractService);
    service['weave'] = mockWeave;
    vi.clearAllMocks();
  });

  it('should extract data', async (done) => {
    const mockExtractWeave: Weave = {
      ...mockWeave,
      extract: vi.fn().mockResolvedValue({ name: 'John', age: 30 }),
    } as any;
    service['weave'] = mockExtractWeave;

    const schema = { name: 'string', age: 'number' };
    const result = await service.extract('John is 30 years old', schema);

    expect(result).toEqual({ name: 'John', age: 30 });
    done();
  });
});
