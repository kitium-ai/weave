/**
 * Extract operation
 */

import { validateNonEmptyString, validateObject } from '@weave/shared';
import { BaseOperation } from './base.js';
import type { ExtractOptions } from '../types/index.js';

/**
 * Extract structured data from text
 */
export class ExtractOperation extends BaseOperation {
  public async execute(text: string, schema: unknown, options?: ExtractOptions): Promise<unknown> {
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

      const result = await this.model.extract(text, schema, options);

      this.markSuccess(metadata);

      this.logger.info('Extract operation completed', {
        operationId,
        duration: metadata.duration,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.markError(metadata, err);

      this.logger.error('Extract operation failed', err, {
        operationId,
        duration: metadata.duration,
      });

      throw err;
    }
  }
}
