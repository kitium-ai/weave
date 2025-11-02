/**
 * useComponentGenerator hook - Generate React components with AI
 */

import { useCallback, useMemo, useState } from 'react';
import type { GenerateOptions } from '@weaveai/core';
import { useWeaveContext } from '../context/WeaveContext.js';
import { ComponentBuilder } from '../generators/component-builder.js';
import { SpecParser } from '../generators/spec-parser.js';
import type {
  GeneratedComponent,
  ComponentGeneratorOptions,
  UseComponentGeneratorOptions,
  ComponentSpec,
} from '../generators/types.js';

const METADATA_GENERATOR_ID = 'weave-component-generator';

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
  const parser = useMemo(() => new SpecParser(), []);
  const builder = useMemo(() => new ComponentBuilder(), []);

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

        const {
          includeTests,
          includeExamples,
          includeDocumentation,
          styling: stylingOverride,
          complexity: complexityOverride,
          ...weaveGenerateOptions
        } = generatorOptions ?? {};

        // Step 1: Parse the description into a component specification
        const parsedSpec = parser.parse(description, componentName);
        const spec: ComponentSpec = {
          ...parsedSpec,
          styling: stylingOverride ?? parsedSpec.styling,
          complexity: complexityOverride ?? parsedSpec.complexity,
        };

        // Step 2: Generate enhancement prompt for AI to improve the spec
        const enhancementPrompt = buildEnhancementPrompt(spec, description, generatorOptions);

        // Step 3: Call Weave's generate to enhance the specification
        await weave.generate(enhancementPrompt, {
          ...(weaveGenerateOptions as GenerateOptions),
          streaming: false,
        });

        // Step 4: Build the component with the enhanced spec
        const generatorOutput = builder.build(spec, description, {
          includeTests,
          includeExamples,
          includeDocumentation,
          includeTypes: true,
        });

        const generatedComponent: GeneratedComponent = {
          componentCode: generatorOutput.code,
          componentName: spec.name,
          componentSpec: spec,
          propsInterface: generatorOutput.types ?? '',
          exampleUsage: generatorOutput.examples ?? '',
          testFile: generatorOutput.tests ?? '',
          metadata: {
            generatedAt: generatorOutput.metadata.generatedAt,
            generatedBy: METADATA_GENERATOR_ID,
            version: generatorOutput.metadata.version,
            description: generatorOutput.metadata.description,
            keywords: spec.features,
          },
        };

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
    [weave, options, parser, builder]
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
  spec: ComponentSpec,
  userDescription: string,
  generatorOptions?: ComponentGeneratorOptions
): string {
  const featureSummary = spec.features.length > 0 ? spec.features.join(', ') : 'none';
  const includeTests = generatorOptions?.includeTests ?? false;
  const includeExamples = generatorOptions?.includeExamples ?? false;
  const includeDocumentation = generatorOptions?.includeDocumentation ?? false;

  return `Based on this React component request, provide enhancement suggestions:

Component Name: ${spec.name}
Description: ${userDescription}
Detected Features: ${featureSummary}
Complexity: ${spec.complexity}
Styling: ${spec.styling}
Include Tests: ${includeTests ? 'yes' : 'no'}
Include Examples: ${includeExamples ? 'yes' : 'no'}
Include Documentation: ${includeDocumentation ? 'yes' : 'no'}

Provide a JSON response with:
1. Improved prop descriptions and types
2. Additional helpful props to consider
3. Accessibility recommendations
4. Performance optimization tips
5. Testing strategy

Format as valid JSON that can be parsed.`;
}
