/**
 * CacheFeedback Component
 * UI feedback for cache hits and cost savings
 */

import React, { useState, useEffect } from 'react';
import type { CacheFeedbackEvent } from '../hooks/useCache.js';
import './CacheFeedback.css';

/**
 * Cache feedback props
 */
export interface CacheFeedbackProps {
  event: CacheFeedbackEvent | null;
  autoHide?: boolean;
  duration?: number;
  position?: 'top' | 'bottom' | 'top-right' | 'bottom-right';
  className?: string;
}

/**
 * Cache feedback component
 */
export const CacheFeedback: React.FC<CacheFeedbackProps> = ({
  event,
  autoHide = true,
  duration = 3000,
  position = 'top-right',
  className,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) {
      return;
    }

    setVisible(true);

    if (!autoHide) {
      return;
    }

    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [event, autoHide, duration]);

  if (!visible || !event) {
    return null;
  }

  const icons = {
    hit: '✅',
    miss: '⚠️',
    stored: '💾',
  };

  const colors = {
    hit: 'cache-feedback--hit',
    miss: 'cache-feedback--miss',
    stored: 'cache-feedback--stored',
  };

  return (
    <div
      className={`cache-feedback cache-feedback--${position} ${colors[event.type]} ${
        className || ''
      }`}
    >
      <div className="cache-feedback__content">
        <span className="cache-feedback__icon">{icons[event.type]}</span>
        <div className="cache-feedback__text">
          <p className="cache-feedback__message">{event.message}</p>
          {event.savings && (
            <div className="cache-feedback__savings">
              <span className="cache-feedback__saving">
                💰 ${event.savings.cost.toFixed(4)}
              </span>
              <span className="cache-feedback__saving">
                ⚡ {event.savings.latency.toFixed(0)}ms
              </span>
              <span className="cache-feedback__saving">
                🎯 {event.savings.tokens} tokens
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setVisible(false)}
          className="cache-feedback__close"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

CacheFeedback.displayName = 'CacheFeedback';

/**
 * Cache feedback history component
 */
export interface CacheFeedbackHistoryProps {
  events: CacheFeedbackEvent[];
  maxItems?: number;
  className?: string;
}

export const CacheFeedbackHistory: React.FC<CacheFeedbackHistoryProps> = ({
  events,
  maxItems = 10,
  className,
}) => {
  const displayedEvents = events.slice(-maxItems);

  const icons = {
    hit: '✅',
    miss: '⚠️',
    stored: '💾',
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className={`cache-history ${className || ''}`}>
      <h3 className="cache-history__title">Cache History</h3>
      <div className="cache-history__list">
        {displayedEvents.length === 0 ? (
          <p className="cache-history__empty">No cache events yet</p>
        ) : (
          displayedEvents.map((event, index) => (
            <div
              key={index}
              className={`cache-history__item cache-history__item--${event.type}`}
            >
              <div className="cache-history__item-header">
                <span className="cache-history__icon">{icons[event.type]}</span>
                <span className="cache-history__type">{getTypeLabel(event.type)}</span>
                <span className="cache-history__time">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="cache-history__message">{event.message}</p>
              {event.savings && (
                <div className="cache-history__savings">
                  <span>💰 ${event.savings.cost.toFixed(4)}</span>
                  <span>⚡ {event.savings.latency.toFixed(0)}ms</span>
                  <span>🎯 {event.savings.tokens} tokens</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

CacheFeedbackHistory.displayName = 'CacheFeedbackHistory';

/**
 * Cache badge component - compact cache status indicator
 */
export interface CacheBadgeProps {
  cached?: boolean;
  savings?: {
    cost: number;
    latency: number;
    tokens: number;
  };
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const CacheBadge: React.FC<CacheBadgeProps> = ({
  cached = false,
  savings,
  size = 'medium',
  className,
}) => {
  return (
    <div className={`cache-badge cache-badge--${size} ${className || ''}`}>
      {cached ? (
        <div className="cache-badge__cached">
          <span className="cache-badge__icon">✅</span>
          <span className="cache-badge__label">Cached</span>
          {savings && (
            <div className="cache-badge__tooltip">
              <p>💰 Cost: ${savings.cost.toFixed(4)}</p>
              <p>⚡ Latency: {savings.latency.toFixed(0)}ms</p>
              <p>🎯 Tokens: {savings.tokens}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="cache-badge__fresh">
          <span className="cache-badge__icon">✨</span>
          <span className="cache-badge__label">Fresh</span>
        </div>
      )}
    </div>
  );
};

CacheBadge.displayName = 'CacheBadge';
