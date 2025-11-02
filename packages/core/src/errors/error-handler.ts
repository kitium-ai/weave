/**
 * Comprehensive error handling system for Weave
 * Provides contextual error messages with solutions
 */

import { WeaveError } from './weave-error.js';

export interface ErrorContext {
  provider?: string;
  operation?: string;
  model?: string;
  details?: Record<string, unknown>;
}

export interface ErrorSolution {
  title: string;
  description: string;
  steps: string[];
  documentation?: string;
  examples?: string[];
}

/**
 * Error messages with solutions
 * Maps error patterns to helpful guidance
 */
export const ERROR_SOLUTIONS: Record<string, ErrorSolution> = {
  INVALID_API_KEY: {
    title: 'Invalid API Key',
    description: 'Your API key is missing, expired, or incorrectly formatted.',
    steps: [
      '1. Check your API key format (should start with "sk-" for OpenAI, "sk-ant-" for Anthropic)',
      '2. Verify the key is not expired or revoked',
      "3. Confirm you're using the correct environment variable (VITE_WEAVE_API_KEY for frontend, process.env.VITE_WEAVE_API_KEY for backend)",
      '4. If using Next.js, ensure the key is in a .env.local file, not .env.local.example',
      '5. Restart your development server after updating the key',
    ],
    documentation: 'https://weave.ai/docs/setup/api-keys',
    examples: [
      'OpenAI: sk-proj-1a2b3c4d5e6f7g8h9i0j',
      'Anthropic: sk-ant-1a2b3c4d5e6f7g8h9i0j',
      'Google: AIzaSyD_1a2b3c4d5e6f7g8h9i0jK',
    ],
  },

  PROVIDER_NOT_FOUND: {
    title: 'Provider Not Found',
    description: 'The specified AI provider is not configured or available.',
    steps: [
      "1. Verify you're using a supported provider (OpenAI, Anthropic, or Google)",
      '2. Check spelling: OPENAI, ANTHROPIC, or GOOGLE',
      '3. Ensure the provider is properly initialized in your Weave configuration',
      "4. If using a custom provider, verify it's registered before use",
    ],
    documentation: 'https://weave.ai/docs/providers',
    examples: [
      'Valid: VITE_WEAVE_PROVIDER=openai',
      'Valid: VITE_WEAVE_PROVIDER=anthropic',
      'Invalid: VITE_WEAVE_PROVIDER=groq (not yet supported)',
    ],
  },

  MODEL_NOT_FOUND: {
    title: 'Model Not Found',
    description: 'The specified model is not available for your provider.',
    steps: [
      '1. Check that the model name is correct',
      '2. Verify the model is available for your provider',
      '3. For OpenAI, valid models: gpt-4-turbo, gpt-4, gpt-3.5-turbo',
      '4. For Anthropic, valid models: claude-3-opus, claude-3-sonnet, claude-3-haiku',
      '5. For Google, valid models: gemini-pro, palm-2',
    ],
    documentation: 'https://weave.ai/docs/models',
  },

  RATE_LIMIT_EXCEEDED: {
    title: 'Rate Limit Exceeded',
    description: "You've exceeded the rate limit for your API provider.",
    steps: [
      '1. Wait before making additional requests',
      "2. Review your provider's rate limit policy",
      '3. Implement exponential backoff in your application',
      '4. Consider upgrading your plan for higher limits',
      '5. Use batch processing for multiple requests',
    ],
    documentation: 'https://weave.ai/docs/advanced/rate-limiting',
  },

  CONTEXT_LENGTH_EXCEEDED: {
    title: 'Context Length Exceeded',
    description: 'Your prompt exceeds the maximum token limit for the model.',
    steps: [
      '1. Reduce the length of your prompt',
      '2. Provide fewer examples in few-shot prompting',
      '3. Summarize longer documents before processing',
      '4. Use a model with higher context limits (e.g., gpt-4-turbo)',
      '5. Split your task into smaller, related requests',
    ],
    documentation: 'https://weave.ai/docs/advanced/token-management',
  },

  NETWORK_ERROR: {
    title: 'Network Connection Error',
    description: 'Unable to connect to the API provider.',
    steps: [
      '1. Check your internet connection',
      "2. Verify your firewall/proxy settings aren't blocking the API",
      "3. Check the provider's status page for outages",
      '4. Try again after a few seconds',
      '5. If the problem persists, check your VPN or network configuration',
    ],
    documentation: 'https://weave.ai/docs/troubleshooting',
  },

  INVALID_REQUEST: {
    title: 'Invalid Request Format',
    description: 'The request format is invalid or missing required fields.',
    steps: [
      '1. Check that all required fields are provided',
      '2. Verify field types match expectations (string, number, array)',
      '3. Ensure JSON is properly formatted if using raw requests',
      '4. Check for missing or extra commas in objects',
      '5. Validate schema using provided TypeScript types',
    ],
    documentation: 'https://weave.ai/docs/api-reference',
  },

  AUTHENTICATION_FAILED: {
    title: 'Authentication Failed',
    description: 'Authentication with the provider failed.',
    steps: [
      '1. Verify your API key is set correctly',
      '2. Check that credentials are not expired',
      '3. Ensure you have the right permissions/scopes',
      '4. Try generating a new API key',
      '5. Clear your environment variables and restart',
    ],
    documentation: 'https://weave.ai/docs/setup',
  },

  PERMISSION_DENIED: {
    title: 'Permission Denied',
    description: "You don't have permission to access this resource.",
    steps: [
      '1. Check your API key permissions',
      '2. Verify your account plan supports this feature',
      '3. Check organization permissions if using teams',
      '4. Review audit logs for credential issues',
      '5. Contact provider support if needed',
    ],
    documentation: 'https://weave.ai/docs/security',
  },

  INVALID_CONFIGURATION: {
    title: 'Invalid Configuration',
    description: 'Your Weave configuration is invalid or incomplete.',
    steps: [
      '1. Verify all required config fields are set',
      '2. Check environment variable names for typos',
      '3. Ensure config object has correct structure',
      '4. Run validation: npx weave validate',
      '5. Check for conflicts with multiple config sources',
    ],
    documentation: 'https://weave.ai/docs/setup/configuration',
    examples: [
      'Valid: { provider: { type: "openai", apiKey: "sk-..." } }',
      'Invalid: { provider: "openai" } // missing apiKey',
    ],
  },

  TYPE_ERROR: {
    title: 'Type Error',
    description: 'A value has the wrong type.',
    steps: [
      '1. Check the expected type in documentation',
      '2. Ensure values are converted to correct type',
      '3. Validate input using schema if available',
      '4. Enable strict TypeScript checking',
      '5. Use type assertions carefully',
    ],
    documentation: 'https://weave.ai/docs/typescript',
  },

  OPERATION_TIMEOUT: {
    title: 'Operation Timeout',
    description: 'The operation took too long and timed out.',
    steps: [
      '1. Check your network speed and latency',
      '2. Try with a simpler prompt or smaller input',
      '3. Increase timeout in config (default: 30s)',
      '4. Check provider status for slow responses',
      '5. Implement retry logic with exponential backoff',
    ],
    documentation: 'https://weave.ai/docs/advanced/timeout',
  },

  PARSING_ERROR: {
    title: 'Response Parsing Error',
    description: "Failed to parse the provider's response.",
    steps: [
      '1. Check if response format matches expected schema',
      '2. Verify the model returned valid JSON',
      '3. Check for unexpected characters in response',
      '4. Enable debug logging to see raw response',
      '5. Report the issue with response details',
    ],
    documentation: 'https://weave.ai/docs/troubleshooting',
  },

  UNKNOWN_ERROR: {
    title: 'Unknown Error',
    description: 'An unexpected error occurred.',
    steps: [
      '1. Check the error details and stack trace',
      '2. Verify all configuration is correct',
      '3. Check Weave documentation for similar issues',
      '4. Try reproducing in a minimal example',
      '5. Report to support with full error details',
    ],
    documentation: 'https://weave.ai/docs/support',
  },
};

/**
 * Extract error code from error message or response
 */
export function extractErrorCode(error: unknown): string {
  if (error instanceof WeaveError) {
    return error.code;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('401') || message.includes('unauthorized')) {
      return 'INVALID_API_KEY';
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return 'PERMISSION_DENIED';
    }
    if (message.includes('404')) {
      return 'MODEL_NOT_FOUND';
    }
    if (message.includes('429') || message.includes('rate limit')) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    if (message.includes('timeout')) {
      return 'OPERATION_TIMEOUT';
    }
    if (message.includes('network') || message.includes('econnrefused')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('invalid') && message.includes('request')) {
      return 'INVALID_REQUEST';
    }
    if (message.includes('parse') || message.includes('json')) {
      return 'PARSING_ERROR';
    }
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Get solution for an error
 */
export function getErrorSolution(errorCode: string): ErrorSolution {
  return ERROR_SOLUTIONS[errorCode] || ERROR_SOLUTIONS['UNKNOWN_ERROR'];
}

/**
 * Format error message with solution
 */
export function formatErrorMessage(error: unknown, context?: ErrorContext): string {
  const code = extractErrorCode(error);
  const solution = getErrorSolution(code);
  const originalMessage = error instanceof Error ? error.message : String(error);

  const lines: string[] = [
    `Summary: ${solution.title}`,
    '',
    solution.description,
    '',
    'Steps to resolve:',
    ...solution.steps.map((step) => `  - ${step}`),
  ];

  if (context?.details) {
    lines.push('');
    lines.push('Context:');
    Object.entries(context.details).forEach(([key, value]) => {
      lines.push(`  - ${key}: ${JSON.stringify(value)}`);
    });
  }

  if (originalMessage) {
    lines.push('');
    lines.push(`Original error: ${originalMessage}`);
  }

  if (solution.documentation) {
    lines.push('');
    lines.push(`Documentation: ${solution.documentation}`);
  }

  if (solution.examples && solution.examples.length > 0) {
    lines.push('');
    lines.push('Examples:');
    solution.examples.forEach((example) => {
      lines.push(`  - ${example}`);
    });
  }

  return lines.join('\n');
}

/**
 * Validate configuration and return issues
 */
export function validateConfiguration(config: Record<string, unknown>): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check provider configuration
  if (!config.provider) {
    errors.push('Missing "provider" configuration');
  } else if (typeof config.provider === 'object') {
    const provider = config.provider as Record<string, unknown>;

    if (!provider.type) {
      errors.push('Missing provider type (openai, anthropic, or google)');
    } else if (!['openai', 'anthropic', 'google'].includes(String(provider.type).toLowerCase())) {
      errors.push(`Unknown provider type: ${provider.type}`);
    }

    if (!provider.apiKey) {
      errors.push('Missing API key for provider');
    } else if (typeof provider.apiKey === 'string') {
      const key = provider.apiKey;
      if (key === 'PLACEHOLDER_API_KEY') {
        warnings.push('API key is still a placeholder - update .env.local before deploying');
      }
      if (key.length < 10) {
        warnings.push('API key seems too short');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
