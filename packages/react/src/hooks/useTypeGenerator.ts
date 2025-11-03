/**
 * useTypeGenerator - Generate TypeScript types with AI
 */

import { useCallback, useState } from 'react';
import type { GenerateOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';
import { TypeBuilder } from '../generators/type-builder.js';
import { TypeSpecParser } from '../generators/generator-parsers.js';
import type { GeneratedTypes } from '../generators/type-builder.js';
import type { TypeSpec } from '../generators/type-builder.js';

/**
 * useTypeGenerator return type
 */
export interface UseTypeGeneratorReturn {
  types: GeneratedTypes | null;
  loading: boolean;
  error: Error | null;
  generate: (
    typeName: string,
    description: string,
    options?: GenerateOptions
  ) => Promise<GeneratedTypes | null>;
  generateMultiple: (
    typeNames: string[],
    description: string,
    options?: GenerateOptions
  ) => Promise<GeneratedTypes | null>;
}

/**
 * Hook for generating TypeScript types with AI
 *
 * @example
 * ```typescript
 * const { types, loading, generate } = useTypeGenerator();
 *
 * await generate(
 *   'User',
 *   'A user domain type with id, email, name, role, and timestamps'
 * );
 * ```
 */
export function useTypeGenerator(): UseTypeGeneratorReturn {
  const { weave } = useWeaveContext();
  const [types, setTypes] = useState<GeneratedTypes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (
      typeName: string,
      description: string,
      _options?: GenerateOptions
    ): Promise<GeneratedTypes | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Parse description into type specification
        const spec = TypeSpecParser.parse(description, typeName);

        // Build the types
        const generatedTypes = TypeBuilder.buildTypes([spec], description);

        setTypes(generatedTypes);
        return generatedTypes;
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
    async (
      typeNames: string[],
      description: string,
      _options?: GenerateOptions
    ): Promise<GeneratedTypes | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Parse descriptions into type specifications
        const specs: TypeSpec[] = typeNames.map((name) =>
          TypeSpecParser.parse(`${name}: ${description}`, name)
        );

        // Build all types
        const generatedTypes = TypeBuilder.buildTypes(specs, description);

        setTypes(generatedTypes);
        return generatedTypes;
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
    types,
    loading,
    error,
    generate,
    generateMultiple,
  };
}
