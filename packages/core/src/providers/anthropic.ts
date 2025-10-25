/**
 * Anthropic provider implementation
 * Supports Claude and other Anthropic models
 */

import { BaseLanguageModel } from './base.js';
import type {
  GenerateOptions,
  GenerateResult,
  ClassifyOptions,
  ClassificationResult,
  ExtractOptions,
  ChatMessage,
  ChatOptions,
} from '../types';

/**
 * Anthropic provider configuration
 */
export interface AnthropicConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Anthropic API request format
 */
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicCompletionResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic language model provider
 */
export class AnthropicProvider extends BaseLanguageModel {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  public constructor(config: AnthropicConfig) {
    super();
    this.validateConfig(config as unknown as Record<string, unknown>, ['apiKey']);

    this.apiKey = config.apiKey;
    this.model = config.model ?? 'claude-3-sonnet-20240229';
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com/v1';
    this.timeout = config.timeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  /**
   * Generate text from a prompt using Anthropic API
   */
  public async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    this.logger.debug('Anthropic generate', { prompt, options });

    const response = await this.callAnthropic(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    const text = response.content[0]?.text ?? '';
    return {
      text,
      tokenCount: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      finishReason: (response.stop_reason as 'stop' | 'length' | 'error') ?? 'stop',
    };
  }

  /**
   * Classify text into categories using Anthropic
   */
  public async classify(
    text: string,
    labels: string[],
    options?: ClassifyOptions
  ): Promise<ClassificationResult> {
    this.logger.debug('Anthropic classify', { text, labels });

    const prompt = `Classify the following text into one of these categories: ${labels.join(', ')}\n\nText: "${text}"\n\nRespond with only the category name.`;

    const response = await this.callAnthropic(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    const label = response.content[0]?.text?.trim() ?? '';

    return {
      label,
      confidence: 0.95,
      scores: labels.reduce(
        (acc, lbl) => {
          acc[lbl] = lbl === label ? 0.95 : 0.05 / (labels.length - 1);
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  /**
   * Extract structured data from text using Anthropic
   */
  public async extract(text: string, schema: unknown, options?: ExtractOptions): Promise<unknown> {
    this.logger.debug('Anthropic extract', { text, schema });

    const schemaStr = typeof schema === 'object' ? JSON.stringify(schema) : String(schema);
    const prompt = `Extract data from the following text according to this schema:\n${schemaStr}\n\nText: "${text}"\n\nRespond with valid JSON.`;

    const response = await this.callAnthropic(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    const content = response.content[0]?.text ?? '{}';

    try {
      return JSON.parse(content);
    } catch {
      this.logger.error('Failed to parse extraction response', { content });
      return {};
    }
  }

  /**
   * Summarize text using Anthropic
   */
  public async summary(text: string, options?: GenerateOptions): Promise<string> {
    this.logger.debug('Anthropic summary', { text });

    const prompt = `Summarize the following text concisely:\n\n${text}`;

    const response = await this.callAnthropic(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    return response.content[0]?.text ?? '';
  }

  /**
   * Translate text using Anthropic
   */
  public async translate(
    text: string,
    targetLanguage: string,
    options?: GenerateOptions
  ): Promise<string> {
    this.logger.debug('Anthropic translate', { text, targetLanguage });

    const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;

    const response = await this.callAnthropic(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    return response.content[0]?.text ?? '';
  }

  /**
   * Analyze sentiment using Anthropic
   */
  public async sentiment(text: string, options?: GenerateOptions): Promise<unknown> {
    this.logger.debug('Anthropic sentiment', { text });

    const prompt = `Analyze the sentiment of the following text and respond with a JSON object containing: compound (number between -1 and 1), positive (0-1), negative (0-1), neutral (0-1).\n\nText: "${text}"`;

    const response = await this.callAnthropic(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    const content = response.content[0]?.text ?? '{}';

    try {
      return JSON.parse(content);
    } catch {
      return {
        compound: 0,
        positive: 0,
        negative: 0,
        neutral: 1,
      };
    }
  }

  /**
   * Chat with the model using Anthropic
   */
  public async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    this.logger.debug('Anthropic chat', { messagesCount: messages.length });

    const anthropicMessages: AnthropicMessage[] = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const response = await this.callAnthropic(anthropicMessages, options);

    return response.content[0]?.text ?? '';
  }

  /**
   * Count tokens for text
   */
  public async countTokens(text: string): Promise<number> {
    // Rough estimation: ~4 characters per token
    // For accurate counting, use Anthropic's token counting API
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate provider configuration and API key
   */
  public async validate(): Promise<boolean> {
    try {
      // Test with a simple message
      await this.callAnthropic([
        {
          role: 'user',
          content: 'test',
        },
      ]);
      return true;
    } catch (error) {
      this.logger.error('Anthropic validation failed', { error });
      return false;
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    messages: AnthropicMessage[],
    options?: GenerateOptions | ClassifyOptions | ExtractOptions | ChatOptions
  ): Promise<AnthropicCompletionResponse> {
    const body = {
      model: this.model,
      max_tokens: (options as GenerateOptions)?.maxTokens ?? 1000,
      temperature: (options as GenerateOptions)?.temperature ?? 1,
      messages,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          const error = await response.json();
          lastError = error;

          if (response.status === 429) {
            // Rate limited, retry
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            continue;
          }

          throw new Error(
            `Anthropic API error: ${response.status} ${(error as Record<string, unknown>).message ?? ''}`
          );
        }

        return (await response.json()) as AnthropicCompletionResponse;
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError ?? new Error('Anthropic API call failed after retries');
  }
}
