/**
 * Cost Tracker
 * Tracks token usage and estimates costs for API calls
 */

import { getLogger } from '@weaveai/shared';

/**
 * Token pricing for different models and providers
 */
export interface TokenPricing {
  provider: string;
  model: string;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  currency: string;
}

/**
 * Token usage
 */
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * Cost estimate
 */
export interface UsageCostEstimate {
  provider: string;
  model: string;
  tokenUsage: TokenUsage;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

/**
 * Default pricing for common models
 */
export const DEFAULT_PRICING: Record<string, TokenPricing> = {
  'openai:gpt-4': {
    provider: 'openai',
    model: 'gpt-4',
    inputCostPer1kTokens: 0.03,
    outputCostPer1kTokens: 0.06,
    currency: 'USD',
  },
  'openai:gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    inputCostPer1kTokens: 0.0005,
    outputCostPer1kTokens: 0.0015,
    currency: 'USD',
  },
  'anthropic:claude-3': {
    provider: 'anthropic',
    model: 'claude-3',
    inputCostPer1kTokens: 0.015,
    outputCostPer1kTokens: 0.075,
    currency: 'USD',
  },
  'anthropic:claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-sonnet',
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.015,
    currency: 'USD',
  },
  'google:gemini-pro': {
    provider: 'google',
    model: 'gemini-pro',
    inputCostPer1kTokens: 0.0005,
    outputCostPer1kTokens: 0.0015,
    currency: 'USD',
  },
};

/**
 * Usage details returned by getUsage
 */
export interface UsageDetails {
  totalTokens: number;
  totalCost: number;
  byModel?: Record<string, { tokens: number; cost: number }>;
}

/**
 * Cost tracker for tracking token usage and costs
 */
export class CostTracker {
  private readonly logger = getLogger();
  private pricing: Map<string, TokenPricing> = new Map();
  private usageByModel: Map<string, { inputTokens: number; outputTokens: number; cost: number }> =
    new Map();

  constructor() {
    // Initialize with default pricing
    for (const [key, price] of Object.entries(DEFAULT_PRICING)) {
      this.pricing.set(key, price);
    }
  }

  /**
   * Register custom pricing
   */
  public registerPricing(modelKey: string, pricing: TokenPricing): void {
    this.pricing.set(modelKey, pricing);
    this.logger.debug(`Registered pricing for ${modelKey}`, { pricing });
  }

  /**
   * Estimate cost for token usage
   * @param modelKey Format: "provider:model" (e.g., "openai:gpt-4")
   * @param inputTokens Number of input tokens
   * @param outputTokens Number of output tokens
   * @returns Estimated cost in currency units
   */
  public estimateCost(modelKey: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.pricing.get(modelKey);

    if (!pricing) {
      this.logger.warn(`No pricing found for ${modelKey}`);
      throw new Error(`Unknown model: ${modelKey}`);
    }

    const inputCost = (inputTokens / 1000) * pricing.inputCostPer1kTokens;
    const outputCost = (outputTokens / 1000) * pricing.outputCostPer1kTokens;

    return inputCost + outputCost;
  }

  /**
   * Track API call usage
   */
  public trackUsage(modelKey: string, inputTokens: number, outputTokens: number): void {
    const cost = this.estimateCost(modelKey, inputTokens, outputTokens);
    const existing = this.usageByModel.get(modelKey) || { inputTokens: 0, outputTokens: 0, cost: 0 };

    this.usageByModel.set(modelKey, {
      inputTokens: existing.inputTokens + inputTokens,
      outputTokens: existing.outputTokens + outputTokens,
      cost: existing.cost + cost,
    });

    this.logger.debug(`Tracked usage`, {
      modelKey,
      inputTokens,
      outputTokens,
      cost,
    });
  }

  /**
   * Get total usage and cost
   */
  public getUsage(): UsageDetails {
    let totalTokens = 0;
    let totalCost = 0;
    const byModel: Record<string, { tokens: number; cost: number }> = {};

    for (const [model, usage] of this.usageByModel.entries()) {
      const tokens = usage.inputTokens + usage.outputTokens;
      totalTokens += tokens;
      totalCost += usage.cost;
      byModel[model] = {
        tokens,
        cost: usage.cost,
      };
    }

    return {
      totalTokens,
      totalCost,
      byModel,
    };
  }

  /**
   * Reset tracker
   */
  public resetUsage(): void {
    this.usageByModel.clear();
    this.logger.debug('Cost tracker reset');
  }

  /**
   * Get statistics
   */
  public getStats(): {
    totalCalls: number;
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    estimatedTotalCost: number;
  } {
    const usage = this.getUsage();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const data of this.usageByModel.values()) {
      totalInputTokens += data.inputTokens;
      totalOutputTokens += data.outputTokens;
    }

    return {
      totalCalls: this.usageByModel.size,
      totalTokens: usage.totalTokens,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      estimatedTotalCost: usage.totalCost,
    };
  }
}

/**
 * Global cost tracker instance
 */
let globalCostTracker: CostTracker | null = null;

/**
 * Get global cost tracker
 */
export function getCostTracker(): CostTracker {
  if (!globalCostTracker) {
    globalCostTracker = new CostTracker();
  }
  return globalCostTracker;
}
