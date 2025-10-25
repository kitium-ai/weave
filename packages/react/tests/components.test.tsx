/**
 * Tests for Weave React components
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { AIComponent, AIChat, ChatMessage } from '../src/components/index.js';
import { WeaveProvider } from '../src/context/WeaveContext.js';
import type { Weave } from '@weaveai/core';
import { vi } from 'vitest';

const createMockWeave = (): typeof Weave => {
  return {
    generate: vi.fn().mockResolvedValue({
      text: 'Generated text',
      tokenCount: { input: 10, output: 20 },
      finishReason: 'stop',
    }),
    classify: vi.fn(),
    extract: vi.fn(),
    chat: vi.fn().mockResolvedValue('Chat response'),
    getModel: vi.fn(),
  } as unknown as typeof Weave;
};

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const mockWeave = createMockWeave();
  return <WeaveProvider weave={mockWeave}>{children}</WeaveProvider>;
};

describe('Weave React Components', () => {
  describe('AIComponent', () => {
    it('should render children with initial state', () => {
      const { getByText } = render(
        <AIComponent onExecute={async () => 'test'}>
          {({ status }) => <div>{status}</div>}
        </AIComponent>,
        { wrapper }
      );

      expect(getByText('idle')).toBeTruthy();
    });

    it('should provide execute function in render props', () => {
      const { getByText } = render(
        <AIComponent onExecute={async () => 'test'}>
          {({ status, execute }) => (
            <div>
              <button
                onClick={() => {
                  execute();
                }}
              >
                Execute
              </button>
              <div>{status}</div>
            </div>
          )}
        </AIComponent>,
        { wrapper }
      );

      expect(getByText('Execute')).toBeTruthy();
    });
  });

  describe('AIChat', () => {
    it('should render chat interface', () => {
      const { getByText, getByPlaceholderText } = render(<AIChat />, { wrapper });

      expect(getByText('No messages yet. Start a conversation!')).toBeTruthy();
      expect(getByPlaceholderText('Type your message...')).toBeTruthy();
    });

    it('should have send button', () => {
      const { getByText } = render(<AIChat />, { wrapper });

      expect(getByText('Send')).toBeTruthy();
    });

    it('should have input field', () => {
      const { getByPlaceholderText } = render(<AIChat />, { wrapper });

      const input = getByPlaceholderText('Type your message...') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.disabled).toBe(false);
    });

    it('should support custom message renderer', () => {
      const customRenderer = (msg: ChatMessage) => (
        <div data-testid="custom-message">{msg.content}</div>
      );

      const { container } = render(<AIChat renderMessage={customRenderer} />, { wrapper });

      expect(container).toBeTruthy();
    });

    it('should support custom input renderer', () => {
      const customInput = (_: unknown) => <div data-testid="custom-input">Custom Input</div>;

      const { getByTestId } = render(<AIChat renderInput={customInput} />, { wrapper });

      expect(getByTestId('custom-input')).toBeTruthy();
    });
  });
});
