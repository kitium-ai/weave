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

const VERSION = '1.0.0';

async function main() {
  try {
    // Check Node version
    const nodeVersion = process.versions.node;
    const [major] = nodeVersion.split('.');

    if (parseInt(major) < 18) {
      console.error(
        chalk.red(`\n✗ Node.js 18+ required (you have ${nodeVersion})\n`)
      );
      process.exit(1);
    }

    // Display welcome message
    console.log(chalk.cyan(`\n🧵 create-weave-app v${VERSION}`));
    console.log(chalk.gray('Interactive scaffolding for Weave AI applications\n'));

    // Validate environment before proceeding
    const envValidation = await validateEnvironment();
    if (!envValidation.valid) {
      console.warn(chalk.yellow(`⚠ ${envValidation.message}`));
      console.log(chalk.gray('Proceeding anyway...\n'));
    }

    // Run create command
    await createCommand();

    console.log(
      chalk.green(
        `\n✓ Project created successfully! 🎉\n`
      )
    );
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('1. cd <project-directory>'));
    console.log(chalk.gray('2. npm install'));
    console.log(chalk.gray('3. npm run dev'));
    console.log(chalk.gray('\nFor more info, visit: https://weave.ai/docs\n'));

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    } else {
      console.error(chalk.red('\n✗ An unexpected error occurred\n'));
    }
    process.exit(1);
  }
}

main();
