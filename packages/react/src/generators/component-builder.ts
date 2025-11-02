/**
 * Component Builder Utility
 * Generates React component code from specifications
 */

import { BaseCodeBuilder, CodeFormatter, type GeneratorOutput, type CodeGenerationOptions } from '@weaveai/shared';
import type { ComponentSpec, ComponentProp } from './types.js';

/**
 * ComponentBuilder - Generates React component code from specifications
 */
export class ComponentBuilder extends BaseCodeBuilder<ComponentSpec> {
  private formatter: CodeFormatter;

  constructor(formatter?: CodeFormatter) {
    super();
    this.formatter = formatter || new CodeFormatter();
  }

  /**
   * Build a complete generated component from specification
   */
  public build(
    spec: ComponentSpec,
    description: string,
    options?: CodeGenerationOptions
  ): GeneratorOutput<ComponentSpec> {
    const includeTests = options?.includeTests ?? true;
    const includeExamples = options?.includeExamples ?? true;
    const includeTypes = options?.includeTypes ?? true;

    const code = this.generateComponentCode(spec);
    const tests = includeTests ? this.generateTestFile(spec) : undefined;
    const examples = includeExamples ? this.generateExampleUsage(spec) : undefined;
    const types = includeTypes ? this.generatePropsInterface(spec) : undefined;
    const metadata = this.createMetadata(spec, description, 'weave-react-component-generator');

    return {
      code,
      tests,
      examples,
      types,
      metadata,
      spec,
    };
  }

  /**
   * Generate React component code
   */
  private generateComponentCode(spec: ComponentSpec): string {
    const propsType = this.toPascalCase(spec.name) + 'Props';
    const styling = this.generateStyling(spec);

    const componentCode = `/**
 * ${spec.name} Component
 * ${spec.description}
 */

import React from 'react';
import type { ReactNode } from 'react';
${this.generateImports(spec)}

/**
 * Props for ${spec.name} component
 */
export interface ${propsType} {
${spec.props.map((prop) => `  /** ${prop.description} */\n  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`).join('\n')}
}

/**
 * ${spec.name} - ${spec.description}
 */
export function ${spec.name}({
${spec.props.map((prop) => `  ${prop.name}${prop.defaultValue !== undefined ? ` = ${JSON.stringify(prop.defaultValue)}` : ''}`).join(',\n')}
}: ${propsType}): React.ReactElement {
  return (
    <div className="${this.generateClassName(spec)}">
      {/* Component implementation */}
      {/* Features: ${spec.features.join(', ')} */}
      <div role="region" aria-label="${spec.name}">
        {/* Main content */}
      </div>
    </div>
  );
}

${styling}
`;

    return componentCode;
  }

  /**
   * Generate TypeScript props interface
   */
  private generatePropsInterface(spec: ComponentSpec): string {
    const propsType = this.toPascalCase(spec.name) + 'Props';

    return `/**
 * Props interface for ${spec.name}
 */
export interface ${propsType} {
${spec.props.map((prop) => `  /** ${prop.description} */\n  ${prop.name}${prop.required ? '' : '?'}: ${prop.type};`).join('\n')}
}
`;
  }

  /**
   * Generate example usage
   */
  private generateExampleUsage(spec: ComponentSpec): string {
    const exampleProps = spec.props
      .slice(0, 3) // Show first 3 props as example
      .map((prop) => {
        if (prop.type === 'string') {
          return `  ${prop.name}="${prop.defaultValue || 'example'}"`;
        }
        if (prop.type === 'number') {
          return `  ${prop.name}={${prop.defaultValue || '0'}}`;
        }
        if (prop.type === 'boolean') {
          return `  ${prop.name}={true}`;
        }
        if (prop.type.includes('ReactNode') || prop.type.includes('children')) {
          return `  ${prop.name}={<div>Content</div>}`;
        }
        return `  ${prop.name}={...}`;
      })
      .join('\n');

    return `/**
 * Example usage of ${spec.name}
 */

import { ${spec.name} } from './components/${spec.name}';

export function ${spec.name}Example() {
  return (
    <${spec.name}
${exampleProps}
    />
  );
}
`;
  }

  /**
   * Generate test file
   */
  private generateTestFile(spec: ComponentSpec): string {
    const firstProp = spec.props[0];
    const propTests = spec.props
      .slice(0, 2)
      .map((prop) => {
        const defaultVal = prop.defaultValue || 'test';
        return `
  it('should handle ${prop.name} prop', () => {
    // Add specific assertions for ${prop.name}
    expect(true).toBe(true);
  });`;
      })
      .join('');

    return `/**
 * Tests for ${spec.name} component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ${spec.name} } from './${spec.name}';

describe('${spec.name}', () => {
  it('should render without crashing', () => {
    ${firstProp ? `render(<${spec.name} ${firstProp.name}="${firstProp.defaultValue || 'test'}" />);` : `render(<${spec.name} />`}
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('should have correct aria-label', () => {
    ${firstProp ? `render(<${spec.name} ${firstProp.name}="${firstProp.defaultValue || 'test'}" />);` : `render(<${spec.name} />`}
    expect(screen.getByLabelText('${spec.name}')).toBeInTheDocument();
  });
${propTests}
});
`;
  }

  /**
   * Generate styling based on styling type
   */
  private generateStyling(spec: ComponentSpec): string {
    switch (spec.styling) {
      case 'tailwind':
        return '// Uses Tailwind CSS classes in className attributes';

      case 'styled-components':
        return `import styled from 'styled-components';

const StyledWrapper = styled.div\`
  /* Add your styled-components styles here */
\`;`;

      case 'css-modules':
        return `import styles from './${spec.name}.module.css';
// Use styles.className in components`;

      default:
        return `const styles = {
  wrapper: {
    // Add inline styles here
  }
};`;
    }
  }

  /**
   * Generate component imports
   */
  private generateImports(spec: ComponentSpec): string {
    const imports: string[] = [];

    if (spec.styling === 'styled-components') {
      imports.push("import styled from 'styled-components';");
    }

    if (spec.features.includes('with icons')) {
      imports.push("import { Icon } from 'react-icons';");
    }

    if (spec.features.includes('with animations')) {
      imports.push("import { motion } from 'framer-motion';");
    }

    if (spec.features.includes('with forms')) {
      imports.push("import { useForm } from 'react-hook-form';");
    }

    return imports.length > 0 ? '\n' + imports.join('\n') : '';
  }

  /**
   * Generate appropriate className
   */
  private generateClassName(spec: ComponentSpec): string {
    const baseName = this.toKebabCase(spec.name);
    if (spec.styling === 'tailwind') {
      return `${baseName} p-4 rounded-lg`;
    }
    return baseName;
  }
}
