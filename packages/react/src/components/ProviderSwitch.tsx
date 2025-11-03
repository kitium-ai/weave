/**
 * ProviderSwitch Component
 * UI for selecting and monitoring AI providers with fallback routing
 */

import React, { useState, useEffect } from 'react';
import type { ProviderStatus, ProviderRoutingEvent } from '@weaveai/core';
import './ProviderSwitch.css';

/**
 * Provider switch props
 */
export interface ProviderSwitchProps {
  providers: ProviderStatus[];
  currentProvider?: string;
  onProviderSelect?: (provider: string) => void;
  showMetrics?: boolean;
  className?: string;
}

/**
 * Provider status indicator
 */
export interface ProviderStatusIndicatorProps {
  status: ProviderStatus;
  isActive?: boolean;
  onSelect?: (provider: string) => void;
}

/**
 * Provider switch component
 */
export const ProviderSwitch: React.FC<ProviderSwitchProps> = ({
  providers,
  currentProvider,
  onProviderSelect,
  showMetrics = true,
  className,
}) => {
  const getHealthColor = (healthy: boolean) => {
    return healthy ? '#10b981' : '#ef4444';
  };

  const getSuccessColor = (successRate: number) => {
    if (successRate >= 95) return '#10b981';
    if (successRate >= 80) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`provider-switch ${className || ''}`}>
      <h3 className="provider-switch__title">AI Providers</h3>
      <div className="provider-switch__grid">
        {providers.map((provider) => (
          <div
            key={provider.name}
            className={`provider-switch__item ${
              currentProvider === provider.name
                ? 'provider-switch__item--active'
                : ''
            } ${provider.healthy ? '' : 'provider-switch__item--offline'}`}
            onClick={() => onProviderSelect?.(provider.name)}
          >
            <div className="provider-switch__header">
              <div className="provider-switch__name">{provider.name}</div>
              <div
                className="provider-switch__health"
                style={{
                  backgroundColor: getHealthColor(provider.healthy),
                }}
                title={provider.healthy ? 'Healthy' : 'Offline'}
              />
            </div>

            {showMetrics && (
              <div className="provider-switch__metrics">
                <div className="provider-switch__metric">
                  <span className="provider-switch__label">Success Rate</span>
                  <div className="provider-switch__bar">
                    <div
                      className="provider-switch__bar-fill"
                      style={{
                        width: `${provider.successRate}%`,
                        backgroundColor: getSuccessColor(provider.successRate),
                      }}
                    />
                  </div>
                  <span className="provider-switch__value">
                    {provider.successRate.toFixed(1)}%
                  </span>
                </div>

                <div className="provider-switch__metric">
                  <span className="provider-switch__label">Latency</span>
                  <span className="provider-switch__value">
                    {provider.latency.toFixed(0)}ms
                  </span>
                </div>

                <div className="provider-switch__metric">
                  <span className="provider-switch__label">Weight</span>
                  <span className="provider-switch__value">
                    {(provider.weight * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

ProviderSwitch.displayName = 'ProviderSwitch';

/**
 * Provider status indicator component
 */
export const ProviderStatusIndicator: React.FC<ProviderStatusIndicatorProps> = ({
  status,
  isActive = false,
  onSelect,
}) => {
  const getStatusBgColor = (healthy: boolean) => {
    return healthy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
  };

  return (
    <button
      onClick={() => onSelect?.(status.name)}
      className={`provider-status-indicator ${
        isActive ? 'provider-status-indicator--active' : ''
      }`}
      style={{
        backgroundColor: getStatusBgColor(status.healthy),
      }}
    >
      <div className="provider-status-indicator__dot" />
      <span className="provider-status-indicator__name">{status.name}</span>
      {status.healthy ? (
        <span className="provider-status-indicator__badge">✓</span>
      ) : (
        <span className="provider-status-indicator__badge provider-status-indicator__badge--error">
          ✕
        </span>
      )}
    </button>
  );
};

ProviderStatusIndicator.displayName = 'ProviderStatusIndicator';

/**
 * Provider event feed component
 */
export interface ProviderEventFeedProps {
  events: ProviderRoutingEvent[];
  maxItems?: number;
  className?: string;
}

export const ProviderEventFeed: React.FC<ProviderEventFeedProps> = ({
  events,
  maxItems = 10,
  className,
}) => {
  const displayedEvents = events.slice(-maxItems);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'switch':
        return '🔄';
      case 'attempt':
        return '📤';
      case 'success':
        return '✅';
      case 'failure':
        return '❌';
      case 'fallback':
        return '⚠️';
      default:
        return '•';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'failure':
        return 'error';
      case 'fallback':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div className={`provider-event-feed ${className || ''}`}>
      <h4 className="provider-event-feed__title">Routing Events</h4>
      <div className="provider-event-feed__list">
        {displayedEvents.length === 0 ? (
          <p className="provider-event-feed__empty">No events yet</p>
        ) : (
          displayedEvents.map((event, index) => (
            <div
              key={index}
              className={`provider-event-feed__item provider-event-feed__item--${getEventColor(
                event.type
              )}`}
            >
              <span className="provider-event-feed__icon">
                {getEventIcon(event.type)}
              </span>
              <div className="provider-event-feed__content">
                <div className="provider-event-feed__header">
                  <span className="provider-event-feed__type">
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                  {event.from && (
                    <span className="provider-event-feed__arrow">
                      {event.from} → {event.to}
                    </span>
                  )}
                  {!event.from && (
                    <span className="provider-event-feed__provider">
                      {event.to}
                    </span>
                  )}
                  <span className="provider-event-feed__time">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {event.reason && (
                  <p className="provider-event-feed__reason">{event.reason}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

ProviderEventFeed.displayName = 'ProviderEventFeed';

/**
 * Provider selector dropdown
 */
export interface ProviderSelectorProps {
  providers: ProviderStatus[];
  currentProvider?: string;
  onSelect?: (provider: string) => void;
  compact?: boolean;
  className?: string;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  providers,
  currentProvider,
  onSelect,
  compact = false,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const current = providers.find((p) => p.name === currentProvider);

  return (
    <div
      className={`provider-selector ${compact ? 'provider-selector--compact' : ''} ${
        className || ''
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="provider-selector__trigger"
      >
        <span className="provider-selector__current">
          {current?.name || 'Select Provider'}
        </span>
        <span className="provider-selector__arrow">▼</span>
      </button>

      {open && (
        <div className="provider-selector__dropdown">
          {providers.map((provider) => (
            <button
              key={provider.name}
              onClick={() => {
                onSelect?.(provider.name);
                setOpen(false);
              }}
              className={`provider-selector__option ${
                provider.name === currentProvider
                  ? 'provider-selector__option--active'
                  : ''
              } ${provider.healthy ? '' : 'provider-selector__option--disabled'}`}
              disabled={!provider.healthy}
            >
              <span className="provider-selector__dot" />
              <span className="provider-selector__label">{provider.name}</span>
              <span className="provider-selector__status">
                {provider.healthy ? '✓' : '✕'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

ProviderSelector.displayName = 'ProviderSelector';
