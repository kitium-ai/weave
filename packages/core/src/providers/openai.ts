/**
 * OpenAI provider implementation
 * Supports GPT-4, GPT-3.5, and other OpenAI models
 */

import { BaseLanguageModel } from './base.js';
import type {
  GenerateOptions,
  GenerateData,
  ClassifyOptions,
  ClassificationData,
  ExtractOptions,
  ChatMessage,
  ChatOptions,
} from '../types';

/**
 * OpenAI provider configuration
 */
export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * OpenAI API response types
 */
interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenAICompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: OpenAIMessage;
    text?: string;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI language model provider
 */
export class OpenAIProvider extends BaseLanguageModel {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  public constructor(config: OpenAIConfig) {
    super();
    this.validateConfig(config as unknown as Record<string, unknown>, ['apiKey']);

    this.apiKey = config.apiKey;
    this.model = config.model ?? 'gpt-3.5-turbo';
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
    this.timeout = config.timeout ?? 30000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  /**
   * Generate text from a prompt using OpenAI API
   */
  public async generate(prompt: string, options?: GenerateOptions): Promise<GenerateData> {
    this.logger.debug('OpenAI generate', { prompt, options });
    const messages: OpenAIMessage[] = [{ role: 'user', content: prompt }];

    if (options?.streaming && options.onChunk) {
      const text = await this.callOpenAIStream(messages, options.onChunk, options);
      const input = await this.countTokens(prompt);
      const output = await this.countTokens(text);
      return {
        text,
        tokenCount: { input, output },
        finishReason: 'stop',
      };
    }

    const response = await this.callOpenAI(messages, options);

    const text = response.choices[0]?.message?.content ?? response.choices[0]?.text ?? '';
    const responseData: GenerateData = {
      text,
      tokenCount: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
      },
      finishReason: (response.choices[0]?.finish_reason as 'stop' | 'length' | 'error') ?? 'stop',
    };
    return responseData;
  }

  /**
   * Classify text into categories using OpenAI
   */
  public async classify(
    text: string,
    labels: string[],
    options?: ClassifyOptions
  ): Promise<ClassificationData> {
    this.logger.debug('OpenAI classify', { text, labels });

    const prompt = `Classify the following text into one of these categories: ${labels.join(', ')}\n\nText: "${text}"\n\nRespond with only the category name.`;

    const response = await this.callOpenAI(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    const label = response.choices[0]?.message?.content?.trim() ?? '';

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
   * Extract structured data from text using OpenAI
   */
  public async extract(text: string, schema: unknown, options?: ExtractOptions): Promise<unknown> {
    this.logger.debug('OpenAI extract', { text, schema });

    const schemaStr = typeof schema === 'object' ? JSON.stringify(schema) : String(schema);
    const prompt = `Extract data from the following text according to this schema:\n${schemaStr}\n\nText: "${text}"\n\nRespond with valid JSON.`;

    const response = await this.callOpenAI(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    const content = response.choices[0]?.message?.content ?? '{}';

    try {
      return JSON.parse(content);
    } catch {
      this.logger.error('Failed to parse extraction response', { content });
      return {};
    }
  }

  /**
   * Summarize text using OpenAI
   */
  public async summary(text: string, options?: GenerateOptions): Promise<string> {
    this.logger.debug('OpenAI summary', { text });

    const prompt = `Summarize the following text concisely:\n\n${text}`;

    const response = await this.callOpenAI(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    return response.choices[0]?.message?.content ?? '';
  }

  /**
   * Translate text using OpenAI
   */
  public async translate(
    text: string,
    targetLanguage: string,
    options?: GenerateOptions
  ): Promise<string> {
    this.logger.debug('OpenAI translate', { text, targetLanguage });

    const prompt = `Translate the following text to ${targetLanguage}:\n\n${text}`;

    const response = await this.callOpenAI(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    return response.choices[0]?.message?.content ?? '';
  }

  /**
   * Analyze sentiment using OpenAI
   */
  public async sentiment(text: string, options?: GenerateOptions): Promise<unknown> {
    this.logger.debug('OpenAI sentiment', { text });

    const prompt = `Analyze the sentiment of the following text and respond with a JSON object containing: compound (number between -1 and 1), positive (0-1), negative (0-1), neutral (0-1).\n\nText: "${text}"`;

    const response = await this.callOpenAI(
      [
        {
          role: 'user',
          content: prompt,
        },
      ],
      options
    );

    const content = response.choices[0]?.message?.content ?? '{}';

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
   * Chat with the model using OpenAI
   */
  public async chat(messages: ChatMessage[], options?: ChatOptions): Promise<string> {
    this.logger.debug('OpenAI chat', { messagesCount: messages.length });
    const openaiMessages: OpenAIMessage[] = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    if (options?.streaming && options.onChunk) {
      return await this.callOpenAIStream(openaiMessages, options.onChunk, options);
    }

    const response = await this.callOpenAI(openaiMessages, options);

    return response.choices[0]?.message?.content ?? '';
  }

  /**
   * Count tokens for text
   */
  public async countTokens(text: string): Promise<number> {
    // Rough estimation: ~4 characters per token
    // For accurate counting, you'd need to use OpenAI's tokenizer
    return Math.ceil(text.length / 4);
  }

  public getProviderInfo(): { provider: string; model: string } {
    return { provider: 'openai', model: this.model };
  }

  /**
   * Validate provider configuration and API key
   */
  public async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models/${this.model}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      return response.ok;
    } catch (error) {
      this.logger.error('OpenAI validation failed', { error });
      return false;
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    messages: OpenAIMessage[],
    options?: GenerateOptions | ClassifyOptions | ExtractOptions | ChatOptions
  ): Promise<OpenAICompletionResponse> {
    const body = {
      model: this.model,
      messages,
      temperature: (options as GenerateOptions)?.temperature ?? 0.7,
      max_tokens: (options as GenerateOptions)?.maxTokens ?? 1000,
      top_p: (options as GenerateOptions)?.topP ?? 1,
      frequency_penalty: (options as GenerateOptions)?.frequencyPenalty ?? 0,
      presence_penalty: (options as GenerateOptions)?.presencePenalty ?? 0,
    };

    let lastError: unknown;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
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
            `OpenAI API error: ${response.status} ${(error as Record<string, unknown>).message ?? ''}`
          );
        }

        return (await response.json()) as OpenAICompletionResponse;
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError ?? new Error('OpenAI API call failed after retries');
  }

  /**
   * Stream from OpenAI API via SSE
   */
  private async callOpenAIStream(
    messages: OpenAIMessage[],
    onChunk: (chunk: string) => void,
    options?: GenerateOptions | ChatOptions
  ): Promise<string> {
    const body = {
      model: this.model,
      messages,
      stream: true,
      temperature: (options as GenerateOptions)?.temperature ?? 0.7,
      max_tokens: (options as GenerateOptions)?.maxTokens ?? 1000,
      top_p: (options as GenerateOptions)?.topP ?? 1,
      frequency_penalty: (options as GenerateOptions)?.frequencyPenalty ?? 0,
      presence_penalty: (options as GenerateOptions)?.presencePenalty ?? 0,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI stream error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let buffer = '';
    let fullText = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) {
            continue;
          }
          const data = trimmed.replace(/^data:\s*/, '');
          if (data === '[DONE]') {
            done = true;
            break;
          }
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.text ?? '';
            if (delta) {
              fullText += delta;
              onChunk(delta);
            }
          } catch {
            // ignore parse errors for keep-alives
          }
        }
      }
    }

    return fullText;
  }
}
