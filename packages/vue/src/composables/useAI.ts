/**
 * Vue 3 composable for AI operations
 */

import { ref, computed, inject, type Ref, type ComputedRef } from 'vue';
import type { Weave, GenerateOptions } from '@weaveai/core';

export interface UseAIOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

export interface UseAIReturn<T = unknown> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: ComputedRef<'idle' | 'loading' | 'success' | 'error'>;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Composable for AI operations with state management
 */
export function useAI<T = unknown>(options?: UseAIOptions): UseAIReturn<T> {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const _status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');

  const status = computed(() => _status.value);

  const execute = async (fn: () => Promise<T>): Promise<T | null> => {
    if (!fn) {
      return null;
    }

    try {
      loading.value = true;
      error.value = null;
      _status.value = 'loading';
      options?.onStart?.();

      const result = await fn();
      data.value = result;
      _status.value = 'success';
      options?.onSuccess?.(result);

      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      error.value = errorObj;
      _status.value = 'error';
      options?.onError?.(errorObj);
      return null;
    } finally {
      loading.value = false;
    }
  };

  return {
    data: data as Ref<T | null>,
    loading,
    error,
    status,
    execute,
  };
}

/**
 * Vue composable for text generation
 */
export function useGenerateAI(options?: UseAIOptions) {
  const weave = inject<Weave>('weave');
  const { data, loading, error, status, execute } = useAI<string>(options);

  const generate = async (
    prompt: string,
    generateOptions?: GenerateOptions
  ): Promise<string | null> => {
    return execute(async () => {
      if (!weave) {
        throw new Error('Weave not provided');
      }
      const result = await weave.generate(prompt, generateOptions);
      return result.text;
    });
  };

  return {
    data,
    loading,
    error,
    status,
    generate,
  };
}

/**
 * Vue composable for text classification
 */
export function useClassifyAI(options?: UseAIOptions) {
  const weave = inject<Weave>('weave');
  const { data, loading, error, status, execute } = useAI(options);

  const classify = async (text: string, labels: string[]) => {
    return execute(async () => {
      if (!weave) {
        throw new Error('Weave not provided');
      }
      return await weave.classify(text, labels);
    });
  };

  return {
    data,
    loading,
    error,
    status,
    classify,
  };
}

/**
 * Vue composable for data extraction
 */
export function useExtractAI(options?: UseAIOptions) {
  const weave = inject<Weave>('weave');
  const { data, loading, error, status, execute } = useAI(options);

  const extract = async (text: string, schema: unknown) => {
    return execute(async () => {
      if (!weave) {
        throw new Error('Weave not provided');
      }
      return await weave.extract(text, schema);
    });
  };

  return {
    data,
    loading,
    error,
    status,
    extract,
  };
}
