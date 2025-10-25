/**
 * useAI hook - Execute AI operations with state management
 */

import { useState, useCallback, useRef } from 'react';
import type { GenerateOptions, ClassifyOptions, ExtractOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';

/**
 * AI operation status
 */
export type AIStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * useAI hook options
 */
export interface UseAIOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

/**
 * useAI hook return type
 */
export interface UseAIReturn<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: AIStatus;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
}

/**
 * Hook for executing AI operations with state management
 */
export function useAI<T = unknown>(options?: UseAIOptions<T>): UseAIReturn<T> {
  const { weave } = useWeaveContext();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        options?.onError?.(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        options?.onStart?.();

        abortControllerRef.current = new AbortController();
        const result = await fn();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [weave, options]
  );

  return {
    data,
    loading,
    error,
    status: loading ? 'loading' : error ? 'error' : data ? 'success' : 'idle',
    execute,
  };
}

/**
 * Hook for generate operation
 */
export function useGenerateAI(options?: UseAIOptions<string>) {
  const { weave } = useWeaveContext();
  const aiHook = useAI<string>(options);

  const generate = useCallback(
    async (prompt: string, generateOptions?: GenerateOptions): Promise<string | null> => {
      return aiHook.execute(async () => {
        if (!weave) {
          throw new Error('Weave instance not available');
        }
        const result = await weave.generate(prompt, generateOptions);
        return result.text;
      });
    },
    [weave, aiHook]
  );

  return {
    ...aiHook,
    generate,
  };
}

/**
 * Hook for classify operation
 */
export function useClassifyAI(options?: UseAIOptions<{ label: string; confidence: number }>) {
  const { weave } = useWeaveContext();
  const aiHook = useAI<{ label: string; confidence: number }>(options);

  const classify = useCallback(
    async (text: string, labels: string[], classifyOptions?: ClassifyOptions) => {
      return aiHook.execute(async () => {
        if (!weave) {
          throw new Error('Weave instance not available');
        }
        const result = await weave.classify(text, labels, classifyOptions);
        return {
          label: result.label,
          confidence: result.confidence,
        };
      });
    },
    [weave, aiHook]
  );

  return {
    ...aiHook,
    classify,
  };
}

/**
 * Hook for extract operation
 */
export function useExtractAI(options?: UseAIOptions<unknown>) {
  const { weave } = useWeaveContext();
  const aiHook = useAI<unknown>(options);

  const extract = useCallback(
    async (text: string, schema: unknown, extractOptions?: ExtractOptions) => {
      return aiHook.execute(async () => {
        if (!weave) {
          throw new Error('Weave instance not available');
        }
        return weave.extract(text, schema, extractOptions);
      });
    },
    [weave, aiHook]
  );

  return {
    ...aiHook,
    extract,
  };
}
