<script lang="ts">
  /**
   * Svelte Chat Application Example
   * Demonstrates reactive stores with Svelte
   */

  import { onMount } from 'svelte';
  import { createWeave } from '@weaveai/core';
  import { OpenAIProvider } from '@weaveai/core/providers';
  import { createAIChat } from '@weaveai/svelte';
  import type { ChatMessage } from '@weaveai/core';

  let input = '';
  let weave: any;
  let messages: ChatMessage[] = [];
  let loading = false;
  let error: any = null;
  let status = 'idle';

  onMount(async () => {
    // Initialize Weave
    weave = createWeave({
      provider: new OpenAIProvider({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        model: 'gpt-4',
      }),
    });

    // Create chat store
    const chatStore = createAIChat(weave);
    const unsubscribe = chatStore.subscribe((state) => {
      messages = state.data || [];
      loading = state.loading;
      error = state.error;
      status = state.status;
    });

    return unsubscribe;
  });

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    input = '';
    // Send message logic here
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
</script>

<div class="chat-container">
  <div class="chat-header">
    <h1>🎯 Weave Chat - Svelte</h1>
    <p class="status">Status: {status}</p>
  </div>

  <div class="chat-messages">
    {#each messages as msg, idx (idx)}
      <div class="message {msg.role}">
        <div class="message-content">{msg.content}</div>
        <div class="message-time">
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
        </div>
      </div>
    {/each}

    {#if loading}
      <div class="message assistant loading">
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    {/if}
  </div>

  {#if error}
    <div class="error-message">
      <p>Error: {error.message}</p>
    </div>
  {/if}

  <div class="chat-input-area">
    <textarea
      bind:value={input}
      on:keypress={handleKeyPress}
      disabled={loading}
      placeholder="Type your message... (Shift+Enter for new line)"
      rows="3"
    ></textarea>
    <button on:click={handleSend} disabled={loading || !input.trim()}>
      {loading ? 'Sending...' : 'Send'}
    </button>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .chat-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    text-align: center;
  }

  .chat-header h1 {
    margin: 0;
    font-size: 24px;
  }

  .status {
    margin: 10px 0 0 0;
    font-size: 14px;
    opacity: 0.9;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 16px;
    border-radius: 8px;
    max-width: 70%;
    word-wrap: break-word;
  }

  .message.user {
    align-self: flex-end;
    background: #667eea;
    color: white;
  }

  .message.assistant {
    align-self: flex-start;
    background: #f0f0f0;
    color: #333;
  }

  .message-time {
    font-size: 12px;
    opacity: 0.7;
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
  }

  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #667eea;
    animation: bounce 1.4s infinite;
  }

  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes bounce {
    0%,
    80%,
    100% {
      transform: scale(1);
      opacity: 0.5;
    }
    40% {
      transform: scale(1.2);
      opacity: 1;
    }
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 12px 16px;
    border-radius: 4px;
    margin: 0 20px;
  }

  .chat-input-area {
    padding: 20px;
    border-top: 1px solid #ddd;
    display: flex;
    gap: 10px;
  }

  textarea {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
  }

  textarea:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  button {
    padding: 10px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #5568d3;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
</style>
