/**
 * React Native hooks tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-native';
import { useAI, useGenerateAI, useClassifyAI, useExtractAI } from '../src/hooks/useAI.js';
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
    const { result } = renderHook(() => useAI(mockWeave));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('idle');
  });

  it('should execute async function successfully', async () => {
    const { result } = renderHook(() => useAI<string>(mockWeave));
    const fn = vi.fn().mockResolvedValue('result');

    let executeResult: string | null = null;
    await act(async () => {
      executeResult = await result.current.execute(fn);
    });

    expect(executeResult).toBe('result');
    expect(result.current.data).toBe('result');
    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const { result } = renderHook(() => useAI(mockWeave));
    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);

    let executeResult: any = null;
    await act(async () => {
      executeResult = await result.current.execute(fn);
    });

    expect(executeResult).toBeNull();
    expect(result.current.error?.message).toBe('Test error');
    expect(result.current.status).toBe('error');
  });

  it('should call callbacks', async () => {
    const onStart = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useAI<string>(mockWeave, {
        onStart,
        onSuccess,
        onError,
      })
    );

    const fn = vi.fn().mockResolvedValue('result');
    await act(async () => {
      await result.current.execute(fn);
    });

    expect(onStart).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('result');
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('useGenerateAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate text', async () => {
    const { result } = renderHook(() => useGenerateAI(mockWeave));

    let generateResult: string | null = null;
    await act(async () => {
      generateResult = await result.current.generate('prompt');
    });

    expect(generateResult).toBe('Generated text');
    expect(result.current.data).toBe('Generated text');
    expect(result.current.status).toBe('success');
  });

  it('should handle generation error', async () => {
    const errorWeave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    };

    const { result } = renderHook(() => useGenerateAI(errorWeave as any));

    let generateResult: any = null;
    await act(async () => {
      generateResult = await result.current.generate('prompt');
    });

    expect(generateResult).toBeNull();
    expect(result.current.error?.message).toBe('Generation failed');
    expect(result.current.status).toBe('error');
  });
});

describe('useClassifyAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify text', async () => {
    const { result } = renderHook(() => useClassifyAI(mockWeave));

    let classifyResult: any = null;
    await act(async () => {
      classifyResult = await result.current.classify('good', ['positive', 'negative']);
    });

    expect(classifyResult).toEqual({ label: 'positive', confidence: 0.95 });
    expect(result.current.data).toEqual({ label: 'positive', confidence: 0.95 });
  });

  it('should handle classification error', async () => {
    const errorWeave = {
      ...mockWeave,
      classify: vi.fn().mockRejectedValue(new Error('Classification failed')),
    };

    const { result } = renderHook(() => useClassifyAI(errorWeave as any));

    let classifyResult: any = null;
    await act(async () => {
      classifyResult = await result.current.classify('text', ['label']);
    });

    expect(classifyResult).toBeNull();
    expect(result.current.error?.message).toBe('Classification failed');
  });
});

describe('useExtractAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract data', async () => {
    const { result } = renderHook(() => useExtractAI(mockWeave));

    let extractResult: any = null;
    const schema = { name: 'string' };
    await act(async () => {
      extractResult = await result.current.extract('John', schema);
    });

    expect(extractResult).toEqual({ key: 'value' });
    expect(result.current.data).toEqual({ key: 'value' });
  });

  it('should handle extraction error', async () => {
    const errorWeave = {
      ...mockWeave,
      extract: vi.fn().mockRejectedValue(new Error('Extraction failed')),
    };

    const { result } = renderHook(() => useExtractAI(errorWeave as any));

    let extractResult: any = null;
    await act(async () => {
      extractResult = await result.current.extract('text', {});
    });

    expect(extractResult).toBeNull();
    expect(result.current.error?.message).toBe('Extraction failed');
  });
});
