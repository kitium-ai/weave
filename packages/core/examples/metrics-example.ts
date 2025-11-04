/**
 * Metrics Example
 * Demonstrates collecting and tracking operational metrics
 */

import { MetricsCollector } from '../src/observability/metrics-collector.js';
import { logInfo } from '@weaveai/shared';

async function metricsExample() {
  logInfo('=== Metrics Collection ===\n');

  const collector = new MetricsCollector();

  // Counter metrics
  logInfo('--- Counter Metrics ---');
  collector.increment('api_requests', 1, { endpoint: '/users' });
  collector.increment('api_requests', 1, { endpoint: '/users' });
  collector.increment('api_requests', 1, { endpoint: '/posts' });
  collector.increment('api_errors', 1, { error_code: '500' });

  let metrics = collector.getMetrics();
  logInfo(`api_requests: ${metrics['api_requests'].value}`);
  logInfo(`api_errors: ${metrics['api_errors'].value}`);

  // Gauge metrics
  logInfo('\n--- Gauge Metrics ---');
  collector.gauge('memory_usage_mb', 256);
  collector.gauge('active_connections', 42);
  collector.gauge('queue_size', 105);

  metrics = collector.getMetrics();
  logInfo(`memory_usage_mb: ${metrics['memory_usage_mb'].value}`);
  logInfo(`active_connections: ${metrics['active_connections'].value}`);
  logInfo(`queue_size: ${metrics['queue_size'].value}`);

  // Histogram metrics
  logInfo('\n--- Histogram Metrics ---');
  for (let i = 1; i <= 100; i++) {
    collector.histogram('response_time_ms', Math.random() * 1000);
  }

  metrics = collector.getMetrics();
  const histogram = metrics['response_time_ms'];
  logInfo(`Count: ${histogram.count}`);
  logInfo(`Min: ${histogram.min?.toFixed(2)}ms`);
  logInfo(`Max: ${histogram.max?.toFixed(2)}ms`);
  logInfo(`Average: ${histogram.average?.toFixed(2)}ms`);
  logInfo(`P50: ${histogram.p50?.toFixed(2)}ms`);
  logInfo(`P95: ${histogram.p95?.toFixed(2)}ms`);
  logInfo(`P99: ${histogram.p99?.toFixed(2)}ms`);

  // Timing metrics
  logInfo('\n--- Timing Metrics ---');
  const result = await collector.timeAsync('database_query', async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { rows: 100 };
  });

  metrics = collector.getMetrics();
  const timing = metrics['database_query'];
  logInfo(`Query executed in ${timing.sum}ms`);
  logInfo(`Result: ${JSON.stringify(result)}`);

  // Synchronous timing
  const syncResult = collector.timeSync('sync_operation', () => {
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  });

  metrics = collector.getMetrics();
  logInfo(`Sync operation took ${metrics['sync_operation'].sum}ms`);
  logInfo(`Result: ${syncResult}`);

  // Operational flow
  logInfo('\n--- Operational Flow ---');
  collector.clearMetrics();

  // Simulate request processing
  collector.increment('requests_total', 1);

  await collector.timeAsync('request_processing', async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate success
    if (Math.random() > 0.1) {
      collector.increment('requests_success', 1);
    } else {
      collector.increment('requests_failed', 1);
    }
  });

  metrics = collector.getMetrics();
  logInfo(`Total Requests: ${metrics['requests_total'].value}`);
  logInfo(`Successful: ${metrics['requests_success']?.value || 0}`);
  logInfo(`Failed: ${metrics['requests_failed']?.value || 0}`);
  logInfo(`Processing Time: ${metrics['request_processing'].sum}ms`);

  // Get all metrics summary
  logInfo('\n--- All Metrics ---');
  const allMetrics = collector.getMetrics();
  for (const [name, metric] of Object.entries(allMetrics)) {
    logInfo(`${name}: type=${metric.type}, value=${metric.value || metric.count || '...'}`);
  }

  logInfo('\n✓ Metrics example completed\n');
}

export { metricsExample };
