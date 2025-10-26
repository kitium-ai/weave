/**
 * Shared generator types used across all frameworks
 */

/**
 * Common code generation output structure
 */
export interface GeneratedCode {
  code: string;
  fileName: string;
  fileExtension: string;
  language: 'typescript' | 'javascript' | 'dart' | 'swift';
  metadata: CodeMetadata;
}

/**
 * Metadata about generated code
 */
export interface CodeMetadata {
  generatedAt: Date;
  generatedBy: string;
  description: string;
  framework: string;
  version: string;
}

/**
 * Base specification for any code generation
 */
export interface BaseSpec {
  name: string;
  description: string;
  framework: string;
  language: string;
}

/**
 * Code generation options
 */
export interface CodeGenerationOptions {
  includeTests?: boolean;
  includeExamples?: boolean;
  includeDocumentation?: boolean;
  includeTypes?: boolean;
  formatting?: FormattingOptions;
}

/**
 * Code formatting options
 */
export interface FormattingOptions {
  indentation?: 'spaces' | 'tabs';
  indentSize?: number;
  lineLength?: number;
  trailingComma?: 'all' | 'es5' | 'none';
  semiColons?: boolean;
}

/**
 * Generator output structure
 */
export interface GeneratorOutput<T> {
  code: string;
  tests?: string;
  examples?: string;
  types?: string;
  metadata: CodeMetadata;
  spec: T;
}
