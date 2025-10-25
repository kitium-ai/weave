/**
 * Svelte stores tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAIStore, createGenerateStore, createClassifyStore, createExtractStore } from '../src/stores/ai.js';
import type { Weave } from '@weave/core';

const mockWeave: Weave = {
  generate: vi.fn().mockResolvedValue({ text: 'Generated text' }),
  classify: vi.fn().mockResolvedValue({ label: 'positive', confidence: 0.95 }),
  extract: vi.fn().mockResolvedValue({ key: 'value' }),
  getModel: vi.fn().mockReturnValue({ chat: vi.fn() }),
} as any;

describe('createAIStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with idle state', (done) => {
    const store = createAIStore(mockWeave);
    let unsubscribe: any;

    unsubscribe = store.state.subscribe((state) => {
      expect(state.data).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.status).toBe('idle');
      unsubscribe();
      done();
    });
  });

  it('should execute async function successfully', async (done) => {
    const store = createAIStore<string>(mockWeave);
    const fn = vi.fn().mockResolvedValue('result');

    const result = await store.execute(fn);

    expect(result).toBe('result');

    let unsubscribe: any;
    unsubscribe = store.state.subscribe((state) => {
      if (state.status === 'success') {
        expect(state.data).toBe('result');
        expect(state.error).toBeNull();
        expect(state.loading).toBe(false);
        unsubscribe();
        done();
      }
    });
  });

  it('should handle errors', async (done) => {
    const store = createAIStore(mockWeave);
    const testError = new Error('Test error');
    const fn = vi.fn().mockRejectedValue(testError);

    const result = await store.execute(fn);

    expect(result).toBeNull();

    let unsubscribe: any;
    unsubscribe = store.state.subscribe((state) => {
      if (state.status === 'error') {
        expect(state.error?.message).toBe('Test error');
        expect(state.loading).toBe(false);
        unsubscribe();
        done();
      }
    });
  });

  it('should reset state', async (done) => {
    const store = createAIStore<string>(mockWeave);
    const fn = vi.fn().mockResolvedValue('result');

    await store.execute(fn);
    store.reset();

    let unsubscribe: any;
    unsubscribe = store.state.subscribe((state) => {
      if (state.status === 'idle') {
        expect(state.data).toBeNull();
        expect(state.loading).toBe(false);
        expect(state.error).toBeNull();
        unsubscribe();
        done();
      }
    });
  });
});

describe('createGenerateStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate text', async (done) => {
    const mockWeaveWithGenerate: Weave = {
      ...mockWeave,
      generate: vi.fn().mockResolvedValue({ text: 'Generated' }),
    } as any;

    const store = createGenerateStore(mockWeaveWithGenerate);
    const result = await store.generate('prompt');

    expect(result).toBe('Generated');

    let unsubscribe: any;
    unsubscribe = store.state.subscribe((state) => {
      if (state.status === 'success') {
        expect(state.data).toBe('Generated');
        unsubscribe();
        done();
      }
    });
  });

  it('should handle generation error', async (done) => {
    const mockWeaveWithError: Weave = {
      ...mockWeave,
      generate: vi.fn().mockRejectedValue(new Error('Generation failed')),
    } as any;

    const store = createGenerateStore(mockWeaveWithError);
    const result = await store.generate('prompt');

    expect(result).toBeNull();

    let unsubscribe: any;
    unsubscribe = store.state.subscribe((state) => {
      if (state.status === 'error') {
        expect(state.error?.message).toBe('Generation failed');
        unsubscribe();
        done();
      }
    });
  });
});

describe('createClassifyStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should classify text', async (done) => {
    const mockWeaveWithClassify: Weave = {
      ...mockWeave,
      classify: vi.fn().mockResolvedValue({ label: 'positive' }),
    } as any;

    const store = createClassifyStore(mockWeaveWithClassify);
    const result = await store.classify('Good product', ['positive', 'negative']);

    expect(result).toEqual({ label: 'positive' });

    let unsubscribe: any;
    unsubscribe = store.state.subscribe((state) => {
      if (state.status === 'success') {
        expect(state.data).toEqual({ label: 'positive' });
        unsubscribe();
        done();
      }
    });
  });
});

describe('createExtractStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract data', async (done) => {
    const mockWeaveWithExtract: Weave = {
      ...mockWeave,
      extract: vi.fn().mockResolvedValue({ name: 'John', age: 30 }),
    } as any;

    const store = createExtractStore(mockWeaveWithExtract);
    const schema = { name: 'string', age: 'number' };
    const result = await store.extract('John is 30 years old', schema);

    expect(result).toEqual({ name: 'John', age: 30 });

    let unsubscribe: any;
    unsubscribe = store.state.subscribe((state) => {
      if (state.status === 'success') {
        expect(state.data).toEqual({ name: 'John', age: 30 });
        unsubscribe();
        done();
      }
    });
  });
});
