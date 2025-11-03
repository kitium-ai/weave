/**
 * Tests for Weave React hooks
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type React from 'react';
import {
  useAI,
  useGenerateAI,
  useClassifyAI,
  useExtractAI,
  useAIChat,
  useAIStream,
} from '../src/hooks/index.js';
import { WeaveProvider } from '../src/context/WeaveContext.js';
import type {
  Weave,
  GenerateResult,
  ClassificationResult,
  ExtractResult,
  WeaveOperationMetadata,
} from '@weaveai/core';

// Mock Weave instance
const createMockMetadata = (
  overrides?: Partial<WeaveOperationMetadata>
): WeaveOperationMetadata => ({
  operationId: 'op-123',
  duration: 25,
  timestamp: new Date('2025-01-01T00:00:00Z'),
  provider: 'mock',
  model: 'mock-model',
  ui: {
    displayAs: 'text',
    canStream: false,
    estimatedSize: 'small',
  },
  cached: false,
  ...overrides,
});

const createMockWeave = (): Weave => {
  const generateResult: GenerateResult = {
    status: 'success',
    data: {
      text: 'Generated text',
      tokenCount: { input: 10, output: 20 },
      finishReason: 'stop',
    },
    metadata: createMockMetadata({
      tokens: { input: 10, output: 20 },
    }),
  };

  const classifyResult: ClassificationResult = {
    status: 'success',
    data: {
      label: 'positive',
      confidence: 0.95,
      scores: { positive: 0.95, negative: 0.05 },
    },
    metadata: createMockMetadata({
      ui: { displayAs: 'json', canStream: false, estimatedSize: 'small' },
    }),
  };

  const extractResult: ExtractResult<{ name: string; age: number }> = {
    status: 'success',
    data: { name: 'John', age: 30 },
    metadata: createMockMetadata({
      ui: { displayAs: 'json', canStream: false, estimatedSize: 'medium' },
    }),
  };

  return {
    generate: vi.fn().mockResolvedValue(generateResult),
    classify: vi.fn().mockResolvedValue(classifyResult),
    extract: vi.fn().mockResolvedValue(extractResult),
    getModel: vi.fn().mockReturnValue({
      chat: vi.fn(),
    }),
  } as unknown as Weave;
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const mockWeave = createMockWeave();
  return <WeaveProvider weave={mockWeave}>{children}</WeaveProvider>;
};

describe('Weave React Hooks', () => {
  describe('useAI hook', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useAI(), { wrapper });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.status).toBe('idle');
    });

    it('should update state when executing', async () => {
      const { result } = renderHook(() => useAI<string>(), { wrapper });

      await act(async () => {
        const response = await result.current.execute(async () => Promise.resolve('test data'));
        expect(response).toBe('test data');
      });

      expect(result.current.data).toBe('test data');
      expect(result.current.loading).toBe(false);
      expect(result.current.status).toBe('success');
    });

    it('should handle errors', async () => {
      const { result } = renderHook(() => useAI<string>(), { wrapper });

      await act(async () => {
        const response = await result.current.execute(async () =>
          Promise.reject(new Error('Test error'))
        );
        expect(response).toBeNull();
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toBe('Test error');
      expect(result.current.status).toBe('error');
    });

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAI<string>({ onSuccess }), { wrapper });

      await act(async () => {
        await result.current.execute(async () => Promise.resolve('test'));
      });

      expect(onSuccess).toHaveBeenCalledWith('test');
    });

    it('should call onError callback on failure', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useAI<string>({ onError }), { wrapper });

      await act(async () => {
        await result.current.execute(async () => Promise.reject(new Error('Test error')));
      });

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('useGenerateAI hook', () => {
    it('should have generate function', () => {
      const { result } = renderHook(() => useGenerateAI(), { wrapper });

      expect(typeof result.current.generate).toBe('function');
      expect(result.current.data).toBeNull();
      expect(result.current.status).toBe('idle');
    });

    it('should execute generate operation', async () => {
      const { result } = renderHook(() => useGenerateAI(), { wrapper });

      await act(async () => {
        const response = await result.current.generate('Test prompt');
        expect(response?.data.text).toBe('Generated text');
        expect(response?.status).toBe('success');
      });

      expect(result.current.data?.data.text).toBe('Generated text');
      expect(result.current.data?.status).toBe('success');
    });
  });

  describe('useClassifyAI hook', () => {
    it('should have classify function', () => {
      const { result } = renderHook(() => useClassifyAI(), { wrapper });

      expect(typeof result.current.classify).toBe('function');
      expect(result.current.data).toBeNull();
      expect(result.current.status).toBe('idle');
    });

    it('should execute classify operation', async () => {
      const { result } = renderHook(() => useClassifyAI(), { wrapper });

      await act(async () => {
        const response = await result.current.classify('Test text', ['positive', 'negative']);
        expect(response).toBeTruthy();
        expect(response?.label).toBe('positive');
      });

      expect(result.current.data?.label).toBe('positive');
      expect(result.current.status).toBe('success');
    });
  });

  describe('useExtractAI hook', () => {
    it('should have extract function', () => {
      const { result } = renderHook(() => useExtractAI(), { wrapper });

      expect(typeof result.current.extract).toBe('function');
      expect(result.current.data).toBeNull();
      expect(result.current.status).toBe('idle');
    });

    it('should execute extract operation', async () => {
      const { result } = renderHook(() => useExtractAI(), { wrapper });

      await act(async () => {
        const response = await result.current.extract('John is 30', {
          name: 'string',
          age: 'number',
        });
        expect(response?.data).toEqual({ name: 'John', age: 30 });
        expect(response?.status).toBe('success');
      });

      expect(result.current.data?.data).toEqual({ name: 'John', age: 30 });
      expect(result.current.status).toBe('success');
    });
  });

  describe('useAIChat hook', () => {
    it('should initialize with empty messages', () => {
      const { result } = renderHook(() => useAIChat(), { wrapper });

      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.streaming).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.costSummary).toBeNull();
    });

    it('should send message and receive response', async () => {
      const { result } = renderHook(() => useAIChat(), { wrapper });

      let response: string | null = null;
      await act(async () => {
        response = await result.current.sendMessage('Hello');
      });

      expect(response).toBe('Generated text');
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[1].role).toBe('assistant');
    });

    it('should add message manually', () => {
      const { result } = renderHook(() => useAIChat(), { wrapper });

      act(() => {
        result.current.addMessage({ role: 'user', content: 'Test' });
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Test');
    });

    it('should remove message by index', () => {
      const { result } = renderHook(
        () =>
          useAIChat({
            initialMessages: [
              { role: 'user', content: 'Message 1' },
              { role: 'assistant', content: 'Response 1' },
            ],
          }),
        { wrapper }
      );

      expect(result.current.messages).toHaveLength(2);

      act(() => {
        result.current.removeMessage(0);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Response 1');
    });

    it('should clear all messages', () => {
      const { result } = renderHook(
        () =>
          useAIChat({
            initialMessages: [{ role: 'user', content: 'Message' }],
          }),
        { wrapper }
      );

      expect(result.current.messages).toHaveLength(1);

      act(() => {
        result.current.clear();
      });

      expect(result.current.messages).toHaveLength(0);
    });

    it('should provide downloadable transcript', async () => {
      const { result } = renderHook(() => useAIChat(), { wrapper });

      await act(async () => {
        await result.current.sendMessage('Hello world');
      });

      const payload = result.current.download();
      expect(payload).toContain('Hello world');
    });
  });

  describe('useAIStream hook', () => {
    it('should initialize with empty chunks', () => {
      const { result } = renderHook(() => useAIStream(), { wrapper });

      expect(result.current.chunks).toEqual([]);
      expect(result.current.fullText).toBe('');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastResult).toBeNull();
    });

    it('should execute stream generate', async () => {
      const { result } = renderHook(() => useAIStream(), { wrapper });

      let response;
      await act(async () => {
        response = await result.current.streamGenerate('Test prompt');
      });

      // Response should be returned
      expect(response?.data.text).toBe('Generated text');
      expect(result.current.lastResult?.data.text).toBe('Generated text');
      expect(result.current.fullText).toBe('Generated text');
      expect(result.current.loading).toBe(false);
    });

    it('should clear stream data', () => {
      const { result } = renderHook(() => useAIStream(), { wrapper });

      act(() => {
        result.current.clear();
      });

      expect(result.current.chunks).toEqual([]);
      expect(result.current.fullText).toBe('');
      expect(result.current.error).toBeNull();
      expect(result.current.lastResult).toBeNull();
    });

    it('should call callbacks', async () => {
      const onChunk = vi.fn();
      const onComplete = vi.fn();
      const onStart = vi.fn();

      const { result } = renderHook(() => useAIStream({ onChunk, onComplete, onStart }), {
        wrapper,
      });

      await act(async () => {
        await result.current.streamGenerate('Test');
      });

      expect(onStart).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Hook error handling', () => {
    it('should throw error when using hook outside WeaveProvider', () => {
      // Suppress console error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAI());
      }).toThrow('useWeaveContext must be used within a WeaveProvider');

      consoleError.mockRestore();
    });
  });
});
