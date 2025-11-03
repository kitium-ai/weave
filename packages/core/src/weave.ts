/**
 * Weave - Main entry point for AI operations
 */

import { getLogger, validateDefined } from '@weaveai/shared';
import type { ILanguageModel } from './providers';
import { getProviderRegistry, MockLanguageModel } from './providers';
import { GenerateOperation, ClassifyOperation, ExtractOperation } from './operations';
import { Agent } from './agents/agent.js';
import type {
  AgentTool,
  AgentConfig,
  AgentThinkingConfig,
} from './agents/types.js';
import type {
  WeaveConfig,
  GenerateOptions,
  GenerateResult,
  ClassifyOptions,
  ClassificationResult,
  ExtractOptions,
  ExtractResult,
} from './types';
import { ProviderConfigError } from './errors';

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
  private readonly agentDefaults = {
    name: 'Weave Agent',
    description: 'An intelligent agent powered by Weave',
  };

  public constructor(config: WeaveConfig) {
    validateDefined(config, 'config');
    validateDefined(config.provider, 'config.provider');

    this.logger.info('Initializing Weave', {
      provider: config.provider.type,
      logging: config.logging,
    });

    // Create provider from config (synchronously for constructor compatibility)
    this.model = this.createProviderSync(config.provider);

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
  public async extract<T = unknown>(
    text: string,
    schema: unknown,
    options?: ExtractOptions
  ): Promise<ExtractResult<T>> {
    return this.extractOp.execute<T>(text, schema, options);
  }

  /**
   * Create an agent instance with optional UI-aware tools
   */
  public createAgent(options: CreateAgentOptions): Agent {
    const normalizedTools = options.tools.map((tool) =>
      this.normalizeAgentTool(tool)
    );

    const agentConfig: AgentConfig = {
      name: options.name ?? this.agentDefaults.name,
      description: options.description ?? options.goal ?? this.agentDefaults.description,
      tools: normalizedTools,
      maxSteps: options.maxSteps,
      temperature: options.temperature,
      systemPrompt: options.systemPrompt,
      goal: options.goal,
      thinking: options.thinking,
    };

    return new Agent(this.model, agentConfig);
  }

  private normalizeAgentTool(tool: AgentToolDefinition): AgentTool {
    if (typeof tool !== 'string') {
      return tool;
    }

    switch (tool) {
      case 'generate':
        return {
          name: 'generate',
          description: 'Generate text using the current provider',
          execute: async (input: unknown) => {
            const { prompt, options } = (input as { prompt?: string; options?: GenerateOptions }) ?? {};
            if (!prompt || typeof prompt !== 'string') {
              throw new Error('Generate tool requires a "prompt" string');
            }
            return this.generate(prompt, options);
          },
        };
      case 'classify':
        return {
          name: 'classify',
          description: 'Classify text into predefined labels',
          execute: async (input: unknown) => {
            const { text, labels, options } =
              (input as { text?: string; labels?: string[]; options?: ClassifyOptions }) ?? {};
            if (!text || typeof text !== 'string') {
              throw new Error('Classify tool requires a "text" string');
            }
            if (!Array.isArray(labels) || labels.length === 0) {
              throw new Error('Classify tool requires a non-empty "labels" array');
            }
            return this.classify(text, labels, options);
          },
        };
      case 'extract':
        return {
          name: 'extract',
          description: 'Extract structured data using a schema',
          execute: async (input: unknown) => {
            const { text, schema, options } =
              (input as { text?: string; schema?: unknown; options?: ExtractOptions }) ?? {};
            if (!text || typeof text !== 'string') {
              throw new Error('Extract tool requires a "text" string');
            }
            if (!schema) {
              throw new Error('Extract tool requires a "schema"');
            }
            return this.extract(text, schema, options);
          },
        };
      default:
        throw new Error(`Unknown built-in agent tool: ${tool}`);
    }
  }

  /**
   * Get the underlying language model
   */
  public getModel(): ILanguageModel {
    return this.model;
  }

  /**
   * Create provider instance from config (synchronous wrapper for constructor)
   * Note: This will throw synchronously for async operations
   */
  private createProviderSync(config: unknown): ILanguageModel {
    const registry = getProviderRegistry();

    // Try to get from registry first (for registered instances)
    if (typeof config === 'object' && config !== null && 'name' in config) {
      const name = (config as Record<string, unknown>).name;
      if (typeof name === 'string' && registry.has(name)) {
        this.logger.debug('Using registered provider', { name });
        return registry.get(name);
      }
    }

    // For config objects, use the registry factory synchronously
    // Note: Provider initialization is currently synchronous for OpenAI/Anthropic/Google
    if (typeof config === 'object' && config !== null && 'type' in config) {
      const type = (config as Record<string, unknown>).type;

      // For now, we support mock synchronously
      // Other providers would need async initialization to validate credentials
      if (type === 'mock') {
        this.logger.debug('Using mock provider');
        return new MockLanguageModel();
      }

      // For other providers, throw an informative error
      // In a real application, you'd want to use async initialization
      if (type === 'openai' || type === 'anthropic' || type === 'google') {
        throw new ProviderConfigError(
          `Provider type "${type}" requires async initialization. Use Weave.createAsync() instead.`,
          {
            type,
            hint: 'Use: const weave = await Weave.createAsync(config)',
          }
        );
      }
    }

    throw new ProviderConfigError('Invalid provider configuration', { config });
  }

  /**
   * Create Weave instance asynchronously with full provider support
   * Use this for OpenAI, Anthropic, or Google providers
   */
  public static async createAsync(config: WeaveConfig): Promise<Weave> {
    validateDefined(config, 'config');
    validateDefined(config.provider, 'config.provider');

    const logger = getLogger();
    logger.info('Initializing Weave (async)', {
      provider: config.provider.type,
      logging: config.logging,
    });

    const registry = getProviderRegistry();

    // Create provider using the registry factory
    const model = await registry.createProvider(config.provider);

    // Create the Weave instance and manually set the model
    const weaveInstance = Object.create(Weave.prototype);
    weaveInstance.logger = logger;
    weaveInstance.model = model;
    weaveInstance.generateOp = new GenerateOperation(model);
    weaveInstance.classifyOp = new ClassifyOperation(model);
    weaveInstance.extractOp = new ExtractOperation(model);

    return weaveInstance as Weave;
  }
}

/**
 * Create a new Weave instance
 */
export function createWeave(config: WeaveConfig): Weave {
  return new Weave(config);
}

export type AgentToolDefinition = AgentTool | 'generate' | 'classify' | 'extract';

export interface CreateAgentOptions {
  name?: string;
  description?: string;
  goal?: string;
  tools: AgentToolDefinition[];
  thinking?: AgentThinkingConfig;
  maxSteps?: number;
  temperature?: number;
  systemPrompt?: string;
}
