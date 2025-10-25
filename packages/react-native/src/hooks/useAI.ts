/**
 * React Native hooks for Weave AI framework
 */

import { useState, useCallback, useRef } from 'react';
import type { Weave, GenerateOptions } from '@weaveai/core';

export interface UseAIOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

export interface UseAIReturn<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  execute: (fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * React Native hook for AI operations
 */
export function useAI<T = unknown>(_weave: Weave, options?: UseAIOptions): UseAIReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const isMountedRef = useRef(true);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      if (!isMountedRef.current) {
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        setStatus('loading');
        options?.onStart?.();

        const result = await fn();

        if (isMountedRef.current) {
          setData(result);
          setStatus('success');
          options?.onSuccess?.(result);
        }

        return result;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));

        if (isMountedRef.current) {
          setError(errorObj);
          setStatus('error');
          options?.onError?.(errorObj);
        }

        return null;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [options]
  );

  return {
    data,
    loading,
    error,
    status,
    execute,
  };
}

/**
 * React Native hook for text generation
 */
export function useGenerateAI(weave: Weave, options?: UseAIOptions) {
  const { data, loading, error, status, execute } = useAI<string>(weave, options);

  const generate = useCallback(
    async (prompt: string, generateOptions?: GenerateOptions): Promise<string | null> => {
      return execute(async () => {
        const result = await weave.generate(prompt, generateOptions);
        return result.text;
      });
    },
    [weave, execute]
  );

  return {
    data,
    loading,
    error,
    status,
    generate,
  };
}

/**
 * React Native hook for text classification
 */
export function useClassifyAI(weave: Weave, options?: UseAIOptions) {
  const { data, loading, error, status, execute } = useAI(weave, options);

  const classify = useCallback(
    async (text: string, labels: string[]) => {
      return execute(async () => {
        return await weave.classify(text, labels);
      });
    },
    [weave, execute]
  );

  return {
    data,
    loading,
    error,
    status,
    classify,
  };
}

/**
 * React Native hook for data extraction
 */
export function useExtractAI(weave: Weave, options?: UseAIOptions) {
  const { data, loading, error, status, execute } = useAI(weave, options);

  const extract = useCallback(
    async (text: string, schema: unknown) => {
      return execute(async () => {
        return await weave.extract(text, schema);
      });
    },
    [weave, execute]
  );

  return {
    data,
    loading,
    error,
    status,
    extract,
  };
}
