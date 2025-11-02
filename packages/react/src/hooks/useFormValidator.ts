import { useCallback, useMemo, useRef, useState } from 'react';
import type { ExtractOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';

export type FormValidatorOperation = 'extract';

export interface FormValidationIssue {
  message: string;
  suggestion?: string;
  path?: Array<string | number>;
  confidence?: number;
  correctedValue?: unknown;
}

export interface UseFormValidatorOptions<TData extends Record<string, unknown>> {
  schema: unknown;
  operation?: FormValidatorOperation;
  contextAwareness?: boolean;
  extractOptions?: ExtractOptions;
  confidenceThreshold?: number;
  autoSanitize?: boolean;
  transformInput?: (data: TData) => string;
}

export interface UseFormValidatorReturn<TData extends Record<string, unknown>> {
  validate: (data: TData) => Promise<boolean>;
  errors: Record<string, FormValidationIssue>;
  validating: boolean;
  lastValidData?: TData;
  corrected?: Partial<TData>;
  reset: () => void;
}

interface LocalValidationResult<TData> {
  valid: boolean;
  issues: FormValidationIssue[];
  parsed?: TData;
}

interface ZodLikeSchema<TData> {
  safeParse: (
    input: unknown
  ) =>
    | {
        success: true;
        data: TData;
      }
    | {
        success: false;
        error: {
          issues: Array<{
            path: Array<string | number>;
            message: string;
          }>;
        };
      };
}

function isZodLikeSchema<TData>(schema: unknown): schema is ZodLikeSchema<TData> {
  return Boolean(schema && typeof schema === 'object' && 'safeParse' in (schema as Record<string, unknown>));
}

function runLocalValidation<TData extends Record<string, unknown>>(
  schema: unknown,
  data: TData
): LocalValidationResult<TData> {
  if (!schema) {
    return { valid: true, issues: [], parsed: data };
  }

  if (isZodLikeSchema<TData>(schema)) {
    const result = schema.safeParse(data);
    if (result.success) {
      return { valid: true, issues: [], parsed: result.data };
    }

    const issues = result.error.issues.map<FormValidationIssue>((issue) => ({
      message: issue.message,
      path: issue.path,
    }));
    return { valid: false, issues };
  }

  if (typeof schema === 'function') {
    const outcome = (schema as (input: TData) => unknown)(data);
    if (outcome === true || outcome === undefined || outcome === null) {
      return { valid: true, issues: [], parsed: data };
    }

    if (outcome === false) {
      return {
        valid: false,
        issues: [
          {
            message: 'Validation failed',
          },
        ],
      };
    }

    if (typeof outcome === 'object') {
      const record = outcome as Record<string, unknown>;
      const issues: FormValidationIssue[] = [];
      for (const [field, value] of Object.entries(record)) {
        if (typeof value === 'string') {
          issues.push({
            message: value,
            path: [field],
          });
        } else if (value && typeof value === 'object' && 'message' in value) {
          const issueValue = value as { message: string; suggestion?: string };
          issues.push({
            message: issueValue.message,
            suggestion: issueValue.suggestion,
            path: [field],
          });
        }
      }

      if (issues.length === 0) {
        return { valid: true, issues: [], parsed: data };
      }

      return { valid: false, issues };
    }
  }

  return { valid: true, issues: [], parsed: data };
}

function toErrorMap(issues: FormValidationIssue[]): Record<string, FormValidationIssue> {
  const map: Record<string, FormValidationIssue> = {};
  for (const issue of issues) {
    const key = issue.path ? issue.path.join('.') : '_root';
    map[key] = issue;
  }
  return map;
}

function buildValidationPrompt<TData extends Record<string, unknown>>(
  data: TData,
  schema: unknown,
  issues: FormValidationIssue[],
  contextAwareness: boolean
): string {
  const issuesText =
    issues.length === 0
      ? 'No explicit issues supplied, perform holistic validation.'
      : issues
          .map((issue, index) => {
            const path = issue.path ? issue.path.join('.') : 'root';
            return `${index + 1}. Field "${path}": ${issue.message}`;
          })
          .join('\n');

  return [
    'You are an expert form validator.',
    contextAwareness
      ? 'Consider relationships between fields (e.g. date ranges, dependency between values) when validating.'
      : 'Focus on field-level validation based on the schema.',
    'Schema (JSON):',
    JSON.stringify(schema, null, 2),
    'Current form data (JSON):',
    JSON.stringify(data, null, 2),
    'Known issues:',
    issuesText,
    'Return a JSON object that matches the schema, correcting issues where possible. Include only keys defined by the schema.',
  ].join('\n\n');
}

function computeConfidence<TData extends Record<string, unknown>>(
  original: TData,
  corrected: Partial<TData>,
  schema: unknown
): number {
  const schemaKeys: string[] = [];
  if (schema && typeof schema === 'object' && 'properties' in (schema as Record<string, unknown>)) {
    schemaKeys.push(...Object.keys((schema as { properties: Record<string, unknown> }).properties));
  } else {
    schemaKeys.push(...Object.keys(original));
  }

  if (schemaKeys.length === 0) {
    return 1;
  }

  let matches = 0;
  for (const key of schemaKeys) {
    if (corrected[key as keyof TData] !== undefined) {
      matches += 1;
    }
  }

  return matches / schemaKeys.length;
}

export function useFormValidator<TData extends Record<string, unknown>>(
  options: UseFormValidatorOptions<TData>
): UseFormValidatorReturn<TData> {
  const { weave } = useWeaveContext();
  const [errors, setErrors] = useState<Record<string, FormValidationIssue>>({});
  const [validating, setValidating] = useState(false);
  const lastValidDataRef = useRef<TData | undefined>();
  const correctedRef = useRef<Partial<TData> | undefined>();

  const operation = options.operation ?? 'extract';
  const confidenceThreshold = options.confidenceThreshold ?? 0.7;

  const validate = useCallback(
    async (data: TData): Promise<boolean> => {
      setValidating(true);
      correctedRef.current = undefined;

      try {
        const localResult = runLocalValidation<TData>(options.schema, data);
        if (localResult.valid) {
          setErrors({});
          lastValidDataRef.current = localResult.parsed ?? data;
          return true;
        }

        const localErrors = toErrorMap(localResult.issues);
        setErrors(localErrors);

        if (operation !== 'extract' || !weave) {
          return false;
        }

        const prompt =
          typeof options.transformInput === 'function'
            ? options.transformInput(data)
            : buildValidationPrompt(data, options.schema, localResult.issues, options.contextAwareness ?? false);

        const schemaForOptions =
          (options.schema as ExtractOptions['schema']) ??
          ({ type: 'object', properties: {} } as ExtractOptions['schema']);

        const baseExtractOptions: ExtractOptions = {
          schema: schemaForOptions,
          strict: !(options.contextAwareness ?? false),
        };

        const extractOptions: ExtractOptions = {
          ...baseExtractOptions,
          ...(options.extractOptions ?? {}),
        };

        let corrected: unknown;
        try {
          corrected = await weave.extract(prompt, options.schema, extractOptions);
        } catch (error) {
          console.warn('Weave extract validation failed', error);
          return false;
        }

        if (!corrected || typeof corrected !== 'object') {
          return false;
        }

        const correctedData = corrected as Partial<TData>;
        const confidenceScore = computeConfidence(data, correctedData, options.schema);

        if (confidenceScore < confidenceThreshold) {
          setErrors((prev) => ({
            ...prev,
            _confidence: {
              message: `Validation result confidence ${confidenceScore.toFixed(2)} below threshold ${confidenceThreshold}`,
              confidence: confidenceScore,
            },
          }));
          return false;
        }

        const sanitizedData = {
          ...data,
          ...correctedData,
        };

        const sanitizedValidation = runLocalValidation<TData>(options.schema, sanitizedData as TData);

        if (!sanitizedValidation.valid) {
          const sanitizedErrorMap = toErrorMap(sanitizedValidation.issues);
          lastValidDataRef.current = undefined;
          correctedRef.current = correctedData;
          setErrors({ ...localErrors, ...sanitizedErrorMap });
          return false;
        }

        correctedRef.current = correctedData;

        if (options.autoSanitize) {
          lastValidDataRef.current = sanitizedData as TData;
        } else {
          lastValidDataRef.current = undefined;
        }

        setErrors({});
        return true;
      } finally {
        setValidating(false);
      }
    },
    [
      options.schema,
      options.contextAwareness,
      options.extractOptions,
      options.autoSanitize,
      options.transformInput,
      confidenceThreshold,
      operation,
      weave,
    ]
  );

  const reset = useCallback(() => {
    setErrors({});
    lastValidDataRef.current = undefined;
    correctedRef.current = undefined;
  }, []);

  return useMemo(
    () => ({
      validate,
      errors,
      validating,
      lastValidData: lastValidDataRef.current,
      corrected: correctedRef.current,
      reset,
    }),
    [validate, errors, validating, reset]
  );
}
