import { useEffect } from 'react';
import { useCache } from '@weaveai/react-native';
import type { CacheConfig } from '@weaveai/core';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 600,
};

export function useCacheInspector(prompt: string) {
  const cache = useCache({ cacheConfig, showNotification: true });

  useEffect(() => {
    cache.queryCache(prompt).then((hit) => {
      if (!hit) {
        void cache.storeInCache(
          prompt,
          { text: 'fresh result placeholder' },
          {
            cost: 0.01,
            latency: 210,
            tokenCount: { input: 100, output: 180 },
          }
        );
      }
    });
  }, [cache, prompt]);

  return cache;
}
