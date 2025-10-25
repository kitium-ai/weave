/**
 * Provider Configuration Types
 * Discriminated union for type-safe provider configuration
 */

/**
 * Base provider configuration shared across all providers
 */
export interface BaseProviderConfig {
  timeout?: number;
  maxRetries?: number;
  logging?: boolean;
}

/**
 * OpenAI Provider Configuration
 */
export interface OpenAIProviderConfig extends BaseProviderConfig {
  type: 'openai';
  apiKey: string;
  model?: string;
  baseUrl?: string;
  organization?: string;
}

/**
 * Anthropic Provider Configuration
 */
export interface AnthropicProviderConfig extends BaseProviderConfig {
  type: 'anthropic';
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Google Vertex AI Provider Configuration
 */
export interface GoogleProviderConfig extends BaseProviderConfig {
  type: 'google';
  apiKey: string;
  projectId: string;
  location?: string;
  model?: string;
}

/**
 * Local/Self-hosted Provider Configuration
 */
export interface LocalProviderConfig extends BaseProviderConfig {
  type: 'local';
  baseUrl: string;
  model?: string;
  apiKey?: string;
}

/**
 * Mock Provider Configuration (for testing)
 */
export interface MockProviderConfig extends BaseProviderConfig {
  type: 'mock';
  delay?: number;
}

/**
 * Discriminated union of all provider configurations
 */
export type ProviderConfig =
  | OpenAIProviderConfig
  | AnthropicProviderConfig
  | GoogleProviderConfig
  | LocalProviderConfig
  | MockProviderConfig;

/**
 * Provider type extracted from discriminated union
 */
export type ProviderType = ProviderConfig['type'];

/**
 * Extract config for a specific provider type
 */
export type ProviderConfigFor<T extends ProviderType> = Extract<ProviderConfig, { type: T }>;

/**
 * Provider fallback configuration
 */
export interface ProviderFallback {
  primary: ProviderConfig;
  fallbacks?: ProviderConfig[];
  strategy?: 'first-success' | 'least-cost' | 'lowest-latency';
  healthCheckIntervalMs?: number;
  circuitBreakerThreshold?: number;
}

/**
 * Type guard for provider config
 */
export function isProviderConfig(config: unknown): config is ProviderConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }
  const obj = config as Record<string, unknown>;
  return (
    typeof obj.type === 'string' &&
    ['openai', 'anthropic', 'google', 'local', 'mock'].includes(obj.type as string)
  );
}

/**
 * Type guard for specific provider type
 */
export function isProviderType<T extends ProviderType>(
  config: ProviderConfig,
  type: T
): config is ProviderConfigFor<T> {
  return config.type === type;
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(config: ProviderConfig): string[] {
  const errors: string[] = [];

  // Check base requirements
  if (config.timeout !== undefined && config.timeout <= 0) {
    errors.push('timeout must be greater than 0');
  }

  if (config.maxRetries !== undefined && config.maxRetries < 0) {
    errors.push('maxRetries must be non-negative');
  }

  // Provider-specific validation
  switch (config.type) {
    case 'openai': {
      const openaiConfig = config as OpenAIProviderConfig;
      if (!openaiConfig.apiKey) {
        errors.push('openai.apiKey is required');
      }
      if (openaiConfig.apiKey && openaiConfig.apiKey.length < 10) {
        errors.push('openai.apiKey appears invalid');
      }
      break;
    }

    case 'anthropic': {
      const anthropicConfig = config as AnthropicProviderConfig;
      if (!anthropicConfig.apiKey) {
        errors.push('anthropic.apiKey is required');
      }
      if (anthropicConfig.apiKey && !anthropicConfig.apiKey.startsWith('sk-ant-')) {
        errors.push('anthropic.apiKey format appears invalid (should start with sk-ant-)');
      }
      break;
    }

    case 'google': {
      const googleConfig = config as GoogleProviderConfig;
      if (!googleConfig.apiKey) {
        errors.push('google.apiKey is required');
      }
      if (!googleConfig.projectId) {
        errors.push('google.projectId is required');
      }
      break;
    }

    case 'local': {
      const localConfig = config as LocalProviderConfig;
      if (!localConfig.baseUrl) {
        errors.push('local.baseUrl is required');
      }
      try {
        new URL(localConfig.baseUrl);
      } catch {
        errors.push('local.baseUrl must be a valid URL');
      }
      break;
    }

    case 'mock': {
      const mockConfig = config as MockProviderConfig;
      if (mockConfig.delay !== undefined && mockConfig.delay < 0) {
        errors.push('mock.delay must be non-negative');
      }
      break;
    }
  }

  return errors;
}

/**
 * Get environment variable for provider config
 */
export function getProviderConfigFromEnv(type: ProviderType): Partial<ProviderConfig> {
  const envMap: Record<ProviderType, Record<string, string>> = {
    openai: {
      apiKey: 'OPENAI_API_KEY',
      baseUrl: 'OPENAI_API_BASE',
      organization: 'OPENAI_ORG_ID',
    },
    anthropic: {
      apiKey: 'ANTHROPIC_API_KEY',
      baseUrl: 'ANTHROPIC_API_BASE',
    },
    google: {
      apiKey: 'GOOGLE_API_KEY',
      projectId: 'GOOGLE_PROJECT_ID',
      location: 'GOOGLE_LOCATION',
    },
    local: {
      baseUrl: 'LOCAL_API_BASE',
      apiKey: 'LOCAL_API_KEY',
    },
    mock: {},
  };

  const envVars = envMap[type];
  const config: Record<string, unknown> = { type };

  for (const [key, envVar] of Object.entries(envVars)) {
    const value = process.env[envVar];
    if (value) {
      config[key] = value;
    }
  }

  return config as Partial<ProviderConfig>;
}
