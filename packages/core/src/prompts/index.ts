/**
 * Prompt Management System
 * Centralized prompt template management with versioning, validation, and A/B testing
 */

export { PromptManager, promptManager } from './prompt-manager.js';
export { BUILT_IN_TEMPLATES } from './templates.js';

// Type exports
export type {
  PromptTemplate,
  VariableSchema,
  ValidationResult,
  ValidationError,
  RenderResult,
  TemplateMetrics,
  ABTestData,
} from './types.js';
