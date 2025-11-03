/**
 * Generator Specification Parsers
 * Parses natural language descriptions into generator specifications
 */

import type { HookSpec, HookParameter } from './hook-builder';
import type { TypeSpec, TypeProperty } from './type-builder';
import type { UtilSpec, UtilParameter } from './util-builder';
import type { QuerySpec, QueryOption } from './query-builder';

/**
 * Parser for hook specifications
 */
export class HookSpecParser {
  public static parse(description: string, hookName: string): HookSpec {
    return {
      name: this.normalizeHookName(hookName),
      description: description.substring(0, 200),
      parameters: this.extractParameters(description),
      returnType: this.detectReturnType(description),
      dependencies: this.extractDependencies(description),
      features: this.extractFeatures(description),
    };
  }

  private static extractParameters(description: string): HookParameter[] {
    const params: HookParameter[] = [];
    const lowerDesc = description.toLowerCase();

    // Common hook parameters
    const paramPatterns: Record<string, string> = {
      'dependency|dependencies|watch|effect': 'dependencies: unknown[]',
      'timeout|delay': 'timeout: number',
      'enabled|disabled': 'enabled: boolean',
      retry: 'retryCount: number',
      callback: 'callback: () => void',
      options: 'options: Record<string, unknown>',
    };

    for (const [keyword, param] of Object.entries(paramPatterns)) {
      if (new RegExp(keyword, 'i').test(lowerDesc)) {
        const [name, type] = param.split(':').map((s) => s.trim());
        params.push({
          name,
          type,
          description: keyword,
          optional: true,
        });
      }
    }

    return params.length > 0
      ? params
      : [
          {
            name: 'options',
            type: 'Record<string, unknown>',
            description: 'Hook options',
            optional: true,
          },
        ];
  }

  private static detectReturnType(description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('boolean')) {
      return 'boolean';
    }
    if (lowerDesc.includes('string')) {
      return 'string';
    }
    if (lowerDesc.includes('number')) {
      return 'number';
    }
    if (lowerDesc.includes('array')) {
      return 'unknown[]';
    }
    if (lowerDesc.includes('object') || lowerDesc.includes('state')) {
      return 'Record<string, unknown>';
    }

    return 'unknown';
  }

  private static extractDependencies(description: string): string[] {
    const deps: string[] = [];
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('react')) {
      deps.push('react');
    }
    if (lowerDesc.includes('router')) {
      deps.push('react-router-dom');
    }
    if (lowerDesc.includes('form') || lowerDesc.includes('input')) {
      deps.push('react-hook-form');
    }
    if (lowerDesc.includes('query') || lowerDesc.includes('fetch')) {
      deps.push('@tanstack/react-query');
    }
    if (lowerDesc.includes('state') && lowerDesc.includes('manage')) {
      deps.push('zustand');
    }

    return deps;
  }

  private static extractFeatures(description: string): string[] {
    const features: string[] = [];
    const lowerDesc = description.toLowerCase();

    const keywords: Record<string, string> = {
      'error|error handling': 'error handling',
      'loading|pending': 'loading states',
      'cache|caching': 'caching',
      'storage|persist': 'persistence',
      validation: 'validation',
      'real-time|stream': 'real-time updates',
      'debounce|throttle': 'debouncing/throttling',
    };

    for (const [keyword, feature] of Object.entries(keywords)) {
      if (new RegExp(keyword, 'i').test(lowerDesc)) {
        features.push(feature);
      }
    }

    return features;
  }

  private static normalizeHookName(name: string): string {
    if (!name.startsWith('use')) {
      return 'use' + name.charAt(0).toUpperCase() + name.slice(1);
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

/**
 * Parser for type specifications
 */
export class TypeSpecParser {
  public static parse(description: string, typeName: string): TypeSpec {
    return {
      name: this.normalizeName(typeName),
      description: description.substring(0, 200),
      kind: this.detectKind(description),
      properties: this.extractProperties(description),
      features: this.extractFeatures(description),
      extendsFrom: this.detectExtends(description),
    };
  }

  private static detectKind(description: string): 'interface' | 'type' | 'enum' | 'class' {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('enum')) {
      return 'enum';
    }
    if (lowerDesc.includes('class')) {
      return 'class';
    }
    if (lowerDesc.includes('type alias') || lowerDesc.includes('union')) {
      return 'type';
    }
    return 'interface';
  }

  private static extractProperties(description: string): TypeProperty[] {
    const props: TypeProperty[] = [];
    const lowerDesc = description.toLowerCase();

    // Common properties
    const propPatterns: Record<string, [string, string, boolean]> = {
      'id|identifier': ['id', 'string | number', false],
      'name|title': ['name', 'string', false],
      'email|mail': ['email', 'string', false],
      'date|created|updated': ['createdAt', 'Date', true],
      'status|state': ['status', 'string', true],
      'active|enabled': ['active', 'boolean', true],
      'count|amount': ['count', 'number', true],
      'description|detail': ['description', 'string', true],
    };

    for (const [keyword, [name, type, optional]] of Object.entries(propPatterns)) {
      if (new RegExp(keyword, 'i').test(lowerDesc)) {
        if (!props.some((p) => p.name === name)) {
          props.push({
            name,
            type,
            description: keyword,
            optional,
          });
        }
      }
    }

    return props.length > 0
      ? props
      : [
          {
            name: 'id',
            type: 'string | number',
            description: 'Unique identifier',
            optional: false,
          },
        ];
  }

  private static extractFeatures(description: string): string[] {
    const lowerDesc = description.toLowerCase();
    const features: string[] = [];

    if (lowerDesc.includes('readonly')) {
      features.push('immutable');
    }
    if (lowerDesc.includes('generic')) {
      features.push('generic');
    }
    if (lowerDesc.includes('discriminate') || lowerDesc.includes('union')) {
      features.push('discriminated union');
    }

    return features;
  }

  private static detectExtends(description: string): string | undefined {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('extends')) {
      const match = lowerDesc.match(/extends\s+(\w+)/);
      return match?.[1];
    }

    return undefined;
  }

  private static normalizeName(name: string): string {
    return name
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

/**
 * Parser for utility specifications
 */
export class UtilSpecParser {
  public static parse(description: string, utilName: string): UtilSpec {
    return {
      name: this.normalizeName(utilName),
      description: description.substring(0, 200),
      parameters: this.extractParameters(description),
      returnType: this.detectReturnType(description),
      category: this.detectCategory(description),
      examples: this.generateExamples(utilName, description),
    };
  }

  private static extractParameters(description: string): UtilParameter[] {
    const params: UtilParameter[] = [];
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('string')) {
      params.push({
        name: 'input',
        type: 'string',
        description: 'Input string',
        optional: false,
      });
    }

    if (lowerDesc.includes('number')) {
      params.push({
        name: 'value',
        type: 'number',
        description: 'Numeric value',
        optional: false,
      });
    }

    if (lowerDesc.includes('date') || lowerDesc.includes('time')) {
      params.push({
        name: 'date',
        type: 'Date | string',
        description: 'Date value',
        optional: false,
      });
    }

    return params.length > 0
      ? params
      : [
          {
            name: 'input',
            type: 'unknown',
            description: 'Input value',
            optional: false,
          },
        ];
  }

  private static detectReturnType(description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('string')) {
      return 'string';
    }
    if (lowerDesc.includes('number')) {
      return 'number';
    }
    if (lowerDesc.includes('boolean')) {
      return 'boolean';
    }
    if (lowerDesc.includes('array') || lowerDesc.includes('list')) {
      return 'unknown[]';
    }
    if (lowerDesc.includes('date')) {
      return 'Date';
    }

    return 'unknown';
  }

  private static detectCategory(description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('date') || lowerDesc.includes('time')) {
      return 'date';
    }
    if (lowerDesc.includes('string')) {
      return 'string';
    }
    if (lowerDesc.includes('number') || lowerDesc.includes('math')) {
      return 'number';
    }
    if (lowerDesc.includes('array') || lowerDesc.includes('list')) {
      return 'array';
    }
    if (lowerDesc.includes('object') || lowerDesc.includes('key')) {
      return 'object';
    }

    return 'general';
  }

  private static generateExamples(name: string, _description: string): string[] {
    return [
      `${name}('example')`,
      `${name}({ key: 'value' })`,
      `const result = await ${name}(input)`,
    ];
  }

  private static normalizeName(name: string): string {
    return (
      name.charAt(0).toLowerCase() +
      name.slice(1).replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    );
  }
}

/**
 * Parser for query specifications
 */
export class QuerySpecParser {
  public static parse(description: string, queryName: string): QuerySpec {
    return {
      name: this.normalizeHookName(queryName),
      description: description.substring(0, 200),
      method: this.detectMethod(description),
      endpoint: this.extractEndpoint(description),
      requestType: this.generateRequestType(queryName),
      responseType: this.generateResponseType(queryName),
      features: this.extractFeatures(description),
      options: this.extractOptions(description),
    };
  }

  private static detectMethod(description: string): 'GET' | 'POST' | 'PUT' | 'DELETE' {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('delete')) {
      return 'DELETE';
    }
    if (lowerDesc.includes('update') || lowerDesc.includes('put')) {
      return 'PUT';
    }
    if (
      lowerDesc.includes('create') ||
      lowerDesc.includes('post') ||
      lowerDesc.includes('submit')
    ) {
      return 'POST';
    }
    return 'GET';
  }

  private static extractEndpoint(description: string): string {
    const match = description.match(/\/[\w/-]+/);
    return match ? match[0] : '/api/resource';
  }

  private static generateRequestType(queryName: string): string {
    return `${this.toPascalCase(queryName)}Request`;
  }

  private static generateResponseType(queryName: string): string {
    return `${this.toPascalCase(queryName)}Response`;
  }

  private static extractFeatures(description: string): string[] {
    const features: string[] = [];
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('pagination')) {
      features.push('pagination');
    }
    if (lowerDesc.includes('cache')) {
      features.push('caching');
    }
    if (lowerDesc.includes('retry')) {
      features.push('retry');
    }
    if (lowerDesc.includes('error')) {
      features.push('error handling');
    }
    if (lowerDesc.includes('loading')) {
      features.push('loading states');
    }

    return features;
  }

  private static extractOptions(description: string): QueryOption[] {
    const lowerDesc = description.toLowerCase();
    const options: QueryOption[] = [];

    if (lowerDesc.includes('stale')) {
      options.push({
        name: 'staleTime',
        type: 'number',
        description: 'Stale time in milliseconds',
      });
    }

    if (lowerDesc.includes('retry')) {
      options.push({
        name: 'retry',
        type: 'boolean | number',
        description: 'Retry failed requests',
      });
    }

    return options;
  }

  private static normalizeHookName(name: string): string {
    if (!name.startsWith('use')) {
      return 'use' + name.charAt(0).toUpperCase() + name.slice(1);
    }
    return name;
  }

  private static toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}
