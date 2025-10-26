/**
 * Component Generator Types
 * Defines interfaces for component generation
 */

import type { BaseSpec } from '@weaveai/shared';

/**
 * Component specification from natural language description
 */
export interface ComponentSpec extends BaseSpec {
  framework: 'react';
  props: ComponentProp[];
  styling: 'tailwind' | 'styled-components' | 'css-modules' | 'inline';
  complexity: 'simple' | 'medium' | 'complex';
}

/**
 * Component property definition
 */
export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: unknown;
}

/**
 * Generated component code
 */
export interface GeneratedComponent {
  componentCode: string;
  componentName: string;
  componentSpec: ComponentSpec;
  propsInterface: string;
  exampleUsage: string;
  testFile: string;
  metadata: ComponentMetadata;
}

/**
 * Component metadata
 */
export interface ComponentMetadata {
  generatedAt: Date;
  generatedBy: 'weave-component-generator';
  version: string;
  description: string;
  keywords: string[];
}

/**
 * Component generator options
 */
export interface ComponentGeneratorOptions {
  includeTests?: boolean;
  includeExamples?: boolean;
  includeDocumentation?: boolean;
  styling?: 'tailwind' | 'styled-components' | 'css-modules' | 'inline';
  complexity?: 'simple' | 'medium' | 'complex';
}

/**
 * Hook options for component generation
 */
export interface UseComponentGeneratorOptions {
  onSuccess?: (component: GeneratedComponent) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
}
