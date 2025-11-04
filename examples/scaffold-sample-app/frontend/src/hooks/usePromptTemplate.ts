/**
 * usePromptTemplate Hook
 * React hook for managing prompt templates with variants and A/B testing
 */

import { useState, useCallback, useEffect } from 'react';
import type { Prompt, PromptVariant, PromptMetrics, PromptTestResult } from '../types/index.js';

interface UsePromptTemplateOptions {
  promptId?: string;
  name?: string;
  template?: string;
  variables?: Array<{ name: string; required?: boolean; description?: string }>;
  trackMetrics?: boolean;
  onError?: (error: Error) => void;
}

interface UsePromptTemplateState {
  prompt: Prompt | null;
  variants: PromptVariant[];
  currentVariant: PromptVariant | null;
  metrics: PromptMetrics | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for managing prompt templates
 */
export function usePromptTemplate(options: UsePromptTemplateOptions = {}) {
  const [state, setState] = useState<UsePromptTemplateState>({
    prompt: null,
    variants: [],
    currentVariant: null,
    metrics: null,
    loading: false,
    error: null,
  });

  const [variables, setVariables] = useState<Record<string, unknown>>({});

  /**
   * Load prompt from API
   */
  useEffect(() => {
    if (options.promptId) {
      loadPrompt(options.promptId);
    }
  }, [options.promptId]);

  /**
   * Load prompt details
   */
  const loadPrompt = useCallback(async (promptId: string) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const response = await fetch(`/api/prompts/${promptId}`);
      if (!response.ok) throw new Error('Failed to load prompt');

      const { data } = await response.json();
      setState(prev => ({
        ...prev,
        prompt: data,
        loading: false,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({
        ...prev,
        error: err,
        loading: false,
      }));
      options.onError?.(err);
    }
  }, [options]);

  /**
   * Load variants for current prompt
   */
  const loadVariants = useCallback(async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}/variants`);
      if (!response.ok) throw new Error('Failed to load variants');

      const { data } = await response.json();
      setState(prev => ({
        ...prev,
        variants: data,
        currentVariant: data[0] || null,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      options.onError?.(err);
    }
  }, [options]);

  /**
   * Update variable value
   */
  const updateVariable = useCallback((name: string, value: unknown) => {
    setVariables(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /**
   * Render template with variables
   */
  const render = useCallback((customVariables?: Record<string, unknown>) => {
    const templateToUse = state.currentVariant?.template || state.prompt?.template || '';
    const varsToUse = customVariables || variables;

    let rendered = templateToUse;
    Object.entries(varsToUse).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(
        new RegExp(placeholder, 'g'),
        String(value)
      );
    });

    return rendered;
  }, [state.currentVariant, state.prompt, variables]);

  /**
   * Test prompt rendering
   */
  const testRender = useCallback(
    async (customVariables?: Record<string, unknown>): Promise<PromptTestResult> => {
      const templateToUse = state.currentVariant?.template || state.prompt?.template;
      const varsToUse = customVariables || variables;

      if (!templateToUse) {
        throw new Error('No template available');
      }

      try {
        const response = await fetch('/api/generate/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            promptId: state.prompt?.id,
            template: templateToUse,
            variables: varsToUse,
          }),
        });

        if (!response.ok) throw new Error('Test failed');

        const { data } = await response.json();
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        throw err;
      }
    },
    [state.currentVariant, state.prompt, variables, options]
  );

  /**
   * Set current variant
   */
  const setVariant = useCallback((variantId: string) => {
    const variant = state.variants.find(v => v.id === variantId);
    setState(prev => ({
      ...prev,
      currentVariant: variant || null,
    }));
  }, [state.variants]);

  /**
   * Add new variant
   */
  const addVariant = useCallback(
    async (template: string, name?: string) => {
      if (!state.prompt?.id) throw new Error('No prompt loaded');

      try {
        const response = await fetch(
          `/api/prompts/${state.prompt.id}/variants`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template, name }),
          }
        );

        if (!response.ok) throw new Error('Failed to create variant');

        const { data } = await response.json();
        setState(prev => ({
          ...prev,
          variants: [...prev.variants, data],
        }));

        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        throw err;
      }
    },
    [state.prompt?.id, options]
  );

  /**
   * Compare variants
   */
  const compareVariants = useCallback(
    async (variantIds: string[]) => {
      if (!state.prompt?.id) throw new Error('No prompt loaded');

      try {
        const response = await fetch(
          `/api/prompts/${state.prompt.id}/compare-variants`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variantIds }),
          }
        );

        if (!response.ok) throw new Error('Comparison failed');

        const { data } = await response.json();
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        throw err;
      }
    },
    [state.prompt?.id, options]
  );

  /**
   * Export prompt
   */
  const exportPrompt = useCallback(() => {
    if (!state.prompt) throw new Error('No prompt loaded');

    const exported = {
      prompt: state.prompt,
      variants: state.variants,
      metrics: state.metrics,
      exportedAt: new Date(),
    };

    return JSON.stringify(exported, null, 2);
  }, [state.prompt, state.variants, state.metrics]);

  /**
   * Import prompt
   */
  const importPrompt = useCallback(
    async (json: string) => {
      try {
        const data = JSON.parse(json);
        const response = await fetch('/api/prompts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Import failed');

        const { data: imported } = await response.json();
        setState(prev => ({
          ...prev,
          prompt: imported,
        }));

        return imported;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        options.onError?.(err);
        throw err;
      }
    },
    [options]
  );

  return {
    // State
    prompt: state.prompt,
    variants: state.variants,
    currentVariant: state.currentVariant,
    metrics: state.metrics,
    loading: state.loading,
    error: state.error,
    variables,

    // Methods
    loadPrompt,
    loadVariants,
    updateVariable,
    setVariables: setVariables,
    render,
    testRender,
    setVariant,
    addVariant,
    compareVariants,
    exportPrompt,
    importPrompt,
  };
}
