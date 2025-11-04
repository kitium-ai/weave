/**
 * Weave AI Assistant VS Code Extension
 * Provides intelligent code assistance powered by the Weave framework
 */

import { logError } from '@weaveai/shared/utils/logging';
import * as vscode from 'vscode';
import { WeaveAssistant } from './assistant/weaveAssistant';
import { CodeCompletionProvider } from './providers/completionProvider';
import { CodeLensProvider } from './providers/codeLensProvider';
import { CommandHandler } from './commands/commandHandler';
import { ConfigurationManager } from './config/configManager';
import { StatusBarManager } from './ui/statusBar';

let weaveAssistant: WeaveAssistant | null = null;
let statusBarManager: StatusBarManager | null = null;
let commandHandler: CommandHandler | null = null;

/**
 * Activate the extension
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('Weave AI Assistant is activating...');

  try {
    // Initialize configuration manager
    const config = new ConfigurationManager();

    // Initialize status bar
    statusBarManager = new StatusBarManager();

    // Initialize Weave assistant
    weaveAssistant = new WeaveAssistant(config);
    await weaveAssistant.initialize();

    // Register command handlers
    commandHandler = new CommandHandler(weaveAssistant, statusBarManager);
    registerCommands(context, commandHandler);

    // Register providers
    registerProviders(context, weaveAssistant);

    // Register event listeners
    registerEventListeners(context, config, statusBarManager);

    statusBarManager.setReady();
    console.log('Weave AI Assistant activated successfully');
  } catch (error) {
    logError('Failed to activate Weave AI Assistant:', error);
    vscode.window.showErrorMessage('Failed to initialize Weave AI Assistant');
  }
}

/**
 * Register commands
 */
function registerCommands(context: vscode.ExtensionContext, commandHandler: CommandHandler) {
  // Main commands
  context.subscriptions.push(
    vscode.commands.registerCommand('weave.generatePrompt', () => commandHandler.generatePrompt()),
    vscode.commands.registerCommand('weave.analyzeCode', () => commandHandler.analyzeCode()),
    vscode.commands.registerCommand('weave.suggestOptimization', () =>
      commandHandler.suggestOptimization()
    ),
    vscode.commands.registerCommand('weave.showDocumentation', () =>
      commandHandler.showDocumentation()
    ),
    vscode.commands.registerCommand('weave.insertWeaveTemplate', () =>
      commandHandler.insertTemplate()
    ),
    vscode.commands.registerCommand('weave.toggleInlineHints', () =>
      commandHandler.toggleInlineHints()
    )
  );
}

/**
 * Register providers
 */
function registerProviders(context: vscode.ExtensionContext, weaveAssistant: WeaveAssistant) {
  const config = vscode.workspace.getConfiguration('weave');

  // Register completion provider
  if (config.get<boolean>('enableCodeCompletion', true)) {
    const completionProvider = new CodeCompletionProvider(weaveAssistant);
    const languages = config.get<string[]>('languageScope', ['typescript', 'javascript', 'python']);

    languages.forEach((language) => {
      context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(language, completionProvider, '.')
      );
    });
  }

  // Register code lens provider
  if (config.get<boolean>('enableCodeLens', true)) {
    const codeLensProvider = new CodeLensProvider(weaveAssistant);
    const languages = config.get<string[]>('languageScope', ['typescript', 'javascript', 'python']);

    languages.forEach((language) => {
      context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(language, codeLensProvider)
      );
    });
  }
}

/**
 * Register event listeners
 */
function registerEventListeners(
  context: vscode.ExtensionContext,
  config: ConfigurationManager,
  statusBarManager: StatusBarManager
) {
  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('weave')) {
        config.reload();
        vscode.window.showInformationMessage('Weave configuration updated');
      }
    })
  );

  // Listen for active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && weaveAssistant) {
        const config = vscode.workspace.getConfiguration('weave');
        const languages = config.get<string[]>('languageScope', [
          'typescript',
          'javascript',
          'python',
        ]);

        if (languages.includes(editor.document.languageId)) {
          statusBarManager?.setActive();
        } else {
          statusBarManager?.setInactive();
        }
      }
    })
  );

  // Listen for text document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (weaveAssistant) {
        const config = vscode.workspace.getConfiguration('weave');
        const languages = config.get<string[]>('languageScope', [
          'typescript',
          'javascript',
          'python',
        ]);

        if (languages.includes(event.document.languageId)) {
          // Could trigger real-time analysis here
        }
      }
    })
  );
}

/**
 * Deactivate the extension
 */
export function deactivate() {
  console.log('Weave AI Assistant is deactivating...');

  if (weaveAssistant) {
    weaveAssistant.dispose();
  }

  if (statusBarManager) {
    statusBarManager.dispose();
  }
}
