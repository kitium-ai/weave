/**
 * Svelte store wrapper for chat controller.
 */

import { writable } from 'svelte/store';
import type { Readable } from 'svelte/store';
import type { Weave, ChatMessage, GenerateOptions } from '@weaveai/core';
import {
  ChatController,
  type ChatControllerOptions,
  type ChatControllerState,
  type CostSummary,
} from '@weaveai/shared';

export interface ChatStoreState {
  messages: ChatMessage[];
  isLoading: boolean;
  streaming: boolean;
  error: Error | null;
  costSummary: CostSummary | null;
}

export interface ChatStore {
  state: Readable<ChatStoreState>;
  sendMessage: (content: string, options?: GenerateOptions) => Promise<string | null>;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (index: number) => void;
  clear: () => void;
  download: () => string;
  configure: (options: ChatControllerOptions) => void;
  dispose: () => void;
}

const DEFAULT_OPTIONS: ChatControllerOptions = {
  streaming: { enabled: false, framework: 'svelte' },
};

export function createChatStore(
  weave: Weave,
  options?: ChatControllerOptions
): ChatStore {
  let controller = new ChatController(
    (prompt, generateOptions) => weave.generate(prompt, generateOptions),
    { ...DEFAULT_OPTIONS, ...(options ?? {}) }
  );

  const initial = controller.getState();
  const { subscribe, set } = writable<ChatStoreState>({
    messages: [...initial.messages],
    isLoading: initial.isLoading,
    streaming: initial.streaming,
    error: initial.error,
    costSummary: initial.costSummary,
  });

  let unsubscribe = controller.subscribe((state: ChatControllerState) => {
    set({
      messages: [...state.messages],
      isLoading: state.isLoading,
      streaming: state.streaming,
      error: state.error,
      costSummary: state.costSummary,
    });
  });

  const reconfigure = (nextOptions: ChatControllerOptions) => {
    unsubscribe();
    controller = new ChatController(
      (prompt, generateOptions) => weave.generate(prompt, generateOptions),
      { ...DEFAULT_OPTIONS, ...nextOptions }
    );
    const snapshot = controller.getState();
    set({
      messages: [...snapshot.messages],
      isLoading: snapshot.isLoading,
      streaming: snapshot.streaming,
      error: snapshot.error,
      costSummary: snapshot.costSummary,
    });
    unsubscribe = controller.subscribe((state: ChatControllerState) => {
      set({
        messages: [...state.messages],
        isLoading: state.isLoading,
        streaming: state.streaming,
        error: state.error,
        costSummary: state.costSummary,
      });
    });
  };

  const dispose = () => {
    unsubscribe();
  };

  return {
    state: { subscribe },
    sendMessage: (content, opts) => controller.sendMessage(content, opts),
    addMessage: (message) => controller.addMessage(message),
    removeMessage: (index) => controller.removeMessage(index),
    clear: () => controller.clear(),
    download: () => controller.download(),
    configure: reconfigure,
    dispose,
  };
}
