/**
 * Google provider implementation
 * Supports Google's Generative AI models (Gemini)
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
 * Google provider configuration
 */
export interface GoogleConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Google API request/response types
 */
interface GoogleContent {
  role: string;
  parts: Array<{
    text: string;
  }>;
}

interface GoogleGenerateResponse {
  candidates: Array<{
    content: GoogleContent;
    finishReason: string;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Google language model provider
 */
export class GoogleProvider extends BaseLanguageModel {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  public constructor(config: GoogleConfig) {
    super();
    this.validateConfig(config as unknown as Record<string, unknown>, ['apiKey']);

    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gemini-pro';
    this.baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta/models';
    this.timeout = config.timeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  /**
   * Generate text from a prompt using Google API
   */
  public async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    this.logger.debug('Google generate', { prompt, options });

    const response = await this.callGoogle(
      [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      options
    );

    const text = response.candidates[0]?.content.parts[0]?.text ?? '';
    return {
      text,
      tokenCount: {
        input: response.usageMetadata.promptTokenCount,
        output: response.usageMetadata.candidatesTokenCount,
      },
      finishReason: (response.candidates[0]?.finishReason as 'stop' | 'length' | 'error') ?? 'stop',
    };
  }

  /**
   * Classify text into categories using Google
   */
  public async classify(
    text: string,
    labels: string[],
    options?: ClassifyOptions
  ): Promise<ClassificationResult> {
    this.logger.debug('Google classify', { text, labels });

    const prompt = `Classify the following text into one of these categories: ${labels.join(', ')}\n\nText: "${text}"\n\nRespond with only the category name.`;

    const response = await this.callGoogle(
      [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      options
    );

    const label = response.candidates[0]?.content.parts[0]?.text?.trim() ?? '';

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
   * Extract structured data from text using Google
   */
  public async extract(text: string, schema: unknown, options?: ExtractOptions): Promise<unknown> {
    this.logger.debug('Google extract', { text, schema });

    const schemaStr = typeof schema === 'object' ? JSON.stringify(schema) : String(schema);
    const prompt = `Extract data from the following text according to this schema:\n${schemaStr}\n\nText: "${text}"\n\nRespond with valid JSON.`;

    const response = await this.callGoogle(
      [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      options
    );

    const content = response.candidates[0]?.content.parts[0]?.text ?? '{}';

    try {
      return JSON.parse(content);
    } catch {
      this.logger.error('Failed to parse extraction response', { content });
      return {};
    }
  }

  /**
   * Summarize text using Google
   */
  public async summary(text: string, options?: GenerateOptions): Promise<string> {
    this.logger.debug('Google summary', { text });

    const prompt = `Summarize the following text concisely:\n\n${text}`;

    const response = await this.callGoogle(
      [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      options
    );

    return response.candidates[0]?.content.parts[0]?.text ?? '';
  }

  /**
   * Translate text using Google
   */
  public async translate(
    text: string,
    targetLanguage: string,
    options?: GenerateOptions
  ): Promise<string> {
    this.logger.debug('Google translate', { text, targetLanguage });

    const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;

    const response = await this.callGoogle(
      [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      options
    );

    return response.candidates[0]?.content.parts[0]?.text ?? '';
  }

  /**
   * Analyze sentiment using Google
   */
  public async sentiment(text: string, options?: GenerateOptions): Promise<unknown> {
    this.logger.debug('Google sentiment', { text });

    const prompt = `Analyze the sentiment of the following text and respond with a JSON object containing: compound (number between -1 and 1), positive (0-1), negative (0-1), neutral (0-1).\n\nText: "${text}"`;

    const response = await this.callGoogle(
      [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      options
    );

    const content = response.candidates[0]?.content.parts[0]?.text ?? '{}';

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
   * Chat with the model using Google
   */
  public async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    this.logger.debug('Google chat', { messagesCount: messages.length });

    const googleMessages: GoogleContent[] = messages
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    const response = await this.callGoogle(googleMessages, options);

    return response.candidates[0]?.content.parts[0]?.text ?? '';
  }

  /**
   * Count tokens for text
   */
  public async countTokens(text: string): Promise<number> {
    // Rough estimation: ~4 characters per token
    // For accurate counting, use Google's countTokens endpoint
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate provider configuration and API key
   */
  public async validate(): Promise<boolean> {
    try {
      // Test with a simple message
      await this.callGoogle([
        {
          role: 'user',
          parts: [{ text: 'test' }],
        },
      ]);
      return true;
    } catch (error) {
      this.logger.error('Google validation failed', { error });
      return false;
    }
  }

  /**
   * Call Google API
   */
  private async callGoogle(
    messages: GoogleContent[],
    options?: GenerateOptions | ClassifyOptions | ExtractOptions | ChatOptions
  ): Promise<GoogleGenerateResponse> {
    const body = {
      contents: messages,
      generationConfig: {
        temperature: (options as GenerateOptions)?.temperature ?? 0.9,
        maxOutputTokens: (options as GenerateOptions)?.maxTokens ?? 1000,
        topP: (options as GenerateOptions)?.topP ?? 0.95,
        topK: 40,
      },
    };

    let lastError: unknown;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const url = new URL(`${this.baseUrl}/${this.model}:generateContent`);
        url.searchParams.set('key', this.apiKey);

        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
            `Google API error: ${response.status} ${(error as Record<string, unknown>).message ?? ''}`
          );
        }

        return (await response.json()) as GoogleGenerateResponse;
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError ?? new Error('Google API call failed after retries');
  }
}
