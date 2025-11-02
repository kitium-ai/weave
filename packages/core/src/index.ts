/**
 * @weaveai/core - Framework-agnostic AI operations
 * Main entry point for Weave framework
 */

export * from './types/index.js';
export * from './errors/index.js';
export * from './providers/index.js';
export * from './operations/index.js';
export * from './agents/index.js';
export * from './rag/index.js';
export * from './evaluation/index.js';
export * from './tools/index.js';
export {
  PromptManager,
  promptManager,
  BUILT_IN_TEMPLATES,
} from './prompts/index.js';
export type {
  PromptTemplate,
  VariableSchema,
  ValidationResult as PromptValidationResult,
  ValidationError as PromptValidationError,
  RenderResult as PromptRenderResult,
  TemplateMetrics as PromptTemplateMetrics,
  ABTestData as PromptABTestData,
} from './prompts/index.js';
export * from './advanced/index.js';
export * from './utils/index.js';
export * from './streaming/index.js';
export * from './observability/index.js';
export * from './config/index.js';
export * from './weave.js';
