/**
 * React Native hook for managing conversational AI flows.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  messages: ChatMessage[];
  isLoading: boolean;
  streaming: boolean;
  error: Error | null;
  costSummary: CostSummary | null;
  sendMessage: (content: string, options?: GenerateOptions) => Promise<string | null>;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (index: number) => void;
  clear: () => void;
  download: () => string;
}

function mapOptions(options?: UseAIChatOptions): ChatControllerOptions {
  if (!options) {
    return {
      streaming: { enabled: false, framework: 'react-native' },
    };
  }

  return {
    initialMessages: options.initialMessages,
    onError: options.onError,
    systemPrompt: options.systemPrompt,
    streaming: options.streaming
      ? {
          ...options.streaming,
          framework: 'react-native',
        }
      : { enabled: false, framework: 'react-native' },
    persistence: options.persistence?.localStorage
      ? {
          key: options.persistence.localStorage,
          autoSave: options.persistence.autoSave,
        }
      : options.persistence?.autoSave
        ? { autoSave: options.persistence.autoSave }
        : undefined,
    trackCosts: options.trackCosts,
    maxMessages: options.maxMessages,
    onOverflow: options.onOverflow,
  };
}

export function useAIChat(weave: Weave, options?: UseAIChatOptions): UseAIChatReturn {
  const controllerRef = useRef<ChatController | null>(null);
  const controllerOptions = useMemo(() => mapOptions(options), [options]);
  const generateExecutor = useCallback(
    (prompt: string, generateOptions?: GenerateOptions) => weave.generate(prompt, generateOptions),
    [weave]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);

  useEffect(() => {
    const controller = new ChatController(generateExecutor, controllerOptions);
    controllerRef.current = controller;

    const initial = controller.getState();
    setMessages(initial.messages);
    setIsLoading(initial.isLoading);
    setIsStreaming(initial.streaming);
    setError(initial.error);
    setCostSummary(initial.costSummary);

    const unsubscribe = controller.subscribe((state: ChatControllerState) => {
      setMessages(state.messages);
      setIsLoading(state.isLoading);
      setIsStreaming(state.streaming);
      setError(state.error);
      setCostSummary(state.costSummary);
    });

    return () => {
      unsubscribe();
    };
  }, [generateExecutor, controllerOptions]);

  const sendMessage = useCallback((content: string, generateOptions?: GenerateOptions) => {
    const controller = controllerRef.current;
    if (!controller) {
      return Promise.resolve(null);
    }
    return controller.sendMessage(content, generateOptions);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    controllerRef.current?.addMessage(message);
  }, []);

  const removeMessage = useCallback((index: number) => {
    controllerRef.current?.removeMessage(index);
  }, []);

  const clear = useCallback(() => {
    controllerRef.current?.clear();
  }, []);

  const download = useCallback(() => {
    return controllerRef.current?.download() ?? '';
  }, []);

  return {
    messages,
    isLoading,
    streaming: isStreaming,
    error,
    costSummary,
    sendMessage,
    addMessage,
    removeMessage,
    clear,
    download,
  };
}
