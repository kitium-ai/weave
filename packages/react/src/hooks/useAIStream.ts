/**
 * useAIStream hook - Stream responses from AI operations
 */

import { useState, useCallback } from 'react';
import type { GenerateOptions } from '@weave/core';
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
  streamGenerate: (prompt: string, options?: GenerateOptions) => Promise<string | null>;
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

  const clear = useCallback(() => {
    setChunks([]);
    setFullText('');
    setError(null);
  }, []);

  const streamGenerate = useCallback(
    async (prompt: string, generateOptions?: GenerateOptions): Promise<string | null> => {
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
            setChunks(prev => [...prev, chunk]);
            setFullText(prev => prev + chunk);
            options?.onChunk?.(chunk);
          },
        };

        const result = await weave.generate(prompt, streamingOptions);
        options?.onComplete?.();
        return result.text;
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
    streamGenerate,
    clear,
  };
}
