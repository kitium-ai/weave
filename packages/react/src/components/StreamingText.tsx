/**
 * StreamingText Component
 * Real-time text display with typewriter and streaming effects
 *
 * Features:
 * - Smooth character-by-character animation
 * - Configurable speed (slow, normal, fast)
 * - Typewriter effect option
 * - Completion callback
 * - Accessible with ARIA attributes
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { StreamingTextProps } from '../types/components.js';
import './StreamingText.css';

export const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  speed = 'normal',
  onComplete,
  className,
  style,
  typewriter = true,
  charsPerSecond = 50
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // Calculate delay based on speed setting
  const getDelay = useCallback(() => {
    switch (speed) {
      case 'slow':
        return 1000 / (charsPerSecond / 2);
      case 'fast':
        return 1000 / (charsPerSecond * 1.5);
      case 'normal':
      default:
        return 1000 / charsPerSecond;
    }
  }, [speed, charsPerSecond]);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    if (!typewriter) {
      // No animation, display immediately
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // Streaming animation
    let index = 0;
    const delay = getDelay();
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, delay);

    return () => clearInterval(timer);
  }, [text, typewriter, charsPerSecond, onComplete, getDelay]);

  return (
    <div
      className={`weave-streaming-text ${className || ''}`}
      style={style}
      role="status"
      aria-live="polite"
      aria-label={isComplete ? 'Text display completed' : 'Text is streaming'}
    >
      <span className="weave-streaming-text__content">{displayedText}</span>
      {!isComplete && typewriter && (
        <span className="weave-streaming-text__cursor" aria-hidden="true">
          ▊
        </span>
      )}
    </div>
  );
};

StreamingText.displayName = 'StreamingText';
