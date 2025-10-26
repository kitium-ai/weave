/**
 * Configuration Management
 * Centralized configuration for Weave core features
 */

/**
 * Batch Processing Configuration
 */
export interface BatchProcessorConfig {
  /** Number of items to process per batch (default: 10) */
  batchSize: number;
  /** Maximum number of retries per item (default: 3) */
  maxRetries: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay: number;
  /** Timeout per item in milliseconds (default: 30000) */
  timeout: number;
  /** Maximum requests per second (default: unlimited) */
  rateLimit: number;
  /** Maximum number of completed jobs to keep in memory (default: 1000) */
  maxJobHistory: number;
  /** Job time-to-live in milliseconds before cleanup (default: 1 hour) */
  jobTTL: number;
  /** Cleanup interval in milliseconds (default: 1 minute) */
  cleanupInterval: number;
  /** Maximum concurrent job processing (default: 3) */
  maxConcurrent: number;
}

/**
 * Provider Configuration
 */
export interface ProviderConfig {
  /** Default timeout in milliseconds for API calls (default: 30000) */
  timeout: number;
  /** Maximum number of retries for failed requests (default: 3) */
  maxRetries: number;
  /** Delay multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;
  /** Maximum delay between retries in milliseconds (default: 30000) */
  maxBackoffDelay: number;
}

/**
 * Cost Tracking Configuration
 */
export interface CostTrackerConfig {
  /** Enable cost tracking (default: true) */
  enabled: boolean;
  /** Currency for cost calculations (default: 'USD') */
  currency: string;
  /** Model pricing configuration */
  pricing: ModelPricingConfig;
}

/**
 * Model Pricing Configuration
 */
export interface ModelPricingConfig {
  [provider: string]: {
    [model: string]: {
      input: number; // Cost per 1K input tokens
      output: number; // Cost per 1K output tokens
    };
  };
}

/**
 * Rate Limiting Configuration
 */
export interface RateLimitConfig {
  /** Enabled rate limiting (default: true) */
  enabled: boolean;
  /** Default requests per second (default: 10) */
  defaultRPS: number;
  /** Per-provider rate limits */
  providers: {
    [provider: string]: number; // Requests per second
  };
}

/**
 * Logging Configuration
 */
export interface LoggingConfig {
  /** Enabled console logging (default: true) */
  enabled: boolean;
  /** Minimum log level (default: 'error') */
  minLevel: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  /** Include stack traces in logs (default: false) */
  includeStackTrace: boolean;
  /** Sensitive fields to redact from logs */
  redactedFields: string[];
}

/**
 * Complete Weave Configuration
 */
export interface WeaveConfig {
  batchProcessor: BatchProcessorConfig;
  provider: ProviderConfig;
  costTracker: CostTrackerConfig;
  rateLimit: RateLimitConfig;
  logging: LoggingConfig;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: WeaveConfig = {
  batchProcessor: {
    batchSize: 10,
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    rateLimit: Infinity,
    maxJobHistory: 1000,
    jobTTL: 3600000, // 1 hour
    cleanupInterval: 60000, // 1 minute
    maxConcurrent: 3,
  },
  provider: {
    timeout: 30000,
    maxRetries: 3,
    backoffMultiplier: 2,
    maxBackoffDelay: 30000,
  },
  costTracker: {
    enabled: true,
    currency: 'USD',
    pricing: {
      openai: {
        'gpt-4': { input: 0.03, output: 0.06 },
        'gpt-4-turbo': { input: 0.01, output: 0.03 },
        'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      },
      anthropic: {
        'claude-3-opus': { input: 0.015, output: 0.075 },
        'claude-3-sonnet': { input: 0.003, output: 0.015 },
        'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      },
      google: {
        'gemini-pro': { input: 0.0005, output: 0.0015 },
        'gemini-pro-vision': { input: 0.0005, output: 0.0015 },
      },
    },
  },
  rateLimit: {
    enabled: true,
    defaultRPS: 10,
    providers: {
      openai: 60,
      anthropic: 50,
      google: 40,
    },
  },
  logging: {
    enabled: true,
    minLevel: 'error',
    includeStackTrace: false,
    redactedFields: ['apiKey', 'token', 'password', 'secret', 'authorization'],
  },
};

/**
 * Configuration Manager
 * Centralized configuration management for Weave
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: WeaveConfig = structuredClone(DEFAULT_CONFIG);

  /**
   * Get singleton instance
   */
  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  /**
   * Get current configuration
   */
  public getConfig(): Readonly<WeaveConfig> {
    return Object.freeze(structuredClone(this.config));
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<WeaveConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      // Deep merge nested configs
      batchProcessor: { ...this.config.batchProcessor, ...updates.batchProcessor },
      provider: { ...this.config.provider, ...updates.provider },
      costTracker: { ...this.config.costTracker, ...updates.costTracker },
      rateLimit: { ...this.config.rateLimit, ...updates.rateLimit },
      logging: { ...this.config.logging, ...updates.logging },
    };
  }

  /**
   * Reset to default configuration
   */
  public reset(): void {
    this.config = structuredClone(DEFAULT_CONFIG);
  }

  /**
   * Get batch processor configuration
   */
  public getBatchProcessorConfig(): Readonly<BatchProcessorConfig> {
    return Object.freeze(structuredClone(this.config.batchProcessor));
  }

  /**
   * Get provider configuration
   */
  public getProviderConfig(): Readonly<ProviderConfig> {
    return Object.freeze(structuredClone(this.config.provider));
  }

  /**
   * Get cost tracker configuration
   */
  public getCostTrackerConfig(): Readonly<CostTrackerConfig> {
    return Object.freeze(structuredClone(this.config.costTracker));
  }

  /**
   * Get rate limit configuration
   */
  public getRateLimitConfig(): Readonly<RateLimitConfig> {
    return Object.freeze(structuredClone(this.config.rateLimit));
  }

  /**
   * Get logging configuration
   */
  public getLoggingConfig(): Readonly<LoggingConfig> {
    return Object.freeze(structuredClone(this.config.logging));
  }

  /**
   * Get rate limit for specific provider
   */
  public getProviderRateLimit(provider: string): number {
    return this.config.rateLimit.providers[provider.toLowerCase()] ||
      this.config.rateLimit.defaultRPS;
  }

  /**
   * Get pricing for model
   */
  public getModelPricing(provider: string, model: string): { input: number; output: number } | null {
    const providerPricing = this.config.costTracker.pricing[provider.toLowerCase()];
    if (!providerPricing) {
      return null;
    }
    return providerPricing[model.toLowerCase()] || null;
  }

  /**
   * Validate configuration
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Batch processor validation
    if (this.config.batchProcessor.batchSize < 1) {
      errors.push('batchProcessor.batchSize must be greater than 0');
    }
    if (this.config.batchProcessor.maxRetries < 0) {
      errors.push('batchProcessor.maxRetries must be >= 0');
    }
    if (this.config.batchProcessor.timeout < 100) {
      errors.push('batchProcessor.timeout must be >= 100ms');
    }

    // Provider validation
    if (this.config.provider.timeout < 100) {
      errors.push('provider.timeout must be >= 100ms');
    }
    if (this.config.provider.maxRetries < 0) {
      errors.push('provider.maxRetries must be >= 0');
    }

    // Rate limit validation
    if (this.config.rateLimit.defaultRPS < 1) {
      errors.push('rateLimit.defaultRPS must be >= 1');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Global configuration instance
 */
export const configManager = ConfigurationManager.getInstance();

/**
 * Helper to get configuration
 */
export function getConfig(): Readonly<WeaveConfig> {
  return configManager.getConfig();
}

/**
 * Helper to update configuration
 */
export function updateConfig(updates: Partial<WeaveConfig>): void {
  configManager.updateConfig(updates);
}

/**
 * Helper to reset configuration
 */
export function resetConfig(): void {
  configManager.reset();
}
