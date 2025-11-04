/**
 * Configuration Manager
 * Manages extension configuration and settings
 */

import * as vscode from 'vscode';

export interface WeaveConfig {
  enabled: boolean;
  apiKey: string;
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  inlineHints: boolean;
  temperature: number;
  maxTokens: number;
  enableCodeCompletion: boolean;
  enableCodeLens: boolean;
  languageScope: string[];
}

/**
 * Configuration Manager
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
  getAll(): Partial<WeaveConfig> {
    return {
      enabled: this.config.get<boolean>('enabled', true),
      apiKey: this.config.get<string>('apiKey', ''),
      provider: this.config.get<'openai' | 'anthropic' | 'local'>(
        'provider',
        'openai'
      ),
      model: this.config.get<string>('model', 'gpt-4'),
      inlineHints: this.config.get<boolean>('inlineHints', true),
      temperature: this.config.get<number>('temperature', 0.7),
      maxTokens: this.config.get<number>('maxTokens', 1000),
      enableCodeCompletion: this.config.get<boolean>(
        'enableCodeCompletion',
        true
      ),
      enableCodeLens: this.config.get<boolean>('enableCodeLens', true),
      languageScope: this.config.get<string[]>('languageScope', [
        'typescript',
        'javascript',
        'python',
      ]),
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
    return this.config.get<'openai' | 'anthropic' | 'local'>(
      'provider',
      'openai'
    );
  }

  /**
   * Get model
   */
  getModel(): string {
    return this.config.get<string>('model', 'gpt-4');
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
    return this.config.get<number>('maxTokens', 1000);
  }

  /**
   * Check if inline hints are enabled
   */
  inlineHintsEnabled(): boolean {
    return this.config.get<boolean>('inlineHints', true);
  }

  /**
   * Check if code completion is enabled
   */
  codeCompletionEnabled(): boolean {
    return this.config.get<boolean>('enableCodeCompletion', true);
  }

  /**
   * Check if code lens is enabled
   */
  codeLensEnabled(): boolean {
    return this.config.get<boolean>('enableCodeLens', true);
  }

  /**
   * Get language scope
   */
  getLanguageScope(): string[] {
    return this.config.get<string[]>('languageScope', [
      'typescript',
      'javascript',
      'python',
    ]);
  }

  /**
   * Check if language is in scope
   */
  isLanguageInScope(languageId: string): boolean {
    return this.getLanguageScope().includes(languageId);
  }
}
