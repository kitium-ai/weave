/**
 * Prompt Management Service
 * Handles prompt versioning, A/B testing, and metrics tracking
 */

import { logInfo, logError } from '@weaveai/shared';
import type {
  Prompt,
  PromptVariant,
  PromptMetrics,
  PromptTestResult
} from '../types/index.js';

/**
 * Prompt Management Service
 */
export class PromptManagementService {
  private prompts: Map<string, Prompt> = new Map();
  private variants: Map<string, PromptVariant[]> = new Map();
  private metrics: Map<string, PromptMetrics> = new Map();

  /**
   * Create a new prompt template
   */
  createPrompt(
    name: string,
    template: string,
    options: {
      description?: string;
      category?: string;
      tags?: string[];
      author?: string;
    } = {}
  ): Prompt {
    const id = `prompt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const prompt: Prompt = {
      id,
      name,
      template,
      version: 1,
      created: new Date(),
      updated: new Date(),
      description: options.description,
      category: options.category,
      tags: options.tags || [],
      author: options.author,
      status: 'draft',
    };

    this.prompts.set(id, prompt);
    this.variants.set(id, []);
    this.metrics.set(id, {
      totalRuns: 0,
      successRate: 0,
      averageQuality: 0,
      avgResponseTime: 0,
    });

    logInfo('prompt.created', {
      id,
      name,
      template: template.substring(0, 100),
    });

    return prompt;
  }

  /**
   * Update a prompt template
   */
  updatePrompt(
    id: string,
    updates: Partial<Prompt>
  ): Prompt {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      throw new Error(`Prompt not found: ${id}`);
    }

    const updated: Prompt = {
      ...prompt,
      ...updates,
      version: prompt.version + 1,
      updated: new Date(),
    };

    this.prompts.set(id, updated);

    logInfo('prompt.updated', {
      id,
      version: updated.version,
      name: updated.name,
    });

    return updated;
  }

  /**
   * Create a variant of a prompt
   */
  createVariant(
    promptId: string,
    template: string,
    name?: string
  ): PromptVariant {
    const variants = this.variants.get(promptId) || [];

    const variant: PromptVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: name || `Variant ${variants.length + 1}`,
      template,
      created: new Date(),
      updated: new Date(),
      metrics: {
        totalRuns: 0,
        successRate: 0,
        averageQuality: 0,
        avgResponseTime: 0,
      }
    };

    variants.push(variant);
    this.variants.set(promptId, variants);

    logInfo('variant.created', {
      promptId,
      variantId: variant.id,
      name: variant.name,
    });

    return variant;
  }

  /**
   * Get all variants for a prompt
   */
  getVariants(promptId: string): PromptVariant[] {
    return this.variants.get(promptId) || [];
  }

  /**
   * Compare variants using metrics
   */
  compareVariants(promptId: string, variantIds: string[]) {
    const variants = this.getVariants(promptId);
    const comparison = variantIds.map(vid => {
      const variant = variants.find(v => v.id === vid);
      return {
        id: vid,
        name: variant?.name,
        metrics: variant?.metrics || {
          totalRuns: 0,
          successRate: 0,
          averageQuality: 0,
          avgResponseTime: 0,
        },
        winner: false,
      };
    });

    // Find best variant by success rate
    let best = comparison[0];
    comparison.forEach(c => {
      if ((c.metrics.successRate || 0) > (best.metrics.successRate || 0)) {
        best = c;
      }
    });
    best.winner = true;

    logInfo('variants.compared', {
      promptId,
      variantCount: comparison.length,
      winnerVariant: best.id,
    });

    return comparison;
  }

  /**
   * Test a prompt variant
   */
  async testPrompt(
    promptId: string,
    template: string,
    variables: Record<string, unknown>
  ): Promise<PromptTestResult> {
    const startTime = Date.now();

    try {
      // Render template with variables
      const rendered = this.renderTemplate(template, variables);

      const duration = Date.now() - startTime;

      const result: PromptTestResult = {
        success: true,
        renderedPrompt: rendered,
        variables,
        duration,
      };

      // Update metrics
      await this.recordTestResult(promptId, result);

      logInfo('prompt.tested', {
        promptId,
        success: true,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));

      logError('prompt.test.failed', err);

      return {
        success: false,
        renderedPrompt: '',
        variables,
        duration,
        error: err.message,
      };
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(
    template: string,
    variables: Record<string, unknown>
  ): string {
    let rendered = template;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(
        new RegExp(placeholder, 'g'),
        String(value)
      );
    });

    return rendered;
  }

  /**
   * Record test result for metrics
   */
  private async recordTestResult(
    promptId: string,
    result: PromptTestResult
  ): Promise<void> {
    const metrics = this.metrics.get(promptId);
    if (!metrics) return;

    const updated: PromptMetrics = {
      totalRuns: metrics.totalRuns + 1,
      successRate: result.success ? 100 : 0,
      averageQuality: metrics.averageQuality || 0,
      avgResponseTime: (
        (metrics.avgResponseTime || 0) * metrics.totalRuns +
        result.duration
      ) / (metrics.totalRuns + 1),
      lastUsed: new Date(),
    };

    this.metrics.set(promptId, updated);
  }

  /**
   * Get metrics for a prompt
   */
  getMetrics(promptId: string): PromptMetrics | null {
    return this.metrics.get(promptId) || null;
  }

  /**
   * Publish a prompt (make it production-ready)
   */
  publishPrompt(promptId: string): Prompt {
    const prompt = this.prompts.get(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    return this.updatePrompt(promptId, { status: 'published' });
  }

  /**
   * Archive a prompt
   */
  archivePrompt(promptId: string): Prompt {
    const prompt = this.prompts.get(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    return this.updatePrompt(promptId, { status: 'archived' });
  }

  /**
   * Get all prompts
   */
  getAllPrompts(): Prompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Get prompt by ID
   */
  getPrompt(id: string): Prompt | null {
    return this.prompts.get(id) || null;
  }

  /**
   * Export prompt with metadata
   */
  exportPrompt(promptId: string): string {
    const prompt = this.prompts.get(promptId);
    if (!prompt) {
      throw new Error(`Prompt not found: ${promptId}`);
    }

    const variants = this.variants.get(promptId) || [];
    const metrics = this.metrics.get(promptId);

    const exported = {
      prompt,
      variants,
      metrics,
      exportedAt: new Date(),
    };

    logInfo('prompt.exported', {
      promptId,
      variantCount: variants.length,
    });

    return JSON.stringify(exported, null, 2);
  }

  /**
   * Import prompt from JSON
   */
  importPrompt(json: string): Prompt {
    try {
      const data = JSON.parse(json);
      const { prompt, variants: variantsList, metrics } = data;

      this.prompts.set(prompt.id, prompt);
      this.variants.set(prompt.id, variantsList || []);
      this.metrics.set(prompt.id, metrics || {});

      logInfo('prompt.imported', {
        id: prompt.id,
        name: prompt.name,
      });

      return prompt;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logError('prompt.import.failed', err);
      throw err;
    }
  }
}

// Export singleton instance
export const promptService = new PromptManagementService();
