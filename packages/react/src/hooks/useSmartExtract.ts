import { useCallback, useMemo, useRef, useState } from 'react';
import type { ExtractOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';

export interface UseSmartExtractOptions<TOutput = Record<string, unknown>> {
  targetSchema: unknown;
  fuzzyMatch?: boolean;
  confidence?: number;
  extractOptions?: ExtractOptions;
  promptPrefix?: string;
  promptSuffix?: string;
}

export interface UseSmartExtractRunOptions<TOutput = Record<string, unknown>>
  extends Partial<UseSmartExtractOptions<TOutput>> {
  overrideConfidence?: number;
}

export interface SmartExtractResult<TOutput> {
  data: TOutput | null;
  confidence: number;
  missingFields: string[];
}

export interface UseSmartExtractReturn<TOutput = Record<string, unknown>> {
  extract: (
    input: string,
    options?: UseSmartExtractRunOptions<TOutput>
  ) => Promise<SmartExtractResult<TOutput> | null>;
  loading: boolean;
  error: Error | null;
  lastResult: SmartExtractResult<TOutput> | null;
  reset: () => void;
}

function getSchemaKeys(schema: unknown): string[] {
  if (schema && typeof schema === 'object') {
    if ('properties' in (schema as Record<string, unknown>)) {
      return Object.keys((schema as { properties: Record<string, unknown> }).properties);
    }

    return Object.keys(schema as Record<string, unknown>);
  }

  return [];
}

function buildExtractionPrompt(
  input: string,
  schema: unknown,
  fuzzy: boolean,
  confidenceHint?: number,
  prefix?: string,
  suffix?: string
): string {
  const lines: string[] = [];
  if (prefix) {
    lines.push(prefix.trim());
  }

  lines.push('You are an expert data extractor.');
  lines.push(
    fuzzy
      ? 'Perform fuzzy matching on field names and infer values when possible while keeping output trustworthy.'
      : 'Only map fields that exactly match the schema; leave missing fields as null.'
  );

  if (confidenceHint) {
    lines.push(`Target confidence threshold: ${confidenceHint}.`);
  }

  lines.push('Schema (JSON):');
  lines.push(JSON.stringify(schema, null, 2));
  lines.push('Source Input:');
  lines.push(input);
  lines.push('Return a JSON object that matches the schema keys exactly. Use `null` when no value is found.');

  if (suffix) {
    lines.push(suffix.trim());
  }

  return lines.join('\n\n');
}

function evaluateConfidence<TOutput extends Record<string, unknown>>(
  result: TOutput,
  schema: unknown
): { score: number; missing: string[] } {
  const keys = getSchemaKeys(schema);
  if (keys.length === 0) {
    return { score: 1, missing: [] };
  }

  const missing: string[] = [];
  let matches = 0;

  for (const key of keys) {
    const value = result[key as keyof TOutput];
    if (value === undefined || value === null || value === '') {
      missing.push(key);
    } else {
      matches += 1;
    }
  }

  return {
    score: matches / keys.length,
    missing,
  };
}

export function useSmartExtract<TOutput extends Record<string, unknown> = Record<string, unknown>>(
  options: UseSmartExtractOptions<TOutput>
): UseSmartExtractReturn<TOutput> {
  const { weave } = useWeaveContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastResultRef = useRef<SmartExtractResult<TOutput> | null>(null);

  const extract = useCallback(
    async (
      input: string,
      runOptions?: UseSmartExtractRunOptions<TOutput>
    ): Promise<SmartExtractResult<TOutput> | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        return null;
      }

      setLoading(true);
      setError(null);

      const mergedOptions: UseSmartExtractOptions<TOutput> = {
        ...options,
        ...(runOptions ?? {}),
      };

      const confidenceThreshold =
        runOptions?.overrideConfidence ?? mergedOptions.confidence ?? 0.7;

      const prompt = buildExtractionPrompt(
        input,
        mergedOptions.targetSchema,
        mergedOptions.fuzzyMatch ?? false,
        confidenceThreshold,
        mergedOptions.promptPrefix,
        mergedOptions.promptSuffix
      );

      const schemaForOptions =
        (mergedOptions.targetSchema as ExtractOptions['schema']) ??
        ({ type: 'object', properties: {} } as ExtractOptions['schema']);

      const baseExtractOptions: ExtractOptions = {
        schema: schemaForOptions,
        strict: !(mergedOptions.fuzzyMatch ?? false),
      };

      const extractOptions: ExtractOptions = {
        ...baseExtractOptions,
        ...(options.extractOptions ?? {}),
        ...(runOptions?.extractOptions ?? {}),
      };

      try {
        const raw = await weave.extract(prompt, mergedOptions.targetSchema, extractOptions);
        if (!raw || typeof raw !== 'object') {
          throw new Error('Extraction returned an unexpected result');
        }

        const result = raw as TOutput;
        const { score, missing } = evaluateConfidence(result, mergedOptions.targetSchema);

        if (score < confidenceThreshold) {
          const confidenceError = new Error(
            `Extraction confidence ${score.toFixed(2)} below threshold ${confidenceThreshold}`
          );
          setError(confidenceError);
          lastResultRef.current = {
            data: result,
            confidence: score,
            missingFields: missing,
          };
          return null;
        }

        const payload: SmartExtractResult<TOutput> = {
          data: result,
          confidence: score,
          missingFields: missing,
        };

        lastResultRef.current = payload;
        return payload;
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error(String(err));
        setError(errorInstance);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [weave, options]
  );

  const reset = useCallback(() => {
    setError(null);
    lastResultRef.current = null;
  }, []);

  return useMemo(
    () => ({
      extract,
      loading,
      error,
      lastResult: lastResultRef.current,
      reset,
    }),
    [extract, loading, error, reset]
  );
}
