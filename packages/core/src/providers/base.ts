/**
 * Base provider class
 */

import { getLogger } from '@weaveai/shared';
import type { ILanguageModel } from './interfaces.js';
import type {
  GenerateOptions,
  GenerateData,
  ClassifyOptions,
  ClassificationData,
  ExtractOptions,
  ChatMessage,
  ChatOptions,
} from '../types/index.js';
import { OperationNotSupportedError } from '../errors/index.js';

/**
 * Base class for language model providers
 */
export abstract class BaseLanguageModel implements ILanguageModel {
  protected readonly logger = getLogger();

  public abstract validate(): Promise<boolean>;

  public abstract countTokens(text: string): Promise<number>;

  public abstract getProviderInfo(): { provider: string; model: string };

  public async generate(prompt: string, options?: GenerateOptions): Promise<GenerateData> {
    throw new OperationNotSupportedError('generate', this.constructor.name, {
      prompt,
      options,
    });
  }

  public async classify(
    text: string,
    labels: string[],
    options?: ClassifyOptions
  ): Promise<ClassificationData> {
    throw new OperationNotSupportedError('classify', this.constructor.name, {
      text,
      labels,
      options,
    });
  }

  public async extract(text: string, schema: unknown, options?: ExtractOptions): Promise<unknown> {
    throw new OperationNotSupportedError('extract', this.constructor.name, {
      text,
      schema,
      options,
    });
  }

  public async summary(text: string, options?: GenerateOptions): Promise<string> {
    throw new OperationNotSupportedError('summary', this.constructor.name, {
      text,
      options,
    });
  }

  public async translate(
    text: string,
    targetLanguage: string,
    options?: GenerateOptions
  ): Promise<string> {
    throw new OperationNotSupportedError('translate', this.constructor.name, {
      text,
      targetLanguage,
      options,
    });
  }

  public async sentiment(text: string, options?: GenerateOptions): Promise<unknown> {
    throw new OperationNotSupportedError('sentiment', this.constructor.name, {
      text,
      options,
    });
  }

  public async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    throw new OperationNotSupportedError('chat', this.constructor.name, {
      messagesCount: messages.length,
      options,
    });
  }

  /**
   * Validate required configuration fields
   */
  protected validateConfig(config: Record<string, unknown>, requiredFields: string[]): void {
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (!config[field]) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      this.logger.error(`Missing required config fields: ${missing.join(', ')}`);
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}
