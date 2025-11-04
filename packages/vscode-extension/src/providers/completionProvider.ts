/**
 * Code Completion Provider
 * Provides AI-powered code completion suggestions
 */

import { logError } from '@weaveai/shared/utils/logging';
import * as vscode from 'vscode';
import { WeaveAssistant } from '../assistant/weaveAssistant';

/**
 * Code Completion Provider
 */
export class CodeCompletionProvider implements vscode.CompletionItemProvider {
  private weaveAssistant: WeaveAssistant;

  constructor(weaveAssistant: WeaveAssistant) {
    this.weaveAssistant = weaveAssistant;
  }

  /**
   * Provide completion items
   */
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList | null> {
    // Check if cancellation was requested
    if (token.isCancellationRequested) {
      return null;
    }

    // Get the word being completed
    const range = document.getWordRangeAtPosition(position);
    const word = range ? document.getText(range) : '';

    // Don't provide completions for very short words
    if (word.length < 3) {
      return null;
    }

    // Skip if this is just a trigger character completion (not full intellisense)
    if (
      context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter &&
      !context.triggerCharacter
    ) {
      return null;
    }

    try {
      // Check cancellation before async operation
      if (token.isCancellationRequested) {
        return null;
      }

      // Get code context
      const code = document.getText();
      const completion = await this.weaveAssistant.generateCompletion(
        {
          code,
          language: document.languageId,
          fileName: document.fileName,
          line: position.line,
          column: position.character,
        },
        position
      );

      // Check cancellation after async operation
      if (token.isCancellationRequested) {
        return null;
      }

      const completionItem = new vscode.CompletionItem(completion, vscode.CompletionItemKind.Text);

      completionItem.sortText = '0-weave';
      completionItem.label = `Weave: ${completion.substring(0, 50)}...`;
      completionItem.detail = 'AI-powered completion by Weave';
      completionItem.documentation = 'Completion suggested by Weave AI Assistant';

      return [completionItem];
    } catch (error) {
      logError('Completion provider error:', error);
      return null;
    }
  }

  /**
   * Resolve completion item
   */
  resolveCompletionItem?(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    // Check if cancellation was requested before resolving
    if (token.isCancellationRequested) {
      return null;
    }
    return item;
  }
}
