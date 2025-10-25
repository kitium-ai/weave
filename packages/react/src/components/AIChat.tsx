/**
 * AIChat - Pre-built chat component
 */

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { useAIChat } from '../hooks';
import type { ChatMessage } from '@weaveai/core';

/**
 * AIChat component props
 */
export interface AIChatProps {
  onError?: (error: Error) => void;
  onMessageSent?: (message: string) => void;
  onMessageReceived?: (message: string) => void;
  renderMessage?: (message: ChatMessage, index: number) => ReactNode;
  renderLoading?: () => ReactNode;
  renderError?: (error: Error) => ReactNode;
  renderInput?: (props: {
    onSubmit: (message: string) => Promise<void>;
    isLoading: boolean;
  }) => ReactNode;
}

/**
 * Default message renderer
 */
function DefaultMessageRenderer(message: ChatMessage) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <strong>{message.role === 'user' ? 'You' : 'Assistant'}:</strong>
      <p>{message.content}</p>
    </div>
  );
}

/**
 * Default input renderer
 */
function DefaultInputRenderer({
  onSubmit,
  isLoading,
}: {
  onSubmit: (message: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) {
      return;
    }

    await onSubmit(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
        }}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}

/**
 * AIChat component - Pre-built chat interface
 */
export function AIChat({
  onError,
  onMessageSent,
  onMessageReceived,
  renderMessage = DefaultMessageRenderer,
  renderLoading,
  renderError,
  renderInput = DefaultInputRenderer,
}: AIChatProps): React.ReactElement {
  const { messages, loading, error, sendMessage, clearMessages } = useAIChat({ onError });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    onMessageSent?.(content);
    const response = await sendMessage(content);
    if (response) {
      onMessageReceived?.(response);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      {/* Messages container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '16px',
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '12px',
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>
            No messages yet. Start a conversation!
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index}>{renderMessage(message, index)}</div>
        ))}
        {loading && renderLoading?.()}
        {error && renderError?.(error)}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <div>
        {renderInput({ onSubmit: handleSendMessage, isLoading: loading })}
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              fontSize: '12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Clear Chat
          </button>
        )}
      </div>
    </div>
  );
}
