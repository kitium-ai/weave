/**
 * Svelte stores for AI operations
 */

import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
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
  type AIStatus,
  type CostSummary,
} from '@weaveai/shared';

export interface AIState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: AIStatus;
  cost: CostSummary | null;
  budgetExceeded: boolean;
}

export interface UseAIStoreReturn<T = unknown> {
  state: Readable<AIState<T>>;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  configure: (options: AIExecutionOptions<T>) => void;
}

/**
 * Create an AI operation store with budgeting and cost tracking.
 */
export function createAIStore<T = unknown>(options?: AIExecutionOptions<T>): UseAIStoreReturn<T> {
  const initialState: AIState<T> = {
    data: null,
    loading: false,
    error: null,
    status: 'idle',
    cost: null,
    budgetExceeded: false,
  };

  const controller = new AIExecutionController<T>(options);
  const { subscribe, set } = writable<AIState<T>>(initialState);

  controller.subscribe((state) => {
    set({
      data: state.data,
      loading: state.loading,
      error: state.error,
      status: state.status,
      cost: state.cost,
      budgetExceeded: state.budgetExceeded,
    });
  });

  const execute = async (fn: () => Promise<T>): Promise<T | null> => {
    return controller.execute(fn);
  };

  const reset = () => {
    controller.resetCost();
    set(initialState);
  };

  const configure = (next: AIExecutionOptions<T>) => {
    controller.setOptions(next);
  };

  return {
    state: { subscribe },
    execute,
    reset,
    configure,
  };
}

/**
 * Create a generate store
 */
export function createGenerateStore(
  weave: Weave,
  options?: AIExecutionOptions<GenerateResult>
) {
  const ai = createAIStore<GenerateResult>({ ...(options ?? {}), operation: 'generate' });

  const generate = async (
    prompt: string,
    generateOptions?: GenerateOptions
  ): Promise<GenerateResult | null> => {
    return ai.execute(async () => weave.generate(prompt, generateOptions));
  };

  return {
    state: ai.state,
    generate,
    reset: ai.reset,
    configure: ai.configure,
  };
}

/**
 * Create a classify store
 */
export function createClassifyStore(
  weave: Weave,
  options?: AIExecutionOptions<ClassificationResult>
) {
  const ai = createAIStore<ClassificationResult>({ ...(options ?? {}), operation: 'classify' });

  const classify = async (
    text: string,
    labels: string[],
    classifyOptions?: ClassifyOptions
  ): Promise<ClassificationResult | null> => {
    return ai.execute(async () => weave.classify(text, labels, classifyOptions));
  };

  return {
    state: ai.state,
    classify,
    reset: ai.reset,
    configure: ai.configure,
  };
}

/**
 * Create an extract store
 */
export function createExtractStore<T = unknown>(
  weave: Weave,
  options?: AIExecutionOptions<ExtractResult<T>>
) {
  const ai = createAIStore<ExtractResult<T>>({ ...(options ?? {}), operation: 'extract' });

  const extract = async (
    text: string,
    schema: unknown,
    extractOptions?: ExtractOptions
  ): Promise<ExtractResult<T> | null> => {
    return ai.execute(async () => weave.extract<T>(text, schema, extractOptions));
  };

  return {
    state: ai.state,
    extract,
    reset: ai.reset,
    configure: ai.configure,
  };
}
