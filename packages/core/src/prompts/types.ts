/**
 * Prompt Management System Types
 */

/**
 * Variable schema for prompt templates
 */
export interface VariableSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Prompt template definition
 */
export interface PromptTemplate {
  /** Unique template name */
  name: string;
  /** Template content with {{variable}} syntax */
  template: string;
  /** Template version for A/B testing */
  version: string;
  /** Variable definitions */
  variables: Record<string, VariableSchema>;
  /** Category for organization */
  category:
    | 'email'
    | 'content'
    | 'classification'
    | 'extraction'
    | 'sentiment'
    | 'translation'
    | 'chat'
    | 'custom';
  /** Tags for filtering and search */
  tags: string[];
  /** Template description */
  description?: string;
  /** Author/source */
  author?: string;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
  /** Creation timestamp */
  createdAt?: Date;
  /** Last updated timestamp */
  updatedAt?: Date;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Render result
 */
export interface RenderResult {
  success: boolean;
  content: string;
  variablesUsed: Record<string, unknown>;
  errors?: string[];
}

/**
 * Performance metrics for template
 */
export interface TemplateMetrics {
  templateName: string;
  usageCount: number;
  averageTokens: number;
  successRate: number;
  averageLatency: number;
  lastUsed: Date;
}

/**
 * A/B test data
 */
export interface ABTestData {
  templateName: string;
  variants: {
    [variantName: string]: {
      template: PromptTemplate;
      usageCount: number;
      successRate: number;
      averageLatency: number;
    };
  };
  startDate: Date;
  endDate?: Date;
  winner?: string;
}
