/**
 * Command Handler
 * Handles all Weave commands triggered from VS Code
 */

import * as vscode from 'vscode';
import { WeaveAssistant, WeaveCodeContext } from '../assistant/weaveAssistant';
import { StatusBarManager } from '../ui/statusBar';

/**
 * Command Handler
 */
export class CommandHandler {
  private weaveAssistant: WeaveAssistant;
  private statusBarManager: StatusBarManager;
  private inlineHintsEnabled: boolean = true;

  constructor(weaveAssistant: WeaveAssistant, statusBarManager: StatusBarManager) {
    this.weaveAssistant = weaveAssistant;
    this.statusBarManager = statusBarManager;
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

    try {
      const result = await this.weaveAssistant.generatePrompt(context);

      // Show result in output panel
      this.showResult('Weave: Generated Prompt', result.content);

      // Offer to copy to clipboard
      const action = await vscode.window.showInformationMessage(
        'Prompt generated successfully',
        'Copy to Clipboard',
        'Open in Panel'
      );

      if (action === 'Copy to Clipboard') {
        await vscode.env.clipboard.writeText(result.content);
        vscode.window.showInformationMessage('Prompt copied to clipboard');
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to generate prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

    try {
      const result = await this.weaveAssistant.analyzeCode(context);
      this.showResult('Weave: Code Analysis', result.content);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to analyze code: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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

    try {
      const result = await this.weaveAssistant.suggestOptimization(context);
      this.showResult('Weave: Optimization Suggestions', result.content);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Show Weave documentation
   */
  async showDocumentation(): Promise<void> {
    const docUrl = 'https://github.com/kitium-ai/weave#readme';
    await vscode.env.openExternal(vscode.Uri.parse(docUrl));
  }

  /**
   * Insert Weave code template
   */
  async insertTemplate(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    const templates = [
      {
        label: 'Basic Weave Usage',
        language: 'typescript',
        template: `import { Weave } from '@weaveai/core';

const weave = await Weave.createAsync({
  provider: { type: 'openai', apiKey: process.env.OPENAI_API_KEY },
});

const result = await weave.generate('Write a hello world program');
console.log(result);`,
      },
      {
        label: 'Weave with Classification',
        language: 'typescript',
        template: `const result = await weave.classify(
  'This is a great product!',
  ['positive', 'negative', 'neutral']
);
console.log(result.classification);`,
      },
      {
        label: 'Weave with Extraction',
        language: 'typescript',
        template: `const result = await weave.extract(
  'John Doe, age 30, from New York',
  {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
      city: { type: 'string' },
    },
  }
);
console.log(result.data);`,
      },
    ];

    const selected = await vscode.window.showQuickPick(
      templates.map((t) => t.label),
      { placeHolder: 'Select a template' }
    );

    if (!selected) {
      return;
    }

    const template = templates.find((t) => t.label === selected);
    if (!template) {
      return;
    }

    // Check if language matches
    if (template.language !== editor.document.languageId) {
      const action = await vscode.window.showWarningMessage(
        `Template is for ${template.language}, current file is ${editor.document.languageId}`,
        'Insert anyway',
        'Cancel'
      );

      if (action !== 'Insert anyway') {
        return;
      }
    }

    // Insert template at cursor
    await editor.edit((edit) => {
      edit.insert(editor.selection.active, template.template);
    });

    vscode.window.showInformationMessage('Template inserted');
  }

  /**
   * Toggle inline hints
   */
  async toggleInlineHints(): Promise<void> {
    this.inlineHintsEnabled = !this.inlineHintsEnabled;

    const status = this.inlineHintsEnabled ? 'enabled' : 'disabled';
    vscode.window.showInformationMessage(`Inline hints ${status}`);
    this.statusBarManager.setText(`Weave $(lightbulb) ${status}`);
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
            border-bottom: 1px solid var(--vscode-editorLineNumber-foreground);
            padding-bottom: 10px;
            color: var(--vscode-textLink-foreground);
        }
        code {
            background-color: var(--vscode-editor-lineHighlightBackground);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        pre {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-editorLineNumber-foreground);
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
        .copy-button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 0;
        }
        .copy-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div id="content">${content.replace(/\n/g, '<br>')}</div>
    <button class="copy-button" onclick="copyToClipboard()">Copy to Clipboard</button>
    <script>
        function copyToClipboard() {
            const content = document.getElementById('content').textContent;
            navigator.clipboard.writeText(content).then(() => {
                alert('Copied to clipboard');
            });
        }
    </script>
</body>
</html>`;
  }
}
