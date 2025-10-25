/**
 * Vue 3 composable for AI operations
 */

import { ref, computed } from 'vue';
import { inject } from 'vue';
import type { Weave } from '@weave/core';
import type { GenerateOptions, GenerateResult } from '@weave/core';

export interface UseAIOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

export interface UseAIReturn<T = unknown> {
  data: import('vue').Ref<T | null>;
  loading: import('vue').Ref<boolean>;
  error: import('vue').Ref<Error | null>;
  status: import('vue').ComputedRef<'idle' | 'loading' | 'success' | 'error'>;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Composable for AI operations with state management
 */
export function useAI<T = unknown>(options?: UseAIOptions): UseAIReturn<T> {
  const weave = inject<Weave>('weave');
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const _status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');

  const status = computed(() => _status.value);

  const execute = async (fn: () => Promise<T>): Promise<T | null> => {
    if (!fn) return null;

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
    data,
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

  const generate = async (prompt: string, generateOptions?: GenerateOptions): Promise<string | null> => {
    return execute(async () => {
      if (!weave) throw new Error('Weave not provided');
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
      if (!weave) throw new Error('Weave not provided');
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
      if (!weave) throw new Error('Weave not provided');
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
