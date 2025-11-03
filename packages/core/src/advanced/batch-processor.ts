/**
 * Batch Processor
 * Handle batch operations with rate limiting and retry logic
 */

import { generateBatchJobId } from '@weaveai/shared';
import { configManager } from '../config/index.js';

export interface BatchJob<T = unknown> {
  id: string;
  items: T[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: unknown[];
  errors: BatchError[];
  startTime?: Date;
  endTime?: Date;
  totalTime?: number;
}

export interface BatchError {
  itemIndex: number;
  item: unknown;
  error: string;
  retryCount: number;
}

export interface BatchOptions {
  batchSize?: number; // Items per batch (default: 10)
  maxRetries?: number; // Max retries per item (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 1000)
  timeout?: number; // Timeout per item in ms (default: 30000)
  rateLimit?: number; // Requests per second (default: unlimited)
  onProgress?: (progress: number, jobId: string) => void;
  onError?: (error: BatchError, jobId: string) => void;
}

/**
 * Batch Processor for handling multiple operations
 */
export class BatchProcessor {
  private jobs: Map<string, BatchJob> = new Map();
  private jobQueue: string[] = [];
  private activeJobs: number = 0;
  private maxConcurrent: number = 3;
  private rateLimiter: RateLimiter;
  private currentProcessor: ((item: unknown, retries: number) => Promise<unknown>) | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private maxJobHistory: number;
  private jobTTL: number;
  private cleanupIntervalDuration: number;

  constructor(private options: BatchOptions = {}) {
    const config = configManager.getBatchProcessorConfig();
    const rateLimit = options.rateLimit || config.rateLimit;
    this.rateLimiter = new RateLimiter(rateLimit);
    this.maxJobHistory = config.maxJobHistory;
    this.jobTTL = config.jobTTL;
    this.cleanupIntervalDuration = config.cleanupInterval;
    this.maxConcurrent = config.maxConcurrent;
    this.startAutoCleanup();
  }

  /**
   * Start automatic cleanup interval
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredJobs();
    }, this.cleanupIntervalDuration);

    // Allow process to exit even if cleanup interval is running
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Stop automatic cleanup
   */
  private stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clean up expired jobs to prevent memory leaks
   */
  private cleanupExpiredJobs(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [jobId, job] of this.jobs.entries()) {
      // Delete completed/failed jobs older than TTL
      if ((job.status === 'completed' || job.status === 'failed') && job.endTime) {
        const jobAge = now - job.endTime.getTime();
        if (jobAge > this.jobTTL) {
          toDelete.push(jobId);
        }
      }
    }

    toDelete.forEach((jobId) => this.jobs.delete(jobId));

    // If too many jobs in memory, delete oldest completed ones
    if (this.jobs.size > this.maxJobHistory) {
      const sortedJobs = Array.from(this.jobs.entries()).sort((a, b) => {
        const aTime = a[1].endTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bTime = b[1].endTime?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });

      const jobsToRemove = sortedJobs.length - this.maxJobHistory;
      for (let i = 0; i < jobsToRemove; i++) {
        const [jobId] = sortedJobs[i];
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Submit batch job
   */
  async submitBatch<T>(
    items: T[],
    processor: (item: T, retries: number) => Promise<any>
  ): Promise<BatchJob> {
    const jobId = generateBatchJobId();

    const job: BatchJob<T> = {
      id: jobId,
      items,
      status: 'pending',
      progress: 0,
      results: [],
      errors: [],
    };

    this.jobs.set(jobId, job);
    this.jobQueue.push(jobId);
    this.currentProcessor = processor;

    // Start processing
    this.processQueue();

    // Wait for completion
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (job.status === 'completed' || job.status === 'failed') {
          resolve(job);
        } else {
          setTimeout(checkCompletion, 100);
        }
      };
      checkCompletion();
    });
  }

  /**
   * Process queue of jobs
   */
  private async processQueue(): Promise<void> {
    const config = configManager.getBatchProcessorConfig();
    this.maxConcurrent = config.maxConcurrent;

    while (this.jobQueue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const jobId = this.jobQueue.shift() ?? '';
      const job = this.jobs.get(jobId) ?? undefined;

      this.activeJobs++;
      await this.processJob(job as BatchJob);
      this.activeJobs--;
    }
  }

  /**
   * Process single job
   */
  private async processJob(job: BatchJob): Promise<void> {
    job.status = 'processing';
    job.startTime = new Date();

    const config = configManager.getBatchProcessorConfig();
    const batchSize = this.options.batchSize || config.batchSize;
    const batches = Math.ceil(job.items.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, job.items.length);
      const batch = job.items.slice(start, end);

      await Promise.all(batch.map((item, idx) => this.processItem(job, item, start + idx, 0)));

      job.progress = (end / job.items.length) * 100;
      this.options.onProgress?.(job.progress, job.id);
    }

    job.status = 'completed';
    job.endTime = new Date();
    job.totalTime = job.endTime.getTime() - job.startTime!.getTime();
  }

  /**
   * Process single item with retry logic
   */
  private async processItem(
    job: BatchJob,
    item: any,
    itemIndex: number,
    retryCount: number
  ): Promise<void> {
    const config = configManager.getBatchProcessorConfig();
    const maxRetries = this.options.maxRetries || config.maxRetries;
    const retryDelay = this.options.retryDelay || config.retryDelay;
    const timeout = this.options.timeout || config.timeout;

    try {
      // Rate limiting
      await this.rateLimiter.wait();

      // Process with timeout
      const result = await Promise.race([
        this.executeProcessor(item, retryCount),
        this.createTimeout(timeout),
      ]);

      job.results[itemIndex] = result;
    } catch (error) {
      if (retryCount < maxRetries) {
        // Retry
        await this.delay(retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        await this.processItem(job, item, itemIndex, retryCount + 1);
      } else {
        // Failed
        const batchError: BatchError = {
          itemIndex,
          item,
          error: error instanceof Error ? error.message : String(error),
          retryCount,
        };
        job.errors.push(batchError);
        this.options.onError?.(batchError, job.id);
      }
    }
  }

  /**
   * Execute processor function
   */
  private executeProcessor(item: any, retryCount: number): Promise<any> {
    if (!this.currentProcessor) {
      return Promise.resolve(item);
    }
    return this.currentProcessor(item, retryCount);
  }

  /**
   * Get job status
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status === 'processing') {
      job.status = 'failed';
      return true;
    }
    return false;
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): void {
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Dispose of the batch processor and clean up resources
   */
  dispose(): void {
    this.stopAutoCleanup();
    this.jobs.clear();
    this.jobQueue = [];
    this.currentProcessor = null;
  }

  /**
   * Get job statistics
   */
  getStats(): {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
  } {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      switch (job.status) {
        case 'pending':
          pending++;
          break;
        case 'processing':
          processing++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }

    return {
      totalJobs: this.jobs.size,
      pendingJobs: pending,
      processingJobs: processing,
      completedJobs: completed,
      failedJobs: failed,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
  }
}

/**
 * Rate Limiter
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private requestsPerSecond: number) {
    this.tokens = requestsPerSecond;
    this.lastRefill = Date.now();
  }

  async wait(): Promise<void> {
    if (this.requestsPerSecond === Infinity) {
      return;
    }

    // Refill tokens
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.requestsPerSecond,
      this.tokens + timePassed * this.requestsPerSecond
    );
    this.lastRefill = now;

    // Wait if no tokens available
    if (this.tokens < 1) {
      const waitTime = ((1 - this.tokens) / this.requestsPerSecond) * 1000;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.tokens = 0;
    } else {
      this.tokens--;
    }
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor();
