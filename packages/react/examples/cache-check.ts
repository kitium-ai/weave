import { useEffect } from 'react';
import { useCache } from '@weaveai/react';
import type { CacheConfig } from '@weaveai/core';

const cacheConfig: CacheConfig = {
  enabled: true,
  strategy: 'semantic',
  ttl: 900,
};

export function CacheCheck({ prompt }: { prompt: string }) {
  const cache = useCache({
    cacheConfig,
    showNotification: true,
  });

  useEffect(() => {
    let cancelled = false;

    cache.queryCache(prompt).then((hit) => {
      if (cancelled || hit) {
        return;
      }

      // Imagine a fresh call to weave.generate here. Once you have a result:
      void cache.storeInCache(prompt, { text: 'fresh-result' }, {
        cost: 0.01,
        latency: 220,
        tokenCount: { input: 120, output: 200 },
      });
    });

    return () => {
      cancelled = true;
    };
  }, [cache, prompt]);

  return (
    <div>
      {cache.lastFeedback && (
        <p>
          {cache.lastFeedback.type.toUpperCase()}: {cache.lastFeedback.message}
        </p>
      )}
    </div>
  );
}
