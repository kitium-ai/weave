/**
 * PromptManager Tests
 * Comprehensive test suite covering all functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PromptManager } from './prompt-manager.js';
import type { PromptTemplate, ValidationResult, RenderResult } from './types.js';

describe('PromptManager', () => {
  let manager: PromptManager;

  beforeEach(() => {
    manager = new PromptManager();
  });

  describe('Registration', () => {
    it('should register a valid template', () => {
      const template: PromptTemplate = {
        name: 'test-template',
        template: 'Hello {{name}}',
        version: '1.0.0',
        variables: {
          name: { type: 'string', required: true },
        },
        category: 'custom',
        tags: ['test'],
      };

      expect(() => manager.register(template)).not.toThrow();
      const retrieved = manager.getTemplate('test-template');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('test-template');
    });

    it('should throw error for template without name', () => {
      const template = {
        template: 'Hello {{name}}',
        version: '1.0.0',
        variables: { name: { type: 'string' } },
        category: 'custom' as const,
        tags: [],
      };

      expect(() => manager.register(template as any)).toThrow(
        'Template must have name, template, and version'
      );
    });

    it('should throw error for template without template content', () => {
      const template = {
        name: 'test',
        version: '1.0.0',
        variables: { name: { type: 'string' } },
        category: 'custom' as const,
        tags: [],
      };

      expect(() => manager.register(template as any)).toThrow(
        'Template must have name, template, and version'
      );
    });

    it('should throw error for template without version', () => {
      const template = {
        name: 'test',
        template: 'Hello',
        variables: { name: { type: 'string' } },
        category: 'custom' as const,
        tags: [],
      };

      expect(() => manager.register(template as any)).toThrow(
        'Template must have name, template, and version'
      );
    });

    it('should maintain version history for templates', () => {
      const templateV1: PromptTemplate = {
        name: 'versioned',
        template: 'Version 1: {{content}}',
        version: '1.0.0',
        variables: { content: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      const templateV2: PromptTemplate = {
        name: 'versioned',
        template: 'Version 2: {{content}} - improved',
        version: '2.0.0',
        variables: { content: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      manager.register(templateV1);
      manager.register(templateV2);

      const versions = manager.getVersions('versioned');
      expect(versions).toHaveLength(2);
      expect(versions[0].version).toBe('2.0.0'); // Latest first
      expect(versions[1].version).toBe('1.0.0');
    });

    it('should initialize metrics on registration', () => {
      const template: PromptTemplate = {
        name: 'metrics-test',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      manager.register(template);
      const metrics = manager.getMetrics('metrics-test');

      expect(metrics).not.toBeNull();
      expect(metrics?.usageCount).toBe(0);
      expect(metrics?.successRate).toBe(1);
      expect(metrics?.averageLatency).toBe(0);
    });
  });

  describe('Validation', () => {
    it('should validate required fields', () => {
      const template = {
        name: '',
        template: 'Test',
        version: '1.0.0',
        variables: {},
        category: 'custom' as const,
        tags: [],
      };

      const result = manager.validate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect unused variables in template', () => {
      const template: PromptTemplate = {
        name: 'test',
        template: 'Hello {{name}}',
        version: '1.0.0',
        variables: {
          name: { type: 'string' },
          unused: { type: 'string' },
        },
        category: 'custom',
        tags: [],
      };

      // Should not throw - unused variables are allowed, but missing ones are not
      const result = manager.validate(template);
      expect(result.valid).toBe(true);
    });

    it('should detect missing variable definitions', () => {
      const template: PromptTemplate = {
        name: 'test',
        template: 'Hello {{name}} and {{surname}}',
        version: '1.0.0',
        variables: {
          name: { type: 'string' },
        },
        category: 'custom',
        tags: [],
      };

      const result = manager.validate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('surname'))).toBe(true);
    });

    it('should validate variable types', () => {
      const template: PromptTemplate = {
        name: 'test',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: {
          var: { type: 'invalid-type' as any },
        },
        category: 'custom',
        tags: [],
      };

      const result = manager.validate(template);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Invalid variable type'))).toBe(true);
    });

    it('should handle templates without variables object', () => {
      const template = {
        name: 'test',
        template: 'No variables here',
        version: '1.0.0',
        category: 'custom' as const,
        tags: [],
      };

      const result = manager.validate(template as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Variables object is required'))).toBe(
        true
      );
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      const template: PromptTemplate = {
        name: 'greeting',
        template: 'Hello {{name}}, welcome to {{place}}!',
        version: '1.0.0',
        variables: {
          name: { type: 'string', required: true },
          place: { type: 'string', required: true },
        },
        category: 'custom',
        tags: ['greeting'],
      };
      manager.register(template);
    });

    it('should render template with variables', () => {
      const result = manager.render('greeting', {
        name: 'Alice',
        place: 'Wonderland',
      });

      expect(result.success).toBe(true);
      expect(result.content).toBe('Hello Alice, welcome to Wonderland!');
    });

    it('should return error for missing template', () => {
      const result = manager.render('nonexistent', {});
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Template 'nonexistent' not found");
    });

    it('should validate required variables', () => {
      const result = manager.render('greeting', {
        name: 'Alice',
        // missing 'place'
      });

      expect(result.success).toBe(false);
      expect(result.errors?.some((e) => e.includes("'place' is missing"))).toBe(true);
    });

    it('should handle type mismatch for string variables', () => {
      const result = manager.render('greeting', {
        name: 123 as any,
        place: 'Wonderland',
      });

      expect(result.success).toBe(false);
      expect(result.errors?.some((e) => e.includes('must be a string'))).toBe(true);
    });

    it('should validate string length constraints', () => {
      const template: PromptTemplate = {
        name: 'length-test',
        template: 'Username: {{username}}',
        version: '1.0.0',
        variables: {
          username: { type: 'string', minLength: 3, maxLength: 10 },
        },
        category: 'custom',
        tags: [],
      };
      manager.register(template);

      // Too short
      let result = manager.render('length-test', { username: 'ab' });
      expect(result.success).toBe(false);

      // Too long
      result = manager.render('length-test', { username: 'thisnameistoolong' });
      expect(result.success).toBe(false);

      // Valid
      result = manager.render('length-test', { username: 'valid' });
      expect(result.success).toBe(true);
    });

    it('should validate enum constraints', () => {
      const template: PromptTemplate = {
        name: 'enum-test',
        template: 'Color: {{color}}',
        version: '1.0.0',
        variables: {
          color: { type: 'string', enum: ['red', 'green', 'blue'] },
        },
        category: 'custom',
        tags: [],
      };
      manager.register(template);

      const validResult = manager.render('enum-test', { color: 'red' });
      expect(validResult.success).toBe(true);

      const invalidResult = manager.render('enum-test', { color: 'yellow' });
      expect(invalidResult.success).toBe(false);
    });

    it('should track metrics on successful render', () => {
      manager.render('greeting', { name: 'Bob', place: 'Home' });
      manager.render('greeting', { name: 'Charlie', place: 'Work' });

      const metrics = manager.getMetrics('greeting');
      expect(metrics?.usageCount).toBe(2);
      expect(metrics?.lastUsed).toBeInstanceOf(Date);
    });

    it('should not track metrics on failed render', () => {
      manager.render('greeting', { name: 'Alice' }); // Missing required variable
      const metrics = manager.getMetrics('greeting');
      expect(metrics?.usageCount).toBe(0);
    });

    it('should support optional variables', () => {
      const template: PromptTemplate = {
        name: 'optional-test',
        template: 'Hello {{name}}{{title}}',
        version: '1.0.0',
        variables: {
          name: { type: 'string', required: true },
          title: { type: 'string', required: false },
        },
        category: 'custom',
        tags: [],
      };
      manager.register(template);

      const result = manager.render('optional-test', { name: 'Alice' });
      expect(result.success).toBe(true);
    });

    it('should handle multiple variable occurrences', () => {
      const template: PromptTemplate = {
        name: 'multi-var',
        template: '{{var}} and {{var}} and {{var}}',
        version: '1.0.0',
        variables: {
          var: { type: 'string', required: true },
        },
        category: 'custom',
        tags: [],
      };
      manager.register(template);

      const result = manager.render('multi-var', { var: 'test' });
      expect(result.success).toBe(true);
      expect(result.content).toBe('test and test and test');
    });

    it('should support specific template version', () => {
      const templateV1: PromptTemplate = {
        name: 'versioned',
        template: 'V1: {{content}}',
        version: '1.0.0',
        variables: { content: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      const templateV2: PromptTemplate = {
        name: 'versioned',
        template: 'V2: {{content}}',
        version: '2.0.0',
        variables: { content: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      manager.register(templateV1);
      manager.register(templateV2);

      const resultV1 = manager.render('versioned', { content: 'test' }, '1.0.0');
      const resultV2 = manager.render('versioned', { content: 'test' }, '2.0.0');
      const resultLatest = manager.render('versioned', { content: 'test' });

      expect(resultV1.content).toContain('V1');
      expect(resultV2.content).toContain('V2');
      expect(resultLatest.content).toContain('V2'); // Latest is v2
    });
  });

  describe('Retrieval', () => {
    beforeEach(() => {
      const template: PromptTemplate = {
        name: 'test-retrieval',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: ['test', 'retrieval'],
      };
      manager.register(template);
    });

    it('should retrieve template by name', () => {
      const template = manager.getTemplate('test-retrieval');
      expect(template).not.toBeNull();
      expect(template?.name).toBe('test-retrieval');
    });

    it('should return null for nonexistent template', () => {
      const template = manager.getTemplate('nonexistent');
      expect(template).toBeNull();
    });

    it('should retrieve specific version', () => {
      const template = manager.getTemplate('test-retrieval', '1.0.0');
      expect(template?.version).toBe('1.0.0');
    });

    it('should return null for nonexistent version', () => {
      const template = manager.getTemplate('test-retrieval', '99.0.0');
      expect(template).toBeNull();
    });

    it('should list all templates', () => {
      const templates = manager.list();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.name === 'test-retrieval')).toBe(true);
    });

    it('should filter by category', () => {
      const filtered = manager.list({ category: 'custom' });
      expect(filtered.every((t) => t.category === 'custom')).toBe(true);
    });

    it('should filter by tags', () => {
      const filtered = manager.list({ tags: ['test'] });
      expect(filtered.some((t) => t.name === 'test-retrieval')).toBe(true);
    });

    it('should filter by multiple tags (AND logic)', () => {
      const filtered = manager.list({ tags: ['test', 'retrieval'] });
      expect(filtered.some((t) => t.name === 'test-retrieval')).toBe(true);
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      const templates: PromptTemplate[] = [
        {
          name: 'email-greeting',
          template: 'Hello {{recipient}}',
          version: '1.0.0',
          variables: { recipient: { type: 'string' } },
          category: 'email',
          tags: ['email', 'greeting'],
          description: 'Professional email greeting',
        },
        {
          name: 'chat-response',
          template: 'Chat: {{message}}',
          version: '1.0.0',
          variables: { message: { type: 'string' } },
          category: 'chat',
          tags: ['chat', 'response'],
          description: 'Chat response template',
        },
      ];

      templates.forEach((t) => manager.register(t));
    });

    it('should search by name', () => {
      const results = manager.search('email');
      expect(results.some((t) => t.name === 'email-greeting')).toBe(true);
    });

    it('should search by description', () => {
      const results = manager.search('greeting');
      expect(results.some((t) => t.name === 'email-greeting')).toBe(true);
    });

    it('should search by tags', () => {
      const results = manager.search('chat');
      expect(results.some((t) => t.name === 'chat-response')).toBe(true);
    });

    it('should be case insensitive', () => {
      const resultUpper = manager.search('EMAIL');
      const resultLower = manager.search('email');
      expect(resultUpper).toEqual(resultLower);
    });

    it('should return empty array for no matches', () => {
      const results = manager.search('nonexistent-search-term-xyz');
      expect(results).toHaveLength(0);
    });
  });

  describe('Import/Export', () => {
    it('should export all templates', () => {
      const exported = manager.export();
      expect(Array.isArray(exported)).toBe(true);
      expect(exported.length).toBeGreaterThan(0);
    });

    it('should export specific templates', () => {
      const template: PromptTemplate = {
        name: 'export-test',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };
      manager.register(template);

      const exported = manager.export(['export-test']);
      expect(exported).toHaveLength(1);
      expect(exported[0].name).toBe('export-test');
    });

    it('should skip nonexistent templates in export', () => {
      const exported = manager.export(['nonexistent']);
      expect(exported).toHaveLength(0);
    });

    it('should import templates', () => {
      const templates: PromptTemplate[] = [
        {
          name: 'imported-1',
          template: 'Test 1: {{var}}',
          version: '1.0.0',
          variables: { var: { type: 'string' } },
          category: 'custom',
          tags: [],
        },
        {
          name: 'imported-2',
          template: 'Test 2: {{var}}',
          version: '1.0.0',
          variables: { var: { type: 'string' } },
          category: 'custom',
          tags: [],
        },
      ];

      manager.import(templates);

      expect(manager.getTemplate('imported-1')).not.toBeNull();
      expect(manager.getTemplate('imported-2')).not.toBeNull();
    });

    it('should handle import of invalid templates gracefully', () => {
      const templates = [
        {
          name: '',
          template: 'Test',
          version: '1.0.0',
          variables: {},
          category: 'custom' as const,
          tags: [],
        },
      ];

      expect(() => manager.import(templates as any)).toThrow();
    });
  });

  describe('Deletion', () => {
    it('should delete template version', () => {
      const template: PromptTemplate = {
        name: 'delete-test',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };
      manager.register(template);

      const deleted = manager.deleteVersion('delete-test', '1.0.0');
      expect(deleted).toBe(true);
      expect(manager.getTemplate('delete-test')).toBeNull();
    });

    it('should return false for nonexistent template', () => {
      const deleted = manager.deleteVersion('nonexistent', '1.0.0');
      expect(deleted).toBe(false);
    });

    it('should return false for nonexistent version', () => {
      const template: PromptTemplate = {
        name: 'version-test',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };
      manager.register(template);

      const deleted = manager.deleteVersion('version-test', '99.0.0');
      expect(deleted).toBe(false);
    });

    it('should delete metrics when deleting template', () => {
      const template: PromptTemplate = {
        name: 'metrics-delete',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };
      manager.register(template);
      manager.render('metrics-delete', { var: 'test' });

      let metrics = manager.getMetrics('metrics-delete');
      expect(metrics).not.toBeNull();

      manager.deleteVersion('metrics-delete', '1.0.0');
      metrics = manager.getMetrics('metrics-delete');
      expect(metrics).toBeNull();
    });

    it('should preserve other versions when deleting one version', () => {
      const v1: PromptTemplate = {
        name: 'multi-version',
        template: 'V1: {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };
      const v2: PromptTemplate = {
        name: 'multi-version',
        template: 'V2: {{var}}',
        version: '2.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      manager.register(v1);
      manager.register(v2);

      manager.deleteVersion('multi-version', '1.0.0');

      const versions = manager.getVersions('multi-version');
      expect(versions).toHaveLength(1);
      expect(versions[0].version).toBe('2.0.0');
    });
  });

  describe('A/B Testing', () => {
    it('should start A/B test', () => {
      const variantA: PromptTemplate = {
        name: 'ab-test',
        template: 'Variant A: {{content}}',
        version: '1.0.0',
        variables: { content: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      const variantB: PromptTemplate = {
        name: 'ab-test',
        template: 'Variant B: {{content}} - improved',
        version: '1.1.0',
        variables: { content: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      const abTest = manager.startABTest('ab-test', variantA, variantB);

      expect(abTest.templateName).toBe('ab-test');
      expect(abTest.variants.A).not.toBeUndefined();
      expect(abTest.variants.B).not.toBeUndefined();
      expect(abTest.startDate).toBeInstanceOf(Date);
    });

    it('should initialize A/B test with zero usage', () => {
      const template: PromptTemplate = {
        name: 'test',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      const abTest = manager.startABTest('test', template, template);

      expect(abTest.variants.A.usageCount).toBe(0);
      expect(abTest.variants.B.usageCount).toBe(0);
      expect(abTest.variants.A.successRate).toBe(1);
      expect(abTest.variants.B.successRate).toBe(1);
    });
  });

  describe('Built-in Templates', () => {
    it('should load built-in templates on initialization', () => {
      const manager2 = new PromptManager();
      const templates = manager2.list();
      expect(templates.length).toBeGreaterThan(40); // Should have 50+ templates
    });

    it('should have templates from all categories', () => {
      const categories = [
        'email',
        'content',
        'classification',
        'extraction',
        'sentiment',
        'translation',
        'chat',
        'custom',
      ];
      const templates = manager.list();

      for (const category of categories) {
        const hasCategory = templates.some((t) => t.category === category);
        expect(hasCategory).toBe(true);
      }
    });

    it('should be able to render built-in email template', () => {
      const result = manager.render('email-professional-greeting', {
        recipient: 'John',
        subject: 'Meeting Request',
        tone: 'professional',
      });

      expect(result.success).toBe(true);
      expect(result.content).toContain('John');
    });

    it('should be able to render built-in content template', () => {
      const result = manager.render('content-blog-post', {
        topic: 'AI in 2024',
        audience: 'tech professionals',
        keyPoints: ['intro', 'main point', 'conclusion'],
        tone: 'informative',
        length: 500,
      });

      expect(result.success).toBe(true);
    });

    it('should be able to render built-in classification template', () => {
      const result = manager.render('classify-sentiment', {
        text: 'I love this product! It is amazing!',
      });

      expect(result.success).toBe(true);
      expect(result.content).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle template with no variables', () => {
      const template: PromptTemplate = {
        name: 'no-vars',
        template: 'This is a static template',
        version: '1.0.0',
        variables: {},
        category: 'custom',
        tags: [],
      };

      manager.register(template);
      const result = manager.render('no-vars', {});

      expect(result.success).toBe(true);
      expect(result.content).toBe('This is a static template');
    });

    it('should handle template with special characters', () => {
      const template: PromptTemplate = {
        name: 'special-chars',
        template: 'Price: ${{price}}, Email: {{email}} - Contact us!',
        version: '1.0.0',
        variables: {
          price: { type: 'string' },
          email: { type: 'string' },
        },
        category: 'custom',
        tags: [],
      };

      manager.register(template);
      const result = manager.render('special-chars', {
        price: '99.99',
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.content).toContain('$99.99');
    });

    it('should handle very long template content', () => {
      const longContent = 'A'.repeat(10000) + '{{var}}' + 'B'.repeat(10000);
      const template: PromptTemplate = {
        name: 'long-template',
        template: longContent,
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      manager.register(template);
      const result = manager.render('long-template', { var: 'X' });

      expect(result.success).toBe(true);
      expect(result.content.length).toBe(20001);
    });

    it('should handle empty string variables', () => {
      const template: PromptTemplate = {
        name: 'empty-var',
        template: 'Name: {{name}}',
        version: '1.0.0',
        variables: {
          name: { type: 'string', required: false },
        },
        category: 'custom',
        tags: [],
      };

      manager.register(template);
      const result = manager.render('empty-var', { name: '' });

      expect(result.success).toBe(true);
      expect(result.content).toBe('Name: ');
    });

    it('should handle numeric conversion', () => {
      const template: PromptTemplate = {
        name: 'numeric',
        template: 'Age: {{age}}',
        version: '1.0.0',
        variables: {
          age: { type: 'string' },
        },
        category: 'custom',
        tags: [],
      };

      manager.register(template);
      const result = manager.render('numeric', { age: 25 });

      expect(result.success).toBe(true);
      expect(result.content).toBe('Age: 25');
    });
  });

  describe('Metrics', () => {
    it('should track usage count', () => {
      const template: PromptTemplate = {
        name: 'metrics-tracking',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      manager.register(template);

      for (let i = 0; i < 5; i++) {
        manager.render('metrics-tracking', { var: 'test' });
      }

      const metrics = manager.getMetrics('metrics-tracking');
      expect(metrics?.usageCount).toBe(5);
    });

    it('should update last used timestamp', () => {
      const template: PromptTemplate = {
        name: 'last-used',
        template: 'Test {{var}}',
        version: '1.0.0',
        variables: { var: { type: 'string' } },
        category: 'custom',
        tags: [],
      };

      manager.register(template);
      const before = new Date();
      manager.render('last-used', { var: 'test' });
      const after = new Date();

      const metrics = manager.getMetrics('last-used');
      expect(metrics?.lastUsed.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(metrics?.lastUsed.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return null metrics for nonexistent template', () => {
      const metrics = manager.getMetrics('nonexistent');
      expect(metrics).toBeNull();
    });
  });
});
