/**
 * useQueryGenerator - Generate React Query hooks with AI
 */

import { useCallback, useState } from 'react';
import type { GenerateOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';
import { QueryBuilder } from '../generators/query-builder.js';
import { QuerySpecParser } from '../generators/generator-parsers.js';
import type { GeneratedQuery } from '../generators/query-builder.js';

/**
 * useQueryGenerator return type
 */
export interface UseQueryGeneratorReturn {
  query: GeneratedQuery | null;
  loading: boolean;
  error: Error | null;
  generate: (queryName: string, description: string, options?: GenerateOptions) => Promise<GeneratedQuery | null>;
}

/**
 * Hook for generating React Query hooks with AI
 *
 * @example
 * ```typescript
 * const { query, loading, generate } = useQueryGenerator();
 *
 * await generate(
 *   'useGetUsers',
 *   'A React Query hook for fetching users from GET /api/users with caching and error handling'
 * );
 * ```
 */
export function useQueryGenerator(): UseQueryGeneratorReturn {
  const { weave } = useWeaveContext();
  const [query, setQuery] = useState<GeneratedQuery | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (queryName: string, description: string, options?: GenerateOptions): Promise<GeneratedQuery | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Parse description into query specification
        const spec = QuerySpecParser.parse(description, queryName);

        // Build the query hook
        const generatedQuery = QueryBuilder.buildQuery(spec, description);

        setQuery(generatedQuery);
        return generatedQuery;
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
    query,
    loading,
    error,
    generate,
  };
}
