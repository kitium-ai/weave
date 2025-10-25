/**
 * Provider registry for managing language model providers
 */

import { getLogger } from '@weaveai/shared';
import type { ILanguageModel } from './interfaces.js';
import {
  ProviderConfig,
  OpenAIProviderConfig,
  AnthropicProviderConfig,
  GoogleProviderConfig,
  validateProviderConfig,
  getProviderConfigFromEnv,
} from '../types';
import { ProviderConfigError, ModelNotFoundError } from '../errors';
import { MockLanguageModel } from './mock.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';
import { GoogleProvider } from './google.js';

/**
 * Provider registry singleton
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private readonly providers: Map<string, ILanguageModel> = new Map();
  private readonly logger = getLogger();

  private constructor() {}

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register a provider instance
   */
  public register(name: string, provider: ILanguageModel): void {
    this.providers.set(name, provider);
    this.logger.debug(`Registered provider: ${name}`);
  }

  /**
   * Get a registered provider by name
   */
  public get(name: string): ILanguageModel {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new ModelNotFoundError(name, {
        availableProviders: Array.from(this.providers.keys()),
      });
    }
    return provider;
  }

  /**
   * Check if provider is registered
   */
  public has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Get all registered provider names
   */
  public listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Clear all registered providers
   */
  public clear(): void {
    this.providers.clear();
    this.logger.debug('Cleared all providers');
  }

  /**
   * Create provider from config
   * Supports OpenAI, Anthropic, Google, and Mock providers
   */
  public async createProvider(config: ProviderConfig): Promise<ILanguageModel> {
    const { type } = config;

    this.logger.debug(`Creating provider of type: ${type}`);

    // Validate configuration before creating provider
    const validationErrors = validateProviderConfig(config);
    if (validationErrors.length > 0) {
      throw new ProviderConfigError(
        `Invalid provider configuration: ${validationErrors.join(', ')}`,
        {
          errors: validationErrors,
          providedType: type,
        }
      );
    }

    switch (type) {
      case 'openai': {
        const openaiConfig = config as OpenAIProviderConfig;
        const provider = new OpenAIProvider({
          apiKey: openaiConfig.apiKey,
          model: openaiConfig.model,
          baseUrl: openaiConfig.baseUrl,
          timeout: openaiConfig.timeout,
        });

        this.logger.debug('OpenAI provider created successfully');
        return provider;
      }

      case 'anthropic': {
        const anthropicConfig = config as AnthropicProviderConfig;
        const provider = new AnthropicProvider({
          apiKey: anthropicConfig.apiKey,
          model: anthropicConfig.model,
          baseUrl: anthropicConfig.baseUrl,
          timeout: anthropicConfig.timeout,
        });

        this.logger.debug('Anthropic provider created successfully');
        return provider;
      }

      case 'google': {
        const googleConfig = config as GoogleProviderConfig;
        const provider = new GoogleProvider({
          apiKey: googleConfig.apiKey,
          model: googleConfig.model,
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
          timeout: googleConfig.timeout,
        });

        this.logger.debug('Google provider created successfully');
        return provider;
      }

      case 'local': {
        // Local providers are handled differently - would need implementation
        throw new ProviderConfigError('Local provider support coming in next phase', {
          requestedType: type,
        });
      }

      case 'mock': {
        this.logger.debug('Mock provider created successfully');
        return new MockLanguageModel();
      }

      default: {
        const supportedTypes = ['openai', 'anthropic', 'google', 'mock'];
        throw new ProviderConfigError(`Provider type "${type}" is not supported`, {
          supportedTypes,
          requestedType: type,
        });
      }
    }
  }

  /**
   * Create provider from environment variables
   * Automatically reads from process.env
   */
  public async createProviderFromEnv(
    providerType: 'openai' | 'anthropic' | 'google' | 'local' | 'mock'
  ): Promise<ILanguageModel> {
    this.logger.debug(`Creating provider from environment: ${providerType}`);

    const config = getProviderConfigFromEnv(providerType);
    return this.createProvider(config as ProviderConfig);
  }
}

/**
 * Get the global provider registry
 */
export function getProviderRegistry(): ProviderRegistry {
  return ProviderRegistry.getInstance();
}
