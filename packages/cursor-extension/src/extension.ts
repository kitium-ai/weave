/**
 * Weave AI Assistant for Cursor IDE
 * Enhanced extension with Cursor-specific features
 */

import * as vscode from 'vscode';
import { logInfo, logError } from '@weaveai/shared/utils/logging';
import { CursorWeaveAssistant } from './assistant/cursorWeaveAssistant';
import { CursorCommandHandler } from './commands/cursorCommandHandler';
import { ConfigurationManager } from './config/configManager';
import { StatusBarManager } from './ui/statusBar';
import { CursorChatProvider } from './providers/chatProvider';

let cursorAssistant: CursorWeaveAssistant | null = null;
let statusBarManager: StatusBarManager | null = null;
let commandHandler: CursorCommandHandler | null = null;
let chatProvider: CursorChatProvider | null = null;

/**
 * Activate the Cursor extension
 */
export async function activate(context: vscode.ExtensionContext) {
  logInfo('Weave AI Assistant for Cursor is activating...');

  try {
    // Initialize configuration manager
    const config = new ConfigurationManager();

    // Initialize status bar
    statusBarManager = new StatusBarManager();

    // Initialize Cursor-optimized assistant
    cursorAssistant = new CursorWeaveAssistant(config);
    await cursorAssistant.initialize();

    // Initialize chat provider
    chatProvider = new CursorChatProvider(cursorAssistant);

    // Register command handlers
    commandHandler = new CursorCommandHandler(cursorAssistant, statusBarManager, chatProvider);
    registerCommands(context, commandHandler);

    // Register webview provider for chat
    registerWebviewProvider(context, chatProvider);

    // Register event listeners
    registerEventListeners(context, config, statusBarManager);

    statusBarManager.setReady();
    logInfo('Weave AI Assistant for Cursor activated successfully');
  } catch (error) {
    logError('Failed to activate Weave AI Assistant', error);
    vscode.window.showErrorMessage('Failed to initialize Weave AI Assistant for Cursor');
  }
}

/**
 * Register commands
 */
function registerCommands(context: vscode.ExtensionContext, commandHandler: CursorCommandHandler) {
  context.subscriptions.push(
    vscode.commands.registerCommand('weave.cursorChat', () => commandHandler.openChat()),
    vscode.commands.registerCommand('weave.inlineEdit', () => commandHandler.inlineEdit()),
    vscode.commands.registerCommand('weave.generatePrompt', () => commandHandler.generatePrompt()),
    vscode.commands.registerCommand('weave.analyzeCode', () => commandHandler.analyzeCode()),
    vscode.commands.registerCommand('weave.suggestOptimization', () =>
      commandHandler.suggestOptimization()
    ),
    vscode.commands.registerCommand('weave.cursorAI', () => commandHandler.toggleAIFeatures())
  );
}

/**
 * Register webview provider for chat
 */
function registerWebviewProvider(
  context: vscode.ExtensionContext,
  chatProvider: CursorChatProvider
) {
  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer('weaveChat', {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: unknown) {
        chatProvider.revivePanel(webviewPanel, state);
      },
    })
  );
}

/**
 * Register event listeners
 */
function registerEventListeners(
  context: vscode.ExtensionContext,
  config: ConfigurationManager,
  statusBarManager: StatusBarManager
) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('weave')) {
        config.reload();
        vscode.window.showInformationMessage('Weave configuration updated');
      }
    }),

    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        statusBarManager?.setActive();
      }
    })
  );
}

/**
 * Deactivate the extension
 */
export function deactivate() {
  logInfo('Weave AI Assistant for Cursor is deactivating...');

  if (cursorAssistant) {
    cursorAssistant.dispose();
  }

  if (statusBarManager) {
    statusBarManager.dispose();
  }
}
