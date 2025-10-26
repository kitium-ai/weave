/**
 * useUtilGenerator - Generate utility functions with AI
 */

import { useCallback, useState } from 'react';
import type { GenerateOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';
import { UtilBuilder } from '../generators/util-builder.js';
import { UtilSpecParser } from '../generators/generator-parsers.js';
import type { GeneratedUtils } from '../generators/util-builder.js';
import type { UtilSpec } from '../generators/util-builder.js';

/**
 * useUtilGenerator return type
 */
export interface UseUtilGeneratorReturn {
  utils: GeneratedUtils | null;
  loading: boolean;
  error: Error | null;
  generate: (utilName: string, description: string, options?: GenerateOptions) => Promise<GeneratedUtils | null>;
  generateMultiple: (
    utilNames: string[],
    description: string,
    options?: GenerateOptions
  ) => Promise<GeneratedUtils | null>;
}

/**
 * Hook for generating utility functions with AI
 *
 * @example
 * ```typescript
 * const { utils, loading, generate } = useUtilGenerator();
 *
 * await generate(
 *   'formatDate',
 *   'A utility function that formats a date to ISO string format'
 * );
 * ```
 */
export function useUtilGenerator(): UseUtilGeneratorReturn {
  const { weave } = useWeaveContext();
  const [utils, setUtils] = useState<GeneratedUtils | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (utilName: string, description: string, options?: GenerateOptions): Promise<GeneratedUtils | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Parse description into utility specification
        const spec = UtilSpecParser.parse(description, utilName);

        // Build the utilities
        const generatedUtils = UtilBuilder.buildUtils([spec], description);

        setUtils(generatedUtils);
        return generatedUtils;
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

  const generateMultiple = useCallback(
    async (utilNames: string[], description: string, options?: GenerateOptions): Promise<GeneratedUtils | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Parse descriptions into utility specifications
        const specs: UtilSpec[] = utilNames.map((name) =>
          UtilSpecParser.parse(`${name}: ${description}`, name)
        );

        // Build all utilities
        const generatedUtils = UtilBuilder.buildUtils(specs, description);

        setUtils(generatedUtils);
        return generatedUtils;
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
    utils,
    loading,
    error,
    generate,
    generateMultiple,
  };
}
