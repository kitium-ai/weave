import React, { useState, useEffect } from 'react';
import { useProviderRouting, useProviderNotifications } from '../hooks/useProviderRouting.js';
import {
  ProviderSwitch,
  ProviderSelector,
  ProviderEventFeed,
} from '../components/ProviderSwitch.js';
import type { ProviderStatus, UIAwareProviderRouter } from '@weaveai/core';

/**
 * Example 1: Basic provider switching
 */
export const BasicProviderSwitchingExample = ({ router }: { router: UIAwareProviderRouter }) => {
  const { currentProvider, providers, selectProvider } = useProviderRouting({
    router,
    autoRefresh: true,
    refreshInterval: 10000,
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>Provider Routing</h2>
      <ProviderSwitch
        providers={providers}
        currentProvider={currentProvider || undefined}
        onProviderSelect={selectProvider}
        showMetrics={true}
      />
    </div>
  );
};

/**
 * Example 2: Provider selector dropdown
 */
export const ProviderSelectorExample = ({ router }: { router: UIAwareProviderRouter }) => {
  const { currentProvider, providers, selectProvider } = useProviderRouting({
    router,
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2>Select Provider</h2>
      <ProviderSelector
        providers={providers}
        currentProvider={currentProvider || undefined}
        onSelect={selectProvider}
      />
      {currentProvider && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#eff6ff',
            borderRadius: '4px',
            border: '1px solid #93c5fd',
          }}
        >
          <p style={{ margin: 0, color: '#1f2937' }}>
            Current Provider: <strong>{currentProvider}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Example 3: Provider status monitoring
 */
export const ProviderStatusMonitoringExample = ({ router }: { router: UIAwareProviderRouter }) => {
  const { providers, lastEvent, refreshStatus, isLoading, error } = useProviderRouting({
    router,
    autoRefresh: true,
    refreshInterval: 5000,
  });

  const healthyCount = providers.filter((p) => p.healthy).length;
  const totalCount = providers.length;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Provider Status</h2>

      <div
        style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
              Healthy Providers
            </p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {healthyCount}/{totalCount}
            </p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Status</p>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 'bold',
                color:
                  healthyCount === totalCount
                    ? '#10b981'
                    : healthyCount > 0
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            >
              {healthyCount === totalCount
                ? '✓ All Healthy'
                : healthyCount > 0
                  ? '⚠️ Degraded'
                  : '✕ All Down'}
            </p>
          </div>
        </div>
      </div>

      <ProviderSwitch providers={providers} showMetrics={true} />

      {lastEvent && (
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#f0fdf4',
            borderRadius: '4px',
            border: '1px solid #6ee7b7',
          }}
        >
          <p style={{ margin: 0, color: '#065f46', fontSize: '13px' }}>
            Last Event: <strong>{lastEvent.type}</strong> at{' '}
            {lastEvent.timestamp.toLocaleTimeString()}
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#fef2f2',
            borderRadius: '4px',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            fontSize: '13px',
          }}
        >
          Error: {error.message}
        </div>
      )}

      <button
        onClick={refreshStatus}
        disabled={isLoading}
        style={{
          marginTop: '12px',
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: '500',
        }}
      >
        {isLoading ? 'Refreshing...' : 'Refresh Status'}
      </button>
    </div>
  );
};

/**
 * Example 4: Provider events timeline
 */
export const ProviderEventsTimelineExample = ({ router }: { router: UIAwareProviderRouter }) => {
  const { events, clearEvents } = useProviderRouting({
    router,
  });

  // Simulate routing events for demo
  useEffect(() => {
    const timer = setInterval(() => {
      // Events would be populated by the router in real scenario
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Routing Events Timeline</h2>

      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={clearEvents}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          Clear Events
        </button>
      </div>

      <ProviderEventFeed events={events} maxItems={20} />
    </div>
  );
};

/**
 * Example 5: Complete provider routing dashboard
 */
export const CompleteProviderDashboardExample = ({ router }: { router: UIAwareProviderRouter }) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'status' | 'events'>('switch');
  const [showNotifications, setShowNotifications] = useState(true);
  const [notification, setNotification] = useState<{
    message: string;
    type: string;
  } | null>(null);

  const { currentProvider, providers, selectProvider, events, refreshStatus } = useProviderRouting({
    router,
    autoRefresh: true,
    refreshInterval: 5000,
  });

  useProviderNotifications({
    events,
    showNotifications,
    onNotification: (message, type) => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    },
  });

  return (
    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            backgroundColor:
              notification.type === 'success'
                ? '#d1fae5'
                : notification.type === 'error'
                  ? '#fee2e2'
                  : notification.type === 'warning'
                    ? '#fef3c7'
                    : '#dbeafe',
            color:
              notification.type === 'success'
                ? '#065f46'
                : notification.type === 'error'
                  ? '#991b1b'
                  : notification.type === 'warning'
                    ? '#78350f'
                    : '#0c4a6e',
            borderRadius: '4px',
            border: `1px solid ${
              notification.type === 'success'
                ? '#6ee7b7'
                : notification.type === 'error'
                  ? '#fca5a5'
                  : notification.type === 'warning'
                    ? '#fcd34d'
                    : '#93c5fd'
            }`,
            zIndex: 1000,
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Left Column */}
      <div>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 12px 0' }}>Provider Dashboard</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showNotifications}
              onChange={(e) => setShowNotifications(e.target.checked)}
            />
            <span style={{ fontSize: '13px' }}>Show Notifications</span>
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {(['switch', 'status', 'events'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '600' : '500',
                color: activeTab === tab ? '#3b82f6' : '#6b7280',
                transition: 'all 0.2s',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'switch' && (
          <ProviderSwitch
            providers={providers}
            currentProvider={currentProvider || undefined}
            onProviderSelect={selectProvider}
            showMetrics={true}
          />
        )}

        {activeTab === 'status' && (
          <div>
            <div
              style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                marginBottom: '12px',
              }}
            >
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600' }}>
                Current: {currentProvider || 'None selected'}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6b7280',
                }}
              >
                Healthy: {providers.filter((p) => p.healthy).length}/{providers.length}
              </p>
            </div>

            <button
              onClick={refreshStatus}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Refresh Status
            </button>
          </div>
        )}

        {activeTab === 'events' && <ProviderEventFeed events={events} maxItems={10} />}
      </div>

      {/* Right Column - Detailed View */}
      <div>
        <h3 style={{ margin: '0 0 16px 0' }}>Provider Details</h3>

        {providers.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No providers available</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {providers.map((provider) => (
              <div
                key={provider.name}
                style={{
                  padding: '12px',
                  border: `1px solid ${provider.healthy ? '#d1d5db' : '#fca5a5'}`,
                  borderRadius: '6px',
                  backgroundColor: provider.healthy ? '#f9fafb' : '#fef2f2',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => selectProvider(provider.name)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: provider.healthy ? '#10b981' : '#ef4444',
                    }}
                  />
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>{provider.name}</span>
                  {currentProvider === provider.name && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        padding: '2px 8px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: '600',
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  <div>
                    Success Rate:{' '}
                    <span style={{ color: '#1f2937', fontWeight: '600' }}>
                      {provider.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    Latency:{' '}
                    <span style={{ color: '#1f2937', fontWeight: '600' }}>
                      {provider.latency.toFixed(0)}ms
                    </span>
                  </div>
                  <div>
                    Weight:{' '}
                    <span style={{ color: '#1f2937', fontWeight: '600' }}>
                      {(provider.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
