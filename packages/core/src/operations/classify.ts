/**
 * Classify operation
 */

import { validateNonEmptyString, validateNonEmptyArray } from '@weave/shared';
import { BaseOperation } from './base.js';
import type { ClassifyOptions, ClassificationResult } from '../types/index.js';

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

      const result = await this.model.classify(text, labels, options);

      this.markSuccess(metadata);

      this.logger.info('Classify operation completed', {
        operationId,
        duration: metadata.duration,
        result: result.label,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.markError(metadata, err);

      this.logger.error('Classify operation failed', err, {
        operationId,
        duration: metadata.duration,
      });

      throw err;
    }
  }
}
