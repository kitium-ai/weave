/**
 * React Chat Application Example
 * Complete chat interface using Weave and React hooks
 */

import React, { useState } from 'react';
import { createWeave } from '@weaveai/core';
import { OpenAIProvider } from '@weaveai/core/providers';
import { WeaveProvider, useAIChat } from '@weaveai/react';
import './App.css';

// Initialize Weave
const weave = createWeave({
  provider: new OpenAIProvider({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY!,
    model: 'gpt-4',
  }),
});

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function ChatInterface() {
  const { messages, loading, error, status, sendMessage } = useAIChat(weave);
  const [input, setInput] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');

    await sendMessage(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend().then((val) => console.log(val));
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Weave Chat</h1>
        <p className="status">Status: {status}</p>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-content">{msg.content}</div>
            <div className="message-time">
              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error.message}</p>
        </div>
      )}

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Shift+Enter for new line)"
          disabled={loading}
          rows={3}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export function App() {
  return (
    <WeaveProvider weave={weave}>
      <ChatInterface />
    </WeaveProvider>
  );
}
