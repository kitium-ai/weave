/**
 * Specification Parser
 * Parses natural language descriptions into component specifications
 */

import { BaseSpecParser } from '@weaveai/shared';
import type { ComponentSpec, ComponentProp } from './types.js';

/**
 * SpecParser - Converts natural language descriptions to component specifications
 */
export class SpecParser extends BaseSpecParser {
  /**
   * Parse a natural language description into a component specification
   */
  public parse(description: string, componentName: string): ComponentSpec {
    const normalizedDescription = description.trim();
    const features = this.extractFeatures(normalizedDescription);
    const props = this.extractProps(normalizedDescription);
    const complexity = this.assessComplexity(normalizedDescription, features);
    const styling = this.detectStylingPreference(normalizedDescription);

    return {
      name: this.normalizeName(componentName),
      description: normalizedDescription.substring(0, 200), // Limit to 200 chars
      framework: 'react',
      language: 'typescript',
      props: props.length > 0 ? props : this.generateDefaultProps(componentName),
      features,
      styling,
      complexity,
    };
  }

  /**
   * Extract props from description
   */
  private extractProps(description: string): ComponentProp[] {
    const props: ComponentProp[] = [];
    const propPatterns = [
      /(?:takes?|accepts?|receives?|with)\s+(?:a\s+)?(\w+)\s+(?:\(\s*([^)]+)\s*\))?/gi,
      /prop[s]?:?\s*(\w+)\s+(?:of\s+type\s+)?(\w+)?/gi,
    ];

    const lowerDesc = description.toLowerCase();

    // Common prop patterns based on keywords
    if (lowerDesc.includes('title') || lowerDesc.includes('heading')) {
      props.push({
        name: 'title',
        type: 'string',
        required: true,
        description: 'Title or heading text',
      });
    }

    if (lowerDesc.includes('children') || lowerDesc.includes('content')) {
      props.push({
        name: 'children',
        type: 'ReactNode',
        required: false,
        description: 'Child content to display',
      });
    }

    if (lowerDesc.includes('on') && lowerDesc.includes('click')) {
      props.push({
        name: 'onClick',
        type: '() => void',
        required: false,
        description: 'Callback fired on click',
      });
    }

    if (lowerDesc.includes('change') || lowerDesc.includes('input')) {
      props.push({
        name: 'onChange',
        type: '(value: string) => void',
        required: false,
        description: 'Callback fired on change',
      });
    }

    if (lowerDesc.includes('disabled') || lowerDesc.includes('disable')) {
      props.push({
        name: 'disabled',
        type: 'boolean',
        required: false,
        description: 'Whether the component is disabled',
        defaultValue: false,
      });
    }

    if (lowerDesc.includes('loading')) {
      props.push({
        name: 'loading',
        type: 'boolean',
        required: false,
        description: 'Whether the component is in loading state',
        defaultValue: false,
      });
    }

    if (lowerDesc.includes('error')) {
      props.push({
        name: 'error',
        type: 'string | null',
        required: false,
        description: 'Error message to display',
        defaultValue: null,
      });
    }

    if (lowerDesc.includes('className') || lowerDesc.includes('class')) {
      props.push({
        name: 'className',
        type: 'string',
        required: false,
        description: 'Additional CSS class names',
      });
    }

    // Parse explicit prop definitions
    for (const pattern of propPatterns) {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        const propName = match[1]?.toLowerCase();
        if (propName && !props.some((p) => p.name === propName)) {
          props.push({
            name: propName,
            type: match[2]?.toLowerCase() === 'function' ? '() => void' : match[2] || 'string',
            required: true,
            description: `The ${propName} property`,
          });
        }
      }
    }

    return props;
  }

  /**
   * Detect styling preference from description
   */
  private detectStylingPreference(
    description: string
  ): 'tailwind' | 'styled-components' | 'css-modules' | 'inline' {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('tailwind')) {
      return 'tailwind';
    }
    if (lowerDesc.includes('styled-components') || lowerDesc.includes('styled')) {
      return 'styled-components';
    }
    if (lowerDesc.includes('css modules') || lowerDesc.includes('css-modules')) {
      return 'css-modules';
    }
    if (lowerDesc.includes('inline styles') || lowerDesc.includes('inline')) {
      return 'inline';
    }

    // Default to tailwind (most common)
    return 'tailwind';
  }

  /**
   * Generate default props based on component type
   */
  private generateDefaultProps(_componentName: string): ComponentProp[] {
    return [
      {
        name: 'children',
        type: 'ReactNode',
        required: false,
        description: 'Child content',
      },
      {
        name: 'className',
        type: 'string',
        required: false,
        description: 'Additional CSS classes',
      },
    ];
  }
}
