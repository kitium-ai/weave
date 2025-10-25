/**
 * NestJS modules tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { WeaveModule, WEAVE_INSTANCE } from '../src/modules/weave.module.js';
import { WeaveService, GenerateService, ClassifyService, ExtractService } from '../src/modules/weave.service.js';
import type { Weave } from '@weave/core';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

describe('WeaveModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('should be defined', async () => {
    module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide Weave instance', async () => {
    module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    const weaveInstance = module.get(WEAVE_INSTANCE);
    expect(weaveInstance).toBe(mockWeave);
  });

  it('should provide WeaveService', async () => {
    module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    const service = module.get(WeaveService);
    expect(service).toBeDefined();
  });

  it('should provide GenerateService', async () => {
    module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    const service = module.get(GenerateService);
    expect(service).toBeDefined();
  });

  it('should provide ClassifyService', async () => {
    module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    const service = module.get(ClassifyService);
    expect(service).toBeDefined();
  });

  it('should provide ExtractService', async () => {
    module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    const service = module.get(ExtractService);
    expect(service).toBeDefined();
  });
});

describe('WeaveService', () => {
  let service: WeaveService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    service = module.get(WeaveService);
    vi.clearAllMocks();
  });

  it('should return weave instance', () => {
    const weave = service.getWeave();
    expect(weave).toBe(mockWeave);
  });
});

describe('GenerateService', () => {
  let service: GenerateService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    service = module.get(GenerateService);
    vi.clearAllMocks();
  });

  it('should generate text', async () => {
    const result = await service.generate('prompt');
    expect(result).toBe('Generated text');
    expect(mockWeave.generate).toHaveBeenCalledWith('prompt', undefined);
  });

  it('should handle generation error', async () => {
    const errorWeave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    };

    const errorModule = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: errorWeave as any })],
    }).compile();

    const errorService = errorModule.get(GenerateService);
    await expect(errorService.generate('prompt')).rejects.toThrow('Generation failed');
  });
});

describe('ClassifyService', () => {
  let service: ClassifyService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    service = module.get(ClassifyService);
    vi.clearAllMocks();
  });

  it('should classify text', async () => {
    const result = await service.classify('good', ['positive', 'negative']);
    expect(result).toEqual({ label: 'positive', confidence: 0.95 });
  });
});

describe('ExtractService', () => {
  let service: ExtractService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [WeaveModule.register({ weave: mockWeave })],
    }).compile();

    service = module.get(ExtractService);
    vi.clearAllMocks();
  });

  it('should extract data', async () => {
    const schema = { name: 'string' };
    const result = await service.extract('John', schema);
    expect(result).toEqual({ key: 'value' });
  });
});
