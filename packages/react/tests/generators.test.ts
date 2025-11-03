/**
 * Tests for component generator utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentBuilder } from '../src/generators/component-builder';
import { SpecParser } from '../src/generators/spec-parser';
import type { ComponentSpec } from '../src/generators/types';

describe('SpecParser', () => {
  describe('parse', () => {
    it('should parse basic component description', () => {
      const description = 'A button component with click handling';
      const spec = SpecParser.parse(description, 'Button');

      expect(spec.name).toBe('Button');
      expect(spec.description).toBe(description);
      expect(spec.props.length).toBeGreaterThan(0);
    });

    it('should detect features from description', () => {
      const description = 'A searchable, filterable data table with pagination';
      const spec = SpecParser.parse(description, 'DataTable');

      expect(spec.features).toContain('searchable');
      expect(spec.features).toContain('paginated');
    });

    it('should detect styling preference from description', () => {
      const tailwindDesc = SpecParser.parse('Use tailwind for styling', 'Component');
      expect(tailwindDesc.styling).toBe('tailwind');

      const styledDesc = SpecParser.parse('Use styled-components', 'Component');
      expect(styledDesc.styling).toBe('styled-components');
    });

    it('should assess complexity correctly', () => {
      const simpleDesc = SpecParser.parse('A simple text display', 'Simple');
      expect(simpleDesc.complexity).toBe('simple');

      const complexDesc = SpecParser.parse(
        'A real-time, advanced multi-step nested tree component with virtualization and websocket support',
        'Complex'
      );
      expect(complexDesc.complexity).toBe('complex');
    });

    it('should normalize component names to PascalCase', () => {
      const spec1 = SpecParser.parse('A component', 'my-component');
      expect(spec1.name).toBe('MyComponent');

      const spec2 = SpecParser.parse('A component', 'my_component');
      expect(spec2.name).toBe('MyComponent');

      const spec3 = SpecParser.parse('A component', 'myComponent');
      expect(spec3.name).toBe('Mycomponent');
    });

    it('should extract common props from description', () => {
      const description = 'A form component with validation, error handling, and input changes';
      const spec = SpecParser.parse(description, 'Form');

      const propNames = spec.props.map((p) => p.name);
      expect(propNames).toContain('error');
      expect(propNames).toContain('onChange');
    });

    it('should handle descriptions with click handlers', () => {
      const description = 'A button that triggers an action on click';
      const spec = SpecParser.parse(description, 'Button');

      const clickProp = spec.props.find((p) => p.name === 'onClick');
      expect(clickProp).toBeDefined();
      expect(clickProp?.type).toBe('() => void');
    });

    it('should generate default props when none are detected', () => {
      const description = 'Some component';
      const spec = SpecParser.parse(description, 'Component');

      const propNames = spec.props.map((p) => p.name);
      expect(propNames).toContain('children');
      expect(propNames).toContain('className');
    });

    it('should handle disabled state detection', () => {
      const description = 'A disabled button component';
      const spec = SpecParser.parse(description, 'Button');

      const disabledProp = spec.props.find((p) => p.name === 'disabled');
      expect(disabledProp).toBeDefined();
      expect(disabledProp?.type).toBe('boolean');
      expect(disabledProp?.defaultValue).toBe(false);
    });

    it('should handle loading state detection', () => {
      const description = 'A component that shows loading state';
      const spec = SpecParser.parse(description, 'Component');

      const loadingProp = spec.props.find((p) => p.name === 'loading');
      expect(loadingProp).toBeDefined();
      expect(loadingProp?.type).toBe('boolean');
    });
  });
});

describe('ComponentBuilder', () => {
  let spec: ComponentSpec;

  beforeEach(() => {
    spec = {
      name: 'UserCard',
      description: 'A card displaying user information',
      props: [
        {
          name: 'userName',
          type: 'string',
          required: true,
          description: 'The user name',
        },
        {
          name: 'email',
          type: 'string',
          required: true,
          description: 'The user email',
        },
        {
          name: 'onEdit',
          type: '() => void',
          required: false,
          description: 'Callback when edit is clicked',
        },
      ],
      features: ['card layout', 'with icons'],
      styling: 'tailwind',
      complexity: 'medium',
    };
  });

  describe('buildComponent', () => {
    it('should generate complete component', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test component');

      expect(result.componentName).toBe('UserCard');
      expect(result.componentCode).toBeDefined();
      expect(result.propsInterface).toBeDefined();
      expect(result.exampleUsage).toBeDefined();
      expect(result.testFile).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should include component name in generated code', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test');

      expect(result.componentCode).toContain('export function UserCard');
      expect(result.componentCode).toContain('interface UserCardProps');
    });

    it('should include all props in generated code', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test');

      expect(result.componentCode).toContain('userName');
      expect(result.componentCode).toContain('email');
      expect(result.componentCode).toContain('onEdit');
    });

    it('should generate valid TypeScript interface', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test');

      expect(result.propsInterface).toContain('interface UserCardProps');
      expect(result.propsInterface).toContain('userName');
      expect(result.propsInterface).toContain('email');
      expect(result.propsInterface).toContain('onEdit');
    });

    it('should generate example usage', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test');

      expect(result.exampleUsage).toContain('UserCard');
      expect(result.exampleUsage).toContain('import');
      expect(result.exampleUsage).toContain('function UserCardExample');
    });

    it('should generate test file', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test');

      expect(result.testFile).toContain('describe');
      expect(result.testFile).toContain('UserCard');
      expect(result.testFile).toContain('render');
      expect(result.testFile).toContain('@testing-library/react');
    });

    it('should set correct metadata', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test description');

      expect(result.metadata.generatedBy).toBe('weave-component-generator');
      expect(result.metadata.description).toBe('Test description');
      expect(result.metadata.keywords).toEqual(spec.features);
      expect(result.metadata.generatedAt).toBeInstanceOf(Date);
    });

    it('should include accessibility features', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test');

      expect(result.componentCode).toContain('role="region"');
      expect(result.componentCode).toContain('aria-label');
    });

    it('should handle different styling types', () => {
      const styledSpec = { ...spec, styling: 'styled-components' as const };
      const result = ComponentBuilder.buildComponent(styledSpec, 'Test');

      expect(result.componentCode).toContain('styled');
    });

    it('should mark required props correctly', () => {
      const result = ComponentBuilder.buildComponent(spec, 'Test');

      expect(result.propsInterface).toContain('userName: string');
      expect(result.propsInterface).toContain('email: string');
      expect(result.propsInterface).toContain('onEdit?:');
    });
  });
});

describe('Component Generation Integration', () => {
  it('should parse description and build component successfully', () => {
    const description =
      'A user profile card with name, email, and edit button with tailwind styling';
    const spec = SpecParser.parse(description, 'ProfileCard');
    const result = ComponentBuilder.buildComponent(spec, description);

    expect(result.componentName).toBe('ProfileCard');
    expect(result.componentCode).toBeDefined();
    expect(result.componentCode.length).toBeGreaterThan(0);
    expect(result.metadata.generatedBy).toBe('weave-component-generator');
  });

  it('should handle complex component descriptions', () => {
    const description =
      'A responsive, searchable data table with pagination, sorting, dark mode support, and accessibility features';
    const spec = SpecParser.parse(description, 'DataTable');
    const result = ComponentBuilder.buildComponent(spec, description);

    expect(result.componentName).toBe('DataTable');
    expect(spec.features.length).toBeGreaterThan(3);
    expect(result.componentCode).toContain('DataTable');
  });

  it('should preserve component description in metadata', () => {
    const description = 'A button component with loading state';
    const spec = SpecParser.parse(description, 'Button');
    const result = ComponentBuilder.buildComponent(spec, description);

    expect(result.metadata.description).toContain('button');
  });
});
