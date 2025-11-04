/**
 * Utility Builder
 * Generates TypeScript utility functions
 */

/**
 * Utility function specification
 */
export interface UtilSpec {
  name: string;
  description: string;
  parameters: UtilParameter[];
  returnType: string;
  category: string;
  examples: string[];
}

/**
 * Utility function parameter
 */
export interface UtilParameter {
  name: string;
  type: string;
  description: string;
  optional: boolean;
  defaultValue?: unknown;
}

/**
 * Generated utilities output
 */
export interface GeneratedUtils {
  utilCode: string;
  functionNames: string[];
  typesCode: string;
  testFile: string;
  exampleUsage: string;
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    description: string;
  };
}

/**
 * UtilBuilder - Generates utility functions
 */
export class UtilBuilder {
  /**
   * Build utilities from specifications
   */
  public static buildUtils(specs: UtilSpec[], description: string): GeneratedUtils {
    const utilCode = specs.map((spec) => this.generateUtilCode(spec)).join('\n\n');
    const typesCode = this.generateTypesCode(specs);
    const testFile = this.generateTestFile(specs);
    const exampleUsage = this.generateExampleUsage(specs);
    const functionNames = specs.map((s) => s.name);

    return {
      utilCode,
      functionNames,
      typesCode,
      testFile,
      exampleUsage,
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'weave-util-generator',
        description,
      },
    };
  }

  /**
   * Generate utility function code
   */
  private static generateUtilCode(spec: UtilSpec): string {
    const params = spec.parameters
      .map((p) => `${p.name}${p.optional ? '?' : ''}: ${p.type}`)
      .join(', ');

    const paramDocs = spec.parameters
      .map((p) => `   * @param ${p.name} - ${p.description}`)
      .join('\n');

    return `/**
 * ${spec.name}
 * ${spec.description}
 *
${paramDocs}
   * @returns ${spec.returnType}
${spec.examples.length > 0 ? `   * @example\n${spec.examples.map((ex) => `   * ${ex}`).join('\n')}` : ''}
 */
export function ${spec.name}(${params}): ${spec.returnType} {
  /**
   * Utility Function: ${spec.name}
   * Category: ${spec.category}
   *
   * Implementation Guide:
   * 1. Validate input parameters
   * 2. Perform core operation
   * 3. Handle edge cases
   * 4. Return typed result
   */

  // Input validation
${spec.parameters
  .filter((p) => !p.optional)
  .map(
    (p) => `  if (${p.name} === null || ${p.name} === undefined) {
    throw new Error('${p.name} is required');
  }`
  )
  .join('\n')}

  // Core implementation
  try {
    // Add your implementation logic here
    // Example patterns:
    // - Data transformation
    // - Computation/calculation
    // - Format conversion
    // - Validation logic

    // Placeholder implementation
    const result: ${spec.returnType} = ${spec.returnType === 'void' ? '{}' : 'null'};
    return result;
  } catch (error) {
    console.error(\`Error in ${spec.name}:\`, error);
    throw new Error(\`${spec.name} failed: \${error instanceof Error ? error.message : String(error)}\`);
  }
}`;
  }

  /**
   * Generate types code
   */
  private static generateTypesCode(specs: UtilSpec[]): string {
    const types = specs
      .map((spec) => {
        const params = spec.parameters
          .map((p) => `  ${p.name}${p.optional ? '?' : ''}: ${p.type};`)
          .join('\n');

        return `/**
 * Options for ${spec.name}
 */
export interface ${spec.name}Options {
${params}
}`;
      })
      .join('\n\n');

    return `/**
 * Type definitions for utility functions
 */

${types}
`;
  }

  /**
   * Generate test file
   */
  private static generateTestFile(specs: UtilSpec[]): string {
    const tests = specs
      .map((spec) => {
        const params = spec.parameters.length > 0 ? this.getExampleParams(spec.parameters) : '';

        return `  describe('${spec.name}', () => {
    it('should work correctly', () => {
      const result = ${spec.name}(${params});
      expect(result).toBeDefined();
    });

    it('should handle edge cases', () => {
      // Add edge case tests
    });

    it('should handle errors', () => {
      // Add error handling tests
    });
  });`;
      })
      .join('\n\n');

    return `/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { ${specs.map((s) => s.name).join(', ')} } from './utils';

describe('Utility Functions', () => {
${tests}
});
`;
  }

  /**
   * Generate example usage
   */
  private static generateExampleUsage(specs: UtilSpec[]): string {
    const examples = specs
      .slice(0, 3)
      .map((spec) => {
        const params = spec.parameters.length > 0 ? this.getExampleParams(spec.parameters) : '';
        return `// ${spec.description}
const result_${this.toLowerCamelCase(spec.name)} = ${spec.name}(${params});`;
      })
      .join('\n\n');

    return `/**
 * Example usage of utility functions
 */

import { ${specs.map((s) => s.name).join(', ')} } from './utils';

${examples}
`;
  }

  /**
   * Get example parameters
   */
  private static getExampleParams(params: UtilParameter[]): string {
    return params
      .slice(0, 2)
      .map((p) => {
        if (p.defaultValue !== undefined) {
          return typeof p.defaultValue === 'string'
            ? `'${p.defaultValue}'`
            : String(p.defaultValue);
        }
        if (p.type.includes('string')) {
          return `'example'`;
        }
        if (p.type.includes('number')) {
          return `0`;
        }
        if (p.type.includes('boolean')) {
          return `true`;
        }
        if (p.type.includes('[]')) {
          return `[]`;
        }
        return `{}`;
      })
      .join(', ');
  }

  /**
   * Convert to camelCase
   */
  private static toLowerCamelCase(str: string): string {
    return (
      str.charAt(0).toLowerCase() +
      str.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    );
  }
}
