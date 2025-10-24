/**
 * Mock provider for testing
 */

import type {
  GenerateOptions,
  GenerateResult,
  ClassifyOptions,
  ClassificationResult,
  ExtractOptions,
  ChatMessage,
  ChatOptions,
} from '../types/index.js';
import type { ILanguageModel } from './interfaces.js';

/**
 * Mock language model for testing
 */
export class MockLanguageModel implements ILanguageModel {
  public constructor(
    private readonly responses: Map<string, unknown> = new Map(),
    private readonly delays: Map<string, number> = new Map()
  ) {}

  public async generate(prompt: string, _options?: GenerateOptions): Promise<GenerateResult> {
    await this.simulateDelay('generate');

    const mockText = this.responses.get(`generate:${prompt}`) ?? `Mock response to: ${prompt}`;

    return {
      text: String(mockText),
      tokenCount: {
        input: prompt.split(' ').length,
        output: String(mockText).split(' ').length,
      },
      finishReason: 'stop',
    };
  }

  public async classify(
    text: string,
    labels: string[],
    _options?: ClassifyOptions
  ): Promise<ClassificationResult> {
    await this.simulateDelay('classify');

    const mockLabel = this.responses.get(`classify:${text}`) ?? labels[0];

    return {
      label: String(mockLabel),
      confidence: 0.95,
      scores: Object.fromEntries(labels.map((label) => [label, label === mockLabel ? 0.95 : 0.05])),
    };
  }

  public async extract(text: string, schema: unknown, _options?: ExtractOptions): Promise<unknown> {
    await this.simulateDelay('extract');

    return this.responses.get(`extract:${text}`) ?? schema;
  }

  public async summary(text: string, _options?: GenerateOptions): Promise<string> {
    await this.simulateDelay('summary');

    const mockSummary =
      this.responses.get(`summary:${text}`) ?? `Summary of: ${text.substring(0, 20)}...`;

    return String(mockSummary);
  }

  public async translate(
    text: string,
    targetLanguage: string,
    _options?: GenerateOptions
  ): Promise<string> {
    await this.simulateDelay('translate');

    const mockTranslation =
      this.responses.get(`translate:${text}:${targetLanguage}`) ?? `[${targetLanguage}] ${text}`;

    return String(mockTranslation);
  }

  public async sentiment(text: string, _options?: GenerateOptions): Promise<unknown> {
    await this.simulateDelay('sentiment');

    return (
      this.responses.get(`sentiment:${text}`) ?? {
        compound: 0.5,
        positive: 0.3,
        negative: 0.2,
        neutral: 0.5,
      }
    );
  }

  public async chat(messages: ChatMessage[], _options?: ChatOptions): Promise<string> {
    await this.simulateDelay('chat');

    const lastMessage = messages[messages.length - 1];
    const mockResponse = this.responses.get(`chat:${lastMessage.content}`) ?? 'Mock response';

    return String(mockResponse);
  }

  public async countTokens(text: string): Promise<number> {
    await this.simulateDelay('countTokens');

    return text.split(' ').length;
  }

  public async validate(): Promise<boolean> {
    await this.simulateDelay('validate');

    return true;
  }

  public setResponse(key: string, response: unknown): void {
    this.responses.set(key, response);
  }

  public setDelay(operation: string, delayMs: number): void {
    this.delays.set(operation, delayMs);
  }

  private async simulateDelay(operation: string): Promise<void> {
    const delay = this.delays.get(operation) ?? 0;
    if (delay > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
    }
  }
}
