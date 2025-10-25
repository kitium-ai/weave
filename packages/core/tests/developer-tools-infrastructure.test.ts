/**
 * Tests for developer tools infrastructure: debug helper
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DebugHelper, OperationTrace, TraceStatus } from '../src/tools/debug-helper.js';

describe('DebugHelper', () => {
  let helper: DebugHelper;

  beforeEach(() => {
    helper = new DebugHelper();
  });

  describe('initialization', () => {
    it('should initialize with no traces', () => {
      const stats = helper.getStats();

      expect(stats.totalTraces).toBe(0);
      expect(stats.pendingCount).toBe(0);
      expect(stats.successCount).toBe(0);
      expect(stats.errorCount).toBe(0);
    });
  });

  describe('startTrace', () => {
    it('should start a trace', () => {
      helper.startTrace('trace1', 'TestOperation', { key: 'value' });

      const stats = helper.getStats();
      expect(stats.totalTraces).toBe(1);
      expect(stats.pendingCount).toBe(1);
    });

    it('should create trace with correct status', () => {
      helper.startTrace('trace1', 'TestOperation');

      const trace = helper.getTrace('trace1');
      expect(trace).toBeDefined();
      expect(trace!.status).toBe('pending');
    });

    it('should record start time', () => {
      const before = new Date();
      helper.startTrace('trace1', 'TestOperation');
      const after = new Date();

      const trace = helper.getTrace('trace1');
      expect(trace!.startTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(trace!.startTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should record input data', () => {
      const input = { userId: '123', action: 'fetch' };
      helper.startTrace('trace1', 'FetchUser', input);

      const trace = helper.getTrace('trace1');
      expect(trace!.input).toEqual(input);
    });

    it('should record tags', () => {
      const tags = { environment: 'test', version: '1.0' };
      helper.startTrace('trace1', 'TestOperation', undefined, tags);

      const trace = helper.getTrace('trace1');
      expect(trace!.tags).toEqual(tags);
    });

    it('should allow multiple traces', () => {
      helper.startTrace('trace1', 'Operation1');
      helper.startTrace('trace2', 'Operation2');
      helper.startTrace('trace3', 'Operation3');

      const stats = helper.getStats();
      expect(stats.totalTraces).toBe(3);
      expect(stats.pendingCount).toBe(3);
    });

    it('should preserve trace name', () => {
      const name = 'MyComplexOperationName';
      helper.startTrace('trace1', name);

      const trace = helper.getTrace('trace1');
      expect(trace!.name).toBe(name);
    });
  });

  describe('endTrace', () => {
    it('should end a trace successfully', () => {
      helper.startTrace('trace1', 'Operation');
      helper.endTrace('trace1', { result: 'success' });

      const stats = helper.getStats();
      expect(stats.pendingCount).toBe(0);
      expect(stats.successCount).toBe(1);
      expect(stats.errorCount).toBe(0);
    });

    it('should record end time', async () => {
      helper.startTrace('trace1', 'Operation');
      await new Promise((resolve) => setTimeout(resolve, 50));
      helper.endTrace('trace1');

      const trace = helper.getTrace('trace1');
      expect(trace!.endTime).toBeDefined();
      expect(trace!.endTime!.getTime()).toBeGreaterThan(trace!.startTime.getTime());
    });

    it('should calculate duration', async () => {
      helper.startTrace('trace1', 'Operation');
      await new Promise((resolve) => setTimeout(resolve, 100));
      helper.endTrace('trace1');

      const trace = helper.getTrace('trace1');
      expect(trace!.duration).toBeDefined();
      expect(trace!.duration!).toBeGreaterThanOrEqual(100);
    });

    it('should record output data', () => {
      const output = { data: 'result', timestamp: Date.now() };
      helper.startTrace('trace1', 'Operation');
      helper.endTrace('trace1', output);

      const trace = helper.getTrace('trace1');
      expect(trace!.output).toEqual(output);
    });

    it('should set status to success', () => {
      helper.startTrace('trace1', 'Operation');
      helper.endTrace('trace1');

      const trace = helper.getTrace('trace1');
      expect(trace!.status).toBe('success');
    });

    it('should not affect other traces', () => {
      helper.startTrace('trace1', 'Operation1');
      helper.startTrace('trace2', 'Operation2');

      helper.endTrace('trace1');

      const stats = helper.getStats();
      expect(stats.pendingCount).toBe(1);
      expect(stats.successCount).toBe(1);

      const trace2 = helper.getTrace('trace2');
      expect(trace2!.status).toBe('pending');
    });

    it('should handle missing trace gracefully', () => {
      expect(() => {
        helper.endTrace('non-existent');
      }).not.toThrow();
    });
  });

  describe('endTraceWithError', () => {
    it('should end trace with error status', () => {
      helper.startTrace('trace1', 'Operation');
      const error = new Error('Operation failed');
      helper.endTraceWithError('trace1', error);

      const stats = helper.getStats();
      expect(stats.pendingCount).toBe(0);
      expect(stats.errorCount).toBe(1);
      expect(stats.successCount).toBe(0);
    });

    it('should record error information', () => {
      helper.startTrace('trace1', 'Operation');
      const error = new Error('Something went wrong');
      helper.endTraceWithError('trace1', error);

      const trace = helper.getTrace('trace1');
      expect(trace!.status).toBe('error');
      expect(trace!.error).toBeDefined();
      expect((trace!.error as Error).message).toBe('Something went wrong');
    });

    it('should set error status', () => {
      helper.startTrace('trace1', 'Operation');
      helper.endTraceWithError('trace1', new Error('Test error'));

      const trace = helper.getTrace('trace1');
      expect(trace!.status).toBe('error');
    });

    it('should record error duration', async () => {
      helper.startTrace('trace1', 'Operation');
      await new Promise((resolve) => setTimeout(resolve, 50));
      helper.endTraceWithError('trace1', new Error('Failed'));

      const trace = helper.getTrace('trace1');
      expect(trace!.duration).toBeGreaterThanOrEqual(50);
    });

    it('should not affect other traces', () => {
      helper.startTrace('trace1', 'Operation1');
      helper.startTrace('trace2', 'Operation2');

      helper.endTraceWithError('trace1', new Error('Error'));

      const stats = helper.getStats();
      expect(stats.pendingCount).toBe(1);
      expect(stats.errorCount).toBe(1);

      const trace2 = helper.getTrace('trace2');
      expect(trace2!.status).toBe('pending');
    });

    it('should handle missing trace gracefully', () => {
      expect(() => {
        helper.endTraceWithError('non-existent', new Error('Error'));
      }).not.toThrow();
    });
  });

  describe('getTrace', () => {
    it('should retrieve existing trace', () => {
      helper.startTrace('trace1', 'Operation');
      const trace = helper.getTrace('trace1');

      expect(trace).toBeDefined();
      expect(trace!.id).toBe('trace1');
      expect(trace!.name).toBe('Operation');
    });

    it('should return undefined for non-existent trace', () => {
      const trace = helper.getTrace('non-existent');

      expect(trace).toBeUndefined();
    });

    it('should include complete trace information', () => {
      helper.startTrace('trace1', 'Operation', { input: 'data' }, { env: 'test' });
      helper.endTrace('trace1', { output: 'result' });

      const trace = helper.getTrace('trace1');

      expect(trace).toBeDefined();
      expect(trace!.id).toBe('trace1');
      expect(trace!.name).toBe('Operation');
      expect(trace!.input).toEqual({ input: 'data' });
      expect(trace!.output).toEqual({ output: 'result' });
      expect(trace!.tags).toEqual({ env: 'test' });
      expect(trace!.status).toBe('success');
    });
  });

  describe('clearTraces', () => {
    it('should clear all traces', () => {
      helper.startTrace('trace1', 'Operation1');
      helper.startTrace('trace2', 'Operation2');

      let stats = helper.getStats();
      expect(stats.totalTraces).toBe(2);

      helper.clearTraces();

      stats = helper.getStats();
      expect(stats.totalTraces).toBe(0);
      expect(stats.pendingCount).toBe(0);
    });

    it('should allow new traces after clear', () => {
      helper.startTrace('trace1', 'Operation');
      helper.clearTraces();
      helper.startTrace('trace2', 'NewOperation');

      const trace1 = helper.getTrace('trace1');
      const trace2 = helper.getTrace('trace2');

      expect(trace1).toBeUndefined();
      expect(trace2).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return statistics object', () => {
      const stats = helper.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalTraces).toBe('number');
      expect(typeof stats.successCount).toBe('number');
      expect(typeof stats.errorCount).toBe('number');
      expect(typeof stats.pendingCount).toBe('number');
    });

    it('should calculate correct counts', () => {
      helper.startTrace('trace1', 'Op1');
      helper.startTrace('trace2', 'Op2');
      helper.startTrace('trace3', 'Op3');

      helper.endTrace('trace1');
      helper.endTrace('trace2');
      helper.endTraceWithError('trace3', new Error('Error'));

      const stats = helper.getStats();

      expect(stats.totalTraces).toBe(3);
      expect(stats.successCount).toBe(2);
      expect(stats.errorCount).toBe(1);
      expect(stats.pendingCount).toBe(0);
    });

    it('should calculate average duration', async () => {
      helper.startTrace('trace1', 'Op1');
      await new Promise((resolve) => setTimeout(resolve, 50));
      helper.endTrace('trace1');

      helper.startTrace('trace2', 'Op2');
      await new Promise((resolve) => setTimeout(resolve, 100));
      helper.endTrace('trace2');

      const stats = helper.getStats();

      expect(stats.averageDuration).toBeDefined();
      expect(stats.averageDuration).toBeGreaterThan(50);
    });

    it('should handle empty stats', () => {
      const stats = helper.getStats();

      expect(stats.totalTraces).toBe(0);
      expect(stats.averageDuration).toBe(0);
    });

    it('should track pending traces', () => {
      helper.startTrace('trace1', 'Op1');
      helper.startTrace('trace2', 'Op2');

      helper.endTrace('trace1');

      const stats = helper.getStats();

      expect(stats.pendingCount).toBe(1);
      expect(stats.successCount).toBe(1);
    });
  });

  describe('trace lifecycle', () => {
    it('should handle complete lifecycle', async () => {
      // Start trace
      helper.startTrace('op1', 'ProcessData', { items: 100 }, { priority: 'high' });

      let trace = helper.getTrace('op1');
      expect(trace!.status).toBe('pending');

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 50));

      // End trace
      helper.endTrace('op1', { processed: 100 });

      trace = helper.getTrace('op1');
      expect(trace!.status).toBe('success');
      expect(trace!.duration).toBeGreaterThanOrEqual(50);

      // Check stats
      const stats = helper.getStats();
      expect(stats.successCount).toBe(1);
    });

    it('should handle error lifecycle', async () => {
      // Start trace
      helper.startTrace('op1', 'ProcessData', { items: 100 });

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 50));

      // End with error
      const error = new Error('Processing failed');
      helper.endTraceWithError('op1', error);

      const trace = helper.getTrace('op1');
      expect(trace!.status).toBe('error');
      expect(trace!.error).toBe(error);

      // Check stats
      const stats = helper.getStats();
      expect(stats.errorCount).toBe(1);
    });
  });

  describe('multiple operations', () => {
    it('should track multiple concurrent operations', () => {
      helper.startTrace('op1', 'Operation1');
      helper.startTrace('op2', 'Operation2');
      helper.startTrace('op3', 'Operation3');

      const stats = helper.getStats();
      expect(stats.totalTraces).toBe(3);
      expect(stats.pendingCount).toBe(3);

      helper.endTrace('op1');
      helper.endTrace('op2');

      const updatedStats = helper.getStats();
      expect(updatedStats.pendingCount).toBe(1);
      expect(updatedStats.successCount).toBe(2);
    });

    it('should maintain independent trace data', () => {
      const input1 = { data: 'first' };
      const input2 = { data: 'second' };

      helper.startTrace('trace1', 'Op1', input1);
      helper.startTrace('trace2', 'Op2', input2);

      const trace1 = helper.getTrace('trace1');
      const trace2 = helper.getTrace('trace2');

      expect(trace1!.input).toEqual(input1);
      expect(trace2!.input).toEqual(input2);
    });

    it('should handle mixed success and error operations', () => {
      helper.startTrace('op1', 'Op1');
      helper.startTrace('op2', 'Op2');
      helper.startTrace('op3', 'Op3');

      helper.endTrace('op1');
      helper.endTraceWithError('op2', new Error('Failed'));
      helper.endTrace('op3');

      const stats = helper.getStats();
      expect(stats.totalTraces).toBe(3);
      expect(stats.successCount).toBe(2);
      expect(stats.errorCount).toBe(1);
    });
  });

  describe('performance tracking', () => {
    it('should track operation with varying durations', async () => {
      // Fast operation
      helper.startTrace('fast', 'FastOp');
      await new Promise((resolve) => setTimeout(resolve, 10));
      helper.endTrace('fast');

      // Slow operation
      helper.startTrace('slow', 'SlowOp');
      await new Promise((resolve) => setTimeout(resolve, 100));
      helper.endTrace('slow');

      const stats = helper.getStats();
      expect(stats.averageDuration).toBeDefined();
      expect(stats.averageDuration).toBeGreaterThan(10);
      expect(stats.averageDuration).toBeLessThan(100);
    });

    it('should track nested operations', () => {
      // Parent operation
      helper.startTrace('parent', 'ParentOp', { nested: true });

      // Simulate child operations
      helper.startTrace('child1', 'ChildOp1');
      helper.endTrace('child1');

      helper.startTrace('child2', 'ChildOp2');
      helper.endTrace('child2');

      // End parent
      helper.endTrace('parent');

      const stats = helper.getStats();
      expect(stats.totalTraces).toBe(3);
      expect(stats.successCount).toBe(3);
    });
  });

  describe('trace data structure', () => {
    it('should have complete trace structure', () => {
      helper.startTrace('trace1', 'Operation', { input: 'data' }, { tag: 'value' });
      helper.endTrace('trace1', { output: 'data' });

      const trace = helper.getTrace('trace1');

      expect(trace).toEqual(
        expect.objectContaining({
          id: 'trace1',
          name: 'Operation',
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          status: 'success',
          input: { input: 'data' },
          output: { output: 'data' },
          tags: { tag: 'value' },
          duration: expect.any(Number),
        })
      );
    });

    it('should preserve arbitrary tag values', () => {
      const tags = {
        userId: '123',
        endpoint: '/api/users',
        method: 'GET',
        region: 'us-east-1',
        custom: 'value',
      };

      helper.startTrace('trace1', 'Op', undefined, tags);

      const trace = helper.getTrace('trace1');
      expect(trace!.tags).toEqual(tags);
    });

    it('should preserve complex input/output data', () => {
      const complexInput = {
        nested: {
          deep: {
            data: [1, 2, 3],
          },
        },
        array: [{ id: 1 }, { id: 2 }],
      };

      const complexOutput = {
        result: {
          success: true,
          items: [{ processed: true }],
        },
      };

      helper.startTrace('trace1', 'Op', complexInput);
      helper.endTrace('trace1', complexOutput);

      const trace = helper.getTrace('trace1');
      expect(trace!.input).toEqual(complexInput);
      expect(trace!.output).toEqual(complexOutput);
    });
  });
});
