#!/usr/bin/env node
/**
 * create-weave-app CLI
 * Interactive scaffolding for Weave AI applications
 *
 * Features:
 * - Framework selection (React, Vue, Svelte, Angular, Next.js)
 * - Provider selection (OpenAI, Anthropic, Google)
 * - Automatic environment setup
 * - Pre-configured examples
 * - Post-install validation
 *
 * Usage: npx create-weave-app
 */

import { createCommand } from './commands/create.js';
import { validateEnvironment } from './utils/validation.js';
import chalk from 'chalk';
import { logError, logInfo } from '@weaveai/shared';

const VERSION = '1.0.0';

async function main() {
  try {
    // Check Node version
    const nodeVersion = process.versions.node;
    const [major] = nodeVersion.split('.');

    if (parseInt(major) < 18) {
      logError(chalk.red(`\n✗ Node.js 18+ required (you have ${nodeVersion})\n`));
      process.exit(1);
    }

    // Display welcome message
    logInfo(chalk.cyan(`\n🧵 create-weave-app v${VERSION}`));
    logInfo(chalk.gray('Interactive scaffolding for Weave AI applications\n'));

    // Validate environment before proceeding
    const envValidation = await validateEnvironment();
    if (!envValidation.valid) {
      console.warn(chalk.yellow(`⚠ ${envValidation.message}`));
      logInfo(chalk.gray('Proceeding anyway...\n'));
    }

    // Run create command
    await createCommand();

    logInfo(chalk.green(`\n✓ Project created successfully! 🎉\n`));
    logInfo(chalk.cyan('Next steps:'));
    logInfo(chalk.gray('1. cd <project-directory>'));
    logInfo(chalk.gray('2. npm install'));
    logInfo(chalk.gray('3. npm run dev'));
    logInfo(chalk.gray('\nFor more info, visit: https://kitiumai.com/weave\n'));
  } catch (error) {
    if (error instanceof Error) {
      logError(chalk.red(`\n✗ Error: ${error.message}\n`));
      if (process.env.DEBUG) {
        logError(error.stack || '');
      }
    } else {
      logError(chalk.red('\n✗ An unexpected error occurred\n'));
    }
    process.exit(1);
  }
}

main();
