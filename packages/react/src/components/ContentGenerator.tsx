/**
 * ContentGenerator Component
 * Generate content with live preview
 */

import React, { useState } from 'react';
import type { ContentGeneratorProps } from '../types/components.js';
import './ContentGenerator.css';

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  type = 'custom',
  onGenerate,
  template,
  parameters = {},
  showPreview = true,
  className,
}) => {
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<Record<string, string>>(parameters);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const content = template || `Generate ${type} content with: ${JSON.stringify(params)}`;
      await onGenerate(content);
      setGeneratedContent(content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`weave-content-generator ${className || ''}`}>
      <div className="weave-content-generator__controls">
        <h3>Generate {type}</h3>
        {Object.entries(params).map(([key, value]) => (
          <div key={key} className="weave-content-generator__param">
            <label>{key}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setParams({ ...params, [key]: e.target.value })}
              placeholder={key}
            />
          </div>
        ))}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="weave-content-generator__btn"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {showPreview && generatedContent && (
        <div className="weave-content-generator__preview">
          <h4>Preview</h4>
          <p>{generatedContent}</p>
        </div>
      )}
    </div>
  );
};

ContentGenerator.displayName = 'ContentGenerator';
