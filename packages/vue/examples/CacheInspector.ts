import { onMounted } from 'vue';
import { useCache } from '@weaveai/vue';
import type { CacheConfig } from '@weaveai/core';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 600,
};

export function useCacheInspector(prompt: string) {
  const cache = useCache({
    cacheConfig,
    showNotification: true,
  });

  onMounted(async () => {
    const hit = await cache.queryCache(prompt);
    if (!hit) {
      // call weave.generate or weave.classify here, then persist the result
      await cache.storeInCache(
        prompt,
        { text: 'fresh result placeholder' },
        {
          cost: 0.0125,
          latency: 210,
          tokenCount: { input: 128, output: 256 },
        }
      );
    }
  });

  return cache;
}
