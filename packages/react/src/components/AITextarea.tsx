/**
 * AITextarea Component
 * Smart textarea with AI suggestions and auto-expand
 */

import React, { useState, useRef, useEffect } from 'react';
import type { AITextareaProps } from '../types/components.js';
import './AITextarea.css';

export const AITextarea: React.FC<AITextareaProps> = ({
  value = '',
  onChange,
  onAISuggest,
  placeholder,
  minRows = 4,
  maxRows = 10,
  showSuggestions = true,
  className,
  autoExpand = true
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [rows, setRows] = useState(minRows);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoExpand && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newRows = Math.min(
        maxRows,
        Math.max(minRows, Math.ceil((textarea.scrollHeight - 20) / 20))
      );
      setRows(newRows);
    }
  }, [localValue, minRows, maxRows, autoExpand]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleAISuggest = async () => {
    if (!localValue.trim() || !onAISuggest) return;

    setLoading(true);
    try {
      await onAISuggest(localValue);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`weave-textarea ${className || ''}`}>
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className="weave-textarea__input"
        aria-label="Text input with AI suggestions"
      />

      {showSuggestions && onAISuggest && (
        <button
          onClick={handleAISuggest}
          disabled={!localValue.trim() || loading}
          className="weave-textarea__suggest-btn"
          aria-label="Get AI suggestion"
        >
          {loading ? 'Suggesting...' : '✨ Suggest'}
        </button>
      )}
    </div>
  );
};

AITextarea.displayName = 'AITextarea';
