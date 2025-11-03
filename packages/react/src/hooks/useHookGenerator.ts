/**
 * useHookGenerator - Generate React custom hooks with AI
 */

import { useCallback, useState } from 'react';
import type { GenerateOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';
import { HookBuilder } from '../generators/hook-builder.js';
import { HookSpecParser } from '../generators/generator-parsers.js';
import type { GeneratedHook } from '../generators/hook-builder.js';

/**
 * useHookGenerator return type
 */
export interface UseHookGeneratorReturn {
  hook: GeneratedHook | null;
  loading: boolean;
  error: Error | null;
  generate: ( hookName: string, description: string, _options ?: GenerateOptions) => Promise<GeneratedHook | null>;
}

/**
 * Hook for generating React custom hooks with AI
 *
 * @example
 * ```typescript
 * const { hook, loading, generate } = useHookGenerator();
 *
 * await generate(
 *   'useAuth',
 *   'A hook that manages user authentication with login, logout, token refresh'
 * );
 * ```
 */
export function useHookGenerator(): UseHookGeneratorReturn {
  const { weave } = useWeaveContext();
  const [hook, setHook] = useState<GeneratedHook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async ( hookName: string, description: string, _options ?: GenerateOptions): Promise<GeneratedHook | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Parse description into hook specification
        const spec = HookSpecParser.parse(description, hookName);

        // Build the hook
        const generatedHook = HookBuilder.buildHook(spec, description);

        setHook(generatedHook);
        return generatedHook;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [weave]
  );

  return {
    hook,
    loading,
    error,
    generate,
  };
}
