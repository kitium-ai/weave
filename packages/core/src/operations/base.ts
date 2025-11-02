/**
 * Base operation class
 */

import { getLogger, generateOperationId } from '@weaveai/shared';
import type { ILanguageModel } from '../providers/interfaces.js';
import type { OperationMetadata } from '../types/index.js';
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
    return {
      id: operationId,
      operationName,
      startTime: new Date(),
      status: 'pending',
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
}
