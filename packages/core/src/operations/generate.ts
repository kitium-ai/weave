/**
 * Generate operation
 */

import { validateNonEmptyString } from '@weave/shared';
import { BaseOperation } from './base.js';
import type { GenerateOptions, GenerateResult } from '../types/index.js';

/**
 * Generate text from a prompt
 */
export class GenerateOperation extends BaseOperation {
  public async execute(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    validateNonEmptyString(prompt, 'prompt');

    const operationId = this.generateOperationId();
    const metadata = this.createMetadata('generate', operationId);
    this.metadata.set(operationId, metadata);

    try {
      this.logger.debug('Starting generate operation', {
        operationId,
        promptLength: prompt.length,
        options,
      });

      const result = await this.model.generate(prompt, options);

      this.markSuccess(metadata, result.tokenCount);

      this.logger.info('Generate operation completed', {
        operationId,
        duration: metadata.duration,
        tokens: metadata.tokenCount,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.markError(metadata, err);

      this.logger.error('Generate operation failed', err, {
        operationId,
        duration: metadata.duration,
      });

      throw err;
    }
  }
}
