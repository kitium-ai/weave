/**
 * Core-specific error classes and utilities
 */

import { WeaveError } from '@weave/shared';

// Re-export WeaveError
export type { WeaveErrorOptions } from './weave-error.js';
export {
  WeaveError,
  isWeaveError,
  assertWeaveError
} from './weave-error.js';

// Re-export error handling utilities
export {
  extractErrorCode,
  getErrorSolution,
  formatErrorMessage,
  validateConfiguration,
  ERROR_SOLUTIONS,
  type ErrorContext,
  type ErrorSolution
} from './error-handler.js';

// Core-specific error classes
export class ModelNotFoundError extends WeaveError {
  public readonly name: string = 'ModelNotFoundError';

  public constructor(modelName: string, context?: Record<string, unknown>) {
    super(`Model "${modelName}" not found or not available`, 'MODEL_NOT_FOUND', 404, {
      modelName,
      ...context,
    });
    Object.setPrototypeOf(this, ModelNotFoundError.prototype);
  }
}

export class ProviderConfigError extends WeaveError {
  public readonly name: string = 'ProviderConfigError';

  public constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PROVIDER_CONFIG_ERROR', 400, context);
    Object.setPrototypeOf(this, ProviderConfigError.prototype);
  }
}

export class OperationNotSupportedError extends WeaveError {
  public readonly name: string = 'OperationNotSupportedError';

  public constructor(
    operationName: string,
    providerName: string,
    context?: Record<string, unknown>
  ) {
    super(
      `Provider "${providerName}" does not support operation "${operationName}"`,
      'OPERATION_NOT_SUPPORTED',
      400,
      {
        operationName,
        providerName,
        ...context,
      }
    );
    Object.setPrototypeOf(this, OperationNotSupportedError.prototype);
  }
}
