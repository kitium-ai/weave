/**
 * Generate operation
 */

import { validateNonEmptyString } from '@weaveai/shared';
import { BaseOperation } from './base.js';
import type {
  GenerateOptions,
  GenerateResult,
  GenerateData,
  WeaveOperationError,
  WeaveEstimatedSize,
} from '../types/index.js';
import { StreamHandler, normalizeStreamingConfig } from '../streaming/index.js';

/**
 * Generate text from a prompt
 */
export class GenerateOperation extends BaseOperation {
  public async execute(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    validateNonEmptyString(prompt, 'prompt');

    const operationId = this.generateOperationId();
    const metadata = this.createMetadata('generate', operationId);
    this.metadata.set(operationId, metadata);

    const normalizedStreaming = normalizeStreamingConfig(options?.streaming);
    const modelOptions: GenerateOptions = { ...(options ?? {}) };
    let streamHandler: StreamHandler<string> | undefined;

    if (normalizedStreaming.enabled) {
      streamHandler = new StreamHandler<string>(operationId, {
        uiContext: normalizedStreaming.uiContext,
      });

      try {
        await streamHandler.start();
      } catch (error) {
        this.logger.warn('Stream handler start failed', { error, operationId });
      }

      const userOnChunk = modelOptions.onChunk;
      modelOptions.streaming = true;

      modelOptions.onChunk = (chunk: string) => {
        if (streamHandler) {
          const result = streamHandler.emitChunk(chunk);
          if (result instanceof Promise) {
            result.catch((error) =>
              this.logger.warn('Stream handler chunk update failed', { error, operationId })
            );
          }
        }

        if (userOnChunk) {
          try {
            const userResult = userOnChunk(chunk);
            if (userResult instanceof Promise) {
              userResult.catch((error) =>
                this.logger.warn('User onChunk handler rejected', { error, operationId })
              );
            }
          } catch (error) {
            this.logger.warn('User onChunk handler threw', { error, operationId });
          }
        }
      };
    } else if (typeof modelOptions.streaming !== 'undefined') {
      modelOptions.streaming = false;
    }

    try {
      this.logger.debug('Starting generate operation', {
        operationId,
        promptLength: prompt.length,
        options: modelOptions,
      });

      const data = await this.model.generate(prompt, modelOptions);

      this.markSuccess(metadata, data.tokenCount);

      this.logger.info('Generate operation completed', {
        operationId,
        duration: metadata.duration,
        tokens: metadata.tokenCount,
      });

      if (streamHandler) {
        try {
          await streamHandler.emitComplete();
        } catch (error) {
          this.logger.warn('Stream handler completion failed', { error, operationId });
        }

        const state = streamHandler.getState();
        data.stream = {
          id: state.id,
          handler: streamHandler,
          totalChunks: state.totalChunks,
          duration: state.durationMs ?? 0,
        };
      }

      const estimatedSize = this.estimateSize(data.text.length);
      const uiMetadata = {
        displayAs: 'text' as const,
        canStream: normalizedStreaming.enabled,
        estimatedSize,
      };

      return this.buildResult(metadata, data, uiMetadata);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.markError(metadata, err);

      this.logger.error('Generate operation failed', err, {
        operationId,
        duration: metadata.duration,
      });

      if (streamHandler) {
        try {
          await streamHandler.emitError(err, false);
        } catch (streamError) {
          this.logger.warn('Stream handler error emission failed', {
            error: streamError,
            operationId,
          });
        }
      }

      const fallbackData: GenerateData = {
        text: '',
        tokenCount: { input: 0, output: 0 },
        finishReason: 'error',
      };

      const errorDetails: WeaveOperationError = {
        code: err.name ?? 'GENERATE_ERROR',
        message: err.message,
        recoverable: false,
      };

      const uiMetadata = {
        displayAs: 'text' as const,
        canStream: normalizedStreaming.enabled,
        estimatedSize: 'small' as WeaveEstimatedSize,
      };

      return this.buildResult(metadata, fallbackData, uiMetadata, errorDetails);
    }
  }

  private estimateSize(length: number): WeaveEstimatedSize {
    if (length <= 280) {
      return 'small';
    }
    if (length <= 2000) {
      return 'medium';
    }
    return 'large';
  }
}
