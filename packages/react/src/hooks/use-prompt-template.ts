/**
 * usePromptTemplate Hook
 * UI-integrated prompt template management with A/B testing and metrics
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  PromptTemplate,
  PromptVariant,
  PromptVariable,
  PromptMetrics,
  PromptTestResult,
  PromptRenderOptions,
  UsePromptTemplateOptions,
  UsePromptTemplateReturn,
  PromptHistoryEntry,
  PromptMetricsComparison,
} from '../types/prompt-template';

/**
 * Extract variables from template string
 * Supports {{variableName}} syntax
 */
function extractVariablesFromTemplate(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables: Set<string> = new Set();
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

/**
 * Render template with variables
 */
function renderTemplate(
  template: string,
  variables: Record<string, unknown>,
  options: PromptRenderOptions = {}
): string {
  let rendered = template;
  const { strict = false, trim = true } = options;

  const templateVariables = extractVariablesFromTemplate(template);

  for (const varName of templateVariables) {
    if (!(varName in variables)) {
      if (strict) {
        throw new Error(`Missing required variable: ${varName}`);
      }
      continue;
    }

    const value = variables[varName];
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    rendered = rendered.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), stringValue);
  }

  return trim ? rendered.trim() : rendered;
}

/**
 * Validate template syntax
 */
function validateTemplate(template: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!template || template.trim().length === 0) {
    errors.push('Template cannot be empty');
  }

  // Check for unclosed brackets
  const openBrackets = (template.match(/\{\{/g) || []).length;
  const closeBrackets = (template.match(/\}\}/g) || []).length;

  if (openBrackets !== closeBrackets) {
    errors.push('Mismatched template brackets {{ }}');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate variables against their definitions
 */
function validateVariables(
  variables: Record<string, unknown>,
  definitions: PromptVariable[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const def of definitions) {
    if (def.required && !(def.name in variables)) {
      errors.push(`Required variable missing: ${def.name}`);
      continue;
    }

    if (def.name in variables) {
      const value = variables[def.name];

      // Type checking
      if (def.type && typeof value !== def.type) {
        errors.push(`Variable ${def.name}: expected ${def.type}, got ${typeof value}`);
      }

      // Custom validation
      if (def.validation) {
        const result = def.validation(value);
        if (result !== true) {
          errors.push(
            `Variable ${def.name}: ${typeof result === 'string' ? result : 'validation failed'}`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * usePromptTemplate Hook
 */
export function usePromptTemplate(options: UsePromptTemplateOptions): UsePromptTemplateReturn {
  // State
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate>({
    id: `template-${Date.now()}`,
    name: options.name,
    template: options.template || '',
    variables: options.variables || [],
    category: options.category,
    tags: options.tags,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    editable: options.editable ?? true,
    public: false,
  });

  const [currentVariables, setCurrentVariables] = useState<Record<string, unknown>>({});
  const [variants, setVariants] = useState<PromptVariant[]>(options.variants || []);
  const [currentVariantId, setCurrentVariantId] = useState<string | null>(
    options.variants?.[0]?.id || null
  );
  const [metrics, setMetrics] = useState<PromptMetrics | null>(
    options.trackMetrics
      ? {
          totalRuns: 0,
          successRate: 100,
          errors: 0,
        }
      : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [history, setHistory] = useState<PromptHistoryEntry[]>([]);

  const storageKey = options.storageKey || `prompt-template-${options.name}`;
  const historyRef = useRef<PromptHistoryEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    if (options.persistToLocalStorage) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          setCurrentTemplate(data.template);
          setCurrentVariables(data.variables || {});
          setVariants(data.variants || []);
          setHistory(data.history || []);
        }
      } catch (e) {
        console.warn(`Failed to load template from localStorage: ${e}`);
      }
    }
  }, [storageKey, options.persistToLocalStorage]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (options.persistToLocalStorage) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            template: currentTemplate,
            variables: currentVariables,
            variants,
            history,
          })
        );
      } catch (e) {
        console.warn(`Failed to save template to localStorage: ${e}`);
      }
    }
  }, [
    currentTemplate,
    currentVariables,
    variants,
    history,
    storageKey,
    options.persistToLocalStorage,
  ]);

  // Track metrics
  const updateMetrics = useCallback(
    (success: boolean, duration: number, isError: boolean = false) => {
      if (!options.trackMetrics || !metrics) {
        return;
      }

      const updated = {
        ...metrics,
        totalRuns: metrics.totalRuns + 1,
        avgResponseTime:
          (metrics.avgResponseTime || 0) * (metrics.totalRuns / (metrics.totalRuns + 1)) +
          duration / (metrics.totalRuns + 1),
        successRate: success
          ? (metrics.successRate || 0) * (metrics.totalRuns / (metrics.totalRuns + 1)) +
            100 / (metrics.totalRuns + 1)
          : (metrics.successRate || 0) * (metrics.totalRuns / (metrics.totalRuns + 1)),
        errors: isError ? (metrics.errors || 0) + 1 : metrics.errors || 0,
        lastUsed: new Date(),
      };

      setMetrics(updated);
      options.onMetricsUpdate?.(updated);
    },
    [metrics, options]
  );

  // Template Management
  const handleSetTemplate = useCallback(
    (template: string | PromptTemplate) => {
      const newTemplate =
        typeof template === 'string'
          ? {
              ...currentTemplate,
              template,
              updatedAt: new Date(),
              version: currentTemplate.version + 1,
            }
          : template;

      setCurrentTemplate(newTemplate);
      options.onTemplateChange?.(newTemplate.template);
    },
    [currentTemplate, options]
  );

  const handleUpdateVariable = useCallback((name: string, value: unknown) => {
    setCurrentVariables((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSetVariables = useCallback((variables: Record<string, unknown>) => {
    setCurrentVariables(variables);
  }, []);

  const handleClearVariables = useCallback(() => {
    setCurrentVariables({});
  }, []);

  // Rendering
  const handleRender = useCallback(
    (variables?: Record<string, unknown>, options?: PromptRenderOptions): string => {
      const vars = variables || currentVariables;
      return renderTemplate(currentTemplate.template, vars, options);
    },
    [currentTemplate.template, currentVariables]
  );

  const handleValidateTemplate = useCallback(() => {
    return validateTemplate(currentTemplate.template);
  }, [currentTemplate.template]);

  const handleValidateVariables = useCallback(
    (variables?: Record<string, unknown>) => {
      const vars = variables || currentVariables;
      return validateVariables(vars, currentTemplate.variables);
    },
    [currentTemplate.variables, currentVariables]
  );

  const handleTestRender = useCallback(
    async (variables?: Record<string, unknown>): Promise<PromptTestResult> => {
      setIsLoading(true);
      const startTime = performance.now();

      try {
        const vars = variables || currentVariables;

        // Validate
        const templateValidation = validateTemplate(currentTemplate.template);
        if (!templateValidation.valid) {
          throw new Error(`Invalid template: ${templateValidation.errors.join(', ')}`);
        }

        const variablesValidation = validateVariables(vars, currentTemplate.variables);
        if (!variablesValidation.valid) {
          throw new Error(`Invalid variables: ${variablesValidation.errors.join(', ')}`);
        }

        // Render
        const renderedPrompt = renderTemplate(currentTemplate.template, vars);
        const duration = performance.now() - startTime;

        // Update metrics
        updateMetrics(true, duration);

        // Add to history
        historyRef.current.push({
          id: `${Date.now()}`,
          template: currentTemplate.template,
          timestamp: new Date(),
          variables: vars,
          result: renderedPrompt,
        });

        setHistory([...historyRef.current]);

        return {
          success: true,
          renderedPrompt,
          variables: vars,
          duration,
        };
      } catch (err) {
        const duration = performance.now() - startTime;
        updateMetrics(false, duration, true);

        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);

        return {
          success: false,
          renderedPrompt: '',
          variables: variables || currentVariables,
          duration,
          error: error.message,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [currentTemplate, currentVariables, options, updateMetrics]
  );

  // Variant Management
  const handleSetVariant = useCallback(
    (variantId: string) => {
      const variant = variants.find((v) => v.id === variantId);
      if (variant) {
        setCurrentVariantId(variantId);
        handleSetTemplate(variant.template);
      }
    },
    [variants, handleSetTemplate]
  );

  const handleAddVariant = useCallback((variant: PromptVariant) => {
    setVariants((prev) => [...prev, variant]);
  }, []);

  const handleRemoveVariant = useCallback(
    (variantId: string) => {
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      if (currentVariantId === variantId) {
        setCurrentVariantId(null);
      }
    },
    [currentVariantId]
  );

  const handleUpdateVariant = useCallback((variantId: string, updates: Partial<PromptVariant>) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? {
              ...v,
              ...updates,
              updatedAt: new Date(),
            }
          : v
      )
    );
  }, []);

  // A/B Testing
  const handleGetVariantMetrics = useCallback(
    (variantId: string): PromptMetrics | null => {
      const variant = variants.find((v) => v.id === variantId);
      return variant?.metrics || null;
    },
    [variants]
  );

  const handleCompareVariants = useCallback(
    (variantIds: string[]): PromptMetricsComparison => {
      const comparisons = variantIds
        .map((id) => {
          const variant = variants.find((v) => v.id === id);
          return {
            id,
            name: variant?.name || id,
            metrics: variant?.metrics || { totalRuns: 0, successRate: 0, errors: 0 },
          };
        })
        .filter((c) => c.metrics.totalRuns > 0);

      // Find best variant by success rate
      let bestVariant: string | undefined;
      if (comparisons.length > 0) {
        const best = comparisons.reduce((prev, current) =>
          (current.metrics.successRate || 0) > (prev.metrics.successRate || 0) ? current : prev
        );
        bestVariant = best.id;
      }

      return {
        variants: comparisons.map((c) => ({
          ...c,
          winner: c.id === bestVariant,
        })),
        bestVariant,
      };
    },
    [variants]
  );

  // Persistence
  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, this would save to a backend
      if (options.persistToLocalStorage) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            template: currentTemplate,
            variables: currentVariables,
            variants,
            history,
          })
        );
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      options.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTemplate, currentVariables, variants, history, storageKey, options]);

  const handleLoad = useCallback(
    async (templateId: string) => {
      setIsLoading(true);
      try {
        // In a real app, this would load from a backend
        if (options.persistToLocalStorage) {
          const stored = localStorage.getItem(`${storageKey}-${templateId}`);
          if (stored) {
            const data = JSON.parse(stored);
            setCurrentTemplate(data.template);
            setCurrentVariables(data.variables || {});
            setVariants(data.variants || []);
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [storageKey, options]
  );

  const handleExport = useCallback(() => {
    return JSON.stringify(
      {
        template: currentTemplate,
        variables: currentVariables,
        variants,
        history,
      },
      null,
      2
    );
  }, [currentTemplate, currentVariables, variants, history]);

  const handleImport = useCallback(
    (data: string) => {
      try {
        const imported = JSON.parse(data);
        setCurrentTemplate(imported.template);
        setCurrentVariables(imported.variables || {});
        setVariants(imported.variants || []);
        setHistory(imported.history || []);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
      }
    },
    [options]
  );

  const handleReset = useCallback(() => {
    setCurrentTemplate({
      id: `template-${Date.now()}`,
      name: options.name,
      template: options.template || '',
      variables: options.variables || [],
      category: options.category,
      tags: options.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      editable: options.editable ?? true,
      public: false,
    });
    setCurrentVariables({});
    setVariants(options.variants || []);
    setHistory([]);
    setError(null);
  }, [options]);

  return {
    // State
    currentTemplate,
    templates: [currentTemplate],
    variants,
    currentVariant: variants.find((v) => v.id === currentVariantId) || null,
    metrics,
    isLoading,
    error,

    // Template Management
    setTemplate: handleSetTemplate,
    updateVariable: handleUpdateVariable,
    setVariables: handleSetVariables,
    getVariables: () => currentVariables,
    clearVariables: handleClearVariables,

    // Variant Management
    setVariant: handleSetVariant,
    addVariant: handleAddVariant,
    removeVariant: handleRemoveVariant,
    updateVariant: handleUpdateVariant,

    // Rendering
    render: handleRender,
    testRender: handleTestRender,
    validateTemplate: handleValidateTemplate,
    validateVariables: handleValidateVariables,

    // A/B Testing
    getVariantMetrics: handleGetVariantMetrics,
    compareVariants: handleCompareVariants,

    // Persistence
    save: handleSave,
    load: handleLoad,
    export: handleExport,
    import: handleImport,
    reset: handleReset,
  };
}
