/**
 * Code Lens Provider
 * Provides inline code actions powered by Weave AI
 */

import * as vscode from 'vscode';
import { WeaveAssistant } from '../assistant/weaveAssistant';

/**
 * Code Lens Provider
 */
export class CodeLensProvider implements vscode.CodeLensProvider {
  private weaveAssistant: WeaveAssistant;
  private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();

  onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

  constructor(weaveAssistant: WeaveAssistant) {
    this.weaveAssistant = weaveAssistant;
  }

  /**
   * Provide code lenses
   */
  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[] | null> {
    const lenses: vscode.CodeLens[] = [];

    // Check if cancellation was requested
    if (token.isCancellationRequested) {
      return null;
    }

    // Add a code lens at the beginning of the document
    const firstLine = new vscode.Range(0, 0, 0, 0);

    lenses.push(
      new vscode.CodeLens(firstLine, {
        title: '$(lightbulb) Weave: Analyze',
        command: 'weave.analyzeCode',
      })
    );

    // Find function/method definitions and add code lens
    const functionPattern = /^(async\s+)?(function|class)\s+(\w+)/gm;
    let match;

    while ((match = functionPattern.exec(document.getText())) !== null) {
      // Check cancellation periodically during long operations
      if (token.isCancellationRequested) {
        return null;
      }

      const position = document.positionAt(match.index);
      const range = new vscode.Range(position, position.translate(0, 5));

      lenses.push(
        new vscode.CodeLens(range, {
          title: '$(wand) Weave: Optimize',
          command: 'weave.suggestOptimization',
        })
      );
    }

    return lenses;
  }

  /**
   * Resolve code lens
   */
  resolveCodeLens?(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    // Check if cancellation was requested before resolving
    if (token.isCancellationRequested) {
      return null;
    }
    return codeLens;
  }
}
