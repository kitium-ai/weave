/**
 * Evaluation framework types
 */

/**
 * Metric definition
 */
export interface Metric {
  name: string;
  compute: (predicted: unknown, reference: unknown) => number;
  description: string;
}

/**
 * Evaluation result
 */
export interface EvaluationResult {
  metricName: string;
  score: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Test case for evaluation
 */
export interface TestCase {
  id: string;
  input: unknown;
  expectedOutput: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Test run result
 */
export interface TestRunResult {
  testCaseId: string;
  output: unknown;
  results: EvaluationResult[];
  passed: boolean;
  duration: number;
  timestamp: number;
}

/**
 * Test suite
 */
export interface TestSuite {
  name: string;
  description: string;
  testCases: TestCase[];
  metrics: Metric[];
}

/**
 * Test suite run result
 */
export interface TestSuiteRunResult {
  suiteName: string;
  results: TestRunResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    averageScore: number;
    duration: number;
  };
  timestamp: number;
}

/**
 * A/B test configuration
 */
export interface ABTestConfig {
  name: string;
  description: string;
  controlFunction: (input: unknown) => Promise<unknown>;
  treatmentFunction: (input: unknown) => Promise<unknown>;
  testCases: TestCase[];
  metrics: Metric[];
  sampleSize?: number;
}

/**
 * A/B test result
 */
export interface ABTestResult {
  testName: string;
  controlScores: number[];
  treatmentScores: number[];
  controlMean: number;
  treatmentMean: number;
  improvement: number;
  pValue: number;
  isSignificant: boolean;
  duration: number;
  timestamp: number;
}
