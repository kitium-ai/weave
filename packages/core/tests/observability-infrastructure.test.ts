/**
 * Tests for observability infrastructure: cost tracking and metrics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CostTracker, DEFAULT_PRICING } from '../src/observability/cost-tracker.js';
import { MetricsCollector } from '../src/observability/metrics-collector.js';

describe('CostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  describe('initialization', () => {
    it('should initialize with default pricing', () => {
      const tracker = new CostTracker();
      expect(tracker).toBeDefined();
    });

    it('should have all default models registered', () => {
      const models = [
        'openai:gpt-4',
        'openai:gpt-3.5-turbo',
        'anthropic:claude-3',
        'google:gemini-pro',
      ];

      for (const model of models) {
        expect(() => tracker.estimateCost(model, 1000, 500)).not.toThrow();
      }
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for OpenAI GPT-4', () => {
      const cost = tracker.estimateCost('openai:gpt-4', 1000, 1000);
      expect(cost).toBeGreaterThan(0);
      // GPT-4: 0.03 per 1k input, 0.06 per 1k output
      // Expected: (1000/1000 * 0.03) + (1000/1000 * 0.06) = 0.09
      expect(cost).toBeCloseTo(0.09, 4);
    });

    it('should estimate cost for OpenAI GPT-3.5', () => {
      const cost = tracker.estimateCost('openai:gpt-3.5-turbo', 2000, 1000);
      expect(cost).toBeGreaterThan(0);
      // GPT-3.5: 0.0005 per 1k input, 0.0015 per 1k output
      // Expected: (2000/1000 * 0.0005) + (1000/1000 * 0.0015) = 0.001 + 0.0015 = 0.0025
      expect(cost).toBeCloseTo(0.0025, 6);
    });

    it('should estimate cost for Anthropic Claude', () => {
      const cost = tracker.estimateCost('anthropic:claude-3', 1000, 1000);
      expect(cost).toBeGreaterThan(0);
      // Claude-3: 0.015 per 1k input, 0.075 per 1k output
      // Expected: (1000/1000 * 0.015) + (1000/1000 * 0.075) = 0.09
      expect(cost).toBeCloseTo(0.09, 4);
    });

    it('should estimate cost for Google Gemini', () => {
      const cost = tracker.estimateCost('google:gemini-pro', 1000, 1000);
      expect(cost).toBeGreaterThan(0);
    });

    it('should handle zero tokens', () => {
      const cost = tracker.estimateCost('openai:gpt-4', 0, 0);
      expect(cost).toBe(0);
    });

    it('should handle only input tokens', () => {
      const cost = tracker.estimateCost('openai:gpt-4', 1000, 0);
      expect(cost).toBeCloseTo(0.03, 4);
    });

    it('should handle only output tokens', () => {
      const cost = tracker.estimateCost('openai:gpt-4', 0, 1000);
      expect(cost).toBeCloseTo(0.06, 4);
    });

    it('should throw for unknown model', () => {
      expect(() => tracker.estimateCost('unknown:model', 1000, 1000)).toThrow();
    });

    it('should handle large token counts', () => {
      const cost = tracker.estimateCost('openai:gpt-4', 1000000, 500000);
      expect(cost).toBeGreaterThan(0);
      expect(Number.isFinite(cost)).toBe(true);
    });
  });

  describe('registerPricing', () => {
    it('should register custom pricing', () => {
      const customPricing = {
        provider: 'custom' as const,
        model: 'my-model',
        inputCostPer1kTokens: 0.01,
        outputCostPer1kTokens: 0.02,
        currency: 'USD' as const,
      };

      tracker.registerPricing('custom:my-model', customPricing);
      const cost = tracker.estimateCost('custom:my-model', 1000, 1000);

      expect(cost).toBeCloseTo(0.03, 4);
    });

    it('should override default pricing', () => {
      const originalCost = tracker.estimateCost('openai:gpt-4', 1000, 1000);

      const newPricing = {
        provider: 'openai' as const,
        model: 'gpt-4',
        inputCostPer1kTokens: 0.1,
        outputCostPer1kTokens: 0.2,
        currency: 'USD' as const,
      };

      tracker.registerPricing('openai:gpt-4', newPricing);
      const newCost = tracker.estimateCost('openai:gpt-4', 1000, 1000);

      expect(newCost).not.toBeCloseTo(originalCost, 2);
      expect(newCost).toBeCloseTo(0.3, 4);
    });

    it('should handle different currencies', () => {
      const eurPricing = {
        provider: 'openai' as const,
        model: 'gpt-4-eur',
        inputCostPer1kTokens: 0.03,
        outputCostPer1kTokens: 0.06,
        currency: 'EUR' as const,
      };

      tracker.registerPricing('openai:gpt-4-eur', eurPricing);
      const cost = tracker.estimateCost('openai:gpt-4-eur', 1000, 1000);

      expect(cost).toBeCloseTo(0.09, 4);
    });
  });

  describe('trackUsage', () => {
    it('should track token usage', () => {
      tracker.trackUsage('openai:gpt-4', 1000, 500);

      // Calculate expected cost
      const expectedCost = (1000 / 1000) * 0.03 + (500 / 1000) * 0.06;
      const usage = tracker.getUsage();

      expect(usage).toBeDefined();
    });

    it('should accumulate token counts', () => {
      tracker.trackUsage('openai:gpt-4', 1000, 500);
      tracker.trackUsage('openai:gpt-4', 500, 250);

      // Verify by estimating the second usage
      const firstCost = tracker.estimateCost('openai:gpt-4', 1000, 500);
      const secondCost = tracker.estimateCost('openai:gpt-4', 500, 250);

      expect(firstCost + secondCost).toBeGreaterThan(0);
    });

    it('should track usage for different models', () => {
      tracker.trackUsage('openai:gpt-4', 1000, 500);
      tracker.trackUsage('openai:gpt-3.5-turbo', 2000, 1000);

      const gpt4Cost = tracker.estimateCost('openai:gpt-4', 1000, 500);
      const gpt35Cost = tracker.estimateCost('openai:gpt-3.5-turbo', 2000, 1000);

      expect(gpt4Cost).toBeGreaterThan(gpt35Cost);
    });

    it('should handle zero usage', () => {
      tracker.trackUsage('openai:gpt-4', 0, 0);
      expect(() => tracker.getUsage()).not.toThrow();
    });
  });

  describe('getUsage', () => {
    it('should return usage details', () => {
      tracker.trackUsage('openai:gpt-4', 1000, 500);

      const usage = tracker.getUsage();

      expect(usage).toBeDefined();
      expect(typeof usage.totalTokens).toBe('number');
      expect(typeof usage.totalCost).toBe('number');
    });

    it('should calculate total tokens correctly', () => {
      tracker.trackUsage('openai:gpt-4', 1000, 500);
      tracker.trackUsage('openai:gpt-3.5-turbo', 2000, 1000);

      const usage = tracker.getUsage();

      // Total tokens: 1000 + 500 + 2000 + 1000 = 4500
      expect(usage.totalTokens).toBe(4500);
    });

    it('should calculate total cost across models', () => {
      tracker.trackUsage('openai:gpt-4', 1000, 1000);
      tracker.trackUsage('openai:gpt-3.5-turbo', 1000, 1000);

      const usage = tracker.getUsage();
      const gpt4Cost = (1000 / 1000) * 0.03 + (1000 / 1000) * 0.06; // 0.09
      const gpt35Cost = (1000 / 1000) * 0.0005 + (1000 / 1000) * 0.0015; // 0.002

      expect(usage.totalCost).toBeCloseTo(gpt4Cost + gpt35Cost, 4);
    });
  });

  describe('resetUsage', () => {
    it('should clear all usage', () => {
      tracker.trackUsage('openai:gpt-4', 1000, 500);

      let usage = tracker.getUsage();
      expect(usage.totalTokens).toBeGreaterThan(0);

      tracker.resetUsage();

      usage = tracker.getUsage();
      expect(usage.totalTokens).toBe(0);
      expect(usage.totalCost).toBe(0);
    });

    it('should allow tracking after reset', () => {
      tracker.trackUsage('openai:gpt-4', 1000, 500);
      tracker.resetUsage();
      tracker.trackUsage('openai:gpt-3.5-turbo', 2000, 1000);

      const usage = tracker.getUsage();
      expect(usage.totalTokens).toBe(3000);
    });
  });
});

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('initialization', () => {
    it('should initialize empty', () => {
      expect(collector.getMetrics()).toEqual({});
    });
  });

  describe('counter', () => {
    it('should create and increment counter', () => {
      collector.increment('requests', 1);
      collector.increment('requests', 5);

      const metrics = collector.getMetrics();
      expect(metrics['requests']).toBeDefined();
      expect(metrics['requests'].value).toBe(6);
    });

    it('should handle multiple counters', () => {
      collector.increment('requests', 1);
      collector.increment('errors', 1);
      collector.increment('requests', 2);

      const metrics = collector.getMetrics();
      expect(metrics['requests'].value).toBe(3);
      expect(metrics['errors'].value).toBe(1);
    });

    it('should start from zero', () => {
      const metrics = collector.getMetrics();
      expect(Object.keys(metrics).length).toBe(0);
    });

    it('should handle tags', () => {
      collector.increment('requests', 1, { endpoint: '/api/users' });
      collector.increment('requests', 2, { endpoint: '/api/posts' });

      const metrics = collector.getMetrics();
      expect(metrics['requests']).toBeDefined();
    });
  });

  describe('gauge', () => {
    it('should set and get gauge value', () => {
      collector.gauge('memory_usage', 1024);

      const metrics = collector.getMetrics();
      expect(metrics['memory_usage'].value).toBe(1024);
    });

    it('should overwrite previous value', () => {
      collector.gauge('memory_usage', 1024);
      collector.gauge('memory_usage', 2048);

      const metrics = collector.getMetrics();
      expect(metrics['memory_usage'].value).toBe(2048);
    });

    it('should handle negative values', () => {
      collector.gauge('temperature', -5);

      const metrics = collector.getMetrics();
      expect(metrics['temperature'].value).toBe(-5);
    });

    it('should handle float values', () => {
      collector.gauge('cpu_load', 0.75);

      const metrics = collector.getMetrics();
      expect(metrics['cpu_load'].value).toBe(0.75);
    });

    it('should handle tags', () => {
      collector.gauge('memory_usage', 1024, { process: 'node' });

      const metrics = collector.getMetrics();
      expect(metrics['memory_usage']).toBeDefined();
    });
  });

  describe('histogram', () => {
    it('should record histogram values', () => {
      collector.histogram('response_size', 1024);
      collector.histogram('response_size', 2048);
      collector.histogram('response_size', 512);

      const metrics = collector.getMetrics();
      expect(metrics['response_size']).toBeDefined();
    });

    it('should calculate min and max', () => {
      collector.histogram('values', 10);
      collector.histogram('values', 20);
      collector.histogram('values', 5);

      const metrics = collector.getMetrics();
      expect(metrics['values'].min).toBe(5);
      expect(metrics['values'].max).toBe(20);
    });

    it('should calculate sum and average', () => {
      collector.histogram('values', 10);
      collector.histogram('values', 20);
      collector.histogram('values', 30);

      const metrics = collector.getMetrics();
      expect(metrics['values'].sum).toBe(60);
      expect(metrics['values'].average).toBe(20);
    });

    it('should calculate count', () => {
      collector.histogram('values', 10);
      collector.histogram('values', 20);
      collector.histogram('values', 30);

      const metrics = collector.getMetrics();
      expect(metrics['values'].count).toBe(3);
    });

    it('should calculate percentiles', () => {
      // Add 100 values
      for (let i = 1; i <= 100; i++) {
        collector.histogram('values', i);
      }

      const metrics = collector.getMetrics();
      expect(metrics['values'].p50).toBeDefined();
      expect(metrics['values'].p95).toBeDefined();
      expect(metrics['values'].p99).toBeDefined();

      // Verify percentiles are in reasonable ranges
      expect(metrics['values'].p50).toBeGreaterThanOrEqual(1);
      expect(metrics['values'].p50).toBeLessThanOrEqual(100);
      expect(metrics['values'].p95).toBeGreaterThan(metrics['values'].p50);
      expect(metrics['values'].p99).toBeGreaterThan(metrics['values'].p95);
    });

    it('should handle tags', () => {
      collector.histogram('response_time', 100, { method: 'GET' });
      collector.histogram('response_time', 200, { method: 'POST' });

      const metrics = collector.getMetrics();
      expect(metrics['response_time']).toBeDefined();
    });
  });

  describe('timing', () => {
    it('should record timing duration', () => {
      collector.timing('operation', 1500);

      const metrics = collector.getMetrics();
      expect(metrics['operation']).toBeDefined();
      expect(metrics['operation'].sum).toBe(1500);
      expect(metrics['operation'].count).toBe(1);
    });

    it('should accumulate timing values', () => {
      collector.timing('operation', 100);
      collector.timing('operation', 200);
      collector.timing('operation', 300);

      const metrics = collector.getMetrics();
      expect(metrics['operation'].sum).toBe(600);
      expect(metrics['operation'].count).toBe(3);
      expect(metrics['operation'].average).toBe(200);
    });

    it('should handle tags', () => {
      collector.timing('api_call', 150, { endpoint: '/users' });

      const metrics = collector.getMetrics();
      expect(metrics['api_call']).toBeDefined();
    });
  });

  describe('timeSync', () => {
    it('should measure synchronous function duration', () => {
      const result = collector.timeSync('sync_op', () => {
        // Simulate work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      const metrics = collector.getMetrics();
      expect(metrics['sync_op']).toBeDefined();
      expect(metrics['sync_op'].count).toBe(1);
      expect(metrics['sync_op'].sum).toBeGreaterThan(0);
      expect(result).toBeGreaterThan(0);
    });

    it('should propagate return value', () => {
      const value = collector.timeSync('get_value', () => 42);
      expect(value).toBe(42);
    });

    it('should propagate thrown errors', () => {
      expect(() => {
        collector.timeSync('error_op', () => {
          throw new Error('test error');
        });
      }).toThrow('test error');
    });

    it('should record timing even on error', () => {
      try {
        collector.timeSync('error_op', () => {
          throw new Error('test error');
        });
      } catch {
        // Ignore
      }

      const metrics = collector.getMetrics();
      expect(metrics['error_op']).toBeDefined();
      expect(metrics['error_op'].count).toBe(1);
    });

    it('should handle tags', () => {
      collector.timeSync('sync_op', () => 42, { operation: 'test' });

      const metrics = collector.getMetrics();
      expect(metrics['sync_op']).toBeDefined();
    });
  });

  describe('timeAsync', () => {
    it('should measure async function duration', async () => {
      const result = await collector.timeAsync('async_op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'result';
      });

      const metrics = collector.getMetrics();
      expect(metrics['async_op']).toBeDefined();
      expect(metrics['async_op'].count).toBe(1);
      expect(metrics['async_op'].sum).toBeGreaterThanOrEqual(50);
      expect(result).toBe('result');
    });

    it('should handle multiple async calls', async () => {
      await collector.timeAsync('async_op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await collector.timeAsync('async_op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      const metrics = collector.getMetrics();
      expect(metrics['async_op'].count).toBe(2);
      expect(metrics['async_op'].sum).toBeGreaterThanOrEqual(30);
    });

    it('should propagate return value', async () => {
      const result = await collector.timeAsync('get_value', async () => 42);
      expect(result).toBe(42);
    });

    it('should propagate thrown errors', async () => {
      await expect(
        collector.timeAsync('error_op', async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');
    });

    it('should record timing even on error', async () => {
      try {
        await collector.timeAsync('error_op', async () => {
          throw new Error('test error');
        });
      } catch {
        // Ignore
      }

      const metrics = collector.getMetrics();
      expect(metrics['error_op']).toBeDefined();
      expect(metrics['error_op'].count).toBe(1);
    });

    it('should handle tags', async () => {
      await collector.timeAsync('async_op', async () => 42, { operation: 'test' });

      const metrics = collector.getMetrics();
      expect(metrics['async_op']).toBeDefined();
    });
  });

  describe('record', () => {
    it('should record custom metric', () => {
      collector.record('custom_metric', {
        type: 'counter',
        value: 42,
      });

      const metrics = collector.getMetrics();
      expect(metrics['custom_metric'].value).toBe(42);
    });

    it('should handle multiple values', () => {
      collector.record('metric1', { type: 'counter', value: 10 });
      collector.record('metric2', { type: 'gauge', value: 20 });
      collector.record('metric3', { type: 'histogram', value: 30 });

      const metrics = collector.getMetrics();
      expect(Object.keys(metrics).length).toBe(3);
    });

    it('should overwrite existing metric with same name', () => {
      collector.record('metric', { type: 'counter', value: 10 });
      collector.record('metric', { type: 'counter', value: 20 });

      const metrics = collector.getMetrics();
      expect(metrics['metric'].value).toBe(20);
    });
  });

  describe('getMetrics', () => {
    it('should return all metrics', () => {
      collector.increment('counter1', 10);
      collector.gauge('gauge1', 50);
      collector.histogram('histogram1', 100);

      const metrics = collector.getMetrics();
      expect(Object.keys(metrics).length).toBe(3);
    });

    it('should return snapshot (not mutable reference)', () => {
      collector.increment('counter1', 10);

      const metrics1 = collector.getMetrics();
      collector.increment('counter1', 5);
      const metrics2 = collector.getMetrics();

      expect(metrics1['counter1'].value).toBe(10);
      expect(metrics2['counter1'].value).toBe(15);
    });

    it('should include metric type information', () => {
      collector.increment('counter', 10);
      collector.gauge('gauge', 50);

      const metrics = collector.getMetrics();
      expect(metrics['counter'].type).toBe('counter');
      expect(metrics['gauge'].type).toBe('gauge');
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      collector.increment('counter', 10);
      collector.gauge('gauge', 50);

      collector.clearMetrics();

      const metrics = collector.getMetrics();
      expect(Object.keys(metrics).length).toBe(0);
    });

    it('should allow recording after clear', () => {
      collector.increment('counter', 10);
      collector.clearMetrics();
      collector.increment('new_counter', 5);

      const metrics = collector.getMetrics();
      expect(metrics['counter']).toBeUndefined();
      expect(metrics['new_counter'].value).toBe(5);
    });
  });

  describe('integration', () => {
    it('should combine counter and timing metrics', async () => {
      collector.increment('total_requests', 1);

      await collector.timeAsync('request_duration', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      const metrics = collector.getMetrics();
      expect(metrics['total_requests'].value).toBe(1);
      expect(metrics['request_duration'].count).toBe(1);
      expect(metrics['request_duration'].sum).toBeGreaterThanOrEqual(50);
    });

    it('should track success and error metrics', () => {
      collector.increment('requests_total', 1);
      collector.increment('requests_success', 1);

      try {
        collector.timeSync('request_with_error', () => {
          throw new Error('request failed');
        });
      } catch {
        collector.increment('requests_error', 1);
      }

      const metrics = collector.getMetrics();
      expect(metrics['requests_total'].value).toBe(1);
      expect(metrics['requests_success'].value).toBe(1);
      expect(metrics['requests_error'].value).toBe(1);
    });
  });
});
