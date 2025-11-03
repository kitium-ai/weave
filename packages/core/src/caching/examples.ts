/**
 * Cache System Examples
 * Smart caching with semantic matching, cost savings, and UI feedback
 */

import { CacheManager } from './cache-manager.js';
import { SimpleCache } from './cache-storage.js';
import type { CacheConfig } from './types.js';

/**
 * Example 1: Basic exact match caching
 */
export async function exampleBasicCaching() {
  const config: CacheConfig = {
    enabled: true,
    strategy: 'exact',
    ttl: 3600, // 1 hour
  };

  const cache = new CacheManager(config);

  // Store a result
  await cache.store(
    'Explain quantum computing',
    {
      text: 'Quantum computing uses quantum bits...',
      tokenCount: { input: 5, output: 50 },
    },
    {
      cost: 0.001,
      latency: 250,
      tokenCount: { input: 5, output: 50 },
    }
  );

  // Query cache
  const result = await cache.query('Explain quantum computing');
  if (result.hit) {
    console.log('Cache hit!', result.data);
    console.log('Savings:', result.savings);
  }
}

/**
 * Example 2: Semantic caching with UI feedback
 */
export async function exampleSemanticCaching() {
  const config: CacheConfig = {
    enabled: true,
    strategy: 'semantic',
    ttl: 3600,
    onCacheHit: async ({ savings, entry }) => {
      // UI feedback
      console.log('✅ Cache hit!');
      console.log(`💰 Saved: $${savings.cost.toFixed(4)}`);
      console.log(`⚡ Latency saved: ${savings.latency.toFixed(0)}ms`);
      console.log(`🎯 Tokens saved: ${savings.tokens}`);
    },
  };

  const cache = new CacheManager(config);

  // Store results
  await cache.store(
    'What is machine learning?',
    { text: 'Machine learning is a subset of AI...' },
    {
      cost: 0.002,
      latency: 350,
      tokenCount: { input: 4, output: 75 },
    }
  );

  // Query with similar but not identical prompt
  const result = await cache.query('Tell me about machine learning', {
    similarity: 0.8, // 80% similarity threshold
  });

  if (result.hit) {
    console.log('Semantic match found!');
  }
}

/**
 * Example 3: Cost savings estimation
 */
export async function exampleCostSavings() {
  const config: CacheConfig = {
    enabled: true,
    strategy: 'exact',
    ttl: 3600,
    estimatedSavings: (cached, fresh) => {
      const costDiff = fresh.cost - cached.cost;
      const latencyDiff = fresh.latency - cached.latency;
      const tokenDiff = fresh.tokenCount.output - cached.tokenCount.output;

      return {
        cost: costDiff,
        latency: latencyDiff,
        tokens: tokenDiff,
      };
    },
  };

  const cache = new CacheManager(config);

  await cache.store(
    'Generate a story about adventure',
    { text: 'Once upon a time...' },
    {
      cost: 0.015,
      latency: 1500,
      tokenCount: { input: 6, output: 200 },
    }
  );

  const result = await cache.query('Generate a story about adventure');
  if (result.hit) {
    console.log('Savings:', {
      costSaved: `$${result.savings.cost.toFixed(4)}`,
      latencySaved: `${result.savings.latency.toFixed(0)}ms`,
      tokensSaved: result.savings.tokens,
    });
  }
}

/**
 * Example 4: Fuzzy matching for similar queries
 */
export async function exampleFuzzyMatching() {
  const config: CacheConfig = {
    enabled: true,
    strategy: 'fuzzy',
    ttl: 3600,
    onCacheHit: async ({ savings }) => {
      console.log('Fuzzy match found! Savings:', savings);
    },
  };

  const cache = new CacheManager(config);

  await cache.store(
    'Summarize the benefits of cloud computing',
    { text: 'Cloud computing provides scalability...' },
    {
      cost: 0.005,
      latency: 400,
      tokenCount: { input: 7, output: 100 },
    }
  );

  // Similar query
  const result = await cache.query('Summarise the advantages of cloud', {
    similarity: 0.7, // 70% match is enough
  });

  console.log('Found match:', result.hit);
}

/**
 * Example 5: Cache statistics and monitoring
 */
export async function exampleCacheStats() {
  const config: CacheConfig = {
    enabled: true,
    strategy: 'semantic',
    ttl: 3600,
  };

  const cache = new CacheManager(config);

  // Store multiple items
  const prompts = ['What is AI?', 'Explain deep learning', 'What is neural networks?'];

  for (const prompt of prompts) {
    await cache.store(
      prompt,
      { text: `Response to: ${prompt}` },
      {
        cost: 0.001,
        latency: 200,
        tokenCount: { input: 3, output: 50 },
      }
    );
  }

  // Get stats
  const stats = await cache.getStats();
  console.log('Cache Statistics:', {
    entries: stats.entriesCount,
    hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
    avgLatency: `${stats.avgLatency.toFixed(0)}ms`,
  });
}

/**
 * Example 6: Multiple caching strategies
 */
export async function exampleMultipleStrategies() {
  const strategies = [
    {
      name: 'Exact',
      config: {
        enabled: true,
        strategy: 'exact' as const,
        ttl: 3600,
      },
    },
    {
      name: 'Semantic',
      config: {
        enabled: true,
        strategy: 'semantic' as const,
        ttl: 3600,
      },
    },
    {
      name: 'Fuzzy',
      config: {
        enabled: true,
        strategy: 'fuzzy' as const,
        ttl: 3600,
      },
    },
  ];

  const testPrompt = 'Explain machine learning';
  const similarPrompt = 'Tell me about machine learning';

  for (const { name, config } of strategies) {
    const cache = new CacheManager(config);

    await cache.store(
      testPrompt,
      { text: 'Machine learning is...' },
      {
        cost: 0.002,
        latency: 300,
        tokenCount: { input: 4, output: 60 },
      }
    );

    const exactMatch = await cache.query(testPrompt);
    const similarMatch = await cache.query(similarPrompt);

    console.log(`\n${name} Strategy:`, {
      exactMatch: exactMatch.hit,
      similarMatch: similarMatch.hit,
    });
  }
}

/**
 * Example 7: Real-world usage with generate operation
 */
export interface GenerateResult {
  text: string;
  cost: number;
  latency: number;
  tokenCount: { input: number; output: number };
  cached: boolean;
}

export async function exampleIntegrationWithGenerate(
  generateFn: (prompt: string) => Promise<any>
): Promise<GenerateResult> {
  const cacheConfig: CacheConfig = {
    enabled: true,
    strategy: 'semantic',
    ttl: 3600,
    onCacheHit: async ({ savings, entry }) => {
      // Trigger UI feedback
      console.log(`✅ Using cached response`);
      console.log(`💾 Cache created: ${new Date(entry.createdAt).toLocaleString()}`);
      console.log(`📊 Savings: $${savings.cost.toFixed(4)}`);
    },
  };

  const cache = new CacheManager(cacheConfig);
  const prompt = 'Write a product description';

  // Check cache first
  const cached = await cache.query<any>(prompt);
  if (cached.hit) {
    return {
      text: cached.data.text,
      cost: cached.data.cost,
      latency: cached.data.latency,
      tokenCount: cached.data.tokenCount,
      cached: true,
    };
  }

  // Generate fresh result
  const start = performance.now();
  const result = await generateFn(prompt);
  const latency = performance.now() - start;

  // Store in cache
  await cache.store(prompt, result, {
    cost: 0.005,
    latency,
    tokenCount: result.tokenCount,
  });

  return {
    text: result.text,
    cost: 0.005,
    latency,
    tokenCount: result.tokenCount,
    cached: false,
  };
}
