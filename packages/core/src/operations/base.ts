/**
 * Base operation class
 */

import { getLogger, generateOperationId } from '@weaveai/shared';
import type { ILanguageModel } from '../providers/interfaces.js';
import type {
  OperationMetadata,
  WeaveOperationMetadata,
  WeaveOperationResult,
  WeaveOperationError,
  WeaveOperationUiMetadata,
} from '../types/index.js';
import { advancedCostTracker } from '../advanced/index.js';

/**
 * Base class for all operations
 */
export abstract class BaseOperation {
  protected readonly logger = getLogger();
  protected readonly metadata: Map<string, OperationMetadata> = new Map();

  public constructor(protected readonly model: ILanguageModel) {}

  /**
   * Get operation metadata by ID
   */
  public getMetadata(operationId: string): OperationMetadata | undefined {
    return this.metadata.get(operationId);
  }

  /**
   * Create operation metadata
   */
  protected createMetadata(operationName: string, operationId: string): OperationMetadata {
    const providerInfo = this.model.getProviderInfo();
    return {
      id: operationId,
      operationName,
      startTime: new Date(),
      status: 'pending',
      provider: providerInfo.provider,
      model: providerInfo.model,
      cached: false,
    };
  }

  /**
   * Mark operation as success
   */
  protected markSuccess(
    metadata: OperationMetadata,
    tokenCount?: { input: number; output: number }
  ): void {
    metadata.endTime = new Date();
    metadata.duration = metadata.endTime.getTime() - metadata.startTime.getTime();
    metadata.status = 'success';

    if (tokenCount) {
      metadata.tokenCount = {
        ...tokenCount,
        total: tokenCount.input + tokenCount.output,
      };

      // Attempt cost tracking when token counts are available
      try {
        const info = this.model.getProviderInfo();
        const op = advancedCostTracker.trackOperation(
          metadata.id,
          info.provider,
          info.model,
          tokenCount.input,
          tokenCount.output
        );
        metadata.cost = {
          tokenCount: {
            input: op.inputTokens,
            output: op.outputTokens,
            total: op.inputTokens + op.outputTokens,
          },
          estimatedCost: op.totalCost,
          currency: 'USD',
        };
      } catch {
        // Non-fatal if cost tracking fails
      }
    }
  }

  /**
   * Mark operation as error
   */
  protected markError(metadata: OperationMetadata, error: Error): void {
    metadata.endTime = new Date();
    metadata.duration = metadata.endTime.getTime() - metadata.startTime.getTime();
    metadata.status = 'error';
    metadata.error = error;
  }

  /**
   * Generate unique operation ID
   */
  protected generateOperationId(): string {
    return generateOperationId();
  }

  /**
   * Build operation result with unified metadata
   */
  protected buildResult<T>(
    metadata: OperationMetadata,
    data: T,
    ui: WeaveOperationUiMetadata,
    errorDetails?: WeaveOperationError
  ): WeaveOperationResult<T> {
    const duration = metadata.duration ?? (metadata.endTime?.getTime() ?? Date.now()) - metadata.startTime.getTime();
    const timestamp = metadata.endTime ?? new Date();
    const provider = metadata.provider ?? this.model.getProviderInfo().provider;
    const model = metadata.model ?? this.model.getProviderInfo().model;

    const tokens = metadata.tokenCount
      ? {
          input: metadata.tokenCount.input,
          output: metadata.tokenCount.output,
        }
      : undefined;

    const cost = metadata.cost
      ? {
          input: metadata.cost.tokenCount.input,
          output: metadata.cost.tokenCount.output,
          total: metadata.cost.tokenCount.total,
          currency: metadata.cost.currency ?? 'USD',
        }
      : undefined;

    const metadataPayload: WeaveOperationMetadata = {
      operationId: metadata.id,
      duration,
      timestamp,
      provider,
      model,
      ui,
      cost,
      tokens,
      cached: metadata.cached ?? false,
      cacheKey: metadata.cacheKey,
    };

    const status: WeaveOperationResult<T>['status'] =
      errorDetails ? 'error' : metadata.status === 'pending' ? 'pending' : metadata.status;

    return {
      status,
      data,
      metadata: metadataPayload,
      ...(errorDetails ? { error: errorDetails } : {}),
    };
  }
}
