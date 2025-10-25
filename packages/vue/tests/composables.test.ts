/**
 * Vue composables tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAI, useGenerateAI, useClassifyAI, useExtractAI } from '../src/composables/useAI.js';
import type { Weave } from '@weave/core';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

describe('useAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with idle state', () => {
    const { data, loading, error, status } = useAI();
    expect(data.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(status.value).toBe('idle');
  });

  it('should execute async function successfully', async () => {
    const { data, loading, error, status, execute } = useAI<string>();
    const fn = vi.fn().mockResolvedValue('result');

    const result = await execute(fn);

    expect(result).toBe('result');
    expect(data.value).toBe('result');
    expect(status.value).toBe('success');
    expect(error.value).toBeNull();
    expect(loading.value).toBe(false);
  });

  it('should handle errors', async () => {
    const { error, status, execute } = useAI();
    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);

    const result = await execute(fn);

    expect(result).toBeNull();
    expect(error.value?.message).toBe('Test error');
    expect(status.value).toBe('error');
  });

  it('should call callbacks', async () => {
    const onStart = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { execute } = useAI<string>({
      onStart,
      onSuccess,
      onError,
    });

    const fn = vi.fn().mockResolvedValue('result');
    await execute(fn);

    expect(onStart).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('result');
    expect(onError).not.toHaveBeenCalled();
  });

  it('should call error callback on failure', async () => {
    const onError = vi.fn();
    const { execute } = useAI({ onError });
    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);

    await execute(fn);

    expect(onError).toHaveBeenCalled();
  });
});

describe('useGenerateAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate text', async () => {
    const { data, generate } = useGenerateAI({
      generate: vi.fn().mockResolvedValue({ text: 'Generated' }),
    } as any);

    const result = await generate('prompt');

    expect(result).toBe('Generated');
    expect(data.value).toBe('Generated');
  });

  it('should handle generation error', async () => {
    const { error, generate } = useGenerateAI({
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    } as any);

    const result = await generate('prompt');

    expect(result).toBeNull();
    expect(error.value?.message).toBe('Generation failed');
  });

  it('should pass options to generate', async () => {
    const mockGenerate = vi.fn().mockResolvedValue({ text: 'Generated' });
    const { generate } = useGenerateAI({ generate: mockGenerate } as any);

    await generate('prompt', { temperature: 0.7 });

    expect(mockGenerate).toHaveBeenCalledWith('prompt', { temperature: 0.7 });
  });
});

describe('useClassifyAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify text', async () => {
    const mockClassify = vi.fn().mockResolvedValue({ label: 'positive' });
    const { data, classify } = useClassifyAI({ classify: mockClassify } as any);

    const result = await classify('Good product', ['positive', 'negative']);

    expect(result).toEqual({ label: 'positive' });
    expect(data.value).toEqual({ label: 'positive' });
  });

  it('should handle classification error', async () => {
    const { error, classify } = useClassifyAI({
      classify: vi.fn().mockRejectedValue(new Error('Classification failed')),
    } as any);

    const result = await classify('Text', ['label1']);

    expect(result).toBeNull();
    expect(error.value?.message).toBe('Classification failed');
  });
});

describe('useExtractAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract data', async () => {
    const mockExtract = vi.fn().mockResolvedValue({ name: 'John', age: 30 });
    const { data, extract } = useExtractAI({ extract: mockExtract } as any);

    const schema = { name: 'string', age: 'number' };
    const result = await extract('John is 30 years old', schema);

    expect(result).toEqual({ name: 'John', age: 30 });
    expect(data.value).toEqual({ name: 'John', age: 30 });
  });

  it('should handle extraction error', async () => {
    const { error, extract } = useExtractAI({
      extract: vi.fn().mockRejectedValue(new Error('Extraction failed')),
    } as any);

    const result = await extract('Text', {});

    expect(result).toBeNull();
    expect(error.value?.message).toBe('Extraction failed');
  });
});
