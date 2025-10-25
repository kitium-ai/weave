/**
 * useAIChat hook - Multi-turn conversation management
 */

import { useState, useCallback } from 'react';
import type { ChatMessage, ChatOptions } from '@weave/core';
import { useWeaveContext } from '../context';

/**
 * useAIChat hook options
 */
export interface UseAIChatOptions {
  initialMessages?: ChatMessage[];
  onError?: (error: Error) => void;
}

/**
 * useAIChat hook return type
 */
export interface UseAIChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string, options?: ChatOptions) => Promise<string | null>;
  clearMessages: () => void;
  addMessage: (message: ChatMessage) => void;
  removeMessage: (index: number) => void;
}

/**
 * Hook for managing multi-turn conversations with AI
 */
export function useAIChat(options?: UseAIChatOptions): UseAIChatReturn {
  const { weave } = useWeaveContext();
  const [messages, setMessages] = useState<ChatMessage[]>(options?.initialMessages ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const removeMessage = useCallback((index: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string, chatOptions?: ChatOptions): Promise<string | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        options?.onError?.(err);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        // Add a user message
        const userMessage: ChatMessage = {
          role: 'user',
          content,
        };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);

        // Get an assistant response from the underlying language model
        const model = weave.getModel();
        const response = await model.chat(updatedMessages, chatOptions);

        // Add an assistant message
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options?.onError?.(error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [weave, messages, options]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    addMessage,
    removeMessage,
  };
}
