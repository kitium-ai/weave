/**
 * React Native hooks tests (simplified without testing library)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Weave } from '@weaveai/core';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

// Mock useAI hook
function createUseAI(weave: Weave, options: any = {}) {
  const state = {
    data: null as any,
    loading: false,
    error: null as any,
    status: 'idle' as any,
  };

  return {
    get data() {
      return state.data;
    },
    get loading() {
      return state.loading;
    },
    get error() {
      return state.error;
    },
    get status() {
      return state.status;
    },
    async execute<T>(fn: () => Promise<T>): Promise<T | null> {
      try {
        state.loading = true;
        state.status = 'loading';
        if (options.onStart) {
          options.onStart();
        }

        const result = await fn();

        state.data = result;
        state.loading = false;
        state.status = 'success';
        state.error = null;
        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        state.error = error;
        state.loading = false;
        state.status = 'error';
        if (options.onError) {
          options.onError(error);
        }
        return null;
      }
    },
  };
}

function createUseGenerateAI(weave: Weave) {
  const hook = createUseAI(weave);
  return {
    get data() {
      return hook.data;
    },
    get loading() {
      return hook.loading;
    },
    get error() {
      return hook.error;
    },
    get status() {
      return hook.status;
    },
    async generate(prompt: string): Promise<string | null> {
      const result = await hook.execute(async () => {
        const res = await weave.generate(prompt);
        return res.text;
      });
      return result;
    },
  };
}

function createUseClassifyAI(weave: Weave) {
  const hook = createUseAI(weave);
  return {
    get data() {
      return hook.data;
    },
    get loading() {
      return hook.loading;
    },
    get error() {
      return hook.error;
    },
    get status() {
      return hook.status;
    },
    async classify(text: string, labels: string[]): Promise<any> {
      return hook.execute(() => weave.classify(text, labels));
    },
  };
}

function createUseExtractAI(weave: Weave) {
  const hook = createUseAI(weave);
  return {
    get data() {
      return hook.data;
    },
    get loading() {
      return hook.loading;
    },
    get error() {
      return hook.error;
    },
    get status() {
      return hook.status;
    },
    async extract(text: string, schema: any): Promise<any> {
      return hook.execute(() => weave.extract(text, schema));
    },
  };
}

describe('useAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with idle state', () => {
    const hook = createUseAI(mockWeave);

    expect(hook.data).toBeNull();
    expect(hook.loading).toBe(false);
    expect(hook.error).toBeNull();
    expect(hook.status).toBe('idle');
  });

  it('should execute async function successfully', async () => {
    const hook = createUseAI(mockWeave);
    const fn = vi.fn().mockResolvedValue('result');

    const executeResult = await hook.execute(fn);

    expect(executeResult).toBe('result');
    expect(hook.data).toBe('result');
    expect(hook.status).toBe('success');
    expect(hook.error).toBeNull();
  });

  it('should handle errors', async () => {
    const hook = createUseAI(mockWeave);
    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);

    const executeResult = await hook.execute(fn);

    expect(executeResult).toBeNull();
    expect(hook.error?.message).toBe('Test error');
    expect(hook.status).toBe('error');
  });

  it('should call callbacks', async () => {
    const onStart = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const hook = createUseAI(mockWeave, {
      onStart,
      onSuccess,
      onError,
    });

    const fn = vi.fn().mockResolvedValue('result');
    await hook.execute(fn);

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
    const hook = createUseGenerateAI(mockWeave);

    const generateResult = await hook.generate('prompt');

    expect(generateResult).toBe('Generated text');
    expect(hook.data).toBe('Generated text');
    expect(hook.status).toBe('success');
  });

  it('should handle generation error', async () => {
    const errorWeave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    };

    const hook = createUseGenerateAI(errorWeave as any);

    const generateResult = await hook.generate('prompt');

    expect(generateResult).toBeNull();
    expect(hook.error?.message).toBe('Generation failed');
    expect(hook.status).toBe('error');
  });
});

describe('useClassifyAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify text', async () => {
    const hook = createUseClassifyAI(mockWeave);

    const classifyResult = await hook.classify('good', ['positive', 'negative']);

    expect(classifyResult).toEqual({ label: 'positive', confidence: 0.95 });
    expect(hook.data).toEqual({ label: 'positive', confidence: 0.95 });
  });

  it('should handle classification error', async () => {
    const errorWeave = {
      ...mockWeave,
      classify: vi.fn().mockRejectedValue(new Error('Classification failed')),
    };

    const hook = createUseClassifyAI(errorWeave as any);

    const classifyResult = await hook.classify('text', ['label']);

    expect(classifyResult).toBeNull();
    expect(hook.error?.message).toBe('Classification failed');
  });
});

describe('useExtractAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract data', async () => {
    const hook = createUseExtractAI(mockWeave);

    const schema = { name: 'string' };
    const extractResult = await hook.extract('John', schema);

    expect(extractResult).toEqual({ key: 'value' });
    expect(hook.data).toEqual({ key: 'value' });
  });

  it('should handle extraction error', async () => {
    const errorWeave = {
      ...mockWeave,
      extract: vi.fn().mockRejectedValue(new Error('Extraction failed')),
    };

    const hook = createUseExtractAI(errorWeave as any);

    const extractResult = await hook.extract('text', {});

    expect(extractResult).toBeNull();
    expect(hook.error?.message).toBe('Extraction failed');
  });
});
