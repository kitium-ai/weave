/**
 * useAIForm Hook
 * AI-powered form handling with auto-fill and validation
 *
 * Features:
 * - State management for form values
 * - Field-level validation
 * - AI auto-fill integration
 * - React Hook Form compatibility
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseAIFormOptions {
  initialValues?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
  onAIFill?: (field: string, value: unknown) => Promise<unknown>;
  validate?: (values: Record<string, unknown>) => Record<string, string>;
}

export interface UseAIFormReturn {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleAIFill: () => Promise<void>;
  setValues: (values: Record<string, unknown>) => void;
  setFieldValue: (field: string, value: unknown) => void;
  resetForm: () => void;
  getFieldProps: (field: string) => {
    name: string;
    value: unknown;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  };
}

/**
 * useAIForm Hook
 * Manages form state with AI enhancement capabilities
 */
export function useAIForm(options: UseAIFormOptions = {}): UseAIFormReturn {
  const { initialValues = {}, onSubmit, onAIFill, validate } = options;

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateForm = useCallback(
    (vals: Record<string, unknown>) => {
      if (!validate) {
        return {};
      }
      return validate(vals);
    },
    [validate]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, type, value } = e.target;
      const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: newValue,
      }));

      // Clear error for this field when user starts typing
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({
        ...prev,
        [name]: true,
      }));

      // Validate on blur
      const fieldErrors = validateForm(values);
      if (fieldErrors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: fieldErrors[name],
        }));
      }
    },
    [validateForm, values]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setIsValidating(true);
      const formErrors = validateForm(values);
      setErrors(formErrors);
      setIsValidating(false);

      if (Object.keys(formErrors).length > 0) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onSubmit?.(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit]
  );

  const handleAIFill = useCallback(async () => {
    if (!onAIFill) {
      return;
    }

    setIsValidating(true);
    try {
      const newValues: Record<string, unknown> = { ...values };
      for (const [field, value] of Object.entries(values)) {
        const aiValue = await onAIFill(field, value);
        if (aiValue !== undefined) {
          newValues[field] = aiValue;
        }
      }
      setValues(newValues);

      // Validate after AI fill
      const formErrors = validateForm(newValues);
      setErrors(formErrors);
    } catch (error) {
      console.error('AI fill error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [values, onAIFill, validateForm]);

  const setFieldValue = useCallback((field: string, value: unknown) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const getFieldProps = useCallback(
    (field: string) => ({
      name: field,
      value: values[field] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    [values, handleChange, handleBlur]
  );

  return useMemo(
    () => ({
      values,
      errors,
      touched,
      isSubmitting,
      isValidating,
      handleChange,
      handleBlur,
      handleSubmit,
      handleAIFill,
      setValues,
      setFieldValue,
      resetForm,
      getFieldProps,
    }),
    [
      values,
      errors,
      touched,
      isSubmitting,
      isValidating,
      handleChange,
      handleBlur,
      handleSubmit,
      handleAIFill,
      setFieldValue,
      resetForm,
      getFieldProps,
    ]
  );
}
