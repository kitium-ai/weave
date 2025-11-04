/**
 * Generation Panel Component
 * Main component for content generation UI
 */

import React, { useState } from 'react';
import { useGeneration } from '../hooks/useGeneration.js';
import type { GenerateResponse } from '../types/index.js';

interface GenerationPanelProps {
  onSuccess?: (result: GenerateResponse) => void;
  onError?: (error: Error) => void;
}

export const GenerationPanel: React.FC<GenerationPanelProps> = ({
  onSuccess,
  onError,
}) => {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('default');
  const [useStream, setUseStream] = useState(false);

  const {
    data,
    loading,
    error,
    progress,
    streamingText,
    generate,
    generateStream,
    cancel,
    reset,
  } = useGeneration({ onSuccess, onError });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      onError?.(new Error('Please enter a prompt'));
      return;
    }

    try {
      if (useStream) {
        await generateStream(prompt, provider);
      } else {
        await generate(prompt, provider);
      }
    } catch (error) {
      // Error is handled by hook
    }
  };

  return (
    <div className="generation-panel">
      <div className="section">
        <h2>Content Generation</h2>

        {/* Provider Selection */}
        <div className="form-group">
          <label htmlFor="provider">AI Provider</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={loading}
          >
            <option value="default">Default</option>
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="anthropic">Anthropic (Claude 3)</option>
            <option value="google">Google (Gemini)</option>
          </select>
        </div>

        {/* Streaming Toggle */}
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="useStream"
            checked={useStream}
            onChange={(e) => setUseStream(e.target.checked)}
            disabled={loading}
          />
          <label htmlFor="useStream">Use streaming responses</label>
        </div>

        {/* Prompt Input */}
        <div className="form-group">
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            rows={5}
            disabled={loading}
            maxLength={2000}
          />
          <p className="help-text">
            {prompt.length}/2000 characters
          </p>
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="btn-primary"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
          {loading && (
            <button
              onClick={cancel}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
          {(data || error) && (
            <button
              onClick={reset}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {loading && progress > 0 && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-box">
            <h3>Error</h3>
            <p>{error.message}</p>
          </div>
        )}

        {/* Streaming Output */}
        {useStream && streamingText && (
          <div className="output-box">
            <h3>Streaming Response</h3>
            <p>{streamingText}</p>
          </div>
        )}

        {/* Generated Result */}
        {data && !useStream && (
          <div className="result-box">
            <div className="result-header">
              <h3>Generated Content</h3>
              <div className="result-meta">
                <span className="badge">{data.provider}</span>
                <span className="badge">{data.model}</span>
                <span className="badge cost">${data.cost.toFixed(4)}</span>
              </div>
            </div>

            <div className="result-content">
              <p>{data.text}</p>
            </div>

            <div className="result-stats">
              <div className="stat">
                <span className="label">Tokens Used</span>
                <span className="value">{data.tokensUsed}</span>
              </div>
              <div className="stat">
                <span className="label">Cost</span>
                <span className="value">${data.cost.toFixed(4)}</span>
              </div>
              <div className="stat">
                <span className="label">Generated</span>
                <span className="value">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="result-actions">
              <button className="btn-secondary">Copy to Clipboard</button>
              <button className="btn-secondary">Download as Text</button>
              <button className="btn-secondary">Share</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .generation-panel {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .section {
          background: #f9fafb;
          border-radius: 8px;
          padding: 2rem;
          border: 1px solid #e5e7eb;
        }

        .section h2 {
          margin-top: 0;
          color: #1f2937;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }

        .form-group textarea {
          resize: vertical;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .form-group.checkbox {
          display: flex;
          align-items: center;
        }

        .form-group.checkbox input {
          margin-right: 0.5rem;
        }

        .form-group.checkbox label {
          margin-bottom: 0;
        }

        .help-text {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .progress-bar {
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s;
        }

        .error-box {
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 1rem;
          border-radius: 4px;
          margin-top: 1rem;
        }

        .error-box h3 {
          margin: 0 0 0.5rem 0;
        }

        .output-box,
        .result-box {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 1rem;
        }

        .result-header h3 {
          margin: 0;
        }

        .result-meta {
          display: flex;
          gap: 0.5rem;
        }

        .badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #e0e7ff;
          color: #3730a3;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .badge.cost {
          background: #dbeafe;
          color: #0c4a6e;
        }

        .result-content {
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .result-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin: 1rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 4px;
        }

        .stat {
          text-align: center;
        }

        .stat .label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .stat .value {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .result-actions {
          display: flex;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
};
