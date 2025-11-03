/**
 * Vue composable for multi-turn AI chat with streaming and persistence.
 */

import { ref, inject, onBeforeUnmount, type Ref } from 'vue';
import type { Weave, ChatMessage, GenerateOptions } from '@weaveai/core';
import {
  ChatController,
  type ChatControllerOptions,
  type ChatControllerState,
  type CostSummary,
} from '@weaveai/shared';

export interface UseAIChatOptions {
  initialMessages?: ChatMessage[];
  onError?: (error: Error) => void;
  systemPrompt?: string;
  streaming?: {
    enabled: boolean;
    renderer?: 'text' | 'markdown' | 'html' | 'json' | 'component';
    updateFrequency?: number;
  };
  persistence?: {
    localStorage?: string;
    autoSave?: boolean;
  };
  trackCosts?: boolean;
  maxMessages?: number;
  onOverflow?: 'summarize' | 'truncate';
}

export interface UseAIChatReturn {
  messages: Ref<ChatMessage[]>;
  isLoading: Ref<boolean>;
  streaming: Ref<boolean>;
  error: Ref<Error | null>;
  costSummary: Ref<CostSummary | null>;
  sendMessage: (content: string, options?: GenerateOptions) => Promise<string | null>;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (index: number) => void;
  clear: () => void;
  download: () => string;
}

function mapOptions(options?: UseAIChatOptions): ChatControllerOptions {
  if (!options) {
    return {
      streaming: { enabled: false, framework: 'vue' },
    };
  }

  const mapped: ChatControllerOptions = {
    initialMessages: options.initialMessages,
    onError: options.onError,
    systemPrompt: options.systemPrompt,
    streaming: options.streaming
      ? {
          ...options.streaming,
          framework: 'vue',
        }
      : { enabled: false, framework: 'vue' },
    persistence: options.persistence?.localStorage
      ? {
          key: options.persistence.localStorage,
          autoSave: options.persistence.autoSave,
        }
      : options.persistence?.autoSave
      ? {
          autoSave: options.persistence.autoSave,
        }
      : undefined,
    trackCosts: options.trackCosts,
    maxMessages: options.maxMessages,
    onOverflow: options.onOverflow,
  };

  return mapped;
}

export function useAIChat(options?: UseAIChatOptions): UseAIChatReturn {
  const weave = inject<Weave>('weave');

  const controller = new ChatController(
    async (prompt, generateOptions) => {
      if (!weave) {
        throw new Error('Weave instance not available');
      }
      return weave.generate(prompt, generateOptions);
    },
    mapOptions(options)
  );

  const state = controller.getState();
  const messages = ref<ChatMessage[]>([...state.messages]);
  const isLoading = ref(state.isLoading);
  const streaming = ref(state.streaming);
  const error = ref<Error | null>(state.error);
  const costSummary = ref<CostSummary | null>(state.costSummary);

  const unsubscribe = controller.subscribe((next: ChatControllerState) => {
    messages.value = [...next.messages];
    isLoading.value = next.isLoading;
    streaming.value = next.streaming;
    error.value = next.error;
    costSummary.value = next.costSummary;
  });

  onBeforeUnmount(() => {
    unsubscribe();
  });

  return {
    messages,
    isLoading,
    streaming,
    error,
    costSummary,
    sendMessage: (content: string, generateOptions?: GenerateOptions) =>
      controller.sendMessage(content, generateOptions),
    addMessage: (message: ChatMessage) => controller.addMessage(message),
    removeMessage: (index: number) => controller.removeMessage(index),
    clear: () => controller.clear(),
    download: () => controller.download(),
  };
}
