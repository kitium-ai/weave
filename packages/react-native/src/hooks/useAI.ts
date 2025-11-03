/**
 * React Native hooks for Weave AI framework
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  Weave,
  GenerateOptions,
  GenerateResult,
  ClassifyOptions,
  ClassificationResult,
  ExtractOptions,
  ExtractResult,
} from '@weaveai/core';
import {
  AIExecutionController,
  type AIExecutionOptions,
  type AIExecutionState,
  type CostSummary,
} from '@weaveai/shared';

export interface UseAIOptions<T = unknown> extends AIExecutionOptions<T> {}

export interface UseAIReturn<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: AIExecutionState<T>['status'];
  cost: CostSummary | null;
  budgetExceeded: boolean;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  resetCost: () => void;
}

const INITIAL_STATE: AIExecutionState<any> = {
  data: null,
  loading: false,
  error: null,
  status: 'idle',
  cost: null,
  budgetExceeded: false,
};

/**
 * React Native hook for AI operations
 */
export function useAI<T = unknown>(_weave: Weave, options?: UseAIOptions<T>): UseAIReturn<T> {
  const controllerRef = useRef(new AIExecutionController<T>(options));
  const [state, setState] = useState<AIExecutionState<T>>(INITIAL_STATE);

  useEffect(() => {
    const unsubscribe = controllerRef.current.subscribe((next) => {
      setState(next);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (options) {
      controllerRef.current.setOptions(options);
    }
  }, [options]);

  const execute = useCallback(async (fn: () => Promise<T>) => {
    return controllerRef.current.execute(fn);
  }, []);

  const resetCost = useCallback(() => {
    controllerRef.current.resetCost();
  }, []);

  return {
    data: state.data ?? null,
    loading: state.loading,
    error: state.error,
    status: state.status,
    cost: state.cost,
    budgetExceeded: state.budgetExceeded ?? false,
    execute,
    resetCost,
  };
}

/**
 * React Native hook for text generation
 */
export function useGenerateAI(
  weave: Weave,
  options?: UseAIOptions<GenerateResult>
) {
  const ai = useAI<GenerateResult>(weave, { ...(options ?? {}), operation: 'generate' });

  const generate = useCallback(
    async (prompt: string, generateOptions?: GenerateOptions): Promise<GenerateResult | null> => {
      return ai.execute(() => weave.generate(prompt, generateOptions));
    },
    [ai, weave]
  );

  return {
    ...ai,
    generate,
  };
}

/**
 * React Native hook for text classification
 */
export function useClassifyAI(
  weave: Weave,
  options?: UseAIOptions<ClassificationResult>
) {
  const ai = useAI<ClassificationResult>(weave, { ...(options ?? {}), operation: 'classify' });

  const classify = useCallback(
    async (
      text: string,
      labels: string[],
      classifyOptions?: ClassifyOptions
    ): Promise<ClassificationResult | null> => {
      return ai.execute(() => weave.classify(text, labels, classifyOptions));
    },
    [ai, weave]
  );

  return {
    ...ai,
    classify,
  };
}

/**
 * React Native hook for data extraction
 */
export function useExtractAI<T = unknown>(
  weave: Weave,
  options?: UseAIOptions<ExtractResult<T>>
) {
  const ai = useAI<ExtractResult<T>>(weave, { ...(options ?? {}), operation: 'extract' });

  const extract = useCallback(
    async (
      text: string,
      schema: unknown,
      extractOptions?: ExtractOptions
    ): Promise<ExtractResult<T> | null> => {
      return ai.execute(() => weave.extract<T>(text, schema, extractOptions));
    },
    [ai, weave]
  );

  return {
    ...ai,
    extract,
  };
}
