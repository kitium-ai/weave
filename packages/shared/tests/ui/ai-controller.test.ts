import { describe, it, expect, vi } from 'vitest';
import {
  AIExecutionController,
  type AIExecutionState,
  type CostSummary,
} from '../../src/ui/ai-controller.js';
import type { WeaveOperationResult, WeaveOperationMetadata } from '@weaveai/core';

function createMetadata(overrides: Partial<WeaveOperationMetadata> = {}): WeaveOperationMetadata {
  return {
    operationId: 'op-1',
    duration: 25,
    timestamp: new Date(),
    provider: 'openai',
    model: 'gpt-4o',
    ui: {
      displayAs: 'text',
      canStream: false,
      estimatedSize: 'small',
    },
    cost: {
      input: 0.01,
      output: 0.01,
      total: 0.02,
      currency: 'USD',
    },
    tokens: {
      input: 100,
      output: 120,
    },
    cached: false,
    ...overrides,
  };
}

function createResult<T>(
  data: T,
  metadata?: Partial<WeaveOperationMetadata>
): WeaveOperationResult<T> {
  return {
    status: 'success',
    data,
    metadata: createMetadata(metadata),
  };
}

describe('AIExecutionController', () => {
  it('updates state on successful execution', async () => {
    const controller = new AIExecutionController<{ message: string }>({ trackCosts: true });
    const states: Array<AIExecutionState<{ message: string }>> = [];

    controller.subscribe((state) => {
      states.push(state);
    });

    const result = await controller.execute(async () => createResult({ message: 'hello' }));

    expect(result?.data.message).toBe('hello');
    const latest = states.at(-1);
    expect(latest?.status).toBe('success');
    expect(latest?.data?.data.message).toBe('hello');
    expect((latest?.cost as CostSummary | null)?.totalCost).toBeCloseTo(0.02);
    expect(states.some((state) => state.loading)).toBe(true);
  });

  it('respects per-operation budget with block mode', async () => {
    const onError = vi.fn();
    const controller = new AIExecutionController({
      trackCosts: true,
      budget: { perOperation: 0.01, onBudgetExceeded: 'block' },
      onError,
    });

    const result = await controller.execute(async () => createResult({ value: 42 }));

    expect(result).toBeNull();
    const state = controller.getState();
    expect(state.budgetExceeded).toBe(true);
    expect(state.status).toBe('error');
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.anything());
  });

  it('propagates operation errors returned by Weave', async () => {
    const controller = new AIExecutionController({
      trackCosts: true,
    });

    const failingResult: WeaveOperationResult<{ value: number }> = {
      status: 'error',
      data: { value: 0 },
      metadata: createMetadata(),
      error: {
        code: 'TEST_ERROR',
        message: 'Operation failed',
        recoverable: true,
      },
    };

    await controller.execute(async () => failingResult);

    const state = controller.getState();
    expect(state.status).toBe('error');
    expect(state.error?.message).toBe('Operation failed');
  });
});
