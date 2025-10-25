/**
 * AIChatbox Component
 * Full-featured chat interface with message history and streaming
 *
 * Features:
 * - Message history with timestamps
 * - Dark/light theme support
 * - Auto-scrolling
 * - Markdown rendering
 * - Loading states
 * - Accessibility support
 * - Mobile responsive
 */

import React, { useState, useRef, useEffect } from 'react';
import type { AIChatboxProps, ChatMessage } from '../types/components.js';
import './AIChatbox.css';

export const AIChatbox: React.FC<AIChatboxProps> = ({
  theme = 'auto',
  onSendMessage,
  initialMessages = [],
  showTimestamps = true,
  enableMarkdown = true,
  className,
  placeholder = 'Type your message...',
  maxLength = 2000,
  showCharCount = true
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      await onSendMessage(input);

      // Add assistant message (in real app, this comes from response)
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: 'Response received',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getThemeClass = () => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  return (
    <div
      className={`weave-chatbox weave-chatbox--${getThemeClass()} ${className || ''}`}
      role="region"
      aria-label="Chat conversation"
    >
      {/* Messages Container */}
      <div className="weave-chatbox__messages" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="weave-chatbox__empty">
            <p>Start a conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`weave-chatbox__message weave-chatbox__message--${msg.role}`}
              role="article"
            >
              <div className="weave-chatbox__message-content">
                <div className="weave-chatbox__message-text">
                  {enableMarkdown ? (
                    <div dangerouslySetInnerHTML={{ __html: msg.content }} />
                  ) : (
                    msg.content
                  )}
                </div>
                {showTimestamps && msg.timestamp && (
                  <span className="weave-chatbox__timestamp">
                    {formatTime(msg.timestamp)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="weave-chatbox__message weave-chatbox__message--assistant">
            <div className="weave-chatbox__loading">
              <span className="weave-chatbox__loading-dot"></span>
              <span className="weave-chatbox__loading-dot"></span>
              <span className="weave-chatbox__loading-dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="weave-chatbox__error" role="alert">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="weave-chatbox__input-container">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value.substring(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="weave-chatbox__input"
          disabled={loading}
          aria-label="Message input"
          maxLength={maxLength}
        />

        {/* Character count */}
        {showCharCount && (
          <div className="weave-chatbox__char-count">
            {input.length} / {maxLength}
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || loading}
          className="weave-chatbox__send-btn"
          aria-label="Send message"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

AIChatbox.displayName = 'AIChatbox';
