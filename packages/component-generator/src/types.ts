import type { GenerateOptions, ILanguageModel } from '@weaveai/core';

export type SupportedFramework =
  | 'react'
  | 'vue'
  | 'angular'
  | 'react-native'
  | 'svelte'
  | 'vanilla';

export type SupportedStyling =
  | 'tailwind'
  | 'css-modules'
  | 'styled-components'
  | 'emotion'
  | 'vanilla'
  | 'chakra'
  | 'mantine';

export type OutputLanguage = 'typescript' | 'javascript';

export interface ComponentPropSpec {
  type: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

export type ComponentPropsDefinition = Record<string, string | ComponentPropSpec>;

export interface ComponentSpecification {
  description: string;
  props?: ComponentPropsDefinition;
  requirements?: string[];
  events?: string[];
  dataSources?: string[];
  notes?: string;
  exampleProps?: Record<string, unknown>;
}

export interface ComponentGenerationOptions {
  modelOptions?: GenerateOptions;
}

export interface ComponentGeneratorConfig {
  provider: ILanguageModel;
  framework: SupportedFramework;
  styledWith?: SupportedStyling;
  language?: OutputLanguage;
  defaultModelOptions?: GenerateOptions;
  systemPromptOverride?: string;
}

export interface GeneratedComponentMetadata {
  framework: SupportedFramework;
  styledWith?: SupportedStyling;
  language: OutputLanguage;
  dependencies?: string[];
  rawResponse?: string;
  prompt?: string;
  warnings?: string[];
  tokens?: {
    input: number;
    output: number;
  };
  notes?: string;
}

export interface GeneratedComponent {
  code: string;
  types?: string;
  styles?: string;
  example?: string;
  imports: string[];
  metadata: GeneratedComponentMetadata;
}

export class ComponentGenerationError extends Error {
  public readonly causeDetail?: unknown;

  public constructor(message: string, causeDetail?: unknown) {
    super(message);
    this.name = 'ComponentGenerationError';
    this.causeDetail = causeDetail;
  }
}
