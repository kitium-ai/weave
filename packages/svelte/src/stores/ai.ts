/**
 * Svelte stores for AI operations
 */

import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { Weave, GenerateOptions } from '@weaveai/core';

export interface AIState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export interface UseAIStoreReturn<T = unknown> {
  state: Readable<AIState<T>>;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
}

/**
 * Create an AI operation store
 */
export function createAIStore<T = unknown>(_weave: Weave): UseAIStoreReturn<T> {
  const initialState: AIState<T> = {
    data: null,
    loading: false,
    error: null,
    status: 'idle',
  };

  const { subscribe, set, update } = writable<AIState<T>>(initialState);

  const execute = async (fn: () => Promise<T>): Promise<T | null> => {
    try {
      update((state) => ({ ...state, loading: true, status: 'loading' }));

      const result = await fn();

      update((state) => ({
        ...state,
        data: result,
        loading: false,
        status: 'success',
        error: null,
      }));

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      update((state) => ({
        ...state,
        loading: false,
        status: 'error',
        error,
      }));

      return null;
    }
  };

  const reset = () => set(initialState);

  return {
    state: { subscribe },
    execute,
    reset,
  };
}

/**
 * Create a generate store
 */
export function createGenerateStore(weave: Weave) {
  const { state, execute, reset } = createAIStore<string>(weave);

  const generate = async (prompt: string, options?: GenerateOptions): Promise<string | null> => {
    return execute(async () => {
      const result = await weave.generate(prompt, options);
      return result.text;
    });
  };

  return {
    state,
    generate,
    reset,
  };
}

/**
 * Create a classify store
 */
export function createClassifyStore(weave: Weave) {
  const { state, execute, reset } = createAIStore(weave);

  const classify = async (text: string, labels: string[]) => {
    return execute(async () => {
      return await weave.classify(text, labels);
    });
  };

  return {
    state,
    classify,
    reset,
  };
}

/**
 * Create an extract store
 */
export function createExtractStore(weave: Weave) {
  const { state, execute, reset } = createAIStore(weave);

  const extract = async (text: string, schema: unknown) => {
    return execute(async () => {
      return await weave.extract(text, schema);
    });
  };

  return {
    state,
    extract,
    reset,
  };
}
