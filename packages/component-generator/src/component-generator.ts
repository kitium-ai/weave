import {
  getLogger,
  validateDefined,
  validateNonEmptyString,
  validateObject,
} from '@weaveai/shared';
import type { GenerateOptions, GenerateData } from '@weaveai/core';
import {
  ComponentGenerationError,
  ComponentGenerationOptions,
  ComponentGeneratorConfig,
  ComponentPropsDefinition,
  ComponentPropSpec,
  ComponentSpecification,
  GeneratedComponent,
  GeneratedComponentMetadata,
  OutputLanguage,
  SupportedFramework,
  SupportedStyling,
} from './types.js';

interface ParsedComponentPayload {
  code?: unknown;
  types?: unknown;
  styles?: unknown;
  example?: unknown;
  imports?: unknown;
  metadata?: unknown;
}

const FRAMEWORK_GUIDANCE: Record<SupportedFramework, string> = {
  react:
    'Use a functional component with hooks. Prefer composition-friendly patterns and ensure React 18 compatibility.',
  vue: 'Return a Vue 3 single-file component (SFC) using `<script setup lang="ts">` when using TypeScript.',
  angular:
    'Provide an Angular component with decorator metadata, template, and styles. Assume standalone components.',
  'react-native':
    'Use React Native primitives (View, Text, etc.) and avoid web-only APIs. Prefer StyleSheet for styling unless otherwise specified.',
  svelte: 'Return a Svelte component using `<script lang="ts">` when TypeScript is requested.',
  vanilla:
    'Provide framework-agnostic HTML, CSS, and JavaScript. Emphasize accessibility and minimal dependencies.',
};

const STYLING_GUIDANCE: Record<SupportedStyling, string> = {
  tailwind:
    'Use Tailwind CSS utility classes. Include any necessary configuration notes under metadata.dependencies.',
  'css-modules': 'Use CSS Modules. Export class names and ensure styles are scoped.',
  'styled-components':
    'Use styled-components. Show styled component definitions alongside the main component.',
  emotion: 'Use @emotion/styled with tagged template literals for styling.',
  vanilla: 'Use plain CSS with BEM-style class names.',
  chakra: 'Use Chakra UI components and include them in imports/dependencies.',
  mantine: 'Use Mantine components and include them in imports/dependencies.',
};

const LANGUAGE_HINT: Record<OutputLanguage, string> = {
  typescript: 'Write TypeScript with explicit prop types.',
  javascript: 'Write idiomatic modern JavaScript with JSDoc typedefs for props.',
};

const JSON_INSTRUCTIONS = `Respond with a valid JSON object using the exact keys:
- "code": string containing the full component implementation.
- "types": string with interface or type definitions (can be empty string if unnecessary).
- "styles": string representing styles or configuration (can be empty string if inline styles are used).
- "example": string showing example usage with realistic values.
- "imports": array of string package names or module specifiers required to run the component.
- "metadata": object that may include "dependencies" (string array) and "notes" (string).
Do not wrap the JSON in markdown code fences. Do not include commentary outside the JSON.`;

/**
 * ComponentGenerator coordinates with a Weave language model provider to produce
 * framework-specific UI components from natural language descriptions.
 */
export class ComponentGenerator {
  private readonly logger = getLogger();
  private readonly provider = this.config.provider;

  public constructor(private readonly config: ComponentGeneratorConfig) {
    validateDefined(config.provider, 'config.provider');
    validateNonEmptyString(config.framework, 'config.framework');
    if (config.styledWith) {
      validateNonEmptyString(config.styledWith, 'config.styledWith');
    }
    if (config.systemPromptOverride) {
      validateNonEmptyString(config.systemPromptOverride, 'config.systemPromptOverride');
    }

    if (!(config.framework in FRAMEWORK_GUIDANCE)) {
      throw new ComponentGenerationError(`Unsupported framework: ${config.framework}`);
    }

    if (config.styledWith && !(config.styledWith in STYLING_GUIDANCE)) {
      throw new ComponentGenerationError(`Unsupported styling preference: ${config.styledWith}`);
    }

    if (config.language && !(config.language in LANGUAGE_HINT)) {
      throw new ComponentGenerationError(`Unsupported language preference: ${config.language}`);
    }
  }

  /**
   * Generate a UI component implementation based on the provided specification.
   */
  public async createComponent(
    spec: ComponentSpecification,
    options?: ComponentGenerationOptions
  ): Promise<GeneratedComponent> {
    this.validateSpec(spec);

    const prompt = this.buildPrompt(spec);
    const modelOptions: GenerateOptions = {
      ...(this.config.defaultModelOptions ?? {}),
      ...(options?.modelOptions ?? {}),
      streaming: false,
    };
    modelOptions.onChunk = undefined;

    let result: GenerateData;
    try {
      this.logger.debug('Component generation request', {
        framework: this.config.framework,
        styledWith: this.config.styledWith,
      });
      result = await this.provider.generate(prompt, modelOptions);
    } catch (error) {
      this.logger.error('Component generation failed', { error });
      throw new ComponentGenerationError('Failed to generate component', error);
    }

    const { component, warnings } = this.parseResponse(
      result.text,
      prompt,
      this.config.framework,
      this.config.styledWith,
      this.config.language ?? 'typescript',
      result.tokenCount
    );

    if (warnings.length > 0) {
      this.logger.warn('Component generation returned with warnings', { warnings });
    }

    const metadata: GeneratedComponentMetadata = {
      ...(component.metadata || {}),
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    return {
      ...component,
      metadata,
    };
  }

  private validateSpec(spec: ComponentSpecification): void {
    validateDefined(spec, 'spec');
    validateNonEmptyString(spec.description, 'spec.description');

    if (spec.props) {
      validateObject(spec.props, 'spec.props');
      for (const [name, value] of Object.entries(spec.props)) {
        this.validatePropDefinition(name, value);
      }
    }

    if (spec.requirements) {
      this.ensureStringArray(spec.requirements, 'spec.requirements');
    }
    if (spec.events) {
      this.ensureStringArray(spec.events, 'spec.events');
    }
    if (spec.dataSources) {
      this.ensureStringArray(spec.dataSources, 'spec.dataSources');
    }
  }

  private ensureStringArray(value: unknown, fieldName: string): void {
    if (!Array.isArray(value)) {
      throw new ComponentGenerationError(`${fieldName} must be an array of strings`, value);
    }
    for (const item of value) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new ComponentGenerationError(`${fieldName} must contain non-empty strings`, item);
      }
    }
  }

  private validatePropDefinition(name: string, value: string | ComponentPropSpec): void {
    if (typeof value === 'string') {
      validateNonEmptyString(value, `spec.props.${name}`);
      return;
    }

    validateObject(value, `spec.props.${name}`);
    validateNonEmptyString(value.type, `spec.props.${name}.type`);
    if (value.description) {
      validateNonEmptyString(value.description, `spec.props.${name}.description`);
    }
    if (value.defaultValue) {
      validateNonEmptyString(value.defaultValue, `spec.props.${name}.defaultValue`);
    }
  }

  private buildPrompt(spec: ComponentSpecification): string {
    const language: OutputLanguage = this.config.language ?? 'typescript';
    const frameworkGuidance = FRAMEWORK_GUIDANCE[this.config.framework];
    const stylingGuidance = this.config.styledWith
      ? STYLING_GUIDANCE[this.config.styledWith]
      : undefined;

    const sections: string[] = [];

    if (this.config.systemPromptOverride) {
      sections.push(this.config.systemPromptOverride.trim());
    } else {
      sections.push(
        [
          `You are an expert ${this.config.framework} component engineer.`,
          frameworkGuidance,
          stylingGuidance,
          LANGUAGE_HINT[language],
          'Ensure the component is accessible, responsive, and production-ready.',
        ]
          .filter(Boolean)
          .join('\n')
      );
    }

    sections.push(`Component Description:\n${spec.description.trim()}`);

    if (spec.props && Object.keys(spec.props).length > 0) {
      sections.push(`Props:\n${this.formatProps(spec.props)}`);
    }

    if (spec.requirements?.length) {
      sections.push(`Requirements:\n${spec.requirements.map((item) => `- ${item}`).join('\n')}`);
    }

    if (spec.events?.length) {
      sections.push(`Events:\n${spec.events.map((item) => `- ${item}`).join('\n')}`);
    }

    if (spec.dataSources?.length) {
      sections.push(`Data Sources:\n${spec.dataSources.map((item) => `- ${item}`).join('\n')}`);
    }

    if (spec.notes) {
      sections.push(`Additional Notes:\n${spec.notes.trim()}`);
    }

    if (spec.exampleProps) {
      sections.push(`Example Props JSON:\n${JSON.stringify(spec.exampleProps, null, 2)}`);
    }

    sections.push(JSON_INSTRUCTIONS);

    return sections.join('\n\n');
  }

  private formatProps(props: ComponentPropsDefinition): string {
    return Object.entries(props)
      .map(([name, details]) => {
        if (typeof details === 'string') {
          return `- ${name}: ${details}`;
        }

        const fragments = [`- ${name}: ${details.type}`];
        if (details.description) {
          fragments.push(`  description: ${details.description}`);
        }
        if (details.required !== undefined) {
          fragments.push(`  required: ${details.required}`);
        }
        if (details.defaultValue) {
          fragments.push(`  default: ${details.defaultValue}`);
        }
        return fragments.join('\n');
      })
      .join('\n');
  }

  private parseResponse(
    raw: string,
    prompt: string,
    framework: SupportedFramework,
    styledWith: SupportedStyling | undefined,
    language: OutputLanguage,
    tokens?: GenerateData['tokenCount']
  ): { component: GeneratedComponent; warnings: string[] } {
    const warnings: string[] = [];
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new ComponentGenerationError('Model returned an empty response');
    }

    const jsonCandidate = this.extractJson(trimmed);
    let parsed: ParsedComponentPayload;
    try {
      parsed = JSON.parse(jsonCandidate) as ParsedComponentPayload;
    } catch (error) {
      throw new ComponentGenerationError('Failed to parse component JSON', {
        raw,
        jsonCandidate,
        error,
      });
    }

    if (!parsed.code || typeof parsed.code !== 'string') {
      throw new ComponentGenerationError('Generated component is missing "code" field', parsed);
    }

    const imports = this.normalizeImports(parsed.imports, warnings);
    const metadata = this.extractMetadata(
      parsed.metadata,
      framework,
      styledWith,
      language,
      raw,
      prompt,
      warnings,
      tokens,
      imports
    );

    return {
      component: {
        code: parsed.code,
        types: this.toOptionalString(parsed.types, warnings, 'types'),
        styles: this.toOptionalString(parsed.styles, warnings, 'styles'),
        example: this.toOptionalString(parsed.example, warnings, 'example'),
        imports,
        metadata,
      },
      warnings,
    };
  }

  private extractMetadata(
    metadataValue: unknown,
    framework: SupportedFramework,
    styledWith: SupportedStyling | undefined,
    language: OutputLanguage,
    raw: string,
    prompt: string,
    warnings: string[],
    tokens: GenerateData['tokenCount'] | undefined,
    imports: string[]
  ): GeneratedComponentMetadata {
    const metadata: GeneratedComponentMetadata = {
      framework,
      styledWith,
      language,
      rawResponse: raw,
      prompt,
    };

    if (tokens) {
      metadata.tokens = {
        input: tokens.input,
        output: tokens.output,
      };
    }

    if (!metadataValue || typeof metadataValue !== 'object' || Array.isArray(metadataValue)) {
      if (metadataValue !== undefined) {
        warnings.push('metadata field was not an object; using imports for dependencies');
      }
      metadata.dependencies = this.mergeDependencies(undefined, imports);
      return metadata;
    }

    const record = metadataValue as Record<string, unknown>;
    const maybeDependencies = record.dependencies;
    if (Array.isArray(maybeDependencies)) {
      const normalized = this.normalizeImports(maybeDependencies, warnings);
      if (normalized.length > 0) {
        metadata.dependencies = normalized;
      }
    } else if (maybeDependencies !== undefined) {
      warnings.push('metadata.dependencies was not an array of strings');
    }

    const maybeNotes = record.notes;
    if (typeof maybeNotes === 'string' && maybeNotes.trim().length > 0) {
      metadata.notes = maybeNotes;
    }

    metadata.dependencies = this.mergeDependencies(metadata.dependencies, imports);

    return metadata;
  }

  private mergeDependencies(
    dependencies: string[] | undefined,
    imports: string[]
  ): string[] | undefined {
    const combined = new Set<string>();
    for (const item of dependencies ?? []) {
      combined.add(item);
    }
    for (const item of imports) {
      combined.add(item);
    }
    return combined.size > 0 ? Array.from(combined) : undefined;
  }

  private normalizeImports(importsValue: unknown, warnings: string[]): string[] {
    if (!importsValue) {
      return [];
    }

    if (!Array.isArray(importsValue)) {
      warnings.push('imports field was not an array; ignoring imports');
      return [];
    }

    const imports: string[] = [];
    for (const item of importsValue) {
      if (typeof item === 'string' && item.trim().length > 0) {
        imports.push(item.trim());
      } else {
        warnings.push('ignoring non-string import entry');
      }
    }
    return imports;
  }

  private toOptionalString(value: unknown, warnings: string[], field: string): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    warnings.push(`Expected "${field}" to be a string; ignoring field`);
    return undefined;
  }

  private extractJson(raw: string): string {
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) {
      return fenceMatch[1].trim();
    }

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new ComponentGenerationError('Unable to locate JSON object in model response', raw);
    }

    return raw.slice(start, end + 1);
  }
}
