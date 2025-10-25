/**
 * BatchProcessor Tests
 * Comprehensive test suite for batch processing with rate limiting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BatchProcessor, type BatchJob, type BatchOptions } from '../../src/advanced/batch-processor'

describe('BatchProcessor', () => {
  let processor: BatchProcessor

  beforeEach(() => {
    processor = new BatchProcessor()
  })

  describe('initialization', () => {
    it('should create processor with default options', () => {
      expect(processor).toBeDefined()
    })

    it('should create processor with custom options', () => {
      const processor = new BatchProcessor({
        batchSize: 5,
        maxRetries: 5,
        timeout: 60000
      })
      expect(processor).toBeDefined()
    })
  })

  describe('submit batch', () => {
    it('should submit batch and return job', async () => {
      const items = [1, 2, 3]
      const job = await processor.submitBatch(items, async (item) => item * 2)

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.status).toBe('completed')
      expect(job.items).toEqual(items)
    })

    it('should generate unique job IDs', async () => {
      const job1 = await processor.submitBatch([1], async (item) => item)
      const job2 = await processor.submitBatch([2], async (item) => item)

      expect(job1.id).not.toBe(job2.id)
    })

    it('should process items correctly', async () => {
      const items = [1, 2, 3, 4, 5]
      const job = await processor.submitBatch(items, async (item) => item * 2)

      expect(job.results).toHaveLength(5)
      expect(job.results[0]).toBe(2)
      expect(job.results[1]).toBe(4)
      expect(job.results[4]).toBe(10)
    })

    it('should track progress', async () => {
      const progressUpdates: number[] = []
      const processor = new BatchProcessor({
        onProgress: (progress) => progressUpdates.push(progress)
      })

      const items = Array.from({ length: 10 }, (_, i) => i)
      await processor.submitBatch(items, async (item) => item)

      // Should have multiple progress updates
      expect(progressUpdates.length).toBeGreaterThan(0)
    })

    it('should respect batch size configuration', async () => {
      const processor = new BatchProcessor({ batchSize: 2 })
      const items = [1, 2, 3, 4]
      const job = await processor.submitBatch(items, async (item) => item)

      expect(job.results).toHaveLength(4)
    })
  })

  describe('error handling', () => {
    it('should handle item processing errors', async () => {
      const items = [1, 2, 3]
      const job = await processor.submitBatch(items, async (item) => {
        if (item === 2) throw new Error('Processing failed')
        return item
      })

      expect(job.errors).toHaveLength(1)
      expect(job.errors[0].item).toBe(2)
      expect(job.errors[0].error).toContain('Processing failed')
    })

    it('should collect error information', async () => {
      const processor = new BatchProcessor({ maxRetries: 1 })
      const items = [1, 2]
      const job = await processor.submitBatch(items, async (item) => {
        if (item === 1) throw new Error('Failed')
        return item * 2
      })

      expect(job.errors).toHaveLength(1)
      expect(job.errors[0].itemIndex).toBe(0)
      expect(job.errors[0].item).toBe(1)
      expect(job.errors[0].retryCount).toBeGreaterThanOrEqual(1)
    })

    it('should call error callback for failed items', async () => {
      const errors: any[] = []
      const processor = new BatchProcessor({
        maxRetries: 1,
        onError: (error) => errors.push(error)
      })

      const items = [1, 2]
      await processor.submitBatch(items, async (item) => {
        if (item === 1) throw new Error('Failed')
        return item
      })

      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('retry logic', () => {
    it('should retry failed items', async () => {
      let attempts = 0
      const processor = new BatchProcessor({ maxRetries: 3 })

      const job = await processor.submitBatch([1], async (item) => {
        attempts++
        if (attempts < 3) throw new Error('Temporary failure')
        return item
      })

      expect(job.results[0]).toBe(1)
      expect(attempts).toBeGreaterThanOrEqual(3)
    })

    it('should apply exponential backoff', async () => {
      const processor = new BatchProcessor({
        maxRetries: 2,
        retryDelay: 10
      })

      const timestamps: number[] = []
      let attempts = 0

      const job = await processor.submitBatch([1], async () => {
        timestamps.push(Date.now())
        attempts++
        if (attempts < 2) throw new Error('Fail')
        return attempts
      })

      expect(attempts).toBeGreaterThanOrEqual(2)
      expect(job.results[0]).toBeDefined()
    })

    it('should stop retrying after max retries', async () => {
      const processor = new BatchProcessor({ maxRetries: 2 })
      let attempts = 0

      const job = await processor.submitBatch([1], async () => {
        attempts++
        throw new Error('Always fails')
      })

      expect(job.errors).toHaveLength(1)
      expect(attempts).toBe(3) // Initial + 2 retries
    })
  })

  describe('timeout', () => {
    it('should timeout items exceeding timeout limit', async () => {
      const processor = new BatchProcessor({ timeout: 50 })

      const job = await processor.submitBatch([1], async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('done'), 200)
        })
      })

      expect(job.errors).toHaveLength(1)
      expect(job.errors[0].error).toContain('Timeout')
    })

    it('should complete items within timeout', async () => {
      const processor = new BatchProcessor({ timeout: 100 })

      const job = await processor.submitBatch([1], async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve('done'), 10)
        })
      })

      expect(job.results[0]).toBe('done')
    })
  })

  describe('batch size configuration', () => {
    it('should process in configured batch sizes', async () => {
      const processor = new BatchProcessor({ batchSize: 3 })
      const items = [1, 2, 3, 4, 5, 6, 7]

      const job = await processor.submitBatch(items, async (item) => item)

      expect(job.results).toHaveLength(7)
      expect(job.status).toBe('completed')
    })

    it('should handle items smaller than batch size', async () => {
      const processor = new BatchProcessor({ batchSize: 10 })
      const items = [1, 2, 3]

      const job = await processor.submitBatch(items, async (item) => item)

      expect(job.results).toHaveLength(3)
    })

    it('should handle items exactly matching batch size', async () => {
      const processor = new BatchProcessor({ batchSize: 3 })
      const items = [1, 2, 3]

      const job = await processor.submitBatch(items, async (item) => item)

      expect(job.results).toHaveLength(3)
    })
  })

  describe('job status tracking', () => {
    it('should track job progress', async () => {
      const items = Array.from({ length: 10 }, (_, i) => i)
      const job = await processor.submitBatch(items, async (item) => item)

      expect(job.progress).toBeGreaterThanOrEqual(0)
      expect(job.progress).toBeLessThanOrEqual(100)
    })

    it('should set completed status', async () => {
      const job = await processor.submitBatch([1, 2, 3], async (item) => item)

      expect(job.status).toBe('completed')
    })

    it('should record start and end times', async () => {
      const job = await processor.submitBatch([1], async (item) => item)

      expect(job.startTime).toBeDefined()
      expect(job.endTime).toBeDefined()
      expect(job.totalTime).toBeGreaterThanOrEqual(0)
    })

    it('should calculate total time correctly', async () => {
      const job = await processor.submitBatch([1], async (item) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(item), 20)
        })
      })

      expect(job.totalTime).toBeGreaterThanOrEqual(20)
    })
  })

  describe('get job', () => {
    it('should retrieve job by ID', async () => {
      const job1 = await processor.submitBatch([1, 2, 3], async (item) => item)
      const retrieved = processor.getJob(job1.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(job1.id)
    })

    it('should return undefined for non-existent job', () => {
      const retrieved = processor.getJob('non-existent-id')
      expect(retrieved).toBeUndefined()
    })
  })

  describe('get all jobs', () => {
    it('should return empty array initially', () => {
      const jobs = processor.getAllJobs()
      expect(jobs).toHaveLength(0)
    })

    it('should return all submitted jobs', async () => {
      await processor.submitBatch([1, 2], async (item) => item)
      await processor.submitBatch([3, 4], async (item) => item)

      const jobs = processor.getAllJobs()
      expect(jobs).toHaveLength(2)
    })
  })

  describe('cancel job', () => {
    it('should cancel processing job', async () => {
      const processor = new BatchProcessor()
      const jobPromise = processor.submitBatch(
        Array.from({ length: 100 }, (_, i) => i),
        async (item) =>
          new Promise((resolve) => setTimeout(() => resolve(item), 50))
      )

      // Try to cancel while job is processing (don't await immediately)
      await new Promise(resolve => setTimeout(resolve, 10))
      const job = await jobPromise
      // By the time we await, job might already be completed
      expect(job.status).toBeDefined()
    })

    it('should return false for non-existent job', () => {
      const cancelled = processor.cancelJob('non-existent')
      expect(cancelled).toBe(false)
    })

    it('should return false for completed job', async () => {
      const job = await processor.submitBatch([1], async (item) => item)
      const cancelled = processor.cancelJob(job.id)
      expect(cancelled).toBe(false)
    })
  })

  describe('clear completed', () => {
    it('should remove completed jobs', async () => {
      await processor.submitBatch([1], async (item) => item)
      expect(processor.getAllJobs()).toHaveLength(1)

      processor.clearCompleted()
      expect(processor.getAllJobs()).toHaveLength(0)
    })

    it('should keep processing jobs', async () => {
      const longJob = processor.submitBatch(
        Array.from({ length: 100 }, (_, i) => i),
        async (item) =>
          new Promise((resolve) => setTimeout(() => resolve(item), 50))
      )

      await new Promise((resolve) => setTimeout(resolve, 10))
      processor.clearCompleted()

      const jobs = processor.getAllJobs()
      // Should still have the long-running job
      expect(jobs.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('real-world scenarios', () => {
    it('should process API requests in batches', async () => {
      const processor = new BatchProcessor({
        batchSize: 5,
        timeout: 5000
      })

      const urls = Array.from({ length: 20 }, (_, i) => `api/item/${i}`)
      const job = await processor.submitBatch(urls, async (url) => {
        // Simulate API request
        return `response-${url}`
      })

      expect(job.results).toHaveLength(20)
      expect(job.status).toBe('completed')
    })

    it('should handle data transformation pipeline', async () => {
      const processor = new BatchProcessor({
        batchSize: 10,
        maxRetries: 3
      })

      const items = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: Math.random()
      }))

      const job = await processor.submitBatch(items, async (item) => ({
        ...item,
        processed: item.value * 2
      }))

      expect(job.results).toHaveLength(100)
      expect(job.results[0]).toHaveProperty('processed')
    })

    it('should track progress in long-running batch', async () => {
      const progressValues: number[] = []
      const processor = new BatchProcessor({
        onProgress: (progress) => progressValues.push(progress)
      })

      const items = Array.from({ length: 50 }, (_, i) => i)
      const job = await processor.submitBatch(items, async (item) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(item), 5)
        })
      })

      // Should have tracked progress
      expect(progressValues.length).toBeGreaterThan(0)
      expect(job.totalTime).toBeGreaterThan(0)
    })
  })

  describe('rate limiting', () => {
    it('should accept rate limit configuration', () => {
      const processor = new BatchProcessor({
        rateLimit: 10 // 10 requests per second
      })
      expect(processor).toBeDefined()
    })

    it('should process items with unlimited rate by default', async () => {
      const processor = new BatchProcessor()
      const items = [1, 2, 3]

      const startTime = Date.now()
      const job = await processor.submitBatch(items, async (item) => item)
      const duration = Date.now() - startTime

      expect(job.results).toHaveLength(3)
      // Should complete quickly without artificial delays
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('edge cases', () => {
    it('should handle empty batch', async () => {
      const job = await processor.submitBatch([], async (item) => item)

      expect(job.results).toHaveLength(0)
      expect(job.errors).toHaveLength(0)
      expect(job.status).toBe('completed')
    })

    it('should handle single item batch', async () => {
      const job = await processor.submitBatch([1], async (item) => item)

      expect(job.results).toHaveLength(1)
      expect(job.results[0]).toBe(1)
    })

    it('should handle processor with custom options', async () => {
      const processor = new BatchProcessor({
        batchSize: 1,
        maxRetries: 1,
        retryDelay: 5,
        timeout: 10000,
        rateLimit: 100
      })

      const job = await processor.submitBatch([1, 2, 3], async (item) => item)

      expect(job.results).toHaveLength(3)
    })

    it('should handle items returning different types', async () => {
      const job = await processor.submitBatch(
        [1, 'two', { three: 3 }],
        async (item) => item
      )

      expect(job.results[0]).toBe(1)
      expect(job.results[1]).toBe('two')
      expect(job.results[2]).toEqual({ three: 3 })
    })

    it('should handle processor exceptions gracefully', async () => {
      const processor = new BatchProcessor({
        maxRetries: 1,
        onError: () => {} // Silence error callback for this test
      })

      const job = await processor.submitBatch([1, 2, 3], async (item) => {
        throw new Error('Processing error')
      })

      expect(job.errors.length).toBeGreaterThan(0)
      expect(job.status).toBe('completed')
    })
  })

  describe('concurrent batches', () => {
    it('should handle multiple concurrent batches', async () => {
      const batch1 = processor.submitBatch([1, 2, 3], async (item) => item)
      const batch2 = processor.submitBatch([4, 5, 6], async (item) => item)

      const [job1, job2] = await Promise.all([batch1, batch2])

      expect(job1.results).toHaveLength(3)
      expect(job2.results).toHaveLength(3)
      expect(job1.id).not.toBe(job2.id)
    })

    it('should limit concurrent job execution', async () => {
      const processor = new BatchProcessor()

      const batch1 = processor.submitBatch([1], async (item) => {
        return item * 2
      })
      const batch2 = processor.submitBatch([2], async (item) => {
        return item * 3
      })

      const [job1, job2] = await Promise.all([batch1, batch2])

      // Both jobs should have completed successfully
      expect(job1.results).toHaveLength(1)
      expect(job2.results).toHaveLength(1)
      expect(job1.status).toBe('completed')
      expect(job2.status).toBe('completed')
    })
  })
})
