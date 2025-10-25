/**
 * Cost Tracker
 * Real-time tracking of LLM API usage and costs
 */

export interface TokenCost {
  input: number; // Cost per 1k input tokens
  output: number; // Cost per 1k output tokens
}

export interface ProviderPricing {
  [model: string]: TokenCost;
}

export interface OperationCost {
  operationId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  timestamp: Date;
}

export interface CostSummary {
  totalOperations: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgCostPerOperation: number;
  costByProvider: Record<string, number>;
  costByModel: Record<string, number>;
}

/**
 * Cost Tracker for LLM operations
 */
export class CostTracker {
  private operations: OperationCost[] = [];
  private pricing: Map<string, ProviderPricing> = new Map();

  constructor() {
    this.initializeDefaultPricing();
  }

  /**
   * Initialize default pricing for major providers
   */
  private initializeDefaultPricing(): void {
    // OpenAI pricing (as of Oct 2024)
    this.pricing.set('openai', {
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    });

    // Anthropic Claude pricing
    this.pricing.set('anthropic', {
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    });

    // Google Vertex AI pricing
    this.pricing.set('google', {
      'gemini-pro': { input: 0.0005, output: 0.0015 },
      'palm-2': { input: 0.0005, output: 0.001 },
    });
  }

  /**
   * Track operation cost
   */
  trackOperation(
    operationId: string,
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): OperationCost {
    const cost = this.calculateCost(provider, model, inputTokens, outputTokens);

    const operation: OperationCost = {
      operationId,
      provider,
      model,
      inputTokens,
      outputTokens,
      inputCost: cost.inputCost,
      outputCost: cost.outputCost,
      totalCost: cost.totalCost,
      timestamp: new Date(),
    };

    this.operations.push(operation);
    return operation;
  }

  /**
   * Calculate cost for tokens
   */
  private calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): { inputCost: number; outputCost: number; totalCost: number } {
    const providerPricing = this.pricing.get(provider);
    if (!providerPricing) {
      console.warn(`Unknown provider: ${provider}`);
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const modelPricing = providerPricing[model];
    if (!modelPricing) {
      console.warn(`Unknown model: ${provider}/${model}`);
      return { inputCost: 0, outputCost: 0, totalCost: 0 };
    }

    const inputCost = (inputTokens / 1000) * modelPricing.input;
    const outputCost = (outputTokens / 1000) * modelPricing.output;

    return {
      inputCost: parseFloat(inputCost.toFixed(6)),
      outputCost: parseFloat(outputCost.toFixed(6)),
      totalCost: parseFloat((inputCost + outputCost).toFixed(6)),
    };
  }

  /**
   * Get cost summary
   */
  getSummary(): CostSummary {
    const costByProvider: Record<string, number> = {};
    const costByModel: Record<string, number> = {};
    let totalCost = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const op of this.operations) {
      totalCost += op.totalCost;
      totalInputTokens += op.inputTokens;
      totalOutputTokens += op.outputTokens;

      costByProvider[op.provider] = (costByProvider[op.provider] || 0) + op.totalCost;
      costByModel[op.model] = (costByModel[op.model] || 0) + op.totalCost;
    }

    return {
      totalOperations: this.operations.length,
      totalInputTokens,
      totalOutputTokens,
      totalCost: parseFloat(totalCost.toFixed(6)),
      avgCostPerOperation:
        this.operations.length > 0
          ? parseFloat((totalCost / this.operations.length).toFixed(6))
          : 0,
      costByProvider,
      costByModel,
    };
  }

  /**
   * Get operations within time range
   */
  getOperationsByDateRange(startDate: Date, endDate: Date): OperationCost[] {
    return this.operations.filter((op) => op.timestamp >= startDate && op.timestamp <= endDate);
  }

  /**
   * Get operations for specific provider
   */
  getOperationsByProvider(provider: string): OperationCost[] {
    return this.operations.filter((op) => op.provider === provider);
  }

  /**
   * Get operations for specific model
   */
  getOperationsByModel(model: string): OperationCost[] {
    return this.operations.filter((op) => op.model === model);
  }

  /**
   * Clear all tracked operations
   */
  clear(): void {
    this.operations = [];
  }

  /**
   * Set custom pricing
   */
  setPricing(provider: string, pricing: ProviderPricing): void {
    this.pricing.set(provider, pricing);
  }

  /**
   * Get all operations
   */
  getAllOperations(): OperationCost[] {
    return [...this.operations];
  }
}

// Singleton instance
export const costTracker = new CostTracker();
