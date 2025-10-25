/**
 * Evaluation framework tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Evaluator } from '../src/evaluation/evaluator.js';
import type { TestSuite, ABTestConfig, Metric } from '../src/evaluation/types.js';

describe('Evaluation Framework', () => {
  let evaluator: Evaluator;

  beforeEach(() => {
    evaluator = new Evaluator();
  });

  describe('Standard metrics', () => {
    it('should create exact match metric', () => {
      const metric = Evaluator.createExactMatchMetric();

      expect(metric.name).toBe('exact_match');
      expect(metric.compute(5, 5)).toBe(1);
      expect(metric.compute(5, 6)).toBe(0);
    });

    it('should create Jaccard similarity metric', () => {
      const metric = Evaluator.createJaccardMetric();

      expect(metric.name).toBe('jaccard_similarity');
      const score = metric.compute('hello world', 'hello world');
      expect(score).toBe(1);
    });

    it('should create BLEU metric', () => {
      const metric = Evaluator.createBLEUMetric();

      expect(metric.name).toBe('bleu');
      const score = metric.compute('the cat is on the mat', 'the cat is on the mat');
      expect(score).toBeGreaterThan(0);
    });

    it('should handle edge cases in metrics', () => {
      const jaccardMetric = Evaluator.createJaccardMetric();
      const score = jaccardMetric.compute('', '');
      expect(score).toBe(1); // Empty strings should be similar
    });
  });

  describe('Test suite execution', () => {
    it('should run a test suite', async () => {
      const testSuite: TestSuite = {
        name: 'Math Tests',
        description: 'Tests for math operations',
        testCases: [
          { id: 'test1', input: { a: 2, b: 2 }, expectedOutput: 4 },
          { id: 'test2', input: { a: 5, b: 3 }, expectedOutput: 8 },
        ],
        metrics: [Evaluator.createExactMatchMetric()],
      };

      const runner = async (input: any) => input.a + input.b;
      const result = await evaluator.runTestSuite(testSuite, runner);

      expect(result.suiteName).toBe('Math Tests');
      expect(result.results).toHaveLength(2);
      expect(result.summary.total).toBe(2);
    });

    it('should evaluate metrics for each test case', async () => {
      const testSuite: TestSuite = {
        name: 'Test Suite',
        description: 'Test suite',
        testCases: [{ id: 'test1', input: 'hello', expectedOutput: 'hello' }],
        metrics: [Evaluator.createExactMatchMetric(), Evaluator.createJaccardMetric()],
      };

      const runner = async (input: any) => input;
      const result = await evaluator.runTestSuite(testSuite, runner);

      expect(result.results[0].results.length).toBe(2);
    });

    it('should calculate summary statistics', async () => {
      const testSuite: TestSuite = {
        name: 'Test Suite',
        description: 'Test suite',
        testCases: [
          { id: 'test1', input: 5, expectedOutput: 5 },
          { id: 'test2', input: 10, expectedOutput: 10 },
          { id: 'test3', input: 15, expectedOutput: 15 },
        ],
        metrics: [Evaluator.createExactMatchMetric()],
      };

      const runner = async (input: any) => input;
      const result = await evaluator.runTestSuite(testSuite, runner);

      expect(result.summary.total).toBe(3);
      expect(result.summary.passed).toBe(3);
      expect(result.summary.failed).toBe(0);
      expect(result.summary.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle test failures', async () => {
      const testSuite: TestSuite = {
        name: 'Test Suite',
        description: 'Test suite',
        testCases: [{ id: 'test1', input: 5, expectedOutput: 10 }],
        metrics: [Evaluator.createExactMatchMetric()],
      };

      const runner = async (input: any) => input;
      const result = await evaluator.runTestSuite(testSuite, runner);

      expect(result.summary.passed).toBe(0);
      expect(result.summary.failed).toBe(1);
    });

    it('should handle runner errors gracefully', async () => {
      const testSuite: TestSuite = {
        name: 'Test Suite',
        description: 'Test suite',
        testCases: [{ id: 'test1', input: 5, expectedOutput: 5 }],
        metrics: [Evaluator.createExactMatchMetric()],
      };

      const failingRunner = async () => {
        throw new Error('Runner failed');
      };

      const result = await evaluator.runTestSuite(testSuite, failingRunner);

      expect(result.results[0].passed).toBe(false);
      expect(result.summary.failed).toBe(1);
    });
  });

  describe('A/B testing', () => {
    it('should run an A/B test', async () => {
      const config: ABTestConfig = {
        name: 'Version Test',
        description: 'Test two versions',
        controlFunction: async (input: any) => input * 2,
        treatmentFunction: async (input: any) => input * 3,
        testCases: [
          { id: 'test1', input: 5, expectedOutput: 10 },
          { id: 'test2', input: 10, expectedOutput: 20 },
        ],
        metrics: [Evaluator.createExactMatchMetric()],
      };

      const result = await evaluator.runABTest(config);

      expect(result.testName).toBe('Version Test');
      expect(result.controlScores).toBeDefined();
      expect(result.treatmentScores).toBeDefined();
      expect(result.controlMean).toBeDefined();
      expect(result.treatmentMean).toBeDefined();
      expect(result.improvement).toBeDefined();
    });

    it('should calculate improvement percentage', async () => {
      const config: ABTestConfig = {
        name: 'Test',
        description: 'Test',
        controlFunction: async () => 80,
        treatmentFunction: async () => 100,
        testCases: [{ id: 'test1', input: 0, expectedOutput: 100 }],
        metrics: [Evaluator.createExactMatchMetric()],
      };

      const result = await evaluator.runABTest(config);

      expect(result.improvement).toBeGreaterThan(0);
    });

    it('should calculate statistical significance', async () => {
      const config: ABTestConfig = {
        name: 'Test',
        description: 'Test',
        controlFunction: async () => 0.5,
        treatmentFunction: async () => 0.6,
        testCases: [{ id: 'test1', input: 0, expectedOutput: 1 }],
        metrics: [Evaluator.createExactMatchMetric()],
      };

      const result = await evaluator.runABTest(config);

      expect(result.pValue).toBeDefined();
      expect(typeof result.isSignificant).toBe('boolean');
    });

    it('should respect sample size limit', async () => {
      const config: ABTestConfig = {
        name: 'Test',
        description: 'Test',
        controlFunction: async () => 1,
        treatmentFunction: async () => 2,
        testCases: [
          { id: 'test1', input: 0, expectedOutput: 1 },
          { id: 'test2', input: 1, expectedOutput: 2 },
          { id: 'test3', input: 2, expectedOutput: 3 },
        ],
        metrics: [Evaluator.createExactMatchMetric()],
        sampleSize: 2,
      };

      const result = await evaluator.runABTest(config);

      expect(result.controlScores.length).toBe(2);
      expect(result.treatmentScores.length).toBe(2);
    });

    it('should handle function errors in A/B test', async () => {
      const config: ABTestConfig = {
        name: 'Test',
        description: 'Test',
        controlFunction: async () => {
          throw new Error('Control failed');
        },
        treatmentFunction: async () => 1,
        testCases: [{ id: 'test1', input: 0, expectedOutput: 1 }],
        metrics: [Evaluator.createExactMatchMetric()],
      };

      const result = await evaluator.runABTest(config);

      expect(result.controlScores[0]).toBe(0);
      expect(result).toBeDefined();
    });
  });

  describe('Metrics', () => {
    it('should compute Jaccard similarity correctly', () => {
      const metric = Evaluator.createJaccardMetric();

      expect(metric.compute('cat dog', 'cat dog bird')).toBeGreaterThan(0);
      expect(metric.compute('cat', 'dog')).toBe(0);
    });

    it('should compute BLEU score', () => {
      const metric = Evaluator.createBLEUMetric();

      const score = metric.compute('the quick brown fox', 'the quick brown fox');
      expect(score).toBe(1);

      const partialScore = metric.compute('the quick fox', 'the quick brown fox');
      expect(partialScore).toBeLessThanOrEqual(1);
      expect(partialScore).toBeGreaterThan(0);
    });

    it('should handle empty strings in metrics', () => {
      const bleuMetric = Evaluator.createBLEUMetric();
      const score = bleuMetric.compute('', '');

      expect(typeof score).toBe('number');
    });
  });
});
