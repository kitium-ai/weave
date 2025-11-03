/**
 * Angular service for AI operations
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
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

/**
 * Base AI service with state management
 */
@Injectable({
  providedIn: 'root',
})
export class AIService<T = unknown> {
  private readonly controller: AIExecutionController<T>;
  private baseOptions?: AIExecutionOptions<T>;

  private readonly initialState: AIState<T> = {
    data: null,
    loading: false,
    error: null,
    status: 'idle',
    cost: null,
    budgetExceeded: false,
  };

  private readonly stateSubject = new BehaviorSubject<AIState<T>>(this.initialState);
  readonly state$: Observable<AIState<T>> = this.stateSubject.asObservable();

  constructor(protected weave: Weave) {
    this.controller = new AIExecutionController<T>();
    this.controller.subscribe((state) => {
      this.stateSubject.next({
        data: state.data ?? null,
        loading: state.loading,
        error: state.error,
        status: state.status,
        cost: state.cost,
        budgetExceeded: state.budgetExceeded ?? false,
      });
    });
  }

  /**
   * Configure execution options.
   */
  configure(options: AIExecutionOptions<T>): void {
    this.baseOptions = { ...(this.baseOptions ?? {}), ...options };
    this.controller.setOptions(this.baseOptions);
  }

  /**
   * Get current state
   */
  getState(): AIState<T> {
    return this.stateSubject.value;
  }

  /**
   * Execute an async function with state management
   */
  async execute(fn: () => Promise<T>): Promise<T | null> {
    return this.controller.execute(fn);
  }

  /**
   * Reset state to initial
   */
  reset(): void {
    this.controller.resetCost();
    this.stateSubject.next(this.initialState);
  }

  /**
   * Update controller options temporarily for single invocation.
   */
  protected applyOptions(
    operation: AIExecutionOptions<T>['operation'],
    options?: AIExecutionOptions<T>
  ): void {
    const merged: AIExecutionOptions<T> = {
      ...(this.baseOptions ?? {}),
      ...(options ?? {}),
      operation,
    };
    this.controller.setOptions(merged);
  }
}

/**
 * Angular service for text generation
 */
@Injectable({
  providedIn: 'root',
})
export class GenerateService extends AIService<GenerateResult> {
  /**
   * Generate text from prompt
   */
  async generate(
    prompt: string,
    options?: GenerateOptions,
    controllerOptions?: AIExecutionOptions<GenerateResult>
  ): Promise<GenerateResult | null> {
    this.applyOptions('generate', controllerOptions);
    return this.execute(async () => {
      return this.weave.generate(prompt, options);
    });
  }
}

/**
 * Angular service for text classification
 */
@Injectable({
  providedIn: 'root',
})
export class ClassifyService extends AIService<ClassificationResult> {
  /**
   * Classify text into categories
   */
  async classify(
    text: string,
    labels: string[],
    options?: ClassifyOptions,
    controllerOptions?: AIExecutionOptions<ClassificationResult>
  ): Promise<ClassificationResult | null> {
    this.applyOptions('classify', controllerOptions);
    return this.execute(async () => {
      return this.weave.classify(text, labels, options);
    });
  }
}

/**
 * Angular service for data extraction
 */
@Injectable({
  providedIn: 'root',
})
export class ExtractService<T = unknown> extends AIService<ExtractResult<T>> {
  /**
   * Extract structured data from text
   */
  async extract(
    text: string,
    schema: unknown,
    options?: ExtractOptions,
    controllerOptions?: AIExecutionOptions<ExtractResult<T>>
  ): Promise<ExtractResult<T> | null> {
    this.applyOptions('extract', controllerOptions);
    return this.execute(async () => {
      return this.weave.extract<T>(text, schema, options);
    });
  }
}
