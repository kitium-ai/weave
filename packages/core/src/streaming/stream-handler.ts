/**
 * Stream Handler
 * Manages streaming responses with backpressure and error handling
 */

import { getLogger } from '@weaveai/shared';

/**
 * Stream chunk event
 */
export interface StreamChunk<T = string> {
  id: string;
  timestamp: Date;
  data: T;
  index: number;
  isLast: boolean;
}

/**
 * Stream error event
 */
export interface StreamError {
  id: string;
  error: Error;
  recoverable: boolean;
}

/**
 * Stream observer for consuming chunks
 */
export interface StreamObserver<T = string> {
  onChunk?: (chunk: StreamChunk<T>) => void | Promise<void>;
  onError?: (error: StreamError) => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
}

/**
 * Minimal interface for DOM-like containers used in UI streaming
 * Allows interoperability in non-DOM environments.
 */
export interface StreamingUiContainerLike {
  textContent: string | null;
}

/**
 * Supported UI update strategies
 */
export type StreamingUpdateStrategy = 'append' | 'replace' | 'diff';

/**
 * UI context for automatically updating streaming output containers
 */
export interface StreamingUiContext<T = string> {
  framework?: 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla';
  container?: string | StreamingUiContainerLike | (() => StreamingUiContainerLike | null);
  updateStrategy?: StreamingUpdateStrategy;
  onChunk?: (chunk: StreamChunk<T>) => void | Promise<void>;
  onStart?: () => void | Promise<void>;
  onComplete?: () => void | Promise<void>;
  onError?: (error: StreamError) => void | Promise<void>;
}

/**
 * Stream handler configuration
 */
export interface StreamHandlerOptions<T = string> {
  uiContext?: StreamingUiContext<T>;
}

/**
 * Normalized streaming configuration exposed to operations
 */
export interface StreamingConfig<T = string> {
  enabled: boolean;
  uiContext?: StreamingUiContext<T>;
}

/**
 * Normalize the streaming configuration to a uniform structure
 */
export function normalizeStreamingConfig<T = string>(
  streaming?: boolean | StreamingConfig<T>
): StreamingConfig<T> {
  if (typeof streaming === 'boolean') {
    return { enabled: streaming };
  }

  if (streaming && typeof streaming === 'object') {
    return {
      enabled: streaming.enabled ?? true,
      uiContext: streaming.uiContext,
    };
  }

  return { enabled: false };
}

/**
 * Stream handler for managing streaming responses
 */
export class StreamHandler<T = string> {
  private readonly id: string;
  private readonly logger = getLogger();
  private readonly observers: Set<StreamObserver<T>> = new Set();
  private readonly uiContext?: StreamingUiContext<T>;
  private paused: boolean = false;
  private cancelled: boolean = false;
  private completed: boolean = false;
  private chunkIndex: number = 0;
  private started: boolean = false;
  private startTime?: number;
  private endTime?: number;
  private readonly uiState: {
    buffer: string;
    containerResolved: boolean;
    container: StreamingUiContainerLike | null;
  } = {
    buffer: '',
    containerResolved: false,
    container: null,
  };

  constructor(id: string, options?: StreamHandlerOptions<T>) {
    this.id = id;
    this.uiContext = options?.uiContext;
  }

  /**
   * Subscribe to stream events
   */
  public subscribe(observer: StreamObserver<T>): () => void {
    this.observers.add(observer);
    this.logger.debug(`Stream subscribed`, { id: this.id });

    // Return unsubscribe function
    return () => {
      this.observers.delete(observer);
      this.logger.debug(`Stream unsubscribed`, { id: this.id });
    };
  }

  /**
   * Emit a chunk to all observers
   */
  public async emitChunk(data: T): Promise<void> {
    if (this.cancelled || this.completed) {
      return;
    }

    // Handle backpressure by pausing
    while (this.paused && !this.cancelled) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    await this.ensureStarted();

    const chunk: StreamChunk<T> = {
      id: this.id,
      timestamp: new Date(),
      data,
      index: this.chunkIndex++,
      isLast: false,
    };

    const promises: Array<Promise<void>> = [];
    const uiPromises: Array<Promise<void>> = [];

    for (const observer of this.observers) {
      if (!observer.onChunk) {
        continue;
      }
      try {
        const result = observer.onChunk(chunk);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        // Notify observers about the error but do not throw
        const promisesErr: Array<Promise<void>> = [];
        for (const obs of this.observers) {
          if (obs.onError) {
            const res = obs.onError({ id: this.id, error: error as Error, recoverable: true });
            if (res instanceof Promise) {
              promisesErr.push(res);
            }
          }
        }
        try {
          await Promise.all(promisesErr);
        } catch (handlerError) {
          this.logger.error(`Error in error handlers`, { handlerError });
        }
      }
    }

    // Apply UI updates after notifying observers
    try {
      const uiResult = this.applyUiChunk(chunk);
      if (uiResult instanceof Promise) {
        uiPromises.push(uiResult);
      }
    } catch (uiError) {
      this.logger.warn(`Failed to apply UI update for stream chunk`, { uiError, id: this.id });
    }

    // Wait for all observers to process chunk
    try {
      await Promise.all(promises);
      if (uiPromises.length > 0) {
        await Promise.all(uiPromises);
      }
    } catch (error) {
      this.logger.error(`Error emitting chunk`, { error });
    }
  }

  /**
   * Emit completion to all observers
   */
  public async emitComplete(): Promise<void> {
    if (this.cancelled) {
      return;
    }

    this.completed = true;
    this.endTime = Date.now();
    const uiPromises: Array<Promise<void>> = [];

    if (this.uiContext?.onComplete) {
      try {
        const result = this.uiContext.onComplete();
        if (result instanceof Promise) {
          uiPromises.push(result);
        }
      } catch (uiError) {
        this.logger.warn(`UI onComplete handler failed`, { uiError, id: this.id });
      }
    }

    const promises: Array<Promise<void>> = [];

    for (const observer of this.observers) {
      if (observer.onComplete) {
        const result = observer.onComplete();
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }

    try {
      await Promise.all(promises);
      if (uiPromises.length > 0) {
        await Promise.all(uiPromises);
      }
      this.logger.debug(`Stream completed`, { id: this.id });
    } catch (error) {
      this.logger.error(`Error completing stream`, { error });
    }
  }

  /**
   * Emit error to all observers
   */
  public async emitError(error: Error, recoverable: boolean = false): Promise<void> {
    const streamError: StreamError = {
      id: this.id,
      error,
      recoverable,
    };

    const promises: Array<Promise<void>> = [];

    for (const observer of this.observers) {
      if (observer.onError) {
        const result = observer.onError(streamError);
        if (result instanceof Promise) {
          promises.push(result);
        }
      }
    }

    try {
      await Promise.all(promises);
    } catch (handlerError) {
      this.logger.error(`Error in error handler`, { handlerError });
    }

    if (this.uiContext?.onError) {
      try {
        const result = this.uiContext.onError(streamError);
        if (result instanceof Promise) {
          await result;
        }
      } catch (uiError) {
        this.logger.warn(`UI onError handler failed`, { uiError, id: this.id });
      }
    }

    if (!recoverable) {
      this.cancelled = true;
    }
  }

  /**
   * Pause stream (backpressure)
   */
  public pause(): void {
    this.paused = true;
    this.logger.debug(`Stream paused`, { id: this.id });
  }

  /**
   * Resume stream
   */
  public resume(): void {
    this.paused = false;
    this.logger.debug(`Stream resumed`, { id: this.id });
  }

  /**
   * Cancel stream
   */
  public cancel(): void {
    this.cancelled = true;
    this.logger.debug(`Stream cancelled`, { id: this.id });
  }

  /**
   * Get stream state
   */
  public getState(): {
    id: string;
    paused: boolean;
    cancelled: boolean;
    chunkIndex: number;
    observerCount: number;
    totalChunks: number;
    startedAt?: Date;
    completedAt?: Date;
    durationMs?: number;
  } {
    const startedAt = this.startTime ? new Date(this.startTime) : undefined;
    const completedAt = this.endTime ? new Date(this.endTime) : undefined;
    const durationMs =
      this.startTime !== undefined && this.endTime !== undefined
        ? this.endTime - this.startTime
        : undefined;

    return {
      id: this.id,
      paused: this.paused,
      cancelled: this.cancelled,
      chunkIndex: this.chunkIndex,
      observerCount: this.observers.size,
      totalChunks: this.chunkIndex,
      startedAt,
      completedAt,
      durationMs,
    };
  }

  /**
   * Mark the stream as started and invoke UI handlers
   */
  public async start(): Promise<void> {
    await this.ensureStarted();
  }

  private async ensureStarted(): Promise<void> {
    if (this.started) {
      return;
    }

    this.started = true;
    this.startTime = Date.now();

    if (this.uiContext?.onStart) {
      try {
        const result = this.uiContext.onStart();
        if (result instanceof Promise) {
          await result;
        }
      } catch (uiError) {
        this.logger.warn(`UI onStart handler failed`, { uiError, id: this.id });
      }
    }
  }

  private applyUiChunk(chunk: StreamChunk<T>): void | Promise<void> {
    if (!this.uiContext) {
      return;
    }

    const text = this.extractChunkText(chunk.data);
    if (text.length) {
      this.uiState.buffer += text;
      this.updateUiContainer(text);
    }

    const { onChunk } = this.uiContext;
    if (!onChunk) {
      return;
    }

    try {
      const result = onChunk(chunk);
      if (result instanceof Promise) {
        return result;
      }
    } catch (error) {
      this.logger.warn(`UI onChunk handler failed`, { error, id: this.id });
    }

    return;
  }

  private extractChunkText(data: T): string {
    if (typeof data === 'string') {
      return data;
    }

    if (data === null || data === undefined) {
      return '';
    }

    try {
      return String(data);
    } catch {
      return '';
    }
  }

  private updateUiContainer(text: string): void {
    if (!this.uiContext?.container) {
      return;
    }

    const container = this.resolveContainer();
    if (!container) {
      return;
    }

    const strategy = this.uiContext.updateStrategy ?? 'append';
    switch (strategy) {
      case 'append': {
        const current = container.textContent ?? '';
        container.textContent = `${current}${text}`;
        break;
      }
      case 'replace': {
        container.textContent = this.uiState.buffer;
        break;
      }
      case 'diff': {
        this.applyDiffUpdate(container);
        break;
      }
      default: {
        const current = container.textContent ?? '';
        container.textContent = `${current}${text}`;
      }
    }
  }

  private resolveContainer(): StreamingUiContainerLike | null {
    if (this.uiState.containerResolved) {
      return this.uiState.container;
    }

    this.uiState.containerResolved = true;

    const target = this.uiContext?.container;
    if (!target) {
      return null;
    }

    let element: unknown;

    if (typeof target === 'string') {
      const doc = this.getDocument();
      if (!doc) {
        this.logger.debug(`UI container resolution skipped (document undefined)`, { id: this.id });
        this.uiState.container = null;
        return null;
      }

      if (typeof doc.querySelector !== 'function') {
        this.logger.warn(`Document does not support querySelector`, { id: this.id });
        this.uiState.container = null;
        return null;
      }
      element = doc.querySelector(target);
    } else if (typeof target === 'function') {
      element = target();
    } else {
      element = target;
    }

    if (this.isDomLikeElement(element)) {
      this.uiState.container = element;
    } else {
      this.uiState.container = null;
      this.logger.warn(`UI container not found or unsupported`, { id: this.id, target });
    }

    return this.uiState.container;
  }

  private applyDiffUpdate(container: StreamingUiContainerLike): void {
    const current = container.textContent ?? '';
    const next = this.uiState.buffer;

    if (next.startsWith(current)) {
      container.textContent = `${current}${next.slice(current.length)}`;
      return;
    }

    container.textContent = next;
  }

  private getDocument():
    | {
        querySelector?: (selector: string) => unknown;
      }
    | undefined {
    if (typeof globalThis === 'undefined') {
      return undefined;
    }

    const possibleDocument = (globalThis as Record<string, unknown>).document;
    if (!possibleDocument || typeof possibleDocument !== 'object') {
      return undefined;
    }

    return possibleDocument as {
      querySelector?: (selector: string) => unknown;
    };
  }

  private isDomLikeElement(value: unknown): value is StreamingUiContainerLike {
    if (value === null || typeof value !== 'object') {
      return false;
    }

    if (!('textContent' in value)) {
      return false;
    }

    const textContent = (value as { textContent: unknown }).textContent;
    return typeof textContent === 'string' || textContent === null;
  }
}

/**
 * Streaming request options
 */
export interface StreamingRequestOptions {
  timeout?: number;
  abortSignal?: AbortSignal;
  backpressureThreshold?: number;
  maxChunkSize?: number;
}

/**
 * Stream result wrapper
 */
export interface StreamResult<T = string> {
  id: string;
  handler: StreamHandler<T>;
  totalChunks: number;
  duration: number;
}
