/**
 * Cursor Command Handler
 * Handles all Weave commands for Cursor IDE
 */

import * as vscode from 'vscode';
import { CursorWeaveAssistant, WeaveCodeContext } from '../assistant/cursorWeaveAssistant';
import { StatusBarManager } from '../ui/statusBar';
import { CursorChatProvider } from '../providers/chatProvider';

/**
 * Cursor Command Handler with Chat and Inline Edit Support
 */
export class CursorCommandHandler {
  private weaveAssistant: CursorWeaveAssistant;
  private statusBarManager: StatusBarManager;
  private chatProvider: CursorChatProvider;

  constructor(
    weaveAssistant: CursorWeaveAssistant,
    statusBarManager: StatusBarManager,
    chatProvider: CursorChatProvider
  ) {
    this.weaveAssistant = weaveAssistant;
    this.statusBarManager = statusBarManager;
    this.chatProvider = chatProvider;
  }

  /**
   * Open Weave chat panel
   */
  async openChat(): Promise<void> {
    this.statusBarManager.setChatting();
    try {
      this.chatProvider.showChatPanel();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open chat: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.statusBarManager.setReady();
    }
  }

  /**
   * Inline edit - edit code with AI assistance
   */
  async inlineEdit(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select code to edit');
      return;
    }

    const code = editor.document.getText(selection);
    const instruction = await vscode.window.showInputBox({
      placeHolder: 'Enter edit instruction (e.g., "add error handling")',
      title: 'Weave Inline Edit',
    });

    if (!instruction) {
      return;
    }

    const context: WeaveCodeContext = {
      code,
      language: editor.document.languageId,
      fileName: editor.document.fileName,
      line: selection.start.line,
      column: selection.start.character,
    };

    this.statusBarManager.setActive();

    try {
      const editedCode = await this.weaveAssistant.inlineEdit(code, instruction, context);

      // Replace selected text with edited code
      await editor.edit((editBuilder) => {
        editBuilder.replace(selection, editedCode);
      });

      vscode.window.showInformationMessage('Code edited successfully');
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to edit code: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.statusBarManager.setReady();
    }
  }

  /**
   * Generate optimized prompt for selected code
   */
  async generatePrompt(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select code to generate a prompt for');
      return;
    }

    const code = editor.document.getText(selection);
    const context: WeaveCodeContext = {
      code,
      language: editor.document.languageId,
      fileName: editor.document.fileName,
      line: selection.start.line,
      column: selection.start.character,
    };

    this.statusBarManager.setActive();

    try {
      const prompt = await this.weaveAssistant.generatePrompt(context);
      this.showResult('Weave: Generated Prompt', prompt);

      const action = await vscode.window.showInformationMessage(
        'Prompt generated successfully',
        'Copy to Clipboard',
        'Open in Panel'
      );

      if (action === 'Copy to Clipboard') {
        await vscode.env.clipboard.writeText(prompt);
        vscode.window.showInformationMessage('Prompt copied to clipboard');
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to generate prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.statusBarManager.setReady();
    }
  }

  /**
   * Analyze code for insights
   */
  async analyzeCode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select code to analyze');
      return;
    }

    const code = editor.document.getText(selection);
    const context: WeaveCodeContext = {
      code,
      language: editor.document.languageId,
      fileName: editor.document.fileName,
      line: selection.start.line,
      column: selection.start.character,
    };

    this.statusBarManager.setActive();

    try {
      const analysis = await this.weaveAssistant.analyzeCode(context);
      this.showResult('Weave: Code Analysis', analysis);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to analyze code: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.statusBarManager.setReady();
    }
  }

  /**
   * Suggest code optimizations
   */
  async suggestOptimization(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select code to optimize');
      return;
    }

    const code = editor.document.getText(selection);
    const context: WeaveCodeContext = {
      code,
      language: editor.document.languageId,
      fileName: editor.document.fileName,
      line: selection.start.line,
      column: selection.start.character,
    };

    this.statusBarManager.setActive();

    try {
      const suggestions = await this.weaveAssistant.suggestOptimization(context);
      this.showResult('Weave: Optimization Suggestions', suggestions);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.statusBarManager.setReady();
    }
  }

  /**
   * Toggle AI features on/off
   */
  async toggleAIFeatures(): Promise<void> {
    const action = await vscode.window.showQuickPick(
      ['Enable All Features', 'Disable All Features', 'Configure Features'],
      { placeHolder: 'Select action' }
    );

    if (action === 'Enable All Features') {
      vscode.window.showInformationMessage('Weave AI features enabled');
      this.statusBarManager.setReady();
    } else if (action === 'Disable All Features') {
      vscode.window.showInformationMessage('Weave AI features disabled');
      this.statusBarManager.setInactive();
    } else if (action === 'Configure Features') {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'weave.cursorFeatures');
    }
  }

  /**
   * Show result in a new panel
   */
  private showResult(title: string, content: string): void {
    const panel = vscode.window.createWebviewPanel(
      'weaveResult',
      title,
      vscode.ViewColumn.Beside,
      {}
    );

    panel.webview.html = this.getWebviewContent(title, content);
  }

  /**
   * Get webview HTML content
   */
  private getWebviewContent(title: string, content: string): string {
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h1 {
            border-bottom: 2px solid var(--vscode-textLink-foreground);
            padding-bottom: 10px;
            color: var(--vscode-textLink-foreground);
        }
        code {
            background-color: var(--vscode-editor-lineHighlightBackground);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        pre {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editorLineNumber-foreground);
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .copy-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin: 15px 0;
            font-weight: 500;
        }
        .copy-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="content" id="content">${escapedContent}</div>
    <button class="copy-button" onclick="copyToClipboard()">Copy to Clipboard</button>
    <script>
        function copyToClipboard() {
            const content = document.getElementById('content').textContent;
            navigator.clipboard.writeText(content).then(() => {
                alert('Copied to clipboard');
            }).catch(err => {
                alert('Failed to copy: ' + err);
            });
        }
    </script>
</body>
</html>`;
  }
}
