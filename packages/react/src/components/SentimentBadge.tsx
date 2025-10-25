/**
 * SentimentBadge Component
 * Display sentiment analysis results
 */

import React from 'react';
import type { SentimentBadgeProps } from '../types/components.js';
import './SentimentBadge.css';

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({
  sentiment,
  size = 'medium',
  showPercentage = true,
  showLabel = true,
  className,
  colorMap = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280',
  },
}) => {
  const dominantSentiment = Math.max(sentiment.positive, sentiment.negative, sentiment.neutral);

  let type: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (dominantSentiment === sentiment.positive) {
    type = 'positive';
  } else if (dominantSentiment === sentiment.negative) {
    type = 'negative';
  }

  const percentage = Math.round(dominantSentiment * 100);

  return (
    <div
      className={`weave-sentiment weave-sentiment--${size} weave-sentiment--${type} ${
        className || ''
      }`}
      role="region"
      aria-label={`Sentiment analysis: ${type}`}
      style={
        {
          '--sentiment-color': colorMap[type],
        } as React.CSSProperties & { '--sentiment-color': string }
      }
    >
      <div className="weave-sentiment__indicator">
        {type === 'positive' && '😊'}
        {type === 'negative' && '😞'}
        {type === 'neutral' && '😐'}
      </div>

      <div className="weave-sentiment__content">
        {showLabel && <span className="weave-sentiment__label">{type.toUpperCase()}</span>}
        {showPercentage && <span className="weave-sentiment__percentage">{percentage}%</span>}
      </div>

      <div className="weave-sentiment__details">
        <small>
          Pos: {(sentiment.positive * 100).toFixed(0)}% | Neg:{' '}
          {(sentiment.negative * 100).toFixed(0)}% | Neutral: {(sentiment.neutral * 100).toFixed(0)}
          %
        </small>
      </div>
    </div>
  );
};

SentimentBadge.displayName = 'SentimentBadge';
