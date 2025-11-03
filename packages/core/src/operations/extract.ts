/**
 * Extract operation
 */

import { validateNonEmptyString, validateObject } from '@weaveai/shared';
import { BaseOperation } from './base.js';
import type { ExtractOptions, ExtractResult, WeaveOperationError } from '../types/index.js';

/**
 * Extract structured data from text
 */
export class ExtractOperation extends BaseOperation {
  public async execute<T = unknown>(
    text: string,
    schema: unknown,
    options?: ExtractOptions
  ): Promise<ExtractResult<T>> {
    validateNonEmptyString(text, 'text');
    validateObject(schema, 'schema');

    const operationId = this.generateOperationId();
    const metadata = this.createMetadata('extract', operationId);
    this.metadata.set(operationId, metadata);

    try {
      this.logger.debug('Starting extract operation', {
        operationId,
        textLength: text.length,
        options,
      });

      const data = (await this.model.extract(text, schema, options)) as T;

      this.markSuccess(metadata);

      this.logger.info('Extract operation completed', {
        operationId,
        duration: metadata.duration,
      });

      return this.buildResult<T>(
        metadata,
        data,
        {
          displayAs: 'json',
          canStream: false,
          estimatedSize: 'medium',
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.markError(metadata, err);

      this.logger.error('Extract operation failed', err, {
        operationId,
        duration: metadata.duration,
      });

      const errorDetails: WeaveOperationError = {
        code: err.name ?? 'EXTRACT_ERROR',
        message: err.message,
        recoverable: false,
      };

      return this.buildResult<T>(
        metadata,
        null as unknown as T,
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
