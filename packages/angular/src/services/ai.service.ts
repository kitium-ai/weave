/**
 * Angular service for AI operations
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Weave, GenerateOptions } from '@weave/core';

export interface AIState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

/**
 * Base AI service with state management
 */
@Injectable({
  providedIn: 'root',
})
export class AIService<T = unknown> {
  private readonly initialState: AIState<T> = {
    data: null,
    loading: false,
    error: null,
    status: 'idle',
  };

  private readonly stateSubject = new BehaviorSubject<AIState<T>>(this.initialState);
  readonly state$: Observable<AIState<T>> = this.stateSubject.asObservable();

  constructor(protected weave: Weave) {}

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
    try {
      this.updateState({ loading: true, status: 'loading' });

      const result = await fn();

      this.updateState({
        data: result,
        loading: false,
        status: 'success',
        error: null,
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      this.updateState({
        loading: false,
        status: 'error',
        error,
      });

      return null;
    }
  }

  /**
   * Reset state to initial
   */
  reset(): void {
    this.stateSubject.next(this.initialState);
  }

  /**
   * Update state
   */
  protected updateState(partial: Partial<AIState<T>>): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({ ...current, ...partial });
  }
}

/**
 * Angular service for text generation
 */
@Injectable({
  providedIn: 'root',
})
export class GenerateService extends AIService<string> {
  /**
   * Generate text from prompt
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<string | null> {
    return this.execute(async () => {
      const result = await this.weave.generate(prompt, options);
      return result.text;
    });
  }
}

/**
 * Angular service for text classification
 */
@Injectable({
  providedIn: 'root',
})
export class ClassifyService extends AIService {
  /**
   * Classify text into categories
   */
  async classify(text: string, labels: string[]): Promise<unknown | null> {
    return this.execute(async () => {
      return await this.weave.classify(text, labels);
    });
  }
}

/**
 * Angular service for data extraction
 */
@Injectable({
  providedIn: 'root',
})
export class ExtractService extends AIService {
  /**
   * Extract structured data from text
   */
  async extract(text: string, schema: unknown): Promise<unknown | null> {
    return this.execute(async () => {
      return await this.weave.extract(text, schema);
    });
  }
}
