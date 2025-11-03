/**
 * Vue 3 composables for AI operations
 */

import { ref, computed, inject, onBeforeUnmount, type Ref, type ComputedRef } from 'vue';
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
  type CostSummary,
  type AIStatus,
} from '@weaveai/shared';

export interface UseAIOptions<T = unknown> extends AIExecutionOptions<T> {}

export interface UseAIReturn<T = unknown> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: ComputedRef<AIStatus>;
  cost: Ref<CostSummary | null>;
  budgetExceeded: Ref<boolean>;
  execute: (fn: () => Promise<T>) => Promise<T | null>;
  resetCost: () => void;
}

/**
 * Composable for AI operations with budgeting and cost tracking.
 */
export function useAI<T = unknown>(options?: UseAIOptions<T>): UseAIReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const loading = ref(false) as Ref<boolean>;
  const error = ref<Error | null>(null) as Ref<Error | null>;
  const statusRef = ref<AIStatus>('idle') as Ref<AIStatus>;
  const cost = ref<CostSummary | null>(null) as Ref<CostSummary | null>;
  const budgetExceeded = ref(false) as Ref<boolean>;

  const controller = new AIExecutionController<T>(options);
  const unsubscribe = controller.subscribe((state) => {
    data.value = state.data ?? null;
    loading.value = state.loading;
    error.value = state.error;
    statusRef.value = state.status;
    cost.value = state.cost;
    budgetExceeded.value = state.budgetExceeded ?? false;
  });

  onBeforeUnmount(() => {
    unsubscribe();
  });

  const execute = async (fn: () => Promise<T>): Promise<T | null> => {
    return controller.execute(fn);
  };

  const status = computed(() => statusRef.value);

  const resetCost = () => {
    controller.resetCost();
  };

  return {
    data,
    loading,
    error,
    status,
    cost,
    budgetExceeded,
    execute,
    resetCost,
  };
}

/**
 * Vue composable for text generation with cost tracking.
 */
export function useGenerateAI(options?: UseAIOptions<GenerateResult>) {
  const weave = inject<Weave>('weave');
  const ai = useAI<GenerateResult>({ ...(options ?? {}), operation: 'generate' });

  const generate = async (
    prompt: string,
    generateOptions?: GenerateOptions
  ): Promise<GenerateResult | null> => {
    return ai.execute(async () => {
      if (!weave) {
        throw new Error('Weave not provided');
      }
      return weave.generate(prompt, generateOptions);
    });
  };

  return {
    ...ai,
    generate,
  };
}

/**
 * Vue composable for text classification.
 */
export function useClassifyAI(options?: UseAIOptions<ClassificationResult>) {
  const weave = inject<Weave>('weave');
  const ai = useAI<ClassificationResult>({ ...(options ?? {}), operation: 'classify' });

  const classify = async (
    text: string,
    labels: string[],
    classifyOptions?: ClassifyOptions
  ): Promise<ClassificationResult | null> => {
    return ai.execute(async () => {
      if (!weave) {
        throw new Error('Weave not provided');
      }
      return weave.classify(text, labels, classifyOptions);
    });
  };

  return {
    ...ai,
    classify,
  };
}

/**
 * Vue composable for data extraction.
 */
export function useExtractAI<T = unknown>(options?: UseAIOptions<ExtractResult<T>>) {
  const weave = inject<Weave>('weave');
  const ai = useAI<ExtractResult<T>>({ ...(options ?? {}), operation: 'extract' });

  const extract = async (
    text: string,
    schema: unknown,
    extractOptions?: ExtractOptions
  ): Promise<ExtractResult<T> | null> => {
    return ai.execute(async () => {
      if (!weave) {
        throw new Error('Weave not provided');
      }
      return weave.extract<T>(text, schema, extractOptions);
    });
  };

  return {
    ...ai,
    extract,
  };
}
