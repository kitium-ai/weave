/**
 * useAIStream hook - Stream responses from AI operations
 */

import { useState, useCallback } from 'react';
import type { GenerateOptions, GenerateResult, WeaveOperationError } from '@weaveai/core';
import { useWeaveContext } from '../context';

/**
 * useAIStream hook options
 */
export interface UseAIStreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}

/**
 * useAIStream hook return type
 */
export interface UseAIStreamReturn {
  chunks: string[];
  fullText: string;
  loading: boolean;
  error: Error | null;
  lastResult: GenerateResult | null;
  streamGenerate: (prompt: string, options?: GenerateOptions) => Promise<GenerateResult | null>;
  clear: () => void;
}

/**
 * Hook for streaming AI responses
 */
export function useAIStream(options?: UseAIStreamOptions): UseAIStreamReturn {
  const { weave } = useWeaveContext();
  const [chunks, setChunks] = useState<string[]>([]);
  const [fullText, setFullText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastResult, setLastResult] = useState<GenerateResult | null>(null);

  const clear = useCallback(() => {
    setChunks([]);
    setFullText('');
    setError(null);
    setLastResult(null);
  }, []);

  const streamGenerate = useCallback(
    async (prompt: string, generateOptions?: GenerateOptions): Promise<GenerateResult | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        options?.onError?.(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        setChunks([]);
        setFullText('');
        options?.onStart?.();

        const streamingOptions: GenerateOptions = {
          ...generateOptions,
          streaming: true,
          onChunk: (chunk: string) => {
            setChunks((prev) => [...prev, chunk]);
            setFullText((prev) => prev + chunk);
            options?.onChunk?.(chunk);
          },
        };

        const result = await weave.generate(prompt, streamingOptions);
        setLastResult(result);

        if (result.status === 'error') {
          const errorDetails: WeaveOperationError | undefined = result.error;
          const opError = new Error(errorDetails?.message ?? 'Streaming generate failed');
          setError(opError);
          options?.onError?.(opError);
          return result;
        }

        setFullText((prev) => {
          if (prev.length > 0) {
            return prev;
          }
          return result.data.text ?? prev;
        });

        options?.onComplete?.();
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
    chunks,
    fullText,
    loading,
    error,
    lastResult,
    streamGenerate,
    clear,
  };
}
