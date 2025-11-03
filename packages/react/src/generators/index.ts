/**
 * Generator Module
 * Exports all code generation utilities
 */

// Component Generator
export { ComponentBuilder } from './component-builder.js';
export { SpecParser } from './spec-parser.js';
export type {
  ComponentSpec,
  ComponentProp,
  GeneratedComponent,
  ComponentMetadata,
  ComponentGeneratorOptions,
  UseComponentGeneratorOptions,
} from './types.js';

// Hook Generator
export { HookBuilder } from './hook-builder.js';
export type { HookSpec, HookParameter, GeneratedHook } from './hook-builder.js';

// Type Generator
export { TypeBuilder } from './type-builder.js';
export type { TypeSpec, TypeProperty, GeneratedTypes } from './type-builder.js';

// Utility Generator
export { UtilBuilder } from './util-builder.js';
export type { UtilSpec, UtilParameter, GeneratedUtils } from './util-builder.js';

// Query Generator
export { QueryBuilder } from './query-builder.js';
export type { QuerySpec, QueryOption, GeneratedQuery } from './query-builder.js';

// Parsers
export {
  HookSpecParser,
  TypeSpecParser,
  UtilSpecParser,
  QuerySpecParser,
} from './generator-parsers.js';
