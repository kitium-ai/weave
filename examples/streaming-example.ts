/**
 * Streaming Example
 * Demonstrates streaming responses with backpressure handling
 */

import { StreamHandler } from '../packages/core/src/streaming/stream-handler.js';

async function streamingExample() {
  console.log('=== Streaming with Backpressure ===\n');

  const handler = new StreamHandler<string>('example-stream');

  // Subscribe to stream events
  const unsubscribe = handler.subscribe({
    onChunk: async (chunk) => {
      console.log(`[Chunk ${chunk.index}] ${chunk.data}`);
      // Simulate slow processing
      await new Promise((resolve) => setTimeout(resolve, 100));
    },
    onComplete: () => {
      console.log('[Stream] Completed');
    },
    onError: (error) => {
      console.error('[Stream Error]', error.error.message);
    },
  });

  // Emit chunks
  console.log('Emitting chunks...');
  await handler.emitChunk('First chunk of data');
  await handler.emitChunk('Second chunk of data');
  await handler.emitChunk('Third chunk of data');

  // Demonstrate pause/resume for backpressure
  console.log('\nDemonstrating backpressure...');
  handler.pause();
  console.log('Stream paused');

  setTimeout(() => {
    handler.resume();
    console.log('Stream resumed');
  }, 1000);

  // Emit while paused (will wait)
  await handler.emitChunk('Chunk emitted while paused');

  // Complete the stream
  await handler.emitComplete();

  // Cleanup
  unsubscribe();
  handler.cancel();

  console.log('\n✓ Streaming example completed\n');
}

export { streamingExample };
