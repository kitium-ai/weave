/**
 * useGeneration Hook
 * React hook for managing AI content generation
 */

import { useState, useCallback, useRef } from 'react';
import type { GenerateResponse } from '../types/index.js';

interface UseGenerationOptions {
  onSuccess?: (result: GenerateResponse) => void;
  onError?: (error: Error) => void;
  autoStream?: boolean;
}

interface GenerationState {
  data: GenerateResponse | null;
  loading: boolean;
  error: Error | null;
  progress: number;
  streamingText: string;
}

/**
 * Hook for managing content generation
 */
export function useGeneration(options: UseGenerationOptions = {}) {
  const [state, setState] = useState<GenerationState>({
    data: null,
    loading: false,
    error: null,
    progress: 0,
    streamingText: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Generate content
   */
  const generate = useCallback(
    async (prompt: string, provider: string = 'default') => {
      try {
        setState(prev => ({
          ...prev,
          loading: true,
          error: null,
          progress: 0,
          streamingText: '',
        }));

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, provider }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`Generation failed: ${response.statusText}`);
        }

        const result = await response.json();

        setState(prev => ({
          ...prev,
          data: result.data,
          loading: false,
        }));

        options.onSuccess?.(result.data);
        return result.data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        setState(prev => ({
          ...prev,
          error: err,
          loading: false,
        }));

        options.onError?.(err);
        throw err;
      }
    },
    [options]
  );

  /**
   * Generate with streaming
   */
  const generateStream = useCallback(
    async (prompt: string, provider: string = 'default') => {
      try {
        setState(prev => ({
          ...prev,
          loading: true,
          error: null,
          progress: 0,
          streamingText: '',
        }));

        const response = await fetch('/api/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, provider }),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          throw new Error(`Stream generation failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        let streamingText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.token) {
                  streamingText += data.token;
                  setState(prev => ({
                    ...prev,
                    streamingText,
                    progress: Math.min(100, prev.progress + 5),
                  }));
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }

        setState(prev => ({
          ...prev,
          loading: false,
          progress: 100,
        }));

        return streamingText;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        setState(prev => ({
          ...prev,
          error: err,
          loading: false,
        }));

        options.onError?.(err);
        throw err;
      }
    },
    [options]
  );

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(prev => ({
      ...prev,
      loading: false,
    }));
  }, []);

  /**
   * Clear state
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      progress: 0,
      streamingText: '',
    });
  }, []);

  return {
    // State
    data: state.data,
    loading: state.loading,
    error: state.error,
    progress: state.progress,
    streamingText: state.streamingText,

    // Methods
    generate,
    generateStream,
    cancel,
    reset,
  };
}
