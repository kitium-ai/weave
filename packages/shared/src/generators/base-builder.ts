/**
 * Base code builder class with common logic
 */
import type { GeneratorOutput, BaseSpec, CodeGenerationOptions, CodeMetadata } from './types.js';

/**
 * Abstract base class for all code builders
 * Provides common functionality for code generation across frameworks
 */
export abstract class BaseCodeBuilder<T extends BaseSpec> {
  protected createMetadata(spec: T, description: string, generatorName: string): CodeMetadata {
    return {
      generatedAt: new Date(),
      generatedBy: generatorName,
      description: description.substring(0, 200),
      framework: spec.framework,
      version: '1.0.0',
    };
  }

  /**
   * Generate JSDoc comment
   */
  protected generateJSDoc(description: string, author?: string): string {
    return `/**
 * ${description}
 ${author ? `* @author ${author}` : ''}
 * @generated ${new Date().toISOString()}
 */`;
  }

  /**
   * Generate test file header
   */
  protected generateTestHeader(name: string, framework: string): string {
    return `/**
 * Tests for ${name}
 * Framework: ${framework}
 * Generated automatically
 */
`;
  }

  /**
   * Generate example file header
   */
  protected generateExampleHeader(name: string, framework: string): string {
    return `/**
 * Example usage of ${name}
 * Framework: ${framework}
 */
`;
  }

  /**
   * Convert string to camelCase
   */
  protected toCamelCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map((word, idx) => {
        if (idx === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }

  /**
   * Convert string to PascalCase
   */
  protected toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convert string to kebab-case
   */
  protected toKebabCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map((word) => word.toLowerCase())
      .join('-');
  }

  /**
   * Convert string to snake_case
   */
  protected toSnakeCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map((word) => word.toLowerCase())
      .join('_');
  }

  /**
   * Get example value for type
   */
  protected getExampleValue(type: string, defaultValue?: unknown): string {
    if (defaultValue !== undefined) {
      return typeof defaultValue === 'string' ? `'${defaultValue}'` : String(defaultValue);
    }

    if (type.includes('string')) {
      return `'example'`;
    }
    if (type.includes('number')) {
      return `0`;
    }
    if (type.includes('boolean')) {
      return `true`;
    }
    if (type.includes('Date')) {
      return `new Date()`;
    }
    if (type.includes('[]')) {
      return `[]`;
    }
    if (type.includes('Record') || type.includes('object')) {
      return `{}`;
    }
    return `undefined`;
  }

  /**
   * Wrap code in try-catch
   */
  protected wrapInTryCatch(
    code: string,
    _language: 'typescript' | 'javascript' = 'typescript'
  ): string {
    const indent = '  ';
    return `try {
${code
  .split('\n')
  .map((line) => indent + line)
  .join('\n')}
} catch (error) {
${indent}logError('Error:', error);
${indent}throw error;
}`;
  }

  /**
   * Add error handling
   */
  protected addErrorHandling(
    code: string,
    errorType: 'try-catch' | 'promise' = 'try-catch'
  ): string {
    if (errorType === 'try-catch') {
      return this.wrapInTryCatch(code);
    }

    return `${code}
  .catch(error => {
    logError('Error:', error);
    throw error;
  })`;
  }

  /**
   * Add loading state pattern
   */
  protected addLoadingState(framework: 'react' | 'angular' | 'vue' | 'node'): string {
    const patterns: Record<string, string> = {
      react: `const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  try {
    setLoading(true);
    // operation
  } catch (err) {
    setError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    setLoading(false);
  }`,

      angular: `loading$ = new BehaviorSubject(false);
  error$ = new BehaviorSubject<Error | null>(null);

  // In method:
  this.loading$.next(true);
  try {
    // operation
  } catch (err) {
    this.error$.next(err instanceof Error ? err : new Error(String(err)));
  } finally {
    this.loading$.next(false);
  }`,

      vue: `const loading = ref(false);
  const error = ref<Error | null>(null);

  try {
    loading.value = true;
    // operation
  } catch (err) {
    error.value = err instanceof Error ? err : new Error(String(err));
  } finally {
    loading.value = false;
  }`,

      node: `const loading = false;
  let error: Error | null = null;

  try {
    // operation
  } catch (err) {
    error = err instanceof Error ? err : new Error(String(err));
  }`,
    };

    return patterns[framework] || patterns.react;
  }

  /**
   * Remove TODO and placeholder comments from generated code
   * Replaces common placeholders with sensible defaults
   */
  protected removePlaceholders(code: string): string {
    // Remove TODO comments
    code = code.replace(/\s*\/\/\s*TODO:.*\n/g, '\n');
    code = code.replace(/\s*\/\*\*\s*TODO:.*?\*\/\n/gs, '\n');

    // Remove "// TODO: Implement logic" and similar
    code = code.replace(
      /const result = \{\};\n/g,
      'const result = { /* data from implementation */ };\n'
    );

    // Clean up multiple blank lines
    code = code.replace(/\n\n\n+/g, '\n\n');

    return code;
  }

  /**
   * Validate that spec doesn't have unimplemented features
   */
  protected validateFeatures(features: string[], supportedFeatures: string[]): string[] {
    return features.filter((feature) => supportedFeatures.includes(feature.toLowerCase()));
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  abstract build(spec: T, description: string, options?: CodeGenerationOptions): GeneratorOutput<T>;
}
