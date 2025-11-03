/**
 * useAI hook - Execute AI operations with state management
 */

import { useState, useCallback, useRef } from 'react';
import type {
  GenerateOptions,
  ClassifyOptions,
  ExtractOptions,
  GenerateResult,
  ClassificationResult,
  ExtractResult,
  WeaveOperationResult,
} from '@weaveai/core';
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
  onError?: (error: Error, result?: T) => void;
  onStart?: () => void;
  trackCosts?: boolean;
  budget?: {
    perOperation?: number;
    perSession?: number;
    onBudgetExceeded?: 'warn' | 'block';
  };
  operation?: 'generate' | 'classify' | 'extract' | 'custom';
}

/**
 * useAI hook return type
 */
export interface UseAIReturn<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: AIStatus;
  cost: CostSummary | null;
  budgetExceeded: boolean;
  resetCost: () => void;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
}

export interface CostSummary {
  totalCost: number;
  currency: string;
  tokens: {
    input: number;
    output: number;
  };
}

/**
 * Hook for executing AI operations with state management
 */
export function useAI<T = unknown>(options?: UseAIOptions<T>): UseAIReturn<T> {
  const { weave } = useWeaveContext();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [budgetExceeded, setBudgetExceeded] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionCostRef = useRef<number>(0);

  const isWeaveResult = (value: unknown): value is WeaveOperationResult =>
    typeof value === 'object' && value !== null && 'status' in value && 'metadata' in value;

  const resetCost = useCallback(() => {
    setCostSummary(null);
    sessionCostRef.current = 0;
    setBudgetExceeded(false);
  }, []);

  const handleBudgetExceeded = useCallback(
    (message: string, mode: 'warn' | 'block', result?: T) => {
      setBudgetExceeded(true);
      if (mode === 'warn') {
        console.warn(message);
      } else {
        const budgetError = new Error(message);
        setError(budgetError);
        options?.onError?.(budgetError, result);
      }
    },
    [options]
  );

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        options?.onError?.(err);
        return null;
      }

      const budget = options?.budget;
      const onBudgetExceeded = budget?.onBudgetExceeded ?? 'warn';

      if (budget?.perSession !== undefined && sessionCostRef.current >= budget.perSession) {
        if (onBudgetExceeded === 'block') {
          const budgetError = new Error('Session budget exceeded');
          setError(budgetError);
          options?.onError?.(budgetError);
          setBudgetExceeded(true);
          return null;
        }
        console.warn('Session budget exceeded');
      }

      try {
        setLoading(true);
        setError(null);
        options?.onStart?.();
        setBudgetExceeded(false);

        abortControllerRef.current = new AbortController();
        const result = await fn();

        if (isWeaveResult(result)) {
          const cost = result.metadata.cost?.total ?? 0;

          if (options?.trackCosts && result.metadata.cost) {
            setCostSummary((prev) => {
              if (!prev) {
                return {
                  totalCost: result.metadata.cost?.total ?? 0,
                  currency: result.metadata.cost?.currency ?? 'USD',
                  tokens: {
                    input: result.metadata.tokens?.input ?? 0,
                    output: result.metadata.tokens?.output ?? 0,
                  },
                };
              }
              return {
                totalCost: prev.totalCost + (result.metadata.cost?.total ?? 0),
                currency: result.metadata.cost?.currency ?? prev.currency,
                tokens: {
                  input: prev.tokens.input + (result.metadata.tokens?.input ?? 0),
                  output: prev.tokens.output + (result.metadata.tokens?.output ?? 0),
                },
              };
            });
          }

          if (options?.trackCosts) {
            sessionCostRef.current += cost;
          }

          if (budget?.perOperation !== undefined && cost > budget.perOperation) {
            handleBudgetExceeded('Operation budget exceeded', onBudgetExceeded);
            if (onBudgetExceeded === 'block') {
              options?.onError?.(new Error('Operation budget exceeded'), result as unknown as T);
              return null;
            }
          }

          if (budget?.perSession !== undefined && sessionCostRef.current > budget.perSession) {
            handleBudgetExceeded('Session budget exceeded', onBudgetExceeded);
            if (onBudgetExceeded === 'block') {
              options?.onError?.(new Error('Session budget exceeded'), result as unknown as T);
              return null;
            }
          }
        }

        setData(result);

        if (isWeaveResult(result) && result.status === 'error') {
          const operationError = new Error(result.error?.message ?? 'Operation failed');
          setError(operationError);
          options?.onError?.(operationError, result);
        } else {
          options?.onSuccess?.(result);
        }

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
    data: data ?? null,
    loading,
    error,
    status: loading ? 'loading' : error ? 'error' : data ? 'success' : 'idle',
    cost: costSummary,
    budgetExceeded: budgetExceeded ?? false,
    resetCost,
    execute,
  };
}

/**
 * Hook for generate operation
 */
export function useGenerateAI(options?: UseAIOptions<GenerateResult>) {
  const { weave } = useWeaveContext();
  const aiHook = useAI<GenerateResult>(options);

  const generate = useCallback(
    async (prompt: string, generateOptions?: GenerateOptions): Promise<GenerateResult | null> => {
      return aiHook.execute(async () => {
        if (!weave) {
          throw new Error('Weave instance not available');
        }
        return weave.generate(prompt, generateOptions);
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
export function useClassifyAI(options?: UseAIOptions<ClassificationResult>) {
  const { weave } = useWeaveContext();
  const aiHook = useAI<ClassificationResult>(options);

  const classify = useCallback(
    async (text: string, labels: string[], classifyOptions?: ClassifyOptions) => {
      return aiHook.execute(async () => {
        if (!weave) {
          throw new Error('Weave instance not available');
        }
        return weave.classify(text, labels, classifyOptions);
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
export function useExtractAI<T = unknown>(options?: UseAIOptions<ExtractResult<T>>) {
  const { weave } = useWeaveContext();
  const aiHook = useAI<ExtractResult<T>>(options);

  const extract = useCallback(
    async (text: string, schema: unknown, extractOptions?: ExtractOptions) => {
      return aiHook.execute(async () => {
        if (!weave) {
          throw new Error('Weave instance not available');
        }
        return weave.extract<T>(text, schema, extractOptions);
      });
    },
    [weave, aiHook]
  );

  return {
    ...aiHook,
    extract,
  };
}
