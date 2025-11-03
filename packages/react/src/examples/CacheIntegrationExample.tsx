import React, { useState } from 'react';
import { useCache } from '../hooks/useCache.js';
import { CacheFeedback, CacheFeedbackHistory, CacheBadge } from '../components/CacheFeedback.js';
import type { CacheConfig } from '../hooks/useCache.js';

/**
 * Example 1: Basic cache integration with feedback
 */
export const BasicCacheIntegrationExample = () => {
  const cacheConfig: CacheConfig = {
    enabled: true,
    strategy: 'semantic',
    ttl: 3600,
  };

  const { queryCache, storeInCache, lastFeedback, feedbackHistory } = useCache({
    cacheConfig,
    showNotification: true,
    notificationDuration: 3000,
  });

  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [cached, setCached] = useState(false);

  const handleGenerate = async () => {
    // Try to get from cache
    const cached = await queryCache<string>(prompt);

    if (cached) {
      setResponse(cached);
      setCached(true);
    } else {
      // Simulate generation
      const result = `Response to: ${prompt}`;
      setResponse(result);
      setCached(false);

      // Store in cache
      await storeInCache(prompt, result, {
        cost: 0.005,
        latency: 350,
        tokenCount: { input: 5, output: 25 },
      });
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <CacheFeedback event={lastFeedback} position="top-right" />

      <div style={{ marginBottom: '20px' }}>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt..."
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
          }}
        />
        <button
          onClick={handleGenerate}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Generate
        </button>
      </div>

      {response && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '4px',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h4 style={{ margin: 0 }}>Response</h4>
            <CacheBadge cached={cached} size="small" />
          </div>
          <p style={{ margin: 0, color: '#1f2937' }}>{response}</p>
        </div>
      )}

      <CacheFeedbackHistory events={feedbackHistory} maxItems={10} />
    </div>
  );
};

/**
 * Example 2: Cache with metrics display
 */
export const CacheWithMetricsExample = () => {
  const cacheConfig: CacheConfig = {
    enabled: true,
    strategy: 'exact',
    ttl: 3600,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    estimatedSavings: (cached: any, fresh: any) => ({
      cost: fresh.cost - cached.cost,
      latency: fresh.latency - cached.latency,
      tokens: fresh.tokenCount.output - cached.tokenCount.output,
    }),
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { queryCache, storeInCache, lastFeedback, stats, refreshStats } = useCache({
    cacheConfig,
    showNotification: true,
  });

  React.useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <CacheFeedback event={lastFeedback} position="top" />

      {stats && (
        <div
          style={{
            padding: '16px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0' }}>Cache Metrics</h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Entries</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {stats.entriesCount}
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Hit Rate</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {(stats.hitRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Avg Latency</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                {stats.avgLatency.toFixed(0)}ms
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Example 3: Multiple cache strategies comparison
 */
export const CacheStrategiesComparisonExample = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<'exact' | 'semantic' | 'fuzzy'>(
    'semantic'
  );

  const cacheConfig: CacheConfig = {
    enabled: true,
    strategy: selectedStrategy,
    ttl: 3600,
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { queryCache, storeInCache, lastFeedback, clearCache } = useCache({
    cacheConfig,
    showNotification: true,
  });

  const strategies: Array<{ id: 'exact' | 'semantic' | 'fuzzy'; label: string }> = [
    { id: 'exact', label: 'Exact Match' },
    { id: 'semantic', label: 'Semantic' },
    { id: 'fuzzy', label: 'Fuzzy' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <CacheFeedback event={lastFeedback} position="bottom-right" />

      <div style={{ marginBottom: '20px' }}>
        <h3>Cache Strategy</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {strategies.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSelectedStrategy(id)}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedStrategy === id ? '#3b82f6' : '#e5e7eb',
                color: selectedStrategy === id ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={clearCache}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Clear Cache
      </button>
    </div>
  );
};

/**
 * Example 4: Cache with cost breakdown
 */
export const CacheWithCostBreakdownExample = () => {
  const [totalSavings, setTotalSavings] = useState({
    cost: 0,
    latency: 0,
    tokens: 0,
  });

  const cacheConfig: CacheConfig = {
    enabled: true,
    strategy: 'semantic',
    ttl: 3600,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCacheHit: async ({ savings }: any) => {
      setTotalSavings((prev) => ({
        cost: prev.cost + savings.cost,
        latency: prev.latency + savings.latency,
        tokens: prev.tokens + savings.tokens,
      }));
    },
  };

  const { lastFeedback } = useCache({
    cacheConfig,
    showNotification: true,
  });

  return (
    <div style={{ padding: '20px' }}>
      <CacheFeedback event={lastFeedback} position="top-right" />

      <div
        style={{
          padding: '16px',
          backgroundColor: '#d1fae5',
          borderRadius: '8px',
          border: '1px solid #6ee7b7',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', color: '#065f46' }}>Total Savings</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#047857' }}>Cost Saved</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#065f46' }}>
              ${totalSavings.cost.toFixed(4)}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#047857' }}>Latency Saved</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#065f46' }}>
              {totalSavings.latency.toFixed(0)}ms
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#047857' }}>Tokens Saved</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#065f46' }}>
              {totalSavings.tokens}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Example 5: Complete cache UI with all features
 */
export const CompleteCacheUIExample = () => {
  const cacheConfig: CacheConfig = {
    enabled: true,
    strategy: 'semantic',
    ttl: 3600,
  };

  const {
    queryCache,
    storeInCache,
    lastFeedback,
    feedbackHistory,
    stats,
    refreshStats,
    clearCache,
  } = useCache({
    cacheConfig,
    showNotification: true,
    notificationDuration: 4000,
  });

  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Check cache
      const cached = await queryCache<string>(prompt);
      if (cached) {
        setResponse(cached);
        setCached(true);
      } else {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        const result = `Generated response for: "${prompt}"`;
        setResponse(result);
        setCached(false);

        // Store in cache
        await storeInCache(prompt, result, {
          cost: 0.0025,
          latency: 500,
          tokenCount: { input: 5, output: 40 },
        });

        await refreshStats();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <CacheFeedback event={lastFeedback} position="top" />

      {/* Input Section */}
      <div>
        <h2>Cache Demo</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '10px',
            marginBottom: '10px',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
            fontFamily: 'monospace',
            resize: 'vertical',
          }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          {loading ? 'Processing...' : 'Generate'}
        </button>

        {response && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Response</h3>
              <CacheBadge cached={cached} size="medium" />
            </div>
            <div
              style={{
                padding: '12px',
                backgroundColor: cached ? '#f0fdf4' : '#eff6ff',
                borderRadius: '4px',
                border: `1px solid ${cached ? '#6ee7b7' : '#93c5fd'}`,
              }}
            >
              <p style={{ margin: 0, color: '#1f2937' }}>{response}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div>
        <h2>Cache Stats</h2>
        {stats && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: '8px',
              }}
            >
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Entries</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.entriesCount}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Hit Rate</p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                  {(stats.hitRate * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                  Avg Latency
                </p>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                  {stats.avgLatency.toFixed(0)}ms
                </p>
              </div>
            </div>

            <button
              onClick={clearCache}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Clear Cache
            </button>
          </div>
        )}

        <CacheFeedbackHistory events={feedbackHistory} maxItems={8} />
      </div>
    </div>
  );
};
