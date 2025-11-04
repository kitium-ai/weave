/**
 * Generation Service
 * Core business logic for AI content generation with multi-provider support
 */

import { AIExecutionController, CostSummary } from '@weaveai/shared';
import { WeaveError, logInfo, logError } from '@weaveai/shared';
import type { GenerateRequest, GenerateResponse } from '../types/index.js';

interface ProviderConfig {
  type: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model: string;
}

interface GenerationOptions {
  provider: ProviderConfig;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
}

/**
 * Generation Service - Handles AI content generation
 */
export class GenerationService {
  private controller: AIExecutionController<GenerateResponse>;
  private providerConfigs: Map<string, ProviderConfig> = new Map();

  constructor() {
    this.controller = new AIExecutionController({
      trackCosts: true,
      cacheEnabled: true,
      cacheTTL: 3600,
      timeout: 30000,
      budget: {
        perSession: 10.0,
        perHour: 50.0,
        onBudgetExceeded: 'warn'
      }
    });
  }

  /**
   * Register a provider configuration
   */
  registerProvider(name: string, config: ProviderConfig): void {
    this.providerConfigs.set(name, config);
    logInfo(`Provider registered: ${name} (${config.type})`);
  }

  /**
   * Get provider configuration
   */
  getProvider(name: string): ProviderConfig {
    const config = this.providerConfigs.get(name);
    if (!config) {
      throw WeaveError.configError(`Provider not found: ${name}`);
    }
    return config;
  }

  /**
   * Generate content using specified provider
   */
  async generate(
    request: GenerateRequest,
    options: Partial<GenerationOptions> = {}
  ): Promise<GenerateResponse> {
    const startTime = Date.now();

    try {
      const provider = options.provider || this.getProvider('default');

      logInfo('generation.start', {
        provider: provider.type,
        model: provider.model,
        promptLength: request.prompt.length,
      });

      // Execute generation with retry logic
      const result = await this.controller.execute(async () => {
        const generatedText = await this.callProvider(
          provider,
          request.prompt,
          options
        );

        return {
          text: generatedText,
          provider: provider.type,
          model: provider.model,
          tokensUsed: this.estimateTokens(generatedText),
          cost: this.calculateCost(provider.type, generatedText),
          timestamp: new Date(),
          metadata: request.metadata
        };
      });

      if (!result) {
        throw new Error('Generation failed');
      }

      const duration = Date.now() - startTime;

      logInfo('generation.complete', {
        duration,
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        provider: provider.type,
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError('generation.failed', err);
      throw WeaveError.from(err, 'GENERATION_FAILED');
    }
  }

  /**
   * Generate content with streaming
   */
  async *generateStream(
    prompt: string,
    provider: ProviderConfig,
    options: Partial<GenerationOptions> = {}
  ): AsyncGenerator<string> {
    try {
      logInfo('generation.stream.start', { provider: provider.type });

      // Simulate streaming response
      // In real implementation, this would stream from the provider
      const fullText = await this.callProvider(provider, prompt, options);

      // Split into chunks and yield
      const chunkSize = 20;
      for (let i = 0; i < fullText.length; i += chunkSize) {
        yield fullText.slice(i, i + chunkSize);
      }

      logInfo('generation.stream.complete', { provider: provider.type });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError('generation.stream.failed', err);
      throw WeaveError.from(err, 'STREAM_GENERATION_FAILED');
    }
  }

  /**
   * Call the actual provider API
   */
  private async callProvider(
    provider: ProviderConfig,
    prompt: string,
    options: Partial<GenerationOptions>
  ): Promise<string> {
    // This is a placeholder - in real implementation, make actual API calls
    const providers: Record<string, (prompt: string) => Promise<string>> = {
      openai: async (p) => `OpenAI response for: ${p}`,
      anthropic: async (p) => `Claude response for: ${p}`,
      google: async (p) => `Gemini response for: ${p}`,
    };

    const callFn = providers[provider.type];
    if (!callFn) {
      throw WeaveError.configError(`Unknown provider: ${provider.type}`);
    }

    return callFn(prompt);
  }

  /**
   * Estimate token count (simplified)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost based on provider and tokens
   */
  private calculateCost(provider: string, text: string): number {
    const tokens = this.estimateTokens(text);

    const costs: Record<string, number> = {
      openai: 0.00002,      // $0.00002 per token
      anthropic: 0.00008,   // $0.00008 per token
      google: 0.000025,     // $0.000025 per token
    };

    const costPerToken = costs[provider] || 0.00001;
    return tokens * costPerToken;
  }

  /**
   * Get current cost summary
   */
  getCostSummary(): CostSummary | null {
    return this.controller.getState().cost;
  }

  /**
   * Get generation statistics
   */
  getStats(): {
    totalGenerations: number;
    totalCost: number;
    averageTokensPerGeneration: number;
  } {
    const state = this.controller.getState();
    return {
      totalGenerations: 1, // Would track across requests
      totalCost: state.cost?.totalCost || 0,
      averageTokensPerGeneration: 150, // Would calculate
    };
  }

  /**
   * Reset cost tracking
   */
  resetCosts(): void {
    this.controller.resetCost();
    logInfo('costs.reset', {});
  }
}

// Export singleton instance
export const generationService = new GenerationService();
