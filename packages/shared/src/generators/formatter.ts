/**
 * Code formatter for consistent formatting across frameworks
 */

import type { FormattingOptions } from './types.js';

/**
 * Code formatter utility
 */
export class CodeFormatter {
  private options: Required<FormattingOptions>;

  constructor(options?: FormattingOptions) {
    this.options = {
      indentation: options?.indentation || 'spaces',
      indentSize: options?.indentSize || 2,
      lineLength: options?.lineLength || 100,
      trailingComma: options?.trailingComma || 'es5',
      semiColons: options?.semiColons !== false,
    };
  }

  /**
   * Get indent string
   */
  private getIndent(level: number = 1): string {
    const char = this.options.indentation === 'tabs' ? '\t' : ' ';
    const size = this.options.indentation === 'tabs' ? 1 : this.options.indentSize;
    return char.repeat(level * size);
  }

  /**
   * Format TypeScript interface
   */
  formatInterface(
    name: string,
    properties: Array<{ name: string; type: string; description?: string; optional?: boolean }>
  ): string {
    const lines = [`export interface ${name} {`];

    for (let i = 0; i < properties.length; i++) {
      const prop = properties[i];
      const isLast = i === properties.length - 1;

      if (prop.description) {
        lines.push(`${this.getIndent(1)}/** ${prop.description} */`);
      }

      const optional = prop.optional ? '?' : '';
      const comma = !isLast || this.options.trailingComma === 'all' ? ';' : '';
      lines.push(`${this.getIndent(1)}${prop.name}${optional}: ${prop.type}${comma}`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Format function declaration
   */
  formatFunction(
    name: string,
    params: Array<{ name: string; type: string }>,
    returnType: string,
    body: string
  ): string {
    const paramStr = params.map((p) => `${p.name}: ${p.type}`).join(', ');
    const semi = this.options.semiColons ? ';' : '';

    return `export function ${name}(${paramStr}): ${returnType} {
${body
  .split('\n')
  .map((line) => (line ? this.getIndent(1) + line : line))
  .join('\n')}
}${semi}`;
  }

  /**
   * Format class
   */
  formatClass(
    name: string,
    methods: Array<{
      name: string;
      params: Array<{ name: string; type: string }>;
      returnType: string;
      body: string;
      visibility?: 'public' | 'private' | 'protected';
    }>
  ): string {
    const lines = [`export class ${name} {`];

    for (const method of methods) {
      const visibility = method.visibility || 'public';
      const paramStr = method.params.map((p) => `${p.name}: ${p.type}`).join(', ');
      lines.push(
        `${this.getIndent(1)}${visibility} ${method.name}(${paramStr}): ${method.returnType} {`
      );

      method.body.split('\n').forEach((line) => {
        lines.push(line ? this.getIndent(2) + line : '');
      });

      lines.push(`${this.getIndent(1)}}`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Format JSDoc comment
   */
  formatJSDoc(description: string, tags?: Record<string, string>): string {
    const lines = ['/**'];
    lines.push(` * ${description}`);

    if (tags) {
      for (const [key, value] of Object.entries(tags)) {
        lines.push(` * @${key} ${value}`);
      }
    }

    lines.push(' */');
    return lines.join('\n');
  }

  /**
   * Format array for line length
   */
  formatArray(items: string[], brackets: '[' | '(' | '{' = '['): string {
    const open: string = brackets;
    const close: string = brackets === '[' ? ']' : brackets === '(' ? ')' : '}';

    const singleLine = `${open}${items.join(', ')}${close}`;

    if (singleLine.length <= this.options.lineLength) {
      return singleLine;
    }

    // Multi-line
    const lines: string[] = [open];
    for (let i = 0; i < items.length; i++) {
      const isLast = i === items.length - 1;
      const comma = !isLast || this.options.trailingComma === 'all' ? ',' : '';
      lines.push(`${this.getIndent(1)}${items[i]}${comma}`);
    }
    lines.push(close);

    return lines.join('\n');
  }

  /**
   * Format import statement
   */
  formatImport(module: string, items: string | string[], isDefault: boolean = false): string {
    if (typeof items === 'string') {
      return `import ${isDefault ? '' : '{ '}${items}${isDefault ? '' : ' }'} from '${module}'${this.options.semiColons ? ';' : ''}`;
    }

    if (items.length === 0) {
      return `import '${module}'${this.options.semiColons ? ';' : ''}`;
    }

    if (items.length <= 3) {
      return `import { ${items.join(', ')} } from '${module}'${this.options.semiColons ? ';' : ''}`;
    }

    // Multi-line imports
    const lines = ['import {'];
    for (let i = 0; i < items.length; i++) {
      const isLast = i === items.length - 1;
      const comma = !isLast || this.options.trailingComma === 'all' ? ',' : '';
      lines.push(`${this.getIndent(1)}${items[i]}${comma}`);
    }
    lines.push(`} from '${module}'${this.options.semiColons ? ';' : ''}`);

    return lines.join('\n');
  }

  /**
   * Format export statement
   */
  formatExport(items: string | string[], isDefault: boolean = false): string {
    if (typeof items === 'string') {
      return `export ${isDefault ? 'default ' : ''}${items}${this.options.semiColons ? ';' : ''}`;
    }

    if (items.length <= 3) {
      return `export { ${items.join(', ')} }${this.options.semiColons ? ';' : ''}`;
    }

    // Multi-line exports
    const lines = ['export {'];
    for (let i = 0; i < items.length; i++) {
      const isLast = i === items.length - 1;
      const comma = !isLast || this.options.trailingComma === 'all' ? ',' : '';
      lines.push(`${this.getIndent(1)}${items[i]}${comma}`);
    }
    lines.push(`}${this.options.semiColons ? ';' : ''}`);

    return lines.join('\n');
  }

  /**
   * Indent code block
   */
  indent(code: string, level: number = 1): string {
    const indent = this.getIndent(level);
    return code
      .split('\n')
      .map((line) => (line ? indent + line : line))
      .join('\n');
  }

  /**
   * Remove extra whitespace
   */
  trim(code: string): string {
    return code
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
  }
}
