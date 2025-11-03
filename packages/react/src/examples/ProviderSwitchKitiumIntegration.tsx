/**
 * ProviderSwitch + Kitium-UI Integration Examples
 * Shows how to use ProviderSwitch with KtCard, KtButton, and layout components
 */

import React, { useState } from 'react';
import { ProviderStatusIndicator } from '../components/ProviderSwitch';
import { useProviderRouting } from '../hooks/useProviderRouting';
import { KtButton, KtCard, KtLayout, KtBadge, KtAlert, KtPanel, KtTabs } from '@kitium/ui';

/**
 * Example 1: Basic Provider Selection with KtCard Layout
 * Shows provider grid using kitium-ui cards
 */
export function ProviderSwitchBasicIntegration() {
  const { currentProvider, providers, selectProvider } = useProviderRouting();
  const [notification, setNotification] = useState<string | null>(null);

  const handleProviderSelect = async (providerId: string) => {
    try {
      await selectProvider(providerId);
      setNotification(`Switched to ${providerId}`);
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification(`Failed to switch provider: ${error}`);
    }
  };

  return (
    <KtLayout direction="vertical" gap="lg">
      <KtCard header="AI Provider Selection" variant="elevated">
        <KtLayout direction="vertical" gap="md">
          <p>
            Current Provider: <strong>{currentProvider?.name}</strong>
          </p>

          <KtLayout direction="horizontal" gap="md">
            {providers.map((provider) => (
              <KtCard
                key={provider.id}
                variant={currentProvider?.id === provider.id ? 'elevated' : 'outlined'}
                onClick={() => handleProviderSelect(provider.id)}
                style={{ cursor: 'pointer', flex: 1 }}
              >
                <KtLayout direction="vertical" gap="sm">
                  <KtLayout direction="horizontal" gap="sm" justifyContent="space-between">
                    <h3 style={{ margin: 0 }}>{provider.name}</h3>
                    {currentProvider?.id === provider.id && (
                      <KtBadge variant="success">Active</KtBadge>
                    )}
                  </KtLayout>

                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    Status: {provider.status === 'healthy' ? '✓ Healthy' : '✗ Unhealthy'}
                  </div>

                  <KtButton
                    variant={currentProvider?.id === provider.id ? 'primary' : 'secondary'}
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProviderSelect(provider.id);
                    }}
                  >
                    {currentProvider?.id === provider.id ? 'Current' : 'Switch'}
                  </KtButton>
                </KtLayout>
              </KtCard>
            ))}
          </KtLayout>

          {notification && <KtAlert variant="success">{notification}</KtAlert>}
        </KtLayout>
      </KtCard>
    </KtLayout>
  );
}

/**
 * Example 2: Provider Metrics Dashboard with KtCard Grid
 * Shows detailed provider metrics using kitium-ui cards
 */
export function ProviderSwitchMetricsDashboard() {
  const { providers, currentProvider } = useProviderRouting();

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        <h1>Provider Performance Metrics</h1>

        <KtLayout direction="horizontal" gap="md" style={{ flexWrap: 'wrap' }}>
          {providers.map((provider) => (
            <KtCard
              key={provider.id}
              variant={currentProvider?.id === provider.id ? 'elevated' : 'outlined'}
              header={
                <KtLayout direction="horizontal" gap="sm" justifyContent="space-between">
                  <span>{provider.name}</span>
                  {currentProvider?.id === provider.id && <KtBadge variant="info">Active</KtBadge>}
                </KtLayout>
              }
              style={{ flex: '1 1 calc(50% - 12px)', minWidth: '250px' }}
            >
              <KtLayout direction="vertical" gap="md">
                {/* Status */}
                <div>
                  <div className="metric-label">Status</div>
                  <div className="metric-value">
                    {provider.status === 'healthy' ? '✓ Healthy' : '✗ Unhealthy'}
                  </div>
                </div>

                {/* Response Time */}
                <div>
                  <div className="metric-label">Avg Response Time</div>
                  <div className="metric-value">
                    {provider.metrics?.latency ? `${provider.metrics.latency}ms` : 'N/A'}
                  </div>
                </div>

                {/* Success Rate */}
                <div>
                  <div className="metric-label">Success Rate</div>
                  <div className="metric-value">
                    {provider.metrics?.successRate
                      ? `${(provider.metrics.successRate * 100).toFixed(1)}%`
                      : 'N/A'}
                  </div>
                </div>

                {/* Cost */}
                <div>
                  <div className="metric-label">Cost per 1K Tokens</div>
                  <div className="metric-value">
                    ${provider.metrics?.costPer1kTokens?.toFixed(4) ?? 'N/A'}
                  </div>
                </div>

                {/* Action Button */}
                <KtButton
                  variant={currentProvider?.id === provider.id ? 'primary' : 'secondary'}
                  fullWidth
                  size="sm"
                >
                  {currentProvider?.id === provider.id ? 'Current Provider' : 'Switch'}
                </KtButton>
              </KtLayout>
            </KtCard>
          ))}
        </KtLayout>
      </KtLayout>

      <style>{`
        .metric-label {
          font-size: 0.875rem;
          opacity: 0.6;
          font-weight: 500;
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
 * Example 3: Provider Selector with Status Indicators
 * Shows provider selection with real-time status
 */
export function ProviderSwitchStatusIndicators() {
  const { providers, currentProvider, selectProvider } = useProviderRouting();

  return (
    <KtCard header="Provider Status" variant="outlined">
      <KtLayout direction="vertical" gap="md">
        <KtLayout direction="horizontal" gap="sm" style={{ flexWrap: 'wrap' }}>
          {providers.map((provider) => (
            <ProviderStatusIndicator
              key={provider.id}
              provider={provider}
              isActive={currentProvider?.id === provider.id}
              onClick={() => selectProvider(provider.id)}
            />
          ))}
        </KtLayout>

        <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>
          <strong>Currently Selected:</strong> {currentProvider?.name}
        </div>
      </KtLayout>
    </KtCard>
  );
}

/**
 * Example 4: Multi-Tab Provider Configuration
 * Shows providers organized by use case
 */
export function ProviderSwitchConfigurationTabs() {
  const { providers, selectProvider } = useProviderRouting();

  const categorized = {
    lowCost: providers.filter((p) => p.costTier === 'low'),
    balanced: providers.filter((p) => p.costTier === 'medium'),
    premium: providers.filter((p) => p.costTier === 'high'),
  };

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        <h1>Provider Configuration</h1>

        <KtTabs
          tabs={[
            {
              id: 'low-cost',
              label: '💰 Low Cost',
              content: (
                <KtLayout direction="vertical" gap="md">
                  {categorized.lowCost.map((provider) => (
                    <KtCard key={provider.id} variant="outlined">
                      <KtLayout direction="horizontal" gap="md" justifyContent="space-between">
                        <KtLayout direction="vertical" gap="xs">
                          <h3>{provider.name}</h3>
                          <p style={{ margin: 0, opacity: 0.7 }}>
                            ${provider.metrics?.costPer1kTokens?.toFixed(4)} per 1K tokens
                          </p>
                        </KtLayout>
                        <KtButton variant="secondary" onClick={() => selectProvider(provider.id)}>
                          Select
                        </KtButton>
                      </KtLayout>
                    </KtCard>
                  ))}
                </KtLayout>
              ),
            },
            {
              id: 'balanced',
              label: '⚖️ Balanced',
              content: (
                <KtLayout direction="vertical" gap="md">
                  {categorized.balanced.map((provider) => (
                    <KtCard key={provider.id} variant="outlined">
                      <KtLayout direction="horizontal" gap="md" justifyContent="space-between">
                        <KtLayout direction="vertical" gap="xs">
                          <h3>{provider.name}</h3>
                          <p style={{ margin: 0, opacity: 0.7 }}>
                            ~{provider.metrics?.latency}ms latency
                          </p>
                        </KtLayout>
                        <KtButton variant="secondary" onClick={() => selectProvider(provider.id)}>
                          Select
                        </KtButton>
                      </KtLayout>
                    </KtCard>
                  ))}
                </KtLayout>
              ),
            },
            {
              id: 'premium',
              label: '⭐ Premium',
              content: (
                <KtLayout direction="vertical" gap="md">
                  {categorized.premium.map((provider) => (
                    <KtCard
                      key={provider.id}
                      variant="elevated"
                      header={
                        <KtLayout direction="horizontal" gap="sm" justifyContent="space-between">
                          <span>{provider.name}</span>
                          <KtBadge variant="info">Premium</KtBadge>
                        </KtLayout>
                      }
                    >
                      <KtLayout direction="vertical" gap="sm">
                        <p style={{ margin: 0, opacity: 0.7 }}>Highest performance & reliability</p>
                        <KtButton
                          variant="primary"
                          fullWidth
                          onClick={() => selectProvider(provider.id)}
                        >
                          Select Premium
                        </KtButton>
                      </KtLayout>
                    </KtCard>
                  ))}
                </KtLayout>
              ),
            },
          ]}
        />
      </KtLayout>
    </KtPanel>
  );
}

/**
 * Example 5: Complete Provider Management Dashboard
 * Full-featured provider management with all kitium-ui components
 */
export function ProviderSwitchCompleteDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { providers, currentProvider, selectProvider, eventHistory, getProviderStatus } =
    useProviderRouting();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showDetails, setShowDetails] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showHistory, setShowHistory] = useState(true);

  return (
    <KtPanel>
      <KtLayout direction="vertical" gap="lg">
        {/* Header */}
        <KtLayout
          direction="horizontal"
          gap="md"
          justifyContent="space-between"
          alignItems="center"
        >
          <h1>AI Provider Management</h1>
          <KtBadge variant="success">{currentProvider?.name || 'No provider selected'}</KtBadge>
        </KtLayout>

        {/* Provider Grid */}
        <KtCard header="Available Providers" variant="elevated">
          <KtLayout direction="horizontal" gap="md" style={{ flexWrap: 'wrap' }}>
            {providers.map((provider) => (
              <KtCard
                key={provider.id}
                variant={currentProvider?.id === provider.id ? 'elevated' : 'outlined'}
                onClick={() => selectProvider(provider.id)}
                style={{
                  cursor: 'pointer',
                  flex: '1 1 calc(33.333% - 12px)',
                  minWidth: '250px',
                }}
              >
                <KtLayout direction="vertical" gap="md">
                  {/* Header */}
                  <KtLayout direction="horizontal" gap="md" justifyContent="space-between">
                    <h3 style={{ margin: 0 }}>{provider.name}</h3>
                    {currentProvider?.id === provider.id && (
                      <KtBadge variant="info">Active</KtBadge>
                    )}
                    {provider.status === 'healthy' ? (
                      <KtBadge variant="success">Healthy</KtBadge>
                    ) : (
                      <KtBadge variant="error">Offline</KtBadge>
                    )}
                  </KtLayout>

                  {/* Metrics Grid */}
                  <KtLayout direction="vertical" gap="sm">
                    <div className="metric-row">
                      <span className="metric-label">Latency:</span>
                      <span className="metric-value">{provider.metrics?.latency}ms</span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Success Rate:</span>
                      <span className="metric-value">
                        {(provider.metrics?.successRate ?? 0 * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric-row">
                      <span className="metric-label">Cost/1K:</span>
                      <span className="metric-value">
                        ${provider.metrics?.costPer1kTokens?.toFixed(4)}
                      </span>
                    </div>
                  </KtLayout>

                  {/* Action */}
                  <KtButton
                    variant={currentProvider?.id === provider.id ? 'primary' : 'secondary'}
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation();
                      selectProvider(provider.id);
                    }}
                  >
                    {currentProvider?.id === provider.id ? 'Current' : 'Switch To'}
                  </KtButton>
                </KtLayout>
              </KtCard>
            ))}
          </KtLayout>
        </KtCard>

        {/* Details Section */}
        {showDetails && (
          <KtCard header="Provider Details" variant="outlined">
            {currentProvider && (
              <KtLayout direction="vertical" gap="md">
                <div className="detail-section">
                  <h4>Performance</h4>
                  <KtLayout direction="horizontal" gap="lg">
                    <div>
                      <div className="detail-label">Response Time</div>
                      <div className="detail-value">{currentProvider.metrics?.latency}ms</div>
                    </div>
                    <div>
                      <div className="detail-label">Availability</div>
                      <div className="detail-value">
                        {(currentProvider.metrics?.availability ?? 0 * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="detail-label">Uptime</div>
                      <div className="detail-value">{currentProvider.metrics?.uptime}%</div>
                    </div>
                  </KtLayout>
                </div>

                <div className="detail-section">
                  <h4>Pricing</h4>
                  <KtLayout direction="horizontal" gap="lg">
                    <div>
                      <div className="detail-label">Cost/1K Tokens</div>
                      <div className="detail-value">
                        ${currentProvider.metrics?.costPer1kTokens?.toFixed(4)}
                      </div>
                    </div>
                    <div>
                      <div className="detail-label">Pricing Tier</div>
                      <div className="detail-value">{currentProvider.costTier}</div>
                    </div>
                  </KtLayout>
                </div>
              </KtLayout>
            )}
          </KtCard>
        )}

        {/* Event History */}
        {showHistory && (
          <KtCard header="Recent Events" variant="outlined">
            <KtLayout direction="vertical" gap="sm">
              {eventHistory.slice(-5).map((event, idx) => (
                <KtAlert
                  key={idx}
                  variant={
                    event.type === 'success' ? 'success' : event.type === 'error' ? 'error' : 'info'
                  }
                >
                  <strong>{event.provider}</strong>: {event.message}
                </KtAlert>
              ))}
            </KtLayout>
          </KtCard>
        )}
      </KtLayout>

      <style>{`
        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
        }
        .metric-label {
          opacity: 0.6;
          font-weight: 500;
        }
        .metric-value {
          font-weight: 600;
        }
        .detail-section {
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--kt-border-light);
        }
        .detail-section:last-child {
          border-bottom: none;
        }
        .detail-section h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.7;
        }
        .detail-label {
          font-size: 0.75rem;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }
        .detail-value {
          font-size: 1.25rem;
          font-weight: 600;
        }
      `}</style>
    </KtPanel>
  );
}

export default {
  ProviderSwitchBasicIntegration,
  ProviderSwitchMetricsDashboard,
  ProviderSwitchStatusIndicators,
  ProviderSwitchConfigurationTabs,
  ProviderSwitchCompleteDashboard,
};
