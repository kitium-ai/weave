/**
 * PromptManager
 * Centralized prompt template management with versioning and validation
 */

import type {
  PromptTemplate,
  // VariableSchema,
  ValidationResult,
  ValidationError,
  RenderResult,
  TemplateMetrics,
  ABTestData,
} from './types.js';
import { BUILT_IN_TEMPLATES } from './templates.js';

export class PromptManager {
  private templates: Map<string, PromptTemplate[]> = new Map();
  private metrics: Map<string, TemplateMetrics> = new Map();
  private abTests: Map<string, ABTestData> = new Map();

  constructor() {
    // Load built-in templates
    BUILT_IN_TEMPLATES.forEach((template) => {
      this.register(template);
    });
  }

  /**
   * Register a new template
   */
  register(template: PromptTemplate): void {
    if (!template.name || !template.template || !template.version) {
      throw new Error('Template must have name, template, and version');
    }

    const validation = this.validate(template);
    if (!validation.valid) {
      throw new Error(
        `Template validation failed: ${validation.errors.map((e) => e.message).join(', ')}`
      );
    }

    if (!this.templates.has(template.name)) {
      this.templates.set(template.name, []);
    }

    const versions = this.templates.get(template.name)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    versions.push({ ...template, createdAt: new Date(), updatedAt: new Date() });
    versions.sort((a, b) => b.version.localeCompare(a.version));

    // Initialize metrics
    if (!this.metrics.has(`${template.name}:${template.version}`)) {
      this.metrics.set(`${template.name}:${template.version}`, {
        templateName: template.name,
        usageCount: 0,
        averageTokens: 0,
        successRate: 1,
        averageLatency: 0,
        lastUsed: new Date(),
      });
    }
  }

  /**
   * Validate template structure
   */
  validate(template: PromptTemplate): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate required fields
    if (!template.name) {
      errors.push({ field: 'name', message: 'Template name is required' });
    }
    if (!template.template) {
      errors.push({ field: 'template', message: 'Template content is required' });
    }
    if (!template.version) {
      errors.push({ field: 'version', message: 'Template version is required' });
    }
    if (!template.variables) {
      errors.push({ field: 'variables', message: 'Variables object is required' });
    }

    // Validate template syntax
    const variableMatches = template.template.match(/\{\{([^}]+)\}\}/g) || [];
    const definedVars = Object.keys(template.variables || {});
    const usedVars = variableMatches.map((m) => m.replace(/\{\{|\}\}/g, ''));

    for (const usedVar of usedVars) {
      if (!definedVars.includes(usedVar)) {
        errors.push({
          field: 'template',
          message: `Variable '${usedVar}' used in template but not defined`,
        });
      }
    }

    // Validate variable schemas
    for (const [name, schema] of Object.entries(template.variables || {})) {
      if (!['string', 'number', 'boolean', 'array', 'object'].includes(schema.type)) {
        errors.push({
          field: `variables.${name}`,
          message: `Invalid variable type: ${schema.type}`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Render template with variables
   */
  render(name: string, variables: Record<string, unknown>, version?: string): RenderResult {
    const template = this.getTemplate(name, version);
    if (!template) {
      return {
        success: false,
        content: '',
        variablesUsed: {},
        errors: [`Template '${name}' not found`],
      };
    }

    // Validate variables
    const varErrors: string[] = [];
    for (const [varName, schema] of Object.entries(template.variables)) {
      const value = variables[varName];

      if (schema.required && (value === undefined || value === null || value === '')) {
        varErrors.push(`Required variable '${varName}' is missing`);
      }

      if (value !== undefined && schema.type === 'string' && typeof value !== 'string') {
        varErrors.push(`Variable '${varName}' must be a string`);
      }

      if (value !== undefined && schema.minLength && (value as string).length < schema.minLength) {
        varErrors.push(`Variable '${varName}' must be at least ${schema.minLength} characters`);
      }

      if (value !== undefined && schema.maxLength && (value as string).length > schema.maxLength) {
        varErrors.push(`Variable '${varName}' must be at most ${schema.maxLength} characters`);
      }

      if (value !== undefined && schema.enum && !schema.enum.includes(value)) {
        varErrors.push(`Variable '${varName}' must be one of: ${schema.enum.join(', ')}`);
      }
    }

    if (varErrors.length > 0) {
      return {
        success: false,
        content: '',
        variablesUsed: variables,
        errors: varErrors,
      };
    }

    // Render template
    let content = template.template;
    for (const [varName, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
      content = content.replace(regex, String(value));
    }

    // Update metrics
    const metricsKey = `${name}:${template.version}`;
    const metrics = this.metrics.get(metricsKey);
    if (metrics) {
      metrics.usageCount++;
      metrics.lastUsed = new Date();
    }

    return {
      success: true,
      content,
      variablesUsed: variables,
    };
  }

  /**
   * Get template by name and optional version
   */
  getTemplate(name: string, version?: string): PromptTemplate | null {
    const versions = this.templates.get(name);
    if (!versions || versions.length === 0) {
      return null;
    }

    if (version) {
      return versions.find((v) => v.version === version) || null;
    }

    // Return latest version
    return versions[0];
  }

  /**
   * Get all versions of a template
   */
  getVersions(name: string): PromptTemplate[] {
    return this.templates.get(name) || [];
  }

  /**
   * List all templates with optional filtering
   */
  list(filter?: { tags?: string[]; category?: string }): PromptTemplate[] {
    const allTemplates: PromptTemplate[] = [];

    for (const versions of this.templates.values()) {
      // Get latest version of each template
      allTemplates.push(versions[0]);
    }

    if (!filter) {
      return allTemplates;
    }

    return allTemplates.filter((template) => {
      if (filter.category && template.category !== filter.category) {
        return false;
      }

      if (filter.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every((tag) => template.tags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get metrics for a template
   */
  getMetrics(name: string, version?: string): TemplateMetrics | null {
    const template = this.getTemplate(name, version);
    if (!template) {
      return null;
    }

    return this.metrics.get(`${name}:${template.version}`) || null;
  }

  /**
   * Start A/B test for a template
   */
  startABTest(
    templateName: string,
    variantA: PromptTemplate,
    variantB: PromptTemplate
  ): ABTestData {
    const testKey = `${templateName}-ab-${Date.now()}`;

    const abTest: ABTestData = {
      templateName,
      variants: {
        A: {
          template: variantA,
          usageCount: 0,
          successRate: 1,
          averageLatency: 0,
        },
        B: {
          template: variantB,
          usageCount: 0,
          successRate: 1,
          averageLatency: 0,
        },
      },
      startDate: new Date(),
    };

    this.abTests.set(testKey, abTest);
    return abTest;
  }

  /**
   * Export templates to JSON
   */
  export(names?: string[]): PromptTemplate[] {
    if (!names) {
      return this.list();
    }

    return names
      .map((name) => this.getTemplate(name))
      .filter((t) => t !== null) as PromptTemplate[];
  }

  /**
   * Import templates from JSON
   */
  import(templates: PromptTemplate[]): void {
    for (const template of templates) {
      this.register(template);
    }
  }

  /**
   * Search templates by name or tags
   */
  search(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();

    return this.list().filter((template) => {
      return (
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description?.toLowerCase().includes(lowerQuery) ||
        template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }

  /**
   * Delete template version
   */
  deleteVersion(name: string, version: string): boolean {
    const versions = this.templates.get(name);
    if (!versions) {
      return false;
    }

    const index = versions.findIndex((v) => v.version === version);
    if (index === -1) {
      return false;
    }

    versions.splice(index, 1);

    if (versions.length === 0) {
      this.templates.delete(name);
    }

    this.metrics.delete(`${name}:${version}`);
    return true;
  }
}

// Singleton instance
export const promptManager = new PromptManager();
