/**
 * Streaming Example
 * Demonstrates streaming responses with backpressure handling
 */

import { logError, logInfo } from '@weaveai/shared';
import { StreamHandler } from '../src/streaming/stream-handler.js';

async function streamingExample() {
  logInfo('=== Streaming with Backpressure ===\n');

  const handler = new StreamHandler<string>('example-stream');

  // Subscribe to stream events
  const unsubscribe = handler.subscribe({
    onChunk: async (chunk) => {
      logInfo(`[Chunk ${chunk.index}] ${chunk.data}`);
      // Simulate slow processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
    onComplete: () => {
      logInfo('[Stream] Completed');
    },
    onError: (error) => {
      logError('[Stream Error]', error.error.message);
    },
  });

  // Emit chunks
  logInfo('Emitting chunks...');
  await handler.emitChunk('First chunk of data');
  await handler.emitChunk('Second chunk of data');
  await handler.emitChunk('Third chunk of data');

  // Demonstrate pause/resume for backpressure
  logInfo('\nDemonstrating backpressure...');
  handler.pause();
  logInfo('Stream paused');

  setTimeout(() => {
    handler.resume();
    logInfo('Stream resumed');
  }, 1000);

  // Emit while paused (will wait)
  await handler.emitChunk('Chunk emitted while paused');

  // Complete the stream
  await handler.emitComplete();

  // Cleanup
  unsubscribe();
  handler.cancel();

  logInfo('\n✓ Streaming example completed\n');
}

export { streamingExample };
