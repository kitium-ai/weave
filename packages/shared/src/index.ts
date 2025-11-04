/**
 * @weaveai/shared - Shared utilities for Weave framework
 * Contains error classes, logging, validation, and code generation utilities
 */

export * from './errors/index.js';
export * from './logger/index.js';
export * from './validation/index.js';
export * from './generators/index.js';
export * from './utils/index.js';
export * from './ui/ai-controller';
export * from './ui/chat-controller';
export * from './ui/cache-controller';
export * from './ui/provider-routing-controller';

// Re-export types explicitly to avoid conflicts
export type {
  WeaveError,
  ValidationError,
  ProviderError,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
  TimeoutError,
  OperationError,
} from './errors/index.js';

export type { AIExecutionState, AIExecutionOptions } from './ui/ai-controller.js';
