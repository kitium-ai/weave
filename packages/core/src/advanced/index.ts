/**
 * Advanced Features
 * Schema validation, cost tracking, and batch processing
 */

export {
  SchemaValidator,
  type SchemaType,
  type ObjectSchema,
  type ValidationResult,
  type ValidationErrorDetail,
} from './schema-validator.js';
export {
  CostTracker,
  costTracker,
  type TokenCost,
  type ProviderPricing,
  type OperationCost,
  type CostSummary,
} from './cost-tracker.js';
export {
  BatchProcessor,
  batchProcessor,
  type BatchJob,
  type BatchOptions,
  type BatchError,
} from './batch-processor.js';
