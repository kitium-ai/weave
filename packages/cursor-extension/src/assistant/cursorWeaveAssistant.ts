/**
 * Cursor-Optimized Weave AI Assistant
 * Enhanced for Cursor IDE with chat and inline editing
 */

import * as vscode from 'vscode';
import { logDebug, logError, logInfo } from '@weaveai/shared/utils/logging';
import { ConfigurationManager } from '../config/configManager';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WeaveCodeContext {
  code: string;
  language: string;
  fileName: string;
  line: number;
  column: number;
}

/**
 * Cursor-Optimized Weave Assistant
 */
export class CursorWeaveAssistant {
  private config: ConfigurationManager;
  private isInitialized: boolean = false;
  private chatHistory: ChatMessage[] = [];
  private maxHistoryLength: number = 50;

  constructor(config: ConfigurationManager) {
    this.config = config;
  }

  /**
   * Initialize the assistant
   */
  async initialize(): Promise<void> {
    try {
      const provider = this.config.getProvider();
      const apiKey = this.config.getApiKey();

      if (!apiKey && provider !== 'local') {
        throw new Error(`API key not configured for ${provider}`);
      }

      this.isInitialized = true;
      logInfo('CursorWeaveAssistant initialized successfully');
    } catch (error) {
      logError('Failed to initialize CursorWeaveAssistant', error);
      throw error;
    }
  }

  /**
   * Send message to Weave Chat
   */
  async sendChatMessage(userMessage: string): Promise<string> {
    this.ensureInitialized();

    // Add user message to history
    this.chatHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    try {
      // Simulate AI response (will be replaced with real API call)
      const response = await this.processChatMessage(userMessage);

      // Add assistant response to history
      this.chatHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });

      // Maintain history limit
      if (this.chatHistory.length > this.maxHistoryLength) {
        this.chatHistory.shift();
      }

      return response;
    } catch (error) {
      logError('Chat message processing failed', error);
      throw error;
    }
  }

  /**
   * Process inline code edit
   */
  async inlineEdit(code: string, instruction: string, context: WeaveCodeContext): Promise<string> {
    this.ensureInitialized();

    const prompt = `Edit this ${context.language} code according to the instruction:

Instruction: ${instruction}

Original code:
\`\`\`${context.language}
${code}
\`\`\`

Provide only the edited code without explanation.`;

    return this.callWeaveAPI(prompt, 'edit', context);
  }

  /**
   * Generate prompt for code
   */
  async generatePrompt(context: WeaveCodeContext): Promise<string> {
    this.ensureInitialized();

    const prompt = `Generate an optimized prompt that describes this ${context.language} code:

\`\`\`${context.language}
${context.code}
\`\`\`

The prompt should be suitable for AI training or code documentation.`;

    return this.callWeaveAPI(prompt, 'analysis', context);
  }

  /**
   * Analyze code
   */
  async analyzeCode(context: WeaveCodeContext): Promise<string> {
    this.ensureInitialized();

    const prompt = `Analyze this ${context.language} code and provide insights:

\`\`\`${context.language}
${context.code}
\`\`\`

Include:
1. Code quality assessment
2. Potential issues
3. Performance considerations
4. Best practice recommendations`;

    return this.callWeaveAPI(prompt, 'analysis', context);
  }

  /**
   * Suggest optimizations
   */
  async suggestOptimization(context: WeaveCodeContext): Promise<string> {
    this.ensureInitialized();

    const prompt = `Suggest optimizations for this ${context.language} code:

\`\`\`${context.language}
${context.code}
\`\`\`

For each suggestion, explain:
1. The current inefficiency
2. The optimized approach
3. Code example if applicable`;

    return this.callWeaveAPI(prompt, 'suggestion', context);
  }

  /**
   * Generate code documentation
   */
  async generateDocumentation(context: WeaveCodeContext): Promise<string> {
    this.ensureInitialized();

    const prompt = `Generate comprehensive documentation for this ${context.language} code:

\`\`\`${context.language}
${context.code}
\`\`\`

Include JSDoc/docstring format with descriptions, parameters, return types, and examples.`;

    return this.callWeaveAPI(prompt, 'documentation', context);
  }

  /**
   * Refactor code
   */
  async refactorCode(code: string, pattern: string, context: WeaveCodeContext): Promise<string> {
    this.ensureInitialized();

    const prompt = `Refactor this ${context.language} code using ${pattern} pattern:

\`\`\`${context.language}
${code}
\`\`\`

Provide only the refactored code without explanation.`;

    return this.callWeaveAPI(prompt, 'refactor', context);
  }

  /**
   * Get chat history
   */
  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): void {
    this.chatHistory = [];
  }

  /**
   * Process chat message with context
   */
  private async processChatMessage(message: string): Promise<string> {
    // Build context from chat history
    const recentHistory = this.chatHistory.slice(-10);
    const contextString = recentHistory
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const fullPrompt = `Chat history:
${contextString}

USER: ${message}

Assistant response:`;

    return this.callWeaveAPI(fullPrompt, 'chat', {
      code: '',
      language: 'plaintext',
      fileName: 'chat',
      line: 0,
      column: 0,
    });
  }

  /**
   * Call Weave API
   */
  private async callWeaveAPI(
    prompt: string,
    type: string,
    context: WeaveCodeContext
  ): Promise<string> {
    try {
      // Log context for debugging (file and language being processed)
      logDebug(`Processing ${type} operation for ${context.fileName} (${context.language})`, {
        fileName: context.fileName,
        language: context.language,
        line: context.line,
      });

      // Show loading indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Weave AI Assistant',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: `Processing ${context.language} code with Weave AI...` });
          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      );

      // Mock response (will be replaced with real API integration)
      // Include context info in response for future use
      return `[${type}] Mock response from Weave AI for ${context.language} code at ${context.fileName}:${context.line}. This will be replaced with real API integration.`;
    } catch (error) {
      logError('Weave API call failed', error, { type });
      throw error;
    }
  }

  /**
   * Ensure assistant is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('CursorWeaveAssistant not initialized');
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.chatHistory = [];
    this.isInitialized = false;
  }
}
