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
 * Stream handler for managing streaming responses
 */
export class StreamHandler<T = string> {
  private readonly id: string;
  private readonly logger = getLogger();
  private readonly observers: Set<StreamObserver<T>> = new Set();
  private paused: boolean = false;
  private cancelled: boolean = false;
  private completed: boolean = false;
  private chunkIndex: number = 0;

  constructor(id: string) {
    this.id = id;
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

    const chunk: StreamChunk<T> = {
      id: this.id,
      timestamp: new Date(),
      data,
      index: this.chunkIndex++,
      isLast: false,
    };

    const promises: Array<Promise<void>> = [];

    for (const observer of this.observers) {
      if (!observer.onChunk) continue;
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
            if (res instanceof Promise) promisesErr.push(res);
          }
        }
        try {
          await Promise.all(promisesErr);
        } catch (handlerError) {
          this.logger.error(`Error in error handlers`, { handlerError });
        }
      }
    }

    // Wait for all observers to process chunk
    try {
      await Promise.all(promises);
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
  } {
    return {
      id: this.id,
      paused: this.paused,
      cancelled: this.cancelled,
      chunkIndex: this.chunkIndex,
      observerCount: this.observers.size,
    };
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
