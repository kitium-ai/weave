/**
 * Weave AI Assistant Service
 * Core service for AI operations using the Weave framework
 */

import { logError } from '@weaveai/shared/utils/logging';
import * as vscode from 'vscode';
import { ConfigurationManager } from '../config/configManager';

export interface WeaveAnalysisResult {
  type: 'analysis' | 'suggestion' | 'completion';
  content: string;
  details?: Record<string, unknown>;
  language?: string;
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
 * Weave AI Assistant
 * Provides AI-powered code assistance
 */
export class WeaveAssistant {
  private config: ConfigurationManager;
  private isInitialized: boolean = false;

  constructor(config: ConfigurationManager) {
    this.config = config;
  }

  /**
   * Initialize the assistant
   */
  async initialize(): Promise<void> {
    try {
      // Validate configuration
      const apiKey = this.config.getApiKey();
      const provider = this.config.getProvider();

      if (!apiKey && provider !== 'local') {
        throw new Error(`API key not configured for ${provider}`);
      }

      this.isInitialized = true;
      console.log('WeaveAssistant initialized successfully');
    } catch (error) {
      logError('Failed to initialize WeaveAssistant:', error);
      throw error;
    }
  }

  /**
   * Generate an optimized prompt
   */
  async generatePrompt(context: WeaveCodeContext): Promise<WeaveAnalysisResult> {
    this.ensureInitialized();

    const systemPrompt = `You are an expert at creating optimized prompts for AI models.
Analyze the provided code and generate a clear, concise prompt that describes its purpose and functionality.`;

    const userPrompt = `Analyze this ${context.language} code and generate an optimized prompt that describes it:

\`\`\`${context.language}
${context.code}
\`\`\`

Generate a prompt that:
1. Clearly describes what the code does
2. Mentions key inputs and outputs
3. Includes any important constraints or edge cases
4. Is concise but complete`;

    return this.callWeaveAPI(systemPrompt, userPrompt, 'analysis', context);
  }

  /**
   * Analyze code for insights
   */
  async analyzeCode(context: WeaveCodeContext): Promise<WeaveAnalysisResult> {
    this.ensureInitialized();

    const systemPrompt = `You are a senior software engineer. Provide insightful analysis of code quality,
potential issues, and improvements.`;

    const userPrompt = `Analyze this ${context.language} code:

\`\`\`${context.language}
${context.code}
\`\`\`

Provide analysis including:
1. Code quality assessment
2. Potential bugs or issues
3. Performance considerations
4. Readability and maintainability
5. Best practice recommendations`;

    return this.callWeaveAPI(systemPrompt, userPrompt, 'analysis', context);
  }

  /**
   * Suggest code optimizations
   */
  async suggestOptimization(context: WeaveCodeContext): Promise<WeaveAnalysisResult> {
    this.ensureInitialized();

    const systemPrompt = `You are an expert at optimizing code. Provide specific, actionable optimization suggestions
with example improvements where appropriate.`;

    const userPrompt = `Suggest optimizations for this ${context.language} code:

\`\`\`${context.language}
${context.code}
\`\`\`

For each suggestion:
1. Explain the current inefficiency
2. Provide the optimized approach
3. Show a code example if applicable
4. Estimate the performance improvement if measurable`;

    return this.callWeaveAPI(systemPrompt, userPrompt, 'suggestion', context);
  }

  /**
   * Generate code completion
   */
  async generateCompletion(context: WeaveCodeContext, position: vscode.Position): Promise<string> {
    this.ensureInitialized();

    const lines = context.code.split('\n');
    const previousLines = lines.slice(0, position.line).join('\n');

    const systemPrompt = `You are a code completion expert. Complete the code based on context.
Respond with only the completion text, no explanations.`;

    const userPrompt = `Complete this ${context.language} code based on context:

\`\`\`${context.language}
${previousLines}
|CURSOR_HERE|
\`\`\`

Provide a natural completion that fits the code style and logic.`;

    const result = await this.callWeaveAPI(systemPrompt, userPrompt, 'completion', context);

    return result.content;
  }

  /**
   * Get function documentation
   */
  async generateDocumentation(context: WeaveCodeContext): Promise<string> {
    this.ensureInitialized();

    const systemPrompt = `You are a documentation expert. Generate clear, concise documentation for code.`;

    const userPrompt = `Generate JSDoc/documentation for this ${context.language} code:

\`\`\`${context.language}
${context.code}
\`\`\`

Include description, parameters, return type, and examples where relevant.`;

    const result = await this.callWeaveAPI(systemPrompt, userPrompt, 'analysis', context);

    return result.content;
  }

  /**
   * Call Weave API
   */
  private async callWeaveAPI(
    systemPrompt: string,
    userPrompt: string,
    type: 'analysis' | 'suggestion' | 'completion',
    context: WeaveCodeContext
  ): Promise<WeaveAnalysisResult> {
    try {
      // Show loading indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Weave AI Assistant',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: 'Analyzing with Weave AI...' });

          // Simulate API call (in real implementation, this would call actual Weave API)
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      );

      // For now, return mock response
      // In production, this would call the actual Weave framework
      return {
        type,
        content: `[Mock ${type}] This is a placeholder response. In production, this would be generated by the Weave framework.`,
        language: context.language,
        timestamp: new Date(),
      };
    } catch (error) {
      logError('Weave API call failed:', error);
      throw error;
    }
  }

  /**
   * Ensure assistant is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('WeaveAssistant not initialized');
    }
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.isInitialized = false;
  }
}
