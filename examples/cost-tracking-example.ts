/**
 * Cost Tracking Example
 * Demonstrates token usage tracking and cost estimation
 */

import { CostTracker } from '../packages/core/src/observability/cost-tracker.js';

async function costTrackingExample() {
  console.log('=== Cost Tracking ===\n');

  const tracker = new CostTracker();

  // Simulate API calls to different models
  console.log('Tracking token usage...');

  // OpenAI GPT-4
  tracker.trackUsage('openai:gpt-4', 1000, 500);
  console.log('✓ Tracked GPT-4 usage: 1000 input tokens, 500 output tokens');

  // OpenAI GPT-3.5
  tracker.trackUsage('openai:gpt-3.5-turbo', 2000, 1000);
  console.log('✓ Tracked GPT-3.5 usage: 2000 input tokens, 1000 output tokens');

  // Anthropic Claude
  tracker.trackUsage('anthropic:claude-3', 1500, 750);
  console.log('✓ Tracked Claude usage: 1500 input tokens, 750 output tokens');

  // Get usage summary
  const usage = tracker.getUsage();

  console.log('\n--- Usage Summary ---');
  console.log(`Total Tokens: ${usage.totalTokens}`);
  console.log(`Total Cost: $${usage.totalCost.toFixed(4)}`);

  // Estimate cost for individual calls
  console.log('\n--- Cost Breakdown ---');
  const gpt4Cost = tracker.estimateCost('openai:gpt-4', 1000, 500);
  console.log(`GPT-4: $${gpt4Cost.toFixed(6)}`);

  const gpt35Cost = tracker.estimateCost('openai:gpt-3.5-turbo', 2000, 1000);
  console.log(`GPT-3.5: $${gpt35Cost.toFixed(6)}`);

  const claudeCost = tracker.estimateCost('anthropic:claude-3', 1500, 750);
  console.log(`Claude: $${claudeCost.toFixed(6)}`);

  // Register custom pricing
  console.log('\n--- Custom Pricing ---');
  tracker.registerPricing('custom:model', {
    provider: 'custom' as const,
    model: 'model',
    inputCostPer1kTokens: 0.001,
    outputCostPer1kTokens: 0.002,
    currency: 'USD' as const,
  });

  const customCost = tracker.estimateCost('custom:model', 1000, 1000);
  console.log(`Custom Model: $${customCost.toFixed(6)}`);

  // Reset for next billing cycle
  tracker.resetUsage();
  console.log('\n✓ Usage tracker reset for new billing cycle\n');
}

export { costTrackingExample };
