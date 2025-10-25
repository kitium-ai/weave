/**
 * Tests for streaming and timeout infrastructure
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StreamHandler } from '../src/streaming/stream-handler.js';
import {
  CancellationTokenSource,
  withTimeout,
  executeWithTimeout,
  createDeferred,
} from '../src/utils/request-timeout.js';

describe('StreamHandler', () => {
  let handler: StreamHandler<string>;

  beforeEach(() => {
    handler = new StreamHandler<string>('test-stream');
  });

  afterEach(() => {
    handler.cancel();
  });

  describe('initialization', () => {
    it('should initialize with unique ID', () => {
      const state = handler.getState();
      expect(state.id).toBe('test-stream');
    });

    it('should start in unpaused state', () => {
      const state = handler.getState();
      expect(state.paused).toBe(false);
    });

    it('should not be cancelled on init', () => {
      const state = handler.getState();
      expect(state.cancelled).toBe(false);
    });
  });

  describe('emitChunk', () => {
    it('should emit chunk successfully', async () => {
      const chunks: string[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      await handler.emitChunk('hello');
      await handler.emitChunk('world');

      expect(chunks).toEqual(['hello', 'world']);
    });

    it('should respect pause state', async () => {
      const chunks: string[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      handler.pause();
      const emitPromise = handler.emitChunk('paused-chunk');

      // Wait a bit to ensure it's actually waiting
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(chunks).toEqual([]);

      // Resume and wait for chunk
      handler.resume();
      await emitPromise;

      expect(chunks).toEqual(['paused-chunk']);
    });

    it('should not emit when cancelled', async () => {
      const chunks: string[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      handler.cancel();
      await handler.emitChunk('should-not-emit');

      expect(chunks).toEqual([]);
    });

    it('should assign sequential indices to chunks', async () => {
      const indices: number[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          indices.push(chunk.index);
        },
      });

      await handler.emitChunk('first');
      await handler.emitChunk('second');
      await handler.emitChunk('third');

      expect(indices).toEqual([0, 1, 2]);
    });

    it('should have timestamp in chunks', async () => {
      let hasTimestamp = false;
      handler.subscribe({
        onChunk: (chunk) => {
          hasTimestamp = chunk.timestamp instanceof Date;
        },
      });

      await handler.emitChunk('data');

      expect(hasTimestamp).toBe(true);
    });

    it('should have id in chunks', async () => {
      let chunkId: string | undefined;
      handler.subscribe({
        onChunk: (chunk) => {
          chunkId = chunk.id;
        },
      });

      await handler.emitChunk('data');

      expect(chunkId).toBe('test-stream');
    });
  });

  describe('emitComplete', () => {
    it('should call complete callbacks', async () => {
      const completeCalls: number[] = [];

      handler.subscribe({
        onComplete: () => {
          completeCalls.push(1);
        },
      });

      await handler.emitChunk('data');
      await handler.emitComplete();

      expect(completeCalls).toEqual([1]);
    });

    it('should not emit more chunks after complete', async () => {
      const chunks: string[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      await handler.emitChunk('first');
      await handler.emitComplete();
      await handler.emitChunk('second');

      expect(chunks).toEqual(['first']);
    });
  });

  describe('emitError', () => {
    it('should notify subscribers of error', async () => {
      const errors: Error[] = [];
      handler.subscribe({
        onError: (streamError) => {
          errors.push(streamError.error);
        },
      });

      const testError = new Error('test error');
      await handler.emitError(testError);

      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('test error');
    });

    it('should stop emitting after error', async () => {
      const chunks: string[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      await handler.emitChunk('before-error');
      await handler.emitError(new Error('error'), false);
      await handler.emitChunk('after-error');

      expect(chunks).toEqual(['before-error']);
    });

    it('should support recoverable errors', async () => {
      const errors: Error[] = [];
      handler.subscribe({
        onError: (streamError) => {
          errors.push(streamError.error);
        },
      });

      await handler.emitError(new Error('recoverable'), true);
      await handler.emitChunk('after-recovery');

      // Should still be able to emit after recoverable error
      expect(errors).toHaveLength(1);
    });
  });

  describe('pause and resume', () => {
    it('should pause and resume stream', async () => {
      const chunks: string[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      await handler.emitChunk('chunk1');
      expect(chunks).toEqual(['chunk1']);

      handler.pause();
      const state1 = handler.getState();
      expect(state1.paused).toBe(true);

      handler.resume();
      const state2 = handler.getState();
      expect(state2.paused).toBe(false);

      await handler.emitChunk('chunk2');
      expect(chunks).toEqual(['chunk1', 'chunk2']);
    });

    it('should allow multiple pause/resume cycles', async () => {
      const chunks: string[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      for (let i = 0; i < 3; i++) {
        handler.pause();
        handler.resume();
        await handler.emitChunk(`chunk${i}`);
      }

      expect(chunks).toEqual(['chunk0', 'chunk1', 'chunk2']);
    });
  });

  describe('cancel', () => {
    it('should set cancelled flag', () => {
      const state1 = handler.getState();
      expect(state1.cancelled).toBe(false);

      handler.cancel();

      const state2 = handler.getState();
      expect(state2.cancelled).toBe(true);
    });

    it('should prevent further emissions after cancel', async () => {
      const chunks: string[] = [];
      handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      await handler.emitChunk('before');
      handler.cancel();
      await handler.emitChunk('after');

      expect(chunks).toEqual(['before']);
    });
  });

  describe('subscribe and unsubscribe', () => {
    it('should support multiple subscribers', async () => {
      const chunks1: string[] = [];
      const chunks2: string[] = [];

      handler.subscribe({
        onChunk: (chunk) => {
          chunks1.push(chunk.data);
        },
      });

      handler.subscribe({
        onChunk: (chunk) => {
          chunks2.push(chunk.data);
        },
      });

      await handler.emitChunk('broadcast');

      expect(chunks1).toEqual(['broadcast']);
      expect(chunks2).toEqual(['broadcast']);
    });

    it('should unsubscribe correctly', async () => {
      const chunks: string[] = [];
      const unsubscribe = handler.subscribe({
        onChunk: (chunk) => {
          chunks.push(chunk.data);
        },
      });

      await handler.emitChunk('first');
      unsubscribe();
      await handler.emitChunk('second');

      expect(chunks).toEqual(['first']);
    });

    it('should handle multiple observer callbacks', async () => {
      let chunkCount = 0;
      let completeCount = 0;
      let errorCount = 0;

      handler.subscribe({
        onChunk: () => {
          chunkCount++;
        },
        onComplete: () => {
          completeCount++;
        },
        onError: () => {
          errorCount++;
        },
      });

      await handler.emitChunk('data');
      const initialChunkCount = chunkCount;

      await handler.emitComplete();
      expect(completeCount).toBe(1);

      handler.cancel();
      const state = handler.getState();
      expect(state.observerCount).toBe(1);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = handler.getState();

      expect(state).toBeDefined();
      expect(state.id).toBe('test-stream');
      expect(typeof state.paused).toBe('boolean');
      expect(typeof state.cancelled).toBe('boolean');
      expect(typeof state.chunkIndex).toBe('number');
      expect(typeof state.observerCount).toBe('number');
    });

    it('should reflect state changes', async () => {
      let state = handler.getState();
      expect(state.chunkIndex).toBe(0);

      await handler.emitChunk('data');
      state = handler.getState();
      expect(state.chunkIndex).toBe(1);

      handler.pause();
      state = handler.getState();
      expect(state.paused).toBe(true);

      handler.resume();
      state = handler.getState();
      expect(state.paused).toBe(false);
    });
  });
});

describe('CancellationTokenSource', () => {
  let source: CancellationTokenSource;

  beforeEach(() => {
    source = new CancellationTokenSource();
  });

  describe('initialization', () => {
    it('should not be cancelled initially', () => {
      expect(source.cancelled).toBe(false);
    });

    it('should provide abort signal', () => {
      expect(source.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('cancel', () => {
    it('should set cancelled flag', () => {
      source.cancel();
      expect(source.cancelled).toBe(true);
    });

    it('should abort the signal', () => {
      expect(source.signal.aborted).toBe(false);
      source.cancel();
      expect(source.signal.aborted).toBe(true);
    });

    it('should be idempotent', () => {
      source.cancel();
      expect(source.cancelled).toBe(true);
      source.cancel();
      expect(source.cancelled).toBe(true);
    });

    it('should trigger abort listeners', (done) => {
      source.signal.addEventListener('abort', () => {
        done();
      });
      source.cancel();
    });
  });
});

describe('withTimeout', () => {
  it('should resolve successfully within timeout', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('success'), 50);
    });

    const result = await withTimeout(promise, 200);
    expect(result).toBe('success');
  });

  it('should reject on timeout', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('delayed'), 500);
    });

    await expect(withTimeout(promise, 50)).rejects.toThrow();
  });

  it('should include error message', async () => {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => resolve('delayed'), 500);
    });

    try {
      await withTimeout(promise, 50, 'custom timeout message');
      expect.fail('Should have thrown');
    } catch (error) {
      expect((error as Error).message).toContain('custom timeout message');
    }
  });

  it('should handle rejected promises', async () => {
    const promise = Promise.reject(new Error('test error'));

    await expect(withTimeout(promise, 200)).rejects.toThrow('test error');
  });
});

describe('executeWithTimeout', () => {
  it('should execute function within timeout', async () => {
    const fn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'done';
    };

    const result = await executeWithTimeout(fn, 200);
    expect(result).toBe('done');
  });

  it('should reject if function exceeds timeout', async () => {
    const fn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return 'done';
    };

    await expect(executeWithTimeout(fn, 50)).rejects.toThrow();
  });

  it('should propagate function errors', async () => {
    const fn = async () => {
      throw new Error('function error');
    };

    await expect(executeWithTimeout(fn, 1000)).rejects.toThrow('function error');
  });
});

describe('createDeferred', () => {
  it('should create deferred promise', () => {
    const deferred = createDeferred<string>();

    expect(deferred.promise).toBeInstanceOf(Promise);
    expect(typeof deferred.resolve).toBe('function');
    expect(typeof deferred.reject).toBe('function');
  });

  it('should resolve successfully', async () => {
    const deferred = createDeferred<string>();

    deferred.resolve('success');
    const result = await deferred.promise;

    expect(result).toBe('success');
  });

  it('should reject with error', async () => {
    const deferred = createDeferred<string>();

    deferred.reject(new Error('test error'));

    await expect(deferred.promise).rejects.toThrow('test error');
  });

  it('should handle multiple resolutions (first wins)', async () => {
    const deferred = createDeferred<number>();

    deferred.resolve(1);
    deferred.resolve(2);

    const result = await deferred.promise;
    expect(result).toBe(1);
  });

  it('should work with different types', async () => {
    const stringDeferred = createDeferred<string>();
    const numberDeferred = createDeferred<number>();
    const objectDeferred = createDeferred<{ key: string }>();

    stringDeferred.resolve('test');
    numberDeferred.resolve(42);
    objectDeferred.resolve({ key: 'value' });

    expect(await stringDeferred.promise).toBe('test');
    expect(await numberDeferred.promise).toBe(42);
    expect(await objectDeferred.promise).toEqual({ key: 'value' });
  });
});

describe('Backpressure handling', () => {
  it('should handle pause/resume with streaming', async () => {
    const handler = new StreamHandler<number>('backpressure-test');
    const values: number[] = [];

    handler.subscribe({
      onChunk: (chunk) => {
        values.push(chunk.data);
      },
    });

    // Emit initial chunk
    await handler.emitChunk(1);
    expect(values).toEqual([1]);

    // Pause and try to emit (should wait)
    handler.pause();
    const emitPromise = handler.emitChunk(2);

    // Give it time to verify it's waiting
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(values).toEqual([1]); // Still only first chunk

    // Resume
    handler.resume();
    await emitPromise;

    expect(values).toEqual([1, 2]);
    handler.cancel();
  });

  it('should handle rapid pause/resume cycles', async () => {
    const handler = new StreamHandler<string>('rapid-cycle-test');
    const values: string[] = [];

    handler.subscribe({
      onChunk: (chunk) => {
        values.push(chunk.data);
      },
    });

    for (let i = 0; i < 5; i++) {
      handler.pause();
      const emitPromise = handler.emitChunk(`data${i}`);
      setTimeout(() => handler.resume(), 10);
      await emitPromise;
    }

    expect(values).toEqual(['data0', 'data1', 'data2', 'data3', 'data4']);
    handler.cancel();
  });

  it('should complete while paused', async () => {
    const handler = new StreamHandler<string>('complete-while-paused');
    const values: string[] = [];
    const completeCalls: number[] = [];

    handler.subscribe({
      onChunk: (chunk) => {
        values.push(chunk.data);
      },
      onComplete: () => {
        completeCalls.push(1);
      },
    });

    await handler.emitChunk('data');
    handler.pause();
    await handler.emitComplete();
    handler.resume();

    expect(values).toEqual(['data']);
    expect(completeCalls).toEqual([1]);
    handler.cancel();
  });
});

describe('Error handling in streaming', () => {
  it('should handle synchronous subscriber errors', async () => {
    const handler = new StreamHandler<string>('error-test');
    const chunks: string[] = [];

    // First subscriber throws
    handler.subscribe({
      onChunk: () => {
        throw new Error('subscriber error');
      },
    });

    // Second subscriber should still work
    handler.subscribe({
      onChunk: (chunk) => {
        chunks.push(chunk.data);
      },
    });

    // This should not throw even though first subscriber does
    await handler.emitChunk('data');
    expect(chunks).toEqual(['data']);

    handler.cancel();
  });

  it('should handle timeout with streaming', async () => {
    const handler = new StreamHandler<string>('timeout-test');
    const slowAsyncFn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return 'slow result';
    };

    await expect(executeWithTimeout(slowAsyncFn, 100)).rejects.toThrow();
    handler.cancel();
  });
});
