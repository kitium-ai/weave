/**
 * Cursor Chat Provider
 * Provides webview-based chat interface for Cursor IDE
 */

import * as vscode from 'vscode';
import { logDebug } from '@weaveai/shared/utils/logging';
import { CursorWeaveAssistant, ChatMessage } from '../assistant/cursorWeaveAssistant';

/**
 * Chat Provider for Cursor IDE
 */
export class CursorChatProvider {
  private weaveAssistant: CursorWeaveAssistant;
  private panel: vscode.WebviewPanel | null = null;

  constructor(weaveAssistant: CursorWeaveAssistant) {
    this.weaveAssistant = weaveAssistant;
  }

  /**
   * Show chat panel
   */
  showChatPanel(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'weaveChat',
      'Weave AI Chat',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getWebviewContent();

    this.panel.onDidDispose(() => {
      this.panel = null;
    });

    this.panel.webview.onDidReceiveMessage(async (message: unknown) => {
      await this.handleMessage(message);
    }, undefined);
  }

  /**
   * Handle messages from webview
   */
  private async handleMessage(message: unknown): Promise<void> {
    if (typeof message !== 'object' || message === null) {
      return;
    }

    const msg = message as Record<string, unknown>;
    const command = msg.command;

    if (command === 'sendMessage') {
      const userMessage = msg.text;
      if (typeof userMessage !== 'string') {
        return;
      }

      try {
        const response = await this.weaveAssistant.sendChatMessage(userMessage);
        const history = this.weaveAssistant.getChatHistory();

        this.panel?.webview.postMessage({
          command: 'messageReceived',
          response,
          history: this.formatHistory(history),
        });
      } catch (error) {
        this.panel?.webview.postMessage({
          command: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else if (command === 'clearHistory') {
      this.weaveAssistant.clearChatHistory();
      this.panel?.webview.postMessage({
        command: 'historyCleared',
      });
    }
  }

  /**
   * Format chat history for display
   */
  private formatHistory(
    history: ChatMessage[]
  ): Array<{ role: string; content: string; timestamp: string }> {
    return history.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toLocaleTimeString(),
    }));
  }

  /**
   * Revive panel when extension is reloaded
   */
  revivePanel(webviewPanel: vscode.WebviewPanel, state: unknown): void {
    this.panel = webviewPanel;
    this.panel.webview.html = this.getWebviewContent();

    // Restore previous state if available (e.g., previous chat messages)
    if (state && typeof state === 'object' && 'history' in state) {
      const savedState = state as { history?: Array<{ role: string; content: string }> };
      if (savedState.history) {
        logDebug(`Restoring ${savedState.history.length} previous chat messages`);
        // Restore chat history to webview
        this.panel.webview.postMessage({
          command: 'restoreHistory',
          history: savedState.history,
        });
      }
    }

    this.panel.onDidDispose(() => {
      this.panel = null;
    });

    this.panel.webview.onDidReceiveMessage(async (message: unknown) => {
      await this.handleMessage(message);
    }, undefined);
  }

  /**
   * Get webview HTML content
   */
  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weave AI Chat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        .header {
            padding: 15px;
            border-bottom: 1px solid var(--vscode-editorLineNumber-foreground);
            background-color: var(--vscode-editor-lineHighlightBackground);
        }

        .header h2 {
            color: var(--vscode-textLink-foreground);
            font-size: 16px;
            margin: 0;
        }

        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .message {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .message.user {
            justify-content: flex-end;
        }

        .message-content {
            max-width: 80%;
            padding: 10px 15px;
            border-radius: 8px;
            word-wrap: break-word;
            white-space: pre-wrap;
            line-height: 1.5;
        }

        .message.user .message-content {
            background-color: var(--vscode-textLink-foreground);
            color: var(--vscode-editor-background);
        }

        .message.assistant .message-content {
            background-color: var(--vscode-editor-lineHighlightBackground);
            border: 1px solid var(--vscode-editorLineNumber-foreground);
            color: var(--vscode-foreground);
        }

        .message-time {
            font-size: 12px;
            opacity: 0.6;
            align-self: flex-end;
        }

        .input-area {
            padding: 15px;
            border-top: 1px solid var(--vscode-editorLineNumber-foreground);
            display: flex;
            gap: 10px;
            background-color: var(--vscode-editor-lineHighlightBackground);
        }

        #messageInput {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid var(--vscode-editorLineNumber-foreground);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-family: inherit;
            font-size: 13px;
        }

        #messageInput:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        .button {
            padding: 10px 20px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: background-color 0.2s;
        }

        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        .button:active {
            opacity: 0.8;
        }

        .button.secondary {
            background-color: transparent;
            border: 1px solid var(--vscode-editorLineNumber-foreground);
            color: var(--vscode-foreground);
        }

        .button.secondary:hover {
            background-color: var(--vscode-editor-lineHighlightBackground);
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            opacity: 0.6;
        }

        .empty-state div {
            padding: 20px;
        }

        .empty-state h3 {
            margin-bottom: 10px;
            color: var(--vscode-textLink-foreground);
        }

        .buttons-area {
            display: flex;
            gap: 10px;
        }

        .typing-indicator {
            display: flex;
            gap: 4px;
            align-items: center;
            padding: 10px 15px;
        }

        .typing-indicator span {
            width: 8px;
            height: 8px;
            background-color: var(--vscode-foreground);
            border-radius: 50%;
            animation: blink 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes blink {
            0%, 20%, 50%, 80%, 100% {
                opacity: 1;
            }
            40% {
                opacity: 0.5;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Weave AI Chat</h2>
    </div>

    <div class="chat-container" id="chatContainer">
        <div class="empty-state">
            <div>
                <h3>Start Chatting with Weave AI</h3>
                <p>Ask questions about your code or request AI assistance</p>
            </div>
        </div>
    </div>

    <div class="input-area">
        <input
            type="text"
            id="messageInput"
            placeholder="Ask Weave AI something..."
            autocomplete="off"
        />
        <div class="buttons-area">
            <button class="button" id="sendBtn">Send</button>
            <button class="button secondary" id="clearBtn">Clear</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const clearBtn = document.getElementById('clearBtn');
        let isLoading = false;

        function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || isLoading) return;

            isLoading = true;
            sendBtn.disabled = true;

            // Add user message to chat
            addMessage(text, 'user');
            messageInput.value = '';

            // Show typing indicator
            addTypingIndicator();

            // Send message to extension
            vscode.postMessage({
                command: 'sendMessage',
                text: text,
            });
        }

        function addMessage(content, role) {
            const container = chatContainer;
            if (container.querySelector('.empty-state')) {
                container.innerHTML = '';
            }

            // Remove typing indicator if present
            const typingIndicator = container.querySelector('.typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${role}\`;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = content;

            messageDiv.appendChild(contentDiv);

            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = new Date().toLocaleTimeString();

            messageDiv.appendChild(timeDiv);
            container.appendChild(messageDiv);

            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }

        function addTypingIndicator() {
            const container = chatContainer;
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            container.appendChild(typingDiv);
            container.scrollTop = container.scrollHeight;
        }
        // Event listeners
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        clearBtn.addEventListener('click', () => {
            if (confirm('Clear chat history?')) {
                chatContainer.innerHTML = '<div class="empty-state"><div><h3>Chat Cleared</h3><p>Start a new conversation</p></div></div>';
                vscode.postMessage({ command: 'clearHistory' });
            }
        });

        // Handle messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;

            if (message.command === 'messageReceived') {
                addMessage(message.response, 'assistant');
                isLoading = false;
                sendBtn.disabled = false;
                messageInput.focus();
            } else if (message.command === 'error') {
                addMessage(\`Error: \${message.message}\`, 'assistant');
                isLoading = false;
                sendBtn.disabled = false;
            } else if (message.command === 'historyCleared') {
                // History cleared
            } else if (message.command === 'restoreHistory') {
                // Restore previous chat history
                if (message.history && Array.isArray(message.history)) {
                    const container = chatContainer;
                    container.innerHTML = '';
                    message.history.forEach((msg) => {
                        addMessage(msg.content, msg.role);
                    });
                }
            }
        });

        // Focus on input when panel opens
        messageInput.focus();
    </script>
</body>
</html>`;
  }
}
