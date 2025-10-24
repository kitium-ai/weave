/**
 * Base operation class
 */

import { getLogger } from '@weave/shared';
import type { ILanguageModel } from '../providers/interfaces.js';
import type { OperationMetadata } from '../types/index.js';

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
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
