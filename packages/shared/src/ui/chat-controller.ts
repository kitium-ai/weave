/**
 * Framework-agnostic controller for managing conversational AI interactions.
 */

import type { ChatMessage, GenerateOptions, GenerateResult } from '@weaveai/core';
import type { CostSummary } from './ai-controller.js';

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface ChatControllerOptions {
  initialMessages?: ChatMessage[];
  onError?: (error: Error) => void;
  systemPrompt?: string;
  streaming?: {
    enabled: boolean;
    renderer?: 'text' | 'markdown' | 'html' | 'json' | 'component';
    updateFrequency?: number;
    framework?: string;
  };
  persistence?: {
    key?: string;
    autoSave?: boolean;
    storage?: StorageAdapter;
  };
  trackCosts?: boolean;
  maxMessages?: number;
  onOverflow?: 'summarize' | 'truncate';
}

export interface ChatControllerState {
  messages: ChatMessage[];
  isLoading: boolean;
  streaming: boolean;
  error: Error | null;
  costSummary: CostSummary | null;
}

type ChatListener = (state: ChatControllerState) => void;

export type GenerateExecutor = (prompt: string, options?: GenerateOptions) => Promise<GenerateResult>;

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

function getDefaultStorageAdapter(): StorageAdapter | undefined {
  if (typeof globalThis === 'undefined') {
    return undefined;
  }

  const rawStorage = (globalThis as Record<string, unknown>)['localStorage'] as StorageAdapter | undefined;
  if (!rawStorage) {
    return undefined;
  }

  return {
    getItem: (key: string) => rawStorage.getItem(key),
    setItem: (key: string, value: string) => rawStorage.setItem(key, value),
    removeItem: (key: string) => rawStorage.removeItem(key),
  };
}

export class ChatController {
  private readonly listeners = new Set<ChatListener>();
  private state: ChatControllerState;
  private messages: ChatMessage[];
  private readonly options: ChatControllerOptions;
  private readonly generate: GenerateExecutor;
  private readonly storage?: StorageAdapter;
  private readonly storageKey?: string;
  private readonly autoSave: boolean;
  private readonly trackCosts: boolean;
  private readonly maxMessages: number;
  private readonly onOverflow: 'summarize' | 'truncate';
  private readonly systemPrompt: string;
  private readonly streamingOptions: NonNullable<ChatControllerOptions['streaming']>;

  private streamingBuffer = '';
  private streamingLastEmit = 0;
  private assistantIndex: number | null = null;

  constructor(generate: GenerateExecutor, options: ChatControllerOptions = {}) {
    this.generate = generate;
    this.options = options;
    this.systemPrompt = options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.streamingOptions = options.streaming ?? { enabled: false };
    this.trackCosts = options.trackCosts ?? false;
    this.maxMessages = options.maxMessages ?? Infinity;
    this.onOverflow = options.onOverflow ?? 'truncate';
    this.messages = [...(options.initialMessages ?? [])];

    const persistenceOptions = options.persistence ?? {};
    this.storageKey = persistenceOptions.key;
    this.autoSave = persistenceOptions.autoSave ?? false;
    this.storage = persistenceOptions.storage ?? getDefaultStorageAdapter();

    if (this.storageKey && this.storage) {
      const stored = this.safeStorageRead(this.storageKey);
      if (stored) {
        try {
          this.messages = JSON.parse(stored) as ChatMessage[];
        } catch (storageError) {
          console.warn('Failed to parse stored chat history', storageError);
        }
      }
    }

    this.state = {
      messages: [...this.messages],
      isLoading: false,
      streaming: false,
      error: null,
      costSummary: null,
    };
  }

  subscribe(listener: ChatListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): ChatControllerState {
    return this.state;
  }

  async sendMessage(content: string, options?: GenerateOptions): Promise<string | null> {
    try {
      this.updateState({ isLoading: true, streaming: false, error: null });

      const userMessage: ChatMessage = { role: 'user', content };
      const conversationWithUser = [...this.messages, userMessage];
      this.persistMessages(conversationWithUser);

      const streamingEnabled = this.streamingOptions.enabled ?? false;

      if (streamingEnabled) {
        this.assistantIndex = conversationWithUser.length;
        this.streamingBuffer = '';
        this.streamingLastEmit = Date.now();
        this.updateState({ streaming: true });
        this.persistMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      } else {
        this.assistantIndex = null;
      }

      const prompt = this.buildConversationPrompt(conversationWithUser);
      const streamingFramework = (this.streamingOptions.framework ?? 'vanilla') as
        | 'react'
        | 'angular'
        | 'vue'
        | 'svelte'
        | 'vanilla'
        | undefined;

      const result = await this.generate(prompt, {
        ...(options ?? {}),
        streaming: streamingEnabled
          ? {
              enabled: true,
              uiContext: {
                framework: streamingFramework,
              },
            }
          : false,
        onChunk: streamingEnabled
          ? async (chunk: string) => {
              this.streamingBuffer += chunk;
              const now = Date.now();
              if (now - this.streamingLastEmit >= (this.streamingOptions.updateFrequency ?? 120)) {
                this.streamingLastEmit = now;
                this.persistMessages((prev) => {
                  if (this.assistantIndex === null || this.assistantIndex >= prev.length) {
                    return prev;
                  }
                  const next = [...prev];
                  next[this.assistantIndex] = {
                    role: 'assistant',
                    content: this.streamingBuffer,
                  };
                  return next;
                });
              }
            }
          : undefined,
      });

      const assistantText = result.data.text;

      if (this.assistantIndex !== null && streamingEnabled) {
        this.persistMessages((prev) => {
          if (this.assistantIndex === null || this.assistantIndex >= prev.length) {
            return [...prev, { role: 'assistant', content: assistantText }];
          }
          const next = [...prev];
          next[this.assistantIndex] = { role: 'assistant', content: assistantText };
          return next;
        });
      } else {
        this.persistMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
      }

      const normalized = await this.handleOverflow(this.messages);
      if (normalized !== this.messages) {
        this.persistMessages(normalized);
      }

      this.updateCostSummary(result);

      this.updateState({ isLoading: false, streaming: false });

      return assistantText;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.updateState({ error, isLoading: false, streaming: false });
      this.options.onError?.(error);
      return null;
    }
  }

  addMessage(message: ChatMessage): void {
    this.persistMessages((prev) => [...prev, message]);
  }

  removeMessage(index: number): void {
    this.persistMessages((prev) => prev.filter((_, i) => i !== index));
  }

  clear(): void {
    this.persistMessages([]);
    this.updateState({ error: null, costSummary: null });
    if (this.storageKey && this.storage) {
      this.safeStorageRemove(this.storageKey);
    }
  }

  download(): string {
    const payload = JSON.stringify(
      {
        systemPrompt: this.systemPrompt,
        messages: this.messages,
        costSummary: this.state.costSummary,
      },
      null,
      2
    );

    // Best effort to trigger download in browser context
    if (typeof globalThis !== 'undefined' && 'document' in globalThis && 'URL' in globalThis) {
      try {
        const doc = (globalThis as any).document;
        const URLClass = (globalThis as any).URL;
        const BlobClass = (globalThis as any).Blob;

        const blob = new BlobClass([payload], { type: 'application/json' });
        const url = URLClass.createObjectURL(blob);
        const link = doc.createElement('a');
        link.href = url;
        link.download = `weave-chat-${Date.now()}.json`;
        link.click();
        URLClass.revokeObjectURL(url);
      } catch (downloadError) {
        console.warn('Failed to trigger download', downloadError);
      }
    }

    return payload;
  }

  private buildConversationPrompt(conversation: ChatMessage[]): string {
    const transcript = conversation
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    return `SYSTEM: ${this.systemPrompt}\n${transcript}\nASSISTANT:`;
  }

  private buildSummaryPrompt(conversation: ChatMessage[]): string {
    const body = conversation
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    return `Summarize the following conversation, keeping key decisions and action items.\n${body}`;
  }

  private async handleOverflow(current: ChatMessage[]): Promise<ChatMessage[]> {
    if (current.length <= this.maxMessages || this.maxMessages === Infinity) {
      return current;
    }

    if (this.onOverflow === 'summarize') {
      const overflowCount = current.length - this.maxMessages;
      const overflowMessages = current.slice(0, overflowCount + 1);
      try {
        const summaryResult = await this.generate(this.buildSummaryPrompt(overflowMessages), {
          streaming: false,
          temperature: 0.2,
        });
        this.updateCostSummary(summaryResult);
        const summaryMessage: ChatMessage = {
          role: 'assistant',
          content: summaryResult.data.text,
        };
        const remaining = current.slice(overflowCount + 1);
        return [summaryMessage, ...remaining];
      } catch (summaryError) {
        console.warn('Failed to summarize overflow messages', summaryError);
      }
    }

    return current.slice(current.length - this.maxMessages);
  }

  private updateCostSummary(result: GenerateResult): void {
    if (!this.trackCosts) {
      return;
    }

    const cost = result.metadata.cost;
    if (!cost) {
      return;
    }

    const tokens = result.metadata.tokens ?? { input: 0, output: 0 };

    const nextSummary: CostSummary = {
      totalCost: (this.state.costSummary?.totalCost ?? 0) + cost.total,
      currency: cost.currency,
      tokens: {
        input: (this.state.costSummary?.tokens?.input ?? 0) + (tokens.input ?? 0),
        output: (this.state.costSummary?.tokens?.output ?? 0) + (tokens.output ?? 0),
      },
    };

    this.updateState({ costSummary: nextSummary });
  }

  private persistMessages(
    next: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
  ): ChatMessage[] {
    const resolved = typeof next === 'function' ? next(this.messages) : next;
    this.messages = [...resolved];
    this.updateState({ messages: [...this.messages] });

    if (this.autoSave && this.storage && this.storageKey) {
      try {
        this.storage.setItem(this.storageKey, JSON.stringify(this.messages));
      } catch (storageError) {
        console.warn('Failed to persist chat history', storageError);
      }
    }

    return this.messages;
  }

  private safeStorageRead(key: string): string | null {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch (err) {
      console.warn('Failed to read chat history from storage', err);
      return null;
    }
  }

  private safeStorageRemove(key: string): void {
    try {
      this.storage?.removeItem(key);
    } catch (err) {
      console.warn('Failed to clear chat history', err);
    }
  }

  private updateState(patch: Partial<ChatControllerState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
