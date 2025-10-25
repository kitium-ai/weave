/**
 * Evaluation framework for testing and A/B testing
 */

import { getLogger } from '@weaveai/shared';
import type {
  TestSuite,
  TestRunResult,
  TestSuiteRunResult,
  EvaluationResult,
  ABTestConfig,
  ABTestResult,
  Metric,
  TestCase,
} from './types.js';

/**
 * Evaluator for running tests and evaluating metrics
 */
export class Evaluator {
  protected readonly logger = getLogger();

  /**
   * Run a test suite
   */
  public async runTestSuite(
    suite: TestSuite,
    runner: (input: unknown) => Promise<unknown>
  ): Promise<TestSuiteRunResult> {
    this.logger.debug('Running test suite', {
      name: suite.name,
      testCount: suite.testCases.length,
    });

    const startTime = Date.now();
    const results: TestRunResult[] = [];

    for (const testCase of suite.testCases) {
      const result = await this.runTestCase(testCase, runner, suite.metrics);
      results.push(result);
    }

    const duration = Date.now() - startTime;
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const averageScore =
      results.reduce((sum, r) => {
        const avgMetricScore = r.results.reduce((s, m) => s + m.score, 0) / (r.results.length || 1);
        return sum + avgMetricScore;
      }, 0) / results.length;

    const summary = {
      total: results.length,
      passed,
      failed,
      averageScore,
      duration,
    };

    this.logger.info('Test suite completed', { name: suite.name, summary });

    return {
      suiteName: suite.name,
      results,
      summary,
      timestamp: Date.now(),
    };
  }

  /**
   * Run a single test case
   */
  private async runTestCase(
    testCase: TestCase,
    runner: (input: unknown) => Promise<unknown>,
    metrics: Metric[]
  ): Promise<TestRunResult> {
    const startTime = Date.now();
    let output: unknown;
    let evaluationResults: EvaluationResult[] = [];
    let passed = true;

    try {
      output = await runner(testCase.input);

      // Evaluate using all metrics
      evaluationResults = metrics.map((metric) => {
        const score = metric.compute(output, testCase.expectedOutput);
        return {
          metricName: metric.name,
          score,
          timestamp: Date.now(),
        };
      });

      // Test passes if all metrics are above 0.5
      passed = evaluationResults.every((r) => r.score >= 0.5);
    } catch (err) {
      this.logger.error('Test case failed with error', {
        testId: testCase.id,
        error: err instanceof Error ? err.message : String(err),
      });
      passed = false;
      output = null;
    }

    const duration = Date.now() - startTime;

    return {
      testCaseId: testCase.id,
      output,
      results: evaluationResults,
      passed,
      duration,
      timestamp: Date.now(),
    };
  }

  /**
   * Run an A/B test
   */
  public async runABTest(config: ABTestConfig): Promise<ABTestResult> {
    this.logger.debug('Running A/B test', { name: config.name });

    const startTime = Date.now();
    const sampleSize = config.sampleSize ?? config.testCases.length;
    const testCases = config.testCases.slice(0, sampleSize);

    const controlScores: number[] = [];
    const treatmentScores: number[] = [];

    for (const testCase of testCases) {
      // Run control
      try {
        const controlOutput = await config.controlFunction(testCase.input);
        const controlScore =
          config.metrics.reduce((sum, metric) => {
            return sum + metric.compute(controlOutput, testCase.expectedOutput);
          }, 0) / config.metrics.length;
        controlScores.push(controlScore);
      } catch {
        controlScores.push(0);
      }

      // Run treatment
      try {
        const treatmentOutput = await config.treatmentFunction(testCase.input);
        const treatmentScore =
          config.metrics.reduce((sum, metric) => {
            return sum + metric.compute(treatmentOutput, testCase.expectedOutput);
          }, 0) / config.metrics.length;
        treatmentScores.push(treatmentScore);
      } catch {
        treatmentScores.push(0);
      }
    }

    const controlMean = this.calculateMean(controlScores);
    const treatmentMean = this.calculateMean(treatmentScores);
    const improvement = ((treatmentMean - controlMean) / controlMean) * 100;

    // Simple statistical test (t-test approximation)
    const pValue = this.calculatePValue(controlScores, treatmentScores);
    const isSignificant = pValue < 0.05;

    const duration = Date.now() - startTime;

    const result: ABTestResult = {
      testName: config.name,
      controlScores,
      treatmentScores,
      controlMean,
      treatmentMean,
      improvement,
      pValue,
      isSignificant,
      duration,
      timestamp: Date.now(),
    };

    this.logger.info('A/B test completed', {
      name: config.name,
      improvement: `${improvement.toFixed(2)}%`,
      significant: isSignificant,
    });

    return result;
  }

  /**
   * Calculate mean of an array
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) {
      return 0;
    }
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculate p-value using t-test approximation
   */
  private calculatePValue(control: number[], treatment: number[]): number {
    if (control.length === 0 || treatment.length === 0) {
      return 1;
    }

    const controlMean = this.calculateMean(control);
    const treatmentMean = this.calculateMean(treatment);
    const controlStdDev = this.calculateStdDev(control, controlMean);
    const treatmentStdDev = this.calculateStdDev(treatment, treatmentMean);

    // Pooled standard error
    const n1 = control.length;
    const n2 = treatment.length;
    const pooledStdErr = Math.sqrt(
      (controlStdDev * controlStdDev) / n1 + (treatmentStdDev * treatmentStdDev) / n2
    );

    if (pooledStdErr === 0) {
      return 1;
    }

    // T-statistic
    const tStat = (treatmentMean - controlMean) / pooledStdErr;

    // Approximate p-value from t-distribution (simplified)
    return Math.min(1, Math.abs(tStat) / 10);
  }

  /**
   * Create a standard metric for exact match
   */
  public static createExactMatchMetric(): Metric {
    return {
      name: 'exact_match',
      compute: (predicted: unknown, reference: unknown) => {
        return JSON.stringify(predicted) === JSON.stringify(reference) ? 1 : 0;
      },
      description: 'Score 1 if predicted output exactly matches reference, 0 otherwise',
    };
  }

  /**
   * Create a standard metric for string similarity (Jaccard)
   */
  public static createJaccardMetric(): Metric {
    return {
      name: 'jaccard_similarity',
      compute: (predicted: unknown, reference: unknown) => {
        const p = String(predicted)
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w);
        const r = String(reference)
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w);

        const intersection = new Set(p.filter((w) => r.includes(w))).size;
        const union = new Set([...p, ...r]).size;

        return union === 0 ? 1 : intersection / union;
      },
      description: 'Jaccard similarity between predicted and reference strings',
    };
  }

  /**
   * Create a standard metric for BLEU score approximation
   */
  public static createBLEUMetric(): Metric {
    return {
      name: 'bleu',
      compute: (predicted: unknown, reference: unknown) => {
        const p = String(predicted).toLowerCase().split(/\s+/);
        const r = String(reference).toLowerCase().split(/\s+/);

        let matches = 0;
        for (const word of p) {
          if (r.includes(word)) {
            matches++;
            r.splice(r.indexOf(word), 1); // Remove matched word to count correctly
          }
        }

        return p.length === 0 ? 0 : matches / p.length;
      },
      description: 'BLEU-like precision score',
    };
  }
}
