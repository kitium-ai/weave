import { createCacheStore } from '@weaveai/svelte';
import type { CacheConfig } from '@weaveai/core';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 900,
};

export const cacheStore = createCacheStore({ cacheConfig });

export async function ensureCached(prompt: string): Promise<void> {
  const hit = await cacheStore.queryCache(prompt);
  if (hit) return;

  await cacheStore.storeInCache(
    prompt,
    { text: 'placeholder result' },
    {
      cost: 0.01,
      latency: 180,
      tokenCount: { input: 140, output: 220 },
    }
  );
}
