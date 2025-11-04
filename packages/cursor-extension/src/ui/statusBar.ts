/**
 * Status Bar Manager for Cursor IDE
 * Manages Cursor status bar display
 */

import * as vscode from 'vscode';

/**
 * Status Bar Manager for Cursor
 */
export class StatusBarManager {
  private statusBar: vscode.StatusBarItem;

  constructor() {
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBar.command = 'weave.cursorChat';
    this.statusBar.tooltip = 'Weave AI Assistant for Cursor - Click to open chat (Ctrl+Shift+/)';
    this.setLoading();
    this.statusBar.show();
  }

  /**
   * Set status to ready
   */
  setReady(): void {
    this.statusBar.text = '$(check) Weave Ready';
    this.statusBar.color = new vscode.ThemeColor('statusBarItem.remoteBackground');
  }

  /**
   * Set status to loading
   */
  setLoading(): void {
    this.statusBar.text = '$(loading~spin) Weave Loading...';
  }

  /**
   * Set status to active (chat or operation running)
   */
  setActive(): void {
    this.statusBar.text = '$(lightbulb) Weave Active';
    this.statusBar.color = new vscode.ThemeColor('statusBarItem.warningBackground');
  }

  /**
   * Set status to inactive
   */
  setInactive(): void {
    this.statusBar.text = '$(circle-slash) Weave Inactive';
    this.statusBar.color = new vscode.ThemeColor('statusBarItem.prominentBackground');
  }

  /**
   * Set status to chatting
   */
  setChatting(): void {
    this.statusBar.text = '$(comment) Weave Chatting...';
    this.statusBar.color = new vscode.ThemeColor('statusBarItem.warningBackground');
  }

  /**
   * Set custom text
   */
  setText(text: string): void {
    this.statusBar.text = text;
  }

  /**
   * Dispose status bar
   */
  dispose(): void {
    this.statusBar.dispose();
  }
}
