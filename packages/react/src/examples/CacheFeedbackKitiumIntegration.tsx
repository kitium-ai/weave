/**
 * CacheFeedback + Kitium-UI Integration Examples
 * Shows how to use CacheFeedback with KtToast, KtCard, and KtLayout
 */

import React, { useState } from 'react';
import { CacheFeedback, CacheBadge } from '../components/CacheFeedback';
import { useCache } from '../hooks/useCache';
import {
  KtButton,
  KtCard,
  KtLayout,
  KtAlert,
  KtPanel,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  KtToast,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  KtToastStack,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  KtBadge,
} from '@kitium/ui';

/**
 * Example 1: Basic Cache Integration with KtToast
 * Shows CacheFeedback working alongside kitium-ui toasts
 */
export function CacheFeedbackBasicIntegration() {
  const { queryCache, storeInCache, statistics } = useCache();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const handleQuery = async () => {
    const cached = queryCache(query);
    if (cached) {
      setResult(`[CACHED] ${cached.result}`);
    } else {
      // Simulate API call
      const freshResult = `Result for "${query}"`;
      storeInCache(query, freshResult);
      setResult(`[FRESH] ${freshResult}`);
    }
  };

  return (
    <KtLayout direction="vertical" gap="lg">
      <KtCard header="Cache Demo" variant="elevated">
        <KtLayout direction="vertical" gap="md">
          {/* Input Section */}
          <KtLayout direction="horizontal" gap="md">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a query..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid var(--kt-border-default)',
                borderRadius: '0.375rem',
              }}
            />
            <KtButton variant="primary" onClick={handleQuery}>
              Query
            </KtButton>
          </KtLayout>

          {/* Result */}
          {result && <KtAlert variant="info">{result}</KtAlert>}

          {/* Statistics */}
          <KtCard variant="outlined" header="Cache Statistics">
            <KtLayout direction="horizontal" gap="lg">
              <div>
                <div className="stat-label">Hits</div>
                <div className="stat-value">{statistics.hits}</div>
              </div>
              <div>
                <div className="stat-label">Misses</div>
                <div className="stat-value">{statistics.misses}</div>
              </div>
              <div>
                <div className="stat-label">Hit Rate</div>
                <div className="stat-value">
                  {((statistics.hits / (statistics.hits + statistics.misses)) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="stat-label">Total Savings</div>
                <div className="stat-value">${statistics.totalSavings?.toFixed(2) ?? '0.00'}</div>
              </div>
            </KtLayout>
          </KtCard>

          {/* Feedback Component */}
          <CacheFeedback event={statistics.lastEvent} position="top-right" autoHide={true} />
        </KtLayout>
      </KtCard>

      <style>{`
        .stat-label {
          font-size: 0.75rem;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
        }
      `}</style>
    </KtLayout>
  );
}

/**
 * Example 2: Cache Dashboard with KtCard Grid
 * Shows comprehensive cache metrics
 */
export function CacheFeedbackDashboard() {
  const { statistics, feedbackHistory, clearHistory } = useCache();

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        <h1>Cache Performance Dashboard</h1>

        {/* KPI Cards */}
        <KtLayout direction="horizontal" gap="md" style={{ flexWrap: 'wrap' }}>
          <KtCard
            header="Total Queries"
            variant="elevated"
            style={{ flex: '1 1 calc(25% - 12px)', minWidth: '150px' }}
          >
            <div className="kpi-value">{statistics.hits + statistics.misses}</div>
          </KtCard>

          <KtCard
            header="Cache Hit Rate"
            variant="elevated"
            style={{ flex: '1 1 calc(25% - 12px)', minWidth: '150px' }}
          >
            <div className="kpi-value">
              {((statistics.hits / (statistics.hits + statistics.misses)) * 100).toFixed(1)}%
            </div>
          </KtCard>

          <KtCard
            header="Cost Savings"
            variant="elevated"
            style={{ flex: '1 1 calc(25% - 12px)', minWidth: '150px' }}
          >
            <div className="kpi-value">${statistics.totalSavings?.toFixed(2) ?? '0.00'}</div>
          </KtCard>

          <KtCard
            header="Time Saved"
            variant="elevated"
            style={{ flex: '1 1 calc(25% - 12px)', minWidth: '150px' }}
          >
            <div className="kpi-value">{statistics.timeSaved?.toFixed(1) ?? 0}s</div>
          </KtCard>
        </KtLayout>

        {/* Detailed Metrics */}
        <KtCard header="Cache Metrics" variant="outlined">
          <KtLayout direction="vertical" gap="md">
            {/* Hit/Miss Breakdown */}
            <div>
              <h4 className="section-title">Hit/Miss Breakdown</h4>
              <KtLayout direction="horizontal" gap="lg">
                <div>
                  <div className="metric-label">Cache Hits</div>
                  <div className="metric-value">{statistics.hits}</div>
                </div>
                <div>
                  <div className="metric-label">Cache Misses</div>
                  <div className="metric-value">{statistics.misses}</div>
                </div>
                <div>
                  <div className="metric-label">Hit Rate</div>
                  <div className="metric-value">
                    {((statistics.hits / (statistics.hits + statistics.misses)) * 100).toFixed(1)}%
                  </div>
                </div>
              </KtLayout>
            </div>

            {/* Performance Metrics */}
            <div>
              <h4 className="section-title">Performance</h4>
              <KtLayout direction="horizontal" gap="lg">
                <div>
                  <div className="metric-label">Avg Latency Saved</div>
                  <div className="metric-value">
                    {statistics.avgLatencySaved?.toFixed(0) ?? 0}ms
                  </div>
                </div>
                <div>
                  <div className="metric-label">Total Time Saved</div>
                  <div className="metric-value">{statistics.timeSaved?.toFixed(2) ?? 0}s</div>
                </div>
              </KtLayout>
            </div>

            {/* Cost Metrics */}
            <div>
              <h4 className="section-title">Cost Analysis</h4>
              <KtLayout direction="horizontal" gap="lg">
                <div>
                  <div className="metric-label">Cost Saved</div>
                  <div className="metric-value">
                    ${statistics.totalSavings?.toFixed(4) ?? '0.0000'}
                  </div>
                </div>
                <div>
                  <div className="metric-label">Avg Cost per Hit</div>
                  <div className="metric-value">
                    ${(statistics.totalSavings ?? 0 / (statistics.hits || 1)).toFixed(4)}
                  </div>
                </div>
              </KtLayout>
            </div>
          </KtLayout>
        </KtCard>

        {/* Recent Events */}
        <KtCard header="Recent Cache Events" variant="outlined">
          <KtLayout direction="vertical" gap="sm">
            {feedbackHistory.length > 0 ? (
              feedbackHistory.slice(-10).map((event, idx) => (
                <KtAlert
                  key={idx}
                  variant={
                    event.type === 'hit' ? 'success' : event.type === 'miss' ? 'warning' : 'info'
                  }
                >
                  <KtLayout direction="horizontal" gap="md" justifyContent="space-between">
                    <div>
                      <strong>{event.type.toUpperCase()}</strong>: {event.query}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </KtLayout>
                </KtAlert>
              ))
            ) : (
              <p style={{ textAlign: 'center', opacity: 0.6 }}>No cache events yet</p>
            )}
            {feedbackHistory.length > 0 && (
              <KtButton variant="secondary" size="sm" onClick={clearHistory}>
                Clear History
              </KtButton>
            )}
          </KtLayout>
        </KtCard>
      </KtLayout>

      <style>{`
        .kpi-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
        }
        .section-title {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }
        .metric-label {
          font-size: 0.75rem;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        .metric-value {
          font-size: 1.25rem;
          font-weight: 600;
        }
      `}</style>
    </KtPanel>
  );
}

/**
 * Example 3: Cache Badges with Real-time Indicators
 * Shows cache status inline with other content
 */
export function CacheFeedbackBadges() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { queryCache, storeInCache } = useCache();

  const queries = [
    { id: 1, text: 'Popular AI Frameworks', cached: true },
    { id: 2, text: 'React Performance Tips', cached: true },
    { id: 3, text: 'Latest TypeScript Features', cached: false },
  ];

  return (
    <KtLayout direction="vertical" gap="lg">
      <KtCard header="Query Results" variant="outlined">
        <KtLayout direction="vertical" gap="md">
          {queries.map((q) => (
            <KtCard key={q.id} variant="outlined">
              <KtLayout direction="horizontal" gap="md" justifyContent="space-between">
                <div>{q.text}</div>
                <CacheBadge cached={q.cached} size="medium" showTooltip />
              </KtLayout>
            </KtCard>
          ))}
        </KtLayout>
      </KtCard>
    </KtLayout>
  );
}

/**
 * Example 4: Multi-Query Cache with KtLayout
 * Shows caching multiple different query types
 */
export function CacheFeedbackMultiQuery() {
  const { queryCache, storeInCache, statistics } = useCache();

  const [queries, setQueries] = useState<
    Array<{ type: string; query: string; cached: boolean; result?: string }>
  >([]);

  const executeQuery = (type: string, query: string) => {
    const cached = queryCache(`${type}:${query}`);
    if (cached) {
      setQueries([
        ...queries,
        {
          type,
          query,
          cached: true,
          result: cached.result,
        },
      ]);
    } else {
      const result = `Result for ${type}: ${query}`;
      storeInCache(`${type}:${query}`, result);
      setQueries([
        ...queries,
        {
          type,
          query,
          cached: false,
          result,
        },
      ]);
    }
  };

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        <h1>Multi-Query Cache Example</h1>

        {/* Query Types */}
        <KtCard header="Execute Queries" variant="outlined">
          <KtLayout direction="vertical" gap="md">
            <div>
              <h4>Search Queries</h4>
              <KtLayout direction="horizontal" gap="sm">
                <KtButton
                  variant="secondary"
                  onClick={() => executeQuery('search', 'AI frameworks')}
                >
                  AI Frameworks
                </KtButton>
                <KtButton
                  variant="secondary"
                  onClick={() => executeQuery('search', 'React patterns')}
                >
                  React Patterns
                </KtButton>
              </KtLayout>
            </div>

            <div>
              <h4>Translation Queries</h4>
              <KtLayout direction="horizontal" gap="sm">
                <KtButton
                  variant="secondary"
                  onClick={() => executeQuery('translate', 'hello to spanish')}
                >
                  Hello to Spanish
                </KtButton>
                <KtButton
                  variant="secondary"
                  onClick={() => executeQuery('translate', 'goodbye to french')}
                >
                  Goodbye to French
                </KtButton>
              </KtLayout>
            </div>

            <div>
              <h4>Analysis Queries</h4>
              <KtLayout direction="horizontal" gap="sm">
                <KtButton
                  variant="secondary"
                  onClick={() => executeQuery('analyze', 'code quality')}
                >
                  Code Quality
                </KtButton>
                <KtButton
                  variant="secondary"
                  onClick={() => executeQuery('analyze', 'performance metrics')}
                >
                  Performance Metrics
                </KtButton>
              </KtLayout>
            </div>
          </KtLayout>
        </KtCard>

        {/* Results */}
        <KtCard header="Query Results" variant="outlined">
          {queries.length > 0 ? (
            <KtLayout direction="vertical" gap="md">
              {queries.map((q, idx) => (
                <KtLayout
                  key={idx}
                  direction="horizontal"
                  gap="md"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <div>
                    <strong>{q.type}</strong>: {q.query}
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>{q.result}</div>
                  </div>
                  <CacheBadge cached={q.cached} size="small" />
                </KtLayout>
              ))}
            </KtLayout>
          ) : (
            <p style={{ textAlign: 'center', opacity: 0.6 }}>No queries executed yet</p>
          )}
        </KtCard>

        {/* Statistics */}
        <KtCard header="Cache Statistics" variant="outlined">
          <KtLayout direction="horizontal" gap="lg">
            <div>
              <div className="stat-label">Total Queries</div>
              <div className="stat-value">{statistics.hits + statistics.misses}</div>
            </div>
            <div>
              <div className="stat-label">Cached Results</div>
              <div className="stat-value">{statistics.hits}</div>
            </div>
            <div>
              <div className="stat-label">Fresh Results</div>
              <div className="stat-value">{statistics.misses}</div>
            </div>
            <div>
              <div className="stat-label">Hit Rate</div>
              <div className="stat-value">
                {((statistics.hits / (statistics.hits + statistics.misses)) * 100).toFixed(1)}%
              </div>
            </div>
          </KtLayout>
        </KtCard>
      </KtLayout>

      <style>{`
        .stat-label {
          font-size: 0.75rem;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 600;
        }
      `}</style>
    </KtPanel>
  );
}

/**
 * Example 5: Complete Cache & Toast Integration
 * Shows CacheFeedback with KtToastStack for notifications
 */
export function CacheFeedbackCompleteIntegration() {
  const { queryCache, storeInCache, feedbackHistory } = useCache();
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  const handleQuery = (query: string) => {
    const cached = queryCache(query);
    const isHit = !!cached;

    // Create toast notification
    const toastId = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        message: isHit ? `✓ Cached: ${query}` : `⚡ Fresh query: ${query}`,
      },
    ]);

    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 3000);

    // Store if not cached
    if (!cached) {
      storeInCache(query, `Result for: ${query}`);
    }
  };

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        <h1>Cache with Toast Notifications</h1>

        {/* Query Input */}
        <KtCard header="Execute Queries" variant="elevated">
          <KtLayout direction="vertical" gap="md">
            <KtLayout direction="horizontal" gap="sm">
              <button onClick={() => handleQuery('Weather in NYC')} className="demo-button">
                Weather Query
              </button>
              <button onClick={() => handleQuery('Stock prices')} className="demo-button">
                Stock Query
              </button>
              <button onClick={() => handleQuery('News articles')} className="demo-button">
                News Query
              </button>
              <button
                onClick={() => handleQuery('Weather in NYC')}
                className="demo-button demo-button--cached"
              >
                Repeat Weather
              </button>
            </KtLayout>
            <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>
              Try executing the same query twice to see cache hit in action
            </p>
          </KtLayout>
        </KtCard>

        {/* Recent Activity */}
        <KtCard header="Activity Log" variant="outlined">
          {feedbackHistory.length > 0 ? (
            <KtLayout direction="vertical" gap="sm">
              {feedbackHistory.slice(-10).map((event, idx) => (
                <KtAlert key={idx} variant={event.type === 'hit' ? 'success' : 'warning'}>
                  <strong>{event.type === 'hit' ? '💾 Cache Hit' : '⚡ Cache Miss'}</strong>
                  {' - '}
                  {event.query}
                </KtAlert>
              ))}
            </KtLayout>
          ) : (
            <p style={{ textAlign: 'center', opacity: 0.6 }}>No queries yet</p>
          )}
        </KtCard>

        {/* Toast Stack */}
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <KtLayout direction="vertical" gap="sm">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--kt-surface-primary)',
                  border: '1px solid var(--kt-border-default)',
                  borderRadius: '0.375rem',
                  boxShadow: 'var(--kt-shadow-md)',
                  animation: 'slideIn 0.3s ease-out',
                }}
              >
                {toast.message}
              </div>
            ))}
          </KtLayout>
        </div>
      </KtLayout>

      <style>{`
        .demo-button {
          padding: 0.5rem 1rem;
          background: var(--kt-primary-light);
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .demo-button:hover {
          background: var(--kt-primary);
        }
        .demo-button--cached {
          background: var(--kt-success);
        }
        .demo-button--cached:hover {
          background: var(--kt-success-light);
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </KtPanel>
  );
}

export default {
  CacheFeedbackBasicIntegration,
  CacheFeedbackDashboard,
  CacheFeedbackBadges,
  CacheFeedbackMultiQuery,
  CacheFeedbackCompleteIntegration,
};
