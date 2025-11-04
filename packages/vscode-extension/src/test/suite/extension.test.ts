/**
 * Extension Test Suite
 * Tests extension activation and basic functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('KitiumAI.weave-assistant'));
  });

  test('Extension should activate', async () => {
    const ext = vscode.extensions.getExtension('KitiumAI.weave-assistant');
    assert.ok(ext);

    if (ext) {
      await ext.activate();
      assert.ok(ext.isActive);
    }
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands();

    const weaveCommands = [
      'weave.generatePrompt',
      'weave.analyzeCode',
      'weave.suggestOptimization',
      'weave.showDocumentation',
      'weave.insertWeaveTemplate',
      'weave.toggleInlineHints',
    ];

    weaveCommands.forEach((command) => {
      assert.ok(
        commands.includes(command),
        `Command ${command} should be registered`
      );
    });
  });
});
