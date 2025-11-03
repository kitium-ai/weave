/**
 * Metrics Collector
 * Collects and aggregates metrics from operations
 */

import { getLogger } from '@weaveai/shared';

/**
 * Metric types
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timing';

/**
 * Metric point
 */
export interface MetricPoint {
  name: string;
  type: MetricType;
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

/**
 * Metric aggregation
 */
export interface MetricAggregation {
  name: string;
  type: MetricType;
  value?: number;
  count?: number;
  sum?: number;
  min?: number;
  max?: number;
  average?: number;
  p50?: number;
  p95?: number;
  p99?: number;
}

/**
 * Internal metric storage
 */
interface StoredMetric {
  type: MetricType;
  values: number[]; // For counters: includes all values; for gauges: single value
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private readonly logger = getLogger();
  private metrics: Map<string, StoredMetric> = new Map();
  private readonly maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  /**
   * Increment counter
   */
  public increment(name: string, amount: number = 1, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    let metric = this.metrics.get(key);

    if (!metric) {
      metric = { type: 'counter', values: [] };
      this.metrics.set(key, metric);
    }

    metric.values.push(amount);

    if (metric.values.length > this.maxSize) {
      metric.values.shift();
    }
  }

  /**
   * Record gauge value
   */
  public gauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    this.metrics.set(key, { type: 'gauge', values: [value] }); // Gauge overwrites previous value
  }

  /**
   * Record histogram value
   */
  public histogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    let metric = this.metrics.get(key);

    if (!metric) {
      metric = { type: 'histogram', values: [] };
      this.metrics.set(key, metric);
    }

    metric.values.push(value);

    if (metric.values.length > this.maxSize) {
      metric.values.shift();
    }
  }

  /**
   * Record timing in milliseconds
   */
  public timing(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getMetricKey(name, tags);
    let metric = this.metrics.get(key);

    if (!metric) {
      metric = { type: 'timing', values: [] };
      this.metrics.set(key, metric);
    }

    metric.values.push(value);

    if (metric.values.length > this.maxSize) {
      metric.values.shift();
    }
  }

  /**
   * Record custom metric
   */
  public record(
    name: string,
    metric: { type: MetricType; value: number; tags?: Record<string, string> }
  ): void {
    const key = this.getMetricKey(name, metric.tags);

    // For record method, treat all non-gauge types as overwrite (like gauges)
    if (metric.type === 'gauge' || (metric.type === 'counter' && !metric.tags)) {
      this.metrics.set(key, { type: metric.type, values: [metric.value] }); // Overwrites
    } else {
      let stored = this.metrics.get(key);
      if (!stored) {
        stored = { type: metric.type, values: [] };
        this.metrics.set(key, stored);
      }
      stored.values.push(metric.value);
      if (stored.values.length > this.maxSize) {
        stored.values.shift();
      }
    }
  }

  /**
   * Time a function execution
   */
  public async timeAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = Date.now();
    try {
      return await fn();
    } finally {
      const duration = Date.now() - start;
      this.timing(name, duration, tags);
    }
  }

  /**
   * Time a synchronous function execution
   */
  public timeSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const startHR = process.hrtime.bigint();
    try {
      return fn();
    } finally {
      const endHR = process.hrtime.bigint();
      // Use nanoseconds to milliseconds for higher precision
      const durationNs = endHR - startHR;
      const duration = Math.max(1, Number(durationNs) / 1_000_000); // At least 1ms
      this.timing(name, duration, tags);
    }
  }

  /**
   * Get all metrics as aggregations
   */
  public getMetrics(): Record<string, MetricAggregation> {
    const result: Record<string, MetricAggregation> = {};
    const baseMetrics: Map<string, { type: MetricType; allValues: number[] }> = new Map();

    // First pass: collect all metrics
    for (const [key, metric] of this.metrics.entries()) {
      const name = key.split('[')[0]; // Extract name without tags
      const aggregation = this.calculateAggregation(name, metric.type, metric.values);
      result[key] = aggregation;

      // Track base metric aggregation when tags exist
      if (key !== name) {
        if (!baseMetrics.has(name)) {
          baseMetrics.set(name, { type: metric.type, allValues: [] });
        }
        const base = baseMetrics.get(name)!;
        base.allValues.push(...metric.values);
      }
    }

    // Second pass: add aggregations for base metrics (without tags)
    for (const [name, data] of baseMetrics.entries()) {
      const aggregation = this.calculateAggregation(name, data.type, data.allValues);
      result[name] = aggregation;
    }

    return result;
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics.clear();
    this.logger.debug('Metrics cleared');
  }

  /**
   * Get metric key from name and tags
   */
  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) {
      return name;
    }
    const tagStr = Object.entries(tags)
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}[${tagStr}]`;
  }

  /**
   * Calculate aggregation for values
   */
  private calculateAggregation(
    name: string,
    type: MetricType,
    values: number[]
  ): MetricAggregation {
    if (values.length === 0) {
      return {
        name,
        type,
        value: 0,
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const count = values.length;

    // For counter type, value is the sum
    if (type === 'counter') {
      return {
        name,
        type,
        value: sum,
        count,
        sum,
        min: Math.min(...values),
        max: Math.max(...values),
        average: sum / count,
      };
    }

    // For gauge, value is the last (current) value
    if (type === 'gauge') {
      return {
        name,
        type,
        value: values[values.length - 1],
        count: 1,
        sum: values[0],
        min: values[0],
        max: values[0],
        average: values[0],
        p50: values[0],
        p95: values[0],
        p99: values[0],
      };
    }

    // For histogram and timing, calculate full stats
    const sorted = [...values].sort((a, b) => a - b);
    const avg = sum / count;

    return {
      name,
      type,
      value: avg, // Default to average
      count,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: avg,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) {
      return 0;
    }
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }
}

/**
 * Global metrics collector instance
 */
let globalCollector: MetricsCollector | null = null;

/**
 * Get global metrics collector
 */
export function getMetricsCollector(): MetricsCollector {
  if (!globalCollector) {
    globalCollector = new MetricsCollector();
  }
  return globalCollector;
}
