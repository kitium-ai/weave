/**
 * Weave - Main entry point for AI operations
 */

import { getLogger, validateDefined } from '@weave/shared';
import type { ILanguageModel } from './providers/interfaces.js';
import { getProviderRegistry } from './providers/registry.js';
import { GenerateOperation } from './operations/generate.js';
import { ClassifyOperation } from './operations/classify.js';
import { ExtractOperation } from './operations/extract.js';
import type {
  WeaveConfig,
  GenerateOptions,
  GenerateResult,
  ClassifyOptions,
  ClassificationResult,
  ExtractOptions,
} from './types/index.js';
import { ProviderConfigError } from './errors/index.js';
import { MockLanguageModel } from './providers/mock.js';

/**
 * Main Weave AI class
 * Framework-agnostic interface for AI operations
 */
export class Weave {
  private readonly model: ILanguageModel;
  private readonly generateOp: GenerateOperation;
  private readonly classifyOp: ClassifyOperation;
  private readonly extractOp: ExtractOperation;
  private readonly logger = getLogger();

  public constructor(config: WeaveConfig) {
    validateDefined(config, 'config');
    validateDefined(config.provider, 'config.provider');

    this.logger.info('Initializing Weave', {
      provider: config.provider.type,
      logging: config.logging,
    });

    // Create provider from config
    this.model = this.createProvider(config.provider);

    // Initialize operations
    this.generateOp = new GenerateOperation(this.model);
    this.classifyOp = new ClassifyOperation(this.model);
    this.extractOp = new ExtractOperation(this.model);
  }

  /**
   * Generate text from a prompt
   */
  public async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    return this.generateOp.execute(prompt, options);
  }

  /**
   * Classify text into categories
   */
  public async classify(
    text: string,
    labels: string[],
    options?: ClassifyOptions
  ): Promise<ClassificationResult> {
    return this.classifyOp.execute(text, labels, options);
  }

  /**
   * Extract structured data from text
   */
  public async extract(text: string, schema: unknown, options?: ExtractOptions): Promise<unknown> {
    return this.extractOp.execute(text, schema, options);
  }

  /**
   * Get the underlying language model
   */
  public getModel(): ILanguageModel {
    return this.model;
  }

  /**
   * Create provider instance from config
   */
  private createProvider(config: unknown): ILanguageModel {
    const registry = getProviderRegistry();

    // Try to get from registry first (for registered instances)
    if (typeof config === 'object' && config !== null && 'name' in config) {
      const name = (config as Record<string, unknown>).name;
      if (typeof name === 'string' && registry.has(name)) {
        this.logger.debug('Using registered provider', { name });
        return registry.get(name);
      }
    }

    // For mock provider - always available
    if (typeof config === 'object' && config !== null && 'type' in config) {
      const type = (config as Record<string, unknown>).type;
      if (type === 'mock') {
        this.logger.debug('Using mock provider');
        return new MockLanguageModel();
      }
    }

    throw new ProviderConfigError('Invalid provider configuration', { config });
  }
}

/**
 * Create a new Weave instance
 */
export function createWeave(config: WeaveConfig): Weave {
  return new Weave(config);
}
