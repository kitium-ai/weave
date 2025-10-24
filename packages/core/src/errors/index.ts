/**
 * Core-specific error classes
 */

import { WeaveError } from '@weave/shared';

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
