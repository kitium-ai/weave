/**
 * AISearch Component
 * Semantic search with results display
 */

import React, { useState } from 'react';
import type { AISearchProps } from '../types/components.js';
import './AISearch.css';

export const AISearch: React.FC<AISearchProps> = ({
  results = [],
  placeholder = 'Search...',
  onSearch,
  showScore = true,
  onSelectResult,
  className,
  loading = false,
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await onSearch(query);
    }
  };

  return (
    <div className={`weave-search ${className || ''}`}>
      <form onSubmit={handleSearch} className="weave-search__form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="weave-search__input"
          aria-label="Search input"
        />
        <button type="submit" disabled={loading || !query.trim()} className="weave-search__btn">
          {loading ? '⏳ Searching...' : '🔍 Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div className="weave-search__results" role="region" aria-label="Search results">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => onSelectResult?.(result)}
              className="weave-search__result"
            >
              <p className="weave-search__result-text">{result.document}</p>
              {showScore && (
                <span className="weave-search__result-score">
                  {(result.similarity * 100).toFixed(0)}%
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <p className="weave-search__empty">No results found</p>
      )}
    </div>
  );
};

AISearch.displayName = 'AISearch';
