/**
 * AIForm Component
 * AI-powered form with auto-fill capability
 */

import React, { useState } from 'react';
import type { AIFormProps } from '../types/components.js';
import './AIForm.css';

export const AIForm: React.FC<AIFormProps> = ({
  schema,
  onSubmit,
  onAIFill,
  showAIFill = true,
  className,
  submitText = 'Submit',
}) => {
  const [values, setValues] = useState<Record<string, unknown>>(
    schema.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {})
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (fieldName: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleAIFill = async () => {
    setLoading(true);
    try {
      for (const field of schema) {
        await onAIFill?.(field.name, values[field.name]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className={`weave-form ${className || ''}`}>
      {showAIFill && onAIFill && (
        <button
          type="button"
          onClick={handleAIFill}
          disabled={loading}
          className="weave-form__ai-fill"
        >
          {loading ? '✨ Auto-filling...' : '✨ Auto-fill with AI'}
        </button>
      )}

      <div className="weave-form__fields">
        {schema.map((field) => (
          <div key={field.name} className="weave-form__field">
            <label htmlFor={field.name} className="weave-form__label">
              {field.label}
              {field.required && <span className="weave-form__required">*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                value={(values[field.name] as string) || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="weave-form__input"
                required={field.required}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                value={(values[field.name] as string) || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="weave-form__input"
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === 'checkbox' ? (
              <input
                id={field.name}
                type="checkbox"
                checked={(values[field.name] as boolean) || false}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="weave-form__checkbox"
              />
            ) : (
              <input
                id={field.name}
                type={field.type}
                value={(values[field.name] as string) || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="weave-form__input"
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>

      <button type="submit" className="weave-form__submit" disabled={loading}>
        {submitText}
      </button>
    </form>
  );
};

AIForm.displayName = 'AIForm';
