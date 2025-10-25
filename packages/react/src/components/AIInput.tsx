/**
 * AIInput Component
 * Auto-complete input with dropdown suggestions
 */

import React, { useState, useRef, useEffect } from 'react';
import type { AIInputProps } from '../types/components.js';
import './AIInput.css';

export const AIInput: React.FC<AIInputProps> = ({
  value = '',
  onChange,
  suggestions = [],
  onSelectSuggestion,
  placeholder,
  showDropdown = true,
  className,
  maxSuggestions = 5
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (localValue && showDropdown) {
      const filtered = suggestions
        .filter((s) => s.toLowerCase().includes(localValue.toLowerCase()))
        .slice(0, maxSuggestions);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [localValue, suggestions, maxSuggestions, showDropdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setLocalValue(suggestion);
    onChange?.(suggestion);
    onSelectSuggestion?.(suggestion);
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`weave-input ${className || ''}`}>
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
        placeholder={placeholder}
        className="weave-input__field"
        aria-label="Input with suggestions"
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
      />

      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="weave-input__suggestions" role="listbox">
          {filteredSuggestions.map((suggestion, index) => (
            <li key={index} role="option">
              <button
                onClick={() => handleSelectSuggestion(suggestion)}
                className="weave-input__suggestion-item"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

AIInput.displayName = 'AIInput';
