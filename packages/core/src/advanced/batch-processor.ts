/**
 * Batch Processor
 * Handle batch operations with rate limiting and retry logic
 */

export interface BatchJob<T = any> {
  id: string
  items: T[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  results: any[]
  errors: BatchError[]
  startTime?: Date
  endTime?: Date
  totalTime?: number
}

export interface BatchError {
  itemIndex: number
  item: any
  error: string
  retryCount: number
}

export interface BatchOptions {
  batchSize?: number            // Items per batch (default: 10)
  maxRetries?: number            // Max retries per item (default: 3)
  retryDelay?: number            // Delay between retries in ms (default: 1000)
  timeout?: number               // Timeout per item in ms (default: 30000)
  rateLimit?: number             // Requests per second (default: unlimited)
  onProgress?: (progress: number, jobId: string) => void
  onError?: (error: BatchError, jobId: string) => void
}

/**
 * Batch Processor for handling multiple operations
 */
export class BatchProcessor {
  private jobs: Map<string, BatchJob> = new Map()
  private jobQueue: string[] = []
  private activeJobs: number = 0
  private maxConcurrent: number = 3
  private rateLimiter: RateLimiter
  private currentProcessor: ((item: any, retries: number) => Promise<any>) | null = null

  constructor(private options: BatchOptions = {}) {
    const rateLimit = options.rateLimit || Infinity
    this.rateLimiter = new RateLimiter(rateLimit)
  }

  /**
   * Submit batch job
   */
  async submitBatch<T>(
    items: T[],
    processor: (item: T, retries: number) => Promise<any>
  ): Promise<BatchJob> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const job: BatchJob<T> = {
      id: jobId,
      items,
      status: 'pending',
      progress: 0,
      results: [],
      errors: []
    }

    this.jobs.set(jobId, job)
    this.jobQueue.push(jobId)
    this.currentProcessor = processor

    // Start processing
    this.processQueue()

    // Wait for completion
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (job.status === 'completed' || job.status === 'failed') {
          resolve(job)
        } else {
          setTimeout(checkCompletion, 100)
        }
      }
      checkCompletion()
    })
  }

  /**
   * Process queue of jobs
   */
  private async processQueue(): Promise<void> {
    while (this.jobQueue.length > 0 && this.activeJobs < this.maxConcurrent) {
      const jobId = this.jobQueue.shift()!
      const job = this.jobs.get(jobId)!

      this.activeJobs++
      await this.processJob(job)
      this.activeJobs--
    }
  }

  /**
   * Process single job
   */
  private async processJob(job: BatchJob): Promise<void> {
    job.status = 'processing'
    job.startTime = new Date()

    const batchSize = this.options.batchSize || 10
    const batches = Math.ceil(job.items.length / batchSize)

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize
      const end = Math.min(start + batchSize, job.items.length)
      const batch = job.items.slice(start, end)

      await Promise.all(
        batch.map((item, idx) =>
          this.processItem(job, item, start + idx, 0)
        )
      )

      job.progress = ((end / job.items.length) * 100)
      this.options.onProgress?.(job.progress, job.id)
    }

    job.status = 'completed'
    job.endTime = new Date()
    job.totalTime = job.endTime.getTime() - job.startTime!.getTime()
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
    const maxRetries = this.options.maxRetries || 3
    const retryDelay = this.options.retryDelay || 1000
    const timeout = this.options.timeout || 30000

    try {
      // Rate limiting
      await this.rateLimiter.wait()

      // Process with timeout
      const result = await Promise.race([
        this.executeProcessor(item, retryCount),
        this.createTimeout(timeout)
      ])

      job.results[itemIndex] = result
    } catch (error) {
      if (retryCount < maxRetries) {
        // Retry
        await this.delay(retryDelay * Math.pow(2, retryCount)) // Exponential backoff
        await this.processItem(job, item, itemIndex, retryCount + 1)
      } else {
        // Failed
        const batchError: BatchError = {
          itemIndex,
          item,
          error: error instanceof Error ? error.message : String(error),
          retryCount
        }
        job.errors.push(batchError)
        this.options.onError?.(batchError, job.id)
      }
    }
  }

  /**
   * Execute processor function
   */
  private executeProcessor(item: any, retryCount: number): Promise<any> {
    if (!this.currentProcessor) {
      return Promise.resolve(item)
    }
    return this.currentProcessor(item, retryCount)
  }

  /**
   * Get job status
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Get all jobs
   */
  getAllJobs(): BatchJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Cancel job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId)
    if (job && job.status === 'processing') {
      job.status = 'failed'
      return true
    }
    return false
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): void {
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        this.jobs.delete(jobId)
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  }
}

/**
 * Rate Limiter
 */
class RateLimiter {
  private tokens: number
  private lastRefill: number

  constructor(private requestsPerSecond: number) {
    this.tokens = requestsPerSecond
    this.lastRefill = Date.now()
  }

  async wait(): Promise<void> {
    if (this.requestsPerSecond === Infinity) return

    // Refill tokens
    const now = Date.now()
    const timePassed = (now - this.lastRefill) / 1000
    this.tokens = Math.min(
      this.requestsPerSecond,
      this.tokens + timePassed * this.requestsPerSecond
    )
    this.lastRefill = now

    // Wait if no tokens available
    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.requestsPerSecond * 1000
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.tokens = 0
    } else {
      this.tokens--
    }
  }
}

// Singleton instance
export const batchProcessor = new BatchProcessor()
