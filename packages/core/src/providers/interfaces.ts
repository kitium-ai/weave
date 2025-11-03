/**
 * Provider interfaces
 */

import type {
  GenerateOptions,
  GenerateData,
  ClassifyOptions,
  ClassificationData,
  ExtractOptions,
  ChatMessage,
  ChatOptions,
} from '../types/index.js';

/**
 * Language model provider interface
 */
export interface ILanguageModel {
  /**
   * Generate text from a prompt
   */
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateData>;

  /**
   * Classify text into categories
   */
  classify(text: string, labels: string[], options?: ClassifyOptions): Promise<ClassificationData>;

  /**
   * Extract structured data from text
   */
  extract(text: string, schema: unknown, options?: ExtractOptions): Promise<unknown>;

  /**
   * Summarize text
   */
  summary(text: string, options?: GenerateOptions): Promise<string>;

  /**
   * Translate text
   */
  translate(text: string, targetLanguage: string, options?: GenerateOptions): Promise<string>;

  /**
   * Analyze sentiment
   */
  sentiment(text: string, options?: GenerateOptions): Promise<unknown>;

  /**
   * Chat with model
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;

  /**
   * Get token count for text
   */
  countTokens(text: string): Promise<number>;

  /**
   * Validate provider configuration
   */
  validate(): Promise<boolean>;

  /**
   * Get provider identity info for observability/cost tracking
   */
  getProviderInfo(): { provider: string; model: string };
}

/**
 * Provider factory type
 */
export type ProviderFactory = (config: unknown) => Promise<ILanguageModel>;
