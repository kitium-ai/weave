/**
 * Pre-flight validation utilities
 * Checks for common configuration issues before scaffolding
 */

import { execSync } from 'child_process';

export interface ValidationResult {
  valid: boolean;
  message: string;
  warnings: string[];
}

/**
 * Validate environment for Weave application
 */
export async function validateEnvironment(): Promise<ValidationResult> {
  const warnings: string[] = [];

  // Check for git
  try {
    execSync('git --version', { stdio: 'pipe' });
  } catch {
    warnings.push("Git not found - project won't be initialized as a git repo");
  }

  // Check for npm or yarn
  let hasPackageManager = false;
  try {
    execSync('npm --version', { stdio: 'pipe' });
    hasPackageManager = true;
  } catch {
    try {
      execSync('yarn --version', { stdio: 'pipe' });
      hasPackageManager = true;
    } catch {
      // Neither npm nor yarn available
    }
  }

  if (!hasPackageManager) {
    return {
      valid: false,
      message: 'Neither npm nor yarn found',
      warnings,
    };
  }

  // Check for Node version
  const nodeVersion = process.version;
  const [major] = nodeVersion.slice(1).split('.');
  if (parseInt(major) < 18) {
    return {
      valid: false,
      message: `Node.js 18+ required (current: ${nodeVersion})`,
      warnings,
    };
  }

  return {
    valid: true,
    message: 'Environment validation passed',
    warnings,
  };
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): {
  valid: boolean;
  message?: string;
} {
  // Check if name is empty
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Project name cannot be empty' };
  }

  // Check for valid characters
  if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
    return {
      valid: false,
      message: 'Project name can only contain letters, numbers, hyphens, and underscores',
    };
  }

  // Check if starts with number
  if (/^[0-9]/.test(name)) {
    return { valid: false, message: 'Project name cannot start with a number' };
  }

  // Check if name is too long
  if (name.length > 50) {
    return { valid: false, message: 'Project name must be 50 characters or less' };
  }

  return { valid: true };
}

/**
 * Validate API key format for providers
 */
export function validateApiKey(
  provider: string,
  apiKey: string
): { valid: boolean; message?: string } {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, message: 'API key cannot be empty' };
  }

  // Basic validation based on provider
  switch (provider.toLowerCase()) {
    case 'openai':
      if (!apiKey.startsWith('sk-')) {
        return { valid: false, message: 'OpenAI key should start with "sk-"' };
      }
      if (apiKey.length < 48) {
        return { valid: false, message: 'OpenAI key seems too short' };
      }
      break;

    case 'anthropic':
      if (!apiKey.startsWith('sk-ant-')) {
        return { valid: false, message: 'Anthropic key should start with "sk-ant-"' };
      }
      if (apiKey.length < 48) {
        return { valid: false, message: 'Anthropic key seems too short' };
      }
      break;

    case 'google':
      // Google API keys are more variable
      if (apiKey.length < 20) {
        return { valid: false, message: 'Google key seems too short' };
      }
      break;

    default:
      // Generic validation for unknown providers
      if (apiKey.length < 10) {
        return { valid: false, message: 'API key seems too short' };
      }
  }

  return { valid: true };
}

/**
 * Check if directory exists and is empty
 */
export async function checkDirectoryEmpty(dir: string): Promise<{
  exists: boolean;
  isEmpty: boolean;
}> {
  const { existsSync, readdirSync } = await import('fs');

  if (!existsSync(dir)) {
    return { exists: false, isEmpty: true };
  }

  const files = readdirSync(dir);
  return { exists: true, isEmpty: files.length === 0 };
}

/**
 * Validate framework choice
 */
export function validateFramework(framework: string): boolean {
  const validFrameworks = ['react-vite', 'react-nextjs', 'vue', 'svelte', 'angular'];
  return validFrameworks.includes(framework.toLowerCase());
}

/**
 * Validate provider choice
 */
export function validateProvider(provider: string): boolean {
  const validProviders = ['openai', 'anthropic', 'google'];
  return validProviders.includes(provider.toLowerCase());
}

/**
 * Validate model choice for provider
 */
export function validateModel(provider: string, model: string): boolean {
  const modelsByProvider: Record<string, string[]> = {
    openai: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    google: ['gemini-pro', 'palm-2'],
  };

  const models = modelsByProvider[provider.toLowerCase()];
  return models ? models.includes(model) : false;
}
