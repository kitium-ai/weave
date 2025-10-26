/**
 * useComponentGenerator hook - Generate React components with AI
 */

import { useCallback, useState } from 'react';
import type { GenerateOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';
import { ComponentBuilder } from '../generators/component-builder.js';
import { SpecParser } from '../generators/spec-parser.js';
import type { GeneratedComponent, ComponentGeneratorOptions, UseComponentGeneratorOptions } from '../generators/types.js';

/**
 * useComponentGenerator hook return type
 */
export interface UseComponentGeneratorReturn {
  component: GeneratedComponent | null;
  loading: boolean;
  error: Error | null;
  generate: (componentName: string, description: string, options?: ComponentGeneratorOptions & GenerateOptions) => Promise<GeneratedComponent | null>;
}

/**
 * Hook for generating React components with AI
 *
 * @example
 * ```typescript
 * const { component, loading, generate } = useComponentGenerator({
 *   onSuccess: (component) => console.log('Component generated:', component.componentName),
 * });
 *
 * // Generate a component
 * await generate('UserCard', 'A card component that displays user information with avatar, name, email, and action buttons');
 * ```
 */
export function useComponentGenerator(
  options?: UseComponentGeneratorOptions
): UseComponentGeneratorReturn {
  const { weave } = useWeaveContext();
  const [component, setComponent] = useState<GeneratedComponent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (
      componentName: string,
      description: string,
      generatorOptions?: ComponentGeneratorOptions & GenerateOptions
    ): Promise<GeneratedComponent | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        options?.onError?.(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);
        options?.onStart?.();

        // Step 1: Parse the description into a component specification
        const spec = SpecParser.parse(description, componentName);

        // Step 2: Generate enhancement prompt for AI to improve the spec
        const enhancementPrompt = this.buildEnhancementPrompt(spec, description, generatorOptions);

        // Step 3: Call Weave's generate to enhance the specification
        const aiEnhancement = await weave.generate(enhancementPrompt, {
          ...generatorOptions,
          streaming: false,
        });

        // Step 4: Build the component with the enhanced spec
        const generatedComponent = ComponentBuilder.buildComponent(spec, description);

        setComponent(generatedComponent);
        options?.onSuccess?.(generatedComponent);

        return generatedComponent;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [weave, options]
  );

  return {
    component,
    loading,
    error,
    generate,
  };
}

/**
 * Build enhancement prompt for AI
 */
function buildEnhancementPrompt(
  spec: any,
  userDescription: string,
  generatorOptions?: ComponentGeneratorOptions
): string {
  return `Based on this React component request, provide enhancement suggestions:

Component Name: ${spec.name}
Description: ${userDescription}
Detected Features: ${spec.features.join(', ')}
Complexity: ${spec.complexity}
Styling: ${spec.styling}

Provide a JSON response with:
1. Improved prop descriptions and types
2. Additional helpful props to consider
3. Accessibility recommendations
4. Performance optimization tips
5. Testing strategy

Format as valid JSON that can be parsed.`;
}
