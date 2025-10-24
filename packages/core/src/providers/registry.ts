/**
 * Provider registry for managing language model providers
 */

import { getLogger } from '@weave/shared';
import type { ILanguageModel } from './interfaces.js';
import type { ProviderConfig } from '../types/index.js';
import { ProviderConfigError, ModelNotFoundError } from '../errors/index.js';
import { MockLanguageModel } from './mock.js';

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
   */
  public async createProvider(config: ProviderConfig): Promise<ILanguageModel> {
    const { type } = config;

    // Handle mock provider
    if (type === 'mock') {
      return new MockLanguageModel();
    }

    // For now, only mock is available
    // Other providers will be added in next phase
    throw new ProviderConfigError(`Provider type "${type}" is not supported yet`, {
      supportedTypes: ['mock'],
      requestedType: type,
    });
  }
}

/**
 * Get the global provider registry
 */
export function getProviderRegistry(): ProviderRegistry {
  return ProviderRegistry.getInstance();
}
