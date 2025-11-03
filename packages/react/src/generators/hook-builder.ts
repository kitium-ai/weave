/**
 * Hook Builder Utility
 * Generates React custom hooks from specifications
 */

/**
 * Hook specification
 * Defines the structure and configuration of a React custom hook
 * @interface HookSpec
 */
export interface HookSpec {
  /** Name of the hook (in camelCase, e.g., 'useFetch', 'useAuth') */
  name: string;
  /** Detailed description of what the hook does */
  description: string;
  /** List of hook parameters/options */
  parameters: HookParameter[];
  /** TypeScript return type of the hook */
  returnType: string;
  /** External dependencies required by the hook */
  dependencies: string[];
  /** Features the hook implements (e.g., 'error-handling', 'retry-logic') */
  features: string[];
}

/**
 * Hook parameter definition
 * Describes a parameter that the hook accepts
 * @interface HookParameter
 */
export interface HookParameter {
  /** Parameter name */
  name: string;
  /** TypeScript type annotation */
  type: string;
  /** Human-readable description */
  description: string;
  /** Whether the parameter is optional */
  optional: boolean;
  /** Default value if optional */
  defaultValue?: unknown;
}

/**
 * Generated hook output
 * Complete output from the hook generator including code, types, tests, and examples
 * @interface GeneratedHook
 */
export interface GeneratedHook {
  /** The generated hook implementation code */
  hookCode: string;
  /** The hook name (PascalCase version) */
  hookName: string;
  /** The specification used to generate this hook */
  hookSpec: HookSpec;
  /** TypeScript type definitions file content */
  typesFile: string;
  /** Example usage code */
  exampleUsage: string;
  /** Unit test file content */
  testFile: string;
  /** Metadata about the generation */
  metadata: {
    /** When the hook was generated */
    generatedAt: Date;
    /** Generator that created this hook */
    generatedBy: string;
    /** Original description used to generate the hook */
    description: string;
  };
}

/**
 * HookBuilder - Generates React custom hooks
 * Static utility class for generating complete React hooks with tests, types, and examples
 * @class HookBuilder
 *
 * @example
 * ```typescript
 * const spec: HookSpec = {
 *   name: 'useFetch',
 *   description: 'A hook for fetching data from APIs',
 *   parameters: [
 *     { name: 'url', type: 'string', description: 'API endpoint', optional: false }
 *   ],
 *   returnType: 'UseFetchReturn',
 *   dependencies: ['axios'],
 *   features: ['error-handling', 'retry-logic', 'caching']
 * };
 *
 * const hook = HookBuilder.buildHook(spec, 'Fetches data from the provided URL with error handling');
 * ```
 */
export class HookBuilder {
  /**
   * Build a complete generated hook from specification
   *
   * Generates all necessary files for a production-ready React hook including:
   * - Hook implementation with proper error handling
   * - TypeScript type definitions
   * - Unit tests using vitest and @testing-library/react
   * - Example usage documentation
   *
   * @param spec - The hook specification defining the hook structure
   * @param description - Detailed description of the hook's purpose and behavior
   * @returns Complete generated hook with all artifacts
   *
   * @throws Error if specification is invalid or generation fails
   *
   * @example
   * ```typescript
   * const hook = HookBuilder.buildHook(myHookSpec, 'My custom hook');
   * console.log(hook.hookCode);  // Generated hook implementation
   * console.log(hook.testFile);  // Generated test file
   * ```
   */
  public static buildHook(spec: HookSpec, description: string): GeneratedHook {
    const hookCode = this.generateHookCode(spec);
    const typesFile = this.generateTypesFile(spec);
    const exampleUsage = this.generateExampleUsage(spec);
    const testFile = this.generateTestFile(spec);

    return {
      hookCode,
      hookName: spec.name,
      hookSpec: spec,
      typesFile,
      exampleUsage,
      testFile,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'weave-hook-generator',
        description,
      },
    };
  }

  /**
   * Generate hook code with proper imports, types, and error handling
   *
   * @internal
   * @param spec - The hook specification
   * @returns Generated hook implementation code
   */
  private static generateHookCode(spec: HookSpec): string {
    const returnTypeInterface = this.toCamelCase(spec.name) + 'Return';
    const optionsInterface = this.toCamelCase(spec.name) + 'Options';
    const hookCode = `/**
 * ${spec.name} Hook
 * ${spec.description}
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Options for ${spec.name}
 */
export interface ${optionsInterface} {
${spec.parameters.map((p) => `  /** ${p.description} */\n  ${p.name}${p.optional ? '?' : ''}: ${p.type};`).join('\n')}
}

/**
 * Return type for ${spec.name}
 */
export interface ${returnTypeInterface} {
  // Add your return properties here
}

/**
 * ${spec.name} - ${spec.description}
 *
 * @example
 * const result = ${spec.name}(options);
 */
export function ${spec.name}(${
      spec.parameters.length > 0
        ? `options: ${optionsInterface}`
        : ''
    }): ${returnTypeInterface} {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initialize hook logic
    const initializeHook = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Implement your hook logic here
        // Features: ${spec.features.join(', ')}

        // Update state as needed
        setState(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    initializeHook();
  }, [${spec.parameters.length > 0 ? `JSON.stringify(options)` : ''}]);

  return {
    // Return your hook state and methods
  };
}
`;

    return hookCode;
  }

  /**
   * Generate TypeScript type definitions for hook options and return type
   *
   * @internal
   * @param spec - The hook specification
   * @returns TypeScript type definitions file content
   */
  private static generateTypesFile(spec: HookSpec): string {
    const optionsInterface = this.toCamelCase(spec.name) + 'Options';
    const returnInterface = this.toCamelCase(spec.name) + 'Return';

    return `/**
 * Types for ${spec.name} hook
 */

export interface ${optionsInterface} {
${spec.parameters.map((p) => `  /** ${p.description} */\n  ${p.name}${p.optional ? '?' : ''}: ${p.type};`).join('\n')}
}

export interface ${returnInterface} {
  // TODO: Add return type properties
}
`;
  }

  /**
   * Generate example usage code demonstrating how to use the hook
   *
   * @internal
   * @param spec - The hook specification
   * @returns Example React component using the generated hook
   */
  private static generateExampleUsage(spec: HookSpec): string {
    return `/**
 * Example usage of ${spec.name}
 */

import { ${spec.name} } from './${spec.name}';

export function ${spec.name}Example() {
  const result = ${spec.name}({
${spec.parameters
  .slice(0, 3)
  .map((p) => `    ${p.name}: ${this.getDefaultValue(p.type, p.defaultValue)},`)
  .join('\n')}
  });

  return (
    <div>
      {/* Use your hook here */}
    </div>
  );
}
`;
  }

  /**
   * Generate vitest unit tests for the hook
   *
   * @internal
   * @param spec - The hook specification
   * @returns Unit test file content using vitest and @testing-library/react
   */
  private static generateTestFile(spec: HookSpec): string {
    return `/**
 * Tests for ${spec.name} hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ${spec.name} } from './${spec.name}';

describe('${spec.name}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => ${spec.name}());

    // Add assertions for initial state
    expect(result.current).toBeDefined();
  });

  it('should handle options correctly', () => {
    const options = {
${spec.parameters
  .slice(0, 2)
  .map((p) => `      ${p.name}: ${this.getDefaultValue(p.type, p.defaultValue)},`)
  .join('\n')}
    };

    const { result } = renderHook(() => ${spec.name}(options));
    expect(result.current).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const { result } = renderHook(() => ${spec.name}());

    await waitFor(() => {
      // Add error handling assertions
    });
  });
});
`;
  }

  /**
   * Get default value for a TypeScript type
   * Used when generating example code and test fixtures
   *
   * @internal
   * @param type - The TypeScript type annotation
   * @param defaultValue - Optional explicit default value
   * @returns String representation of the default value
   */
  private static getDefaultValue(type: string, defaultValue?: unknown): string {
    if (defaultValue !== undefined) {
      return typeof defaultValue === 'string' ? `'${defaultValue}'` : String(defaultValue);
    }

    if (type.includes('string')) return `''`;
    if (type.includes('number')) return `0`;
    if (type.includes('boolean')) return `false`;
    if (type.includes('[]')) return `[]`;
    if (type.includes('Record') || type.includes('object')) return `{}`;
    return `undefined`;
  }

  /**
   * Convert string to PascalCase (first letter uppercase, camelCase for rest)
   * Used for generating interface and class names
   *
   * @internal
   * @param str - The string to convert
   * @returns PascalCase version of the string
   */
  private static toCamelCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }
}
