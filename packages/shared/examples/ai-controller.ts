import { AIExecutionController } from '@weaveai/shared';
// @ts-expect-error - GenerateResult is not defined
import type { GenerateResult } from '@weaveai/core';
import { weave } from './weave-client';
import { logInfo } from '@weaveai/shared';

const controller = new AIExecutionController<GenerateResult>({
  trackCosts: true,
  // @ts-expect-error - budget is not defined
  budget: { perSession: 0.25, onBudgetExceeded: 'warn' },
});

controller.subscribe((state) => {
  logInfo('status', { status: state.status, cost: state.cost?.totalCost });
});

export async function runExample(): Promise<void> {
  const result = await controller.execute(() =>
    weave.generate('Write a short welcome message for Weave users.')
  );

  if (result?.status === 'success') {
    logInfo(result.data.text);
  }
}
