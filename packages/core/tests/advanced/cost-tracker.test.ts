/**
 * CostTracker Tests
 * Comprehensive test suite for LLM API cost tracking
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CostTracker, type OperationCost, type CostSummary } from '../../src/advanced/cost-tracker'

describe('CostTracker', () => {
  let tracker: CostTracker

  beforeEach(() => {
    tracker = new CostTracker()
  })

  describe('initialization', () => {
    it('should initialize with default pricing', () => {
      const tracker = new CostTracker()
      expect(tracker).toBeDefined()
    })

    it('should have pricing for OpenAI', () => {
      const tracker = new CostTracker()
      const operations = tracker.getOperationsByProvider('openai')
      expect(operations).toBeDefined()
    })
  })

  describe('track operation', () => {
    it('should track OpenAI operation', () => {
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'gpt-4',
        1000,
        500
      )
      expect(operation).toBeDefined()
      expect(operation.operationId).toBe('op-1')
      expect(operation.provider).toBe('openai')
      expect(operation.model).toBe('gpt-4')
    })

    it('should calculate correct cost for OpenAI GPT-4', () => {
      // GPT-4: input=$0.03, output=$0.06 per 1k tokens
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'gpt-4',
        1000, // 1k input tokens
        1000  // 1k output tokens
      )
      // Expected: (1000/1000)*0.03 + (1000/1000)*0.06 = 0.03 + 0.06 = 0.09
      expect(operation.inputCost).toBe(0.03)
      expect(operation.outputCost).toBe(0.06)
      expect(operation.totalCost).toBe(0.09)
    })

    it('should calculate correct cost for OpenAI GPT-3.5', () => {
      // GPT-3.5: input=$0.0005, output=$0.0015 per 1k tokens
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'gpt-3.5-turbo',
        1000,
        1000
      )
      expect(operation.inputCost).toBe(0.0005)
      expect(operation.outputCost).toBe(0.0015)
      expect(operation.totalCost).toBeCloseTo(0.002, 4)
    })

    it('should track Anthropic Claude operations', () => {
      const operation = tracker.trackOperation(
        'op-2',
        'anthropic',
        'claude-3-sonnet',
        2000,
        1000
      )
      expect(operation.provider).toBe('anthropic')
      expect(operation.model).toBe('claude-3-sonnet')
      // Claude 3 Sonnet: input=$0.003, output=$0.015
      expect(operation.inputCost).toBe(0.006) // (2000/1000)*0.003
      expect(operation.outputCost).toBe(0.015) // (1000/1000)*0.015
    })

    it('should track Google Gemini operations', () => {
      const operation = tracker.trackOperation(
        'op-3',
        'google',
        'gemini-pro',
        1000,
        500
      )
      expect(operation.provider).toBe('google')
      expect(operation.model).toBe('gemini-pro')
    })

    it('should handle zero tokens', () => {
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'gpt-4',
        0,
        0
      )
      expect(operation.inputCost).toBe(0)
      expect(operation.outputCost).toBe(0)
      expect(operation.totalCost).toBe(0)
    })

    it('should include timestamp with operation', () => {
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'gpt-4',
        1000,
        500
      )
      expect(operation.timestamp).toBeDefined()
      expect(operation.timestamp instanceof Date).toBe(true)
    })

    it('should track multiple operations', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 500)
      tracker.trackOperation('op-2', 'openai', 'gpt-4', 1000, 500)
      const operations = tracker.getOperationsByProvider('openai')
      expect(operations).toHaveLength(2)
    })
  })

  describe('cost calculation precision', () => {
    it('should handle fractional token counts', () => {
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'gpt-4',
        1234,
        5678
      )
      // Input: (1234/1000)*0.03 = 0.03702
      // Output: (5678/1000)*0.06 = 0.34068
      expect(operation.inputCost).toBeCloseTo(0.03702, 5)
      expect(operation.outputCost).toBeCloseTo(0.34068, 5)
    })

    it('should round to 6 decimal places', () => {
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'gpt-4',
        1,
        1
      )
      // Very small costs
      expect(operation.inputCost).toBeLessThanOrEqual(0.00003)
      expect(operation.outputCost).toBeCloseTo(0.00006, 5)
    })

    it('should handle large token counts', () => {
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'gpt-4',
        1000000,
        500000
      )
      // Input: (1000000/1000)*0.03 = 30
      // Output: (500000/1000)*0.06 = 30
      expect(operation.inputCost).toBe(30)
      expect(operation.outputCost).toBe(30)
      expect(operation.totalCost).toBe(60)
    })
  })

  describe('get summary', () => {
    it('should return empty summary initially', () => {
      const summary = tracker.getSummary()
      expect(summary.totalOperations).toBe(0)
      expect(summary.totalCost).toBe(0)
      expect(summary.totalInputTokens).toBe(0)
      expect(summary.totalOutputTokens).toBe(0)
    })

    it('should calculate total cost correctly', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 1000)
      tracker.trackOperation('op-2', 'openai', 'gpt-4', 1000, 1000)

      const summary = tracker.getSummary()
      expect(summary.totalOperations).toBe(2)
      expect(summary.totalCost).toBe(0.18) // 0.09 * 2
    })

    it('should sum input and output tokens', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 500)
      tracker.trackOperation('op-2', 'openai', 'gpt-4', 2000, 1500)

      const summary = tracker.getSummary()
      expect(summary.totalInputTokens).toBe(3000)
      expect(summary.totalOutputTokens).toBe(2000)
    })

    it('should calculate average cost per operation', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 1000)
      tracker.trackOperation('op-2', 'openai', 'gpt-4', 1000, 1000)

      const summary = tracker.getSummary()
      // Total: 0.18, Operations: 2, Average: 0.09
      expect(summary.avgCostPerOperation).toBe(0.09)
    })

    it('should break down cost by provider', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 1000)
      tracker.trackOperation('op-2', 'anthropic', 'claude-3-sonnet', 1000, 1000)

      const summary = tracker.getSummary()
      expect(summary.costByProvider['openai']).toBeDefined()
      expect(summary.costByProvider['anthropic']).toBeDefined()
      expect(summary.costByProvider['openai']).not.toEqual(
        summary.costByProvider['anthropic']
      )
    })

    it('should break down cost by model', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 1000)
      tracker.trackOperation('op-2', 'openai', 'gpt-3.5-turbo', 1000, 1000)

      const summary = tracker.getSummary()
      expect(summary.costByModel['gpt-4']).toBeDefined()
      expect(summary.costByModel['gpt-3.5-turbo']).toBeDefined()
      expect(summary.costByModel['gpt-4']).toBeGreaterThan(
        summary.costByModel['gpt-3.5-turbo']
      )
    })
  })

  describe('filter operations', () => {
    beforeEach(() => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 500)
      tracker.trackOperation('op-2', 'anthropic', 'claude-3-sonnet', 1000, 500)
      tracker.trackOperation('op-3', 'openai', 'gpt-3.5-turbo', 1000, 500)
    })

    it('should filter operations by provider', () => {
      const operations = tracker.getOperationsByProvider('openai')
      expect(operations).toHaveLength(2)
      expect(operations.every(op => op.provider === 'openai')).toBe(true)
    })

    it('should filter operations by model', () => {
      const operations = tracker.getOperationsByModel('gpt-4')
      expect(operations).toHaveLength(1)
      expect(operations[0].model).toBe('gpt-4')
    })

    it('should filter operations by date range', () => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const operations = tracker.getOperationsByDateRange(yesterday, tomorrow)
      expect(operations.length).toBeGreaterThan(0)
    })

    it('should return empty for non-matching provider filter', () => {
      const operations = tracker.getOperationsByProvider('nonexistent')
      expect(operations).toHaveLength(0)
    })

    it('should return empty for non-matching model filter', () => {
      const operations = tracker.getOperationsByModel('nonexistent-model')
      expect(operations).toHaveLength(0)
    })

    it('should return all operations with get all operations', () => {
      const all = tracker.getAllOperations()
      expect(all).toHaveLength(3)
    })
  })

  describe('custom pricing', () => {
    it('should allow setting custom pricing', () => {
      tracker.setPricing('custom', {
        'custom-model': { input: 0.001, output: 0.002 }
      })

      const operation = tracker.trackOperation(
        'op-1',
        'custom',
        'custom-model',
        1000,
        1000
      )

      expect(operation.inputCost).toBe(0.001)
      expect(operation.outputCost).toBe(0.002)
    })

    it('should override existing provider pricing', () => {
      tracker.setPricing('openai', {
        'custom-gpt-4': { input: 0.1, output: 0.2 }
      })

      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'custom-gpt-4',
        1000,
        1000
      )

      expect(operation.inputCost).toBe(0.1)
      expect(operation.outputCost).toBe(0.2)
    })
  })

  describe('clear operations', () => {
    it('should clear all tracked operations', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 500)
      tracker.trackOperation('op-2', 'openai', 'gpt-4', 1000, 500)

      expect(tracker.getAllOperations()).toHaveLength(2)

      tracker.clear()

      expect(tracker.getAllOperations()).toHaveLength(0)
      expect(tracker.getSummary().totalOperations).toBe(0)
    })

    it('should reset summary after clear', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 500)

      let summary = tracker.getSummary()
      expect(summary.totalCost).toBeGreaterThan(0)

      tracker.clear()

      summary = tracker.getSummary()
      expect(summary.totalCost).toBe(0)
      expect(summary.totalOperations).toBe(0)
    })
  })

  describe('real-world scenarios', () => {
    it('should track typical conversation costs', () => {
      // Conversation with multiple turns
      tracker.trackOperation('turn-1', 'openai', 'gpt-4', 150, 200)
      tracker.trackOperation('turn-2', 'openai', 'gpt-4', 300, 250)
      tracker.trackOperation('turn-3', 'openai', 'gpt-4', 250, 150)

      const summary = tracker.getSummary()
      expect(summary.totalOperations).toBe(3)
      expect(summary.totalInputTokens).toBe(700)
      expect(summary.totalOutputTokens).toBe(600)
      expect(summary.totalCost).toBeGreaterThan(0)
    })

    it('should track multi-provider usage', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 1000)
      tracker.trackOperation('op-2', 'anthropic', 'claude-3-opus', 1000, 1000)
      tracker.trackOperation('op-3', 'google', 'gemini-pro', 1000, 1000)

      const summary = tracker.getSummary()
      expect(Object.keys(summary.costByProvider)).toHaveLength(3)
      expect(summary.totalCost).toBeGreaterThan(0)
    })

    it('should show cost difference between models', () => {
      tracker.trackOperation('op-1', 'openai', 'gpt-4', 1000, 1000)
      tracker.trackOperation('op-2', 'openai', 'gpt-3.5-turbo', 1000, 1000)

      const summary = tracker.getSummary()
      // GPT-4 should be significantly more expensive than GPT-3.5
      expect(summary.costByModel['gpt-4']).toBeGreaterThan(
        summary.costByModel['gpt-3.5-turbo']
      )
    })

    it('should aggregate costs for billing', () => {
      // Simulate a month of operations
      for (let i = 0; i < 30; i++) {
        tracker.trackOperation(`op-${i}`, 'openai', 'gpt-4', 1000, 500)
      }

      const summary = tracker.getSummary()
      expect(summary.totalOperations).toBe(30)
      // Each operation costs (1000/1000)*0.03 + (500/1000)*0.06 = 0.03 + 0.03 = 0.06
      expect(summary.totalCost).toBeCloseTo(1.8, 1)
    })
  })

  describe('edge cases', () => {
    it('should handle unknown provider gracefully', () => {
      const operation = tracker.trackOperation(
        'op-1',
        'unknown-provider',
        'unknown-model',
        1000,
        500
      )
      expect(operation.totalCost).toBe(0)
    })

    it('should handle unknown model gracefully', () => {
      const operation = tracker.trackOperation(
        'op-1',
        'openai',
        'unknown-model',
        1000,
        500
      )
      expect(operation.totalCost).toBe(0)
    })

    it('should preserve operation history independently', () => {
      const tracker1 = new CostTracker()
      const tracker2 = new CostTracker()

      tracker1.trackOperation('op-1', 'openai', 'gpt-4', 1000, 500)
      tracker2.trackOperation('op-2', 'openai', 'gpt-3.5-turbo', 1000, 500)

      expect(tracker1.getAllOperations()).toHaveLength(1)
      expect(tracker2.getAllOperations()).toHaveLength(1)
      expect(tracker1.getSummary().totalCost).toBeGreaterThan(
        tracker2.getSummary().totalCost
      )
    })
  })
})
