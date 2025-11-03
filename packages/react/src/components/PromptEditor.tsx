/**
 * PromptEditor Component
 * UI for editing prompts, managing variables, and testing templates
 */

import React, { useState, useCallback, useMemo } from 'react';
import type {
  PromptVariable,
  PromptEditorProps,
  PromptTestResult,
} from '../types/prompt-template.js';
import './PromptEditor.css';

/**
 * PromptEditor Component
 * Provides a complete UI for prompt template management and testing
 *
 * @example
 * ```tsx
 * const { currentTemplate, render, testRender } = usePromptTemplate({
 *   name: 'my-prompt',
 *   template: 'Hello {{name}}, tell me about {{topic}}',
 *   variables: [
 *     { name: 'name', required: true, placeholder: 'Your name' },
 *     { name: 'topic', required: true, placeholder: 'Any topic' }
 *   ]
 * });
 *
 * <PromptEditor
 *   template={currentTemplate}
 *   variables={currentTemplate.variables}
 *   onChange={(template) => setTemplate(template)}
 *   onTest={async (variables) => testRender(variables)}
 *   testData={{ name: 'Alice', topic: 'AI' }}
 *   showMetrics={true}
 * />
 * ```
 */
export const PromptEditor: React.FC<PromptEditorProps> = ({
  template,
  variables: variablesProp,
  onChange,
  onTest,
  onSave,
  editable = true,
  showVariables = true,
  showMetrics = false,
  showHistory = false,
  variants,
  onVariantChange,
  className,
  testData = {},
}) => {
  const [templateText, setTemplateText] = useState<string>(
    typeof template === 'string' ? template : template.template
  );

  const [testInput, setTestInput] = useState<Record<string, unknown>>(testData || {});
  const [testResult, setTestResult] = useState<PromptTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants?.[0]?.id || null
  );

  // Extract variables from template or use provided definition
  const variables: PromptVariable[] = useMemo(() => {
    if (Array.isArray(variablesProp)) {
      return variablesProp;
    }
    if (typeof variablesProp === 'object' && variablesProp !== null) {
      return Object.entries(variablesProp).map(([name, value]) => ({
        name,
        type: typeof value as 'string' | 'number' | 'boolean' | 'object',
      }));
    }
    return [];
  }, [variablesProp]);

  // Handle template changes
  const handleTemplateChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newTemplate = e.target.value;
      setTemplateText(newTemplate);
      onChange?.(newTemplate);
    },
    [onChange]
  );

  // Handle test input changes
  const handleVariableChange = useCallback((name: string, value: string) => {
    setTestInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Run test
  const handleTest = useCallback(async () => {
    if (!onTest) {
      return;
    }

    setIsLoading(true);
    try {
      const result: PromptTestResult = await onTest(testInput);
      setTestResult(result);
    } catch (error) {
      const errorResult: PromptTestResult = {
        success: false,
        renderedPrompt: '',
        variables: testInput,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setTestResult(errorResult);
    } finally {
      setIsLoading(false);
    }
  }, [onTest, testInput]);

  // Handle variant selection
  const handleVariantSelect = useCallback(
    (variantId: string) => {
      setSelectedVariantId(variantId);
      onVariantChange?.(variantId);
    },
    [onVariantChange]
  );

  // Handle save
  const handleSave = useCallback(() => {
    onSave?.(templateText);
  }, [onSave, templateText]);

  return (
    <div className={`prompt-editor ${className || ''}`}>
      {/* Header */}
      <div className="prompt-editor__header">
        <h2 className="prompt-editor__title">Prompt Editor</h2>
        <div className="prompt-editor__actions">
          {editable && onSave && (
            <button
              onClick={handleSave}
              className="prompt-editor__btn prompt-editor__btn--save"
              aria-label="Save prompt template"
            >
              💾 Save
            </button>
          )}
          {onTest && (
            <button
              onClick={handleTest}
              disabled={isLoading}
              className="prompt-editor__btn prompt-editor__btn--test"
              aria-label="Test prompt rendering"
            >
              {isLoading ? '⏳ Testing...' : '▶️ Test'}
            </button>
          )}
        </div>
      </div>

      {/* Variant selector */}
      {variants && variants.length > 0 && (
        <div className="prompt-editor__section">
          <label className="prompt-editor__label">Variants (A/B Testing)</label>
          <div className="prompt-editor__variants">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantSelect(variant.id)}
                className={`prompt-editor__variant ${
                  selectedVariantId === variant.id ? 'prompt-editor__variant--active' : ''
                }`}
                aria-label={`Select variant ${variant.name || variant.id}`}
              >
                {variant.name || variant.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template editor */}
      <div className="prompt-editor__section">
        <label htmlFor="prompt-template" className="prompt-editor__label">
          Template
        </label>
        <textarea
          id="prompt-template"
          value={templateText}
          onChange={handleTemplateChange}
          disabled={!editable}
          placeholder="Enter your prompt template here. Use {{variableName}} for variables."
          className="prompt-editor__template"
          rows={6}
          aria-label="Prompt template"
        />
        <p className="prompt-editor__hint">
          Use {'{{'} {'}}'} syntax for variables, e.g., {'{{'} topic {'}}'} → Replace with actual
          value during testing
        </p>
      </div>

      {/* Variables section */}
      {showVariables && variables.length > 0 && (
        <div className="prompt-editor__section">
          <label className="prompt-editor__label">Variables</label>
          <div className="prompt-editor__variables">
            {variables.map((variable) => (
              <div key={variable.name} className="prompt-editor__variable">
                <label htmlFor={`var-${variable.name}`} className="prompt-editor__var-label">
                  <span className="prompt-editor__var-name">{variable.name}</span>
                  {variable.required && <span className="prompt-editor__required">*</span>}
                  {variable.description && (
                    <span className="prompt-editor__var-desc">{variable.description}</span>
                  )}
                </label>
                <input
                  id={`var-${variable.name}`}
                  type="text"
                  value={String(testInput[variable.name] || '')}
                  onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  placeholder={variable.placeholder || `Enter ${variable.name}`}
                  className="prompt-editor__var-input"
                  aria-label={`Value for ${variable.name}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test result section */}
      {testResult && (
        <div className="prompt-editor__section">
          <label className="prompt-editor__label">Test Result</label>
          {testResult.success ? (
            <div className="prompt-editor__result">
              <div className="prompt-editor__result-success">✅ Success</div>
              <div className="prompt-editor__rendered">
                <h4>Rendered Prompt:</h4>
                <pre className="prompt-editor__output">{testResult.renderedPrompt}</pre>
              </div>
              {testResult.duration > 0 && (
                <div className="prompt-editor__duration">
                  ⏱️ Duration: {testResult.duration.toFixed(2)}ms
                </div>
              )}
            </div>
          ) : (
            <div className="prompt-editor__result-error">
              <div className="prompt-editor__error-label">❌ Error</div>
              <pre className="prompt-editor__error-message">
                {testResult.error || 'Unknown error occurred'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* History section (placeholder for future enhancement) */}
      {showHistory && (
        <div className="prompt-editor__section">
          <label className="prompt-editor__label">History</label>
          <p className="prompt-editor__info">
            History tracking is available via the usePromptTemplate hook
          </p>
        </div>
      )}

      {/* Metrics section (placeholder for future enhancement) */}
      {showMetrics && (
        <div className="prompt-editor__section">
          <label className="prompt-editor__label">Metrics</label>
          <p className="prompt-editor__info">
            Metrics tracking is available via the usePromptTemplate hook with trackMetrics: true
          </p>
        </div>
      )}
    </div>
  );
};

PromptEditor.displayName = 'PromptEditor';
