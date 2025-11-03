/**
 * useAIChat hook - Multi-turn conversation management with streaming, persistence, and cost tracking
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, GenerateOptions, GenerateResult } from '@weaveai/core';
import type { CostSummary } from './useAI.js';
import { useWeaveContext } from '../context/WeaveContext.js';

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

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

/**
 * Hook for managing multi-turn conversations with AI
 */
export function useAIChat(options?: UseAIChatOptions): UseAIChatReturn {
  const { weave } = useWeaveContext();
  const persistenceKey = options?.persistence?.localStorage;
  const autoSave = options?.persistence?.autoSave ?? false;
  const streamingConfig = options?.streaming ?? { enabled: false };
  const streamingUpdateFrequency = streamingConfig.updateFrequency ?? 120;
  const systemPrompt = options?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  const trackCosts = options?.trackCosts ?? false;
  const maxMessages = options?.maxMessages ?? Infinity;
  const onOverflow = options?.onOverflow ?? 'truncate';

  const [messages, setMessages] = useState<ChatMessage[]>(options?.initialMessages ?? []);
  const messagesRef = useRef<ChatMessage[]>(options?.initialMessages ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);

  const streamingBufferRef = useRef('');
  const streamingLastEmitRef = useRef(0);
  const assistantIndexRef = useRef<number | null>(null);

  const persistMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setMessages((prev) => {
        const next =
          typeof updater === 'function' ? (updater as (prev: ChatMessage[]) => ChatMessage[])(prev) : updater;
        messagesRef.current = next;
        if (autoSave && persistenceKey && typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(persistenceKey, JSON.stringify(next));
          } catch (storageError) {
            console.warn('Failed to persist chat history', storageError);
          }
        }
        return next;
      });
    },
    [autoSave, persistenceKey]
  );

  const clearPersistence = useCallback(() => {
    if (persistenceKey && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(persistenceKey);
      } catch (storageError) {
        console.warn('Failed to clear chat persistence', storageError);
      }
    }
  }, [persistenceKey]);

  useEffect(() => {
    if (!persistenceKey || typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(persistenceKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        messagesRef.current = parsed;
        setMessages(parsed);
      }
    } catch (storageError) {
      console.warn('Failed to load persisted chat history', storageError);
    }
  }, [persistenceKey]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const updateCostSummary = useCallback(
    (result: GenerateResult) => {
      const cost = result.metadata.cost;
      if (!trackCosts || !cost) {
        return;
      }

      setCostSummary((prev) => {
        const tokens = result.metadata.tokens ?? { input: 0, output: 0 };
        if (!prev) {
          return {
            totalCost: cost.total,
            currency: cost.currency,
            tokens: {
              input: tokens.input ?? 0,
              output: tokens.output ?? 0,
            },
          };
        }

        return {
          totalCost: prev.totalCost + cost.total,
          currency: cost.currency,
          tokens: {
            input: prev.tokens.input + (tokens.input ?? 0),
            output: prev.tokens.output + (tokens.output ?? 0),
          },
        };
      });
    },
    [trackCosts]
  );

  const buildConversationPrompt = useCallback(
    (conversation: ChatMessage[]): string => {
      const transcript = conversation
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');

      return `SYSTEM: ${systemPrompt}\n${transcript}\nASSISTANT:`;
    },
    [systemPrompt]
  );

  const buildSummaryPrompt = useCallback((conversation: ChatMessage[]): string => {
    const body = conversation
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    return `Summarize the following conversation, keeping key decisions and action items.\n${body}`;
  }, []);

  const handleOverflow = useCallback(
    async (current: ChatMessage[]): Promise<ChatMessage[]> => {
      if (current.length <= maxMessages || maxMessages === Infinity) {
        return current;
      }

      if (onOverflow === 'summarize' && weave) {
        const overflowCount = current.length - maxMessages;
        const overflowMessages = current.slice(0, overflowCount + 1);
        try {
          const summaryResult = await weave.generate(buildSummaryPrompt(overflowMessages), {
            streaming: false,
            temperature: 0.2,
          });
          updateCostSummary(summaryResult);
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

      return current.slice(current.length - maxMessages);
    },
    [buildSummaryPrompt, maxMessages, onOverflow, updateCostSummary, weave]
  );

  const addMessage = useCallback(
    (message: ChatMessage) => {
      persistMessages((prev) => [...prev, message]);
    },
    [persistMessages]
  );

  const removeMessage = useCallback(
    (index: number) => {
      persistMessages((prev) => prev.filter((_, i) => i !== index));
    },
    [persistMessages]
  );

  const clear = useCallback(() => {
    persistMessages([]);
    setError(null);
    setCostSummary(null);
    clearPersistence();
  }, [clearPersistence, persistMessages]);

  const download = useCallback((): string => {
    const payload = JSON.stringify(
      {
        systemPrompt,
        messages: messagesRef.current,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );

    if (typeof window !== 'undefined') {
      try {
        const blob = new Blob([payload], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `weave-chat-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (downloadError) {
        console.warn('Failed to trigger download', downloadError);
      }
    }

    return payload;
  }, [systemPrompt]);

  const sendMessage = useCallback(
    async (content: string, generateOptions?: GenerateOptions): Promise<string | null> => {
      if (!weave) {
        const err = new Error('Weave instance not available');
        setError(err);
        options?.onError?.(err);
        return null;
      }

      const streamingEnabled = streamingConfig.enabled ?? false;

      try {
        setIsLoading(true);
        setError(null);

        const userMessage: ChatMessage = { role: 'user', content };
        const conversationWithUser = [...messagesRef.current, userMessage];
        persistMessages(conversationWithUser);

        if (streamingEnabled) {
          assistantIndexRef.current = conversationWithUser.length;
          streamingBufferRef.current = '';
          streamingLastEmitRef.current = Date.now();
          setIsStreaming(true);
          persistMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
        } else {
          assistantIndexRef.current = null;
        }

        const prompt = buildConversationPrompt(conversationWithUser);
        const result = await weave.generate(prompt, {
          ...(generateOptions ?? {}),
          streaming: streamingEnabled
            ? {
                enabled: true,
                uiContext: {
                  framework: 'react',
                },
              }
            : false,
          onChunk: streamingEnabled
            ? (chunk: string) => {
                streamingBufferRef.current += chunk;
                const now = Date.now();
                if (now - streamingLastEmitRef.current >= streamingUpdateFrequency) {
                  streamingLastEmitRef.current = now;
                  persistMessages((prev) => {
                    if (assistantIndexRef.current === null || assistantIndexRef.current >= prev.length) {
                      return prev;
                    }
                    const updated = [...prev];
                    updated[assistantIndexRef.current] = {
                      role: 'assistant',
                      content: streamingBufferRef.current,
                    };
                    return updated;
                  });
                }
              }
            : undefined,
        });

        const assistantText = result.data.text;

        if (assistantIndexRef.current !== null && streamingEnabled) {
          persistMessages((prev) => {
            if (assistantIndexRef.current === null || assistantIndexRef.current >= prev.length) {
              return [...prev, { role: 'assistant', content: assistantText }];
            }
            const updated = [...prev];
            updated[assistantIndexRef.current] = { role: 'assistant', content: assistantText };
            return updated;
          });
        } else {
          persistMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
        }

        const normalized = await handleOverflow(messagesRef.current);
        if (normalized !== messagesRef.current) {
          persistMessages(normalized);
        }

        updateCostSummary(result);

        return assistantText;
      } catch (err) {
        const errorInstance = err instanceof Error ? err : new Error(String(err));
        setError(errorInstance);
        options?.onError?.(errorInstance);
        return null;
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [
      weave,
      options,
      streamingConfig.enabled,
      streamingUpdateFrequency,
      persistMessages,
      handleOverflow,
      updateCostSummary,
      buildConversationPrompt,
    ]
  );

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
