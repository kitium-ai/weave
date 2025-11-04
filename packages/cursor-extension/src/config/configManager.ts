/**
 * Cursor Configuration Manager
 * Manages Cursor IDE-specific extension configuration
 */

import * as vscode from 'vscode';

export interface CursorWeaveConfig {
  enabled: boolean;
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  enableChat: boolean;
  enableInlineEdit: boolean;
  languageScope: string[];
  cursorFeatures: {
    chat: boolean;
    inlineEdit: boolean;
    autoComplete: boolean;
    docGeneration: boolean;
    refactoring: boolean;
  };
}

/**
 * Configuration Manager for Cursor IDE
 */
export class ConfigurationManager {
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('weave');
  }

  /**
   * Reload configuration
   */
  reload(): void {
    this.config = vscode.workspace.getConfiguration('weave');
  }

  /**
   * Get all configuration
   */
  getAll(): Partial<CursorWeaveConfig> {
    return {
      enabled: this.config.get<boolean>('enabled', true),
      apiKey: this.config.get<string>('apiKey', ''),
      provider: this.config.get<'openai' | 'anthropic' | 'local'>('provider', 'anthropic'),
      model: this.config.get<string>('model', 'claude-3-opus-20240229'),
      temperature: this.config.get<number>('temperature', 0.7),
      maxTokens: this.config.get<number>('maxTokens', 2000),
      enableChat: this.config.get<boolean>('enableChat', true),
      enableInlineEdit: this.config.get<boolean>('enableInlineEdit', true),
      languageScope: this.config.get<string[]>('languageScope', [
        'typescript',
        'javascript',
        'python',
      ]),
      cursorFeatures: this.config.get<CursorWeaveConfig['cursorFeatures']>('cursorFeatures', {
        chat: true,
        inlineEdit: true,
        autoComplete: true,
        docGeneration: true,
        refactoring: true,
      }),
    };
  }

  /**
   * Get enabled status
   */
  isEnabled(): boolean {
    return this.config.get<boolean>('enabled', true);
  }

  /**
   * Get API key
   */
  getApiKey(): string {
    return this.config.get<string>('apiKey', '');
  }

  /**
   * Set API key
   */
  async setApiKey(apiKey: string): Promise<void> {
    await this.config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
    this.reload();
  }

  /**
   * Get provider
   */
  getProvider(): 'openai' | 'anthropic' | 'local' {
    return this.config.get<'openai' | 'anthropic' | 'local'>('provider', 'anthropic');
  }

  /**
   * Get model
   */
  getModel(): string {
    return this.config.get<string>('model', 'claude-3-opus-20240229');
  }

  /**
   * Get temperature
   */
  getTemperature(): number {
    return this.config.get<number>('temperature', 0.7);
  }

  /**
   * Get max tokens
   */
  getMaxTokens(): number {
    return this.config.get<number>('maxTokens', 2000);
  }

  /**
   * Check if chat is enabled
   */
  chatEnabled(): boolean {
    return this.config.get<boolean>('enableChat', true);
  }

  /**
   * Check if inline edit is enabled
   */
  inlineEditEnabled(): boolean {
    return this.config.get<boolean>('enableInlineEdit', true);
  }

  /**
   * Get language scope
   */
  getLanguageScope(): string[] {
    return this.config.get<string[]>('languageScope', ['typescript', 'javascript', 'python']);
  }

  /**
   * Check if language is in scope
   */
  isLanguageInScope(languageId: string): boolean {
    return this.getLanguageScope().includes(languageId);
  }

  /**
   * Get Cursor-specific features
   */
  getCursorFeatures(): CursorWeaveConfig['cursorFeatures'] {
    return this.config.get<CursorWeaveConfig['cursorFeatures']>('cursorFeatures', {
      chat: true,
      inlineEdit: true,
      autoComplete: true,
      docGeneration: true,
      refactoring: true,
    });
  }

  /**
   * Check if a specific Cursor feature is enabled
   */
  isCursorFeatureEnabled(feature: keyof CursorWeaveConfig['cursorFeatures']): boolean {
    const features = this.getCursorFeatures();
    return features[feature] ?? true;
  }
}
