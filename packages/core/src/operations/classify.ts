/**
 * Classify operation
 */

import { validateNonEmptyString, validateNonEmptyArray } from '@weaveai/shared';
import { BaseOperation } from './base.js';
import type {
  ClassifyOptions,
  ClassificationResult,
  ClassificationData,
  WeaveOperationError,
} from '../types/index.js';

/**
 * Classify text into categories
 */
export class ClassifyOperation extends BaseOperation {
  public async execute(
    text: string,
    labels: string[],
    options?: ClassifyOptions
  ): Promise<ClassificationResult> {
    validateNonEmptyString(text, 'text');
    validateNonEmptyArray<string>(labels, 'labels');

    const operationId = this.generateOperationId();
    const metadata = this.createMetadata('classify', operationId);
    this.metadata.set(operationId, metadata);

    try {
      this.logger.debug('Starting classify operation', {
        operationId,
        textLength: text.length,
        labelCount: labels.length,
        options,
      });

      const data = await this.model.classify(text, labels, options);

      this.markSuccess(metadata);

      this.logger.info('Classify operation completed', {
        operationId,
        duration: metadata.duration,
        result: data.label,
      });

      return this.buildResult(metadata, data, {
        displayAs: 'json',
        canStream: false,
        estimatedSize: 'small',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.markError(metadata, err);

      this.logger.error('Classify operation failed', err, {
        operationId,
        duration: metadata.duration,
      });

      const fallbackData: ClassificationData = {
        label: '',
        confidence: 0,
        scores: {},
      };

      const errorDetails: WeaveOperationError = {
        code: err.name ?? 'CLASSIFY_ERROR',
        message: err.message,
        recoverable: false,
      };

      return this.buildResult(
        metadata,
        fallbackData,
        {
          displayAs: 'json',
          canStream: false,
          estimatedSize: 'small',
        },
        errorDetails
      );
    }
  }
}
