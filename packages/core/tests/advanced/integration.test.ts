/**
 * Advanced Features Integration Tests
 * Tests for SchemaValidator, CostTracker, and BatchProcessor working together
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SchemaValidator } from '../../src/advanced/schema-validator'
import { CostTracker } from '../../src/advanced/cost-tracker'
import { BatchProcessor } from '../../src/advanced/batch-processor'

describe('Advanced Features Integration', () => {
  describe('Schema Validator + Batch Processor', () => {
    it('should validate batch results with schema', async () => {
      const processor = new BatchProcessor()
      const schema = {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true }
      }

      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' }
      ]

      const job = await processor.submitBatch(items, async (item) => {
        return {
          id: Number(item.id),
          name: item.name
        }
      })

      // Validate each result
      for (const result of job.results) {
        const validation = SchemaValidator.validate(result, schema)
        expect(validation.success).toBe(true)
      }
    })

    it('should batch process and validate transformed data', async () => {
      const processor = new BatchProcessor({ batchSize: 2 })
      const schema = {
        value: {
          type: 'string',
          required: true,
          transform: (v: unknown) => (v as string).toUpperCase()
        }
      }

      const items = ['hello', 'world', 'test']
      const job = await processor.submitBatch(items, async (item) => {
        return { value: item }
      })

      // Validate and transform
      for (const result of job.results) {
        const validation = SchemaValidator.validate(result, schema)
        expect(validation.success).toBe(true)
        expect(validation.data?.value).toBe(validation.data?.value?.toUpperCase())
      }
    })
  })

  describe('Cost Tracker + Batch Processor', () => {
    it('should track costs for batch processed items', async () => {
      const costTracker = new CostTracker()
      const processor = new BatchProcessor()

      let operationCount = 0
      const job = await processor.submitBatch([1, 2, 3], async (item) => {
        operationCount++
        costTracker.trackOperation(
          `batch-op-${item}`,
          'openai',
          'gpt-4',
          100,
          50
        )
        return item * 2
      })

      const summary = costTracker.getSummary()
      expect(summary.totalOperations).toBe(3)
      expect(summary.totalInputTokens).toBe(300) // 100 tokens * 3 items
      expect(summary.totalOutputTokens).toBe(150) // 50 tokens * 3 items
      expect(job.results).toHaveLength(3)
    })

    it('should track costs for different models in batch', async () => {
      const costTracker = new CostTracker()
      const processor = new BatchProcessor()

      const items = [
        { model: 'gpt-4', tokens: 1000 },
        { model: 'gpt-3.5-turbo', tokens: 1000 },
        { model: 'gpt-4', tokens: 500 }
      ]

      const job = await processor.submitBatch(items, async (item) => {
        costTracker.trackOperation(
          `op-${item.model}-${item.tokens}`,
          'openai',
          item.model,
          item.tokens,
          500
        )
        return item
      })

      const summary = costTracker.getSummary()
      expect(summary.totalOperations).toBe(3)
      expect(summary.costByModel['gpt-4']).toBeGreaterThan(
        summary.costByModel['gpt-3.5-turbo']
      )
      expect(job.status).toBe('completed')
    })
  })

  describe('Schema Validator + Cost Tracker', () => {
    it('should validate extracted data before tracking costs', async () => {
      const costTracker = new CostTracker()
      const schema = {
        provider: { type: 'string', required: true },
        model: { type: 'string', required: true },
        inputTokens: { type: 'number', required: true },
        outputTokens: { type: 'number', required: true }
      }

      const extraction = {
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: 1000,
        outputTokens: 500
      }

      const validation = SchemaValidator.validate(extraction, schema)
      expect(validation.success).toBe(true)

      if (validation.data) {
        costTracker.trackOperation(
          'op-1',
          validation.data.provider,
          validation.data.model,
          validation.data.inputTokens,
          validation.data.outputTokens
        )

        const summary = costTracker.getSummary()
        expect(summary.totalOperations).toBe(1)
      }
    })

    it('should reject invalid cost tracking data', async () => {
      const schema = {
        operationId: { type: 'string', required: true },
        provider: { type: 'string', required: true },
        model: { type: 'string', required: true },
        inputTokens: {
          type: 'number',
          required: true,
          validate: (v) => (v as number) >= 0 ? true : 'Tokens must be non-negative'
        },
        outputTokens: {
          type: 'number',
          required: true,
          validate: (v) => (v as number) >= 0 ? true : 'Tokens must be non-negative'
        }
      }

      const invalidData = {
        operationId: 'op-1',
        provider: 'openai',
        model: 'gpt-4',
        inputTokens: -1,
        outputTokens: 500
      }

      const result = SchemaValidator.validate(invalidData, schema)
      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.field === 'inputTokens')).toBe(true)
    })
  })

  describe('All three features together', () => {
    it('should process, validate, and track costs for extracted data', async () => {
      const costTracker = new CostTracker()
      const processor = new BatchProcessor({ batchSize: 2 })

      const extractionSchema = {
        email: {
          type: 'string',
          required: true,
          validate: (v) =>
            (v as string).includes('@') ? true : 'Invalid email'
        },
        tokens_used: { type: 'number', required: true }
      }

      // Simulated extracted data from AI
      const extractedItems = [
        { email: 'user1@example.com', tokens_used: 150 },
        { email: 'user2@example.com', tokens_used: 200 },
        { email: 'user3@example.com', tokens_used: 175 }
      ]

      const job = await processor.submitBatch(extractedItems, async (item) => {
        // Validate extraction
        const validation = SchemaValidator.validate(item, extractionSchema)
        if (!validation.success) {
          throw new Error(`Validation failed: ${validation.errors[0].message}`)
        }

        // Track cost for this extraction
        costTracker.trackOperation(
          `extraction-${item.email}`,
          'openai',
          'gpt-4',
          (item.tokens_used as number),
          (item.tokens_used as number) / 2
        )

        return validation.data
      })

      expect(job.status).toBe('completed')
      expect(job.errors).toHaveLength(0)
      expect(job.results).toHaveLength(3)

      const summary = costTracker.getSummary()
      expect(summary.totalOperations).toBe(3)
      expect(summary.totalInputTokens).toBe(525) // 150 + 200 + 175
    })

    it('should handle errors gracefully across all features', async () => {
      const costTracker = new CostTracker()
      const processor = new BatchProcessor({ maxRetries: 1 })

      const schema = {
        id: { type: 'number', required: true }
      }

      const items = [
        { id: 1 },
        { id: 'invalid' }, // This will fail validation
        { id: 3 }
      ]

      const job = await processor.submitBatch(items, async (item) => {
        const validation = SchemaValidator.validate(item, schema)
        if (!validation.success) {
          throw new Error('Validation failed')
        }

        // Only track valid operations
        costTracker.trackOperation(
          `op-${item.id}`,
          'openai',
          'gpt-4',
          100,
          50
        )

        return validation.data
      })

      // Should complete with some errors
      expect(job.status).toBe('completed')
      expect(job.errors.length).toBeGreaterThan(0)

      // Cost should only be tracked for successful items
      const summary = costTracker.getSummary()
      expect(summary.totalOperations).toBeLessThan(3)
    })

    it('should validate API responses in batch with cost tracking', async () => {
      const costTracker = new CostTracker()
      const processor = new BatchProcessor()

      const responseSchema = {
        id: { type: 'string', required: true },
        data: {
          content: { type: 'string', required: true },
          tokens: { type: 'number', required: true }
        }
      }

      // Simulated API responses
      const responses = [
        {
          id: '1',
          data: {
            content: 'Generated content 1',
            tokens: 150
          }
        },
        {
          id: '2',
          data: {
            content: 'Generated content 2',
            tokens: 200
          }
        },
        {
          id: '3',
          data: {
            content: 'Generated content 3',
            tokens: 175
          }
        }
      ]

      const job = await processor.submitBatch(responses, async (response) => {
        // Validate response
        const validation = SchemaValidator.validate(response, responseSchema)
        if (!validation.success) {
          throw new Error('Invalid response format')
        }

        const data = validation.data as any
        // Track cost
        costTracker.trackOperation(
          `response-${data.id}`,
          'openai',
          'gpt-4',
          data.data.tokens,
          data.data.tokens / 2
        )

        return data
      })

      expect(job.status).toBe('completed')
      expect(job.results).toHaveLength(3)

      const summary = costTracker.getSummary()
      expect(summary.totalOperations).toBe(3)
      expect(summary.totalInputTokens).toBe(525)
    })
  })

  describe('Real-world workflow', () => {
    it('should handle end-to-end AI extraction with validation and cost tracking', async () => {
      const costTracker = new CostTracker()
      const processor = new BatchProcessor({ batchSize: 5 })

      const userSchema = {
        id: { type: 'number', required: true },
        name: { type: 'string', required: true },
        email: {
          type: 'string',
          required: true,
          validate: (v) =>
            (v as string).includes('@') ? true : 'Invalid email format'
        },
        age: {
          type: 'number',
          required: false,
          validate: (v) =>
            v === null || v === undefined || (v as number) >= 0 ? true : 'Age must be non-negative'
        }
      }

      // Simulated extracted user data from documents
      const extractedUsers = [
        { id: '1', name: 'Alice', email: 'alice@company.com', age: '28' },
        { id: '2', name: 'Bob', email: 'bob@company.com', age: '35' },
        { id: '3', name: 'Charlie', email: 'charlie@company.com', age: '42' },
        { id: '4', name: 'Diana', email: 'diana@company.com', age: '31' },
        { id: '5', name: 'Eve', email: 'eve@company.com', age: '26' }
      ]

      const job = await processor.submitBatch(extractedUsers, async (user) => {
        // Transform data types
        const transformed = {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          age: user.age ? Number(user.age) : null
        }

        // Validate
        const validation = SchemaValidator.validate(transformed, userSchema)
        if (!validation.success) {
          throw new Error(
            `Validation failed: ${validation.errors.map(e => e.message).join(', ')}`
          )
        }

        // Track cost for extraction
        costTracker.trackOperation(
          `user-extraction-${user.id}`,
          'anthropic',
          'claude-3-sonnet',
          500, // Input tokens (document scanning)
          100  // Output tokens (extracted data)
        )

        return validation.data
      })

      // Verify results
      expect(job.status).toBe('completed')
      expect(job.results).toHaveLength(5)
      expect(job.errors).toHaveLength(0)

      // Verify costs
      const summary = costTracker.getSummary()
      expect(summary.totalOperations).toBe(5)
      expect(summary.totalInputTokens).toBe(2500) // 500 * 5
      expect(summary.totalOutputTokens).toBe(500) // 100 * 5
      expect(summary.costByProvider['anthropic']).toBeGreaterThan(0)

      // Verify data quality
      for (const result of job.results) {
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('name')
        expect(result).toHaveProperty('email')
        expect((result as any).email).toContain('@')
      }
    })
  })
})
